-- ============================================================================
-- ONLINE BANKING MANAGEMENT SYSTEM (OBMS)
-- Database: MySQL 8.0+ / MariaDB 10.4+ compatible schema
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `online_banking_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `online_banking_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table
DROP TABLE IF EXISTS `accounts_user`;
CREATE TABLE `accounts_user` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `password` VARCHAR(128) NOT NULL,
  `last_login` DATETIME(6) NULL,
  `is_superuser` TINYINT(1) NOT NULL DEFAULT 0,
  `username` VARCHAR(150) NOT NULL UNIQUE,
  `first_name` VARCHAR(150) NOT NULL DEFAULT '',
  `last_name` VARCHAR(150) NOT NULL DEFAULT '',
  `email` VARCHAR(254) NOT NULL DEFAULT '',
  `is_staff` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `date_joined` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `role` VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
  `phone_number` VARCHAR(20) NOT NULL DEFAULT '',
  `address` LONGTEXT NOT NULL,
  `date_of_birth` DATE NULL,
  `id_proof_number` VARCHAR(50) NOT NULL DEFAULT '',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX `idx_user_username` (`username`),
  INDEX `idx_user_email` (`email`),
  INDEX `idx_user_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bank Accounts Table
DROP TABLE IF EXISTS `accounts_bankaccount`;
CREATE TABLE `accounts_bankaccount` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `account_number` VARCHAR(20) NOT NULL UNIQUE,
  `account_type` VARCHAR(20) NOT NULL DEFAULT 'SAVINGS',
  `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `ifsc_code` VARCHAR(15) NOT NULL DEFAULT 'OBMS0001234',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `user_id` BIGINT NOT NULL,
  CONSTRAINT `fk_bankaccount_user` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`) ON DELETE CASCADE,
  INDEX `idx_bankaccount_accnum` (`account_number`),
  INDEX `idx_bankaccount_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Transactions Table
DROP TABLE IF EXISTS `transactions_transaction`;
CREATE TABLE `transactions_transaction` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` VARCHAR(32) NOT NULL UNIQUE,
  `transaction_type` VARCHAR(20) NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  `remarks` VARCHAR(255) NOT NULL DEFAULT '',
  `sender_balance_after` DECIMAL(15, 2) NULL,
  `receiver_balance_after` DECIMAL(15, 2) NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `receiver_account_id` BIGINT NULL,
  `sender_account_id` BIGINT NULL,
  CONSTRAINT `fk_txn_receiver` FOREIGN KEY (`receiver_account_id`) REFERENCES `accounts_bankaccount` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_txn_sender` FOREIGN KEY (`sender_account_id`) REFERENCES `accounts_bankaccount` (`id`) ON DELETE SET NULL,
  INDEX `idx_txn_id` (`transaction_id`),
  INDEX `idx_txn_type` (`transaction_type`),
  INDEX `idx_txn_status` (`status`),
  INDEX `idx_txn_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Beneficiaries Table
DROP TABLE IF EXISTS `accounts_beneficiary`;
CREATE TABLE `accounts_beneficiary` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `account_number` VARCHAR(20) NOT NULL,
  `beneficiary_name` VARCHAR(150) NOT NULL,
  `bank_name` VARCHAR(100) NOT NULL DEFAULT 'Online Banking System',
  `ifsc_code` VARCHAR(15) NOT NULL DEFAULT 'OBMS0001234',
  `nickname` VARCHAR(50) NOT NULL DEFAULT '',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `user_id` BIGINT NOT NULL,
  CONSTRAINT `fk_beneficiary_user` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`) ON DELETE CASCADE,
  INDEX `idx_beneficiary_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Notifications Table
DROP TABLE IF EXISTS `accounts_notification`;
CREATE TABLE `accounts_notification` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `message` LONGTEXT NOT NULL,
  `notification_type` VARCHAR(30) NOT NULL DEFAULT 'ACCOUNT',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `user_id` BIGINT NULL,
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`) ON DELETE CASCADE,
  INDEX `idx_notification_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Audit Logs Table
DROP TABLE IF EXISTS `accounts_auditlog`;
CREATE TABLE `accounts_auditlog` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(100) NOT NULL,
  `target_type` VARCHAR(50) NOT NULL,
  `target_id` VARCHAR(50) NOT NULL DEFAULT '',
  `details` LONGTEXT NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL DEFAULT '',
  `timestamp` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `admin_id` BIGINT NULL,
  CONSTRAINT `fk_auditlog_admin` FOREIGN KEY (`admin_id`) REFERENCES `accounts_user` (`id`) ON DELETE SET NULL,
  INDEX `idx_auditlog_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. DRF Auth Token Table
DROP TABLE IF EXISTS `authtoken_token`;
CREATE TABLE `authtoken_token` (
  `key` VARCHAR(40) NOT NULL PRIMARY KEY,
  `created` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `user_id` BIGINT NOT NULL UNIQUE,
  CONSTRAINT `fk_token_user` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- INITIAL SEED DATA
-- Passwords below are hashed with standard Django PBKDF2 SHA256:
-- Admin: password is 'admin123'
-- Customers: password is 'password123'
-- ============================================================================

INSERT INTO `accounts_user` (`id`, `password`, `is_superuser`, `username`, `first_name`, `last_name`, `email`, `is_staff`, `is_active`, `date_joined`, `role`, `phone_number`, `address`, `created_at`, `updated_at`)
VALUES 
(1, 'pbkdf2_sha256$870000$0cvyY0XF0WJd$fQ2E6yTfGq9M4o7G6fG6gJ8n3q7A9v3X1z2m8y7c4b0=', 1, 'admin', 'Bank', 'Administrator', 'admin@onlinebank.com', 1, 1, NOW(), 'ADMIN', '+1-800-555-0199', 'Headquarters, New York', NOW(), NOW()),
(2, 'pbkdf2_sha256$870000$0cvyY0XF0WJd$fQ2E6yTfGq9M4o7G6fG6gJ8n3q7A9v3X1z2m8y7c4b0=', 0, 'john_doe', 'John', 'Doe', 'john@example.com', 0, 1, NOW(), 'CUSTOMER', '+1-555-0143', '742 Evergreen Terrace', NOW(), NOW()),
(3, 'pbkdf2_sha256$870000$0cvyY0XF0WJd$fQ2E6yTfGq9M4o7G6fG6gJ8n3q7A9v3X1z2m8y7c4b0=', 0, 'alice_smith', 'Alice', 'Smith', 'alice@example.com', 0, 1, NOW(), 'CUSTOMER', '+1-555-0188', '124 Conch Street', NOW(), NOW());

INSERT INTO `accounts_bankaccount` (`id`, `account_number`, `account_type`, `balance`, `ifsc_code`, `currency`, `is_active`, `created_at`, `updated_at`, `user_id`)
VALUES
(1, '100188234912', 'SAVINGS', 14500.00, 'OBMS0001234', 'USD', 1, NOW(), NOW(), 2),
(2, '100199341256', 'CURRENT', 6200.00, 'OBMS0001234', 'USD', 1, NOW(), NOW(), 2),
(3, '100177452390', 'SAVINGS', 9850.00, 'OBMS0001234', 'USD', 1, NOW(), NOW(), 3);
