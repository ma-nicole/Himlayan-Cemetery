-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 02, 2026 at 10:39 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cemetery_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `type` enum('info','warning','success','urgent') NOT NULL DEFAULT 'info',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `published_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `title`, `content`, `type`, `is_active`, `published_at`, `expires_at`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'TEST', 'This is a test. ', 'info', 1, '2026-03-02 06:49:32', '2026-03-06 16:00:00', 1, '2026-03-02 06:49:32', '2026-03-02 09:29:22');

-- --------------------------------------------------------

--
-- Table structure for table `burial_records`
--

CREATE TABLE `burial_records` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `plot_id` bigint(20) UNSIGNED NOT NULL,
  `deceased_name` varchar(255) NOT NULL,
  `deceased_first_name` varchar(255) DEFAULT NULL,
  `deceased_middle_initial` varchar(2) DEFAULT NULL,
  `deceased_last_name` varchar(255) DEFAULT NULL,
  `deceased_nickname` varchar(255) DEFAULT NULL,
  `deceased_photo_url` varchar(255) DEFAULT NULL,
  `deceased_gender` varchar(255) DEFAULT NULL,
  `is_publicly_searchable` tinyint(1) NOT NULL DEFAULT 1,
  `birth_date` date DEFAULT NULL,
  `death_date` date NOT NULL,
  `burial_date` date NOT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `obituary` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `contact_first_name` varchar(255) DEFAULT NULL,
  `contact_middle_initial` varchar(2) DEFAULT NULL,
  `contact_last_name` varchar(255) DEFAULT NULL,
  `contact_country_code` varchar(10) NOT NULL DEFAULT '+63',
  `contact_phone` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact2_first_name` varchar(255) DEFAULT NULL,
  `contact2_middle_initial` varchar(2) DEFAULT NULL,
  `contact2_last_name` varchar(255) DEFAULT NULL,
  `contact2_country_code` varchar(10) NOT NULL DEFAULT '+63',
  `contact2_phone` varchar(255) DEFAULT NULL,
  `contact2_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `burial_records`
--

INSERT INTO `burial_records` (`id`, `plot_id`, `deceased_name`, `deceased_first_name`, `deceased_middle_initial`, `deceased_last_name`, `deceased_nickname`, `deceased_photo_url`, `deceased_gender`, `is_publicly_searchable`, `birth_date`, `death_date`, `burial_date`, `photo_url`, `obituary`, `notes`, `contact_name`, `contact_first_name`, `contact_middle_initial`, `contact_last_name`, `contact_country_code`, `contact_phone`, `contact_email`, `contact2_first_name`, `contact2_middle_initial`, `contact2_last_name`, `contact2_country_code`, `contact2_phone`, `contact2_email`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 3, 'Juan D. Cruz', 'Juan', 'D', 'Cruz', NULL, NULL, 'Male', 1, '1945-03-14', '2023-06-19', '2023-06-22', NULL, 'In loving memory of Juan Dela Cruz. A beloved family member who will be dearly missed.', NULL, 'Berta S. Mendoza', 'Berta', 'S', 'Mendoza', '+63', '9279886522', 'marieanne.nicole@yahoo.com', NULL, NULL, NULL, '+63', NULL, NULL, '2026-01-21 18:49:09', '2026-02-25 18:59:28', NULL),
(2, 13, 'Maria Santos', NULL, NULL, NULL, NULL, NULL, NULL, 1, '1952-08-22', '2023-09-10', '2023-09-13', NULL, 'In loving memory of Maria Santos. A beloved family member who will be dearly missed.', NULL, 'Family Representative', NULL, NULL, NULL, '+63', '09707186827', NULL, NULL, NULL, NULL, '+63', NULL, NULL, '2026-01-21 18:49:09', '2026-02-21 02:03:42', '2026-02-21 02:03:42'),
(3, 14, 'Pedro R. Reyes', 'Pedro', 'R', 'Reyes', NULL, NULL, 'Male', 1, '1938-01-04', '2022-12-14', '2022-12-17', NULL, 'In loving memory of Pedro Reyes. A beloved family member who will be dearly missed.', NULL, 'Charles C. Flandez', 'Charles', 'C', 'Flandez', '+63', '9459922325', 'rawrr@gmail.com', NULL, NULL, NULL, '+63', NULL, NULL, '2026-01-21 18:49:09', '2026-02-13 16:19:56', NULL),
(4, 18, 'Ana G. Garcia', 'Ana', 'G', 'Garcia', NULL, NULL, 'Female', 1, '1960-11-27', '2024-01-02', '2024-01-05', NULL, 'In loving memory of Ana Garcia. A beloved family member who will be dearly missed.', NULL, 'Marie Anne Nicole A. Ocampo', 'Marie Anne Nicole', 'A', 'Ocampo', '+63', '9123456789', 'marieanne.nicole@gmail.com', NULL, NULL, NULL, '+63', NULL, NULL, '2026-01-21 18:49:09', '2026-02-25 18:57:55', NULL),
(5, 25, 'Roberto M. Mendoza', 'Roberto', 'M', 'Mendoza', NULL, NULL, 'Male', 1, '1955-07-14', '2023-11-18', '2023-11-21', NULL, 'In loving memory of Roberto Mendoza. A beloved family member who will be dearly missed.', NULL, 'Berta S. Mendoza', 'Berta', 'S', 'Mendoza', '+63', '9279886522', 'marieanne.nicole@yahoo.com', NULL, NULL, NULL, '+63', NULL, NULL, '2026-01-21 18:49:09', '2026-02-25 18:59:28', NULL),
(6, 80, 'Chuckie C. Flandez', 'Chuckie', 'C', 'Flandez', 'Chuck', NULL, 'Male', 1, '2000-03-08', '2025-06-08', '2025-06-22', NULL, 'ded ', 'x( ded ', 'Charles C. Flandez', 'Charles', 'C', 'Flandez', '+63', '9459922325', 'charlesflandezz@gmail.com', NULL, NULL, NULL, '+63', NULL, NULL, '2026-02-13 13:16:25', '2026-02-25 14:19:15', NULL),
(7, 7, 'Emmanuelle H. Atienza', 'Emmanuelle', 'H', 'Atienza', 'Emmansky', 'deceased_photos/LQ39nu8pcMEhfD8aeaMlkXxhFceZvq20LPylKA7y.jpg', 'Female', 1, '2006-02-04', '2025-10-18', '2025-10-28', NULL, 'Emman Atienza will always be remembered for her kind heart, warm smile, and the love she shared with everyone around her. She touched many lives with her gentle spirit and caring nature. Her memory will forever remain in the hearts of her family and friends.\r\n\r\nMay she rest in peace.', NULL, 'Marie Anne Nicole A. Ocampo', 'Marie Anne Nicole', 'A', 'Ocampo', '+63', '9123456789', 'marieanne.nicole@gmail.com', NULL, NULL, NULL, '+63', NULL, NULL, '2026-02-21 01:24:07', '2026-02-28 07:05:52', NULL),
(8, 1, 'Eddie  Garcia', 'Eddie', NULL, 'Garcia', 'Dy', 'deceased_photos/BTkmfTpUs8Bn910ioiCCbVYiQQTCINUbOUKkY7Is.jpg', 'Male', 0, '1929-04-30', '2019-06-18', '2019-06-22', NULL, 'Eddie Garcia will always be remembered as one of the greatest actors in Philippine cinema. With a career spanning decades, he brought unforgettable characters to life and inspired generations of artists and audiences alike. His dedication, talent, and passion for the craft left a lasting mark on the film and television industry.\r\n\r\nHis legacy lives on through the countless stories he helped tell. May he rest in peace.', NULL, 'Marie Anne Nicole A. Ocampo', 'Marie Anne Nicole', 'A', 'Ocampo', '+63', '9123456789', 'marieanne.nicole@gmail.com', NULL, NULL, NULL, '+63', NULL, NULL, '2026-02-21 04:23:34', '2026-02-28 07:04:25', NULL),
(9, 5, 'Kobe  Bryant', 'Kobe', NULL, 'Bryant', 'Black Mamba', NULL, 'Male', 1, '1978-08-20', '2020-01-23', '2020-01-27', NULL, 'test', NULL, 'John Miguel B. Taduran', 'John Miguel', 'B', 'Taduran', '+63', '9098765432', 'johnmigueltaduran09@gmail.com', NULL, NULL, NULL, '+63', NULL, NULL, '2026-02-28 05:09:05', '2026-02-28 05:16:36', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `feedbacks`
--

CREATE TABLE `feedbacks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `phone_country_code` varchar(255) NOT NULL DEFAULT '+63',
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `rating` tinyint(4) DEFAULT NULL,
  `status` enum('new','read','responded') NOT NULL DEFAULT 'new',
  `admin_response` text DEFAULT NULL,
  `responded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `feedbacks`
--

INSERT INTO `feedbacks` (`id`, `user_id`, `name`, `email`, `phone`, `phone_country_code`, `subject`, `message`, `rating`, `status`, `admin_response`, `responded_by`, `responded_at`, `created_at`, `updated_at`) VALUES
(3, NULL, 'mar.ie ann!e nico;le o_cam*po', 'marieanne.nicole@gmail.com', '9876543210', '+63', NULL, 'tesssssssssssssssst', NULL, 'new', NULL, NULL, NULL, '2026-02-28 06:07:18', '2026-02-28 06:07:18'),
(4, NULL, 'marie anne nicole ocampo', 'marieanne.nicole@gmail.com', '9876543210', '+63', NULL, 'tesssssssssssssssst', NULL, 'new', NULL, NULL, NULL, '2026-02-28 06:16:25', '2026-02-28 06:16:25'),
(5, NULL, 'Marie Ocampo', 'marieanne.nicole@gmail.com', '9876543210', '+63', NULL, 'test', NULL, 'new', NULL, NULL, NULL, '2026-02-28 06:28:55', '2026-02-28 06:28:55'),
(6, NULL, 'Marie Ocampo', 'marieanne.nicole@gmail.com', '9876543210', '+63', NULL, 'test\n', NULL, 'new', NULL, NULL, NULL, '2026-02-28 06:32:09', '2026-02-28 06:32:09'),
(7, NULL, 'Marie Ocampo', 'marieanne.nicole@gmail.com', '9876543210', '+63', NULL, 'tesy', NULL, 'new', NULL, NULL, NULL, '2026-02-28 06:33:25', '2026-02-28 06:33:25'),
(8, NULL, 'Marie Ocampo', 'marieanne.nicole@gmail.com', NULL, '+63', NULL, 'test', NULL, 'new', NULL, NULL, NULL, '2026-02-28 06:34:33', '2026-02-28 06:34:33'),
(9, NULL, 'Marie Ocampo', 'marieanne.nicole@gmail.com', NULL, '+63', NULL, ' it should work now i guess?\n', NULL, 'new', NULL, NULL, NULL, '2026-02-28 06:49:33', '2026-02-28 06:49:33'),
(10, NULL, 'john miguel taduran', 'johnmigueltaduran09@gmail.com', '9995584106', '+63', NULL, 'kapag nareceive mo to ibig sabihin pwede na umuwi', NULL, 'new', NULL, NULL, NULL, '2026-02-28 06:55:05', '2026-02-28 06:55:05'),
(11, NULL, 'Marie Anne Nicole A Ocampo', 'marieanne.nicole@gmail.com', NULL, '+63', 'inquiry', 'test. test. test. test', NULL, 'new', NULL, NULL, NULL, '2026-03-01 14:12:11', '2026-03-01 14:12:11'),
(12, NULL, 'Marie Anne Nicole A Ocampo', 'marieanne.nicole@gmail.com', NULL, '+63', 'inquiry', 'etstersress', NULL, 'new', NULL, NULL, NULL, '2026-03-01 14:20:25', '2026-03-01 14:20:25'),
(13, NULL, 'Marie Anne Nicole A Ocampo', 'marieanne.nicole@gmail.com', NULL, '+63', 'inquiry', 'tdtstststst', NULL, 'new', NULL, NULL, NULL, '2026-03-01 14:22:17', '2026-03-01 14:22:17'),
(14, NULL, 'Marie Anne Nicole A Ocampo', 'marieanne.nicole@gmail.com', NULL, '+63', 'inquiry', 'asasasasasas', NULL, 'new', NULL, NULL, NULL, '2026-03-01 14:23:59', '2026-03-01 14:23:59'),
(15, NULL, 'Marie Anne Nicole A Ocampo', 'marieanne.nicole@gmail.com', NULL, '+63', 'inquiry', 'asasasassasa', NULL, 'new', NULL, NULL, NULL, '2026-03-01 14:25:16', '2026-03-01 14:25:16'),
(16, NULL, 'Marie Anne Nicole A Ocampo', 'marieanne.nicole@gmail.com', NULL, '+63', 'inquiry', 'sasasasasas', NULL, 'new', NULL, NULL, NULL, '2026-03-01 14:30:53', '2026-03-01 14:30:53'),
(17, NULL, 'Marie Anne Nicole A Ocampo', 'marieanne.nicole@gmail.com', '9123456789', '+63', 'test', 'test1', 4, 'new', NULL, NULL, NULL, '2026-03-01 17:39:30', '2026-03-01 17:39:30'),
(18, NULL, 'Marie Anne Nicole A Ocampo', 'marieanne.nicole@gmail.com', NULL, '+63', 'test', 'test', 3, 'new', NULL, NULL, NULL, '2026-03-01 17:47:23', '2026-03-01 17:47:23'),
(19, NULL, 'Marie Anne Nicole A Ocampo', 'marieanne.nicole@gmail.com', NULL, '+63', 'test', 'test', 5, 'new', NULL, NULL, NULL, '2026-03-01 17:48:48', '2026-03-01 17:48:48'),
(20, NULL, 'sdasda asdasdasda', 'johnmigueltaduran09@gmail.com', '9123456789', '+63', NULL, 'asdadadasdadasd', NULL, 'new', NULL, NULL, NULL, '2026-03-02 09:11:20', '2026-03-02 09:11:20');

-- --------------------------------------------------------

--
-- Table structure for table `invitations`
--

CREATE TABLE `invitations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `burial_record_id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(2, '2024_01_01_000001_create_users_table', 1),
(3, '2024_01_01_000002_create_plots_table', 1),
(4, '2024_01_01_000003_create_burial_records_table', 1),
(5, '2024_01_01_000004_create_qr_codes_table', 1),
(6, '2024_01_20_000001_add_visitor_role_to_users', 1),
(7, '2026_01_21_215203_add_social_login_fields_to_users_table', 1),
(8, '2026_01_22_000001_create_announcements_table', 2),
(9, '2026_01_22_000002_create_service_requests_table', 2),
(10, '2026_01_22_000003_create_payments_table', 2),
(11, '2026_01_22_000004_create_feedbacks_table', 2),
(12, '2026_01_23_000001_add_detailed_fields_to_burial_records_table', 2),
(13, '2026_02_10_000001_add_invitation_fields_to_users_table', 2),
(14, '2026_02_25_000001_create_invitations_table', 3),
(15, '2026_02_28_000001_add_phone_fields_to_feedbacks_table', 4),
(16, '2026_02_28_000001_create_password_resets_table', 5),
(17, '2026_03_01_000001_add_owner_id_to_plots_table', 6),
(18, '2026_03_02_000001_add_profile_fields_to_users_table', 7),
(19, '2026_03_02_160919_change_visitor_role_to_member', 8);

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_resets`
--

