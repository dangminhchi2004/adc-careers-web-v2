const API_BASE = window.ADC_API_BASE ?? (window.location.protocol === "file:" ? "http://localhost:5000" : "");
const token = localStorage.getItem("adcAdminToken");

if (!token) {
  window.location.href = "auth-zone.html";
}

let jobs = [];
let applications = [];

const APPLICATION_STATUSES = [
  { value: "new", label: "Mới" },
  { value: "screening", label: "Sàng lọc" },
  { value: "interview", label: "Phỏng vấn" },
  { value: "offer", label: "Đề nghị" },
  { value: "hired", label: "Đã nhận" },
  { value: "rejected", label: "Từ chối" }
];

const JOB_STATUS_LABELS = {
  active: "Đang tuyển",
  closed: "Đã đóng"
};

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
const exportApplicationsBtn = document.getElementById("exportApplicationsBtn");
const jobModal = document.getElementById("jobModal");
const closeJobModalBtn = document.getElementById("closeJobModalBtn");

document.getElementById("refreshBtn").addEventListener("click", loadDashboard);
document.getElementById("resetJobFormBtn").addEventListener("click", () => {
  resetJobForm();
  jobModal.hidden = false;
});
if (closeJobModalBtn) {
  closeJobModalBtn.addEventListener("click", () => {
    jobModal.hidden = true;
  });
}
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("resetApplicationFiltersBtn").addEventListener("click", resetApplicationFilters);
exportApplicationsBtn.addEventListener("click", exportFilteredApplications);
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
    setTimeout(() => {
      resetJobForm();
      jobModal.hidden = true;
    }, 1500);
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
  window.location.href = "auth-zone.html";
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

  jobsTable.innerHTML = jobs.map((job, index) => `
    <tr class="animate-slide-up" style="--anim-order: ${index + 5};">
      <td data-label="Vị trí">
        <div class="table-title">${escapeHtml(job.title)}</div>
        <div class="table-sub">${escapeHtml(job.vn)}</div>
      </td>
      <td data-label="Phòng ban">${escapeHtml(job.dept)}</td>
      <td data-label="Cấp bậc">${escapeHtml(job.level)}</td>
      <td data-label="Trạng thái"><span class="pill ${escapeAttribute(job.status)}">${escapeHtml(formatJobStatus(job.status))}</span></td>
      <td data-label="Thao tác">
        <div class="row-actions">
          <button class="btn btn-secondary" type="button" data-action="edit-job" data-id="${job.id}">Sửa</button>
          <button class="btn btn-danger" type="button" data-action="delete-job" data-id="${job.id}">Xóa</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderApplications() {
  const filteredApplications = getFilteredApplications();
  updateApplicationFilterSummary(filteredApplications.length);

  if (applications.length === 0) {
    applicationsTable.innerHTML = emptyRow("Chưa có hồ sơ ứng viên.", 7);
    return;
  }

  if (filteredApplications.length === 0) {
    applicationsTable.innerHTML = emptyRow("Không có hồ sơ phù hợp với bộ lọc.", 7);
    return;
  }

  applicationsTable.innerHTML = filteredApplications.map((application, index) => `
    <tr class="animate-slide-up" style="--anim-order: ${index + 5};">
      <td data-label="Ứng viên">
        <div class="table-title">${escapeHtml(application.fullName)}</div>
        <div class="table-sub">${escapeHtml(application.note || "Không có ghi chú")}</div>
      </td>
      <td data-label="Liên hệ">
        <div>${escapeHtml(application.email)}</div>
        <div class="table-sub">${escapeHtml(application.phone)}</div>
      </td>
      <td data-label="Vị trí">
        <div>${escapeHtml(application.jobTitle || "Vị trí đã xóa")}</div>
        <div class="table-sub">${escapeHtml(application.jobTitleVn || "")}</div>
      </td>
      <td data-label="Lương kỳ vọng">${escapeHtml(application.expectedSalary || "Chưa cung cấp")}</td>
      <td data-label="Trạng thái">${renderApplicationStatus(application)}</td>
      <td data-label="CV">${renderCvLink(application)}</td>
      <td data-label="Ngày gửi">${formatDate(application.appliedAt)}</td>
    </tr>
  `).join("");
}

function renderApplicationStatus(application) {
  const currentStatus = application.status || "new";
  const options = APPLICATION_STATUSES.map((status) => `
    <option value="${status.value}" ${status.value === currentStatus ? "selected" : ""}>${status.label}</option>
  `).join("");

  return `
    <select class="status-select pill ${escapeAttribute(currentStatus)}" data-action="update-status" data-id="${application.id}">
      ${options}
    </select>
  `;
}

function formatApplicationStatus(status) {
  const foundStatus = APPLICATION_STATUSES.find((item) => item.value === status);
  return foundStatus ? foundStatus.label : status;
}

function formatJobStatus(status) {
  return JOB_STATUS_LABELS[status] || status;
}

function renderCvLink(application) {
  if (!application.cvOriginalName && !application.cvFilePath) return "Không có CV";
  return `<a class="cv-link" href="#" data-action="download-cv" data-id="${application.id}">${escapeHtml(application.cvOriginalName || "Tải CV")}</a>`;
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

async function updateApplicationStatus(applicationId, status) {
  const application = applications.find((item) => item.id === applicationId);
  const previousStatus = application ? application.status || "new" : "new";

  try {
    const result = await requestJson(`${API_BASE}/api/admin/applications/${applicationId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    if (!result.success) throw new Error(result.message || "Không thể cập nhật trạng thái hồ sơ.");
    applications = applications.map((item) => item.id === applicationId ? result.data : item);
    renderMetrics();
    renderApplicationFilterOptions();
    renderApplications();
  } catch (error) {
    if (application) application.status = previousStatus;
    renderApplications();
    window.alert(error.message || "Không thể cập nhật trạng thái hồ sơ.");
  }
}

