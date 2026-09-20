// Average Surgical Tool usage per operation, derived from GrowClass's
// Discord "Doctor Surgery Calculator" (200-operation sample). Real usage
// per operation is random — this is an average-case estimate, not a guarantee.
const SURGERY_TOOLS = [
  { name: "Surgical Stitches", icon: "assets/items/stitches.png", rate: 2.351 },
  { name: "Surgical Scalpels", icon: "assets/items/scalpel.png", rate: 1.706 },
  { name: "Surgical Sponges", icon: "assets/items/sponge.png", rate: 1.518 },
  { name: "Surgical Antibiotics", icon: "assets/items/antibiotics.png", rate: 1.598 },
  { name: "Surgical Anesthetic", icon: "assets/items/anesthetic.png", rate: 1.021 },
  { name: "Surgical Ultrasounds", icon: "assets/items/ultrasound.png", rate: 0.788 },
  { name: "Surgical Splints", icon: "assets/items/splint.png", rate: 0.712 },
  { name: "Surgical Lab Kits", icon: "assets/items/labkit.png", rate: 0.582 },
  { name: "Surgical Defibrillators", icon: "assets/items/defibrillator.png", rate: 0.375 },
  { name: "Surgical Transfusions", icon: "assets/items/transfusion.png", rate: 0.309 },
  { name: "Surgical Pins", icon: "assets/items/pins.png", rate: 0.302 },
  { name: "Surgical Antiseptics", icon: "assets/items/antiseptic.png", rate: 0.079 },
  { name: "Surgical Clamps", icon: "assets/items/clamp.png", rate: 0.05 },
];

const surgOpsEl = document.getElementById("surgOps");
const surgTableBody = document.querySelector("#surgTable tbody");

function surgRenderTable() {
  surgTableBody.innerHTML = "";
  SURGERY_TOOLS.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img class="table-icon" src="${t.icon}" alt="" /></td>
      <td>${t.name}</td>
      <td>${t.rate}</td>
      <td class="table-after" data-surg-qty="${t.name}">0</td>
    `;
    surgTableBody.appendChild(tr);
  });
}

function surgCompute() {
  const ops = Math.max(0, Number(surgOpsEl.value) || 0);
  SURGERY_TOOLS.forEach((t) => {
    const qty = Math.round(t.rate * ops);
    const el = surgTableBody.querySelector(`[data-surg-qty="${t.name}"]`);
    if (el) el.textContent = qty.toLocaleString("en-US");
  });
}

surgOpsEl.addEventListener("input", surgCompute);

surgRenderTable();
surgCompute();
