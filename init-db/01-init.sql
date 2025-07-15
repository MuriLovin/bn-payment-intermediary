-- Initialization script for bn_payment database
-- This script runs automatically when the PostgreSQL container starts

-- Create payments table based on database.ts structure
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    correlation_id TEXT,
    amount DECIMAL(10,2),
    processor_id SMALLINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_correlation_id ON payments (correlation_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments (created_at);