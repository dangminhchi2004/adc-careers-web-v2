const API_BASE = window.ADC_API_BASE ?? (window.location.protocol === "file:" ? "http://localhost:5000" : "");
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
const applicationFilters = document.getElementById("applicationFilters");
const applicationFilterSummary = document.getElementById("applicationFilterSummary");
const applicationSearch = document.getElementById("applicationSearch");
const applicationJobFilter = document.getElementById("applicationJobFilter");
const applicationDeptFilter = document.getElementById("applicationDeptFilter");
const applicationStatusFilter = document.getElementById("applicationStatusFilter");
const applicationCvTypeFilter = document.getElementById("applicationCvTypeFilter");
const applicationSalaryFilter = document.getElementById("applicationSalaryFilter");
const applicationDateFrom = document.getElementById("applicationDateFrom");
const applicationDateTo = document.getElementById("applicationDateTo");

document.getElementById("refreshBtn").addEventListener("click", loadDashboard);
document.getElementById("resetJobFormBtn").addEventListener("click", resetJobForm);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("resetApplicationFiltersBtn").addEventListener("click", resetApplicationFilters);
document.querySelectorAll("[data-tab-target]").forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tabTarget));
});

applicationFilters.addEventListener("input", renderApplications);
applicationFilters.addEventListener("change", renderApplications);

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
    renderApplicationFilterOptions();
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
  const filteredApplications = getFilteredApplications();
  updateApplicationFilterSummary(filteredApplications.length);

  if (applications.length === 0) {
    applicationsTable.innerHTML = emptyRow("Chưa có hồ sơ ứng viên.", 6);
    return;
  }

  if (filteredApplications.length === 0) {
    applicationsTable.innerHTML = emptyRow("Không có hồ sơ phù hợp với bộ lọc.", 6);
    return;
  }

  applicationsTable.innerHTML = filteredApplications.map((application) => `
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
  if (!application.cvOriginalName && !application.cvFilePath) return "Không có CV";
  return `<a class="cv-link" href="#" onclick="downloadCv(event, ${application.id})">${escapeHtml(application.cvOriginalName || "Tải CV")}</a>`;
}

async function downloadCv(event, applicationId) {
  event.preventDefault();

  try {
    const response = await fetch(`${API_BASE}/api/admin/applications/${applicationId}/cv`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      let message = "Không thể tải CV.";
      try {
        const result = await response.json();
        message = result.message || message;
      } catch (error) {
        // Keep the default message when the server does not return JSON.
      }
      throw new Error(message);
    }

    const application = applications.find((item) => item.id === applicationId);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    if (blob.type === "application/pdf") {
      window.open(url, "_blank", "noopener");
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = application ? application.cvOriginalName || "cv" : "cv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    window.alert(error.message || "Không thể tải CV.");
  }
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
  setActiveTab("jobs");
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

function setActiveTab(tabName) {
  document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
    const isActive = panel.dataset.tabPanel === tabName;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });

  document.querySelectorAll("[data-tab-target]").forEach((button) => {
    const isActive = button.dataset.tabTarget === tabName;
    button.classList.toggle("active", isActive);
    if (button.getAttribute("role") === "tab") {
      button.setAttribute("aria-selected", String(isActive));
    }
  });
}

function renderApplicationFilterOptions() {
  renderSelectOptions(
    applicationJobFilter,
    "all",
    "Tất cả vị trí",
    uniqueSorted(applications.map((application) => application.jobTitle).filter(Boolean))
  );
  renderSelectOptions(
    applicationDeptFilter,
    "all",
    "Tất cả phòng ban",
    uniqueSorted(applications.map((application) => application.jobDept).filter(Boolean))
  );
  renderSelectOptions(
    applicationStatusFilter,
    "all",
    "Tất cả trạng thái",
    uniqueSorted(applications.map((application) => application.status).filter(Boolean))
  );
}

function renderSelectOptions(selectElement, allValue, allLabel, values) {
  const currentValue = selectElement.value || allValue;
  selectElement.innerHTML = [
    `<option value="${allValue}">${escapeHtml(allLabel)}</option>`,
    ...values.map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(value)}</option>`)
  ].join("");
  selectElement.value = values.includes(currentValue) || currentValue === allValue ? currentValue : allValue;
}

function getFilteredApplications() {
  const search = normalizeSearch(applicationSearch.value);
  const job = applicationJobFilter.value;
  const dept = applicationDeptFilter.value;
  const status = applicationStatusFilter.value;
  const cvType = applicationCvTypeFilter.value;
  const salary = applicationSalaryFilter.value;
  const fromDate = parseDateInput(applicationDateFrom.value, false);
  const toDate = parseDateInput(applicationDateTo.value, true);

  return applications.filter((application) => {
    if (job !== "all" && application.jobTitle !== job) return false;
    if (dept !== "all" && application.jobDept !== dept) return false;
    if (status !== "all" && application.status !== status) return false;
    if (salary === "provided" && !hasText(application.expectedSalary)) return false;
    if (salary === "missing" && hasText(application.expectedSalary)) return false;
    if (cvType !== "all" && getCvType(application) !== cvType) return false;

    const appliedAt = application.appliedAt ? new Date(application.appliedAt) : null;
    if (fromDate && (!appliedAt || appliedAt < fromDate)) return false;
    if (toDate && (!appliedAt || appliedAt > toDate)) return false;

    if (search) {
      const haystack = normalizeSearch([
        application.fullName,
        application.email,
        application.phone,
        application.expectedSalary,
        application.note,
        application.cvOriginalName,
        application.jobTitle,
        application.jobTitleVn,
        application.jobDept
      ].join(" "));
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

function updateApplicationFilterSummary(filteredCount) {
  const total = applications.length;
  applicationFilterSummary.textContent = total === filteredCount
    ? `Hiển thị tất cả ${total} hồ sơ.`
    : `Hiển thị ${filteredCount}/${total} hồ sơ theo bộ lọc.`;
}

function resetApplicationFilters() {
  applicationFilters.reset();
  renderApplications();
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((first, second) => first.localeCompare(second, "vi"));
}

function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseDateInput(value, endOfDay) {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getCvType(application) {
  const name = String(application.cvOriginalName || application.cvFileName || "").toLowerCase();
  if (name.endsWith(".pdf") || application.cvMimeType === "application/pdf") return "pdf";
  if (name.endsWith(".doc") || name.endsWith(".docx") || String(application.cvMimeType || "").includes("word")) return "doc";
  return "other";
}

function hasText(value) {
  return Boolean(value && String(value).trim());
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
window.downloadCv = downloadCv;

loadDashboard();
