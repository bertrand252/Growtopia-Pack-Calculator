const farmBlocksEl = document.getElementById("farmBlocks");

// Farmable tier — user picks it, see CLAUDE.md "Reference: Farmable vs
// unfarmable blocks". Also sets blocks-harvested-per-tree for the simulator
// below (multiplier pattern cross-checked against a fan-made calculator,
// see CLAUDE.md "Reference: Seed yield estimate").
const farmTierEl = document.getElementById("farmTier");
const farmableResultEl = document.getElementById("farmableResult");
const FARM_TIER_MULTIPLIER = { not: 2.5, farmable: 3.75 };
const FARM_TIER_LABEL = {
  not: '<span class="farmable-badge farmable-no">❌ Not farmable</span>',
  farmable: '<span class="farmable-badge farmable-yes">✅ Farmable</span>',
};

function farmableCompute() {
  const tier = farmTierEl.value;
  farmableResultEl.innerHTML = `${FARM_TIER_LABEL[tier]} — ${FARM_TIER_MULTIPLIER[tier]}x blocks per tree harvested`;
  seedCompute();
}

document.querySelectorAll("#farmTierTabs .tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#farmTierTabs .tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    farmTierEl.value = btn.dataset.value;
    farmableCompute();
  });
});

// Seed farming simulator — see CLAUDE.md "Reference: Seed yield estimate".
// Formula pattern (base smash return 1/12, seed-per-smash 3/12, seed-harvest
// rate 4/(rarity+12), block-yield-per-tier multipliers) is cross-checked
// against a fan-made calculator, not an official Growtopia source.
// breakTotalPct (gear Extra Block % from the card above, written by
// breakCompute() further down this file) is reused as the bonus block chance.
let breakTotalPct = 0;
const BASE_SMASH_BLOCKS = 1 / 12;
const BASE_SMASH_SEEDS = 3 / 12;
const seedRarityEl = document.getElementById("seedRarity");
const seedPlantedEl = document.getElementById("seedPlanted");
const seedCyclesEl = document.getElementById("seedCycles");
const seedBlocksEl = document.getElementById("seedBlocks");
const seedFinalEl = document.getElementById("seedFinal");
const seedWithBonusEl = document.getElementById("seedWithBonus");
const seedDcsEl = document.getElementById("seedDcs");
const seedHarvesterEl = document.getElementById("seedHarvester");
const seedGemsEl = document.getElementById("seedGems");
const BASE_SMASH_GEMS = 8 / 12;

function getGemBaseYield(rarity) {
  return rarity > 30 ? rarity / 9 : rarity / 13.5;
}

