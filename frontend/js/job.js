let allJobs = [];
let currentApplyJob = "ADC Careers";
let currentApplyJobId = null;
let recaptchaWidgetId = null;
let policyRead = false;
let job = null;

const params = new URLSearchParams(window.location.search);
const jobId = Number(params.get("id"));
const pathParts = window.location.pathname.split("/").filter(Boolean);
const jobSlug = params.get("slug") || (pathParts[0] === "jobs" ? decodeURIComponent(pathParts[1] || "") : "");

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

function openApplyModal(jobName = "ADC Careers", jobIdArg = null) {
  const modal = document.getElementById("applyModal");
  const jobLabel = document.getElementById("applyModalJob");
  const genericSelect = document.getElementById("genericJobSelect");
  const selectEl = document.getElementById("demoJobId");

  if (!modal) return;
  currentApplyJob = jobName || "ADC Careers";
  currentApplyJobId = jobIdArg;
  jobLabel.textContent = currentApplyJob;

  policyRead = false;
  const consentCheckbox = document.getElementById("demoConsent");
  const consentTalentPoolCheckbox = document.getElementById("demoConsentTalentPool");
  const policyHint = document.getElementById("policyHint");
  if (consentCheckbox) consentCheckbox.checked = false;
  if (consentTalentPoolCheckbox) consentTalentPoolCheckbox.checked = false;
  updateSubmitButtonState();

  if (policyHint) {
    policyHint.textContent = "Vui lòng cuộn xuống hết nội dung để có thể tick đồng ý.";
    policyHint.classList.remove("done");
  }

  loadReCaptcha().then(() => {
    if (recaptchaWidgetId === null && window.grecaptcha) {
      fetch(`${API_BASE}/api/config/public`)
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
    genericSelect.style.display = "none";
    selectEl.required = false;
    selectEl.innerHTML = jobIdArg ? `<option value="${jobIdArg}" selected>Selected</option>` : "";
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

  const form = document.getElementById("demoApplyForm");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const currentTarget = event.currentTarget;
      if (!currentTarget.reportValidity()) return;

      const consentCheckboxEl = currentTarget.querySelector("#demoConsent");
      const consentError = currentTarget.querySelector('[data-field="consent"] .error-text');
      if (consentError) consentError.textContent = "";
      if (consentCheckboxEl && !consentCheckboxEl.checked) {
        if (consentError) {
          consentError.textContent = !policyRead
            ? "Vui lòng mở và đọc hết Tuyên Bố Bảo Mật trước khi đồng ý."
            : "Vui lòng đồng ý với Tuyên Bố Bảo Mật trước khi gửi hồ sơ.";
        }
        return;
      }

      const submitBtn = currentTarget.querySelector('.apply-submit');
      const submitBtnOriginalHTML = submitBtn.innerHTML;

      // Helper: show inline error inside the form instead of alert()
      function showFormError(message) {
        let errEl = currentTarget.querySelector('.apply-form-error');
        if (!errEl) {
          errEl = document.createElement('div');
          errEl.className = 'apply-form-error';
          errEl.setAttribute('role', 'alert');
          submitBtn.parentElement.insertBefore(errEl, submitBtn);
        }
        errEl.textContent = message;
        errEl.style.cssText = 'color:#dc2626;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:.6rem .9rem;margin-bottom:.75rem;font-size:.875rem;line-height:1.5;';
        errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      function clearFormError() {
        const errEl = currentTarget.querySelector('.apply-form-error');
        if (errEl) errEl.remove();
      }

      const SPINNER_HTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="animation:spin .7s linear infinite;vertical-align:-.2em;margin-right:.4em"><style>@keyframes spin{to{transform:rotate(360deg)}}</style><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>ĐANG GỬI...`;

      submitBtn.innerHTML = SPINNER_HTML;
      submitBtn.disabled = true;
      clearFormError();

      try {
        const captchaError = currentTarget.querySelector('[data-field="captcha"] .error-text');
        if (captchaError) captchaError.textContent = "";

        const formData = new FormData(currentTarget);
        formData.set("jobId", currentApplyJobId);

        if (recaptchaWidgetId !== null && window.grecaptcha) {
          const token = grecaptcha.getResponse(recaptchaWidgetId);
          if (!token) {
            if (captchaError) captchaError.textContent = "Vui lòng xác thực bạn không phải là người máy.";
            throw new Error("CAPTCHA_MISSING");
          }
          formData.append("captchaToken", token);
        }

        // Timeout 30s để tránh người dùng chờ vô thời hạn khi server chậm
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        let response;
        try {
          response = await fetch(`${API_BASE}/api/apply`, {
            method: "POST",
            body: formData,
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeoutId);
        }

        const result = await response.json();

        if (response.ok && result.success !== false) {
          closeApplyModal();
          currentTarget.reset();

          const thankYouUrl = new URL("/thank-you.html", window.location.origin);
          thankYouUrl.searchParams.set("job", currentApplyJob);
          thankYouUrl.searchParams.set("slug", job ? job.slug : "");
          window.location.href = thankYouUrl.href;
        } else {
          const serverMsg = result.message || "Không thể gửi hồ sơ. Vui lòng kiểm tra lại kích thước hoặc định dạng file.";
          showFormError(serverMsg);
          if (recaptchaWidgetId !== null && window.grecaptcha) grecaptcha.reset(recaptchaWidgetId);
        }
      } catch (error) {
        if (error.message !== "CAPTCHA_MISSING") {
          console.error("Apply error:", error);
          const isTimeout = error.name === "AbortError";
          const isNetworkError = error instanceof TypeError;
          const friendlyMsg = isTimeout
            ? "Yêu cầu mất quá nhiều thời gian. Vui lòng kiểm tra kết nối mạng và thử lại."
            : isNetworkError
              ? "Không kết nối được máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại."
              : "Có lỗi xảy ra khi gửi hồ sơ. Vui lòng thử lại sau ít phút.";
          showFormError(friendlyMsg);
          if (recaptchaWidgetId !== null && window.grecaptcha) grecaptcha.reset(recaptchaWidgetId);
        }
      } finally {
        submitBtn.innerHTML = submitBtnOriginalHTML;
        submitBtn.disabled = false;
      }
    });
  }

  init();
});

async function init() {
  allJobs = await fetchJobs();
  job = allJobs.find((item) => {
    if (item.status !== "active") return false;
    if (jobSlug) return item.slug === jobSlug;
    return item.id === jobId;
  }) || null;

  const loading = document.getElementById("detailLoading");
  const notFound = document.getElementById("detailNotFound");
  const card = document.getElementById("detailCard");
  loading.hidden = true;

  if (!job) {
    notFound.hidden = false;
    document.title = "ADC Careers | Không tìm thấy vị trí";
    document.getElementById("pageTitle").textContent = "ADC Careers | Không tìm thấy vị trí";
    return;
  }

  document.title = `ADC Careers | ${job.title}`;
  card.style.setProperty("--detail-color", job.color || "#2196F3");
  card.innerHTML = job.displayMode === "poster" && job.hasPoster
    ? buildPosterDetailCard(job)
    : buildDetailCard(job);
  card.hidden = false;

  updateSeo();
}

function buildPosterDetailCard(job) {
  return `
<div style="width: 100%; max-width: 800px; margin: 0 auto; text-align: left;">
  <a href="index.html#co-hoi" class="back-to-jobs">← QUAY LẠI DANH SÁCH VỊ TRÍ</a>
  <div class="detail-poster-wrap" style="--detail-color: ${escapeAttribute(job.color || '#2196F3')}">
    <img class="detail-poster" loading="lazy" src="${API_BASE}/api/jobs/${job.id}/poster?v=${job.poster_size || 0}" alt="${escapeHtml(job.vn || job.title)}" />
  </div>
  <div class="detail-actions detail-poster-actions" style="margin-top: 24px;">
    <button class="detail-primary" type="button" data-open-apply data-apply-job="${escapeAttribute(job.vn || job.title)}" data-job-id="${job.id}">ỨNG TUYỂN NGAY</button>
    <a class="detail-secondary" href="index.html#co-hoi" style="background: rgba(255,255,255,0.1); color: #fff;">XEM VỊ TRÍ KHÁC</a>
  </div>
</div>
`;
}

function buildDetailCard(job) {
  const related = allJobs
    .filter(item => item.status === "active")
    .filter(item => item.id !== job.id)
    .filter(item => item.dept === job.dept || (job.industry && item.industry === job.industry))
    .slice(0, 3);

  const fallbackColor = "#2196F3";

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
<a class="detail-related-card" href="${jobUrl(item)}" style="--related-color:${escapeAttribute(item.color || fallbackColor)}">
<span>ADC · ${escapeHtml(item.dept)}</span>
<strong>${escapeHtml(item.title)}</strong>
<small>${escapeHtml(item.vn)}</small>
</a>
`).join("")}
</div>
</div>` : ""}

<div class="detail-actions">
<button class="detail-primary" type="button" data-open-apply data-apply-job="${escapeAttribute(job.vn || job.title)}" data-job-id="${job.id}">Ứng tuyển ngay</button>
<a class="detail-secondary" href="index.html#co-hoi">Xem vị trí khác</a>
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
    return job.reqs.find(item => /\d|năm|year/i.test(item)) || "Theo mô tả công việc";
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

function updateSeo() {
  const title = `ADC Careers | ${job.vn || job.title}`;
  const description = job.summary || `Ứng tuyển vị trí ${job.vn || job.title} tại ADC. Địa điểm ${job.workLocation}, hình thức ${job.employmentType}.`;
  const canonicalUrl = new URL(jobUrl(job), window.location.origin).href;

  document.title = title;
  document.getElementById("pageTitle").textContent = title;
  document.getElementById("metaDescription").setAttribute("content", description);
  document.getElementById("ogTitle").setAttribute("content", title);
  document.getElementById("ogDescription").setAttribute("content", description);
  document.getElementById("canonicalLink").setAttribute("href", canonicalUrl);

  const jsonLdEl = document.getElementById("jobPostingJsonLd");
  if (jsonLdEl) {
    jsonLdEl.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: job.vn || job.title,
      description,
      datePosted: toIsoDate(job.publishedAt || job.created_at),
      validThrough: toIsoDate(job.deadline),
      employmentType: job.employmentType || "FULL_TIME",
      ...(job.displayMode === "poster" && job.hasPoster
        ? { image: new URL(`${API_BASE}/api/jobs/${job.id}/poster?v=${job.poster_size || 0}`, window.location.origin).href }
        : {}),
      hiringOrganization: {
        "@type": "Organization",
        name: "Asia Dragon Capital (ADC)",
        sameAs: window.location.origin
      },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: job.locationShort || "TP.HCM",
          addressCountry: "VN",
          streetAddress: job.workLocation || "KCN Tân Tạo, Bình Tân, TP.HCM"
        }
      }
    });
  }
}

function toIsoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}
