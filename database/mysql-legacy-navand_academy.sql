-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 23, 2026 at 07:54 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `navand_academy`
--

-- --------------------------------------------------------

--
-- Table structure for table `app_state`
--

CREATE TABLE `app_state` (
  `id` varchar(50) NOT NULL,
  `state_json` longtext NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `app_state`
--

INSERT INTO `app_state` (`id`, `state_json`, `updated_at`) VALUES
('main', '{\"students\":[{\"firstName\":\"masih\",\"lastName\":\"sadri\",\"fatherName\":\"sadridin\",\"phone\":\"08986876587\",\"courseId\":\"C-201\",\"joinDate\":\"1405/03/18\",\"feePaid\":106,\"isActive\":true,\"id\":\"S-945\"},{\"id\":\"S-301\",\"firstName\":\"علی\",\"lastName\":\"رضایی\",\"fatherName\":\"عباس\",\"phone\":\"09181112222\",\"courseId\":\"C-201\",\"joinDate\":\"1405/01/15\",\"feePaid\":1800000,\"isActive\":true},{\"id\":\"S-302\",\"firstName\":\"مریم\",\"lastName\":\"احمدی\",\"fatherName\":\"رضا\",\"phone\":\"09183334444\",\"courseId\":\"C-202\",\"joinDate\":\"1405/01/18\",\"feePaid\":3200000,\"isActive\":true},{\"id\":\"S-303\",\"firstName\":\"سهراب\",\"lastName\":\"حسینی\",\"fatherName\":\"احمد\",\"phone\":\"09185556666\",\"courseId\":\"C-201\",\"joinDate\":\"1405/02/01\",\"feePaid\":1200000,\"isActive\":true},{\"id\":\"S-304\",\"firstName\":\"سارا\",\"lastName\":\"امیری\",\"fatherName\":\"محمود\",\"phone\":\"09187778888\",\"courseId\":\"C-203\",\"joinDate\":\"1405/02/10\",\"feePaid\":0,\"isActive\":true},{\"id\":\"S-305\",\"firstName\":\"محمد\",\"lastName\":\"محمدی\",\"fatherName\":\"حسین\",\"phone\":\"09189990000\",\"courseId\":\"C-204\",\"joinDate\":\"1405/02/12\",\"feePaid\":2000000,\"isActive\":true},{\"id\":\"S-306\",\"firstName\":\"نرگس\",\"lastName\":\"حسنی\",\"fatherName\":\"قاسم\",\"phone\":\"09182223333\",\"courseId\":\"C-205\",\"joinDate\":\"1405/02/15\",\"feePaid\":3000000,\"isActive\":true},{\"id\":\"S-307\",\"firstName\":\"امیرحسین\",\"lastName\":\"زارعی\",\"fatherName\":\"حامد\",\"phone\":\"09124445555\",\"courseId\":\"C-202\",\"joinDate\":\"1405/02/20\",\"feePaid\":3200000,\"isActive\":false},{\"id\":\"S-308\",\"firstName\":\"الهام\",\"lastName\":\"حیدری\",\"fatherName\":\"جعفر\",\"phone\":\"09126667777\",\"courseId\":\"C-203\",\"joinDate\":\"1405/03/01\",\"feePaid\":2500000,\"isActive\":true}],\"teachers\":[{\"id\":\"T-101\",\"firstName\":\"مرتضی\",\"lastName\":\"جلالی\",\"specialty\":\"برنامه‌نویسی و هوش مصنوعی\",\"phone\":\"09123456789\",\"salary\":28000000,\"hireDate\":\"1404/02/10\",\"isActive\":true},{\"id\":\"T-102\",\"firstName\":\"سارا\",\"lastName\":\"خسروی\",\"specialty\":\"طراحی وب و UI/UX\",\"phone\":\"09129876543\",\"salary\":24000000,\"hireDate\":\"1404/05/15\",\"isActive\":true},{\"id\":\"T-103\",\"firstName\":\"امیر\",\"lastName\":\"علیزاده\",\"specialty\":\"ریاضیات و فیزیک کنکور\",\"phone\":\"09121112233\",\"salary\":22000000,\"hireDate\":\"1404/01/20\",\"isActive\":true},{\"id\":\"T-104\",\"firstName\":\"مهناز\",\"lastName\":\"کریمی\",\"specialty\":\"زبان انگلیسی تخصصی\",\"phone\":\"09125556677\",\"salary\":20000000,\"hireDate\":\"1404/09/01\",\"isActive\":false}],\"courses\":[{\"id\":\"C-201\",\"name\":\"برنامه‌نویسی پایتون مقدماتی\",\"teacherId\":\"T-101\",\"duration\":\"۳ ماه\",\"monthlyFee\":1800000,\"level\":\"مقدماتی\"},{\"id\":\"C-202\",\"name\":\"مهندسی وب با React (پیشرفته)\",\"teacherId\":\"T-102\",\"duration\":\"۴ ماه\",\"monthlyFee\":3200000,\"level\":\"پیشرفته\"},{\"id\":\"C-203\",\"name\":\"ریاضیات گسسته و کنکور\",\"teacherId\":\"T-103\",\"duration\":\"۵ ماه\",\"monthlyFee\":2500000,\"level\":\"پیشرفته\"},{\"id\":\"C-204\",\"name\":\"طراحی گرافیک با فتوشاپ و ایلاستریتور\",\"teacherId\":\"T-102\",\"duration\":\"۲ ماه\",\"monthlyFee\":2000000,\"level\":\"متوسط\"},{\"id\":\"C-205\",\"name\":\"زبان انگلیسی General (IELTS)\",\"teacherId\":\"T-104\",\"duration\":\"۶ ماه\",\"monthlyFee\":3000000,\"level\":\"متوسط\"}],\"payments\":[{\"id\":\"PAY-1001\",\"studentId\":\"S-301\",\"month\":\"خرداد ۱۴۰۵\",\"totalAmount\":1800000,\"paidAmount\":1800000,\"remainingAmount\":0,\"paymentDate\":\"1405/03/05\",\"status\":\"completed\"},{\"id\":\"PAY-1002\",\"studentId\":\"S-302\",\"month\":\"خرداد ۱۴۰۵\",\"totalAmount\":3200000,\"paidAmount\":3200000,\"remainingAmount\":0,\"paymentDate\":\"1405/03/08\",\"status\":\"completed\"},{\"id\":\"PAY-1003\",\"studentId\":\"S-303\",\"month\":\"خرداد ۱۴۰۵\",\"totalAmount\":1800000,\"paidAmount\":1200000,\"remainingAmount\":600000,\"paymentDate\":\"1405/03/10\",\"status\":\"partial\"},{\"id\":\"PAY-1004\",\"studentId\":\"S-304\",\"month\":\"خرداد ۱۴۰۵\",\"totalAmount\":2500000,\"paidAmount\":0,\"remainingAmount\":2500000,\"paymentDate\":\"--/--/--\",\"status\":\"unpaid\"},{\"id\":\"PAY-1005\",\"studentId\":\"S-305\",\"month\":\"خرداد ۱۴۰۵\",\"totalAmount\":2000000,\"paidAmount\":2000000,\"remainingAmount\":0,\"paymentDate\":\"1405/03/12\",\"status\":\"completed\"},{\"id\":\"PAY-1006\",\"studentId\":\"S-306\",\"month\":\"خرداد ۱۴۰۵\",\"totalAmount\":3000000,\"paidAmount\":3000000,\"remainingAmount\":0,\"paymentDate\":\"1405/03/14\",\"status\":\"completed\"},{\"id\":\"PAY-1007\",\"studentId\":\"S-308\",\"month\":\"خرداد ۱۴۰۵\",\"totalAmount\":2500000,\"paidAmount\":2500000,\"remainingAmount\":0,\"paymentDate\":\"1405/03/15\",\"status\":\"completed\"}],\"expenses\":[{\"id\":\"EXP-401\",\"title\":\"خرید تجهیزات شبکه و مودم اداری\",\"category\":\"خرید لوازم اداری\",\"amount\":5500000,\"date\":\"1405/03/02\",\"paidTo\":\"دیجی‌تک پلاس\",\"description\":\"خرید روتر میکروتیک و تجهیزات جانبی اینترنت دفتر مرکزی\"},{\"id\":\"EXP-402\",\"title\":\"اجاره‌بهای خرداد ماه ساختمان کلاس‌ها\",\"category\":\"اجاره و آبونمان\",\"amount\":15000000,\"date\":\"1405/03/05\",\"paidTo\":\"حاج‌اصغر احمدی\",\"description\":\"اجاره طبقه اول ساختمان ناوند\"},{\"id\":\"EXP-403\",\"title\":\"قبض برق و اشتراک آب آکادمی\",\"category\":\"اجاره و آبونمان\",\"amount\":1800000,\"date\":\"1405/03/10\",\"paidTo\":\"سازمان توزیع نیرو برق\",\"description\":\"قبض مصرفی دوره اردیبهشت-خرداد\"},{\"id\":\"EXP-404\",\"title\":\"هزینه چاپ بروشور و تراکت‌های تبلیغاتی\",\"category\":\"تبلیغات و بازاریابی\",\"amount\":4200000,\"date\":\"1405/03/12\",\"paidTo\":\"چاپخانه بهاران\",\"description\":\"تبلیغ ترم تابستانه آکادمی ناوند دسکتاپ\"}],\"incomes\":[{\"id\":\"INC-501\",\"title\":\"فروش جزوه و کتاب‌های تخصصی IELTS\",\"source\":\"بخش نشر منابع آموزشی\",\"amount\":6800000,\"date\":\"1405/03/06\",\"description\":\"فروش بیش از ۲۰ جلد پکیج خودآموز آیلتس آکادمی به دانشجویان آزاد\"},{\"id\":\"INC-502\",\"title\":\"درآمد حاصل از اجاره سالن همایش برای وبینار\",\"source\":\"اجاره زیرساخت‌ها\",\"amount\":9500000,\"date\":\"1405/03/11\",\"description\":\"اجاره فضای ویدئو کنفرانس آکادمی به دانشگاه اصفهان\"}],\"exams\":[{\"id\":\"EXM-601\",\"title\":\"آزمون میان‌ترم پایتون مقدماتی\",\"courseId\":\"C-201\",\"date\":\"1405/03/10\",\"totalScore\":100},{\"id\":\"EXM-602\",\"title\":\"پروژه پایانی مهندسی وب با React\",\"courseId\":\"C-202\",\"date\":\"1405/03/15\",\"totalScore\":20},{\"id\":\"EXM-603\",\"title\":\"کوئیز اول ریاضیات گسسته\",\"courseId\":\"C-203\",\"date\":\"1405/03/08\",\"totalScore\":15}],\"results\":[{\"id\":\"RES-701\",\"studentId\":\"S-301\",\"examId\":\"EXM-601\",\"score\":92,\"grade\":\"عالی\",\"description\":\"عملکرد فوق‌العاده در بخش برنامه‌نویسی شی‌گرا\"},{\"id\":\"RES-702\",\"studentId\":\"S-303\",\"examId\":\"EXM-601\",\"score\":75,\"grade\":\"خوب\",\"description\":\"نیازمند تمرین بیشتر در بخش ساختار داده‌ها\"},{\"id\":\"RES-704\",\"studentId\":\"S-302\",\"examId\":\"EXM-602\",\"score\":19.5,\"grade\":\"عالی\",\"description\":\"طراحی عالی کامپوننت‌ها و پیاده‌سازی کامل API\"},{\"id\":\"RES-705\",\"studentId\":\"S-304\",\"examId\":\"EXM-603\",\"score\":14,\"grade\":\"عالی\",\"description\":\"درک فوق‌العاده مفاهیم منطق گراف\"},{\"id\":\"RES-706\",\"studentId\":\"S-308\",\"examId\":\"EXM-603\",\"score\":11,\"grade\":\"خوب\",\"description\":\"پاسخ جزئی در سؤال تشریحی ترکیبیات\"}]}', '2026-06-21 10:32:13');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `teacher_id` varchar(50) NOT NULL,
  `duration` varchar(100) NOT NULL,
  `monthly_fee` decimal(15,2) NOT NULL DEFAULT 0.00,
  `level` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `name`, `teacher_id`, `duration`, `monthly_fee`, `level`, `created_at`, `updated_at`) VALUES
