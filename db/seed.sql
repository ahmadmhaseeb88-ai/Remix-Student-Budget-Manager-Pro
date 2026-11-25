-- ===================================================================
-- STUDENT BUDGET MANAGER PRO — SEED DATA (MySQL 8.0+ / MariaDB)
-- Password for student@fast.edu.pk: student123 (bcrypt hashed)
-- Password for admin@budgetpro.edu: admin123 (bcrypt hashed)
-- ===================================================================

USE `student_budget_pro`;

-- Insert Demo Users
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `student_id`, `university`, `semester`, `currency`, `monthly_budget`, `financial_goals`, `role`, `plan`, `plan_expires_at`, `created_at`)
VALUES
('usr_demo_101', 'Hamza Khan', 'student@fast.edu.pk', '$2a$10$wKzPZp7b3N7wN6Z7Ym.0eeb8G/3o7k8x5n1eYgG6hK1d0wQ/2l7yS', 'BSCS-2023-42', 'FAST NUCES, Islamabad', '5th Semester', 'PKR', 35000.00, 'Save for FYP laptop and AWS certification', 'student', 'pro', '2027-12-31 23:59:59', NOW()),
('usr_admin_001', 'System Administrator', 'admin@budgetpro.edu', '$2a$10$wKzPZp7b3N7wN6Z7Ym.0eeb8G/3o7k8x5n1eYgG6hK1d0wQ/2l7yS', 'ADMIN-01', 'Higher Education HQ', 'Staff', 'PKR', 100000.00, 'Maintain system uptime', 'admin', 'pro', '2027-12-31 23:59:59', NOW())
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Insert Initial Transactions
INSERT INTO `transactions` (`id`, `user_id`, `type`, `amount`, `category`, `description`, `date`, `payment_method`, `merchant`, `tags`, `receipt_id`, `created_at`)
VALUES
('tx_01', 'usr_demo_101', 'income', 25000.00, 'Pocket Money', 'Monthly student allowance from family', CURDATE() - INTERVAL 10 DAY, 'Bank Transfer', 'Family Transfer', 'allowance,family', NULL, NOW()),
('tx_02', 'usr_demo_101', 'income', 15000.00, 'Freelancing', 'Frontend React UI project for client', CURDATE() - INTERVAL 7 DAY, 'EasyPaisa', 'Upwork Client', 'freelance,coding', NULL, NOW()),
('tx_03', 'usr_demo_101', 'expense', 8500.00, 'Hostel and rent', 'Hostel shared room rent for this month', CURDATE() - INTERVAL 9 DAY, 'Cash', 'Hostel Warden', 'rent,housing', NULL, NOW()),
('tx_04', 'usr_demo_101', 'expense', 3200.00, 'Food', 'Campus cafeteria meals & mess', CURDATE() - INTERVAL 5 DAY, 'Cash', 'FAST Campus Cafe', 'food,cafeteria', NULL, NOW()),
('tx_05', 'usr_demo_101', 'expense', 2100.00, 'Transport', 'Metro bus card recharge & local commute', CURDATE() - INTERVAL 3 DAY, 'EasyPaisa', 'Metro Bus Card', 'transport,commute', NULL, NOW()),
('tx_06', 'usr_demo_101', 'expense', 1850.00, 'Books and stationery', 'Database Systems textbook & notebook prints', CURDATE() - INTERVAL 2 DAY, 'Cash', 'Al-Huda Book Bank', 'books,study', NULL, NOW()),
('tx_07', 'usr_demo_101', 'expense', 1450.00, 'Internet and mobile', 'Zong 4G monthly student data bundle', CURDATE() - INTERVAL 1 DAY, 'JazzCash', 'Zong Telecommunications', 'internet,mobile', NULL, NOW())
ON DUPLICATE KEY UPDATE `amount`=VALUES(`amount`);

-- Insert Budgets
INSERT INTO `budgets` (`id`, `user_id`, `category`, `period`, `amount`, `threshold_percent`, `is_active`, `created_at`)
VALUES
('bg_01', 'usr_demo_101', 'Overall', 'monthly', 35000.00, 85, 1, NOW()),
('bg_02', 'usr_demo_101', 'Food', 'monthly', 10000.00, 80, 1, NOW()),
('bg_03', 'usr_demo_101', 'Transport', 'monthly', 4000.00, 75, 1, NOW()),
('bg_04', 'usr_demo_101', 'Books and stationery', 'monthly', 3000.00, 80, 1, NOW())
ON DUPLICATE KEY UPDATE `amount`=VALUES(`amount`);

-- Insert Savings Goals
INSERT INTO `savings_goals` (`id`, `user_id`, `title`, `target_amount`, `current_amount`, `target_date`, `priority`, `notes`, `status`, `created_at`)
VALUES
('gl_01', 'usr_demo_101', 'M2 MacBook Pro / High-End Laptop for FYP', 160000.00, 45000.00, '2026-12-25', 'high', 'Required for final year deep learning project', 'active', NOW()),
('gl_02', 'usr_demo_101', 'AWS Solutions Architect Exam Voucher', 25000.00, 18000.00, '2026-11-30', 'medium', 'Student discount voucher', 'active', NOW()),
('gl_03', 'usr_demo_101', 'Semester Emergency Fund', 20000.00, 20000.00, '2026-09-01', 'high', 'Emergency reserve', 'completed', NOW())
ON DUPLICATE KEY UPDATE `current_amount`=VALUES(`current_amount`);

-- Insert Bills and Reminders
INSERT INTO `bills_reminders` (`id`, `user_id`, `title`, `amount`, `category`, `due_date`, `recurring_frequency`, `is_paid`, `last_paid_at`, `reminder_days_before`, `created_at`)
VALUES
('bl_01', 'usr_demo_101', 'Hostel Mess & Room Rent', 8500.00, 'Hostel and rent', CURDATE() + INTERVAL 5 DAY, 'monthly', 0, NULL, 3, NOW()),
('bl_02', 'usr_demo_101', 'University Midterm Exam Fee', 3500.00, 'University fees', CURDATE() + INTERVAL 12 DAY, 'semester', 0, NULL, 5, NOW()),
('bl_03', 'usr_demo_101', 'Hostel Fiber WiFi Shared', 1200.00, 'Internet and mobile', CURDATE() - INTERVAL 2 DAY, 'monthly', 1, CURDATE() - INTERVAL 3 DAY, 2, NOW())
ON DUPLICATE KEY UPDATE `amount`=VALUES(`amount`);
