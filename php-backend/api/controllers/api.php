<?php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/jwt.php';
require_once __DIR__ . '/../lib/storage.php';

function get_active_jobs(): void
{
    $stmt = db()->prepare('SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC');
    $stmt->execute(['active']);
    json_response(['success' => true, 'data' => array_map('normalize_job', $stmt->fetchAll())]);
}

function admin_get_jobs(): void
{
    require_admin();
    $stmt = db()->query('SELECT * FROM jobs ORDER BY created_at DESC');
    json_response(['success' => true, 'data' => array_map('normalize_job', $stmt->fetchAll())]);
}

function admin_create_job(): void
{
    require_admin();
    $payload = read_json_body();
    $error = validate_job($payload);
    if ($error) {
        json_response(['success' => false, 'message' => $error], 400);
    }

    $stmt = db()->prepare('
        INSERT INTO jobs (title, vn, dept, level, report, urgent, color, reqs, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        trim($payload['title']),
        trim($payload['vn']),
        trim($payload['dept']),
        trim($payload['level']),
        trim($payload['report']),
        !empty($payload['urgent']) ? 1 : 0,
        $payload['color'] ?? '#2196F3',
        json_encode(parse_requirements($payload['reqs'] ?? []), JSON_UNESCAPED_UNICODE),
        $payload['status'] ?? 'active',
    ]);

    json_response(['success' => true, 'data' => get_job_by_id((int) db()->lastInsertId())], 201);
}

function admin_update_job(int $id): void
{
    require_admin();
    $payload = read_json_body();
    $error = validate_job($payload);
    if ($error) {
        json_response(['success' => false, 'message' => $error], 400);
    }

    $stmt = db()->prepare('
        UPDATE jobs
        SET title = ?, vn = ?, dept = ?, level = ?, report = ?, urgent = ?, color = ?, reqs = ?, status = ?
        WHERE id = ?
    ');
    $stmt->execute([
        trim($payload['title']),
        trim($payload['vn']),
        trim($payload['dept']),
        trim($payload['level']),
        trim($payload['report']),
        !empty($payload['urgent']) ? 1 : 0,
        $payload['color'] ?? '#2196F3',
        json_encode(parse_requirements($payload['reqs'] ?? []), JSON_UNESCAPED_UNICODE),
        $payload['status'] ?? 'active',
        $id,
    ]);

    $job = get_job_by_id($id);
    if (!$job) {
        json_response(['success' => false, 'message' => 'Khong tim thay vi tri.'], 404);
    }
    json_response(['success' => true, 'data' => $job]);
}

function admin_delete_job(int $id): void
{
    require_admin();
    $stmt = db()->prepare('DELETE FROM jobs WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        json_response(['success' => false, 'message' => 'Khong tim thay vi tri.'], 404);
    }
    json_response(['success' => true]);
}

function login_admin(): void
{
    $payload = read_json_body();
    $username = $payload['username'] ?? '';
    $password = $payload['password'] ?? '';
    $expectedUsername = env_value('ADMIN_USERNAME');
    $expectedPassword = env_value('ADMIN_PASSWORD');

    if (!$expectedUsername || !$expectedPassword) {
        json_response(['success' => false, 'message' => 'Server misconfigured: ADMIN_USERNAME/ADMIN_PASSWORD not set.'], 500);
    }

    if ($username !== $expectedUsername || $password !== $expectedPassword) {
        json_response(['success' => false, 'message' => 'Sai tai khoan hoac mat khau.'], 401);
    }

    $token = jwt_sign(['username' => $username, 'role' => 'admin']);
    json_response([
        'success' => true,
        'token' => $token,
        'user' => ['username' => $username, 'role' => 'admin'],
    ]);
}

function submit_application(): void
{
    $file = $_FILES['cvFile'] ?? null;
    $payload = $_POST;
    $error = validate_application($payload, $file);
    if ($error) {
        json_response(['success' => false, 'message' => $error], 400);
    }

    $storage = null;
    try {
        $storage = store_cv_file($file);
        $application = create_application($payload, $file, $storage);
        json_response([
            'success' => true,
            'message' => 'Ho so ung tuyen da duoc ghi nhan.',
            'data' => $application,
        ], 201);
    } catch (Throwable $error) {
        delete_stored_cv($storage);
        throw $error;
    }
}

function admin_get_applications(): void
{
    require_admin();
    $stmt = db()->query(application_select_sql('ORDER BY a.applied_at DESC'));
    json_response(['success' => true, 'data' => $stmt->fetchAll()]);
}

function admin_download_cv(int $id): void
{
    require_admin();
    $application = get_application_by_id($id);
    if (!$application) {
        json_response(['success' => false, 'message' => 'Khong tim thay ho so ung vien.'], 404);
    }

    $cv = load_cv_binary($application);
    $mimeType = $cv['mimeType'] ?: 'application/octet-stream';
    $fileName = $cv['fileName'] ?: 'cv';
    $disposition = $mimeType === 'application/pdf' ? 'inline' : 'attachment';
    $fallback = preg_replace('/[^\x20-\x7E]/', '_', $fileName);
    $fallback = str_replace(['"', '\\'], '_', $fallback);

    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . strlen($cv['body']));
    header("Content-Disposition: {$disposition}; filename=\"{$fallback}\"; filename*=UTF-8''" . rawurlencode($fileName));
    echo $cv['body'];
    exit;
}

