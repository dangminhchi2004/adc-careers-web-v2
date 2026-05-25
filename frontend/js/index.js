
    const COLORS = {
      red: "#E8363A",
      orange: "#F57C22",
      yellow: "#FFB900",
      green: "#4CAF50",
      blue: "#2196F3",
      indigo: "#5C6BC0",
      purple: "#9C27B0"
    };

    const rainbow = [COLORS.red, COLORS.orange, COLORS.yellow, COLORS.green, COLORS.blue, COLORS.indigo, COLORS.purple];

    const API_BASE = window.location.protocol === "file:" ? "http://localhost:5000" : "";

    let positions = [
      {
        id: 1,
        title: "Head of Production",
        vn: "Giám đốc Sản xuất",
        dept: "Khối Vận hành",
        level: "Senior Leadership",
        report: "P.TGĐ Vận hành",
        urgent: true,
        color: COLORS.red,
        status: "active",
        reqs: [
          "10+ năm quản lý sản xuất quy mô lớn, ưu tiên môi trường trên 300 công nhân.",
          "Kinh nghiệm quản lý đa nhà máy, thiết lập KPI và cải tiến năng suất.",
          "Ngành nhựa, polymer hoặc extrusion là lợi thế lớn.",
          "Thành thạo SAP, Lean, 5S, Kaizen và tiếng Anh giao tiếp tốt."
        ]
      },
      {
        id: 2,
        title: "Head of P&O",
        vn: "Giám đốc Nhân sự & Tổ chức",
        dept: "People & Organization",
        level: "Senior Leadership",
        report: "CEO",
        urgent: true,
        color: COLORS.orange,
        status: "active",
        reqs: [
          "7+ năm kinh nghiệm HR management, ưu tiên ngành sản xuất.",
          "Có kinh nghiệm xây dựng hệ thống HR từ nền tảng đến vận hành.",
          "Hiểu Employer Branding, Organization Development, C&B và L&D.",
          "Tiếng Anh tốt, tư duy hệ thống và khả năng đồng hành với business."
        ]
      },
      {
        id: 3,
        title: "International Sales Manager",
        vn: "Trưởng phòng Kinh doanh Quốc tế",
        dept: "Kinh doanh",
        level: "Management",
        report: "CEO",
        urgent: true,
        color: COLORS.yellow,
        status: "active",
        reqs: [
          "7+ năm B2B sales trong sản xuất hoặc xuất khẩu.",
          "Có network khách hàng tại Mỹ, Úc hoặc EU là lợi thế.",
          "Tiếng Anh thành thạo, đàm phán tốt và quen làm việc theo mục tiêu doanh số.",
          "Kinh nghiệm Salesforce CRM hoặc quy trình sales pipeline chuyên nghiệp."
        ]
      },
      {
        id: 4,
        title: "Head of Production Planning",
        vn: "Trưởng phòng Kế hoạch Sản xuất",
        dept: "Khối Vận hành",
        level: "Management",
        report: "P.TGĐ Vận hành",
        urgent: false,
        color: COLORS.green,
        status: "active",
        reqs: [
          "7+ năm kinh nghiệm planning trong môi trường sản xuất.",
          "Thành thạo SAP PP/MM, MRP, S&OP và phối hợp liên phòng ban.",
          "Có tư duy dữ liệu, Power BI là lợi thế.",
          "Khả năng cân bằng năng lực sản xuất, tồn kho và cam kết giao hàng."
        ]
      },
      {
        id: 5,
        title: "Automation Engineer",
        vn: "Kỹ sư Tự động hóa",
        dept: "Kỹ thuật",
        level: "Specialist",
        report: "Head of Production",
        urgent: false,
        color: COLORS.blue,
        status: "active",
        reqs: [
          "3+ năm kinh nghiệm PLC, SCADA, HMI hoặc hệ thống điều khiển công nghiệp.",
          "Từng làm việc với máy móc châu Âu là lợi thế.",
          "Có khả năng phân tích lỗi, cải tiến thiết bị và phối hợp với sản xuất.",
          "Sẵn sàng học hỏi từ nhà cung cấp máy móc quốc tế."
        ]
      },
      {
        id: 6,
        title: "Senior Sales Executive",
        vn: "Chuyên viên Kinh doanh Cấp cao",
        dept: "Kinh doanh",
        level: "Senior",
        report: "Sales Manager",
        urgent: false,
        color: COLORS.purple,
        status: "active",
        reqs: [
          "3-5 năm sales B2B, ưu tiên export hoặc manufacturing.",
          "Tiếng Anh tốt, có khả năng chăm sóc khách hàng quốc tế.",
          "Theo sát pipeline, báo cáo rõ ràng và chủ động mở rộng cơ hội.",
          "Tinh thần bền bỉ, chịu trách nhiệm với mục tiêu doanh số."
        ]
      }
    ];

    let selectedDept = "all";
    let expandedJob = null;
    let selectedJob = null;

    const filterBar = document.getElementById("filterBar");
    const jobList = document.getElementById("jobList");
    const jobCount = document.getElementById("jobCount");
    const emptyState = document.getElementById("emptyState");
    const modal = document.getElementById("applyModal");
    const applyForm = document.getElementById("applyForm");
    const formMessage = document.getElementById("formMessage");
    const modalJobName = document.getElementById("modalJobName");

    function loadOptionalBackgrounds() {
      document.querySelectorAll("[data-bg-image]").forEach((element) => {
        const imagePath = element.getAttribute("data-bg-image");
        if (!imagePath) return;

        const imageUrl = new URL(imagePath, document.baseURI).href;
        const image = new Image();
        image.onload = () => {
          element.style.backgroundImage = `url("${imageUrl}")`;
          element.classList.add("custom-bg-loaded");
        };
        image.onerror = () => {
          element.classList.remove("custom-bg-loaded");
          element.style.removeProperty("background-image");
        };
        image.src = imageUrl;
      });
    }

    async function fetchPositions() {
      try {
        const response = await fetch(`${API_BASE}/api/jobs`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        const apiJobs = Array.isArray(result) ? result : result.data;

        if (Array.isArray(apiJobs) && apiJobs.length > 0) {
          positions = apiJobs.map(normalizeJob);
          selectedDept = "all";
          expandedJob = null;
        }
      } catch (error) {
        console.warn("Using mock jobs because /api/jobs is unavailable:", error);
      } finally {
        renderFilters();
        renderJobs();
      }
    }

    function normalizeJob(job) {
      return {
        ...job,
        id: Number(job.id),
        urgent: Boolean(job.urgent),
        color: job.color || COLORS.blue,
        status: job.status || "active",
        reqs: normalizeRequirements(job.reqs)
      };
    }

    function normalizeRequirements(reqs) {
      if (Array.isArray(reqs)) return reqs;
      if (!reqs) return [];

      try {
        const parsed = JSON.parse(reqs);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return String(reqs)
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    function activePositions() {
      return positions.filter((job) => job.status === "active");
    }

    function departments() {
      return ["all", ...new Set(activePositions().map((job) => job.dept))];
    }

    function renderFilters() {
      filterBar.innerHTML = departments().map((dept, index) => {
        const label = dept === "all" ? "Tất cả" : dept;
        const color = rainbow[index % rainbow.length];
        const isActive = selectedDept === dept;
        return `
          <button
            class="filter-btn${isActive ? " active" : ""}"
            type="button"
            style="--active-color:${color}"
            onclick="setDept('${escapeAttribute(dept)}')"
          >${escapeHtml(label)}</button>
        `;
      }).join("");
    }

    function renderJobs() {
      const filtered = selectedDept === "all"
        ? activePositions()
        : activePositions().filter((job) => job.dept === selectedDept);

      jobCount.textContent = `${filtered.length} vị trí`;
      emptyState.classList.toggle("visible", filtered.length === 0);

      jobList.innerHTML = filtered.map((job) => {
        const isOpen = expandedJob === job.id;
        return `
          <article class="job-card${isOpen ? " open" : ""}" style="--job-color:${job.color}">
            <button class="job-header" type="button" aria-expanded="${isOpen}" onclick="toggleJob(${job.id})">
              <span class="job-main">
                ${job.urgent ? '<span class="urgent-badge">Urgent</span>' : ""}
                <span>
                  <span class="job-title">${escapeHtml(job.title)}</span>
                  <span class="job-vn">${escapeHtml(job.vn)}</span>
                </span>
              </span>
              <span class="job-side">
                <span class="job-pill">${escapeHtml(job.dept)}</span>
                <span class="job-pill">${escapeHtml(job.level)}</span>
                <span class="job-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </span>
              </span>
            </button>
            <div class="job-body">
              <div class="job-body-inner">
                <div>
                  <div class="detail-label">Yêu cầu chính</div>
                  <div class="req-list">
                    ${job.reqs.map((req) => `<div class="req-item">${escapeHtml(req)}</div>`).join("")}
                  </div>
                </div>
                <div>
                  <div class="detail-label">Thông tin</div>
                  <div class="info-list">
                    <div><strong>Địa điểm:</strong> KCN Tân Tạo, Bình Tân, TP.HCM</div>
                    <div><strong>Báo cáo:</strong> ${escapeHtml(job.report)}</div>
                    <div><strong>Hình thức:</strong> Full-time</div>
                    <div><strong>Đãi ngộ:</strong> Cạnh tranh, thỏa thuận theo năng lực</div>
                  </div>
                </div>
              </div>
              <button class="btn apply-btn" type="button" onclick="openApplyModal(${job.id})">Ứng tuyển ngay</button>
            </div>
          </article>
        `;
      }).join("");
    }

    function setDept(dept) {
      selectedDept = dept;
      expandedJob = null;
      renderFilters();
      renderJobs();
    }

    function toggleJob(id) {
      expandedJob = expandedJob === id ? null : id;
      renderJobs();
    }

    function openApplyModal(jobId) {
      selectedJob = positions.find((job) => job.id === jobId);
      if (!selectedJob) return;

      clearFormState();
      applyForm.reset();
      modalJobName.textContent = `${selectedJob.title} · ${selectedJob.vn}`;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      document.getElementById("fullName").focus();
    }

    function closeApplyModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      selectedJob = null;
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
        jobId: selectedJob.id,
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

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function escapeAttribute(value) {
      return String(value).replaceAll("'", "\\'");
    }

    function initCardCarousels() {
      const mobileCarousel = window.matchMedia("(max-width: 720px)");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const tracks = document.querySelectorAll(".evp-grid, .culture-grid, .steps-grid");

      tracks.forEach((track) => {
        if (track.dataset.carouselReady === "true") return;

        const controls = document.createElement("div");
        controls.className = "carousel-controls";
        controls.innerHTML = `
          <button class="carousel-btn" type="button" data-carousel-prev aria-label="Thẻ trước">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>
          </button>
          <button class="carousel-btn" type="button" data-carousel-next aria-label="Thẻ tiếp theo">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>
          </button>
        `;
        track.after(controls);

        const prevButton = controls.querySelector("[data-carousel-prev]");
        const nextButton = controls.querySelector("[data-carousel-next]");
        let autoTimer = null;
        let resumeTimer = null;

        const isActive = () => mobileCarousel.matches && track.scrollWidth > track.clientWidth + 8;

        const itemPositions = () => Array.from(track.children).map((item) => item.offsetLeft - track.offsetLeft);

        const currentIndex = () => {
          const positions = itemPositions();
          return positions.reduce((nearestIndex, left, index) => {
            const distance = Math.abs(left - track.scrollLeft);
            const nearestDistance = Math.abs(positions[nearestIndex] - track.scrollLeft);
            return distance < nearestDistance ? index : nearestIndex;
          }, 0);
        };

        const scrollByCard = (direction) => {
          if (!isActive()) return;

          const positions = itemPositions();
          const lastIndex = positions.length - 1;
          const activeIndex = currentIndex();
          const nextIndex = direction > 0
            ? (activeIndex >= lastIndex ? 0 : activeIndex + 1)
            : (activeIndex <= 0 ? lastIndex : activeIndex - 1);

          track.scrollTo({ left: positions[nextIndex], behavior: "smooth" });
        };

        const stopAuto = () => {
          if (autoTimer) window.clearInterval(autoTimer);
          autoTimer = null;
        };

        const startAuto = () => {
          stopAuto();
          if (!isActive() || reduceMotion.matches) return;
          autoTimer = window.setInterval(() => scrollByCard(1), 5000);
        };

        const pauseThenResume = () => {
          stopAuto();
          if (resumeTimer) window.clearTimeout(resumeTimer);
          resumeTimer = window.setTimeout(startAuto, 5000);
        };

        prevButton.addEventListener("click", () => {
          scrollByCard(-1);
          pauseThenResume();
        });

        nextButton.addEventListener("click", () => {
          scrollByCard(1);
          pauseThenResume();
        });

        track.addEventListener("pointerdown", pauseThenResume);
        window.addEventListener("resize", startAuto);

        if (mobileCarousel.addEventListener) {
          mobileCarousel.addEventListener("change", startAuto);
        }
        if (reduceMotion.addEventListener) {
          reduceMotion.addEventListener("change", startAuto);
        }

        track.dataset.carouselReady = "true";
        startAuto();
      });
    }

    applyForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!selectedJob) {
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
    initCardCarousels();
    fetchPositions();