function seedCompute() {
  const rarity = Math.max(0, Number(seedRarityEl.value) || 0);
  const cycles = Math.max(1, Math.floor(Number(seedCyclesEl.value) || 1));
  const yieldMultiplier = FARM_TIER_MULTIPLIER[farmTierEl.value];
  const seedHarvestRate = 4 / (rarity + 12);
  const bonusBlockChance = breakTotalPct / 100;
  const compoundMultiplier = 1 / Math.max(0.01, 1 - (BASE_SMASH_BLOCKS + bonusBlockChance));
  // Dreamcatcher Staff / Harvester of Sorrows only work below rarity 100
  const harvestBonusActive = rarity < 100;
  const dcsActive = seedDcsEl.checked && harvestBonusActive;
  const harvesterActive = seedHarvesterEl.checked && harvestBonusActive;

  // Gems formula, reusing the same gear checkboxes as the Extra Block card
  // above (queried live so declaration order in this file doesn't matter).
  const gemBaseYield = getGemBaseYield(rarity);
  const shirt = document.getElementById("breakShirt").value;
  const ancestral = document.getElementById("breakAncestral").value;
  const ancestralLevel = Number(document.getElementById("breakAncestralLevel").value) || 0;
  const luckyOn = document.getElementById("breakLucky").checked;
  const arrozOn = document.getElementById("breakArroz").checked;
  const emeraldOn = document.getElementById("breakEmerald").checked;
  // Jersey and Lens don't stack (same as the gear card above)
  const extraGemChance = shirt === "jersey" ? 0.10 : (ancestral === "lens" ? ancestralLevel / 100 : 0);
  const extraGemRate = gemBaseYield * BASE_SMASH_GEMS * extraGemChance;
  const cloverGemBonus = luckyOn ? gemBaseYield * BASE_SMASH_GEMS * 0.10 * 2.0 : 0; // 10% chance, avg +2x on trigger
  const elockRate = emeraldOn ? 0.10 : 0;
  const arrozRate = arrozOn ? 0.10 : 0;

  const startSeeds = Math.max(0, Number(seedPlantedEl.value) || 0);
  let currentSeeds = startSeeds;
  let lastHarvestedBlocks = 0;
  let lastEffectiveBlocks = 0;
  let totalGems = 0;

  for (let i = 0; i < cycles; i++) {
    const harvestedSeeds = currentSeeds * seedHarvestRate;
    const baseHarvestBlocks = currentSeeds * yieldMultiplier;
    const harvesterExtra = harvesterActive ? baseHarvestBlocks * 0.10 : 0;
    const dcsExtra = dcsActive ? currentSeeds * 0.02 : 0;
    const harvestedBlocks = baseHarvestBlocks + harvesterExtra + dcsExtra;
    const effectiveBlocks = harvestedBlocks * compoundMultiplier;
    const seedsFromSmashing = effectiveBlocks * BASE_SMASH_SEEDS;

    const baseHarvestGems = gemBaseYield * currentSeeds;
    const baseSmashGems = gemBaseYield * BASE_SMASH_GEMS * effectiveBlocks;
    const bonusGems = effectiveBlocks * (elockRate + arrozRate + cloverGemBonus + extraGemRate);
    totalGems += baseHarvestGems + baseSmashGems + bonusGems;

    currentSeeds = harvestedSeeds + seedsFromSmashing;
    lastHarvestedBlocks = harvestedBlocks;
    lastEffectiveBlocks = effectiveBlocks;
  }

  const netProfit = currentSeeds - startSeeds;
  const ratio = startSeeds > 0 ? (currentSeeds / startSeeds) * 100 : 0;
  const compoundBonus = lastEffectiveBlocks - lastHarvestedBlocks;

  seedBlocksEl.innerHTML = `${Math.round(lastHarvestedBlocks).toLocaleString("en-US")} <span style="color:var(--muted)">+</span> <span style="color:var(--danger)">${Math.round(compoundBonus).toLocaleString("en-US")}</span> <span style="color:var(--muted)">=</span> ${Math.round(lastEffectiveBlocks).toLocaleString("en-US")}`;
  seedFinalEl.textContent = Math.round(currentSeeds).toLocaleString("en-US");
  seedWithBonusEl.textContent = `${netProfit >= 0 ? "+" : ""}${Math.round(netProfit).toLocaleString("en-US")} (${ratio.toLocaleString("en-US", { maximumFractionDigits: 1 })}%)`;
  seedGemsEl.textContent = Math.round(totalGems).toLocaleString("en-US");
}

[seedRarityEl, seedPlantedEl, seedCyclesEl, seedDcsEl, seedHarvesterEl].forEach((el) => {
  el.addEventListener("input", seedCompute);
  el.addEventListener("change", seedCompute);
});
farmableCompute();

// Extra Block / Extra Gems gear. Nothing here is officially documented —
// see CLAUDE.md for sourcing + the disputed numbers. Model used:
// - Shirt and Ancestral/Artifact are single equip slots (pick one each)
// - Block contributors (Galaxy Skin/ATOD from their slots, WWS, BBH,
//   "Lucky!" mod) add together, capped at 20% (community estimate, not
//   official — could really be 15-20% or something else entirely)
// - Gems contributors are different kinds of effects (flat chance,
//   multiplier chance, unconfirmed %) so they're listed, not summed
const BREAK_BLOCK_CAP = 20;

const breakShirtEl = document.getElementById("breakShirt");
const breakAncestralEl = document.getElementById("breakAncestral");
const breakAncestralLevelFieldEl = document.getElementById("breakAncestralLevelField");
const breakAncestralLevelEl = document.getElementById("breakAncestralLevel");
const breakWwsEl = document.getElementById("breakWws");
const breakBbhEl = document.getElementById("breakBbh");
const breakLuckyEl = document.getElementById("breakLucky");
const breakArrozEl = document.getElementById("breakArroz");
const breakEmeraldEl = document.getElementById("breakEmerald");
const breakEffectiveChanceEl = document.getElementById("breakEffectiveChance");
const breakWhichItemEl = document.getElementById("breakWhichItem");
const breakExtraBlocksEl = document.getElementById("breakExtraBlocks");
const breakGuildPotionEl = document.getElementById("breakGuildPotion");
const breakBuilderLevelEl = document.getElementById("breakBuilderLevel");
const breakGemsListEl = document.getElementById("breakGemsList");
const breakLoadBestBtn = document.getElementById("breakLoadBestBtn");
const breakAvatarEl = document.getElementById("breakAvatar");
const breakAvatarPlaceholderEl = document.getElementById("breakAvatarPlaceholder");

