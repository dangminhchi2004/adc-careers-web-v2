
    let positions = MOCK_POSITIONS.map(normalizeJob);
    let selectedDept = "all";

    const filterBar = document.getElementById("filterBar");
    const jobResults = document.getElementById("jobResults");
    const jobList = document.getElementById("jobList");
    const jobCount = document.getElementById("jobCount");
    const emptyState = document.getElementById("emptyState");
    const jobSearchForm = document.getElementById("jobSearchForm");
    const jobSearchInput = document.getElementById("jobSearchInput");
    const jobLevelFilter = document.getElementById("jobLevelFilter");
    const jobLocationFilter = document.getElementById("jobLocationFilter");
    const jobUrgentFilter = document.getElementById("jobUrgentFilter");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let jobResultsAnimation = 0;
    const filterPrevBtn = document.getElementById("filterPrevBtn");
    const filterNextBtn = document.getElementById("filterNextBtn");

    async function fetchPositions() {
      positions = await fetchJobs();
      selectedDept = "all";
      renderFilters();
      renderAdvancedFilters();
      renderJobs();
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
        const color = RAINBOW[index % RAINBOW.length];
        const isActive = selectedDept === dept;
        return `
          <button
            class="filter-btn${isActive ? " active" : ""}"
            type="button"
            style="--active-color:${color}"
            onclick="setDept('${escapeJs(dept)}')"
          >${escapeHtml(label)}</button>
        `;
      }).join("");
      window.requestAnimationFrame(updateFilterArrows);
    }

    function renderAdvancedFilters() {
      renderSelectOptions(jobLevelFilter, "all", "Tất cả cấp bậc", uniqueSorted(activePositions().map((job) => job.level).filter(Boolean)));
      renderSelectOptions(jobLocationFilter, "all", "Tất cả địa điểm", uniqueSorted(activePositions().map((job) => job.locationShort || job.workLocation).filter(Boolean)));
    }

    function renderJobs(options = {}) {
      const filtered = getFilteredJobs();

      const updateContent = () => {
        jobCount.textContent = `${filtered.length} vị trí`;
        emptyState.classList.toggle("visible", filtered.length === 0);

        jobList.innerHTML = filtered.map((job, index) => `
          <a class="job-card" style="--job-color:${escapeAttribute(job.color || "#2196F3")}; --item-index:${index}" href="${jobUrl(job)}">
            <span class="job-header">
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
                    <path d="m9 6 6 6-6 6"></path>
                  </svg>
                </span>
              </span>
            </span>
          </a>
        `).join("");
      };

      if (options.animate && jobResults && !reduceMotion.matches) {
        animateJobResults(updateContent);
        return;
      }

      updateContent();
    }

    function animateJobResults(updateContent) {
      const animationId = ++jobResultsAnimation;
      const startHeight = jobResults.getBoundingClientRect().height;

      jobResults.style.height = `${startHeight}px`;
      jobResults.classList.add("is-animating");
      jobList.classList.remove("is-entering");

      updateContent();

      const endHeight = jobResults.scrollHeight;
      jobResults.getBoundingClientRect();

      window.requestAnimationFrame(() => {
        if (animationId !== jobResultsAnimation) return;

        jobList.classList.add("is-entering");
        jobResults.style.height = `${endHeight}px`;
      });

      const cleanup = () => {
        if (animationId !== jobResultsAnimation) return;

        jobResults.style.height = "";
        jobResults.classList.remove("is-animating");
        jobList.classList.remove("is-entering");
      };

      const onTransitionEnd = (event) => {
        if (event.target !== jobResults || event.propertyName !== "height") return;
        jobResults.removeEventListener("transitionend", onTransitionEnd);
        cleanup();
      };

      jobResults.addEventListener("transitionend", onTransitionEnd);
      window.setTimeout(() => {
        jobResults.removeEventListener("transitionend", onTransitionEnd);
        cleanup();
      }, 520);
    }

    function setDept(dept) {
      selectedDept = dept;
      renderFilters();
      renderJobs({ animate: true });
    }

    function scrollDeptFilters(direction) {
      const amount = Math.max(160, Math.floor(filterBar.clientWidth * 0.72));
      filterBar.scrollBy({ left: direction * amount, behavior: reduceMotion.matches ? "auto" : "smooth" });
    }

    function updateFilterArrows() {
      const maxScrollLeft = Math.max(0, filterBar.scrollWidth - filterBar.clientWidth);
      const hasOverflow = maxScrollLeft > 2;

      filterPrevBtn.hidden = !hasOverflow;
      filterNextBtn.hidden = !hasOverflow;
      filterPrevBtn.disabled = !hasOverflow || filterBar.scrollLeft <= 2;
      filterNextBtn.disabled = !hasOverflow || filterBar.scrollLeft >= maxScrollLeft - 2;
    }

    function getFilteredJobs() {
      const search = normalizeSearch(jobSearchInput.value);
      const level = jobLevelFilter.value;
      const location = jobLocationFilter.value;
      const urgent = jobUrgentFilter.value;

      return activePositions().filter((job) => {
        if (selectedDept !== "all" && job.dept !== selectedDept) return false;
        if (level !== "all" && job.level !== level) return false;
        if (location !== "all" && (job.locationShort || job.workLocation) !== location) return false;
        if (urgent === "urgent" && !job.urgent) return false;

        if (search) {
          const haystack = normalizeSearch([
            job.title,
            job.vn,
            job.dept,
            job.level,
            job.locationShort,
            job.workLocation,
            job.industry,
            job.summary,
            ...(job.reqs || [])
          ].join(" "));
          if (!haystack.includes(search)) return false;
        }

        return true;
      });
    }

    function renderSelectOptions(selectElement, allValue, allLabel, values) {
      const currentValue = selectElement.value || allValue;
      selectElement.innerHTML = [
        `<option value="${allValue}">${escapeHtml(allLabel)}</option>`,
        ...values.map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(value)}</option>`)
      ].join("");
      selectElement.value = values.includes(currentValue) || currentValue === allValue ? currentValue : allValue;
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

    function escapeJs(value) {
      return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    }

    jobSearchForm.addEventListener("submit", (event) => event.preventDefault());
    jobSearchForm.addEventListener("input", () => renderJobs({ animate: true }));
    jobSearchForm.addEventListener("change", () => renderJobs({ animate: true }));
    filterPrevBtn.addEventListener("click", () => scrollDeptFilters(-1));
    filterNextBtn.addEventListener("click", () => scrollDeptFilters(1));
    filterBar.addEventListener("scroll", updateFilterArrows, { passive: true });
    window.addEventListener("resize", updateFilterArrows);

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

    loadOptionalBackgrounds();
    initCardCarousels();
    fetchPositions();
