let positions = [];
let selectedDept = "all";
let expandedJob = null;
let currentApplyJob = "ADC Careers";
let currentApplyJobId = null;
let recaptchaWidgetId = null;
let policyRead = false;

function openPolicyModal() {
  const policyModal = document.getElementById("policyModal");
  if (!policyModal) return;
  policyModal.classList.add("show");
  policyModal.setAttribute("aria-hidden", "false");
  checkPolicyScroll();
}

function closePolicyModal() {
  const policyModal = document.getElementById("policyModal");
  if (!policyModal) return;
  policyModal.classList.remove("show");
  policyModal.setAttribute("aria-hidden", "true");
}

function checkPolicyScroll() {
  if (policyRead) return;
  const el = document.getElementById("policyModalBody");
  const policyHint = document.getElementById("policyHint");
  if (!el || !policyHint) return;
  const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
  if (reachedBottom) {
    policyRead = true;
    policyHint.textContent = "Bạn đã đọc hết nội dung. Vui lòng đóng cửa sổ này và tick đồng ý.";
    policyHint.classList.add("done");
  }
}

function updateSubmitButtonState() {

  const form = document.getElementById("demoApplyForm");
  if (!form) return;
  const consentCheckbox = document.getElementById("demoConsent");
  const submitBtn = form.querySelector('.apply-submit');
  if (submitBtn) {
    submitBtn.disabled = !consentCheckbox || !consentCheckbox.checked;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const policyBody = document.getElementById("policyModalBody");
  if (policyBody) policyBody.addEventListener("scroll", checkPolicyScroll);

  const consentCheckbox = document.getElementById("demoConsent");
  if (consentCheckbox) {
    consentCheckbox.addEventListener("click", (event) => {
      if (!policyRead) {
        event.preventDefault();
        openPolicyModal();
      }
    });
    consentCheckbox.addEventListener("change", updateSubmitButtonState);
  }
  updateSubmitButtonState();
});


async function loadPositions() {
  positions = await fetchJobs(); // from shared.js
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
    const color = d === "all" ? "#FFD700" : RAINBOW[(i - 1) % 7];
    const isActive = selectedDept === d;
    return `<button class="demo-filter-btn${isActive ? ' active' : ''}" data-dept="${escapeAttribute(d)}" data-action="filter-dept" style="--filter-color:${color};--filter-color-bg:${color}1a">${escapeHtml(label)}</button>`;
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
    const safeColor = escapeAttribute(job.color || "#2196F3");
    return `
<div class="demo-job-card animate-on-scroll" data-job-id="${job.id}" style="--job-color:${safeColor};border-left-color:${safeColor}">
<div class="demo-job-header" data-action="toggle-job" data-id="${job.id}" data-href="${escapeAttribute(detailUrl)}">
<div class="demo-job-meta">
          ${job.urgent ? `<span class="demo-urgent-badge">URGENT</span>` : ''}
<div>
<div class="demo-job-title">${escapeHtml(job.title)}</div>
<div class="demo-job-vn" style="color:${safeColor}">${escapeHtml(job.vn)}</div>
</div>
</div>
<div class="demo-job-right">
<span class="demo-job-dept-badge">${escapeHtml(job.dept)}</span>
<span class="demo-job-arrow" style="color:${safeColor};transform:${isOpen ? 'rotate(180deg)' : 'rotate(0)'}">▾</span>
</div>
</div>
<div class="demo-job-body${isOpen ? '' : ' hidden'}" style="border-top-color:${safeColor}18">
<div class="demo-job-body-inner">
<div>
<div class="demo-reqs-label" style="color:${safeColor}">YÊU CẦU CHÍNH</div>
            ${job.reqs.map(r => `<div class="demo-req-item">${escapeHtml(r)}</div>`).join("")}
</div>
<div>
<div class="demo-info-label" style="color:${safeColor}">THÔNG TIN</div>
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
<button class="demo-apply-btn" type="button" data-open-apply data-apply-job="${escapeAttribute(job.vn || job.title)}" data-job-id="${job.id}" style="background:${safeColor}">ỨNG TUYỂN NGAY →</button>
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

  policyRead = false;
  const consentCheckbox = document.getElementById("demoConsent");
  const consentTalentPoolCheckbox = document.getElementById("demoConsentTalentPool");
  const policyHint = document.getElementById("policyHint");
  if (consentCheckbox) {
    consentCheckbox.checked = false;
  }
  if (consentTalentPoolCheckbox) {
    consentTalentPoolCheckbox.checked = false;
  }
  updateSubmitButtonState();


  if (policyHint) {
    policyHint.textContent = "Vui lòng cuộn xuống hết nội dung để có thể tick đồng ý.";
    policyHint.classList.remove("done");
  }

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

  if (event.target.closest("[data-open-policy]")) {
    event.preventDefault();
    openPolicyModal();
    return;
  }

  if (event.target.closest("[data-close-policy]")) {
    event.preventDefault();
    closePolicyModal();
    return;
  }

  const modal = document.getElementById("applyModal");
  if (event.target === modal) closeApplyModal();

  const policyModal = document.getElementById("policyModal");
  if (event.target === policyModal) closePolicyModal();

  const filterBtn = event.target.closest("[data-action='filter-dept']");
  if (filterBtn) {
    setDept(filterBtn.dataset.dept);
    return;
  }

  const toggleBtn = event.target.closest("[data-action='toggle-job']");
  if (toggleBtn) {
    window.location.href = toggleBtn.dataset.href;
    return;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const policyModal = document.getElementById("policyModal");
  if (policyModal && policyModal.classList.contains("show")) {
    closePolicyModal();
    return;
  }
  closeApplyModal();
});

document.addEventListener("DOMContentLoaded", () => {
  loadPositions();

  const form = document.getElementById("demoApplyForm");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const currentTarget = event.currentTarget;
      if (!currentTarget.reportValidity()) return;

      const consentCheckbox = currentTarget.querySelector("#demoConsent");
      const consentError = currentTarget.querySelector('[data-field="consent"] .error-text');
      if (consentError) consentError.textContent = "";
      if (consentCheckbox && !consentCheckbox.checked) {
        if (consentError) {
          consentError.textContent = !policyRead
            ? "Vui lòng mở và đọc hết Tuyên Bố Bảo Mật trước khi đồng ý."
            : "Vui lòng đồng ý với Tuyên Bố Bảo Mật trước khi gửi hồ sơ.";
        }
        return;
      }

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
          currentTarget.reset();

          const appliedJob = positions.find(item => item.id === currentApplyJobId);
          const thankYouUrl = new URL("/thank-you.html", window.location.origin);
          thankYouUrl.searchParams.set("job", currentApplyJob);
          thankYouUrl.searchParams.set("slug", appliedJob ? appliedJob.slug : "");
          window.location.href = thankYouUrl.href;
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
});
