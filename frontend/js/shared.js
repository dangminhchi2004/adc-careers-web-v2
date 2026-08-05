
    const COLORS = {
      red: "#E8363A",
      orange: "#F57C22",
      yellow: "#FFB900",
      green: "#4CAF50",
      blue: "#2196F3",
      indigo: "#5C6BC0",
      purple: "#9C27B0"
    };

    const RAINBOW = [COLORS.red, COLORS.orange, COLORS.yellow, COLORS.green, COLORS.blue, COLORS.indigo, COLORS.purple];

    const API_BASE = window.ADC_API_BASE ?? (window.location.protocol === "file:" ? "http://localhost:5000" : "");

    const MOCK_POSITIONS = [
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
        slug: "giam-doc-san-xuat",
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
        slug: "giam-doc-nhan-su-to-chuc",
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
        slug: "truong-phong-kinh-doanh-quoc-te",
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
        slug: "truong-phong-ke-hoach-san-xuat",
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
        slug: "ky-su-tu-dong-hoa",
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
        slug: "chuyen-vien-kinh-doanh-cap-cao",
        reqs: [
          "3-5 năm sales B2B, ưu tiên export hoặc manufacturing.",
          "Tiếng Anh tốt, có khả năng chăm sóc khách hàng quốc tế.",
          "Theo sát pipeline, báo cáo rõ ràng và chủ động mở rộng cơ hội.",
          "Tinh thần bền bỉ, chịu trách nhiệm với mục tiêu doanh số."
        ]
      }
    ];

    function normalizeJob(job) {
      const reqs = normalizeRequirements(job.reqs);
      const requirementsDetail = normalizeRequirements(job.requirementsDetail || job.requirements_detail);

      return {
        ...job,
        id: Number(job.id),
        urgent: Boolean(job.urgent),
        color: job.color || COLORS.blue,
        status: job.status || "active",
        slug: job.slug || slugify(job.vn || job.title || job.id),
        employmentType: job.employmentType || job.employment_type || "Full-time",
        workLocation: job.workLocation || job.work_location || "KCN Tân Tạo, Bình Tân, TP.HCM",
        locationShort: job.locationShort || job.location_short || "TP.HCM",
        salaryText: job.salaryText || job.salary_text || "Thỏa thuận theo năng lực",
        ageRange: job.ageRange || job.age_range || "",
        experienceText: job.experienceText || job.experience_text || "",
        publishedAt: job.publishedAt || job.published_at || job.created_at || "",
        quantity: Number(job.quantity || 1),
        reqs,
        responsibilities: normalizeRequirements(job.responsibilities),
        requirementsDetail: requirementsDetail.length > 0 ? requirementsDetail : reqs,
        benefits: normalizeBenefits(job.benefits),
        environmentSections: normalizeEnvironmentSections(job.environmentSections || job.environment_sections)
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

    function normalizeBenefits(benefits) {
      const items = normalizeStructuredList(benefits);
      return items.map((item) => {
        if (typeof item === "object" && item !== null) {
          return {
            icon: item.icon || "*",
            text: item.text || ""
          };
        }

        return {
          icon: "*",
          text: String(item || "")
        };
      }).filter((item) => item.text);
    }

    function normalizeEnvironmentSections(sections) {
      const items = normalizeStructuredList(sections);
      return items.map((item) => ({
        title: item && typeof item === "object" ? item.title || "" : "",
        content: item && typeof item === "object" ? item.content || "" : ""
      })).filter((item) => item.title && item.content);
    }

    function normalizeStructuredList(value) {
      if (Array.isArray(value)) return value;
      if (!value) return [];

      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function jobUrl(job) {
      return job.slug ? `index.html?slug=${encodeURIComponent(job.slug)}` : `index.html?id=${encodeURIComponent(job.id)}`;
    }

    function slugify(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 180);
    }

    async function fetchJobs() {
      try {
        const response = await fetch(`${API_BASE}/api/jobs`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        const apiJobs = Array.isArray(result) ? result : result.data;

        if (Array.isArray(apiJobs) && apiJobs.length > 0) {
          return apiJobs.map(normalizeJob);
        }
      } catch (error) {
        console.warn("Using mock jobs because /api/jobs is unavailable:", error);
      }

      return MOCK_POSITIONS.map(normalizeJob);
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
      return escapeHtml(value).replaceAll("`", "&#096;");
    }

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

    let recaptchaLoadPromise = null;
    function loadReCaptcha() {
      if (window.grecaptcha) return Promise.resolve();
      if (recaptchaLoadPromise) return recaptchaLoadPromise;

      recaptchaLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (window.grecaptcha) {
            window.grecaptcha.ready(resolve);
          } else {
            resolve();
          }
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
      return recaptchaLoadPromise;
    }
    window.loadReCaptcha = loadReCaptcha;

    document.addEventListener("change", (event) => {
      const input = event.target.closest(".cv-upload-input");
      if (!input) return;
      const nameEl = input.closest(".cv-upload")?.querySelector(".cv-upload-filename");
      if (!nameEl) return;
      nameEl.textContent = input.files && input.files.length ? input.files[0].name : "Chưa chọn tệp nào";
    });

    document.addEventListener("reset", (event) => {
      event.target.querySelectorAll(".cv-upload-filename").forEach((nameEl) => {
        nameEl.textContent = "Chưa chọn tệp nào";
      });
    });

