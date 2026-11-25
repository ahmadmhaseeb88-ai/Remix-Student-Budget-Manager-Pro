-- ===================================================================
-- STUDENT BUDGET MANAGER PRO — DATABASE SCHEMA (MySQL 8.0+ / MariaDB)
-- Compatible with XAMPP, phpMyAdmin, and Production MySQL
-- Uses utf8mb4 collation and DECIMAL(12, 2) for exact monetary amounts
-- ===================================================================

CREATE DATABASE IF NOT EXISTS `student_budget_pro` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `student_budget_pro`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `student_id` VARCHAR(64) NULL,
  `university` VARCHAR(191) NOT NULL DEFAULT 'University',
  `semester` VARCHAR(64) NOT NULL DEFAULT '1st Semester',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'PKR',
  `monthly_budget` DECIMAL(12, 2) NOT NULL DEFAULT 30000.00,
  `financial_goals` TEXT NULL,
  `role` ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  `plan` ENUM('free', 'premium', 'pro') NOT NULL DEFAULT 'free',
  `plan_expires_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_plan` (`plan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Receipts Table (CamScanner metadata and storage)
CREATE TABLE IF NOT EXISTS `receipts` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_data_base64` LONGTEXT NOT NULL,
  `mime_type` VARCHAR(64) NOT NULL,
  `file_size` INT UNSIGNED NOT NULL,
  `merchant` VARCHAR(191) NULL,
  `total_amount` DECIMAL(12, 2) NULL,
  `date` DATE NULL,
  `category` VARCHAR(64) NULL,
  `line_items_json` JSON NULL,
  `status` ENUM('pending', 'processed') NOT NULL DEFAULT 'processed',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_receipts_user` (`user_id`),
  CONSTRAINT `fk_receipts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Transactions Table (Income, Expenses, Transfers)
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `type` ENUM('income', 'expense', 'transfer') NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `payment_method` VARCHAR(64) NOT NULL DEFAULT 'Cash',
  `merchant` VARCHAR(191) NULL,
  `tags` VARCHAR(255) NULL,
  `receipt_id` VARCHAR(64) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_transactions_user_date` (`user_id`, `date`),
  INDEX `idx_transactions_type` (`type`),
  INDEX `idx_transactions_category` (`category`),
  CONSTRAINT `fk_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_transactions_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `receipts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Budgets Table
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `category` VARCHAR(64) NOT NULL DEFAULT 'Overall',
  `period` ENUM('monthly', 'weekly', 'semester', 'custom') NOT NULL DEFAULT 'monthly',
  `amount` DECIMAL(12, 2) NOT NULL,
  `threshold_percent` INT NOT NULL DEFAULT 80,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_budgets_user` (`user_id`),
  CONSTRAINT `fk_budgets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Savings Goals Table
CREATE TABLE IF NOT EXISTS `savings_goals` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `target_amount` DECIMAL(12, 2) NOT NULL,
  `current_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `target_date` DATE NOT NULL,
  `priority` ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
  `notes` TEXT NULL,
  `status` ENUM('active', 'completed', 'paused') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_savings_goals_user` (`user_id`),
  CONSTRAINT `fk_savings_goals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bills and Reminders Table
CREATE TABLE IF NOT EXISTS `bills_reminders` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `due_date` DATE NOT NULL,
  `recurring_frequency` ENUM('none', 'monthly', 'semester', 'annual') NOT NULL DEFAULT 'none',
  `is_paid` TINYINT(1) NOT NULL DEFAULT 0,
  `last_paid_at` DATE NULL,
  `reminder_days_before` INT NOT NULL DEFAULT 3,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_bills_user_due` (`user_id`, `due_date`),
  CONSTRAINT `fk_bills_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Semester Survival Plans Table
CREATE TABLE IF NOT EXISTS `semester_plans` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `semester_name` VARCHAR(120) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `expected_monthly_allowance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `scholarship_salary` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `tuition_exam_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `hostel_rent` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `food_transport_est` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `books_materials` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `other_expenses` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_semester_plans_user` (`user_id`),
  CONSTRAINT `fk_semester_plans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Subscriptions and Payments Table
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `plan` ENUM('free', 'premium', 'pro') NOT NULL,
  `amount_pkr` DECIMAL(12, 2) NOT NULL,
  `billing_cycle` ENUM('monthly', 'annual') NOT NULL DEFAULT 'monthly',
  `status` ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
  `payment_method` VARCHAR(64) NOT NULL,
  `reference_no` VARCHAR(120) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_subscriptions_user` (`user_id`),
  CONSTRAINT `fk_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
