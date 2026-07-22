let positions = [];
let selectedDept = "all";
let expandedJob = null;
let currentApplyJob = "ADC Careers";
let currentApplyJobId = null;
let recaptchaWidgetId = null;

const params = new URLSearchParams(window.location.search);
const detailJobId = Number(params.get("id"));
const detailJobSlug = params.get("slug") || "";
const PAGE_PATH = window.location.pathname.replaceAll("\\", "/");
const DEMO_PAGE = PAGE_PATH.split("/").pop() || "index.html";

async function loadPositions() {
  if (detailJobId || detailJobSlug) {
    document.body.classList.add("detail-mode");
    document.getElementById("jobDetailSection").hidden = false;
  }

  positions = await fetchJobs(); // from shared.js

  if (detailJobId || detailJobSlug) {
    renderDetailPage();
    return;
  }

  renderFilters();
  renderJobs();
}

function activePositions() {
  return positions.filter(job => job.status === "active");
}

function departments() {
  return ["all", ...new Set(activePositions().map(job => job.dept))];
}

function renderFilters() {
  const bar = document.getElementById("filterBar");
  if (!bar) return;
  bar.innerHTML = departments().map((d, i) => {
    const label = d === "all" ? "Tất cả" : d;
    const color = RAINBOW[i % 7];
    const isActive = selectedDept === d;
    return `<button class="demo-filter-btn${isActive ? ' active' : ''}" data-dept="${escapeAttribute(d)}" data-action="filter-dept" style="${isActive ? `--active-color:${color};border-color:${color};color:${color};background:${color}20` : ''}">${escapeHtml(label)}</button>`;
  }).join("");
  setTimeout(() => { if (window.initScrollAnimations) window.initScrollAnimations(); }, 50);
}

function renderJobs() {
  const filtered = selectedDept === "all" ? activePositions() : activePositions().filter(p => p.dept === selectedDept);
  const list = document.getElementById("jobList");
  if (!list) return;

  if (!filtered.length) {
    list.innerHTML = `<div class="demo-jobs-state">Chưa có vị trí phù hợp với bộ lọc hiện tại.</div>`;
    return;
  }

  list.innerHTML = filtered.map(job => {
    const isOpen = expandedJob === job.id;
    const detailUrl = jobUrl(job); // from shared.js
    return `
<div class="demo-job-card animate-on-scroll" data-job-id="${job.id}" style="--job-color:${job.color};border-left-color:${job.color}">
<div class="demo-job-header" data-action="toggle-job" data-id="${job.id}">
<div class="demo-job-meta">
          ${job.urgent ? `<span class="demo-urgent-badge">URGENT</span>` : ''}
<div>
<div class="demo-job-title">${escapeHtml(job.title)}</div>
<div class="demo-job-vn" style="color:${job.color}">${escapeHtml(job.vn)}</div>
</div>
</div>
<div class="demo-job-right">
<span class="demo-job-dept-badge">${escapeHtml(job.dept)}</span>
<span class="demo-job-arrow" style="color:${job.color};transform:${isOpen ? 'rotate(180deg)' : 'rotate(0)'}">▾</span>
</div>
</div>
<div class="demo-job-body${isOpen ? '' : ' hidden'}" style="border-top-color:${job.color}18">
<div class="demo-job-body-inner">
<div>
<div class="demo-reqs-label" style="color:${job.color}">YÊU CẦU CHÍNH</div>
            ${job.reqs.map(r => `<div class="demo-req-item">${escapeHtml(r)}</div>`).join("")}
</div>
<div>
<div class="demo-info-label" style="color:${job.color}">THÔNG TIN</div>
<div class="demo-info-list">
<div>📍 ${escapeHtml(job.workLocation || "KCN Tân Tạo, Q. Bình Tân, TP.HCM")}</div>
<div>👤 Báo cáo: ${escapeHtml(job.report || "P&O")}</div>
<div>⏰ ${escapeHtml(job.employmentType || job.level || "Full-time")}</div>
<div>💰 ${escapeHtml(job.salaryText || "Cạnh tranh, thỏa thuận theo năng lực")}</div>
</div>
</div>
</div>
<div class="demo-job-actions">
<a href="${detailUrl}" class="demo-detail-btn">XEM CHI TIẾT</a>
<button class="demo-apply-btn" type="button" data-open-apply data-apply-job="${escapeAttribute(job.vn || job.title)}" data-job-id="${job.id}" style="background:${job.color}">ỨNG TUYỂN NGAY →</button>
</div>
</div>
</div>`;
  }).join("");

  setTimeout(() => {
    if (window.initScrollAnimations) window.initScrollAnimations();
  }, 50);
}

