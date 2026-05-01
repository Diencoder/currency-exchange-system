-- =============================================================================
-- ENTERPRISE-GRADE DATABASE SCHEMA FOR CURRENCY EXCHANGE SYSTEM
-- Version: 2.0 (Idempotency, 2FA, OHLC, Partitioning, Locking)
-- Created for: LAPTOP-MNVJOK9V\hp
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. USER SERVICE DATABASE
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS user_db;
USE user_db;

-- User information & Enhanced Security (2FA)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'ROLE_USER',
    kyc_status ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'UNVERIFIED',
    
    -- Security Enhancements
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    two_fa_secret VARCHAR(255),
    last_login_ip VARCHAR(45),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Multi-currency Wallet system with Optimistic Locking
CREATE TABLE IF NOT EXISTS wallets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    currency_code VARCHAR(10) NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0.00000000,
    locked_balance DECIMAL(20, 8) DEFAULT 0.00000000,
    
    -- Optimistic Locking point
    version BIGINT DEFAULT 0, 
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (user_id, currency_code)
);

-- Audit logs for sensitive financial/security actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    target_entity VARCHAR(50) NOT NULL,
    target_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    performed_by VARCHAR(50),
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. EXCHANGE SERVICE DATABASE
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS exchange_db;
USE exchange_db;

-- Supported currencies metadata
CREATE TABLE IF NOT EXISTS currencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Real-time exchange rates
CREATE TABLE IF NOT EXISTS exchange_rates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(18, 8) NOT NULL,
    provider VARCHAR(50) DEFAULT 'INTERNAL',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (from_currency, to_currency)
);

-- High-Frequency Rate History with Partitioning
-- Note: MySQL Partitioning requires timestamp in PK
CREATE TABLE IF NOT EXISTS rate_history (
    id BIGINT AUTO_INCREMENT,
    currency_pair VARCHAR(20) NOT NULL,
    rate DECIMAL(18, 8) NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, recorded_at),
    INDEX (currency_pair, recorded_at)
)
PARTITION BY RANGE (UNIX_TIMESTAMP(recorded_at)) (
    PARTITION p2026_01 VALUES LESS THAN (UNIX_TIMESTAMP('2026-02-01 00:00:00')),
    PARTITION p2026_02 VALUES LESS THAN (UNIX_TIMESTAMP('2026-03-01 00:00:00')),
    PARTITION p2026_03 VALUES LESS THAN (UNIX_TIMESTAMP('2026-04-01 00:00:00')),
    PARTITION p2026_04 VALUES LESS THAN (UNIX_TIMESTAMP('2026-05-01 00:00:00')),
    PARTITION p2026_05 VALUES LESS THAN (UNIX_TIMESTAMP('2026-06-01 00:00:00')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- OHLC Data for Candles (Tối ưu cho AI và Biểu đồ)
CREATE TABLE IF NOT EXISTS rate_ohlc (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    currency_pair VARCHAR(20) NOT NULL,
    time_interval ENUM('1m', '5m', '1h', '1d') NOT NULL,
    open_rate DECIMAL(18, 8) NOT NULL,
    high_rate DECIMAL(18, 8) NOT NULL,
    low_rate DECIMAL(18, 8) NOT NULL,
    close_rate DECIMAL(18, 8) NOT NULL,
    volume DECIMAL(20, 8) DEFAULT 0,
    timestamp TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- 3. TRANSACTION SERVICE DATABASE
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS transaction_db;
USE transaction_db;

-- Enhanced Transaction Ledger with Idempotency
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type ENUM('EXCHANGE', 'TRANSFER', 'P2P_BUY', 'P2P_SELL', 'FEE') NOT NULL,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10),
    amount_in DECIMAL(20, 8) NOT NULL,
    amount_out DECIMAL(20, 8),
    exchange_rate DECIMAL(18, 8),
    fee DECIMAL(18, 8) DEFAULT 0,
    
    -- Idempotency and Status
    idempotency_key VARCHAR(64) UNIQUE,
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
    
    reference_id VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. P2P & ESCROW SERVICE DATABASE
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS p2p_db;
USE p2p_db;

-- Peer-to-Peer listings
CREATE TABLE IF NOT EXISTS p2p_listings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    total_amount DECIMAL(20, 8) NOT NULL,
    remaining_amount DECIMAL(20, 8) NOT NULL,
    min_limit DECIMAL(20, 8) DEFAULT 0,
    rate_type ENUM('FIXED', 'FLOATING') DEFAULT 'FIXED',
    fixed_rate DECIMAL(18, 8),
    margin_percent DECIMAL(5, 2),
    status ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Escrow Management with Idempotency
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    
    -- Idempotency key
    idempotency_key VARCHAR(64) UNIQUE,
    
    status ENUM('HOLDING', 'RELEASED', 'DISPUTED', 'CANCELLED', 'REFUNDED') DEFAULT 'HOLDING',
    buyer_confirmed BOOLEAN DEFAULT FALSE,
    seller_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Dispute handling
CREATE TABLE IF NOT EXISTS disputes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    escrow_id BIGINT NOT NULL,
    raised_by BIGINT NOT NULL,
    reason TEXT NOT NULL,
    evidence_url TEXT,
    status ENUM('OPEN', 'RESOLVING', 'RESOLVED_BUYER', 'RESOLVED_SELLER') DEFAULT 'OPEN',
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. MARKETPLACE & DISCOVERY SERVICE DATABASE
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS marketplace_db;
USE marketplace_db;

-- Digital product listings
CREATE TABLE IF NOT EXISTS marketplace_products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    category VARCHAR(50), -- STREAMING, DESIGN, GAMING, etc.
    seller_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- AVAILABLE, SOLD, DELETED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_seller (seller_id),
    INDEX idx_category (category)
);

-- Marketplace Orders with Escrow tracking
CREATE TABLE IF NOT EXISTS marketplace_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(10),
    status VARCHAR(50) DEFAULT 'PENDING_PAYMENT', 
    -- Statuses: PENDING_PAYMENT, PAID_LOCKED, COMPLETED, DISPUTED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES marketplace_products(id),
    INDEX idx_buyer (buyer_id),
    INDEX idx_seller_order (seller_id)
);

-- Marketplace Disputes (Reporting system)
CREATE TABLE IF NOT EXISTS marketplace_disputes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    reporter_id BIGINT NOT NULL,
    reason TEXT NOT NULL,
    evidence_url VARCHAR(512),
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, INVESTIGATING, RESOLVED, CLOSED
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_dispute FOREIGN KEY (order_id) REFERENCES marketplace_orders(id)
);

-- Init default data
USE exchange_db;
INSERT IGNORE INTO currencies (code, name, symbol) VALUES 
('USD', 'US Dollar', '$'),
('VND', 'Vietnamese Dong', '₫'),
('EUR', 'Euro', '€'),
('GBP', 'British Pound', '£'),
('JPY', 'Japanese Yen', '¥');

-- Init sample marketplace data
USE marketplace_db;
INSERT IGNORE INTO marketplace_products (name, description, price, currency, category, seller_id, status)
VALUES ('Canva Pro 1 Year', 'Tài khoản chính chủ, bảo hành 12 tháng', 250000, 'VND', 'DESIGN', 1, 'AVAILABLE');
