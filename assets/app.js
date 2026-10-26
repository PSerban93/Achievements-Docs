(() => {
  const body = document.body;
  const page = body?.dataset?.page || "";
  const nav = document.querySelector("[data-nav]");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (nav && page) {
    const active = nav.querySelector(`[data-nav-id="${page}"]`);
    if (active) {
      active.classList.add("is-active");
      active.setAttribute("aria-current", "page");
    }
  }

  const initMobileNavigation = () => {
    const sidebar = document.querySelector(".sidebar");
    const brand = sidebar?.querySelector(".brand");
    if (!sidebar || !brand || !nav) return;

    nav.id ||= "site-navigation";
    const button = document.createElement("button");
    button.className = "nav-toggle";
    button.type = "button";
    button.setAttribute("aria-controls", nav.id);
    button.setAttribute("aria-expanded", "false");
    button.innerHTML =
      '<span>Menu</span><span class="nav-toggle-icon" aria-hidden="true"></span>';
    brand.insertAdjacentElement("afterend", button);
    body.classList.add("has-mobile-nav");

    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
    };

    button.addEventListener("click", () => {
      setOpen(!nav.classList.contains("is-open"));
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        button.focus();
      }
    });
  };

  const getAnchorTarget = (link) => {
    const hash = link.getAttribute("href") || "";
    if (!hash.startsWith("#") || hash.length < 2) return null;
    try {
      return document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return null;
    }
  };

  const alignAnchorTarget = (target, behavior = "auto") => {
    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : behavior,
      block: "start",
    });
  };

  let setActiveGuide = () => {};

  const initGuidesIndex = () => {
    if (page !== "platforms") return;

    const main = document.querySelector("main.content");
    const targets = Array.from(document.querySelectorAll(".anchor-target[id]"));
    const guideCards = Array.from(
      document.querySelectorAll('.card-link[href^="#"]'),
    );
    if (!main || !targets.length) return;

    const guideData = targets.map((target) => {
      const heading =
        target.querySelector(".panel h2") ||
        target.querySelector(".section-head h2") ||
        target.querySelector("h2");
      const label = heading?.textContent.trim() || target.id;
      return {
        id: target.id,
        label,
        searchText: `${label} ${target.textContent}`.toLocaleLowerCase(),
        target,
      };
    });

    const categoryById = new Map(
      Object.entries({
        "steam-official": "official",
        "epic-games": "official",
        "xbox-pc": "official",
        retroachievements: "official",
        "gog-galaxy": "official",
        "ubisoft-connect": "official",
        "ea-desktop": "official",
        gse: "helpers",
        "achievement-enabler": "helpers",
        "uplay-goldberg": "helpers",
        "uplay-lumaplay": "helpers",
        "uplay-rune": "helpers",
        xlivelessness: "helpers",
        "gog-universelan": "helpers",
        "nemirtingas-epic-emu": "helpers",
        "anadius-origin-ea-emu": "helpers",
        "pc-ports-ladxhd": "ports",
        "xbox-360-recomp": "ports",
        "ps3-recomp": "ports",
        "ps4-recomp": "ports",
        "xenia-canary": "console",
        rpcs3: "console",
        shadps4: "console",
        kytyps5: "console",
      }),
    );
    const categoryLabels = {
      official: "Official",
      helpers: "Helpers",
      ports: "PC ports",
      console: "Console",
    };
    let activeCategory = "all";

    const toolbar = document.createElement("section");
    toolbar.className = "guide-toolbar";
    toolbar.setAttribute("aria-labelledby", "guide-filter-title");
    toolbar.innerHTML = `
      <div class="guide-toolbar-copy">
        <p class="eyebrow">Browse support</p>
        <h2 id="guide-filter-title">Find the right setup path</h2>
      </div>
      <div class="guide-toolbar-search">
        <label for="guide-search">
          <span>Search guides</span>
          <span class="guide-search-meta">
            <span class="guide-search-status" role="status" aria-live="polite"></span>
            <kbd title="Press / to search">/</kbd>
          </span>
        </label>
        <input class="guide-search" id="guide-search" type="search" placeholder="Platform or emulator…" autocomplete="off">
      </div>
      <div class="guide-filters" role="group" aria-label="Filter guides by type">
        <button type="button" data-guide-category="all" aria-pressed="true">All</button>
        <button type="button" data-guide-category="official" aria-pressed="false">Official</button>
        <button type="button" data-guide-category="helpers" aria-pressed="false">Helpers</button>
        <button type="button" data-guide-category="ports" aria-pressed="false">PC ports</button>
        <button type="button" data-guide-category="console" aria-pressed="false">Console</button>
      </div>
      <div class="guide-empty" hidden>
        <strong>No matching guides</strong>
        <span>Try another term or reset the active filters.</span>
        <button type="button" class="guide-reset">Reset filters</button>
      </div>
    `;
    main.querySelector(".page-head")?.insertAdjacentElement("afterend", toolbar);

    const contentMain = document.createElement("div");
    contentMain.className = "content-main";
    Array.from(main.childNodes).forEach((node) => contentMain.append(node));

    const toc = document.createElement("aside");
    toc.className = "page-toc";
    toc.setAttribute("aria-labelledby", "guides-index-title");
    toc.innerHTML = `
      <p class="eyebrow">Guides</p>
      <h2 id="guides-index-title">On this page</h2>
      <nav class="page-toc-links" aria-label="Guide sections"></nav>
    `;

    const tocNav = toc.querySelector(".page-toc-links");
    const search = toolbar.querySelector(".guide-search");
    const status = toolbar.querySelector(".guide-search-status");
    const emptyState = toolbar.querySelector(".guide-empty");
    const tocLinks = new Map();

    guideData.forEach(({ id, label }) => {
      const link = document.createElement("a");
      link.className = "page-toc-link";
      link.href = `#${id}`;
      link.textContent = label;
      tocNav.append(link);
      tocLinks.set(id, [link]);
    });

    const mobileToc = document.createElement("details");
    mobileToc.className = "mobile-toc";
    mobileToc.innerHTML = `
      <summary>On this page <span aria-hidden="true">⌄</span></summary>
      <nav class="mobile-toc-links" aria-label="Guide sections on mobile"></nav>
    `;
    const mobileTocNav = mobileToc.querySelector(".mobile-toc-links");
    guideData.forEach(({ id, label }) => {
      const link = document.createElement("a");
      link.className = "page-toc-link";
      link.href = `#${id}`;
      link.textContent = label;
      mobileTocNav.append(link);
      tocLinks.get(id).push(link);
    });
    toolbar.insertAdjacentElement("afterend", mobileToc);

    main.classList.add("has-page-toc");
    main.append(contentMain, toc);

    setActiveGuide = (id) => {
      tocLinks.forEach((links, linkId) => {
        const active = linkId === id;
        links.forEach((link) => {
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    };

    const cardsById = new Map();
    const categoryIcons = {
      official:
        '<svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="8"></circle><path d="M4 12h16M12 4c2.4 2.2 3.6 4.9 3.6 8S14.4 17.8 12 20c-2.4-2.2-3.6-4.9-3.6-8S9.6 6.2 12 4Z"></path></svg>',
      helpers:
        '<svg viewBox="0 0 24 24" focusable="false"><path d="m14.7 6.3 3-3a5 5 0 0 1-6.4 6.4l-6.6 6.6a2.1 2.1 0 1 0 3 3l6.6-6.6a5 5 0 0 1 6.4-6.4l-3 3-3-3Z"></path></svg>',
      ports:
        '<svg viewBox="0 0 24 24" focusable="false"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 16v4M8 10h8M13 7l3 3-3 3"></path></svg>',
      console:
        '<svg viewBox="0 0 24 24" focusable="false"><path d="M7 8h10a4 4 0 0 1 3.8 5.3l-1.2 3.5a2 2 0 0 1-3.2.9L14.5 16h-5l-1.9 1.7a2 2 0 0 1-3.2-.9l-1.2-3.5A4 4 0 0 1 7 8Z"></path><path d="M7 12h4M9 10v4M16 11h.01M18 13h.01"></path></svg>',
    };
    guideCards.forEach((card) => {
      const id = decodeURIComponent(card.getAttribute("href").slice(1));
      const category = categoryById.get(id) || "helpers";
      const cards = cardsById.get(id) || [];
      cards.push(card);
      cardsById.set(id, cards);
      card.dataset.category = category;

      const topline = document.createElement("span");
      topline.className = "guide-card-topline";
      topline.innerHTML = `
        <span class="guide-card-mark" aria-hidden="true">${categoryIcons[category]}</span>
        <span class="guide-card-kind">${categoryLabels[category]}</span>
      `;
      card.prepend(topline);
    });

    guideData.forEach((guide, index) => {
      const category = categoryById.get(guide.id) || "helpers";
      const heading =
        guide.target.querySelector(".panel h2") ||
        guide.target.querySelector(".section-head h2") ||
        guide.target.querySelector("h2");
      if (!heading) return;

      const sectionText = guide.target.textContent.toLocaleLowerCase();
      let setupType = "Guided setup";
      if (sectionText.includes("opt-in") || sectionText.includes("optional")) {
        setupType = "Optional integration";
      } else if (
        sectionText.includes("auto-detect") ||
        sectionText.includes("automatically") ||
        sectionText.includes("auto-generated")
      ) {
        setupType = "Automatic discovery";
      }

      const metadata = document.createElement("div");
      metadata.className = "guide-meta";
      metadata.setAttribute("aria-label", "Guide metadata");
      metadata.innerHTML = `
        <span>${categoryIcons[category]} ${categoryLabels[category]}</span>
        <span>${setupType}</span>
      `;
      heading.insertAdjacentElement("afterend", metadata);

      const previous = guideData[index - 1];
      const next = guideData[index + 1];
      if (previous || next) {
        const sectionNav = document.createElement("nav");
        sectionNav.className = "guide-prev-next";
        sectionNav.setAttribute("aria-label", `Navigate from ${guide.label}`);
        if (previous) {
          const link = document.createElement("a");
          link.className = "guide-nav-link guide-nav-link--previous";
          link.href = `#${previous.id}`;
          link.innerHTML = `<small>Previous guide</small><strong>← ${previous.label}</strong>`;
          sectionNav.append(link);
        }
        if (next) {
          const link = document.createElement("a");
          link.className = "guide-nav-link guide-nav-link--next";
          link.href = `#${next.id}`;
          link.innerHTML = `<small>Next guide</small><strong>${next.label} →</strong>`;
          sectionNav.append(link);
        }
        guide.target.append(sectionNav);
      }
    });

    const catalogSections = Array.from(
      contentMain.querySelectorAll(".section:not(.anchor-target)"),
    ).filter((section) => section.querySelector('.card-link[href^="#"]'));

    const highlightText = (element, query) => {
      if (!element.dataset.originalText) {
        element.dataset.originalText = element.textContent;
      }
      const original = element.dataset.originalText;
      element.replaceChildren();
      if (!query) {
        element.textContent = original;
        return;
      }

      const lowerOriginal = original.toLocaleLowerCase();
      let cursor = 0;
      let match = lowerOriginal.indexOf(query);
      while (match !== -1) {
        element.append(original.slice(cursor, match));
        const mark = document.createElement("mark");
        mark.textContent = original.slice(match, match + query.length);
        element.append(mark);
        cursor = match + query.length;
        match = lowerOriginal.indexOf(query, cursor);
      }
      element.append(original.slice(cursor));
    };

    const filterGuides = () => {
      const query = search.value.trim().toLocaleLowerCase();
      let matches = 0;

      guideData.forEach((guide) => {
        const categoryMatch =
          activeCategory === "all" ||
          categoryById.get(guide.id) === activeCategory;
        const match = categoryMatch && (!query || guide.searchText.includes(query));
        tocLinks.get(guide.id).forEach((link) => {
          link.hidden = !match;
          highlightText(link, query);
        });
        (cardsById.get(guide.id) || []).forEach((card) => {
          card.hidden = !match;
          const title = card.querySelector("h3");
          const description = card.querySelector("p");
          if (title) highlightText(title, query);
          if (description) highlightText(description, query);
        });
        if (match) matches += 1;
      });

      catalogSections.forEach((section) => {
        section.querySelectorAll(".card-grid").forEach((grid) => {
          if (!grid.querySelector('.card-link[href^="#"]')) return;
          const visible = Array.from(grid.querySelectorAll(".card-link")).some(
            (card) => !card.hidden,
          );
          grid.hidden = !visible;
          const heading = grid.previousElementSibling;
          if (heading?.classList.contains("subsection-head")) {
            heading.hidden = !visible;
          }
        });
        section.hidden = !Array.from(
          section.querySelectorAll('.card-link[href^="#"]'),
        ).some((card) => !card.hidden);
      });

      status.textContent = query
        ? `${matches} ${matches === 1 ? "guide" : "guides"} found`
        : `${matches} ${matches === 1 ? "guide" : "guides"}`;
      emptyState.hidden = matches !== 0;
    };

    const filterButtons = Array.from(
      toolbar.querySelectorAll("[data-guide-category]"),
    );
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.guideCategory;
        filterButtons.forEach((item) => {
          item.setAttribute(
            "aria-pressed",
            String(item === button),
          );
        });
        filterGuides();
      });
    });

    const resetFilters = () => {
      activeCategory = "all";
      search.value = "";
      filterButtons.forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.guideCategory === "all"),
        );
      });
      filterGuides();
      search.focus();
    };
    toolbar.querySelector(".guide-reset").addEventListener("click", resetFilters);

    search.addEventListener("input", filterGuides);
    search.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && search.value) {
        search.value = "";
        filterGuides();
      }
    });
    document.addEventListener("keydown", (event) => {
      const editing = event.target.matches(
        "input, textarea, select, [contenteditable='true']",
      );
      if (
        (!editing && event.key === "/") ||
        (event.ctrlKey && event.key.toLocaleLowerCase() === "k")
      ) {
        event.preventDefault();
        search.focus();
        search.select();
      }
    });
    mobileToc.addEventListener("click", (event) => {
      if (event.target.closest("a")) mobileToc.open = false;
    });
    filterGuides();

    const visibleHeadings = new Set();
    const headingToId = new Map();
    guideData.forEach(({ id, target }) => {
      const heading = target.querySelector("h2") || target;
      headingToId.set(heading, id);
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) visibleHeadings.add(entry.target);
            else visibleHeadings.delete(entry.target);
          });
          const current = Array.from(visibleHeadings).sort(
            (a, b) =>
              Math.abs(a.getBoundingClientRect().top - 100) -
              Math.abs(b.getBoundingClientRect().top - 100),
          )[0];
          if (current) setActiveGuide(headingToId.get(current));
        },
        { rootMargin: "-8% 0px -78%", threshold: 0 },
      );
      headingToId.forEach((_, heading) => observer.observe(heading));
    }

    const initialId = decodeURIComponent(window.location.hash.slice(1));
    if (tocLinks.has(initialId)) {
      setActiveGuide(initialId);
      const initialTarget = guideData.find(({ id }) => id === initialId)?.target;
      if (initialTarget) {
        window.requestAnimationFrame(() => alignAnchorTarget(initialTarget));
      }
    }
  };

  const initPageIndex = () => {
    if (page === "platforms") return;

    const main = document.querySelector("main.content");
    if (!main) return;

    const entries = [];
    const pageHeader = main.querySelector(":scope > .page-head, :scope > .hero");
    if (pageHeader) {
      entries.push({
        target: pageHeader,
        heading: pageHeader.querySelector("h1"),
        label:
          (page === "home"
            ? "Overview"
            : pageHeader.querySelector(".eyebrow")?.textContent.trim()) ||
          "Overview",
        preferredId: `${page || "page"}-overview`,
      });
    }

    Array.from(main.querySelectorAll(":scope > .section")).forEach(
      (section) => {
        const sectionHeading = section.querySelector(
          ":scope > .section-head > h2",
        );
        if (sectionHeading) {
          entries.push({
            target: section,
            heading: sectionHeading,
            label: sectionHeading.textContent.trim(),
          });
          return;
        }

        const panelHeadings = Array.from(
          section.querySelectorAll(":scope > .panel > h2"),
        );
        if (panelHeadings.length) {
          panelHeadings.forEach((heading) => {
            entries.push({
              target: heading.closest(".panel"),
              heading,
              label: heading.textContent.trim(),
            });
          });
          return;
        }

        const heading = section.querySelector("h2");
        if (heading) {
          entries.push({
            target: section,
            heading,
            label: heading.textContent.trim(),
          });
        } else if (page === "home") {
          entries.push({
            target: section,
            heading: section,
            label: "Documentation guides",
            preferredId: "documentation-guides",
          });
        }
      },
    );

    if (!entries.length) return;

    const slugify = (value) =>
      value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "section";

    const usedIds = new Set(
      Array.from(document.querySelectorAll("[id]"), (element) => element.id),
    );
    const pageData = entries.map((entry) => {
      let id = entry.target.id;
      if (!id) {
        const base = slugify(entry.preferredId || entry.label);
        id = base;
        let suffix = 2;
        while (usedIds.has(id)) {
          id = `${base}-${suffix}`;
          suffix += 1;
        }
        entry.target.id = id;
        usedIds.add(id);
      }
      entry.target.classList.add("anchor-target");
      return { ...entry, id };
    });

    const contentMain = document.createElement("div");
    contentMain.className = "content-main";
    Array.from(main.childNodes).forEach((node) => contentMain.append(node));

    const toc = document.createElement("aside");
    toc.className = "page-toc";
    toc.setAttribute("aria-labelledby", "guides-index-title");
    toc.innerHTML = `
      <p class="eyebrow">Contents</p>
      <h2 id="guides-index-title">On this page</h2>
      <nav class="page-toc-links" aria-label="Page sections"></nav>
    `;

    const mobileToc = document.createElement("details");
    mobileToc.className = "mobile-toc";
    mobileToc.innerHTML = `
      <summary>On this page <span aria-hidden="true">⌄</span></summary>
      <nav class="mobile-toc-links" aria-label="Page sections on mobile"></nav>
    `;

    const tocLinks = new Map();
    const desktopNav = toc.querySelector(".page-toc-links");
    const mobileNav = mobileToc.querySelector(".mobile-toc-links");
    pageData.forEach(({ id, label }) => {
      const links = [desktopNav, mobileNav].map((container) => {
        const link = document.createElement("a");
        link.className = "page-toc-link";
        link.href = `#${id}`;
        link.textContent = label;
        container.append(link);
        return link;
      });
      tocLinks.set(id, links);
    });

    const headerInContent = contentMain.querySelector(
      ":scope > .page-head, :scope > .hero",
    );
    if (headerInContent) headerInContent.insertAdjacentElement("afterend", mobileToc);
    else contentMain.prepend(mobileToc);

    main.classList.add("has-page-toc");
    main.append(contentMain, toc);

    setActiveGuide = (id) => {
      tocLinks.forEach((links, linkId) => {
        const active = linkId === id;
        links.forEach((link) => {
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    };

    mobileToc.addEventListener("click", (event) => {
      if (event.target.closest("a")) mobileToc.open = false;
    });

    const visibleHeadings = new Set();
    const headingToId = new Map(
      pageData.map(({ heading, target, id }) => [heading || target, id]),
    );
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (observerEntries) => {
          observerEntries.forEach((entry) => {
            if (entry.isIntersecting) visibleHeadings.add(entry.target);
            else visibleHeadings.delete(entry.target);
          });
          const current = Array.from(visibleHeadings).sort(
            (a, b) =>
              Math.abs(a.getBoundingClientRect().top - 100) -
              Math.abs(b.getBoundingClientRect().top - 100),
          )[0];
          if (current) setActiveGuide(headingToId.get(current));
        },
        { rootMargin: "-8% 0px -78%", threshold: 0 },
      );
      headingToId.forEach((_, heading) => observer.observe(heading));
    }

    const initialId = decodeURIComponent(window.location.hash.slice(1));
    if (tocLinks.has(initialId)) {
      setActiveGuide(initialId);
      const initialTarget = pageData.find(({ id }) => id === initialId)?.target;
      if (initialTarget) {
        window.requestAnimationFrame(() => alignAnchorTarget(initialTarget));
      }
    }
  };

  initMobileNavigation();
  initGuidesIndex();
  initPageIndex();

  const initCallouts = () => {
    document.querySelectorAll(".note").forEach((callout) => {
      const text = callout.textContent.toLocaleLowerCase();
      let type = "note";
      if (
        text.includes("not encrypted") ||
        text.includes("replaces the current") ||
        text.includes("make sure")
      ) {
        type = "warning";
      } else if (
        text.includes("ignored") ||
        text.includes("will not overwrite") ||
        text.includes("intentionally")
      ) {
        type = "important";
      } else if (
        text.includes("video demo") ||
        text.includes("resolved through")
      ) {
        type = "tip";
      }

      callout.dataset.callout = type;
      const label = document.createElement("strong");
      label.className = "callout-label";
      label.textContent =
        type === "warning"
          ? "Warning"
          : type === "important"
            ? "Important"
            : type === "tip"
              ? "Tip"
              : "Note";
      callout.prepend(label);
    });
  };

  const initReadingTools = () => {
    const progress = document.createElement("div");
    progress.className = "reading-progress";
    progress.setAttribute("aria-hidden", "true");
    progress.innerHTML = "<span></span>";

    const backToTop = document.createElement("button");
    backToTop.className = "back-to-top";
    backToTop.type = "button";
    backToTop.setAttribute("aria-label", "Back to top");
    backToTop.innerHTML = '<span aria-hidden="true">↑</span>';
    body.append(progress, backToTop);

    let framePending = false;
    const update = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      progress.firstElementChild.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
      backToTop.classList.toggle("is-visible", window.scrollY > 640);
      framePending = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!framePending) {
          framePending = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
    window.addEventListener("resize", update);
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    update();
  };

  initCallouts();
  initReadingTools();

  let stopActiveAnchorSettling = null;
  document
    .querySelectorAll(
      '.card-link[href^="#"], .page-toc-link[href^="#"], .guide-nav-link[href^="#"]',
    )
    .forEach((link) => {
      link.addEventListener("click", (event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        const target = getAnchorTarget(link);
        if (!target) return;

        event.preventDefault();
        stopActiveAnchorSettling?.();
        const hash = link.getAttribute("href");
        if (window.location.hash === hash) {
          window.history.replaceState(null, "", hash);
        } else {
          window.history.pushState(null, "", hash);
        }

        setActiveGuide(target.id);
        alignAnchorTarget(target, "smooth");

        if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
        window.setTimeout(
          () => target.focus({ preventScroll: true }),
          reduceMotion ? 0 : 450,
        );

        const controller = new AbortController();
        const settle = () => alignAnchorTarget(target);
        const pendingImages = Array.from(document.images).filter(
          (image) =>
            !image.complete &&
            Boolean(
              image.compareDocumentPosition(target) &
                Node.DOCUMENT_POSITION_FOLLOWING,
            ),
        );

        pendingImages.forEach((image) => {
          image.addEventListener("load", settle, {
            once: true,
            signal: controller.signal,
          });
          image.addEventListener("error", settle, {
            once: true,
            signal: controller.signal,
          });
        });

        const settleTimers = [450, 900, 1600].map((delay) =>
          window.setTimeout(settle, delay),
        );
        const stopSettling = () => {
          settleTimers.forEach((timer) => window.clearTimeout(timer));
          controller.abort();
          if (stopActiveAnchorSettling === stopSettling) {
            stopActiveAnchorSettling = null;
          }
        };
        stopActiveAnchorSettling = stopSettling;

        ["wheel", "touchstart", "keydown"].forEach((eventName) => {
          window.addEventListener(eventName, stopSettling, {
            once: true,
            passive: true,
            signal: controller.signal,
          });
        });
        window.setTimeout(stopSettling, 1800);
      });
    });

  window.addEventListener("hashchange", () => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) setActiveGuide(id);
  });
})();
