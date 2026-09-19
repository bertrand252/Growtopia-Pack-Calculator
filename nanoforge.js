// Star Tool Nanoforge: 20 of any Star Tool exchanges for 1 of every other
// Star Tool (growtopiawiki.com/w/Star_Tool_Nanoforge). Star Fuel isn't a
// Star Tool itself, so it's excluded from the exchange pool.
const NF_TOOLS = [
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
  { name: "Tactical Drone", icon: "assets/items/tacticaldrone.png" },
  { name: "Teleporter Charge", icon: "assets/items/teleportercharge.png" },
];
const NF_BATCH = 20;

const nfStartToolEl = document.getElementById("nfStartTool");
const nfAmountEl = document.getElementById("nfAmount");
const nfCyclesEl = document.getElementById("nfCycles");
const nfGridEl = document.getElementById("nfGrid");

const nfFeed = {};
NF_TOOLS.forEach((t) => { nfFeed[t.name] = true; });

NF_TOOLS.forEach((t) => {
  const opt = document.createElement("option");
  opt.value = t.name;
  opt.textContent = t.name;
  nfStartToolEl.appendChild(opt);
});

function nfRenderGrid() {
  nfGridEl.innerHTML = "";
  NF_TOOLS.forEach((t) => {
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div class="item-head">
        <img class="item-icon" src="${t.icon}" alt="" />
        <span class="item-name-static">${t.name}</span>
      </div>
      <div class="item-body">
        <div class="total" data-nf-total="${t.name}">total: 0</div>
        <label class="ac-feed-label">
          <input type="checkbox" class="nf-feed" data-tool="${t.name}" checked />
          Feed into nanoforge
        </label>
      </div>
    `;
    nfGridEl.appendChild(el);
  });

  nfGridEl.querySelectorAll(".nf-feed").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      nfFeed[e.target.dataset.tool] = e.target.checked;
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
  NF_TOOLS.forEach((t) => { inventory[t.name] = 0; });
  inventory[nfStartToolEl.value] = Math.max(0, Math.floor(Number(nfAmountEl.value) || 0));

  const cycles = nfRun(inventory);
  nfCyclesEl.textContent = cycles.toLocaleString("en-US");

  NF_TOOLS.forEach((t) => {
    const el = nfGridEl.querySelector(`[data-nf-total="${t.name}"]`);
    if (el) el.textContent = `total: ${inventory[t.name].toLocaleString("en-US")}`;
  });
}

nfStartToolEl.addEventListener("change", nfCompute);
nfAmountEl.addEventListener("input", nfCompute);

nfRenderGrid();
nfCompute();