window.setDept = function (dept) {
  selectedDept = dept;
  expandedJob = null;
  renderFilters();
  renderJobs();
};

window.toggleJob = function (id) {
  expandedJob = expandedJob === id ? null : id;

  const allCards = document.querySelectorAll('.demo-job-card');
  allCards.forEach(card => {
    const cardId = Number(card.dataset.jobId);
    const body = card.querySelector('.demo-job-body');
    const arrow = card.querySelector('.demo-job-arrow');

    if (cardId === expandedJob) {
      body.classList.remove('hidden');
      if (arrow) arrow.style.transform = 'rotate(180deg)';
    } else {
      body.classList.add('hidden');
      if (arrow) arrow.style.transform = 'rotate(0)';
    }
  });
};

function openApplyModal(jobName = "ADC Careers", jobId = null) {
  const modal = document.getElementById("applyModal");
  const jobLabel = document.getElementById("applyModalJob");
  const genericSelect = document.getElementById("genericJobSelect");
  const selectEl = document.getElementById("demoJobId");

  if (!modal) return;
  currentApplyJob = jobName || "ADC Careers";
  currentApplyJobId = jobId;
  jobLabel.textContent = currentApplyJob;

  loadReCaptcha().then(() => {
    if (recaptchaWidgetId === null && window.grecaptcha) {
      const baseUrl = window.ADC_API_BASE ?? (window.location.protocol === "file:" ? "http://localhost:5000" : "");
      const cleanBaseUrl = baseUrl.replace(/\/$/, "");
      fetch(`${cleanBaseUrl}/api/config/public`)
        .then(res => res.json())
        .then(config => {
          if (config.recaptchaSiteKey) {
            recaptchaWidgetId = grecaptcha.render("recaptchaContainer", {
              sitekey: config.recaptchaSiteKey
            });
          }
        })
        .catch(e => console.error("Failed to load captcha config", e));
    } else if (recaptchaWidgetId !== null && window.grecaptcha) {
      grecaptcha.reset(recaptchaWidgetId);
    }
  });

  const captchaError = modal.querySelector('[data-field="captcha"] .error-text');
  if (captchaError) captchaError.textContent = "";

  if (genericSelect && selectEl) {
    if (!jobId) {
      genericSelect.style.display = "block";
      selectEl.required = true;
      selectEl.innerHTML = `<option value="">-- Chọn vị trí ứng tuyển --</option>` +
        positions.map(p => `<option value="${p.id}">${escapeAttribute(p.vn || p.title)}</option>`).join("");
    } else {
      genericSelect.style.display = "none";
      selectEl.required = false;
      selectEl.innerHTML = `<option value="${jobId}" selected>Selected</option>`;
    }
  }

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeApplyModal() {
  const modal = document.getElementById("applyModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.addEventListener("click", (event) => {
  const applyButton = event.target.closest("[data-open-apply]");
  if (applyButton) {
    event.preventDefault();
    openApplyModal(applyButton.dataset.applyJob, applyButton.dataset.jobId);
    return;
  }

  if (event.target.closest("[data-close-apply]")) {
    event.preventDefault();
    closeApplyModal();
    return;
  }

  const modal = document.getElementById("applyModal");
  if (event.target === modal) closeApplyModal();

  const filterBtn = event.target.closest("[data-action='filter-dept']");
  if (filterBtn) {
    setDept(filterBtn.dataset.dept);
    return;
  }

  const toggleBtn = event.target.closest("[data-action='toggle-job']");
  if (toggleBtn) {
    toggleJob(Number(toggleBtn.dataset.id));
    return;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeApplyModal();
});

document.addEventListener("DOMContentLoaded", () => {
  loadPositions();

  const form = document.getElementById("demoApplyForm");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const currentTarget = event.currentTarget;
      if (!currentTarget.reportValidity()) return;

      const submitBtn = currentTarget.querySelector('.apply-submit');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'ĐANG GỬI...';
      submitBtn.disabled = true;

      try {
        const captchaError = currentTarget.querySelector('[data-field="captcha"] .error-text');
        if (captchaError) captchaError.textContent = "";

        const formData = new FormData(currentTarget);
        // jobId đã được submit tự động qua <select name="jobId">

        if (recaptchaWidgetId !== null && window.grecaptcha) {
          const token = grecaptcha.getResponse(recaptchaWidgetId);
          if (!token) {
            if (captchaError) captchaError.textContent = "Vui lòng xác thực bạn không phải là người máy.";
            throw new Error("CAPTCHA_MISSING");
          }
          formData.append("captchaToken", token);
        }

        const apiBaseUrl = typeof API_BASE !== 'undefined' ? API_BASE : (window.ADC_API_BASE ?? (window.location.protocol === "file:" ? "http://localhost:5000" : ""));
        const cleanBaseUrl = apiBaseUrl.replace(/\/$/, "");

        const response = await fetch(`${cleanBaseUrl}/api/apply`, {
          method: "POST",
          body: formData
        });

        const result = await response.json();

        if (response.ok && result.success !== false) {
          closeApplyModal();
          alert(`Hồ sơ ứng tuyển cho ${currentApplyJob} đã được gửi thành công!`);
          currentTarget.reset();
        } else {
          alert(`Lỗi: ${result.message || 'Không thể gửi hồ sơ. Vui lòng kiểm tra lại kích thước hoặc định dạng file.'}`);
          if (recaptchaWidgetId !== null && window.grecaptcha) grecaptcha.reset(recaptchaWidgetId);
        }
      } catch (error) {
        if (error.message !== "CAPTCHA_MISSING") {
          console.error("Apply error:", error);
          alert("Có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại sau.");
          if (recaptchaWidgetId !== null && window.grecaptcha) grecaptcha.reset(recaptchaWidgetId);
        }
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});

function renderDetailPage() {
  document.body.classList.add("detail-mode");
  document.getElementById("jobDetailSection").hidden = false;

  document.querySelectorAll('nav a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = `${DEMO_PAGE}${link.getAttribute("href")}`;
    });
  });

  const loading = document.getElementById("detailLoading");
  const notFound = document.getElementById("detailNotFound");
  const card = document.getElementById("detailCard");
  const job = activePositions().find(item => {
    if (detailJobSlug) return item.slug === detailJobSlug;
    return item.id === detailJobId;
  });

  loading.hidden = true;

  if (!job) {
    notFound.hidden = false;
    document.title = "ADC Careers | Không tìm thấy vị trí";
    return;
  }

  document.title = `ADC Careers | ${job.title}`;
  card.style.setProperty("--detail-color", job.color || "#2196F3");
  card.innerHTML = buildDetailCard(job);

  card.hidden = false;
}