INSERT INTO `password_resets` (`email`, `token`, `created_at`) VALUES
('marieanne.nicole@gmail.com', '$2y$12$Oe50C3Rhb39APVQv4QeYzuHUIJJfE1ucvyp5Nor9RR8ahInqfoC4S', '2026-02-28 07:59:10');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `plot_id` bigint(20) UNSIGNED DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_type` varchar(255) NOT NULL,
  `payment_method` varchar(255) NOT NULL,
  `reference_number` varchar(255) DEFAULT NULL,
  `status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `verified_by` bigint(20) UNSIGNED DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `user_id`, `plot_id`, `amount`, `payment_type`, `payment_method`, `reference_number`, `status`, `notes`, `paid_at`, `verified_by`, `verified_at`, `created_at`, `updated_at`) VALUES
(62, 4, NULL, 500.00, 'maintenance', 'gcash', '6995e9c953b9bc348214e445', 'pending', NULL, NULL, NULL, NULL, '2026-02-18 16:33:13', '2026-02-18 16:33:14');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(16, 'App\\Models\\User', 6, 'auth_token', '29813ad80ade3275242af39eea28b3974a0312f35d7b75f22df0768664086a38', '[\"*\"]', NULL, NULL, '2026-02-13 12:51:35', '2026-02-13 12:51:35'),
(18, 'App\\Models\\User', 4, 'auth_token', '785e1d35691eac4f95bf6b333a23b135fbdab888e05ac776f3104dffcc1914cc', '[\"*\"]', '2026-02-18 16:38:19', NULL, '2026-02-18 07:30:55', '2026-02-18 16:38:19');

