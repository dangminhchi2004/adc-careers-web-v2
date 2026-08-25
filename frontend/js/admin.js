const API_BASE = window.ADC_API_BASE ?? (window.location.protocol === "file:" ? "http://localhost:5000" : "");
// Auth now travels as an httpOnly cookie (sent automatically via
// credentials:"include" on every request below) rather than a token read
// from localStorage — there's nothing to check client-side up front; an
// unauthenticated visitor is caught by the first API call's 401 in
// requestJson(), which redirects to the login page via logout().

let jobs = [];
let departments = [];
let jobLevels = [];
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
const displayModeInput = document.getElementById("displayMode");
const displayModeToggle = document.querySelector(".display-mode-toggle");
const posterFileInput = document.getElementById("posterFile");
const posterPreview = document.getElementById("posterPreview");
const removePosterBtn = document.getElementById("removePosterBtn");
const posterError = document.getElementById("posterError");

const POSTER_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const POSTER_MAX_BYTES = 10 * 1024 * 1024;
let pendingPosterFile = null;
let editingJobHasPoster = false;

displayModeToggle.addEventListener("click", (event) => {
  const button = event.target.closest(".mode-btn");
  if (!button) return;
  setDisplayMode(button.dataset.mode);
});

function setDisplayMode(mode) {
  displayModeInput.value = mode;
  displayModeToggle.querySelectorAll(".mode-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  if (jobForm) {
    jobForm.classList.toggle("mode-poster", mode === "poster");
    const reportInput = document.getElementById("report");
    const reqsTextarea = document.getElementById("reqs");
    if (reportInput) reportInput.required = mode !== "poster";
    if (reqsTextarea) reqsTextarea.required = mode !== "poster";
  }
}

posterFileInput.addEventListener("change", () => {
  posterError.textContent = "";
  const file = posterFileInput.files[0];
  if (!file) return;

  if (!POSTER_ALLOWED_TYPES.includes(file.type)) {
    posterError.textContent = "Ảnh poster chỉ chấp nhận JPG, PNG hoặc WebP.";
    posterFileInput.value = "";
    return;
  }
  if (file.size > POSTER_MAX_BYTES) {
    posterError.textContent = "Ảnh poster cần nhỏ hơn hoặc bằng 10MB.";
    posterFileInput.value = "";
    return;
  }

  pendingPosterFile = file;
  const previewUrl = URL.createObjectURL(file);
  posterPreview.innerHTML = `<img src="${previewUrl}" alt="Xem trước poster" />`;
});

removePosterBtn.addEventListener("click", async () => {
  const jobId = document.getElementById("jobId").value;
  if (!jobId) return;
  const confirmed = window.confirm("Xóa ảnh poster hiện tại của vị trí này?");
  if (!confirmed) return;

  try {
    const result = await requestJson(`${API_BASE}/api/admin/jobs/${jobId}/poster`, { method: "DELETE" });
    if (!result.success) throw new Error(result.message || "Không thể xóa ảnh poster.");

    jobs = jobs.map((item) => item.id === result.data.id ? result.data : item);
    editingJobHasPoster = false;
    pendingPosterFile = null;
    posterFileInput.value = "";
    posterPreview.innerHTML = '<span class="poster-upload-placeholder">Chưa có ảnh poster</span>';
    removePosterBtn.hidden = true;
    setDisplayMode("poster");
  } catch (error) {
    posterError.textContent = error.message || "Không thể xóa ảnh poster.";
  }
});

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
const closeJobModalIconBtn = document.getElementById("closeJobModalIconBtn");
if (closeJobModalIconBtn) {
  closeJobModalIconBtn.addEventListener("click", () => {
    jobModal.hidden = true;
  });
}
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("resetApplicationFiltersBtn").addEventListener("click", resetApplicationFilters);
exportApplicationsBtn.addEventListener("click", exportFilteredApplications);
document.querySelectorAll("[data-tab-target]").forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tabTarget));
});

setActiveTab(window.location.hash.slice(1));

window.addEventListener("hashchange", () => {
  setActiveTab(window.location.hash.slice(1), { updateHash: false });
});

applicationFilters.addEventListener("input", renderApplications);
applicationFilters.addEventListener("change", renderApplications);

jobForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = getJobPayload();
  const jobId = document.getElementById("jobId").value;

  if (payload.displayMode === "poster" && !editingJobHasPoster && !pendingPosterFile) {
    showJobMessage("error", "Vui lòng tải ảnh poster trước khi bật chế độ Poster.");
    return;
  }

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

    if (pendingPosterFile) {
      const posterFormData = new FormData();
      posterFormData.append("poster", pendingPosterFile);
      const posterResult = await requestJson(`${API_BASE}/api/admin/jobs/${result.data.id}/poster`, {
        method: "POST",
        body: posterFormData
      });
      if (!posterResult.success) throw new Error(posterResult.message || "Không thể tải lên ảnh poster.");
      pendingPosterFile = null;
    }

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
    const [jobsResult, applicationsResult, departmentsResult, levelsResult] = await Promise.all([
      requestJson(`${API_BASE}/api/admin/jobs`),
      requestJson(`${API_BASE}/api/admin/applications`),
      requestJson(`${API_BASE}/api/admin/departments`).catch(() => ({ success: true, data: [] })),
      requestJson(`${API_BASE}/api/admin/levels`).catch(() => ({ success: true, data: [] }))
    ]);

    jobs = jobsResult.data || [];
    applications = applicationsResult.data || [];
    departments = departmentsResult.data || [];
    jobLevels = levelsResult.data || [];

    renderMetrics();
    renderJobs();
    renderDepartments();
    renderJobLevels();
    renderApplicationFilterOptions();
    renderApplications();
    updateDatalists();
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
    credentials: "include",
    ...(options || {})
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
  // Cleanup for any leftover data from before auth moved to an httpOnly
  // cookie — harmless no-ops once migrated, but clears stale tokens from
  // browsers that logged in under the old scheme.
  localStorage.removeItem("adcAdminToken");
  localStorage.removeItem("adcAdminUser");

  // Best-effort: invalidate the session cookie server-side (bumps
  // token_version and clears the cookie) so it can't be replayed even if it
  // leaked. Don't block the redirect on this — the user is logged out
  // client-side regardless of whether the call succeeds.
  fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    credentials: "include"
  }).catch(() => {});

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
    <tr class="animate-slide-up job-row" style="--anim-order: ${index + 5};">
      <td data-label="Vị trí">
        <div class="table-title">${escapeHtml(job.title)}</div>
        <div class="table-sub">${escapeHtml(job.vn)}</div>
      </td>
      <td data-label="Phòng ban">${escapeHtml(job.dept)}</td>
      <td data-label="Cấp bậc">${escapeHtml(job.level)}</td>
      <td data-label="Trạng thái">
        <span class="pill ${escapeAttribute(job.status)}">${escapeHtml(formatJobStatus(job.status))}</span>
        ${job.displayMode === "poster" ? '<span class="jobs-table-poster-badge">Poster</span>' : ""}
      </td>
      <td data-label="Thao tác">
        <div class="row-actions">
          <button class="btn btn-secondary" type="button" data-action="edit-job" data-id="${job.id}">Sửa</button>
          <button class="btn btn-secondary" type="button" data-action="clone-job" data-id="${job.id}">Nhân bản</button>
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
  if (application.cvViewUrl) {
    return `<a class="cv-link" href="#" data-action="view-cv-link" data-id="${application.id}">${escapeHtml(application.cvOriginalName || "Xem CV")}</a>`;
  }
  if (!application.cvOriginalName && !application.cvFilePath) return "Không có CV";
  return `<a class="cv-link" href="#" data-action="download-cv" data-id="${application.id}">${escapeHtml(application.cvOriginalName || "Tải CV")}</a>`;
}

