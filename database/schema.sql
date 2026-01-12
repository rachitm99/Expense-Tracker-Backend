-- Expense Tracker Database Schema
-- Run this in your Neon SQL Editor or via psql

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    category VARCHAR(255) NOT NULL,
    note TEXT,
    date TIMESTAMP NOT NULL,
    month_key VARCHAR(7) NOT NULL,
    is_income BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_updated ON transactions(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_transactions_month ON transactions(user_id, month_key);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted ON transactions(user_id, deleted_at);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    principal DECIMAL(12, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    duration_months INTEGER NOT NULL,
    start_date TIMESTAMP NOT NULL,
    emi_amount DECIMAL(12, 2) NOT NULL,
    total_interest DECIMAL(12, 2) NOT NULL,
    payments JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes for loans
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_updated ON loans(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_loans_deleted ON loans(user_id, deleted_at);

-- Deleted items tracking (for sync)
CREATE TABLE IF NOT EXISTS deleted_items (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    item_id VARCHAR(255) NOT NULL,
    deleted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deleted_items_user ON deleted_items(user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_deleted_items_type ON deleted_items(user_id, item_type, deleted_at);
