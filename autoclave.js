// Autoclave: 20 of any Surgical Tool exchanges for 1 of every other Surgical
// Tool (confirmed on growtopiawiki.com/w/Autoclave). Surg-E is not a
// "Surgical Tool" so it's excluded, matching the wiki's item category.
const AC_TOOLS = [
  { name: "Surgical Stitches", icon: "assets/items/stitches.png", keepByDefault: true },
  { name: "Surgical Anesthetic", icon: "assets/items/anesthetic.png" },
  { name: "Surgical Antibiotics", icon: "assets/items/antibiotics.png" },
  { name: "Surgical Antiseptic", icon: "assets/items/antiseptic.png" },
  { name: "Surgical Clamp", icon: "assets/items/clamp.png" },
  { name: "Surgical Defibrillator", icon: "assets/items/defibrillator.png" },
  { name: "Surgical Lab Kit", icon: "assets/items/labkit.png" },
  { name: "Surgical Pins", icon: "assets/items/pins.png" },
  { name: "Surgical Scalpel", icon: "assets/items/scalpel.png" },
  { name: "Surgical Splint", icon: "assets/items/splint.png" },
  { name: "Surgical Sponge", icon: "assets/items/sponge.png" },
  { name: "Surgical Transfusion", icon: "assets/items/transfusion.png" },
  { name: "Surgical Ultrasound", icon: "assets/items/ultrasound.png" },
];
const AC_BATCH = 20;

const acStartToolEl = document.getElementById("acStartTool");
const acAmountEl = document.getElementById("acAmount");
const acCyclesEl = document.getElementById("acCycles");
const acStitchesEl = document.getElementById("acStitches");
const acGridEl = document.getElementById("acGrid");

// which tools get fed back into the autoclave vs kept aside
const acFeed = {};
AC_TOOLS.forEach((t) => { acFeed[t.name] = !t.keepByDefault; });

AC_TOOLS.forEach((t) => {
  const opt = document.createElement("option");
  opt.value = t.name;
  opt.textContent = t.name;
  acStartToolEl.appendChild(opt);
});
acStartToolEl.value = "Surgical Antibiotics";

function acRenderGrid() {
  acGridEl.innerHTML = "";
  AC_TOOLS.forEach((t) => {
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div class="item-head">
        <img class="item-icon" src="${t.icon}" alt="" />
        <span class="item-name-static">${t.name}</span>
      </div>
      <div class="item-body">
        <div class="total" data-ac-total="${t.name}">total: 0</div>
        <label class="ac-feed-label">
          <input type="checkbox" class="ac-feed" data-tool="${t.name}" ${acFeed[t.name] ? "checked" : ""} ${t.name === "Surgical Stitches" ? "disabled" : ""} />
          Feed into autoclave
        </label>
      </div>
    `;
    acGridEl.appendChild(el);
  });

  acGridEl.querySelectorAll(".ac-feed").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      acFeed[e.target.dataset.tool] = e.target.checked;
      acCompute();
    });
  });
}

// repeatedly convert batches of 20 from any "feed" tool into 1 of every other tool
function acRun(inventory) {
  let cycles = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (const tool of AC_TOOLS) {
      if (!acFeed[tool.name]) continue;
      const batches = Math.floor(inventory[tool.name] / AC_BATCH);
      if (batches <= 0) continue;
      inventory[tool.name] -= batches * AC_BATCH;
      AC_TOOLS.forEach((other) => {
        if (other.name !== tool.name) inventory[other.name] += batches;
      });
      cycles += batches;
      changed = true;
    }
  }
  return cycles;
}

function acCompute() {
  const inventory = {};
  AC_TOOLS.forEach((t) => { inventory[t.name] = 0; });
  inventory[acStartToolEl.value] = Math.max(0, Math.floor(Number(acAmountEl.value) || 0));

  const cycles = acRun(inventory);

  acCyclesEl.textContent = cycles.toLocaleString("en-US");
  acStitchesEl.textContent = inventory["Surgical Stitches"].toLocaleString("en-US");

  AC_TOOLS.forEach((t) => {
    const el = acGridEl.querySelector(`[data-ac-total="${t.name}"]`);
    if (el) el.textContent = `total: ${inventory[t.name].toLocaleString("en-US")}`;
  });
}

acStartToolEl.addEventListener("change", acCompute);
acAmountEl.addEventListener("input", acCompute);

acRenderGrid();
acCompute();