function buildDetailCard(job) {
  const related = activePositions()
    .filter(item => item.id !== job.id)
    .filter(item => item.dept === job.dept || (job.industry && item.industry === job.industry))
    .slice(0, 3);

  const fallbackColor = "#2196F3"; // blue

  return `
<div class="detail-head">
<div>
<div class="detail-kicker">Chi tiết vị trí ứng tuyển</div>
<h1 class="detail-title">${escapeHtml(job.vn || job.title)}</h1>
<div class="detail-vn">${escapeHtml(job.title)} · ${escapeHtml(job.dept || "ADC")}</div>
<p class="detail-summary">${escapeHtml(job.summary || defaultSummary(job))}</p>
</div>
<div class="detail-tags">
${job.urgent ? '<span class="detail-tag urgent">URGENT</span>' : ""}
<span class="detail-tag">${escapeHtml(job.locationShort || "TP.HCM")}</span>
<span class="detail-tag">${escapeHtml(job.employmentType || "Full-time")}</span>
<span class="detail-tag">${escapeHtml(job.level || "Specialist")}</span>
</div>
</div>

<div class="detail-overview">
${renderOverview("Độ tuổi", job.ageRange || "Không yêu cầu")}
${renderOverview("Kinh nghiệm", job.experienceText || experienceFallback(job))}
${renderOverview("Ngành nghề", job.industry || job.dept)}
${renderOverview("Ngày đăng", formatDate(job.publishedAt))}
${renderOverview("Hạn nộp", formatDate(job.deadline))}
${renderOverview("Số lượng", `${job.quantity || 1} người`)}
${renderOverview("Báo cáo", job.report || "P&O")}
${renderOverview("Đãi ngộ", job.salaryText)}
${renderOverview("Địa điểm", job.workLocation)}
</div>

<div class="detail-content two-col">
${renderListSection("KEY RESPONSIBILITIES", "Nhiệm vụ chính", job.responsibilities && job.responsibilities.length ? job.responsibilities : job.reqs)}
${renderListSection("REQUIREMENTS", "Tiêu chí tuyển dụng", job.requirementsDetail && job.requirementsDetail.length ? job.requirementsDetail : job.reqs)}
</div>

<div class="detail-content">
<div class="detail-section-card">
<div class="detail-block-title">Benefits</div>
<h2 class="detail-section-title">Quyền lợi</h2>
<div class="detail-benefits">
${(job.benefits && job.benefits.length ? job.benefits : defaultBenefits()).map(benefit => `
<div class="detail-benefit"><span>${escapeHtml(benefit.icon || "•")}</span>${escapeHtml(benefit.text)}</div>
`).join("")}
</div>
</div>

<div class="detail-section-card">
<div class="detail-block-title">ADC Working Environment</div>
<h2 class="detail-section-title">Môi trường làm việc tại ADC</h2>
<div class="detail-accordion">
${(job.environmentSections && job.environmentSections.length ? job.environmentSections : defaultEnvironmentSections()).map((section, index) => `
<details ${index === 0 ? "open" : ""}>
<summary>${escapeHtml(section.title)}</summary>
<p>${escapeHtml(section.content)}</p>
</details>
`).join("")}
</div>
</div>

${related.length ? `
<div class="detail-section-card">
<div class="detail-block-title">Open Positions</div>
<h2 class="detail-section-title">Vị trí tương tự</h2>
<div class="detail-related">
${related.map(item => `
<a class="detail-related-card" href="index.html?slug=${encodeURIComponent(item.slug)}" style="--related-color:${escapeAttribute(item.color || fallbackColor)}">
<span>ADC · ${escapeHtml(item.dept)}</span>
<strong>${escapeHtml(item.title)}</strong>
<small>${escapeHtml(item.vn)}</small>
</a>
`).join("")}
</div>
</div>` : ""}

<div class="detail-actions">
<button class="detail-primary" type="button" data-open-apply data-apply-job="${escapeAttribute(job.vn || job.title)}" data-job-id="${job.id}">Ứng tuyển ngay</button>
<a class="detail-secondary" href="${DEMO_PAGE}#co-hoi">Xem vị trí khác</a>
</div>
</div>
`;
}

