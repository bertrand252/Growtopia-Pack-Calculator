// sidebar: switch between tool views, collapse on mobile
const navItems = document.querySelectorAll(".nav-item");
const toolViews = document.querySelectorAll(".tool-view");
const sidebarEl = document.getElementById("sidebar");
const sidebarToggleEl = document.getElementById("sidebarToggle");

navItems.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tool = btn.dataset.tool;
    navItems.forEach((b) => b.classList.toggle("active", b === btn));
    toolViews.forEach((v) => { v.hidden = v.id !== `tool-${tool}`; });
    sidebarEl.classList.remove("open");
  });
});

sidebarToggleEl.addEventListener("click", () => {
  sidebarEl.classList.toggle("open");
});
