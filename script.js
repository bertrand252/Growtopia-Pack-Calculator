// pack contents sourced from growtopiawiki.com: Master Surgeon's Tool Bag (msurg),
// Crime Wave pack (crime), Galactic Goodies (gala)
const PACKS = {
  msurg: {
    label: "Master Surgeon's Tool Bag",
    icon: "assets/items/msurg-pack.png",
    items: [
      { name: "Surg-E", qty: 5, icon: "assets/items/surge.png" },
      { name: "Surgical Anesthetic", qty: 20, icon: "assets/items/anesthetic.png" },
      { name: "Surgical Antibiotics", qty: 20, icon: "assets/items/antibiotics.png" },
      { name: "Surgical Antiseptic", qty: 20, icon: "assets/items/antiseptic.png" },
      { name: "Surgical Clamp", qty: 20, icon: "assets/items/clamp.png" },
      { name: "Surgical Defibrillator", qty: 20, icon: "assets/items/defibrillator.png" },
      { name: "Surgical Lab Kit", qty: 20, icon: "assets/items/labkit.png" },
      { name: "Surgical Pins", qty: 20, icon: "assets/items/pins.png" },
      { name: "Surgical Scalpel", qty: 20, icon: "assets/items/scalpel.png" },
      { name: "Surgical Splint", qty: 20, icon: "assets/items/splint.png" },
      { name: "Surgical Sponge", qty: 20, icon: "assets/items/sponge.png" },
      { name: "Surgical Stitches", qty: 20, icon: "assets/items/stitches.png" },
      { name: "Surgical Transfusion", qty: 20, icon: "assets/items/transfusion.png" },
      { name: "Surgical Ultrasound", qty: 20, icon: "assets/items/ultrasound.png" },
    ],
    locked: true,
  },
  crime: {
    label: "Crime Wave",
    icon: "assets/items/crimewave.png",
    items: [
      { name: "Crime Wave", qty: 1, icon: "assets/items/crimewave.png" },
    ],
    locked: true,
    cardsPerPack: 25, // 5 random Superpower Cards x5 per pack, entered manually below
  },
  gala: {
    label: "Galactic Goodies",
    icon: "assets/items/aibrain.png",
    items: [
      { name: "AI Brain", qty: 5, icon: "assets/items/aibrain.png" },
      { name: "Cyborg Diplomat", qty: 5, icon: "assets/items/cyborgdiplomat.png" },
      { name: "Galactibolt", qty: 5, icon: "assets/items/galactibolt.png" },
      { name: "Gigablaster", qty: 5, icon: "assets/items/gigablaster.png" },
      { name: "Growton Torpedo", qty: 5, icon: "assets/items/growtontorpedo.png" },
      { name: "HyperShields", qty: 5, icon: "assets/items/hypershields.png" },
      { name: "Quadriscanner", qty: 5, icon: "assets/items/quadriscanner.png" },
      { name: "Space Meds", qty: 5, icon: "assets/items/spacemeds.png" },
      { name: "Star Fuel", qty: 25, icon: "assets/items/starfuel.png" },
      { name: "Star Supplies", qty: 5, icon: "assets/items/starsupplies.png" },
      { name: "Stellar Documents", qty: 5, icon: "assets/items/stellardocuments.png" },
      { name: "Tactical Drone", qty: 5, icon: "assets/items/tacticaldrone.png" },
      { name: "Teleporter Charge", qty: 5, icon: "assets/items/teleportercharge.png" },
    ],
    locked: true,
  },
};

let activePack = "msurg";
// per-item resale rate, kept per pack so it survives tab switches
// rate = { n, mode } -> mode "item_per_wl": 1 wl = n item | mode "wl_per_item": 1 item = n wl
const sellRates = { msurg: {}, crime: {}, gala: {} };

const tabsEl = document.getElementById("tabs");
const gridEl = document.getElementById("itemGrid");
const priceWlEl = document.getElementById("priceWl");
const qtyPackEl = document.getElementById("qtyPack");
const cardDeckSection = document.getElementById("cardDeckSection");
const cardCategoriesEl = document.getElementById("cardCategories");
const cardCheckStatus = document.getElementById("cardCheckStatus");

