-- Patients
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    patient_code VARCHAR(20) UNIQUE NOT NULL,
    age INTEGER,
    gender VARCHAR(10),
    fitzpatrick_type INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinical data
CREATE TABLE IF NOT EXISTS clinical_data (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    lesion_diameter FLOAT,
    uv_exposure FLOAT,
    abcde_score FLOAT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diagnoses
CREATE TABLE IF NOT EXISTS diagnoses (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    diagnosis VARCHAR(100),
    severity INTEGER CHECK (severity BETWEEN 1 AND 5),
    confidence FLOAT,
    diagnosed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HL7 messages
CREATE TABLE IF NOT EXISTS hl7_messages (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    message_type VARCHAR(20),
    raw_message TEXT,
    processed BOOLEAN DEFAULT FALSE,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ML predictions
CREATE TABLE IF NOT EXISTS ml_predictions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    model_version VARCHAR(50),
    risk_score FLOAT,
    prediction VARCHAR(100),
    mlflow_run_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);