async function viewCvLink(event, applicationId) {
  event.preventDefault();

  try {
    const response = await fetch(`${API_BASE}/api/admin/applications/${applicationId}/cv-link`, {
      credentials: "include"
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const result = await response.json();
    if (!response.ok || !result.success || !result.url) {
      throw new Error(result.message || "Không thể mở CV.");
    }

    window.open(result.url, "_blank", "noopener");
  } catch (error) {
    window.alert(error.message || "Không thể mở CV.");
  }
}

async function downloadCv(event, applicationId) {
  event.preventDefault();

  try {
    const response = await fetch(`${API_BASE}/api/admin/applications/${applicationId}/cv`, {
      credentials: "include"
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

  pendingPosterFile = null;
  posterFileInput.value = "";
  posterError.textContent = "";
  editingJobHasPoster = Boolean(job.hasPoster);
  setDisplayMode(job.displayMode || "standard");
  if (job.hasPoster) {
    posterPreview.innerHTML = `<img src="${API_BASE}/api/jobs/${job.id}/poster?v=${job.poster_size || 0}" alt="Poster vị trí" />`;
    removePosterBtn.hidden = false;
  } else {
    posterPreview.innerHTML = '<span class="poster-upload-placeholder">Chưa có ảnh poster</span>';
    removePosterBtn.hidden = true;
  }

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
    report: document.getElementById("report").value.trim() || (displayModeInput.value === "poster" ? "P&O" : ""),
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
    displayMode: displayModeInput.value,
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
  document.getElementById("publishedAt").value = toDateInputValue(new Date().toISOString());
  
  document.getElementById("benefits").value = 
`💰 | Thưởng tháng 13 & KPIs theo kết quả kinh doanh
🏥 | Bảo hiểm sức khỏe & khám sức khỏe định kỳ
✈️ | Du lịch & Team building hàng năm`;
  document.getElementById("environmentSections").value = 
`Văn hóa làm việc | Môi trường năng động, tôn trọng sự khác biệt và thúc đẩy sáng tạo.
Phát triển nghề nghiệp | Liên tục được đào tạo nâng cao nghiệp vụ và cơ hội thăng tiến rõ ràng.`;
  
  jobFormMessage.className = "form-message";
  jobFormMessage.textContent = "";

  pendingPosterFile = null;
  editingJobHasPoster = false;
  posterFileInput.value = "";
  posterError.textContent = "";
  posterPreview.innerHTML = '<span class="poster-upload-placeholder">Chưa có ảnh poster</span>';
  removePosterBtn.hidden = true;
  setDisplayMode("poster");
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

function setActiveTab(tabName, { updateHash = true } = {}) {
  const panels = document.querySelectorAll("[data-tab-panel]");
  const validTab = Array.from(panels).some((panel) => panel.dataset.tabPanel === tabName)
    ? tabName
    : "jobs";

  panels.forEach((panel) => {
    const isActive = panel.dataset.tabPanel === validTab;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });

  document.querySelectorAll("[data-tab-target]").forEach((button) => {
    const isActive = button.dataset.tabTarget === validTab;
    button.classList.toggle("active", isActive);
    if (button.getAttribute("role") === "tab") {
      button.setAttribute("aria-selected", String(isActive));
    }
  });

  if (updateHash) {
    const newHash = `#${validTab}`;
    if (window.location.hash !== newHash) {
      history.replaceState(null, "", newHash);
    }
  }
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
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
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
  } else if (action === "clone-job") {
    cloneJob(id);
  } else if (action === "delete-job") {
    deleteJob(id);
  } else if (action === "download-cv") {
    downloadCv(e, id);
  } else if (action === "view-cv-link") {
    viewCvLink(e, id);
  }
});

document.addEventListener("change", (e) => {
  const target = e.target.closest("[data-action='update-status']");
  if (!target) return;
  const id = Number(target.dataset.id);
  updateApplicationStatus(id, target.value);
});

// --- Smart Defaults & Utilities ---

function cloneJob(id) {
  editJob(id);
  document.getElementById("jobId").value = "";
  document.getElementById("slug").value = "";
  document.getElementById("deadline").value = "";
  document.getElementById("publishedAt").value = toDateInputValue(new Date().toISOString());
}

function createSlug(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .trim()
    .replace(/\s+/g, "-");
}

document.getElementById("vn").addEventListener("input", (e) => {
  const jobId = document.getElementById("jobId").value;
  if (!jobId) { // Only auto-generate slug for new jobs
    document.getElementById("slug").value = createSlug(e.target.value);
  }
});



function populateSelect(elementId, items) {
  const select = document.getElementById(elementId);
  if (!select) return;
  const currentVal = select.value;
  const uniqueItems = uniqueSorted(items.filter(Boolean));
  select.innerHTML = uniqueItems.map(item => `<option value="${escapeAttribute(item)}">${escapeHtml(item)}</option>`).join("");
  if (currentVal && uniqueItems.includes(currentVal)) {
    select.value = currentVal;
  }
}

function populateDatalist(elementId, items) {
  const datalist = document.getElementById(elementId);
  if (!datalist) return;
  const uniqueItems = uniqueSorted(items.filter(Boolean));
  datalist.innerHTML = uniqueItems.map(item => `<option value="${escapeAttribute(item)}"></option>`).join("");
}

function updateDatalists() {
  const depts = departments.length ? departments.map(d => d.name) : jobs.map(j => j.dept).filter(Boolean);
  const levels = jobLevels.length ? jobLevels.map(l => l.name) : jobs.map(j => j.level).filter(Boolean);
  const reports = jobs.map(j => j.report).filter(Boolean);
  const industries = jobs.map(j => j.industry).filter(Boolean);
  const workLocations = jobs.map(j => j.workLocation).filter(Boolean);
  const locationShorts = jobs.map(j => j.locationShort).filter(Boolean);

  populateSelect("dept", depts);
  populateSelect("level", levels);

  populateDatalist("deptList", depts);
  populateDatalist("levelList", levels);
  populateDatalist("reportList", reports);
  populateDatalist("industryList", industries);
  populateDatalist("workLocationList", workLocations);
  populateDatalist("locationShortList", locationShorts);
}

loadDashboard();


document.addEventListener("click", (e) => {
  const row = e.target.closest(".job-row");
  if (row) {
    document.querySelectorAll(".job-row").forEach(r => r.classList.remove("selected"));
    row.classList.add("selected");
  } else if (!e.target.closest(".row-actions") && !e.target.closest(".modal") && !e.target.closest("button")) {
    document.querySelectorAll(".job-row").forEach(r => r.classList.remove("selected"));
  }
});


// ========================================================
// CATEGORIES MANAGEMENT (Departments & Job Levels)
// ========================================================

function renderDepartments() {
  const tbody = document.getElementById("departmentsTable");
  if (!tbody) return;

  if (departments.length === 0) {
    tbody.innerHTML = emptyRow("Chưa có phòng ban nào.", 3);
    return;
  }

  tbody.innerHTML = departments.map((dept, index) => `
    <tr class="animate-slide-up" style="--anim-order: ${index + 1};">
      <td><strong>${escapeHtml(dept.name)}</strong></td>
      <td>${escapeHtml(dept.description || "—")}</td>
      <td>
        <div class="row-actions" style="display:flex !important;">
          <button class="btn btn-secondary" type="button" data-action="edit-dept" data-id="${dept.id}">Sửa</button>
          <button class="btn btn-danger" type="button" data-action="delete-dept" data-id="${dept.id}">Xóa</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderJobLevels() {
  const tbody = document.getElementById("jobLevelsTable");
  if (!tbody) return;

  if (jobLevels.length === 0) {
    tbody.innerHTML = emptyRow("Chưa có cấp bậc nào.", 3);
    return;
  }

  tbody.innerHTML = jobLevels.map((lvl, index) => `
    <tr class="animate-slide-up" style="--anim-order: ${index + 1};">
      <td><strong>${escapeHtml(lvl.name)}</strong></td>
      <td>${escapeHtml(lvl.description || "—")}</td>
      <td>
        <div class="row-actions" style="display:flex !important;">
          <button class="btn btn-secondary" type="button" data-action="edit-level" data-id="${lvl.id}">Sửa</button>
          <button class="btn btn-danger" type="button" data-action="delete-level" data-id="${lvl.id}">Xóa</button>
        </div>
      </td>
    </tr>
  `).join("");
}

// Department Modal Handlers
const departmentModal = document.getElementById("departmentModal");
const departmentForm = document.getElementById("departmentForm");
const departmentFormMessage = document.getElementById("departmentFormMessage");

document.getElementById("addDepartmentBtn")?.addEventListener("click", () => {
  document.getElementById("departmentId").value = "";
  document.getElementById("departmentName").value = "";
  document.getElementById("departmentDescription").value = "";
  document.getElementById("departmentModalTitle").textContent = "Thêm phòng ban mới";
  departmentFormMessage.textContent = "";
  departmentFormMessage.className = "form-message";
  departmentModal.removeAttribute("hidden");
});

document.getElementById("closeDepartmentModalBtn")?.addEventListener("click", () => {
  departmentModal.setAttribute("hidden", "true");
});
document.getElementById("closeDepartmentModalIconBtn")?.addEventListener("click", () => {
  departmentModal.setAttribute("hidden", "true");
});

departmentForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("departmentId").value;
  const name = document.getElementById("departmentName").value.trim();
  const description = document.getElementById("departmentDescription").value.trim();

  try {
    const url = id ? `${API_BASE}/api/admin/departments/${id}` : `${API_BASE}/api/admin/departments`;
    const method = id ? "PUT" : "POST";
    const res = await requestJson(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description })
    });
    if (!res.success) throw new Error(res.message || "Lỗi lưu phòng ban.");
    departmentModal.setAttribute("hidden", "true");
    await loadDashboard();
  } catch (err) {
    departmentFormMessage.textContent = err.message;
    departmentFormMessage.className = "form-message visible error";
  }
});

// Job Level Modal Handlers
const jobLevelModal = document.getElementById("jobLevelModal");
const jobLevelForm = document.getElementById("jobLevelForm");
const jobLevelFormMessage = document.getElementById("jobLevelFormMessage");

document.getElementById("addJobLevelBtn")?.addEventListener("click", () => {
  document.getElementById("jobLevelId").value = "";
  document.getElementById("jobLevelName").value = "";
  document.getElementById("jobLevelDescription").value = "";
  document.getElementById("jobLevelModalTitle").textContent = "Thêm cấp bậc mới";
  jobLevelFormMessage.textContent = "";
  jobLevelFormMessage.className = "form-message";
  jobLevelModal.removeAttribute("hidden");
});

document.getElementById("closeJobLevelModalBtn")?.addEventListener("click", () => {
  jobLevelModal.setAttribute("hidden", "true");
});
document.getElementById("closeJobLevelModalIconBtn")?.addEventListener("click", () => {
  jobLevelModal.setAttribute("hidden", "true");
});

jobLevelForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("jobLevelId").value;
  const name = document.getElementById("jobLevelName").value.trim();
  const description = document.getElementById("jobLevelDescription").value.trim();

  try {
    const url = id ? `${API_BASE}/api/admin/levels/${id}` : `${API_BASE}/api/admin/levels`;
    const method = id ? "PUT" : "POST";
    const res = await requestJson(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description })
    });
    if (!res.success) throw new Error(res.message || "Lỗi lưu cấp bậc.");
    jobLevelModal.setAttribute("hidden", "true");
    await loadDashboard();
  } catch (err) {
    jobLevelFormMessage.textContent = err.message;
    jobLevelFormMessage.className = "form-message visible error";
  }
});

// Edit & Delete Handlers for Departments and Job Levels
document.addEventListener("click", async (e) => {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  const id = Number(target.dataset.id);

  if (action === "edit-dept") {
    const dept = departments.find(d => d.id === id);
    if (!dept) return;
    document.getElementById("departmentId").value = dept.id;
    document.getElementById("departmentName").value = dept.name;
    document.getElementById("departmentDescription").value = dept.description || "";
    document.getElementById("departmentModalTitle").textContent = "Chỉnh sửa phòng ban";
    departmentFormMessage.textContent = "";
    departmentFormMessage.className = "form-message";
    departmentModal.removeAttribute("hidden");
  } else if (action === "delete-dept") {
    const dept = departments.find(d => d.id === id);
    if (!dept || !confirm(`Bạn có chắc chắn muốn xóa phòng ban "${dept.name}"?`)) return;
    try {
      const res = await requestJson(`${API_BASE}/api/admin/departments/${id}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.message || "Không thể xóa phòng ban.");
      await loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  } else if (action === "edit-level") {
    const lvl = jobLevels.find(l => l.id === id);
    if (!lvl) return;
    document.getElementById("jobLevelId").value = lvl.id;
    document.getElementById("jobLevelName").value = lvl.name;
    document.getElementById("jobLevelDescription").value = lvl.description || "";
    document.getElementById("jobLevelModalTitle").textContent = "Chỉnh sửa cấp bậc";
    jobLevelFormMessage.textContent = "";
    jobLevelFormMessage.className = "form-message";
    jobLevelModal.removeAttribute("hidden");
  } else if (action === "delete-level") {
    const lvl = jobLevels.find(l => l.id === id);
    if (!lvl || !confirm(`Bạn có chắc chắn muốn xóa cấp bậc "${lvl.name}"?`)) return;
    try {
      const res = await requestJson(`${API_BASE}/api/admin/levels/${id}`, { method: "DELETE" });
      if (!res.success) throw new Error(res.message || "Không thể xóa cấp bậc.");
      await loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  }
});
