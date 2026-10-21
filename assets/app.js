(() => {
  const body = document.body;
  const page = body?.dataset?.page || "";
  const nav = document.querySelector("[data-nav]");

  if (nav && page) {
    const active = nav.querySelector(`[data-nav-id="${page}"]`);
    if (active) active.classList.add("is-active");
  }

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
    target.scrollIntoView({ behavior, block: "start" });
  };

  let stopActiveAnchorSettling = null;
  document
    .querySelectorAll('.card-link[href^="#"]')
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

        alignAnchorTarget(target, "smooth");

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
})();
