
    let positions = MOCK_POSITIONS.map(normalizeJob);
    let selectedDept = "all";

    const filterBar = document.getElementById("filterBar");
    const jobResults = document.getElementById("jobResults");
    const jobList = document.getElementById("jobList");
    const jobCount = document.getElementById("jobCount");
    const emptyState = document.getElementById("emptyState");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let jobResultsAnimation = 0;

    async function fetchPositions() {
      positions = await fetchJobs();
      selectedDept = "all";
      renderFilters();
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
            onclick="setDept('${escapeAttribute(dept)}')"
          >${escapeHtml(label)}</button>
        `;
      }).join("");
    }

    function renderJobs(options = {}) {
      const filtered = selectedDept === "all"
        ? activePositions()
        : activePositions().filter((job) => job.dept === selectedDept);

      const updateContent = () => {
        jobCount.textContent = `${filtered.length} vị trí`;
        emptyState.classList.toggle("visible", filtered.length === 0);

        jobList.innerHTML = filtered.map((job, index) => `
          <a class="job-card" style="--job-color:${job.color}; --item-index:${index}" href="job.html?id=${job.id}">
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
