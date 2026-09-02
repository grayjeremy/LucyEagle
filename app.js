const DATA_FILES = [
  "data/ranks.json?v=3",
  "data/merit-badges.json",
  "data/project.json?v=3",
  "data/gallery.json?v=3",
];

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);

async function loadData() {
  const responses = await Promise.all(DATA_FILES.map((file) => fetch(file)));
  const failed = responses.find((response) => !response.ok);
  if (failed) throw new Error(`Unable to load site content (${failed.status}).`);
  return Promise.all(responses.map((response) => response.json()));
}

function renderRanks(ranks) {
  document.querySelector("#rank-timeline").innerHTML = ranks.map((rank) => `
    <article class="rank reveal ${rank.name === "Eagle" ? "eagle" : ""}">
      <span class="rank-dot" aria-hidden="true"></span>
      <img class="rank-patch" src="${escapeHtml(rank.image)}" alt="${escapeHtml(rank.name)} rank patch" loading="lazy">
      <h3>${escapeHtml(rank.name)}</h3>
      <time datetime="${escapeHtml(rank.date)}">${escapeHtml(rank.displayDate)}</time>
    </article>
  `).join("");
}

function renderBadges(data) {
  const eagleRequired = data.badges.filter((badge) => badge.eagleRequired).length;
  const stats = [
    [data.badges.length, "Total earned"],
    [eagleRequired, "Eagle required"],
    [data.badges.length - eagleRequired, "Elective badges"],
    [6, "Eagle Palms"],
  ];
  document.querySelector("#badge-stats").innerHTML = stats.map(([value, label]) => `
    <div class="stat reveal">
      <strong class="count" data-count="${value}">0</strong>
      <span>${label}</span>
    </div>
  `).join("");
  document.querySelectorAll(".badge-total").forEach((counter) => {
    counter.dataset.count = data.badges.length;
  });
  document.querySelector("#badge-grid").innerHTML = data.badges.map((badge, index) => {
    const slug = new URL(badge.url).pathname.split("/").filter(Boolean).pop();
    const image = `assets/merit-badges/${slug}.webp?v=2`;
    return `
    <a class="badge reveal" href="${escapeHtml(badge.url)}" target="_blank" rel="noopener noreferrer"
       style="transition-delay:${(index % 7) * 55}ms"
       aria-label="${escapeHtml(badge.name)} merit badge requirements (opens in a new tab)">
      <div class="badge-icon">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(badge.name)} merit badge patch" loading="lazy">
      </div>
      <strong>${escapeHtml(badge.name)}</strong>
    </a>
  `;
  }).join("");
}

function renderProject(project) {
  document.querySelector("#project-summary").textContent = project.purpose;
  document.querySelector("#project-details").innerHTML = project.details.map((detail) => `
    <div class="project-detail reveal">
      <span>${escapeHtml(detail.label)}</span>
      <strong>${escapeHtml(detail.value)}</strong>
    </div>
  `).join("");
  document.querySelector("#project-story").innerHTML = project.chapters.map((chapter, index) => `
    <article class="project-chapter reveal">
      <figure class="project-chapter-media">
        <img src="${escapeHtml(chapter.image)}" alt="${escapeHtml(chapter.alt)}" loading="lazy">
        <figcaption>${escapeHtml(chapter.caption)}</figcaption>
      </figure>
      <div class="project-chapter-copy">
        <span>Chapter ${String(index + 1).padStart(2, "0")}</span>
        <h3>${escapeHtml(chapter.title)}</h3>
        <p>${escapeHtml(chapter.body)}</p>
      </div>
    </article>
  `).join("");
  document.querySelector("#project-stats").innerHTML = project.impact.map((stat) => `
    <div class="project-stat reveal">
      <strong>${escapeHtml(stat.prefix || "")}<span class="count" data-count="${stat.value}">0</span>${escapeHtml(stat.suffix || "")}</strong>
      <span>${escapeHtml(stat.label)}</span>
    </div>
  `).join("");
  document.querySelector("#project-gallery").innerHTML = project.gallery.map((photo) => `
    <figure class="project-gallery-item" tabindex="0" role="button"
      data-title="${escapeHtml(photo.title)}" data-category="${escapeHtml(photo.category)}"
      data-image="${escapeHtml(photo.image)}" aria-label="Open full-size photo: ${escapeHtml(photo.title)}">
      <img src="${escapeHtml(photo.image)}" alt="${escapeHtml(photo.alt)}" loading="lazy">
      <figcaption>
        <span>${escapeHtml(photo.category)}</span>
        <strong>${escapeHtml(photo.title)}</strong>
      </figcaption>
    </figure>
  `).join("");
}