function exportFilteredApplications() {
  const filteredApplications = getFilteredApplications();
  if (filteredApplications.length === 0) {
    window.alert("Không có hồ sơ phù hợp để xuất.");
    return;
  }

  const headers = [
    "ID",
    "Họ tên",
    "Email",
    "Điện thoại",
    "Vị trí",
    "Phòng ban",
    "Lương kỳ vọng",
    "Trạng thái",
    "CV",
    "Ngày gửi",
    "Ghi chú"
  ];
  const rows = filteredApplications.map((application) => [
    application.id,
    application.fullName,
    application.email,
    application.phone,
    application.jobTitle || application.jobTitleVn || "",
    application.jobDept || "",
    application.expectedSalary || "",
      formatApplicationStatus(application.status || "new"),
    application.cvOriginalName || application.cvFileName || "",
    application.appliedAt ? new Date(application.appliedAt).toISOString() : "",
    application.note || ""
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `adc-careers-applications-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  document.getElementById("slug").value = job.slug || "";
  document.getElementById("summary").value = job.summary || "";
  document.getElementById("employmentType").value = job.employmentType || "";
  document.getElementById("workLocation").value = job.workLocation || "";
  document.getElementById("locationShort").value = job.locationShort || "";
  document.getElementById("salaryText").value = job.salaryText || "";
  document.getElementById("deadline").value = toDateInputValue(job.deadline);
  document.getElementById("quantity").value = job.quantity || 1;
  document.getElementById("ageRange").value = job.ageRange || "";
  document.getElementById("gender").value = job.gender || "";
  document.getElementById("experienceText").value = job.experienceText || "";
  document.getElementById("industry").value = job.industry || "";
  document.getElementById("publishedAt").value = toDateInputValue(job.publishedAt);
  document.getElementById("color").value = job.color || "#2196F3";
  document.getElementById("status").value = job.status || "active";
  document.getElementById("urgent").checked = Boolean(job.urgent);
  document.getElementById("reqs").value = Array.isArray(job.reqs) ? job.reqs.join("\n") : "";
  document.getElementById("responsibilities").value = arrayToLines(job.responsibilities);
  document.getElementById("requirementsDetail").value = arrayToLines(job.requirementsDetail);
  document.getElementById("benefits").value = benefitsToLines(job.benefits);
  document.getElementById("environmentSections").value = environmentSectionsToLines(job.environmentSections);
  showJobMessage("success", "Đang chỉnh sửa vị trí. Bấm Lưu để cập nhật.");
  jobModal.hidden = false;
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
    slug: document.getElementById("slug").value.trim(),
    summary: document.getElementById("summary").value.trim(),
    employmentType: document.getElementById("employmentType").value.trim(),
    workLocation: document.getElementById("workLocation").value.trim(),
    locationShort: document.getElementById("locationShort").value.trim(),
    salaryText: document.getElementById("salaryText").value.trim(),
    deadline: document.getElementById("deadline").value,
    quantity: Number(document.getElementById("quantity").value || 1),
    ageRange: document.getElementById("ageRange").value.trim(),
    gender: document.getElementById("gender").value.trim(),
    experienceText: document.getElementById("experienceText").value.trim(),
    industry: document.getElementById("industry").value.trim(),
    publishedAt: document.getElementById("publishedAt").value,
    urgent: document.getElementById("urgent").checked,
    color: document.getElementById("color").value,
    status: document.getElementById("status").value,
    reqs: document.getElementById("reqs").value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean),
    responsibilities: linesToArray(document.getElementById("responsibilities").value),
    requirementsDetail: linesToArray(document.getElementById("requirementsDetail").value),
    benefits: linesToBenefits(document.getElementById("benefits").value),
    environmentSections: linesToEnvironmentSections(document.getElementById("environmentSections").value)
  };
}

function resetJobForm() {
  jobForm.reset();
  document.getElementById("jobId").value = "";
  document.getElementById("color").value = "#2196F3";
  document.getElementById("status").value = "active";
  document.getElementById("employmentType").value = "Full-time";
  document.getElementById("workLocation").value = "KCN Tân Tạo, Bình Tân, TP.HCM";
  document.getElementById("locationShort").value = "TP.HCM";
  document.getElementById("salaryText").value = "Thỏa thuận theo năng lực";
  document.getElementById("quantity").value = "1";
  jobFormMessage.className = "form-message";
  jobFormMessage.textContent = "";
}

function linesToArray(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToLines(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function linesToBenefits(value) {
  return linesToArray(value).map((line) => {
    const parts = line.split("|");
    if (parts.length === 1) {
      return { icon: "*", text: parts[0].trim() };
    }

    return {
      icon: parts.shift().trim() || "*",
      text: parts.join("|").trim()
    };
  }).filter((item) => item.text);
}

function benefitsToLines(value) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => `${item.icon || "*"} | ${item.text || ""}`.trim())
    .filter((line) => line && !line.endsWith("|"))
    .join("\n");
}

function linesToEnvironmentSections(value) {
  return linesToArray(value).map((line) => {
    const parts = line.split("|");
    return {
      title: (parts.shift() || "").trim(),
      content: parts.join("|").trim()
    };
  }).filter((item) => item.title && item.content);
}

function environmentSectionsToLines(value) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => `${item.title || ""} | ${item.content || ""}`.trim())
    .filter((line) => line && !line.startsWith("|") && !line.endsWith("|"))
    .join("\n");
}

function toDateInputValue(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
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
  renderStatusFilterOptions();
}

function renderSelectOptions(selectElement, allValue, allLabel, values) {
  const currentValue = selectElement.value || allValue;
  selectElement.innerHTML = [
    `<option value="${allValue}">${escapeHtml(allLabel)}</option>`,
    ...values.map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(value)}</option>`)
  ].join("");
  selectElement.value = values.includes(currentValue) || currentValue === allValue ? currentValue : allValue;
}

