# ADC Careers Web — Kế Hoạch Hoàn Thiện Dự Án

> **Mục tiêu**: Chuẩn bị dự án sẵn sàng triển khai lên internet (production-ready).
> **Cập nhật lần cuối**: 25/08/2026

---

## Tổng quan tiến độ

```
Bước 1 — Secret & Security     [ 0 / 6 ] ░░░░░░░░░░
Bước 2 — Production Hardening  [ 6 / 6 ] ██████████ ✅
Bước 3 — SEO & Discoverability [ 6 / 6 ] ██████████ ✅
Bước 4 — UX & 404 Page         [ 5 / 5 ] ██████████ ✅
Bước 5 — Logging & Monitoring  [ 4 / 4 ] ██████████ ✅
Bước 6 — CI/CD & Dev UX        [ 5 / 5 ] ██████████ ✅
Bước 7 — Performance & Polish  [ 5 / 5 ] ██████████ ✅
─────────────────────────────────────────────────────
Tổng cộng                       [31 / 37]
```

---

## 🔴 Bước 1 — Xử lý Secret Leak & Bảo mật Nền tảng
> **Ưu tiên: KHẨN CẤP** | Phải hoàn thành trước khi push bất kỳ thay đổi nào lên Git.

### Lý do cần làm
File `.env` hiện chứa real credentials (DB password Aiven, Azure AD client secret, Google OAuth token, JWT secret, `ADMIN_PASSWORD=admin123`) và đang tồn tại trong working tree. Đây là rủi ro bảo mật nghiêm trọng nhất.

### Checklist

- [ ] **1.1** — Rotate DB password mới trên **Aiven Cloud** dashboard và cập nhật `DB_PASSWORD` trong Render env vars
- [ ] **1.2** — Regenerate `JWT_SECRET` (chuỗi hex random 64 chars) và cập nhật Render env vars
- [ ] **1.3** — Revoke và tạo mới `MS_CLIENT_SECRET` trên **Azure AD** → cập nhật Render env vars
- [ ] **1.4** — Revoke `GOOGLE_REFRESH_TOKEN` / `GOOGLE_CLIENT_SECRET` → tạo mới → cập nhật Render
- [ ] **1.5** — Tạo file `.env.example` với placeholder values (không có giá trị thật)
- [ ] **1.6** — Thêm `ALLOWED_ORIGINS=https://adc-careers.onrender.com` vào `render.yaml` và Render env vars

> ⚠️ **Bước 1.1–1.4**: Cần thực hiện thủ công trên các dashboard tương ứng.

---

## 🔴 Bước 2 — Hardening Production Config
> **Ưu tiên: CAO** | Cần thiết để server chạy đúng trên môi trường internet.

### Checklist

- [x] **2.1** — Thêm `NODE_ENV=production` vào `render.yaml`
- [x] **2.2** — Disable route `/demo`, `/htmldemo` khi `NODE_ENV=production`
- [x] **2.3** — Disable `allowedOrigins.push("null")` khi `NODE_ENV=production`
- [x] **2.4** — Thêm health check endpoint `GET /health` → trả về `{ status: "ok", uptime, version }`
- [x] **2.5** — Thêm `healthCheckPath: /health` vào `render.yaml`
- [x] **2.6** — Thêm guard: từ chối khởi động nếu `ADMIN_PASSWORD` vẫn là giá trị mặc định yếu

---

## 🟡 Bước 3 — SEO & Discoverability
> **Ưu tiên: TRUNG BÌNH-CAO** | Để search engine có thể tìm thấy và index website.

### Checklist

- [x] **3.1** — Thêm `<meta name="description">` + Open Graph tags + Twitter Card vào `index.html`
- [x] **3.2** — Thêm SEO meta tags cho `job.html`, `privacy-policy.html`, `thank-you.html`
- [x] **3.3** — Tạo `frontend/robots.txt` (allow crawl, disallow `/admin`, `/auth-zone`, `/api`)
- [x] **3.4** — Tạo `frontend/sitemap.xml` với các URL chính
- [x] **3.5** — Thêm route serve `robots.txt` và `sitemap.xml` trong `server.js`
- [x] **3.6** — Thêm favicon đầy đủ: 16px, 32px, `apple-touch-icon` 180px, `<meta name="theme-color">`

---

## 🟡 Bước 4 — UX Cải Thiện & 404 Page
> **Ưu tiên: TRUNG BÌNH** | Trải nghiệm người dùng hoàn chỉnh.

### Checklist

- [x] **4.1** — Tạo trang `frontend/404.html` — thiết kế phù hợp brand ADC, có link về trang chủ
- [x] **4.2** — Cập nhật `server.js`: phục vụ `404.html` với status 404 cho URL không tồn tại
- [x] **4.3** — Thêm loading state / spinner cho form nộp hồ sơ (disable nút Submit khi đang gửi)
- [x] **4.4** — Thêm thông báo lỗi thân thiện hơn cho timeout / network error trong form nộp hồ sơ
- [x] **4.5** — Cải thiện trang `/auth-zone`: ẩn nội dung HTML trước khi verify token xong (tránh flash)

---

## 🟢 Bước 5 — Logging & Monitoring
> **Ưu tiên: TRUNG BÌNH** | Giúp debug và quan sát hệ thống khi chạy production.

### Checklist

- [x] **5.1** — Thêm request logger middleware: log `METHOD path status duration` mỗi request
- [x] **5.2** — Thêm structured log format với timestamp và log level (INFO/WARN/ERROR)
- [x] **5.3** — Nâng cấp `/health` endpoint: bao gồm DB ping, memory usage, uptime
- [x] **5.4** — Đảm bảo tất cả `console.error` trong catch blocks đều log đủ context

---

## 🟢 Bước 6 — CI/CD & Developer Experience
> **Ưu tiên: THẤP-TRUNG BÌNH** | Workflow phát triển ổn định và nhất quán.

### Checklist

- [x] **6.1** — Sửa `security-audit.yml`: đổi `node-version: "18"` → `"22"` để match production
- [x] **6.2** — Thêm `nodemon` vào `devDependencies`, cập nhật `npm run dev` script
- [x] **6.3** — Thêm GitHub Actions workflow `ci.yml`: chạy `npm audit` + basic check trên mọi PR
- [x] **6.4** — Thêm `eslint` vào devDependencies và script `npm run lint`
- [x] **6.5** — Cập nhật `README.md`: thêm deployment URL, CI badge, hướng dẫn env vars đầy đủ

---

## 🟢 Bước 7 — Performance & Polish
> **Ưu tiên: THẤP** | Tối ưu tốc độ và hoàn thiện cuối cùng.

### Checklist

- [x] **7.1** — Thêm `compression` middleware (gzip) vào Express server
- [x] **7.2** — Thêm `Cache-Control` headers cho static assets (CSS, JS, images — 1 tuần TTL)
- [x] **7.3** — Kiểm tra Lighthouse score, ghi nhận điểm số ban đầu
- [x] **7.4** — Fix các issues Lighthouse Performance / Accessibility / Best Practices
- [x] **7.5** — Kiểm tra responsive layout trên mobile (375px, 768px) và fix nếu cần

---

## 📌 Ghi chú

| Ký hiệu | Ý nghĩa |
|---------|---------|
| `- [ ]` | Chưa làm |
| `- [/]` | Đang làm |
| `- [x]` | Đã hoàn thành |

---

*File này được duy trì và cập nhật trong suốt quá trình thực hiện kế hoạch.*
