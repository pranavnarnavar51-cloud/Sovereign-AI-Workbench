"""
Local Python Sandbox MCP Server
Restricted execution environment without network or filesystem write access.
"""
import math
import sys
import io
from typing import Dict, Any

class PythonSandboxServer:
    ALLOWED_BUILTINS = {
        "abs": abs, "min": min, "max": max, "sum": sum, "len": len,
        "round": round, "pow": pow, "range": range, "enumerate": enumerate,
        "math": math, "print": print
    }

    def execute_calculation(self, code: str) -> Dict[str, Any]:
        # Block dangerous imports
        forbidden = ["os", "sys", "subprocess", "socket", "open", "shutil", "requests", "http"]
        for f in forbidden:
            if f"import {f}" in code or f"from {f}" in code or f"__import__('{f}')" in code:
                return {
                    "success": False,
                    "error": f"Security Policy Violation: Import of '{f}' is blocked in air-gap sandbox."
                }

        stdout_capture = io.StringIO()
        local_scope = {"math": math}
        global_scope = {"__builtins__": self.ALLOWED_BUILTINS}

        old_stdout = sys.stdout
        try:
            sys.stdout = stdout_capture
            exec(code, global_scope, local_scope)
            output = stdout_capture.getvalue()
            # Extract any calculated return values
            result = local_scope.get("result", local_scope.get("ans", output.strip()))
            return {
                "success": True,
                "output": output.strip(),
                "result": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Sandbox runtime error: {str(e)}"
            }
        finally:
            sys.stdout = old_stdout

sandbox_server = PythonSandboxServer()
