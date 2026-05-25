const API_BASE = window.location.protocol === "file:" ? "http://localhost:5000" : "";
const token = localStorage.getItem("adcAdminToken");

if (!token) {
  window.location.href = "login.html";
}

let jobs = [];
let applications = [];

const jobForm = document.getElementById("jobForm");
const jobFormMessage = document.getElementById("jobFormMessage");
const jobsTable = document.getElementById("jobsTable");
const applicationsTable = document.getElementById("applicationsTable");
const activeJobMetric = document.getElementById("activeJobMetric");
const totalJobMetric = document.getElementById("totalJobMetric");
const applicationMetric = document.getElementById("applicationMetric");

document.getElementById("refreshBtn").addEventListener("click", loadDashboard);
document.getElementById("resetJobFormBtn").addEventListener("click", resetJobForm);
document.getElementById("logoutBtn").addEventListener("click", logout);

jobForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = getJobPayload();
  const jobId = document.getElementById("jobId").value;
  const url = jobId ? `${API_BASE}/api/admin/jobs/${jobId}` : `${API_BASE}/api/admin/jobs`;
  const method = jobId ? "PUT" : "POST";

  try {
    showJobMessage("success", "Đang lưu vị trí...");
    const result = await requestJson(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!result.success) throw new Error(result.message || "Không thể lưu vị trí.");

    showJobMessage("success", jobId ? "Đã cập nhật vị trí." : "Đã tạo vị trí mới.");
    resetJobForm();
    await loadDashboard();
  } catch (error) {
    showJobMessage("error", error.message);
  }
});

async function loadDashboard() {
  try {
    const [jobsResult, applicationsResult] = await Promise.all([
      requestJson(`${API_BASE}/api/admin/jobs`),
      requestJson(`${API_BASE}/api/admin/applications`)
    ]);

    jobs = jobsResult.data || [];
    applications = applicationsResult.data || [];
    renderMetrics();
    renderJobs();
    renderApplications();
  } catch (error) {
    const message = error instanceof TypeError
      ? "Không kết nối được backend. Hãy kiểm tra server đang chạy."
      : error.message;
    jobsTable.innerHTML = emptyRow(message);
    applicationsTable.innerHTML = emptyRow(message);
  }
}

async function requestJson(url, options) {
  const requestOptions = {
    ...(options || {}),
    headers: {
      Authorization: `Bearer ${token}`,
      ...((options && options.headers) || {})
    }
  };
  const response = await fetch(url, requestOptions);
  const result = await response.json();

  if (response.status === 401) {
    logout();
    throw new Error(result.message || "Phiên đăng nhập đã hết hạn.");
  }

  if (!response.ok) throw new Error(result.message || "Yêu cầu không thành công.");
  return result;
}

function logout() {
  localStorage.removeItem("adcAdminToken");
  localStorage.removeItem("adcAdminUser");
  window.location.href = "login.html";
}

function renderMetrics() {
  activeJobMetric.textContent = jobs.filter((job) => job.status === "active").length;
  totalJobMetric.textContent = jobs.length;
  applicationMetric.textContent = applications.length;
}

