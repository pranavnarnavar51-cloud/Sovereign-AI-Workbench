"""
OWASP LLM02: Sensitive Information & PII Scrubber
Redacts proprietary asset serials, authentication tokens, and employee identifiers before model reasoning.
"""
import re
from typing import Tuple, List

class PIISecretsScrubber:
    def __init__(self):
        self.rules = [
            (re.compile(r"\b(?:Bearer\s+)?[A-Za-z0-9\-_]{24,}\b"), "[REDACTED_API_TOKEN]"),
            (re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"), "[REDACTED_EMAIL]"),
            (re.compile(r"\b(?:\d{4}[- ]?){3}\d{4}\b"), "[REDACTED_CLEARANCE_ID]"),
            (re.compile(r"\b(password|secret|passwd)\s*[:=]\s*\S+", re.IGNORECASE), "[REDACTED_CREDENTIAL]")
        ]

    def scrub(self, text: str) -> Tuple[str, int]:
        scrubbed_text = text
        total_redactions = 0
        for regex, replacement in self.rules:
            matches = regex.findall(scrubbed_text)
            if matches:
                total_redactions += len(matches)
                scrubbed_text = regex.sub(replacement, scrubbed_text)
        return scrubbed_text, total_redactions

pii_scrubber = PIISecretsScrubber()