-- --------------------------------------------------------

--
-- Table structure for table `plots`
--

CREATE TABLE `plots` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `plot_number` varchar(255) NOT NULL,
  `section` varchar(255) DEFAULT NULL,
  `row_number` int(11) DEFAULT NULL,
  `column_number` int(11) DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `status` enum('available','occupied','reserved','maintenance') NOT NULL DEFAULT 'available',
  `owner_id` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `plots`
--

INSERT INTO `plots` (`id`, `plot_number`, `section`, `row_number`, `column_number`, `latitude`, `longitude`, `status`, `owner_id`, `notes`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'PLT-0001', 'A', 1, 1, 14.55480000, 121.02450000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-02-21 04:23:34', NULL),
(2, 'PLT-0002', 'A', 1, 2, 14.55480000, 121.02460000, 'reserved', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(3, 'PLT-0003', 'A', 1, 3, 14.55480000, 121.02470000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(4, 'PLT-0004', 'A', 1, 4, 14.55480000, 121.02480000, 'reserved', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(5, 'PLT-0005', 'A', 2, 1, 14.55490000, 121.02450000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-02-28 05:09:05', NULL),
(6, 'PLT-0006', 'A', 2, 2, 14.55490000, 121.02460000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(7, 'PLT-0007', 'A', 2, 3, 14.55490000, 121.02470000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-02-21 01:24:07', NULL),
(8, 'PLT-0008', 'A', 2, 4, 14.55490000, 121.02480000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(9, 'PLT-0009', 'A', 3, 1, 14.55500000, 121.02450000, 'reserved', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(10, 'PLT-0010', 'A', 3, 2, 14.55500000, 121.02460000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(11, 'PLT-0011', 'A', 3, 3, 14.55500000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(12, 'PLT-0012', 'A', 3, 4, 14.55500000, 121.02480000, 'reserved', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(13, 'PLT-0013', 'A', 4, 1, 14.55510000, 121.02450000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-02-21 02:03:42', NULL),
(14, 'PLT-0014', 'A', 4, 2, 14.55510000, 121.02460000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(15, 'PLT-0015', 'A', 4, 3, 14.55510000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(16, 'PLT-0016', 'A', 4, 4, 14.55510000, 121.02480000, 'reserved', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(17, 'PLT-0017', 'A', 5, 1, 14.55520000, 121.02450000, 'reserved', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(18, 'PLT-0018', 'A', 5, 2, 14.55520000, 121.02460000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(19, 'PLT-0019', 'A', 5, 3, 14.55520000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(20, 'PLT-0020', 'A', 5, 4, 14.55520000, 121.02480000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(21, 'PLT-0021', 'B', 1, 1, 14.55530000, 121.02450000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(22, 'PLT-0022', 'B', 1, 2, 14.55530000, 121.02460000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(23, 'PLT-0023', 'B', 1, 3, 14.55530000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(24, 'PLT-0024', 'B', 1, 4, 14.55530000, 121.02480000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(25, 'PLT-0025', 'B', 2, 1, 14.55540000, 121.02450000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(26, 'PLT-0026', 'B', 2, 2, 14.55540000, 121.02460000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(27, 'PLT-0027', 'B', 2, 3, 14.55540000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(28, 'PLT-0028', 'B', 2, 4, 14.55540000, 121.02480000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(29, 'PLT-0029', 'B', 3, 1, 14.55550000, 121.02450000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(30, 'PLT-0030', 'B', 3, 2, 14.55550000, 121.02460000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(31, 'PLT-0031', 'B', 3, 3, 14.55550000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(32, 'PLT-0032', 'B', 3, 4, 14.55550000, 121.02480000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(33, 'PLT-0033', 'B', 4, 1, 14.55560000, 121.02450000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(34, 'PLT-0034', 'B', 4, 2, 14.55560000, 121.02460000, 'reserved', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(35, 'PLT-0035', 'B', 4, 3, 14.55560000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(36, 'PLT-0036', 'B', 4, 4, 14.55560000, 121.02480000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(37, 'PLT-0037', 'B', 5, 1, 14.55570000, 121.02450000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(38, 'PLT-0038', 'B', 5, 2, 14.55570000, 121.02460000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(39, 'PLT-0039', 'B', 5, 3, 14.55570000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(40, 'PLT-0040', 'B', 5, 4, 14.55570000, 121.02480000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(41, 'PLT-0041', 'C', 1, 1, 14.55580000, 121.02450000, 'reserved', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(42, 'PLT-0042', 'C', 1, 2, 14.55580000, 121.02460000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(43, 'PLT-0043', 'C', 1, 3, 14.55580000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(44, 'PLT-0044', 'C', 1, 4, 14.55580000, 121.02480000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(45, 'PLT-0045', 'C', 2, 1, 14.55590000, 121.02450000, 'reserved', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(46, 'PLT-0046', 'C', 2, 2, 14.55590000, 121.02460000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(47, 'PLT-0047', 'C', 2, 3, 14.55590000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(48, 'PLT-0048', 'C', 2, 4, 14.55590000, 121.02480000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(49, 'PLT-0049', 'C', 3, 1, 14.55600000, 121.02450000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(50, 'PLT-0050', 'C', 3, 2, 14.55600000, 121.02460000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(51, 'PLT-0051', 'C', 3, 3, 14.55600000, 121.02470000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(52, 'PLT-0052', 'C', 3, 4, 14.55600000, 121.02480000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(53, 'PLT-0053', 'C', 4, 1, 14.55610000, 121.02450000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(54, 'PLT-0054', 'C', 4, 2, 14.55610000, 121.02460000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(55, 'PLT-0055', 'C', 4, 3, 14.55610000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(56, 'PLT-0056', 'C', 4, 4, 14.55610000, 121.02480000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(57, 'PLT-0057', 'C', 5, 1, 14.55620000, 121.02450000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(58, 'PLT-0058', 'C', 5, 2, 14.55620000, 121.02460000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(59, 'PLT-0059', 'C', 5, 3, 14.55620000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(60, 'PLT-0060', 'C', 5, 4, 14.55620000, 121.02480000, 'reserved', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(61, 'PLT-0061', 'D', 1, 1, 14.55630000, 121.02450000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(62, 'PLT-0062', 'D', 1, 2, 14.55630000, 121.02460000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(63, 'PLT-0063', 'D', 1, 3, 14.55630000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(64, 'PLT-0064', 'D', 1, 4, 14.55630000, 121.02480000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(65, 'PLT-0065', 'D', 2, 1, 14.55640000, 121.02450000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(66, 'PLT-0066', 'D', 2, 2, 14.55640000, 121.02460000, 'reserved', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(67, 'PLT-0067', 'D', 2, 3, 14.55640000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(68, 'PLT-0068', 'D', 2, 4, 14.55640000, 121.02480000, 'reserved', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(69, 'PLT-0069', 'D', 3, 1, 14.55650000, 121.02450000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(70, 'PLT-0070', 'D', 3, 2, 14.55650000, 121.02460000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(71, 'PLT-0071', 'D', 3, 3, 14.55650000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(72, 'PLT-0072', 'D', 3, 4, 14.55650000, 121.02480000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(73, 'PLT-0073', 'D', 4, 1, 14.55660000, 121.02450000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(74, 'PLT-0074', 'D', 4, 2, 14.55660000, 121.02460000, 'reserved', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(75, 'PLT-0075', 'D', 4, 3, 14.55660000, 121.02470000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(76, 'PLT-0076', 'D', 4, 4, 14.55660000, 121.02480000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(77, 'PLT-0077', 'D', 5, 1, 14.55670000, 121.02450000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(78, 'PLT-0078', 'D', 5, 2, 14.55670000, 121.02460000, 'available', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(79, 'PLT-0079', 'D', 5, 3, 14.55670000, 121.02470000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09', NULL),
(80, 'PLT-0080', 'D', 5, 4, 14.55670000, 121.02480000, 'occupied', NULL, NULL, '2026-01-21 18:49:09', '2026-02-13 13:16:25', NULL),
(82, 'PLT-0081', 'A', 2, 3, 13.44500000, 15.46500000, 'available', NULL, NULL, '2026-02-21 03:41:15', '2026-02-21 03:41:15', NULL),
(83, 'PLT-0082', 'D', 2, 2, 13.56400000, 12.53400000, 'available', NULL, NULL, '2026-02-21 03:50:24', '2026-02-21 03:50:24', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `qr_codes`
--

CREATE TABLE `qr_codes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `burial_record_id` bigint(20) UNSIGNED NOT NULL,
  `code` char(36) NOT NULL,
  `url` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `qr_codes`
--

INSERT INTO `qr_codes` (`id`, `burial_record_id`, `code`, `url`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 4, 'fb939e99-5591-4e8a-8853-daf758fb5812', 'http://localhost:3000/grave/fb939e99-5591-4e8a-8853-daf758fb5812', 1, '2026-02-13 12:42:02', '2026-02-13 12:42:02'),
(2, 5, '8466f81a-7e99-464d-b717-bc075c5aeeea', 'http://localhost:3000/grave/8466f81a-7e99-464d-b717-bc075c5aeeea', 1, '2026-02-13 12:59:21', '2026-02-13 12:59:21'),
(4, 1, '0724e758-5c5b-40a6-a5c5-1ddd8182feb8', 'https://malty-kandice-unwinded.ngrok-free.dev/api/grave/0724e758-5c5b-40a6-a5c5-1ddd8182feb8', 1, '2026-02-13 15:40:06', '2026-02-13 15:40:06'),
(5, 3, 'bac41925-8ee1-43a3-8321-03772f240c64', 'https://malty-kandice-unwinded.ngrok-free.dev/api/grave/bac41925-8ee1-43a3-8321-03772f240c64', 1, '2026-02-13 15:42:09', '2026-02-13 15:42:09'),
(6, 7, '693545a9-9792-44a4-a34b-235e2f8115c7', 'http://localhost:3000/grave/693545a9-9792-44a4-a34b-235e2f8115c7', 1, '2026-02-21 03:56:48', '2026-02-21 03:56:48'),
(7, 8, '2a42700e-5bc9-4180-b037-3fba43cf0573', 'http://localhost:3000/grave/2a42700e-5bc9-4180-b037-3fba43cf0573', 1, '2026-02-21 04:24:55', '2026-02-21 04:24:55');

-- --------------------------------------------------------

--
-- Table structure for table `service_requests`
--

CREATE TABLE `service_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `service_type` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `preferred_date` date DEFAULT NULL,
  `contact_number` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `processed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `service_requests`
--

INSERT INTO `service_requests` (`id`, `user_id`, `service_type`, `description`, `preferred_date`, `contact_number`, `status`, `admin_notes`, `processed_by`, `processed_at`, `created_at`, `updated_at`) VALUES
(2, 7, 'lawn_lots', 'Test request', NULL, NULL, 'approved', NULL, 1, '2026-03-02 08:36:08', '2026-03-02 08:30:21', '2026-03-02 08:36:08'),
(3, 7, 'columbarium_niches', 'fasdfasfdas', '2026-03-16', '+63 9995584106', 'rejected', NULL, 1, '2026-03-02 08:55:10', '2026-03-02 08:54:31', '2026-03-02 08:55:10'),
(4, 7, 'columbarium_niches', 'adsfghj', NULL, '+63 9995584106', 'completed', NULL, 1, '2026-03-02 09:02:08', '2026-03-02 09:01:11', '2026-03-02 09:02:08');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `provider` varchar(255) DEFAULT NULL,
  `provider_id` varchar(255) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `role` enum('admin','staff','visitor','member') DEFAULT 'member',
  `remember_token` varchar(100) DEFAULT NULL,
  `invitation_sent_at` timestamp NULL DEFAULT NULL,
  `invitation_expires_at` timestamp NULL DEFAULT NULL,
  `invitation_token` varchar(255) DEFAULT NULL,
  `invitation_accepted` tinyint(1) NOT NULL DEFAULT 0,
  `must_change_password` tinyint(1) NOT NULL DEFAULT 0,
  `last_password_change` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `provider`, `provider_id`, `avatar`, `phone`, `address`, `role`, `remember_token`, `invitation_sent_at`, `invitation_expires_at`, `invitation_token`, `invitation_accepted`, `must_change_password`, `last_password_change`, `created_at`, `updated_at`) VALUES
(1, 'Administrator', 'admin@cemetery.com', NULL, '$2y$12$ob/AmjgvsnFJnhit3PqYA.VBSyP4SRJS4180mmH2XZKIAvOVvo8Yy', NULL, NULL, NULL, NULL, NULL, 'admin', NULL, NULL, NULL, NULL, 0, 0, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09'),
(2, 'Staff Member', 'staff@cemetery.com', NULL, '$2y$12$XfKRiKUh4W2L1jbLbTUN1eR0m5LnivmxPjXi6KcDV0qRHRUs/LX/e', NULL, NULL, NULL, NULL, NULL, 'staff', NULL, NULL, NULL, NULL, 0, 0, NULL, '2026-01-21 18:49:09', '2026-01-21 18:49:09'),
(3, 'charles flandez', 'charles.flandez@gmail.com', NULL, '$2y$12$VqvYNEpkTHJHPZC3RhUcQ.vqTcZhb/AibnFUXY1oy4HuSs2mr/OoS', NULL, NULL, NULL, NULL, NULL, 'member', NULL, NULL, NULL, NULL, 0, 0, NULL, '2026-01-21 22:43:16', '2026-01-21 22:43:16'),
(4, 'rawr raawr', 'rawr@gmail.com', NULL, '$2y$12$w7V44bPRiylvjkc8hPi.Cu7FTEBAytt5dWYgdEBdixjqLm3rRybVG', NULL, NULL, NULL, NULL, NULL, 'member', NULL, NULL, NULL, NULL, 0, 0, NULL, '2026-01-21 22:48:38', '2026-01-21 22:48:38'),
(6, 'Charles Flandez', 'flandez@gmail.com', NULL, '$2y$12$eUiT3dQWy.UURjDNeU3QoeCK2vOSXogFXzatXY3DobNuFIzjG28V.', NULL, NULL, NULL, NULL, NULL, 'admin', NULL, NULL, NULL, NULL, 0, 0, NULL, '2026-02-13 12:51:02', '2026-02-13 12:51:02'),
(7, 'Marie Anne Nicole A Ocampo', 'marieanne.nicole@gmail.com', NULL, '$2y$12$WhN/bRj9UeIFJIHlwshkv.sUl6Sui2ikl.zy.EJ0EwJGBBbfL7QuS', NULL, NULL, 'avatars/avatar_7_1772388926.jpg', '9123456789', 'Quezon City, Philippines', 'member', NULL, '2026-02-21 01:25:56', '2026-02-22 01:25:56', 'xOrKsg4a8dwXNW0SmPXg5E8hcWXHVKiu4aTever3NJW2VQz23AlLe1EWSMFdDNUd', 1, 0, '2026-02-28 07:53:24', '2026-02-21 01:25:56', '2026-03-01 18:15:26'),
(10, 'Charles C Flandez', 'charlesflandezz@gmail.com', NULL, '$2y$12$TlDezSq92rKyXhTRY1evee/i/HSAybqZyLTzwnEztG9jMw.B4P/1q', NULL, NULL, NULL, NULL, NULL, 'member', NULL, '2026-02-25 14:50:25', '2026-02-26 14:50:25', 'pT8CaXo9CbKPOZinYVZdsMn4QF24b4lDap0KTq3fOkkZRmbNXkyOOnGL0Lwdj5sw', 0, 1, NULL, '2026-02-25 14:19:29', '2026-02-25 14:50:25'),
(13, 'Berta S Mendoza', 'marieanne.nicole@yahoo.com', NULL, '$2y$12$zANtLkm9020pB.oO2JtI3.YUAVUwLpxsu2YRhn49u0oK3q8yDMAiq', NULL, NULL, NULL, NULL, NULL, 'member', NULL, NULL, NULL, NULL, 1, 0, '2026-02-25 17:58:04', '2026-02-25 17:53:59', '2026-02-25 17:58:04'),
(14, 'John Miguel B Taduran', 'johnmigueltaduran09@gmail.com', NULL, '$2y$12$bsirrvR32v1k2C82TA0ct.Trd8C694Cc/y2KEpeH84QntoU8zr9t6', NULL, NULL, NULL, NULL, NULL, 'member', NULL, NULL, NULL, NULL, 1, 0, '2026-02-28 05:19:47', '2026-02-28 05:18:36', '2026-02-28 05:19:47');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `announcements_created_by_foreign` (`created_by`);

--
-- Indexes for table `burial_records`
--
ALTER TABLE `burial_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `burial_records_plot_id_foreign` (`plot_id`);

--
-- Indexes for table `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `feedbacks_user_id_foreign` (`user_id`),
  ADD KEY `feedbacks_responded_by_foreign` (`responded_by`);

--
-- Indexes for table `invitations`
--
ALTER TABLE `invitations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invitations_token_unique` (`token`),
  ADD KEY `invitations_burial_record_id_foreign` (`burial_record_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payments_user_id_foreign` (`user_id`),
  ADD KEY `payments_plot_id_foreign` (`plot_id`),
  ADD KEY `payments_verified_by_foreign` (`verified_by`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `plots`
--
ALTER TABLE `plots`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plots_plot_number_unique` (`plot_number`),
  ADD KEY `plots_owner_id_foreign` (`owner_id`);

--
-- Indexes for table `qr_codes`
--
ALTER TABLE `qr_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `qr_codes_code_unique` (`code`),
  ADD KEY `qr_codes_burial_record_id_foreign` (`burial_record_id`);

--
-- Indexes for table `service_requests`
--
ALTER TABLE `service_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `service_requests_user_id_foreign` (`user_id`),
  ADD KEY `service_requests_processed_by_foreign` (`processed_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_invitation_token_unique` (`invitation_token`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `burial_records`
--
ALTER TABLE `burial_records`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `feedbacks`
--
ALTER TABLE `feedbacks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `invitations`
--
ALTER TABLE `invitations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;

--
-- AUTO_INCREMENT for table `plots`
--
ALTER TABLE `plots`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT for table `qr_codes`
--
ALTER TABLE `qr_codes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `service_requests`
--
ALTER TABLE `service_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `burial_records`
--
ALTER TABLE `burial_records`
  ADD CONSTRAINT `burial_records_plot_id_foreign` FOREIGN KEY (`plot_id`) REFERENCES `plots` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD CONSTRAINT `feedbacks_responded_by_foreign` FOREIGN KEY (`responded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `feedbacks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `invitations`
--
ALTER TABLE `invitations`
  ADD CONSTRAINT `invitations_burial_record_id_foreign` FOREIGN KEY (`burial_record_id`) REFERENCES `burial_records` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_plot_id_foreign` FOREIGN KEY (`plot_id`) REFERENCES `plots` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_verified_by_foreign` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `plots`
--
ALTER TABLE `plots`
  ADD CONSTRAINT `plots_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `qr_codes`
--
ALTER TABLE `qr_codes`
  ADD CONSTRAINT `qr_codes_burial_record_id_foreign` FOREIGN KEY (`burial_record_id`) REFERENCES `burial_records` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `service_requests`
--
ALTER TABLE `service_requests`
  ADD CONSTRAINT `service_requests_processed_by_foreign` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `service_requests_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
