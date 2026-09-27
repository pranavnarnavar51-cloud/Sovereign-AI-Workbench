"""
OWASP LLM01: Prompt Injection & Adversarial Jailbreak Filter
Blocks malicious prompts attempting to bypass air-gap controls, leak system keys, or force unsafe plant states.
"""
import re
from typing import Dict, Any, Tuple

class PromptInjectionFilter:
    def __init__(self):
        self.injection_patterns = [
            r"ignore\s+(all\s+)?(previous|prior|existing)?\s*(instructions|rules|guidelines|safety|policies)",
            r"disregard\s+(all\s+)?(rules|guidelines|safety|instructions)",
            r"you\s+are\s+now\s+in\s+(developer|dan|god)\s+mode",
            r"(reveal|print|show|dump|leak|exfiltrate)\s+(.*)?(system\s+prompt|master\s+key|jwt|admin\s+key|token|credential)",
            r"(override|disable|bypass|deactivate)\s+(all\s+)?(safety\s+interlocks|interlocks|safeguards|protection)",
            r"exfiltrate\s+to\s+http",
            r"<\|im_start\|>",
            r"send\s+telemetry\s+to\s+external"
        ]
        self.compiled_regex = [re.compile(p, re.IGNORECASE) for p in self.injection_patterns]

    def evaluate(self, user_prompt: str) -> Tuple[bool, float, str]:
        """
        Returns (is_safe: bool, risk_score: float, reason: str)
        """
        for pattern in self.compiled_regex:
            if pattern.search(user_prompt):
                return False, 0.99, f"Malicious pattern detected: {pattern.pattern}"

        # Heuristic checks for delimiter exploitation
        if user_prompt.count("```") > 4 or "{{" in user_prompt:
            return False, 0.85, "Suspicious formatting or template injection attempt"

        return True, 0.05, "Prompt verified safe under OWASP LLM01"

prompt_filter = PromptInjectionFilter()
