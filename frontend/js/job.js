
    const jobId = Number(new URLSearchParams(window.location.search).get("id"));
    let job = null;

    const loadingState = document.getElementById("jobDetailLoading");
    const notFoundState = document.getElementById("jobDetailNotFound");
    const detailCard = document.getElementById("jobDetail");
    const modal = document.getElementById("applyModal");
    const applyForm = document.getElementById("applyForm");
    const formMessage = document.getElementById("formMessage");
    const modalJobName = document.getElementById("modalJobName");
    let allJobs = [];

    async function init() {
      allJobs = await fetchJobs();
      job = allJobs.find((item) => item.id === jobId && item.status === "active") || null;

      loadingState.hidden = true;

      if (!job) {
        notFoundState.hidden = false;
        return;
      }

      renderJob();
      detailCard.hidden = false;
    }

    function renderJob() {
      document.title = `ADC Careers | ${job.title}`;
      document.getElementById("pageTitle").textContent = `ADC Careers | ${job.title}`;

      detailCard.innerHTML = `
        <div class="job-detail-hero">
          <div>
            <div class="eyebrow">Chi tiết vị trí</div>
            <h1>${escapeHtml(job.vn || job.title)}</h1>
            <p class="job-detail-sub">${escapeHtml(job.title)} · ${escapeHtml(job.dept)}</p>
            <p class="job-detail-summary">${escapeHtml(job.summary || defaultSummary())}</p>
          </div>
          <div class="job-detail-company">
            <strong>ADC</strong>
            <span>ASIA DRAGON CAPITAL</span>
            <small>Leading Manufacturer Since 2006</small>
          </div>
        </div>

        <div class="job-detail-badges">
          ${job.urgent ? '<span class="urgent-badge">Urgent</span>' : ""}
          <span class="job-pill">${escapeHtml(job.locationShort)}</span>
          <span class="job-pill">${escapeHtml(job.employmentType)}</span>
          <span class="job-pill">${escapeHtml(job.level)}</span>
          <span class="job-pill">Báo cáo: ${escapeHtml(job.report)}</span>
        </div>

        <div class="job-detail-layout">
          <div class="job-detail-main">
            <section class="detail-panel">
              <div class="detail-label">Tổng quan</div>
              <h2>Thông tin tổng quan</h2>
              <div class="overview-grid">
                ${renderOverviewItem("Độ tuổi", job.ageRange || "Không yêu cầu")}
                ${renderOverviewItem("Kinh nghiệm", job.experienceText || experienceFallback())}
                ${renderOverviewItem("Ngành nghề", job.industry || job.dept)}
                ${renderOverviewItem("Ngày đăng", formatDate(job.publishedAt || job.created_at))}
                ${renderOverviewItem("Chức vụ", job.level)}
                ${renderOverviewItem("Bộ phận", job.dept)}
                ${renderOverviewItem("Đãi ngộ", job.salaryText)}
                ${renderOverviewItem("Địa điểm", job.workLocation)}
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
              <p>Gửi CV kèm mức lương kỳ vọng. Đội ngũ P&O sẽ phản hồi sau khi sàng lọc hồ sơ.</p>
              <div class="deadline-box">
                <span>Hạn nhận hồ sơ</span>
                <strong>${escapeHtml(formatDate(job.deadline) || "Đang cập nhật")}</strong>
              </div>
              <button class="btn apply-btn" type="button" id="jdApplyBtn">Ứng tuyển ngay</button>
              <a class="btn btn-outline detail-mail-btn" href="mailto:hr@asiadragoncordage.com?subject=${encodeURIComponent(`Ứng tuyển - ${job.title}`)}">Gửi email CV</a>
            </section>

            <section class="detail-panel">
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

      document.getElementById("jdApplyBtn").addEventListener("click", openApplyModal);
    }

    function renderOverviewItem(label, value) {
      return `
        <div class="overview-item">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value || "Đang cập nhật")}</strong>
        </div>
      `;
    }

    function renderListPanel(kicker, title, items) {
      const list = Array.isArray(items) && items.length > 0 ? items : job.reqs;
      return `
        <section class="detail-panel">
          <div class="detail-label">${escapeHtml(kicker)}</div>
          <h2>${escapeHtml(title)}</h2>
          <div class="req-list">
            ${list.map((item) => `<div class="req-item">${escapeHtml(item)}</div>`).join("")}
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
                ${escapeHtml(benefit.text)}
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
              <a class="related-card" href="job.html?id=${item.id}" style="--job-color:${escapeAttribute(item.color)}">
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

    function openApplyModal() {
      clearFormState();
      applyForm.reset();
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
      } catch (error) {
        const message = error instanceof TypeError
          ? "Không kết nối được server. Vui lòng kiểm tra backend đang chạy ở http://localhost:5000."
          : error.message || "Không thể gửi hồ sơ lúc này. Vui lòng thử lại sau.";
        showFormMessage("error", message);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Gửi hồ sơ";
      }
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeApplyModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("open")) {
        closeApplyModal();
      }
    });

    loadOptionalBackgrounds();
    init();