function renderJobs() {
  if (jobs.length === 0) {
    jobsTable.innerHTML = emptyRow("Chưa có vị trí tuyển dụng.", 5);
    return;
  }

  jobsTable.innerHTML = jobs.map((job) => `
    <tr>
      <td>
        <div class="table-title">${escapeHtml(job.title)}</div>
        <div class="table-sub">${escapeHtml(job.vn)}</div>
      </td>
      <td>${escapeHtml(job.dept)}</td>
      <td>${escapeHtml(job.level)}</td>
      <td><span class="pill ${escapeAttribute(job.status)}">${escapeHtml(job.status)}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn btn-secondary" type="button" onclick="editJob(${job.id})">Sửa</button>
          <button class="btn btn-danger" type="button" onclick="deleteJob(${job.id})">Xóa</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderApplications() {
  if (applications.length === 0) {
    applicationsTable.innerHTML = emptyRow("Chưa có hồ sơ ứng viên.", 6);
    return;
  }

  applicationsTable.innerHTML = applications.map((application) => `
    <tr>
      <td>
        <div class="table-title">${escapeHtml(application.fullName)}</div>
        <div class="table-sub">${escapeHtml(application.note || "Không có ghi chú")}</div>
      </td>
      <td>
        <div>${escapeHtml(application.email)}</div>
        <div class="table-sub">${escapeHtml(application.phone)}</div>
      </td>
      <td>
        <div>${escapeHtml(application.jobTitle || "Vị trí đã xóa")}</div>
        <div class="table-sub">${escapeHtml(application.jobTitleVn || "")}</div>
      </td>
      <td>${escapeHtml(application.expectedSalary || "Chưa cung cấp")}</td>
      <td>${renderCvLink(application)}</td>
      <td>${formatDate(application.appliedAt)}</td>
    </tr>
  `).join("");
}

function renderCvLink(application) {
  if (!application.cvFilePath) return "Không có CV";
  return `<a class="cv-link" href="${escapeAttribute(application.cvFilePath)}" target="_blank" rel="noopener">${escapeHtml(application.cvOriginalName || "Tải CV")}</a>`;
}

function editJob(id) {
  const job = jobs.find((item) => item.id === id);
  if (!job) return;

  document.getElementById("jobId").value = job.id;
  document.getElementById("title").value = job.title || "";
  document.getElementById("vn").value = job.vn || "";
  document.getElementById("dept").value = job.dept || "";
  document.getElementById("level").value = job.level || "";
  document.getElementById("report").value = job.report || "";
  document.getElementById("color").value = job.color || "#2196F3";
  document.getElementById("status").value = job.status || "active";
  document.getElementById("urgent").checked = Boolean(job.urgent);
  document.getElementById("reqs").value = Array.isArray(job.reqs) ? job.reqs.join("\n") : "";
  showJobMessage("success", "Đang chỉnh sửa vị trí. Bấm Lưu để cập nhật.");
  document.getElementById("jobs").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteJob(id) {
  const job = jobs.find((item) => item.id === id);
  const confirmed = window.confirm(`Xóa vị trí "${job ? job.title : id}"? Hồ sơ liên quan cũng sẽ bị xóa theo ràng buộc database.`);
  if (!confirmed) return;

  try {
    const result = await requestJson(`${API_BASE}/api/admin/jobs/${id}`, { method: "DELETE" });
    if (!result.success) throw new Error(result.message || "Không thể xóa vị trí.");
    await loadDashboard();
  } catch (error) {
    window.alert(error.message);
  }
}

function getJobPayload() {
  return {
    title: document.getElementById("title").value.trim(),
    vn: document.getElementById("vn").value.trim(),
    dept: document.getElementById("dept").value.trim(),
    level: document.getElementById("level").value.trim(),
    report: document.getElementById("report").value.trim(),
    urgent: document.getElementById("urgent").checked,
    color: document.getElementById("color").value,
    status: document.getElementById("status").value,
    reqs: document.getElementById("reqs").value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
  };
}

function resetJobForm() {
  jobForm.reset();
  document.getElementById("jobId").value = "";
  document.getElementById("color").value = "#2196F3";
  document.getElementById("status").value = "active";
  jobFormMessage.className = "form-message";
  jobFormMessage.textContent = "";
}

function showJobMessage(type, message) {
  jobFormMessage.className = `form-message visible ${type}`;
  jobFormMessage.textContent = message;
}

function emptyRow(message, colspan = 1) {
  return `<tr><td class="empty-row" colspan="${colspan}">${escapeHtml(message)}</td></tr>`;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

window.editJob = editJob;
window.deleteJob = deleteJob;

loadDashboard();