function renderStatusFilterOptions() {
  const currentValue = applicationStatusFilter.value || "all";
  applicationStatusFilter.innerHTML = [
    '<option value="all">Tất cả trạng thái</option>',
    ...APPLICATION_STATUSES.map((status) => `<option value="${status.value}">${escapeHtml(status.label)}</option>`)
  ].join("");
  applicationStatusFilter.value = APPLICATION_STATUSES.some((status) => status.value === currentValue) ? currentValue : "all";
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

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
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
window.updateApplicationStatus = updateApplicationStatus;

// Password Modal Logic
const changePasswordBtn = document.getElementById("changePasswordBtn");
const passwordModal = document.getElementById("passwordModal");
const closePasswordModalBtn = document.getElementById("closePasswordModalBtn");
const passwordForm = document.getElementById("passwordForm");
const passwordMessage = document.getElementById("passwordMessage");

if (changePasswordBtn) {
  changePasswordBtn.addEventListener("click", () => {
    passwordForm.reset();
    passwordMessage.textContent = "";
    passwordMessage.className = "form-message";
    passwordModal.removeAttribute("hidden");
  });
}

if (closePasswordModalBtn) {
  closePasswordModalBtn.addEventListener("click", () => {
    passwordModal.setAttribute("hidden", "true");
  });
}

if (passwordForm) {
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      passwordMessage.textContent = "Mật khẩu mới không khớp.";
      passwordMessage.className = "form-message visible error";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await res.json();
      if (data.success) {
        passwordMessage.textContent = "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.";
        passwordMessage.className = "form-message visible success";
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        passwordMessage.textContent = data.message || "Lỗi khi đổi mật khẩu.";
        passwordMessage.className = "form-message visible error";
      }
    } catch (err) {
      passwordMessage.textContent = "Lỗi kết nối máy chủ.";
      passwordMessage.className = "form-message visible error";
    }
  });
}

document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  const id = Number(target.dataset.id);

  if (action === "edit-job") {
    editJob(id);
  } else if (action === "delete-job") {
    deleteJob(id);
  } else if (action === "download-cv") {
    downloadCv(e, id);
  }
});

document.addEventListener("change", (e) => {
  const target = e.target.closest("[data-action='update-status']");
  if (!target) return;
  const id = Number(target.dataset.id);
  updateApplicationStatus(id, target.value);
});

loadDashboard();
