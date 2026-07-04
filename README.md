# ADC Careers

Huong dan khoi chay du an sau khi clone ve may moi.

## 1. Yeu cau can co

- Node.js 22 hoac phien ban LTS gan nhat.
- MySQL server.
- Git.

## 2. Clone source code

```powershell
git clone https://github.com/dangminhchi2004/adc-careers-web.git
cd adc-careers-web
```

Neu dang lam viec tren branch hien tai cua du an:

```powershell
git checkout feature/update-careers-website
```

## 3. Cai thu vien

```powershell
npm install
```

Thu muc `node_modules/` khong duoc luu len GitHub, nen sau khi clone bat buoc phai chay lenh nay.

## 4. Tao file moi can thiet

File `.env` khong duoc luu len GitHub vi chua mat khau database, JWT secret va tai khoan admin.

Tao file `.env` tu file mau:

```powershell
Copy-Item .env.example .env
```

Sau do mo `.env` va dien thong tin that:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=adc_careers

JWT_SECRET=your_strong_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password

CV_STORAGE=local
```

Neu deploy len Render, khong upload `.env`. Hay them cac bien moi truong trong Render Dashboard.

## 5. Tao database

Tao database MySQL ten `adc_careers`, sau do import file:

```text
adc_careers.sql
```

Co the import bang MySQL Workbench, phpMyAdmin, hoac command line:

```powershell
mysql -u root -p adc_careers < adc_careers.sql
```

Neu database da ton tai tren cloud, chi can dien dung thong tin ket noi vao `.env`.

## 6. Chay project

```powershell
npm start
```

Hoac:

```powershell
npm run dev
```

Mac dinh server chay tai:

```text
http://localhost:5000
```

## 7. Cac URL can kiem tra

```text
http://localhost:5000/
http://localhost:5000/htmldemo.html
http://localhost:5000/login
http://localhost:5000/admin
http://localhost:5000/api/jobs
```

## 8. Cac file/thu muc khong co tren GitHub

Nhung file/thu muc sau khong duoc luu len GitHub va can tao/cau hinh lai tren may moi neu can:

- `.env`
- `node_modules/`
- `backend/uploads/`
- `backend/logs/`

Day la hanh vi dung. Khong commit `.env` len GitHub.

## 9. Deploy Render

Render dung cau hinh:

```text
Build command: npm install
Start command: npm start
```

Can set bien moi truong tren Render Dashboard tuong ung voi `.env.example`.

Sau khi deploy co the truy cap:

```text
https://adc-careers.onrender.com/
https://adc-careers.onrender.com/htmldemo.html
https://adc-careers.onrender.com/login
https://adc-careers.onrender.com/admin
```