('C-201', 'برنامه‌نویسی پایتون مقدماتی', 'T-101', '۳ ماه', 1800000.00, 'مقدماتی', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('C-202', 'مهندسی وب با React (پیشرفته)', 'T-102', '۴ ماه', 3200000.00, 'پیشرفته', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('C-203', 'ریاضیات گسسته و کنکور', 'T-103', '۵ ماه', 2500000.00, 'پیشرفته', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('C-204', 'طراحی گرافیک با فتوشاپ و ایلاستریتور', 'T-102', '۲ ماه', 2000000.00, 'متوسط', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('C-205', 'زبان انگلیسی General (IELTS)', 'T-104', '۶ ماه', 3000000.00, 'متوسط', '2026-06-21 13:11:23', '2026-06-21 13:11:23');

-- --------------------------------------------------------

--
-- Table structure for table `exams`
--

CREATE TABLE `exams` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `course_id` varchar(50) NOT NULL,
  `date` varchar(50) NOT NULL,
  `total_score` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `exams`
--

INSERT INTO `exams` (`id`, `title`, `course_id`, `date`, `total_score`, `created_at`, `updated_at`) VALUES
('EXM-601', 'آزمون میان‌ترم پایتون مقدماتی', 'C-201', '1405/03/10', 100.00, '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('EXM-602', 'پروژه پایانی مهندسی وب با React', 'C-202', '1405/03/15', 20.00, '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('EXM-603', 'کوئیز اول ریاضیات گسسته', 'C-203', '1405/03/08', 15.00, '2026-06-21 13:11:23', '2026-06-21 13:11:23');

-- --------------------------------------------------------

--
-- Table structure for table `exam_results`
--

CREATE TABLE `exam_results` (
  `id` varchar(50) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `exam_id` varchar(50) NOT NULL,
  `score` decimal(10,2) NOT NULL DEFAULT 0.00,
  `grade` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `exam_results`
--

INSERT INTO `exam_results` (`id`, `student_id`, `exam_id`, `score`, `grade`, `description`, `created_at`, `updated_at`) VALUES
('RES-701', 'S-301', 'EXM-601', 92.00, 'عالی', 'عملکرد فوق‌العاده در بخش برنامه‌نویسی شی‌گرا', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('RES-702', 'S-303', 'EXM-601', 75.00, 'خوب', 'نیازمند تمرین بیشتر در بخش ساختار داده‌ها', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('RES-704', 'S-302', 'EXM-602', 19.50, 'عالی', 'طراحی عالی کامپوننت‌ها و پیاده‌سازی کامل API', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('RES-705', 'S-304', 'EXM-603', 14.00, 'عالی', 'درک فوق‌العاده مفاهیم منطق گراف', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('RES-706', 'S-308', 'EXM-603', 11.00, 'خوب', 'پاسخ جزئی در سؤال تشریحی ترکیبیات', '2026-06-21 13:11:23', '2026-06-21 13:11:23');

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(150) NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `date` varchar(50) NOT NULL,
  `paid_to` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`id`, `title`, `category`, `amount`, `date`, `paid_to`, `description`, `created_at`, `updated_at`) VALUES
('EXP-401', 'خرید تجهیزات شبکه و مودم اداری', 'خرید لوازم اداری', 5500000.00, '1405/03/02', 'دیجی‌تک پلاس', 'خرید روتر میکروتیک و تجهیزات جانبی اینترنت دفتر مرکزی', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('EXP-402', 'اجاره‌بهای خرداد ماه ساختمان کلاس‌ها', 'اجاره و آبونمان', 15000000.00, '1405/03/05', 'حاج‌اصغر احمدی', 'اجاره طبقه اول ساختمان ناوند', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('EXP-403', 'قبض برق و اشتراک آب آکادمی', 'اجاره و آبونمان', 1800000.00, '1405/03/10', 'سازمان توزیع نیرو برق', 'قبض مصرفی دوره اردیبهشت-خرداد', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('EXP-404', 'هزینه چاپ بروشور و تراکت‌های تبلیغاتی', 'تبلیغات و بازاریابی', 4200000.00, '1405/03/12', 'چاپخانه بهاران', 'تبلیغ ترم تابستانه آکادمی ناوند دسکتاپ', '2026-06-21 13:11:23', '2026-06-21 13:11:23');

-- --------------------------------------------------------

--
-- Table structure for table `incomes`
--

CREATE TABLE `incomes` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `source` varchar(150) NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `date` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `incomes`
--

INSERT INTO `incomes` (`id`, `title`, `source`, `amount`, `date`, `description`, `created_at`, `updated_at`) VALUES
('INC-501', 'فروش جزوه و کتاب‌های تخصصی IELTS', 'بخش نشر منابع آموزشی', 6800000.00, '1405/03/06', 'فروش بیش از ۲۰ جلد پکیج خودآموز آیلتس آکادمی به دانشجویان آزاد', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('INC-502', 'درآمد حاصل از اجاره سالن همایش برای وبینار', 'اجاره زیرساخت‌ها', 9500000.00, '1405/03/11', 'اجاره فضای ویدئو کنفرانس آکادمی به دانشگاه اصفهان', '2026-06-21 13:11:23', '2026-06-21 13:11:23');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` varchar(50) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `month` varchar(100) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `remaining_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `payment_date` varchar(50) NOT NULL,
  `status` enum('completed','partial','unpaid') NOT NULL DEFAULT 'unpaid',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `student_id`, `month`, `total_amount`, `paid_amount`, `remaining_amount`, `payment_date`, `status`, `created_at`, `updated_at`) VALUES
('PAY-1001', 'S-301', 'خرداد ۱۴۰۵', 1800000.00, 1800000.00, 0.00, '1405/03/05', 'completed', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('PAY-1002', 'S-302', 'خرداد ۱۴۰۵', 3200000.00, 3200000.00, 0.00, '1405/03/08', 'completed', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('PAY-1003', 'S-303', 'خرداد ۱۴۰۵', 1800000.00, 1200000.00, 600000.00, '1405/03/10', 'partial', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('PAY-1004', 'S-304', 'خرداد ۱۴۰۵', 2500000.00, 0.00, 2500000.00, '--/--/--', 'unpaid', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('PAY-1005', 'S-305', 'خرداد ۱۴۰۵', 2000000.00, 2000000.00, 0.00, '1405/03/12', 'completed', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('PAY-1006', 'S-306', 'خرداد ۱۴۰۵', 3000000.00, 3000000.00, 0.00, '1405/03/14', 'completed', '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('PAY-1007', 'S-308', 'خرداد ۱۴۰۵', 2500000.00, 2500000.00, 0.00, '1405/03/15', 'completed', '2026-06-21 13:11:23', '2026-06-21 13:11:23');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `father_name` varchar(100) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `course_id` varchar(50) NOT NULL,
  `join_date` varchar(50) NOT NULL,
  `fee_paid` decimal(15,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `first_name`, `last_name`, `father_name`, `phone`, `course_id`, `join_date`, `fee_paid`, `is_active`, `created_at`, `updated_at`) VALUES
('S-301', 'علی', 'رضایی', 'عباس', '09181112222', 'C-201', '1405/01/15', 1800000.00, 1, '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('S-302', 'مریم', 'احمدی', 'رضا', '09183334444', 'C-202', '1405/01/18', 3200000.00, 1, '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('S-303', 'سهراب', 'حسینی', 'احمد', '09185556666', 'C-201', '1405/02/01', 1200000.00, 1, '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('S-304', 'سارا', 'امیری', 'محمود', '09187778888', 'C-203', '1405/02/10', 0.00, 1, '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('S-305', 'محمد', 'محمدی', 'حسین', '09189990000', 'C-204', '1405/02/12', 2000000.00, 1, '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('S-306', 'نرگس', 'حسنی', 'قاسم', '09182223333', 'C-205', '1405/02/15', 3000000.00, 1, '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('S-307', 'امیرحسین', 'زارعی', 'حامد', '09124445555', 'C-202', '1405/02/20', 3200000.00, 0, '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('S-308', 'الهام', 'حیدری', 'جعفر', '09126667777', 'C-203', '1405/03/01', 2500000.00, 1, '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('S-945', 'masih', 'sadri', 'sadridin', '08986876587', 'C-201', '1405/03/18', 106.00, 1, '2026-06-21 13:11:23', '2026-06-21 13:11:23');

-- --------------------------------------------------------

--
-- Table structure for table `teacher`
--

CREATE TABLE `teacher` (
  `t_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `salary` int(11) DEFAULT 0,
  `hire_date` date DEFAULT NULL,
  `status` varchar(15) DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

CREATE TABLE `teachers` (
  `id` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `specialty` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `salary` decimal(15,2) NOT NULL DEFAULT 0.00,
  `hire_date` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`id`, `first_name`, `last_name`, `specialty`, `phone`, `salary`, `hire_date`, `is_active`, `created_at`, `updated_at`) VALUES
('T-101', 'مرتضی', 'جلالی', 'برنامه‌نویسی و هوش مصنوعی', '09123456789', 28000000.00, '1404/02/10', 1, '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('T-102', 'سارا', 'خسروی', 'طراحی وب و UI/UX', '09129876543', 24000000.00, '1404/05/15', 1, '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('T-103', 'امیر', 'علیزاده', 'ریاضیات و فیزیک کنکور', '09121112233', 22000000.00, '1404/01/20', 1, '2026-06-21 13:11:23', '2026-06-21 13:11:23'),
('T-104', 'مهناز', 'کریمی', 'زبان انگلیسی تخصصی', '09125556677', 20000000.00, '1404/09/01', 0, '2026-06-21 13:11:23', '2026-06-21 13:11:23');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` varchar(20) DEFAULT 'کاربر',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `app_state`
--
ALTER TABLE `app_state`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `exams`
--
ALTER TABLE `exams`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `exam_results`
--
ALTER TABLE `exam_results`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `incomes`
--
ALTER TABLE `incomes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `teacher`
--
ALTER TABLE `teacher`
  ADD PRIMARY KEY (`t_id`);

--
-- Indexes for table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `teacher`
--
ALTER TABLE `teacher`
  MODIFY `t_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