// 20 possible Superpower Cards (data: growtopia-tools.vercel.app/Crime).
// Each pack gives 5 random ones from here, 5 copies each = 25 cards.
const CARD_CATALOG = {
  Fire: [
    { name: "Heat Vision", icon: "assets/items/cards/heat_vision.png" },
    { name: "Incinerate", icon: "assets/items/cards/incinerate.png" },
    { name: "Flame On!", icon: "assets/items/cards/flame_on.png" },
    { name: "Liquify", icon: "assets/items/cards/liquify.png" },
    { name: "Overheat", icon: "assets/items/cards/overheat.png" },
  ],
  Ice: [
    { name: "Ice Shards", icon: "assets/items/cards/ice_shards.png" },
    { name: "Frost Breath", icon: "assets/items/cards/frost_breath.png" },
    { name: "Ice Barrier", icon: "assets/items/cards/ice_barrier.png" },
    { name: "Puddle", icon: "assets/items/cards/puddle.png" },
    { name: "Frozen Mirror", icon: "assets/items/cards/frozen_mirror.png" },
  ],
  Muscle: [
    { name: "Super Strength", icon: "assets/items/cards/super_strength.png" },
    { name: "Super Speed", icon: "assets/items/cards/super_speed.png" },
    { name: "Enrage", icon: "assets/items/cards/enrage.png" },
    { name: "Crush", icon: "assets/items/cards/crush.png" },
    { name: "Regeneration", icon: "assets/items/cards/regeneration.png" },
  ],
  Lightning: [
    { name: "Shocking Fist", icon: "assets/items/cards/shocking_fist.png" },
    { name: "Thunderstorm", icon: "assets/items/cards/thunderstorm.png" },
    { name: "Overcharge", icon: "assets/items/cards/overcharge.png" },
    { name: "Megawatt Pulse", icon: "assets/items/cards/megawatt_pulse.png" },
    { name: "Resuscitate", icon: "assets/items/cards/resuscitate.png" },
  ],
};

// manual entry per card (qty received + resale rate), keyed by card name
const cardQty = {};
const cardRate = {};
Object.values(CARD_CATALOG).flat().forEach((c) => {
  cardQty[c.name] = 0;
  cardRate[c.name] = { n: 0, mode: "item_per_wl" };
});

const LOCK_ICON = { bgl: "assets/locks/bgl.png", dl: "assets/locks/dl.png", wl: "assets/locks/wl.png" };

function formatLocks(totalWl) {
  totalWl = Math.max(0, Math.round(totalWl));
  const bgl = Math.floor(totalWl / 10000);
  const dl = Math.floor((totalWl % 10000) / 100);
  const wl = totalWl % 100;
  const parts = [];
  if (bgl > 0) parts.push(`<span class="badge"><img class="lock-icon" src="${LOCK_ICON.bgl}" alt="BGL" />${bgl} BGL</span>`);
  if (dl > 0) parts.push(`<span class="badge"><img class="lock-icon" src="${LOCK_ICON.dl}" alt="DL" />${dl} DL</span>`);
  parts.push(`<span class="badge"><img class="lock-icon" src="${LOCK_ICON.wl}" alt="WL" />${wl} WL</span>`);
  return parts.join(" ");
}

// price per 1 item in WL, derived from rate n + mode
function pricePerItem(rate) {
  if (!rate) return 0;
  const n = Number(rate.n) || 0;
  if (rate.mode === "wl_per_item") return n; // 1 item = n wl
  return n > 0 ? 1 / n : 0; // 1 wl = n item
}

function renderTabs() {
  tabsEl.innerHTML = "";
  Object.keys(PACKS).forEach((key) => {
    const pack = PACKS[key];
    const btn = document.createElement("div");
    btn.className = "tab" + (key === activePack ? " active" : "");
    btn.innerHTML = `<img class="tab-icon" src="${pack.icon}" alt="" /><span>${pack.label}</span>`;
    btn.onclick = () => { activePack = key; renderTabs(); renderGrid(); };
    tabsEl.appendChild(btn);
  });
}

