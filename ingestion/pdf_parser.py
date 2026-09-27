"""
Sovereign PDF & Technical Document Parsing Engine
Parses binary PDFs, Word docs, CAD drawings, telemetry CSVs, and technical logs
into clean text context for offline local Ollama models.
Supports:
1. pypdf multi-page extraction with structural page headers
2. pdfminer fallback for complex CMap/CID/PostScript fonts
3. Empty password decryption for encrypted PDFs
4. Native docx parsing via zipfile + XML
"""
import io
import base64
import logging
import zipfile
import xml.etree.ElementTree as ET
from typing import Dict, Any, Optional
import pypdf

try:
    import pdfminer.high_level
    HAS_PDFMINER = True
except ImportError:
    HAS_PDFMINER = False

logger = logging.getLogger("sovereign.ingestion.pdf")

def extract_text_from_pdf_bytes(pdf_bytes: bytes, max_chars: int = 50000) -> Dict[str, Any]:
    """
    Extracts text from raw PDF bytes using pypdf with a secondary pdfminer fallback.
    Handles multi-page documents, structural spacing, password decryption, and Unicode characters.
    """
    page_count = 0
    full_text = ""
    
    # 1. Primary Engine: pypdf
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception as de:
                logger.warning(f"Could not decrypt PDF with default key: {de}")

        page_count = len(reader.pages)
        page_texts = []

        for idx, page in enumerate(reader.pages):
            try:
                txt = page.extract_text() or ""
                txt_clean = txt.strip()
                if txt_clean:
                    page_texts.append(f"--- [Page {idx + 1} of {page_count}] ---\n{txt_clean}")
            except Exception as pe:
                logger.warning(f"pypdf page {idx + 1} extraction notice: {pe}")

        if page_texts:
            full_text = "\n\n".join(page_texts)

    except Exception as e:
        logger.warning(f"pypdf extraction error: {e}, attempting pdfminer fallback...")

    # 2. Secondary Engine: pdfminer fallback if pypdf got 0 or very few characters (< 30)
    if (not full_text or len(full_text.strip()) < 30) and HAS_PDFMINER:
        try:
            miner_text = pdfminer.high_level.extract_text(io.BytesIO(pdf_bytes))
            if miner_text and len(miner_text.strip()) > 30:
                full_text = miner_text.strip()
                if page_count == 0:
                    page_count = 1
        except Exception as me:
            logger.warning(f"pdfminer fallback error: {me}")

    # 3. Check if empty (e.g. scanned image PDF without OCR text layer)
    if not full_text.strip():
        return {
            "success": True,
            "page_count": page_count,
            "text": "(Notice: This PDF contains scanned images or non-extractable raster layers without embedded text. For best results, use a searchable text PDF or export it with OCR text.)",
            "char_count": 0,
            "word_count": 0
        }

    # Truncate if exceptionally huge to protect LLM context window
    if len(full_text) > max_chars:
        full_text = full_text[:max_chars] + f"\n\n... [Document truncated: {len(full_text) - max_chars} characters omitted for context limit]"

    return {
        "success": True,
        "page_count": page_count,
        "text": full_text,
        "char_count": len(full_text),
        "word_count": len(full_text.split())
    }

def extract_text_from_docx_bytes(docx_bytes: bytes, max_chars: int = 50000) -> Dict[str, Any]:
    """
    Extracts text from Microsoft Word (.docx) files using standard zipfile + XML.
    """
    try:
        with zipfile.ZipFile(io.BytesIO(docx_bytes)) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            # Find all text nodes in w:t tags
            paragraphs = []
            for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                if texts:
                    paragraphs.append("".join(texts))
            full_text = "\n\n".join(paragraphs).strip()
            if len(full_text) > max_chars:
                full_text = full_text[:max_chars] + "\n\n... [Word document truncated]"
            return {
                "success": True,
                "text": full_text,
                "char_count": len(full_text),
                "word_count": len(full_text.split())
            }
    except Exception as e:
        logger.error(f"Error parsing docx file: {e}")
        return {
            "success": False,
            "text": f"Error parsing Word document: {e}",
            "char_count": 0,
            "word_count": 0
        }

def parse_attachment_to_text(att: Dict[str, Any]) -> Optional[str]:
    """
    Extracts readable text from an attachment dictionary.
    Handles:
    1. PDFs with base64 data URIs or raw base64.
    2. PDFs where client erroneously passed raw binary bytes as text.
    3. Word docx files.
    4. Regular text/csv/log/cad/code attachments.
    """
    fname = att.get("filename", "").lower()
    raw_txt = att.get("text_content") or ""
    b64 = att.get("base64") or ""

    is_pdf = fname.endswith(".pdf") or "application/pdf" in b64 or raw_txt.startswith("%PDF-")
    is_docx = fname.endswith(".docx") or "application/vnd.openxmlformats" in b64

    if is_pdf:
        # Case A: Base64 data provided
        if b64:
            try:
                clean_b64 = b64.split(",", 1)[1] if "," in b64 else b64
                pdf_bytes = base64.b64decode(clean_b64)
                res = extract_text_from_pdf_bytes(pdf_bytes)
                if res["success"]:
                    return res["text"]
            except Exception as e:
                logger.error(f"Failed to decode base64 PDF {fname}: {e}")

        # Case B: Raw binary text was passed (starts with %PDF-)
        if raw_txt.startswith("%PDF-"):
            try:
                pdf_bytes = raw_txt.encode("latin1")
                res = extract_text_from_pdf_bytes(pdf_bytes)
                if res["success"]:
                    return res["text"]
            except Exception as e:
                logger.error(f"Failed to recover raw binary PDF string {fname}: {e}")

        # Case C: Clean text was already extracted beforehand
        if raw_txt and not raw_txt.startswith("%PDF-"):
            return raw_txt

        return f"(Could not extract readable text from PDF {att.get('filename')})"

    if is_docx and b64:
        try:
            clean_b64 = b64.split(",", 1)[1] if "," in b64 else b64
            docx_bytes = base64.b64decode(clean_b64)
            res = extract_text_from_docx_bytes(docx_bytes)
            if res["success"]:
                return res["text"]
        except Exception as e:
            logger.error(f"Failed to decode docx: {e}")

    # Non-PDF files: CSV, code, TXT, logs
    if raw_txt:
        return raw_txt

    return att.get("preview")
