// Star Tool Nanoforge: 20 of any Star Tool exchanges for 1 of every other
// Star Tool (growtopiawiki.com/w/Star_Tool_Nanoforge). Star Fuel isn't a
// Star Tool itself, so it's excluded from the exchange pool.
const NF_TOOLS = [
  { name: "Tactical Drone", icon: "assets/items/tacticaldrone.png" },
  { name: "Teleporter Charge", icon: "assets/items/teleportercharge.png" },
  { name: "AI Brain", icon: "assets/items/aibrain.png" },
  { name: "Cyborg Diplomat", icon: "assets/items/cyborgdiplomat.png" },
  { name: "Galactibolt", icon: "assets/items/galactibolt.png" },
  { name: "Gigablaster", icon: "assets/items/gigablaster.png" },
  { name: "Growton Torpedo", icon: "assets/items/growtontorpedo.png" },
  { name: "HyperShields", icon: "assets/items/hypershields.png" },
  { name: "Quadriscanner", icon: "assets/items/quadriscanner.png" },
  { name: "Space Meds", icon: "assets/items/spacemeds.png" },
  { name: "Star Supplies", icon: "assets/items/starsupplies.png" },
  { name: "Stellar Documents", icon: "assets/items/stellardocuments.png" },
];
const NF_BATCH = 20;
const NF_PER_PACK = 5; // Galactic Goodies gives 5 of each of these 12 tools
const NF_GOALS = ["Tactical Drone", "Teleporter Charge"]; // the point of nanoforging — always kept, never fed back in

const nfHave = {};
const nfFeed = {};
NF_TOOLS.forEach((t) => { nfHave[t.name] = 0; nfFeed[t.name] = !NF_GOALS.includes(t.name); });

const nfGoalRates = {};
NF_GOALS.forEach((name) => { nfGoalRates[name] = { n: 0, mode: "item_per_wl" }; });

const nfTableBody = document.querySelector("#nfTable tbody");
const nfPayoutBody = document.querySelector("#nfPayoutTable tbody");
const nfCyclesEl = document.getElementById("nfCycles");
const nfTotalValueEl = document.getElementById("nfTotalValue");
const nfTotalValueLocklineEl = document.getElementById("nfTotalValueLockline");
const nfModeManualBtn = document.getElementById("nfModeManual");
const nfModePackBtn = document.getElementById("nfModePack");
const nfPackFieldEl = document.getElementById("nfPackField");
const nfPacksEl = document.getElementById("nfPacks");

function nfSetMode(mode) {
  nfModeManualBtn.classList.toggle("active", mode === "manual");
  nfModePackBtn.classList.toggle("active", mode === "pack");
  nfPackFieldEl.hidden = mode !== "pack";
  // switching modes just reveals the packs field — it only overwrites
  // "Have" once you actually type a pack count, so nothing you've
  // already entered gets wiped out by clicking the toggle.
}
nfModeManualBtn.addEventListener("click", () => nfSetMode("manual"));
nfModePackBtn.addEventListener("click", () => nfSetMode("pack"));

function nfApplyPacks() {
  const packs = Math.max(0, Math.floor(Number(nfPacksEl.value) || 0));
  NF_TOOLS.forEach((t) => {
    nfHave[t.name] = packs * NF_PER_PACK;
    const inp = nfTableBody.querySelector(`.nf-have[data-tool="${t.name}"]`);
    if (inp) inp.value = nfHave[t.name];
  });
  nfCompute();
}
nfPacksEl.addEventListener("input", nfApplyPacks);

function nfRenderTable() {
  nfTableBody.innerHTML = "";
  NF_TOOLS.forEach((t) => {
    const isGoal = NF_GOALS.includes(t.name);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img class="table-icon" src="${t.icon}" alt="" /></td>
      <td>${t.name}${isGoal ? ' <span class="goal-tag">goal</span>' : ""}</td>
      <td><input type="number" min="0" class="nf-have" data-tool="${t.name}" value="0" /></td>
      <td><input type="checkbox" class="nf-feed" data-tool="${t.name}" ${nfFeed[t.name] ? "checked" : ""} ${isGoal ? "disabled" : ""} /></td>
      <td class="table-after" data-nf-after="${t.name}">0</td>
    `;
    nfTableBody.appendChild(tr);
  });

  nfTableBody.querySelectorAll(".nf-have").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      nfHave[e.target.dataset.tool] = Number(e.target.value) || 0;
      nfCompute();
    });
  });
  nfTableBody.querySelectorAll(".nf-feed").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      nfFeed[e.target.dataset.tool] = e.target.checked;
      nfCompute();
    });
  });
}

function nfRenderPayout() {
  nfPayoutBody.innerHTML = "";
  NF_GOALS.forEach((name) => {
    const tool = NF_TOOLS.find((t) => t.name === name);
    const rate = nfGoalRates[name];
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
    nfPayoutBody.appendChild(tr);
  });

  nfPayoutBody.querySelectorAll(".payout-rate-n").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      nfGoalRates[e.target.dataset.name].n = Number(e.target.value) || 0;
      nfCompute();
    });
  });
  nfPayoutBody.querySelectorAll(".payout-rate-mode").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const isWlMode = e.target.checked;
      nfGoalRates[e.target.dataset.name].mode = isWlMode ? "wl_per_item" : "item_per_wl";
      const units = e.target.closest(".raterow").querySelectorAll(".unit");
      units[0].textContent = `1 ${isWlMode ? "item" : "wl"} =`;
      units[1].textContent = isWlMode ? "wl" : "item";
      nfCompute();
    });
  });
}

function nfRun(inventory) {
  let cycles = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (const tool of NF_TOOLS) {
      if (!nfFeed[tool.name]) continue;
      const batches = Math.floor(inventory[tool.name] / NF_BATCH);
      if (batches <= 0) continue;
      inventory[tool.name] -= batches * NF_BATCH;
      NF_TOOLS.forEach((other) => {
        if (other.name !== tool.name) inventory[other.name] += batches;
      });
      cycles += batches;
      changed = true;
    }
  }
  return cycles;
}

function nfCompute() {
  const inventory = {};
  NF_TOOLS.forEach((t) => { inventory[t.name] = Number(nfHave[t.name]) || 0; });

  const cycles = nfRun(inventory);
  nfCyclesEl.textContent = cycles.toLocaleString("en-US");

  NF_TOOLS.forEach((t) => {
    const el = nfTableBody.querySelector(`[data-nf-after="${t.name}"]`);
    if (el) el.textContent = inventory[t.name].toLocaleString("en-US");
  });

  let totalValue = 0;
  NF_GOALS.forEach((name) => {
    const qty = inventory[name] || 0;
    const value = qty * pricePerItem(nfGoalRates[name]);
    totalValue += value;
    const afterEl = nfPayoutBody.querySelector(`[data-payout-after="${name}"]`);
    if (afterEl) afterEl.textContent = qty.toLocaleString("en-US");
    const valueEl = nfPayoutBody.querySelector(`[data-payout-value="${name}"]`);
    if (valueEl) valueEl.textContent = value.toLocaleString("en-US") + " WL";
  });

  nfTotalValueEl.textContent = totalValue.toLocaleString("en-US") + " WL";
  nfTotalValueLocklineEl.innerHTML = formatLocks(totalValue);
}

nfRenderTable();
nfRenderPayout();
nfCompute();
