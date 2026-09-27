-- TimescaleDB Sensor Telemetry Schema for SCADA / DCS Real-time Feeds

CREATE TABLE IF NOT EXISTS sensor_telemetry (
    time TIMESTAMPTZ NOT NULL,
    sensor_tag VARCHAR(64) NOT NULL,
    equipment_tag VARCHAR(64) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    engineering_unit VARCHAR(16),
    quality_code INTEGER DEFAULT 192, -- 192 = Good in OPC-DA/UA
    anomaly_flag BOOLEAN DEFAULT FALSE
);

-- Convert to Hypertable if TimescaleDB extension is active
-- SELECT create_hypertable('sensor_telemetry', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_telemetry_sensor_time ON sensor_telemetry (sensor_tag, time DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_equip_time ON sensor_telemetry (equipment_tag, time DESC);

-- Incident audit table
CREATE TABLE IF NOT EXISTS plant_incidents (
    incident_id VARCHAR(64) PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    equipment_tag VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    description TEXT,
    hitl_approved_by VARCHAR(64),
    status VARCHAR(32) DEFAULT 'OPEN'
);