function renderCardRows() {
  const qtyPack = Number(qtyPackEl.value) || 0;

  cardCategoriesEl.innerHTML = "";
  Object.keys(CARD_CATALOG).forEach((category) => {
    const section = document.createElement("div");
    section.className = "section";
    section.innerHTML = `<h3 class="section-title">${category}</h3><div class="cards-grid"></div>`;
    const grid = section.querySelector(".cards-grid");

    CARD_CATALOG[category].forEach((card) => {
      const qty = cardQty[card.name];
      const rate = cardRate[card.name];
      const isWlMode = rate.mode === "wl_per_item";
      const leftUnit = isWlMode ? "item" : "wl";
      const rightUnit = isWlMode ? "wl" : "item";
      const totalQty = qty * qtyPack;
      const el = document.createElement("div");
      el.className = "item-card";
      el.innerHTML = `
        <div class="item-head">
          <img class="item-icon" src="${card.icon}" alt="" />
          <div class="item-info">
            <div class="item-name-static">${card.name}</div>
            <p class="item-total" data-card-total="${card.name}">${totalQty.toLocaleString("en-US")} total</p>
          </div>
        </div>
        <div class="item-body">
          <label class="item-label">Qty received (per pack)</label>
          <input type="number" min="0" class="card-qty" data-card="${card.name}" value="${qty}" />
          <div class="raterow">
            <span class="unit">1 ${leftUnit} =</span>
            <input type="number" min="0" class="card-rate-n" data-card="${card.name}" value="${rate.n}" />
            <span class="unit">${rightUnit}</span>
          </div>
          <label class="switch">
            <input type="checkbox" class="card-rate-mode" data-card="${card.name}" ${isWlMode ? "checked" : ""} />
            <span class="slider"></span>
          </label>
        </div>
      `;
      grid.appendChild(el);
    });

    cardCategoriesEl.appendChild(section);
  });

  cardCategoriesEl.querySelectorAll(".card-qty").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      cardQty[e.target.dataset.card] = Number(e.target.value) || 0;
      compute();
      updateCardCheckStatus();
    });
  });
  cardCategoriesEl.querySelectorAll(".card-rate-n").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      cardRate[e.target.dataset.card].n = Number(e.target.value) || 0;
      compute();
    });
  });
  cardCategoriesEl.querySelectorAll(".card-rate-mode").forEach((inp) => {
    inp.addEventListener("change", (e) => {
      const isWlMode = e.target.checked;
      cardRate[e.target.dataset.card].mode = isWlMode ? "wl_per_item" : "item_per_wl";
      const units = e.target.closest(".item-body").querySelectorAll(".unit");
      units[0].textContent = `1 ${isWlMode ? "item" : "wl"} =`;
      units[1].textContent = isWlMode ? "wl" : "item";
      compute();
    });
  });

  updateCardCheckStatus();
}

function updateCardCheckStatus() {
  const total = Object.values(cardQty).reduce((sum, q) => sum + (Number(q) || 0), 0);
  const target = PACKS.crime.cardsPerPack;
  cardCheckStatus.textContent = total === target ? `✓ ${total}/${target} cards` : `⚠ ${total}/${target} cards — recheck`;
  cardCheckStatus.className = "card-check " + (total === target ? "ok" : "bad");
}

