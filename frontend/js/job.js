
    const params = new URLSearchParams(window.location.search);
    const jobId = Number(params.get("id"));
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const jobSlug = params.get("slug") || (pathParts[0] === "jobs" ? decodeURIComponent(pathParts[1] || "") : "");
    let job = null;

    const loadingState = document.getElementById("jobDetailLoading");
    const notFoundState = document.getElementById("jobDetailNotFound");
    const detailCard = document.getElementById("jobDetail");
    const modal = document.getElementById("applyModal");
    const applyForm = document.getElementById("applyForm");
    const formMessage = document.getElementById("formMessage");
    const modalJobName = document.getElementById("modalJobName");
    const policyModal = document.getElementById("policyModal");
    const policyModalBody = document.getElementById("policyModalBody");
    const policyHint = document.getElementById("policyHint");
    const consentCheckbox = document.getElementById("consentPolicy");
    let allJobs = [];
    let recaptchaWidgetId = null;
    let policyRead = false;

    function openPolicyModal() {
      policyModal.classList.add("open");
      policyModal.setAttribute("aria-hidden", "false");
      checkPolicyScroll();
    }

    function closePolicyModal() {
      policyModal.classList.remove("open");
      policyModal.setAttribute("aria-hidden", "true");
    }

    function checkPolicyScroll() {
      if (policyRead) return;
      const el = policyModalBody;
      const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
      if (reachedBottom) {
        policyRead = true;
        policyHint.textContent = "Bạn đã đọc hết nội dung. Vui lòng đóng cửa sổ này và tick đồng ý.";
        policyHint.classList.add("done");
      }
    }

    policyModalBody.addEventListener("scroll", checkPolicyScroll);

    consentCheckbox.addEventListener("click", (event) => {
      if (!policyRead) {
        event.preventDefault();
        openPolicyModal();
      }
    });

    async function init() {
      allJobs = await fetchJobs();
      job = allJobs.find((item) => {
        if (item.status !== "active") return false;
        if (jobSlug) return item.slug === jobSlug;
        return item.id === jobId;
      }) || null;

      loadingState.hidden = true;

      if (!job) {
        notFoundState.hidden = false;
        return;
      }

      renderJob();
      updateSeo();
      detailCard.hidden = false;
    }

    function renderJob() {
      document.title = `ADC Careers | ${job.title}`;
      document.getElementById("pageTitle").textContent = `ADC Careers | ${job.title}`;

      detailCard.innerHTML = `
        <a class="back-link back-link-inline" href="index.html#co-hoi">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>
          Quay lại danh sách vị trí
        </a>

        <div class="job-detail-hero">
          <div class="job-detail-hero-copy">
            <div class="eyebrow">Chi tiết vị trí</div>
            <h1>${escapeHtml(job.vn || job.title)}</h1>
            <p class="job-detail-sub">${escapeHtml(job.title)} · ${escapeHtml(job.dept)}</p>
            <p class="job-detail-summary">${escapeHtml(job.summary || defaultSummary())}</p>
            <div class="job-detail-actions">
              <button class="btn apply-btn" type="button" data-apply-trigger>Ứng tuyển ngay</button>
              <a class="btn btn-outline detail-mail-btn" href="${mailToHref()}">Gửi email CV</a>
            </div>
          </div>
          <div class="job-detail-hero-card">
            <span class="hero-card-label">ADC Careers</span>
            <strong>${escapeHtml(job.locationShort || "TP.HCM")}</strong>
            <span>${escapeHtml(job.employmentType || "Full-time")}</span>
            <small>${escapeHtml(formatDate(job.deadline) ? `Hạn nộp: ${formatDate(job.deadline)}` : "Hạn nộp: Đang cập nhật")}</small>
          </div>
        </div>

        <div class="job-detail-badges">
          ${job.urgent ? '<span class="urgent-badge">Urgent</span>' : ""}
          <span class="job-pill">${escapeHtml(job.locationShort || job.workLocation || "TP.HCM")}</span>
          <span class="job-pill">${escapeHtml(job.employmentType || "Full-time")}</span>
          <span class="job-pill">${escapeHtml(job.level)}</span>
          <span class="job-pill">Báo cáo: ${escapeHtml(job.report)}</span>
        </div>

        <div class="job-detail-layout">
          <div class="job-detail-main">
            <section class="detail-panel">
              <div class="detail-label">Tổng quan</div>
              <h2>Thông tin tổng quan</h2>
              <div class="overview-grid">
                ${renderOverviewItem("Địa điểm", job.workLocation || "KCN Tân Tạo, Bình Tân, TP.HCM", "pin")}
                ${renderOverviewItem("Kinh nghiệm", job.experienceText || experienceFallback(), "briefcase")}
                ${renderOverviewItem("Bộ phận", job.dept, "team")}
                ${renderOverviewItem("Đãi ngộ", job.salaryText || "Thỏa thuận theo năng lực", "salary")}
                ${renderOverviewItem("Hạn nộp", formatDate(job.deadline) || "Đang cập nhật", "calendar")}
                ${renderOverviewItem("Số lượng", `${Number(job.quantity || 1)} vị trí`, "users")}
              </div>
            </section>

            ${renderListPanel("Nhiệm vụ của vị trí", "Nhiệm vụ chính", job.responsibilities)}
            ${renderListPanel("Tiêu chí tuyển dụng", "Tiêu chuẩn ứng viên", job.requirementsDetail)}
            ${renderBenefits()}
            ${renderEnvironmentSections()}
            ${renderRelatedJobs()}
          </div>

          <aside class="detail-sidebar">
            <section class="detail-panel apply-panel">
              <h2>Ứng tuyển vị trí này</h2>
              <p>Gửi CV kèm mức lương kỳ vọng. Đội ngũ P&O sẽ liên hệ sau khi sàng lọc hồ sơ phù hợp.</p>
              <div class="deadline-box">
                <span>Hạn nhận hồ sơ</span>
                <strong>${escapeHtml(formatDate(job.deadline) || "Đang cập nhật")}</strong>
              </div>
              <button class="btn apply-btn" type="button" data-apply-trigger>Ứng tuyển ngay</button>
              <a class="btn btn-outline detail-mail-btn" href="${mailToHref()}">Gửi email CV</a>
              <div class="apply-note">Không mất quá 2 phút để gửi hồ sơ trực tuyến.</div>
            </section>

            <section class="detail-panel contact-panel">
              <div class="detail-label">Contact</div>
              <h2>Liên hệ tuyển dụng</h2>
              <div class="info-list">
                <div><strong>Email:</strong> <a href="mailto:hr@asiadragoncordage.com">hr@asiadragoncordage.com</a></div>
                <div><strong>Hotline:</strong> <a href="tel:0908022098">0908 022 098</a></div>
                <div><strong>Địa chỉ:</strong> KCN Tân Tạo, Bình Tân, TP.HCM</div>
              </div>
            </section>
          </aside>
        </div>
      `;

      detailCard.querySelectorAll("[data-apply-trigger]").forEach((button) => {
        button.addEventListener("click", openApplyModal);
      });
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
      document.getElementById("jobPostingJsonLd").textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: job.vn || job.title,
        description,
        datePosted: toIsoDate(job.publishedAt || job.created_at),
        validThrough: toIsoDate(job.deadline),
        employmentType: job.employmentType || "FULL_TIME",
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

    function mailToHref() {
      return `mailto:hr@asiadragoncordage.com?subject=${encodeURIComponent(`Ứng tuyển - ${job.title}`)}`;
    }

    function renderOverviewItem(label, value, iconName) {
      return `
        <div class="overview-item">
          <span class="overview-icon" aria-hidden="true">${overviewIcon(iconName)}</span>
          <span class="overview-label">${escapeHtml(label)}</span>
          <strong>${escapeHtml(value || "Đang cập nhật")}</strong>
        </div>
      `;
    }

    function overviewIcon(name) {
      const icons = {
        pin: '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
        briefcase: '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path></svg>',
        team: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        salary: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"></rect><circle cx="12" cy="12" r="3"></circle><path d="M6 12h.01M18 12h.01"></path></svg>',
        calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg>',
        users: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path></svg>'
      };
      return icons[name] || icons.briefcase;
    }

    function renderListPanel(kicker, title, items) {
      const list = Array.isArray(items) && items.length > 0 ? items : job.reqs;
      return `
        <section class="detail-panel">
          <div class="detail-label">${escapeHtml(kicker)}</div>
          <h2>${escapeHtml(title)}</h2>
          <div class="req-list">
            ${list.map((item) => `<div class="req-item"><span aria-hidden="true"></span><p>${escapeHtml(item)}</p></div>`).join("")}
          </div>
        </section>
      `;
    }

    function renderBenefits() {
      const benefits = job.benefits.length > 0 ? job.benefits : defaultBenefits();
      return `
        <section class="detail-panel">
          <div class="detail-label">Benefits</div>
          <h2>Quyền lợi</h2>
          <div class="benefit-grid">
            ${benefits.map((benefit) => `
              <div class="benefit-item">
                <span>${escapeHtml(benefit.icon || "*")}</span>
                <p>${escapeHtml(benefit.text)}</p>
              </div>
            `).join("")}
          </div>
        </section>
      `;
    }

    function renderEnvironmentSections() {
      const sections = job.environmentSections.length > 0 ? job.environmentSections : defaultEnvironmentSections();
      return `
        <section class="detail-panel">
          <div class="detail-label">Môi trường ADC</div>
          <h2>Môi trường làm việc tại ADC</h2>
          <div class="environment-list">
            ${sections.map((section) => `
              <details>
                <summary>${escapeHtml(section.title)}</summary>
                <p>${escapeHtml(section.content)}</p>
              </details>
            `).join("")}
          </div>
        </section>
      `;
    }

    function renderRelatedJobs() {
      const related = allJobs
        .filter((item) => item.id !== job.id && item.status === "active")
        .filter((item) => item.dept === job.dept || (job.industry && item.industry === job.industry))
        .slice(0, 3);

      if (related.length === 0) return "";

      return `
        <section class="detail-panel">
          <div class="detail-label">Open positions</div>
          <h2>Vị trí tương tự</h2>
          <div class="related-grid">
            ${related.map((item) => `
              <a class="related-card" href="${jobUrl(item)}" style="--job-color:${escapeAttribute(item.color)}">
                <span>ADC · ${escapeHtml(item.dept)}</span>
                <strong>${escapeHtml(item.title)}</strong>
                <small>${escapeHtml(item.vn)}</small>
                <em>${escapeHtml(item.locationShort || "TP.HCM")}</em>
              </a>
            `).join("")}
          </div>
        </section>
      `;
    }

    function defaultSummary() {
      return `Cơ hội đồng hành cùng ADC trong vai trò ${job.vn || job.title}, tập trung vào kết quả, năng lực chuyên môn và tinh thần cải tiến liên tục.`;
    }

    function experienceFallback() {
      return job.reqs.find((item) => /\d|năm|year/i.test(item)) || "Theo mô tả công việc";
    }

    function defaultBenefits() {
      return [
        { icon: "+", text: "Đào tạo và phát triển chuyên môn" },
        { icon: "$", text: "Lương cạnh tranh theo năng lực" },
        { icon: "✓", text: "Bảo hiểm và phúc lợi theo quy định" },
        { icon: "A", text: "Môi trường sản xuất hiện đại" },
        { icon: "↗", text: "Cơ hội tham gia các dự án cải tiến" },
        { icon: "P", text: "Đồng hành cùng đội ngũ quản lý giàu kinh nghiệm" }
      ];
    }

    function defaultEnvironmentSections() {
      return [
        {
          title: "Nhà máy hiện đại",
          content: "ADC vận hành hệ thống nhà máy tại KCN Tân Tạo với máy móc công nghệ từ nhiều quốc gia."
        },
        {
          title: "Chuyển đổi số mạnh mẽ",
          content: "Môi trường ứng dụng SAP HANA, Salesforce CRM, Office 365, Power BI và Automation."
        },
        {
          title: "Văn hóa cải tiến",
          content: "ADC khuyến khích sự chủ động, tinh thần học hỏi và năng lực tạo giá trị bền vững."
        }
      ];
    }

    function formatDate(value) {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(date);
    }

    function toIsoDate(value) {
      if (!value) return undefined;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return undefined;
      return date.toISOString().slice(0, 10);
    }

    async function openApplyModal() {
      clearFormState();
      applyForm.reset();

      policyRead = false;
      consentCheckbox.checked = false;
      policyHint.textContent = "Vui lòng cuộn xuống hết nội dung để có thể tick đồng ý.";
      policyHint.classList.remove("done");

      if (recaptchaWidgetId === null && window.grecaptcha) {
        try {
          const res = await fetch(`${API_BASE}/api/config/public`);
          const config = await res.json();
          if (config.recaptchaSiteKey) {
            recaptchaWidgetId = grecaptcha.render("recaptchaContainer", {
              sitekey: config.recaptchaSiteKey
            });
          }
        } catch (e) {
          console.error("Failed to load captcha config", e);
        }
      } else if (recaptchaWidgetId !== null && window.grecaptcha) {
        grecaptcha.reset(recaptchaWidgetId);
      }

      modalJobName.textContent = `${job.title} · ${job.vn}`;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      document.getElementById("fullName").focus();
    }

    function closeApplyModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    }

    function validateApplication() {
      clearFormState();

      const fullName = document.getElementById("fullName").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const cvFile = document.getElementById("cvFile").files[0];

      let valid = true;

      if (!fullName) {
        setFieldError("fullName", "Vui lòng nhập họ và tên.");
        valid = false;
      }

      if (!email) {
        setFieldError("email", "Vui lòng nhập email.");
        valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError("email", "Email chưa đúng định dạng.");
        valid = false;
      }

      if (!phone) {
        setFieldError("phone", "Vui lòng nhập số điện thoại.");
        valid = false;
      } else if (!/^[0-9+\-\s().]{8,18}$/.test(phone)) {
        setFieldError("phone", "Số điện thoại chưa hợp lệ.");
        valid = false;
      }

      if (!cvFile) {
        setFieldError("cvFile", "Vui lòng đính kèm CV.");
        valid = false;
      } else {
        const allowedExtensions = [".pdf", ".doc", ".docx"];
        const lowerName = cvFile.name.toLowerCase();
        const hasValidExtension = allowedExtensions.some((extension) => lowerName.endsWith(extension));
        const isValidSize = cvFile.size <= 5 * 1024 * 1024;

        if (!hasValidExtension) {
          setFieldError("cvFile", "CV chỉ chấp nhận PDF, DOC hoặc DOCX.");
          valid = false;
        } else if (!isValidSize) {
          setFieldError("cvFile", "CV cần nhỏ hơn hoặc bằng 5MB.");
          valid = false;
        }
      }

      if (!consentCheckbox.checked) {
        setFieldError(
          "consent",
          !policyRead
            ? "Vui lòng mở và đọc hết Tuyên Bố Bảo Mật trước khi đồng ý."
            : "Vui lòng đồng ý với Tuyên Bố Bảo Mật trước khi gửi hồ sơ."
        );
        valid = false;
      }

      if (recaptchaWidgetId !== null && window.grecaptcha) {
        const captchaResponse = grecaptcha.getResponse(recaptchaWidgetId);
        if (!captchaResponse) {
          setFieldError("captcha", "Vui lòng xác thực bạn không phải là người máy.");
          valid = false;
        }
      }

      return valid;
    }

    function setFieldError(fieldName, message) {
      const field = document.querySelector(`[data-field="${fieldName}"]`);
      field.classList.add("invalid");
      field.querySelector(".error-text").textContent = message;
    }

    function clearFormState() {
      document.querySelectorAll(".field").forEach((field) => {
        field.classList.remove("invalid");
        const error = field.querySelector(".error-text");
        if (error) error.textContent = "";
      });
      formMessage.className = "form-message";
      formMessage.textContent = "";
    }

    function buildApplicationPayload() {
      const cvFile = document.getElementById("cvFile").files[0];
      return {
        jobId: job.id,
        fullName: document.getElementById("fullName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        expectedSalary: document.getElementById("expectedSalary").value.trim(),
        cvFile,
        note: document.getElementById("note").value.trim()
      };
    }

    function buildApplicationFormData(payload) {
      const formData = new FormData();
      formData.append("jobId", payload.jobId);
      formData.append("fullName", payload.fullName);
      formData.append("email", payload.email);
      formData.append("phone", payload.phone);
      formData.append("expectedSalary", payload.expectedSalary);
      formData.append("note", payload.note);
      formData.append("cvFile", payload.cvFile);
      const consentTalentPool = document.getElementById("consentTalentPool");

      formData.append("purposeCore", document.getElementById("consentPolicy").checked ? "true" : "false");
      formData.append("purposeTalentPool", consentTalentPool && consentTalentPool.checked ? "true" : "false");
      formData.append("consent", document.getElementById("consentPolicy").checked ? "true" : "false");

      if (recaptchaWidgetId !== null && window.grecaptcha) {
        formData.append("captchaToken", grecaptcha.getResponse(recaptchaWidgetId));
      }

      return formData;
    }


    function showFormMessage(type, message) {
      formMessage.className = `form-message visible ${type}`;
      formMessage.textContent = message;
    }

    applyForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!job) {
        showFormMessage("error", "Chưa chọn vị trí ứng tuyển.");
        return;
      }

      if (!validateApplication()) {
        showFormMessage("error", "Vui lòng kiểm tra lại thông tin trước khi gửi.");
        return;
      }

      const payload = buildApplicationPayload();
      const submitButton = applyForm.querySelector('button[type="submit"]');

      try {
        submitButton.disabled = true;
        submitButton.textContent = "Đang gửi...";
        showFormMessage("success", "Đang gửi hồ sơ đến hệ thống ADC Careers...");

        const response = await fetch(`${API_BASE}/api/apply`, {
          method: "POST",
          body: buildApplicationFormData(payload)
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Không thể gửi hồ sơ lúc này.");
        }

        showFormMessage("success", "Hồ sơ đã được ghi nhận. Đội ngũ P&O sẽ liên hệ khi có cập nhật phù hợp.");
        applyForm.reset();
        const thankYouUrl = new URL("/thank-you.html", window.location.origin);
        thankYouUrl.searchParams.set("job", job.vn || job.title);
        thankYouUrl.searchParams.set("slug", job.slug || "");
        window.location.href = thankYouUrl.href;
      } catch (error) {
        const message = error instanceof TypeError
          ? "Không kết nối được server. Vui lòng kiểm tra backend đang chạy ở http://localhost:5000."
          : error.message || "Không thể gửi hồ sơ lúc này. Vui lòng thử lại sau.";
        showFormMessage("error", message);
        
        if (recaptchaWidgetId !== null && window.grecaptcha) {
          grecaptcha.reset(recaptchaWidgetId);
        }
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Gửi hồ sơ";
      }
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeApplyModal();
    });

    policyModal.addEventListener("click", (event) => {
      if (event.target === policyModal) closePolicyModal();
    });

    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-open-policy]")) {
        openPolicyModal();
        return;
      }
      if (event.target.closest("[data-close-policy]")) {
        closePolicyModal();
        return;
      }
      if (event.target.closest("[data-close-apply]")) {
        closeApplyModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (policyModal.classList.contains("open")) {
        closePolicyModal();
        return;
      }
      if (modal.classList.contains("open")) {
        closeApplyModal();
      }
    });

    loadOptionalBackgrounds();
    init();
