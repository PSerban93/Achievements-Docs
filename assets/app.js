(() => {
  const body = document.body;
  const page = body?.dataset?.page || "";
  const nav = document.querySelector("[data-nav]");

  if (nav && page) {
    const active = nav.querySelector(`[data-nav-id="${page}"]`);
    if (active) active.classList.add("is-active");
  }
})();
