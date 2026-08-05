-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: adc_careers
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_id` int NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expected_salary` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `note` text COLLATE utf8mb4_unicode_ci,
  `cv_original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_mime_type` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_size` int DEFAULT NULL,
  `status` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT 'new',
  `cv_storage_provider` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT 'local',
  `cv_drive_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_drive_item_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_web_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_onedrive_path` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_external_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_external_parent_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_external_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_storage_path` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `job_id` (`job_id`),
  CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
INSERT INTO `applications` VALUES (1,1,'Chí','chi123@ou.edu.vn','0379038920','100',NULL,'2026-05-25 08:53:44',NULL,'1779699224672-report-y26-w01.pdf.pdf','1779699224672-report-y26-w01.pdf.pdf','/uploads/cvs/1779699224672-report-y26-w01.pdf.pdf','application/pdf',392180,'new','local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,1,'A','dangminh1906@gmail.com','0379038920','19',NULL,'2026-05-26 07:45:19','aaa','ADC-Tqqqemplate PDX.pdf','1779781516513-d9cca5c7-80ce-4b38-9c55-86be9e6d20fd-adc-tqqqemplate-pdx.pdf',NULL,'application/pdf',256786,'new','google_drive',NULL,'1vHQZ_1-lomBKScwJeiuHYiCn-EIlq4bg','https://drive.google.com/file/d/1vHQZ_1-lomBKScwJeiuHYiCn-EIlq4bg/view?usp=drivesdk',NULL,'1vHQZ_1-lomBKScwJeiuHYiCn-EIlq4bg','1pwoFhvx9ZhBl4fqAfbqi9Bx1anpsmTdK','https://drive.google.com/file/d/1vHQZ_1-lomBKScwJeiuHYiCn-EIlq4bg/view?usp=drivesdk','2026/05/1779781516513-d9cca5c7-80ce-4b38-9c55-86be9e6d20fd-adc-tqqqemplate-pdx.pdf'),(3,2,'Chí Đặng Minh','Chi.Dang@asiadragoncordage.com','+84379038920','100000',NULL,'2026-05-26 07:48:20','sjkdhckjáhdjk','ADC-Templ22ate PDX.pdf','1779781697070-3bf9ff5d-62aa-485e-89bd-4c9b2f103bb5-adc-templ22ate-pdx.pdf',NULL,'application/pdf',256801,'new','google_drive',NULL,'1rA5nc_PuOT9DSs5m0Tml84-EgqVBeoTv','https://drive.google.com/file/d/1rA5nc_PuOT9DSs5m0Tml84-EgqVBeoTv/view?usp=drivesdk',NULL,'1rA5nc_PuOT9DSs5m0Tml84-EgqVBeoTv','1pwoFhvx9ZhBl4fqAfbqi9Bx1anpsmTdK','https://drive.google.com/file/d/1rA5nc_PuOT9DSs5m0Tml84-EgqVBeoTv/view?usp=drivesdk','2026/05/1779781697070-3bf9ff5d-62aa-485e-89bd-4c9b2f103bb5-adc-templ22ate-pdx.pdf'),(4,4,'Chi Dang Minh','dangminhchi20041906@gmail.com','+84379038920','100000',NULL,'2026-05-26 08:15:11','ềvsdfv','final_file1.docx','1779783306848-bb955ea0-7d99-409c-9964-90f567589b20-final-file1.docx',NULL,'application/vnd.openxmlformats-officedocument.wordprocessingml.document',33842,'new','google_drive',NULL,'106I-BnCcFswsmbP2IPPpWFiZNISpslBn','https://docs.google.com/document/d/106I-BnCcFswsmbP2IPPpWFiZNISpslBn/edit?usp=drivesdk&ouid=107075406929562545546&rtpof=true&sd=true',NULL,'106I-BnCcFswsmbP2IPPpWFiZNISpslBn','1pwoFhvx9ZhBl4fqAfbqi9Bx1anpsmTdK','https://docs.google.com/document/d/106I-BnCcFswsmbP2IPPpWFiZNISpslBn/edit?usp=drivesdk&ouid=107075406929562545546&rtpof=true&sd=true','2026/05/1779783306848-bb955ea0-7d99-409c-9964-90f567589b20-final-file1.docx');
/*!40000 ALTER TABLE `applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vn` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dept` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `urgent` tinyint(1) DEFAULT '0',
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#2196F3',
  `reqs` json NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
INSERT INTO `jobs` VALUES (1,'Head of Production','Giám đốc Sản xuất','Khối Vận hành','Senior Leadership','P.TGĐ Vận hành',1,'#E8363A','[\"10+ năm quản lý sản xuất quy mô lớn, ưu tiên môi trường trên 300 công nhân.\", \"Kinh nghiệm quản lý đa nhà máy, thiết lập KPI và cải tiến năng suất.\", \"Ngành nhựa, polymer hoặc extrusion là lợi thế lớn.\", \"Thành thạo SAP, Lean, 5S, Kaizen và tiếng Anh giao tiếp tốt.\"]','active','2026-05-25 08:53:16'),(2,'Head of P&O','Giám đốc Nhân sự & Tổ chức','People & Organization','Senior Leadership','CEO',1,'#F57C22','[\"7+ năm kinh nghiệm HR management, ưu tiên ngành sản xuất.\", \"Có kinh nghiệm xây dựng hệ thống HR từ nền tảng đến vận hành.\", \"Hiểu Employer Branding, Organization Development, C&B và L&D.\", \"Tiếng Anh tốt, tư duy hệ thống và khả năng đồng hành với business.\"]','active','2026-05-25 08:53:16'),(3,'International Sales Manager','Trưởng phòng Kinh doanh Quốc tế','Kinh doanh','Management','CEO',1,'#FFB900','[\"7+ năm B2B sales trong sản xuất hoặc xuất khẩu.\", \"Có network khách hàng tại Mỹ, Úc hoặc EU là lợi thế.\", \"Tiếng Anh thành thạo, đàm phán tốt và quen làm việc theo mục tiêu doanh số.\", \"Kinh nghiệm Salesforce CRM hoặc quy trình sales pipeline chuyên nghiệp.\"]','active','2026-05-25 08:53:16'),(4,'Head of Production Planning','Trưởng phòng Kế hoạch Sản xuất','Khối Vận hành','Management','P.TGĐ Vận hành',0,'#4CAF50','[\"7+ năm kinh nghiệm planning trong môi trường sản xuất.\", \"Thành thạo SAP PP/MM, MRP, S&OP và phối hợp liên phòng ban.\", \"Có tư duy dữ liệu, Power BI là lợi thế.\", \"Khả năng cân bằng năng lực sản xuất, tồn kho và cam kết giao hàng.\"]','active','2026-05-25 08:53:16'),(5,'Automation Engineer','Kỹ sư Tự động hóa','Kỹ thuật','Specialist','Head of Production',0,'#2196F3','[\"3+ năm kinh nghiệm PLC, SCADA, HMI hoặc hệ thống điều khiển công nghiệp.\", \"Từng làm việc với máy móc châu Âu là lợi thế.\", \"Có khả năng phân tích lỗi, cải tiến thiết bị và phối hợp với sản xuất.\", \"Sẵn sàng học hỏi từ nhà cung cấp máy móc quốc tế.\"]','active','2026-05-25 08:53:16'),(6,'Senior Sales Executive','Chuyên viên Kinh doanh Cấp cao','Kinh doanh','Senior','Sales Manager',0,'#9c27b0','[\"3-5 năm sales B2B, ưu tiên export hoặc manufacturing.\", \"Tiếng Anh tốt, có khả năng chăm sóc khách hàng quốc tế.\", \"Theo sát pipeline, báo cáo rõ ràng và chủ động mở rộng cơ hội.\", \"Tinh thần bền bỉ, chịu trách nhiệm với mục tiêu doanh số.\"]','closed','2026-05-25 08:53:16');
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

ALTER TABLE `jobs`
  ADD COLUMN `slug` varchar(180) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `summary` text COLLATE utf8mb4_unicode_ci,
  ADD COLUMN `employment_type` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT 'Full-time',
  ADD COLUMN `work_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'KCN Tan Tao, Binh Tan, TP.HCM',
  ADD COLUMN `location_short` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'TP.HCM',
  ADD COLUMN `salary_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Thoa thuan theo nang luc',
  ADD COLUMN `deadline` date DEFAULT NULL,
  ADD COLUMN `quantity` int DEFAULT '1',
  ADD COLUMN `age_range` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `gender` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `experience_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `industry` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `published_at` date DEFAULT NULL,
  ADD COLUMN `responsibilities` json DEFAULT NULL,
  ADD COLUMN `requirements_detail` json DEFAULT NULL,
  ADD COLUMN `benefits` json DEFAULT NULL,
  ADD COLUMN `environment_sections` json DEFAULT NULL,
  ADD COLUMN `display_mode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'standard',
  ADD COLUMN `poster_image` longblob DEFAULT NULL,
  ADD COLUMN `poster_mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `poster_size` int DEFAULT NULL,
  ADD UNIQUE KEY `slug` (`slug`);

UPDATE `jobs`
SET
  `slug` = LOWER(REPLACE(REPLACE(REPLACE(`title`, '&', 'and'), ' ', '-'), '/', '-')),
  `summary` = CONCAT('Co hoi dong hanh cung ADC trong vai tro ', `vn`, ', tap trung vao ket qua, nang luc chuyen mon va tinh than cai tien lien tuc.'),
  `employment_type` = 'Full-time',
  `work_location` = 'KCN Tan Tao, Binh Tan, TP.HCM',
  `location_short` = 'TP.HCM',
  `salary_text` = 'Thoa thuan theo nang luc',
  `quantity` = 1,
  `experience_text` = JSON_UNQUOTE(JSON_EXTRACT(`reqs`, '$[0]')),
  `industry` = `dept`,
  `responsibilities` = JSON_ARRAY(
    CONCAT('Dam nhan cac nhiem vu chuyen mon cua vi tri ', `title`, '.'),
    'Phoi hop voi cac phong ban lien quan de dam bao tien do va chat luong cong viec.',
    'Theo doi chi so, bao cao ket qua va de xuat giai phap cai tien.',
    'Chuan hoa tai lieu, quy trinh va chia se tri thuc trong pham vi phu trach.'
  ),
  `requirements_detail` = `reqs`,
  `benefits` = JSON_ARRAY(
    JSON_OBJECT('icon', '*', 'text', 'Dao tao va phat trien chuyen mon'),
    JSON_OBJECT('icon', '*', 'text', 'Luong canh tranh theo nang luc'),
    JSON_OBJECT('icon', '*', 'text', 'Bao hiem va phuc loi theo quy dinh'),
    JSON_OBJECT('icon', '*', 'text', 'Com trua va cac chinh sach cham soc nhan vien'),
    JSON_OBJECT('icon', '*', 'text', 'Co hoi tham gia du an cai tien va chuyen doi so'),
    JSON_OBJECT('icon', '*', 'text', 'Moi truong san xuat hien dai, thuc chien')
  ),
  `environment_sections` = JSON_ARRAY(
    JSON_OBJECT('title', 'Nha may hien dai', 'content', 'ADC van hanh he thong nha may tai KCN Tan Tao voi may moc cong nghe tu nhieu quoc gia.'),
    JSON_OBJECT('title', 'Chuyen doi so manh me', 'content', 'Moi truong ung dung SAP HANA, Salesforce CRM, Office 365, Power BI va Automation.'),
    JSON_OBJECT('title', 'Van hoa cai tien', 'content', 'ADC khuyen khich su chu dong, tinh than hoc hoi va nang luc tao gia tri ben vung.')
  );

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'adc_careers'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-27 15:09:09
