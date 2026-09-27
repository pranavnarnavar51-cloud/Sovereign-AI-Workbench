"""
Structured Output Schema Validator
Ensures agent responses comply with strict JSON and industrial safety schemas.
"""
import json
from typing import Dict, Any, Tuple

class OutputSchemaValidator:
    def validate_agent_output(self, raw_output: str, required_keys: list = None) -> Tuple[bool, Dict[str, Any], str]:
        keys = required_keys or ["summary", "evidence", "risk_level"]
        try:
            # Check if output is embedded in markdown ```json
            clean_str = raw_output.strip()
            if "```json" in clean_str:
                clean_str = clean_str.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_str:
                clean_str = clean_str.split("```")[1].split("```")[0].strip()

            parsed = json.loads(clean_str)
            missing = [k for k in keys if k not in parsed]
            if missing:
                return False, {}, f"Schema missing required fields: {missing}"
            return True, parsed, "Valid schema"
        except Exception as e:
            return False, {}, f"JSON parse error: {str(e)}"

output_validator = OutputSchemaValidator()
