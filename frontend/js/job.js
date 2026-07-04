
    const jobId = Number(new URLSearchParams(window.location.search).get("id"));
    let job = null;

    const loadingState = document.getElementById("jobDetailLoading");
    const notFoundState = document.getElementById("jobDetailNotFound");
    const detailCard = document.getElementById("jobDetail");
    const modal = document.getElementById("applyModal");
    const applyForm = document.getElementById("applyForm");
    const formMessage = document.getElementById("formMessage");
    const modalJobName = document.getElementById("modalJobName");

    async function init() {
      const jobs = await fetchJobs();
      job = jobs.find((item) => item.id === jobId && item.status === "active") || null;

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

      document.getElementById("jdTitle").textContent = job.title;
      document.getElementById("jdVn").textContent = job.vn;
      document.getElementById("jdDept").textContent = job.dept;
      document.getElementById("jdLevel").textContent = job.level;
      document.getElementById("jdReport").textContent = job.report;
      document.getElementById("jdUrgent").hidden = !job.urgent;

      document.getElementById("jdReqs").innerHTML = job.reqs
        .map((req) => `<div class="req-item">${escapeHtml(req)}</div>`)
        .join("");

      document.getElementById("jdApplyBtn").addEventListener("click", openApplyModal);
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