function renderGallery(data) {
  const filters = ["All", ...new Set(data.photos.map((photo) => photo.category))];
  document.querySelector("#gallery-filters").innerHTML = filters.map((filter, index) => `
    <button type="button" class="${index === 0 ? "active" : ""}" data-filter="${escapeHtml(filter)}"
      aria-pressed="${index === 0}">${escapeHtml(filter)}</button>
  `).join("");
  document.querySelector("#gallery-grid").innerHTML = data.photos.map((photo, index) => `
    <button type="button" class="gallery-item reveal" data-category="${escapeHtml(photo.category)}"
      data-title="${escapeHtml(photo.title)}" data-image="${escapeHtml(photo.image)}"
      style="transition-delay:${(index % 4) * 65}ms" aria-label="Open photo: ${escapeHtml(photo.title)}">
      <img src="${escapeHtml(photo.image)}" alt="${escapeHtml(photo.alt)}" loading="lazy">
      <span><strong>${escapeHtml(photo.title)}</strong><small>${escapeHtml(photo.category)}</small></span>
    </button>
  `).join("");
}

function setupRevealAnimations() {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in-view");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
}

function setupCounters() {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const counter = entry.target;
      const target = Number(counter.dataset.count);
      const suffix = counter.dataset.suffix || "";
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = `${Math.round(target * eased).toLocaleString()}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.unobserve(counter);
    });
  }, { threshold: 0.7 });
  document.querySelectorAll(".count").forEach((counter) => counterObserver.observe(counter));
}

function setupParallax() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const elements = [...document.querySelectorAll(".parallax, .parallax-card")];
  let scheduled = false;
  const update = () => {
    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      const offset = (rect.top + rect.height / 2 - innerHeight / 2) * Number(element.dataset.speed);
      element.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
    scheduled = false;
  };
  addEventListener("scroll", () => {
    if (!scheduled) requestAnimationFrame(update);
    scheduled = true;
  }, { passive: true });
  update();
}

function setupGallery() {
  const filterBar = document.querySelector("#gallery-filters");
  const lightbox = document.querySelector("#lightbox");
  const previousButton = lightbox.querySelector(".lightbox-prev");
  const nextButton = lightbox.querySelector(".lightbox-next");
  const count = lightbox.querySelector(".lightbox-count");
  let albumItems = [];
  let currentIndex = -1;
  const displayItem = (item) => {
    const sourceImage = item.querySelector("img");
    lightbox.querySelector("img").src = item.dataset.image || sourceImage.src;
    lightbox.querySelector("img").alt = sourceImage.alt;
    lightbox.querySelector("strong").textContent =
      item.dataset.title || item.querySelector("figcaption")?.textContent || "";
    lightbox.querySelector(".lightbox-category").textContent =
      item.dataset.category || (item.classList.contains("photo-card") ? "The Journey Begins" : "");
    const hasAlbum = albumItems.length > 1;
    previousButton.hidden = !hasAlbum;
    nextButton.hidden = !hasAlbum;
    count.hidden = !hasAlbum;
    count.textContent = hasAlbum ? `${currentIndex + 1} / ${albumItems.length}` : "";
  };
  const openLightbox = (item, items = []) => {
    albumItems = items;
    currentIndex = albumItems.indexOf(item);
    displayItem(item);
    if (!lightbox.open) lightbox.showModal();
  };
  const moveThroughAlbum = (direction) => {
    if (albumItems.length < 2) return;
    currentIndex = (currentIndex + direction + albumItems.length) % albumItems.length;
    displayItem(albumItems[currentIndex]);
  };
  filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    filterBar.querySelectorAll("button").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", active);
    });
    document.querySelectorAll(".gallery-item").forEach((item) => {
      item.hidden = button.dataset.filter !== "All" && item.dataset.category !== button.dataset.filter;
    });
  });
  document.querySelector("#gallery-grid").addEventListener("click", (event) => {
    const item = event.target.closest(".gallery-item");
    if (!item) return;
    const visibleItems = [...document.querySelectorAll("#gallery-grid .gallery-item:not([hidden])")];
    openLightbox(item, visibleItems);
  });
  const adventuresSection = document.querySelector(".featured-adventures");
  const getAdventureAlbum = (item) => [...adventuresSection.querySelectorAll(".adventure-gallery-item")]
    .filter((albumItem) => albumItem.dataset.album === item.dataset.album);
  adventuresSection.addEventListener("click", (event) => {
    const item = event.target.closest(".adventure-gallery-item");
    if (!item) return;
    openLightbox(item, getAdventureAlbum(item));
  });
  adventuresSection.addEventListener("keydown", (event) => {
    const item = event.target.closest(".adventure-gallery-item");
    if (item && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openLightbox(item, getAdventureAlbum(item));
    }
  });
  const projectGallery = document.querySelector("#project-gallery");
  projectGallery.addEventListener("click", (event) => {
    const item = event.target.closest(".project-gallery-item");
    if (!item) return;
    openLightbox(item, [...projectGallery.querySelectorAll(".project-gallery-item")]);
  });
  projectGallery.addEventListener("keydown", (event) => {
    const item = event.target.closest(".project-gallery-item");
    if (item && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openLightbox(item, [...projectGallery.querySelectorAll(".project-gallery-item")]);
    }
  });
  document.querySelector(".photo-stack").addEventListener("click", (event) => {
    const item = event.target.closest(".lightbox-trigger");
    if (item) openLightbox(item);
  });
  document.querySelector(".photo-stack").addEventListener("keydown", (event) => {
    const item = event.target.closest(".lightbox-trigger");
    if (item && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openLightbox(item);
    }
  });
  previousButton.addEventListener("click", () => moveThroughAlbum(-1));
  nextButton.addEventListener("click", () => moveThroughAlbum(1));
  lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") moveThroughAlbum(-1);
    if (event.key === "ArrowRight") moveThroughAlbum(1);
  });
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
}

function setupNavigation() {
  const header = document.querySelector("#site-header");
  const toggle = document.querySelector(".nav-toggle");
  addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 40), { passive: true });
  toggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  document.querySelectorAll(".site-nav a").forEach((link) => link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  }));
}

function setupScoutLawPoints() {
  const container = document.querySelector(".scout-law-points");
  if (!container) return;
  const points = [
    "Trustworthy", "Loyal", "Helpful", "Friendly", "Courteous", "Kind",
    "Obedient", "Cheerful", "Thrifty", "Brave", "Clean", "Reverent",
  ];
  const selected = [...points]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  container.querySelectorAll("span").forEach((element, index) => {
    element.textContent = selected[index];
  });
}

async function initialize() {
  try {
    const [ranks, badges, project, gallery] = await loadData();
    renderRanks(ranks);
    renderBadges(badges);
    renderProject(project);
    renderGallery(gallery);
    setupRevealAnimations();
    setupCounters();
    setupParallax();
    setupGallery();
    setupNavigation();
    setupScoutLawPoints();
  } catch (error) {
    console.error(error);
    const main = document.querySelector("main");
    const notice = document.createElement("p");
    notice.className = "data-error";
    notice.textContent = "Some story content could not be loaded. Please serve this site from a web server rather than opening the HTML file directly.";
    main.prepend(notice);
  }
}

initialize();