// avatar preview: 60 combo screenshots (Shirt x Ancestral x WWS x BBH),
// numbered 1-60, live in assets/farm/sets/<n>.png. Order matches the
// group-of-4 scheme handed to the user: within each Shirt+Ancestral pair,
// 1=base 2=+WWS 3=+BBH 4=+WWS+BBH.
const BREAK_SHIRT_ORDER = ["none", "galaxy", "jersey"];
const BREAK_ANCESTRAL_ORDER = ["none", "atod", "lens", "angeldevil", "kuwiis"];

function breakComboNumber(shirt, ancestral, wws, bbh) {
  const shirtIdx = BREAK_SHIRT_ORDER.indexOf(shirt);
  const ancestralIdx = BREAK_ANCESTRAL_ORDER.indexOf(ancestral);
  if (shirtIdx === -1 || ancestralIdx === -1) return null;
  const groupIdx = shirtIdx * BREAK_ANCESTRAL_ORDER.length + ancestralIdx;
  const variant = (wws ? 1 : 0) + (bbh ? 2 : 0); // 0=base 1=+wws 2=+bbh 3=+both
  return groupIdx * 4 + variant + 1;
}

function breakUpdateAvatar(shirt, ancestral, wws, bbh) {
  const num = breakComboNumber(shirt, ancestral, wws, bbh);
  const src = num ? `assets/farm/sets/${num}.png` : "";
  breakAvatarEl.onerror = () => {
    breakAvatarEl.hidden = true;
    breakAvatarPlaceholderEl.hidden = false;
    breakAvatarPlaceholderEl.textContent = "Preview image not added yet";
  };
  breakAvatarEl.onload = () => {
    breakAvatarEl.hidden = false;
    breakAvatarPlaceholderEl.hidden = true;
  };
  breakAvatarEl.src = src;
}

const ATOD_LEVEL_LABEL = { 5: "Base", 6: "Level 2", 7: "Level 3", 8: "Level 4", 9: "Level 5", 10: "Level 6" };

// wires up a role-picker-style icon dropdown: clicking an item sets the
// hidden input's value + fires "change" on it, same contract as a <select>
function setupIconPicker(pickerId, toggleId, menuId, labelId, hiddenInputId) {
  const pickerEl = document.getElementById(pickerId);
  const toggleEl = document.getElementById(toggleId);
  const menuEl = document.getElementById(menuId);
  const labelEl = document.getElementById(labelId);
  const hiddenEl = document.getElementById(hiddenInputId);

  toggleEl.addEventListener("click", () => { menuEl.hidden = !menuEl.hidden; });
  document.addEventListener("click", (e) => {
    if (!pickerEl.contains(e.target)) menuEl.hidden = true;
  });
  menuEl.querySelectorAll(".role-picker-item").forEach((item) => {
    item.addEventListener("click", () => {
      menuEl.querySelectorAll(".role-picker-item").forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      labelEl.textContent = item.dataset.label;
      menuEl.hidden = true;
      hiddenEl.value = item.dataset.value;
      hiddenEl.dispatchEvent(new Event("change"));
    });
  });
  return { pickerEl, toggleEl, menuEl, labelEl, hiddenEl };
}

setupIconPicker("breakShirtPicker", "breakShirtToggle", "breakShirtMenu", "breakShirtLabel", "breakShirt");
setupIconPicker("breakAncestralPicker", "breakAncestralToggle", "breakAncestralMenu", "breakAncestralLabel", "breakAncestral");

// programmatically pick a value in an icon dropdown (for "Load Best Combo")
function selectPickerValue(menuId, labelId, hiddenInputId, value) {
  const menuEl = document.getElementById(menuId);
  const item = menuEl.querySelector(`.role-picker-item[data-value="${value}"]`);
  if (!item) return;
  menuEl.querySelectorAll(".role-picker-item").forEach((i) => i.classList.remove("active"));
  item.classList.add("active");
  document.getElementById(labelId).textContent = item.dataset.label;
  document.getElementById(hiddenInputId).value = value;
}

breakAncestralEl.addEventListener("change", () => {
  breakAncestralLevelFieldEl.hidden = !["atod", "lens"].includes(breakAncestralEl.value);
  breakCompute();
});

