-- Create database
CREATE DATABASE IF NOT EXISTS cemetery_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE cemetery_db;

-- =====================================================
-- USERS TABLE
-- Stores Admin and Staff credentials
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- =====================================================
-- PLOTS TABLE  
-- Cemetery plot locations with GPS coordinates
-- =====================================================
CREATE TABLE IF NOT EXISTS plots (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    plot_number VARCHAR(255) NOT NULL UNIQUE,
    section VARCHAR(50) NULL,
    row_number INT UNSIGNED NULL,
    column_number INT UNSIGNED NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status ENUM('available', 'occupied', 'reserved', 'maintenance') NOT NULL DEFAULT 'available',
    notes TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_plots_status (status),
    INDEX idx_plots_section (section),
    INDEX idx_plots_coordinates (latitude, longitude)
) ENGINE=InnoDB;

-- =====================================================
-- BURIAL RECORDS TABLE
-- Deceased person information linked to plots
-- =====================================================
CREATE TABLE IF NOT EXISTS burial_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    plot_id BIGINT UNSIGNED NOT NULL,
    deceased_name VARCHAR(255) NOT NULL,
    birth_date DATE NULL,
    death_date DATE NOT NULL,
    burial_date DATE NOT NULL,
    photo_url VARCHAR(500) NULL,
    obituary TEXT NULL,
    notes TEXT NULL,
    contact_name VARCHAR(255) NULL,
    contact_phone VARCHAR(50) NULL,
    contact_email VARCHAR(255) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (plot_id) REFERENCES plots(id) ON DELETE CASCADE,
    INDEX idx_burial_deceased_name (deceased_name),
    INDEX idx_burial_dates (burial_date, death_date),
    FULLTEXT INDEX idx_burial_search (deceased_name, obituary)
) ENGINE=InnoDB;

-- =====================================================
-- QR CODES TABLE
-- Generated QR codes linking to public grave profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS qr_codes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    burial_record_id BIGINT UNSIGNED NOT NULL,
    code CHAR(36) NOT NULL UNIQUE,
    url VARCHAR(500) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (burial_record_id) REFERENCES burial_records(id) ON DELETE CASCADE,
    INDEX idx_qr_code (code),
    INDEX idx_qr_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- PERSONAL ACCESS TOKENS TABLE (Laravel Sanctum)
-- For API authentication
-- =====================================================
CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT NULL,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_token_tokenable (tokenable_type, tokenable_id)
) ENGINE=InnoDB;

-- =====================================================
-- SEED DATA - Default Users
-- =====================================================
INSERT INTO users (name, email, password, role) VALUES
('Administrator', 'admin@cemetery.com', '$2y$12$qTGZyOKgj3oMNDqWRvKhZOxvYGTbNqcKlZFNkCGwMwvCmOaJHnYdi', 'admin'),
('Staff Member', 'staff@cemetery.com', '$2y$12$qTGZyOKgj3oMNDqWRvKhZOxvYGTbNqcKlZFNkCGwMwvCmOaJHnYdi', 'staff');
-- Note: Password is 'password123' hashed with bcrypt

-- =====================================================
-- SEED DATA - Sample Plots
-- =====================================================
INSERT INTO plots (plot_number, section, row_number, column_number, latitude, longitude, status) VALUES
('PLT-0001', 'A', 1, 1, 14.554700, 121.024400, 'occupied'),
('PLT-0002', 'A', 1, 2, 14.554700, 121.024500, 'occupied'),
('PLT-0003', 'A', 1, 3, 14.554700, 121.024600, 'available'),
('PLT-0004', 'A', 1, 4, 14.554700, 121.024700, 'available'),
('PLT-0005', 'A', 2, 1, 14.554800, 121.024400, 'reserved'),
('PLT-0006', 'A', 2, 2, 14.554800, 121.024500, 'available'),
('PLT-0007', 'B', 1, 1, 14.555200, 121.024400, 'occupied'),
('PLT-0008', 'B', 1, 2, 14.555200, 121.024500, 'available'),
('PLT-0009', 'B', 1, 3, 14.555200, 121.024600, 'maintenance'),
('PLT-0010', 'B', 2, 1, 14.555300, 121.024400, 'available');

-- =====================================================
-- SEED DATA - Sample Burial Records
-- =====================================================
INSERT INTO burial_records (plot_id, deceased_name, birth_date, death_date, burial_date, obituary, contact_name, contact_phone) VALUES
(1, 'Juan Dela Cruz', '1945-03-15', '2023-06-20', '2023-06-23', 'In loving memory of Juan Dela Cruz. A beloved family member who will be dearly missed by all who knew him.', 'Maria Dela Cruz', '09171234567'),
(2, 'Maria Santos', '1952-08-22', '2023-09-10', '2023-09-13', 'In loving memory of Maria Santos. A wonderful mother and grandmother who touched many lives.', 'Pedro Santos', '09181234567'),
(7, 'Roberto Mendoza', '1955-07-18', '2023-11-22', '2023-11-25', 'In loving memory of Roberto Mendoza. A dedicated father and community leader.', 'Ana Mendoza', '09191234567');

-- =====================================================
-- VIEW: Plot Summary with Burial Info
-- =====================================================
CREATE OR REPLACE VIEW v_plot_summary AS
SELECT 
    p.id,
    p.plot_number,
    p.section,
    p.row_number,
    p.column_number,
    p.latitude,
    p.longitude,
    p.status,
    b.deceased_name,
    b.burial_date,
    CASE WHEN q.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_qr_code
FROM plots p
LEFT JOIN burial_records b ON p.id = b.plot_id AND b.deleted_at IS NULL
LEFT JOIN qr_codes q ON b.id = q.burial_record_id AND q.is_active = TRUE
WHERE p.deleted_at IS NULL;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
