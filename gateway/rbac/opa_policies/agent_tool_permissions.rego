package sovereign.authz

default allow = false

# Rules mapping agent types to permitted MCP tools
agent_tool_matrix := {
    "maintenance_agent": ["sql_telemetry_runner", "anomaly_detection_invoke", "work_order_draft", "local_python_sandbox"],
    "quality_agent": ["image_defect_classifier", "cad_metadata_parser", "compliance_rule_engine"],
    "safety_agent": ["compliance_rule_engine", "sql_telemetry_runner", "work_order_draft"],
    "engineering_agent": ["cad_metadata_parser", "local_python_sandbox", "compliance_rule_engine"]
}

allow {
    allowed_tools := agent_tool_matrix[input.agent_type]
    allowed_tools[_] == input.tool_name
}