function normalize_job(array $row): array
{
    $row['id'] = (int) $row['id'];
    $row['urgent'] = !empty($row['urgent']);
    $row['reqs'] = parse_requirements($row['reqs'] ?? []);
    return $row;
}

function parse_requirements($value): array
{
    if (is_array($value)) {
        return array_values($value);
    }
    if (!$value) {
        return [];
    }
    $decoded = json_decode((string) $value, true);
    if (is_array($decoded)) {
        return array_values($decoded);
    }
    return array_values(array_filter(array_map('trim', preg_split('/\r?\n/', (string) $value))));
}

function validate_job(array $job): string
{
    foreach (['title', 'vn', 'dept', 'level', 'report'] as $field) {
        if (empty($job[$field]) || trim((string) $job[$field]) === '') {
            return 'Vui long nhap day du thong tin vi tri.';
        }
    }
    if (count(parse_requirements($job['reqs'] ?? [])) === 0) {
        return 'Vui long nhap it nhat mot yeu cau.';
    }
    return '';
}

function validate_application(array $payload, ?array $file): string
{
    if (empty($payload['jobId']) || !is_numeric($payload['jobId'])) {
        return 'Vui long chon vi tri ung tuyen.';
    }
    if (empty($payload['fullName']) || trim($payload['fullName']) === '') {
        return 'Vui long nhap ho va ten.';
    }
    if (empty($payload['email']) || !filter_var($payload['email'], FILTER_VALIDATE_EMAIL)) {
        return 'Email chua hop le.';
    }
    if (empty($payload['phone']) || !preg_match('/^[0-9+\-\s().]{8,18}$/', $payload['phone'])) {
        return 'So dien thoai chua hop le.';
    }
    if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return 'Vui long dinh kem CV.';
    }
    if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
        return 'CV can nho hon hoac bang 5MB.';
    }

    $extension = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
    if (!in_array($extension, ['pdf', 'doc', 'docx'], true)) {
        return 'CV chi chap nhan PDF, DOC hoac DOCX.';
    }
    return '';
}

function get_job_by_id(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM jobs WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? normalize_job($row) : null;
}

function create_application(array $payload, array $file, array $storage): array
{
    $stmt = db()->prepare('
        INSERT INTO applications
          (
            job_id, full_name, email, phone, expected_salary, note,
            cv_original_name, cv_file_name, cv_file_path, cv_mime_type, cv_size,
            cv_storage_provider, cv_drive_id, cv_drive_item_id, cv_web_url, cv_onedrive_path,
            cv_external_id, cv_external_parent_id, cv_external_url, cv_storage_path
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        (int) $payload['jobId'],
        trim($payload['fullName']),
        trim($payload['email']),
        trim($payload['phone']),
        trim($payload['expectedSalary'] ?? '') ?: null,
        trim($payload['note'] ?? '') ?: null,
        $file['name'] ?? null,
        $storage['fileName'] ?? null,
        $storage['filePath'] ?? null,
        $storage['mimeType'] ?? ($file['type'] ?? null),
        $storage['size'] ?? ($file['size'] ?? null),
        $storage['provider'] ?? 'local',
        $storage['driveId'] ?? null,
        $storage['driveItemId'] ?? null,
        $storage['webUrl'] ?? null,
        $storage['oneDrivePath'] ?? null,
        $storage['externalId'] ?? null,
        $storage['externalParentId'] ?? null,
        $storage['externalUrl'] ?? null,
        $storage['storagePath'] ?? null,
    ]);

    return get_application_by_id((int) db()->lastInsertId());
}

function get_application_by_id(int $id): ?array
{
    $stmt = db()->prepare(application_select_sql('WHERE a.id = ?'));
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function application_select_sql(string $tailSql): string
{
    return "
        SELECT
          a.id,
          a.job_id AS jobId,
          a.full_name AS fullName,
          a.email,
          a.phone,
          a.expected_salary AS expectedSalary,
          a.note,
          a.cv_original_name AS cvOriginalName,
          a.cv_file_name AS cvFileName,
          a.cv_file_path AS cvFilePath,
          a.cv_mime_type AS cvMimeType,
          a.cv_size AS cvSize,
          a.cv_storage_provider AS cvStorageProvider,
          a.cv_drive_id AS cvDriveId,
          a.cv_drive_item_id AS cvDriveItemId,
          a.cv_web_url AS cvWebUrl,
          a.cv_onedrive_path AS cvOneDrivePath,
          a.cv_external_id AS cvExternalId,
          a.cv_external_parent_id AS cvExternalParentId,
          a.cv_external_url AS cvExternalUrl,
          a.cv_storage_path AS cvStoragePath,
          a.status,
          a.applied_at AS appliedAt,
          j.title AS jobTitle,
          j.vn AS jobTitleVn,
          j.dept AS jobDept
        FROM applications a
        LEFT JOIN jobs j ON j.id = a.job_id
        {$tailSql}
    ";
}
