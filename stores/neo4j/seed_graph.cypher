// Seed Data for Plant Unit 4 - Boiler Feed & High Pressure Steam Generation

MERGE (fac:Facility {id: "FAC-MUM-07", name: "Western Refinery Power Co-Gen Facility", location: "Trombay"})
MERGE (unit:Unit {id: "UNIT-04", name: "High-Pressure Steam & Turbine Feed Unit"})
MERGE (fac)-[:CONTAINS]->(unit);

// Equipment: Boiler Feed Pump P-104
MERGE (pump:Equipment {
    tag: "BFP-P-104", 
    name: "Multi-Stage High Pressure Boiler Feed Pump", 
    type: "Centrifugal Pump", 
    criticality: "CRITICAL-TIER-1",
    rated_speed_rpm: 2980,
    flow_capacity_m3h: 420
})
MERGE (unit)-[:HAS_EQUIPMENT]->(pump);

// Sensors attached to P-104
MERGE (s1:Sensor {tag: "VIB-P104-DE-RMS", type: "Vibration_Accelerometer", location: "Drive End Bearing", unit: "mm/s"})
MERGE (s2:Sensor {tag: "VIB-P104-NDE-RMS", type: "Vibration_Accelerometer", location: "Non-Drive End Bearing", unit: "mm/s"})
MERGE (s3:Sensor {tag: "TMP-P104-BRG-DE", type: "RTD_Temperature", location: "Drive End Bearing", unit: "deg_C"})
MERGE (s4:Sensor {tag: "PRS-P104-DISCH", type: "Pressure_Transmitter", location: "Discharge Nozzle", unit: "bar"})

MERGE (pump)-[:MONITORED_BY]->(s1)
MERGE (pump)-[:MONITORED_BY]->(s2)
MERGE (pump)-[:MONITORED_BY]->(s3)
MERGE (pump)-[:MONITORED_BY]->(s4);

// Failure Modes
MERGE (fm1:FailureMode {
    code: "FM-BRG-CAGE-DEFECT", 
    name: "Ball Bearing Cage Fracture / Outer Race Spalling", 
    severity: "CRITICAL", 
    iso_standard: "ISO 10816-3 Zone C/D",
    remedy: "Throttle pump load to 60%, switch to standby P-104B, schedule bearing replacement"
})
MERGE (fm2:FailureMode {
    code: "FM-CAVITATION-IMPELLER", 
    name: "Impeller Blade Cavitation Erosion", 
    severity: "MAJOR", 
    remedy: "Increase suction head NPSH, inspect deaerator level"
})

MERGE (pump)-[:SUSCEPTIBLE_TO]->(fm1)
MERGE (pump)-[:SUSCEPTIBLE_TO]->(fm2);
