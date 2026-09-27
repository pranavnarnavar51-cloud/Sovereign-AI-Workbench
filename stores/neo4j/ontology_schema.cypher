// Sovereign Industrial Ontology Schema
// Plant Hierarchy: Enterprise -> Facility -> Unit -> System -> Equipment -> Component -> Sensor

CREATE CONSTRAINT unique_equipment_tag IF NOT EXISTS
FOR (e:Equipment) REQUIRE e.tag IS UNIQUE;

CREATE CONSTRAINT unique_sensor_tag IF NOT EXISTS
FOR (s:Sensor) REQUIRE s.tag IS UNIQUE;

CREATE CONSTRAINT unique_failure_mode IF NOT EXISTS
FOR (f:FailureMode) REQUIRE f.code IS UNIQUE;

// Indexes for high-speed local traversal
CREATE INDEX equipment_type_idx IF NOT EXISTS FOR (e:Equipment) ON (e.type);
CREATE INDEX failure_severity_idx IF NOT EXISTS FOR (f:FailureMode) ON (f.severity);
