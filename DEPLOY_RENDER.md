# Deploy ADC Careers on Render

This deployment uses the existing Node.js/Express backend. Do not upload `.env` to Render; add the variables in the Render dashboard.

## Requirements

- A GitHub repository containing this project.
- An external MySQL database. Render does not provide MySQL for this app.
- Google Drive storage for CV files. Render's free filesystem is not suitable for uploaded CV persistence.

## Render Settings

- Service type: Web Service
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Plan: Free

The included `render.yaml` can be used as a Render Blueprint.

## Environment Variables

Set these on Render:

```env
DB_HOST=
DB_PORT=
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD=

CV_STORAGE=google_drive
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_DRIVE_SCOPE=https://www.googleapis.com/auth/drive
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
```

Optional Microsoft storage variables can also be set if switching `CV_STORAGE` to `onedrive` or `sharepoint`.

## MySQL Notes

For Aiven MySQL, copy the host, port, user, password, and database from the Aiven service's connection details. Keep `DB_SSL=true`.

If using cPanel MySQL, enable Remote MySQL access. Some cPanel hosts require allowlisting the app server IP; Render free services may not have a stable outbound IP, so a cloud MySQL provider is more reliable for demos.

## Test URLs

After deploy:

```text
https://your-service.onrender.com/api/jobs
https://your-service.onrender.com/login
https://your-service.onrender.com/admin
```
