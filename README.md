# ADC Careers

[![CI](https://github.com/dangminhchi2004/adc-careers-web/actions/workflows/ci.yml/badge.svg)](https://github.com/dangminhchi2004/adc-careers-web/actions/workflows/ci.yml)
[![Security Audit](https://github.com/dangminhchi2004/adc-careers-web/actions/workflows/security-audit.yml/badge.svg)](https://github.com/dangminhchi2004/adc-careers-web/actions/workflows/security-audit.yml)

Website tuyển dụng nội bộ của **Asia Dragon Capital (ADC)**.

**Production:** https://adc-careers.onrender.com

---

## Tech Stack

| Lớp | Công nghệ |
|-----|-----------|
| Backend | Node.js 22 + Express.js |
| Frontend | Vanilla HTML/CSS/JS |
| Database | MySQL (Aiven Cloud) |
| Auth | JWT + httpOnly Cookie |
| Storage | Microsoft Graph (SharePoint / mail-relay) |
| Email | Microsoft Graph API |
| Deploy | Render.com |

---

## 1. Yêu cầu cần có

- Node.js 22 hoặc phiên bản LTS gần nhất
- MySQL server (local) hoặc kết nối cloud (Aiven)
- Git

---

## 2. Clone source code

```powershell
git clone https://github.com/dangminhchi2004/adc-careers-web.git
cd adc-careers-web
```

---

## 3. Cài thư viện

```powershell
npm install
```

---

## 4. Tạo file môi trường

File `.env` không được lưu lên GitHub. Tạo từ file mẫu:

```powershell
Copy-Item .env.example .env
```

Sau đó điền thông tin thật vào `.env`:

| Biến | Mô tả |
|------|-------|
| `PORT` | Cổng server (mặc định 5000) |
| `DB_HOST` | Hostname MySQL |
| `DB_PORT` | Cổng MySQL (mặc định 3306) |
| `DB_USER` | Username MySQL |
| `DB_PASSWORD` | Password MySQL |
| `DB_NAME` | Tên database |
| `DB_SSL` | `true` nếu dùng Aiven/cloud, `false` nếu local |
| `DB_SSL_CA` | Đường dẫn tới CA cert (Aiven: `./certs/ca.pem`) |
| `JWT_SECRET` | Secret ngẫu nhiên 64+ chars — **KHÔNG dùng default** |
| `ADMIN_USERNAME` | Tên đăng nhập admin |
| `ADMIN_PASSWORD` | Mật khẩu admin mạnh (16+ chars) — **KHÔNG dùng default** |
| `RECAPTCHA_SITE_KEY` | Google reCAPTCHA v2 site key |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA v2 secret key |
| `CV_STORAGE` | `local` / `mail_relay` / `sharepoint` / `google_drive` |
| `MAIL_ENABLED` | `true` để gửi email thông báo |
| `MAIL_SEND_AS` | Email gửi (phải có quyền sendMail qua Graph API) |
| `MAIL_HR_TO` | Email nhận thông báo hồ sơ mới |
| `MS_TENANT_ID` | Azure AD Tenant ID |
| `MS_CLIENT_ID` | Azure AD Client ID |
| `MS_CLIENT_SECRET` | Azure AD Client Secret |
| `PUBLIC_BASE_URL` | URL public của app (vd: `https://adc-careers.onrender.com`) |

---

## 5. Tạo database

Tạo database MySQL tên `adc_careers`, sau đó import:

```powershell
mysql -u root -p adc_careers < migrations/adc_careers.sql
```

> Schema sẽ tự động được migrate khi server khởi động lần đầu qua `ensureSchema()`.

---

## 6. Chạy project

```powershell
# Development (tự reload khi code thay đổi)
npm run dev

# Production
npm start
```

Server chạy tại: `http://localhost:5000`

---

## 7. Các URL chính

| URL | Mô tả |
|-----|-------|
| `http://localhost:5000/` | Trang danh sách việc làm |
| `http://localhost:5000/jobs/:slug` | Chi tiết vị trí |
| `http://localhost:5000/admin` | Trang quản trị |
| `http://localhost:5000/auth-zone` | Đăng nhập admin |
| `http://localhost:5000/health` | Health check |
| `http://localhost:5000/api/jobs` | API danh sách jobs |

---

## 8. Scripts

```powershell
npm start          # Chạy server production
npm run dev        # Dev mode với nodemon (tự reload)
npm run lint       # Kiểm tra lỗi code với ESLint
npm run seed       # Seed dữ liệu mẫu
npm run reset-admin # Reset mật khẩu admin
```

---

## 9. Files không có trên GitHub

| File/Thư mục | Lý do |
|-------------|-------|
| `.env` | Chứa credentials nhạy cảm |
| `node_modules/` | Cài lại bằng `npm install` |
| `backend/uploads/` | File CV upload (lưu ngoài git) |
| `backend/logs/` | Log files runtime |

---

## 10. Deploy lên Render

Render dùng cấu hình từ `render.yaml` (có sẵn trong repo).

**Build command:** `npm install`
**Start command:** `npm start`

Cần set các biến môi trường trong **Render Dashboard** (xem bảng ở mục 4).

> ⚠️ **Không upload file `.env` lên Render** — dùng Environment Variables trong Dashboard.

Production: https://adc-careers.onrender.com
