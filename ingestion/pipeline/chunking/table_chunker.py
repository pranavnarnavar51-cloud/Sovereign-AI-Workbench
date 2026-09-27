"""
Industrial Table & Operating Limit Chunker
Converts Markdown and CSV tables into self-contained row-level contextual chunks.
"""
from typing import List, Dict, Any

class TableChunker:
    def chunk_markdown_table(self, table_str: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        lines = [line.strip() for line in table_str.strip().split("\n") if line.strip()]
        if len(lines) < 3:
            return []

        header = [col.strip() for col in lines[0].split("|") if col.strip()]
        chunks = []

        for row_line in lines[2:]:
            cols = [c.strip() for c in row_line.split("|") if c.strip()]
            if len(cols) != len(header):
                continue
            row_dict = dict(zip(header, cols))
            contextual_sentence = f"Operating Limit Specification for {metadata.get('equipment_id', 'Equipment')}: " + ", ".join([f"{k} is {v}" for k, v in row_dict.items()])
            chunks.append({
                "text": contextual_sentence,
                "metadata": {**metadata, "table_row": row_dict}
            })
        return chunks

table_chunker = TableChunker()