function renderOverview(label, value) {
  return `<div class="detail-overview-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "Đang cập nhật")}</strong></div>`;
}

function renderListSection(enTitle, viTitle, items) {
  const list = items && items.length ? items : ["Thông tin chi tiết sẽ được cập nhật trong quá trình trao đổi."];
  return `
<div class="detail-section-card">
<div class="detail-block-title">${escapeHtml(enTitle)}</div>
<h2 class="detail-section-title">${escapeHtml(viTitle)}</h2>
<div class="detail-reqs">
${list.map(item => `<div class="detail-req">${escapeHtml(item)}</div>`).join("")}
</div>
</div>`;
}

function defaultSummary(job) {
  return `Cơ hội đồng hành cùng ADC trong vai trò ${job.vn || job.title}, tập trung vào kết quả, năng lực chuyên môn và tinh thần cải tiến liên tục.`;
}

function experienceFallback(job) {
  if (job.reqs) {
    return job.reqs.find(item => /\\d|năm|year/i.test(item)) || "Theo mô tả công việc";
  }
  return "Theo mô tả công việc";
}

function formatDate(dateStr) {
  if (!dateStr) return "Đang cập nhật";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch (e) {
    return dateStr;
  }
}

function defaultBenefits() {
  return [
    { icon: "🎓", text: "Đào tạo và phát triển chuyên môn" },
    { icon: "💰", text: "Lương cạnh tranh theo năng lực" },
    { icon: "🛡️", text: "Bảo hiểm và phúc lợi theo quy định" },
    { icon: "🏭", text: "Môi trường sản xuất hiện đại" },
    { icon: "📈", text: "Cơ hội tham gia các dự án cải tiến" },
    { icon: "🤝", text: "Đồng hành cùng đội ngũ quản lý giàu kinh nghiệm" }
  ];
}

function defaultEnvironmentSections() {
  return [
    {
      title: "Nhà máy hiện đại",
      content: "ADC vận hành hệ thống nhà máy tại KCN Tân Tạo với máy móc, quy trình và tiêu chuẩn quản lý hướng đến hiệu suất ổn định."
    },
    {
      title: "Chuyển đổi số trong vận hành",
      content: "Môi trường ứng dụng SAP HANA, Salesforce CRM, Office 365, Power BI và các giải pháp tự động hóa."
    },
    {
      title: "Văn hóa cải tiến liên tục",
      content: "ADC khuyến khích tinh thần chủ động, học hỏi, phối hợp liên phòng ban và đề xuất giải pháp tạo giá trị bền vững."
    }
  ];
}



// Scroll Animations Logic
window.initScrollAnimations = function () {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-visible');
        obs.unobserve(entry.target); // Chỉ chạy một lần
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

  document.querySelectorAll('.animate-on-scroll:not(.animate-visible)').forEach(el => {
    observer.observe(el);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  if (window.initScrollAnimations) window.initScrollAnimations();

  // CTA Section Color Picker Logic
  const ctaSection = document.querySelector(".demo-cta-section");
  const ctaColorPicker = document.getElementById("ctaColorPicker");

  if (ctaSection && ctaColorPicker) {
    ctaColorPicker.addEventListener("input", (e) => {
      ctaSection.style.background = e.target.value;
    });
  }
});
