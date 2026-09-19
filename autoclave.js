// Autoclave: 20 of any Surgical Tool exchanges for 1 of every other Surgical
// Tool (confirmed on growtopiawiki.com/w/Autoclave). Surg-E is not a
// "Surgical Tool" so it's excluded, matching the wiki's item category.
const AC_TOOLS = [
  { name: "Surgical Stitches", icon: "assets/items/stitches.png" },
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
const AC_PER_PACK = 20; // Master Surgeon's Tool Bag gives 20 of each of these 13 tools
const AC_GOALS = ["Surgical Stitches"]; // the point of autoclaving — always kept, never fed back in

const acHave = {};
const acFeed = {};
AC_TOOLS.forEach((t) => { acHave[t.name] = 0; acFeed[t.name] = !AC_GOALS.includes(t.name); });

// resale rate per goal item, same { n, mode } shape as the Pack Calculator
const acGoalRates = {};
AC_GOALS.forEach((name) => { acGoalRates[name] = { n: 0, mode: "item_per_wl" }; });

const acTableBody = document.querySelector("#acTable tbody");
const acPayoutBody = document.querySelector("#acPayoutTable tbody");
const acCyclesEl = document.getElementById("acCycles");
const acTotalValueEl = document.getElementById("acTotalValue");
const acTotalValueLocklineEl = document.getElementById("acTotalValueLockline");
const acModeManualBtn = document.getElementById("acModeManual");
const acModePackBtn = document.getElementById("acModePack");
const acPackFieldEl = document.getElementById("acPackField");
const acPacksEl = document.getElementById("acPacks");

function acSetMode(mode) {
  acModeManualBtn.classList.toggle("active", mode === "manual");
  acModePackBtn.classList.toggle("active", mode === "pack");
  acPackFieldEl.hidden = mode !== "pack";
  // switching modes just reveals the packs field — it only overwrites
  // "Have" once you actually type a pack count, so nothing you've
  // already entered gets wiped out by clicking the toggle.
}
acModeManualBtn.addEventListener("click", () => acSetMode("manual"));
acModePackBtn.addEventListener("click", () => acSetMode("pack"));

function acApplyPacks() {
  const packs = Math.max(0, Math.floor(Number(acPacksEl.value) || 0));
  AC_TOOLS.forEach((t) => {
    acHave[t.name] = packs * AC_PER_PACK;
    const inp = acTableBody.querySelector(`.ac-have[data-tool="${t.name}"]`);
    if (inp) inp.value = acHave[t.name];
  });
  acCompute();
}
acPacksEl.addEventListener("input", acApplyPacks);

function acRenderTable() {
  acTableBody.innerHTML = "";
  AC_TOOLS.forEach((t) => {
    const isGoal = AC_GOALS.includes(t.name);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img class="table-icon" src="${t.icon}" alt="" /></td>
      <td>${t.name}${isGoal ? ' <span class="goal-tag">goal</span>' : ""}</td>
      <td><input type="number" min="0" class="ac-have" data-tool="${t.name}" value="0" /></td>
      <td><input type="checkbox" class="ac-feed" data-tool="${t.name}" ${acFeed[t.name] ? "checked" : ""} ${isGoal ? "disabled" : ""} /></td>
      <td class="table-after" data-ac-after="${t.name}">0</td>
    `;
    acTableBody.appendChild(tr);
  });

  acTableBody.querySelectorAll(".ac-have").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      acHave[e.target.dataset.tool] = Number(e.target.value) || 0;
      acCompute();
    });
  });
  acTableBody.querySelectorAll(".ac-feed").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      acFeed[e.target.dataset.tool] = e.target.checked;
      acCompute();
    });
  });
}

function acRenderPayout() {
  acPayoutBody.innerHTML = "";
  AC_GOALS.forEach((name) => {
    const tool = AC_TOOLS.find((t) => t.name === name);
    const rate = acGoalRates[name];
    const isWlMode = rate.mode === "wl_per_item";
    const leftUnit = isWlMode ? "item" : "wl";
    const rightUnit = isWlMode ? "wl" : "item";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img class="table-icon" src="${tool.icon}" alt="" /></td>
      <td>${name}</td>
      <td class="table-after" data-payout-after="${name}">0</td>
      <td>
        <div class="raterow">
          <span class="unit">1 ${leftUnit} =</span>
          <input type="number" min="0" class="payout-rate-n" data-name="${name}" value="${rate.n}" />
          <span class="unit">${rightUnit}</span>
          <label class="switch">
            <input type="checkbox" class="payout-rate-mode" data-name="${name}" ${isWlMode ? "checked" : ""} />
            <span class="slider"></span>
          </label>
        </div>
      </td>
      <td class="table-after" data-payout-value="${name}">0 WL</td>
    `;
    acPayoutBody.appendChild(tr);
  });

  acPayoutBody.querySelectorAll(".payout-rate-n").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      acGoalRates[e.target.dataset.name].n = Number(e.target.value) || 0;
      acCompute();
    });
  });
  acPayoutBody.querySelectorAll(".payout-rate-mode").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const isWlMode = e.target.checked;
      acGoalRates[e.target.dataset.name].mode = isWlMode ? "wl_per_item" : "item_per_wl";
      const units = e.target.closest(".raterow").querySelectorAll(".unit");
      units[0].textContent = `1 ${isWlMode ? "item" : "wl"} =`;
      units[1].textContent = isWlMode ? "wl" : "item";
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
  AC_TOOLS.forEach((t) => { inventory[t.name] = Number(acHave[t.name]) || 0; });

  const cycles = acRun(inventory);
  acCyclesEl.textContent = cycles.toLocaleString("en-US");

  AC_TOOLS.forEach((t) => {
    const el = acTableBody.querySelector(`[data-ac-after="${t.name}"]`);
    if (el) el.textContent = inventory[t.name].toLocaleString("en-US");
  });

  let totalValue = 0;
  AC_GOALS.forEach((name) => {
    const qty = inventory[name] || 0;
    const value = qty * pricePerItem(acGoalRates[name]);
    totalValue += value;
    const afterEl = acPayoutBody.querySelector(`[data-payout-after="${name}"]`);
    if (afterEl) afterEl.textContent = qty.toLocaleString("en-US");
    const valueEl = acPayoutBody.querySelector(`[data-payout-value="${name}"]`);
    if (valueEl) valueEl.textContent = value.toLocaleString("en-US") + " WL";
  });

  acTotalValueEl.textContent = totalValue.toLocaleString("en-US") + " WL";
  acTotalValueLocklineEl.innerHTML = formatLocks(totalValue);
}

acRenderTable();
acRenderPayout();
acCompute();
