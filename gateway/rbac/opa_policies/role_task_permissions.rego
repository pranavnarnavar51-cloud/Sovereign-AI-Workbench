package sovereign.roles

default allow_task = false

# Human role clearance rules
allow_task {
    input.role == "PLANT_DIRECTOR"
}

allow_task {
    input.role == "LEAD_RELIABILITY_ENGINEER"
    input.task_risk != "CRITICAL_FACILITY_SHUTDOWN"
}

allow_task {
    input.role == "CONTROL_ROOM_OPERATOR"
    input.task_risk == "READ_ONLY_DIAGNOSTIC"
}
