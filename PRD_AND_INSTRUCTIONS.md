# Project Specification: Full-Stack Recruitment Website (ADC Careers)

## 1. Project Overview & Goal
We are building a basic full-stack recruitment website for **Asia Dragon Capital (ADC)**. 
- **For Candidates:** View active job openings, filter jobs by department, click to expand job details, fill out an application form (Modal), and download a generated PDF receipt upon successful submission.
- **For Admin:** Log in to a secure dashboard to perform CRUD operations (Create, Read, Update, Delete) on job positions.

---

## 2. Tech Stack
- **Frontend:** Vanilla HTML, CSS, JavaScript (based on the provided single-page design).
- **Backend:** Node.js + Express.js.
- **Database:** MySQL (running on localhost).
- **Libraries/Packages Needed:**
  - `express`, `cors`, `dotenv`
  - `mysql2` (for database connection pooling with Promise support)
  - `pdfkit` or `html-pdf` (for backend PDF generation) OR `html2pdf.js` / `jspdf` (for frontend PDF generation). Let's implement Frontend-based PDF generation for simpler local execution, or Backend-based if required. *Prefer Backend PDF generation using `pdfkit` for better security and data persistence.*

---

## 3. Project Directory Structure
```text
adc-careers/
├── backend/
│   ├── config/
│   │   └── db.js             # MySQL Connection Pool
│   ├── controllers/
│   │   ├── jobController.js  # Job CRUD logic
│   │   ├── applyController.js# Application submission & PDF generation
│   │   └── authController.js # Admin authentication
│   ├── models/
│   │   ├── jobModel.js       # SQL Queries for Jobs
│   │   ├── applyModel.js     # SQL Queries for Applications
│   │   └── userModel.js      # SQL Queries for Admin Users
│   ├── routes/
│   │   ├── jobRoutes.js
│   │   ├── applyRoutes.js
│   │   └── authRoutes.js
│   ├── middlewares/
│   │   └── authMiddleware.js # Protect Admin routes
│   └── server.js             # Entry point
├── frontend/
│   ├── index.html            # Candidate main page (Modified to fetch dynamic data)
│   ├── admin.html            # Admin dashboard (Manage jobs, view applications)
│   ├── login.html            # Admin login page
│   └── js/
│       ├── main.js           # Client-side dynamic rendering & application handling
│       └── admin.js          # Admin dashboard interactions
├── .env                      # Environment variables
└── package.json

4. Database Schema (MySQL)
CREATE DATABASE IF NOT EXISTS adc_careers;
USE adc_careers;

-- 1. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    vn VARCHAR(255) NOT NULL,
    dept VARCHAR(100) NOT NULL,
    level VARCHAR(100) NOT NULL,
    report VARCHAR(100) NOT NULL,
    urgent TINYINT(1) DEFAULT 0,
    color VARCHAR(7) DEFAULT '#2196F3',
    reqs JSON NOT NULL, -- Stores array of requirements e.g., ["Req 1", "Req 2"]
    status VARCHAR(20) DEFAULT 'active', -- active, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    expected_salary VARCHAR(100),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- 3. Admin Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

5. API Endpoints Required
Public Endpoints (Candidates)
GET /api/jobs -> Fetch all jobs where status = 'active'.

POST /api/apply -> Submit candidate details (saves to applications table) and returns a generated PDF stream/file as an application receipt.

Auth Endpoints
POST /api/auth/login -> Verify admin credentials, return JWT token or session.

Protected Endpoints (Admin Only - Requires Auth Middleware)
GET /api/admin/jobs -> Fetch all jobs (both active and closed).

POST /api/admin/jobs -> Create a new job position.

PUT /api/admin/jobs/:id -> Update an existing job.

DELETE /api/admin/jobs/:id -> Delete a job.

GET /api/admin/applications -> Fetch list of all candidates who applied.

6. Frontend Integration Guidelines
1. Update index.html to be Dynamic:
Remove the hardcoded const positions = [...] array from the <script> tag.

Implement an async function fetchPositions() that targets GET /api/jobs.

Dynamically build the depts array based on the fetched data: ["all", ...new Set(positions.map(p => p.dept))].

Maintain the exact CSS styles, layout, and HTML structure provided in the initial template.

2. Application Form Modal:
Modify the "ỨNG TUYỂN NGAY →" button inside the job accordion expansion. Instead of a mailto: link, it must trigger a CSS/JS Popup Modal Form.

The form should capture: Full Name, Email, Phone Number, and Expected Salary.

When submitted, send a JSON payload to POST /api/apply. On success, trigger a browser download of the returned PDF receipt.

3. Admin Panel (admin.html):
Create a clean layout utilizing the brand colors defined in the root (--navy, --gold, etc.).

Provide a form to insert a job (Input fields for Title, VN Title, Department, Level, Report To, Color Picker, Urgent checkbox, and a dynamic list input for Requirements).

Display a table of current jobs with edit/delete actions and a table of applicants showing who applied for which position.

7. Execution Steps for AI Coder
Initialize the project: Create package.json and install dependencies.

Setup DB Config: Write backend/config/db.js using mysql2/promise connection pool using .env configurations.

Build Models & Controllers: Write the SQL query wrappers and controller logic for handling requests.

Implement PDF Generator: Write a utility function using pdfkit that structures an elegant PDF document titled "BIÊN NHẬN ỨNG TUYỂN - ADC CAREERS" containing candidate confirmation data and corporation details.

Connect Routes: Wire up all Express routers in server.js.

Refactor Frontend: Connect index.html to the backend APIs using fetch(), keeping the existing beautiful color themes and CSS mechanics intact.

Appendix: Original HTML Blueprint Reference
The frontend layout must inherit the exact aesthetic rules of the original wireframe, including the rainbow-bar, CSS variables (--navy: #0b1a2e, --gold: #FFD700), responsive grids, and the exact accordion toggle behavior (toggleJob(id)).