function renderGrid() {
  const pack = PACKS[activePack];
  cardDeckSection.hidden = activePack !== "crime";
  if (activePack === "crime") renderCardRows();
  gridEl.innerHTML = "";
  pack.items.forEach((item, idx) => {
    const el = document.createElement("div");
    el.className = "item";
    const rateKey = item.name + "#" + idx;
    const rate = sellRates[activePack][rateKey] || { n: 0, mode: "item_per_wl" };
    const isWlMode = rate.mode === "wl_per_item";
    // item_per_wl: "1 wl = [n] item" | wl_per_item: "1 item = [n] wl"
    const leftUnit = isWlMode ? "item" : "wl";
    const rightUnit = isWlMode ? "wl" : "item";
    const iconHtml = item.icon
      ? `<img class="item-icon" src="${item.icon}" alt="" />`
      : `<div class="item-icon placeholder">🧰</div>`;
    el.innerHTML = `
      <div class="item-head">
        ${iconHtml}
        <input class="item-name" value="${item.name}" ${pack.locked ? "readonly" : ""} data-idx="${idx}" />
      </div>
      <div class="item-body">
        <div class="raterow">
          <span class="unit">1 ${leftUnit} =</span>
          <input type="number" min="0" class="rate-n" data-idx="${idx}" value="${rate.n}" />
          <span class="unit">${rightUnit}</span>
        </div>
        <div class="switchwrap">
          <span class="${!isWlMode ? "active" : ""}">item/wl</span>
          <label class="switch">
            <input type="checkbox" class="rate-mode" data-idx="${idx}" ${isWlMode ? "checked" : ""} />
            <span class="slider"></span>
          </label>
          <span class="${isWlMode ? "active" : ""}">wl/item</span>
        </div>
        <div class="total" data-total-idx="${idx}">total: 0</div>
      </div>
    `;
    gridEl.appendChild(el);
  });

  gridEl.querySelectorAll(".item-name").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      PACKS[activePack].items[e.target.dataset.idx].name = e.target.value;
    });
  });
  function getOrCreateRate(idx) {
    const item = PACKS[activePack].items[idx];
    const key = item.name + "#" + idx;
    if (!sellRates[activePack][key]) sellRates[activePack][key] = { n: 0, mode: "item_per_wl" };
    return sellRates[activePack][key];
  }

  gridEl.querySelectorAll(".rate-n").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      getOrCreateRate(e.target.dataset.idx).n = Number(e.target.value) || 0;
      compute();
    });
  });
  gridEl.querySelectorAll(".rate-mode").forEach((inp) => {
    inp.addEventListener("change", (e) => {
      const isWlMode = e.target.checked;
      getOrCreateRate(e.target.dataset.idx).mode = isWlMode ? "wl_per_item" : "item_per_wl";
      const body = e.target.closest(".item-body");
      const units = body.querySelectorAll(".raterow .unit");
      units[0].textContent = `1 ${isWlMode ? "item" : "wl"} =`;
      units[1].textContent = isWlMode ? "wl" : "item";
      const labels = body.querySelectorAll(".switchwrap span");
      labels[0].classList.toggle("active", !isWlMode);
      labels[1].classList.toggle("active", isWlMode);
      compute();
    });
  });

  compute();
}

function compute() {
  const pack = PACKS[activePack];
  const priceWl = Number(priceWlEl.value) || 0;
  const qtyPack = Number(qtyPackEl.value) || 0;
  const totalModal = priceWl * qtyPack;

  document.getElementById("priceLockline").innerHTML = formatLocks(priceWl);
  document.getElementById("totalModal").textContent = totalModal.toLocaleString("en-US") + " WL";
  document.getElementById("totalModalLockline").innerHTML = formatLocks(totalModal);

  let totalRevenue = 0;
  pack.items.forEach((item, idx) => {
    const totalQty = item.qty * qtyPack;
    const rateKey = item.name + "#" + idx;
    const rate = sellRates[activePack][rateKey];
    const perItem = pricePerItem(rate);
    const itemRevenue = totalQty * perItem;
    totalRevenue += itemRevenue;
    const totalEl = gridEl.querySelector(`[data-total-idx="${idx}"]`);
    if (totalEl) totalEl.textContent = `total tools: ${totalQty.toLocaleString("en-US")} (worth ${itemRevenue.toLocaleString("en-US")} WL)`;
  });

  if (activePack === "crime") {
    Object.values(CARD_CATALOG).flat().forEach((card) => {
      const totalQty = (Number(cardQty[card.name]) || 0) * qtyPack;
      totalRevenue += totalQty * pricePerItem(cardRate[card.name]);
      const totalEl = cardCategoriesEl.querySelector(`[data-card-total="${card.name}"]`);
      if (totalEl) totalEl.textContent = `${totalQty.toLocaleString("en-US")} total`;
    });
  }

  document.getElementById("totalRevenue").textContent = totalRevenue.toLocaleString("en-US") + " WL";
  document.getElementById("totalRevenueLockline").innerHTML = formatLocks(totalRevenue);

  const profit = totalRevenue - totalModal;
  const profitEl = document.getElementById("totalProfit");
  profitEl.textContent = (profit >= 0 ? "+" : "-") + Math.abs(profit).toLocaleString("en-US") + " WL";
  profitEl.className = "value " + (profit >= 0 ? "pos" : "neg");
  document.getElementById("totalProfitLockline").innerHTML = formatLocks(Math.abs(profit));
}

priceWlEl.addEventListener("input", compute);
qtyPackEl.addEventListener("input", compute);

// theme toggle, remembers choice in localStorage
const themeBtn = document.getElementById("themeToggle");
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
}
let savedTheme = "light";
try { savedTheme = localStorage.getItem("gt-theme") || "light"; } catch (e) {}
applyTheme(savedTheme);
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("gt-theme", next); } catch (e) {}
});

renderTabs();
renderGrid();