function breakCompute() {
  const shirt = breakShirtEl.value;
  const ancestral = breakAncestralEl.value;
  const ancestralLevel = Number(breakAncestralLevelEl.value);

  breakUpdateAvatar(shirt, ancestral, breakWwsEl.checked, breakBbhEl.checked);

  // block chance: gear items sum and cap at 20% (the "Extra Block Item Mod"
  // nerf, worn items only). Lucky/Guild Potion/Builder role are separate
  // systems (consumable, guild buff, role perk) — they stack on top,
  // uncapped, per user confirmation.
  // Angel and Devil isn't included here — it's not a guaranteed block bonus,
  // each break randomly resolves as EITHER block OR gems, so summing it in
  // would overstate the guaranteed block chance (see note below instead).
  const gearParts = [];
  if (shirt === "galaxy") gearParts.push({ name: "Galaxy Skin", pct: 10 });
  if (ancestral === "atod") gearParts.push({ name: `ATOD (${ATOD_LEVEL_LABEL[ancestralLevel]})`, pct: ancestralLevel });
  if (ancestral === "kuwiis") gearParts.push({ name: "Kuwii's Tutelar", pct: 5 });
  if (breakWwsEl.checked) gearParts.push({ name: "Winter Wishing Star", pct: 2.5 });
  if (breakBbhEl.checked) gearParts.push({ name: "Buddy's Block Head", pct: 2 });

  const gearRawTotal = gearParts.reduce((sum, p) => sum + p.pct, 0);
  const gearTotal = Math.min(BREAK_BLOCK_CAP, gearRawTotal);

  const addOnParts = [];
  if (breakLuckyEl.checked) addOnParts.push({ name: "\"Lucky!\" mod", pct: 10 });
  if (breakGuildPotionEl.checked) addOnParts.push({ name: "Guild Potion - Blocks", pct: 1 });
  const builderPct = Number(breakBuilderLevelEl.value) || 0;
  if (builderPct > 0) addOnParts.push({ name: `Builder role (Frugal Framework)`, pct: builderPct });
  const addOnTotal = addOnParts.reduce((sum, p) => sum + p.pct, 0);

  const total = gearTotal + addOnTotal;
  breakTotalPct = total; // shared with the speculative seed-yield estimate below

  breakEffectiveChanceEl.textContent = `${total.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
  const gearLabel = gearParts.length
    ? `${gearParts.map((p) => p.name).join(" + ")}${gearRawTotal > BREAK_BLOCK_CAP ? ` = ${gearRawTotal}%, capped to ${BREAK_BLOCK_CAP}%` : ` = ${gearRawTotal}%`}`
    : "no gear";
  const addOnLabel = addOnParts.length ? ` + ${addOnParts.map((p) => `${p.name} (${p.pct}%)`).join(" + ")}` : "";
  breakWhichItemEl.textContent = `${gearLabel}${addOnLabel}${ancestral === "angeldevil" ? " (+ Angel and Devil, ~5% random block-or-gems, not counted here)" : ""}`;

  const blocks = Math.max(0, Number(farmBlocksEl.value) || 0);
  breakExtraBlocksEl.textContent = Math.round(blocks * (total / 100)).toLocaleString("en-US");

  seedCompute();

  // gems effects: different effect types, list rather than fake-sum
  const gemsEffects = [];
  if (shirt === "jersey") gemsEffects.push("American Sports Ball Jersey: 10% chance of extra gems");
  if (ancestral === "lens") gemsEffects.push(`Ancestral Lens of Riches (${ATOD_LEVEL_LABEL[ancestralLevel]}): ${ancestralLevel}% chance of extra gems`);
  if (ancestral === "angeldevil") gemsEffects.push("Angel and Devil: ~5% each break, randomly resolves as extra-block OR extra-gems (never both)");
  if (breakLuckyEl.checked) gemsEffects.push("\"Lucky!\" mod: 10% chance to multiply gems up to ×5");
  if (breakArrozEl.checked) gemsEffects.push("Arroz Con Pollo: 10% chance of +1 gem");
  if (breakEmeraldEl.checked) gemsEffects.push("Emerald Lock: 10% flat chance of extra gems");

  breakGemsListEl.innerHTML = gemsEffects.length
    ? gemsEffects.map((e) => `<li>${e}</li>`).join("")
    : `<li class="break-gems-empty">Nothing equipped</li>`;
}

[breakShirtEl, breakAncestralLevelEl, breakWwsEl, breakBbhEl, breakLuckyEl, breakArrozEl, breakEmeraldEl, breakGuildPotionEl, breakBuilderLevelEl, farmBlocksEl]
  .forEach((el) => {
    el.addEventListener("input", breakCompute);
    el.addEventListener("change", breakCompute);
  });

breakLoadBestBtn.addEventListener("click", () => {
  selectPickerValue("breakShirtMenu", "breakShirtLabel", "breakShirt", "galaxy");
  selectPickerValue("breakAncestralMenu", "breakAncestralLabel", "breakAncestral", "atod");
  breakAncestralLevelEl.value = "10";
  breakAncestralLevelFieldEl.hidden = false;
  breakWwsEl.checked = true;
  breakBbhEl.checked = true;
  breakLuckyEl.checked = true;
  breakArrozEl.checked = true;
  breakEmeraldEl.checked = true;
  breakCompute();
});

breakCompute();
