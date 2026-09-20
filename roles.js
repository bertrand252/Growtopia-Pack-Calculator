// Role leveling curve (same shape for every role, only reward flavor differs
// per role in-game). Confirmed on growtopiawiki.com/w/Update:Role_Up!/Farmer
// (Role Overview table matches this formula exactly). The gem-cost-per-quest
// formula is confirmed on the main Update:Role_Up! page's "Formula" section.
const ROLE_BASE_POINTS = 1300;
const ROLE_BASE_PER_QUEST = 270;
const ROLE_MAX_LEVEL = 10;
const ROLE_QUEST_BASE_GEM = 3000; // fixed cost of the 2nd quest of the day, same for every role/player

// Supplier's Cape roles vs Crafter's Cape roles, per the wiki's Trivia note.
const SUPPLIER_ROLES = ["Farmer", "Surgeon", "Fishing", "Star Captain"];

function rolePointsForLevel(fromLevel) {
  return ROLE_BASE_POINTS * (fromLevel + 1) * (fromLevel + 1);
}
function rolePointsPerQuestBase(fromLevel) {
  return ROLE_BASE_PER_QUEST * (fromLevel + 1);
}

const roleTypeEl = document.getElementById("roleType");
const rolePickerEl = document.getElementById("rolePicker");
const rolePickerToggleEl = document.getElementById("rolePickerToggle");
const rolePickerMenuEl = document.getElementById("rolePickerMenu");
const rolePickerIconEl = document.getElementById("rolePickerIcon");
const rolePickerLabelEl = document.getElementById("rolePickerLabel");
const roleQuestsPerDayEl = document.getElementById("roleQuestsPerDay");
const roleCurrentLevelEl = document.getElementById("roleCurrentLevel");
const roleCurrentPointsEl = document.getElementById("roleCurrentPoints");
const roleTargetLevelEl = document.getElementById("roleTargetLevel");
const bonusCapeEl = document.getElementById("bonusCape");
const bonusCapeLabelEl = document.getElementById("bonusCapeLabel");
const bonusCapeIconEl = document.getElementById("bonusCapeIcon");
const bonusJatSetEl = document.getElementById("bonusJatSet");
const rolePointsEl = document.getElementById("rolePoints");
const roleQuestsEl = document.getElementById("roleQuests");
const roleDaysEl = document.getElementById("roleDays");
const roleTableBody = document.querySelector("#roleTable tbody");
const roleDailyGemsEl = document.getElementById("roleDailyGems");
const roleTotalGemsEl = document.getElementById("roleTotalGems");
const roleGemsSpentEl = document.getElementById("roleGemsSpent");
const roleGemsPerWlEl = document.getElementById("roleGemsPerWl");
const roleGemsAsWlEl = document.getElementById("roleGemsAsWl");
const roleGemsAsWlLocklineEl = document.getElementById("roleGemsAsWlLockline");

function roleGearMultiplier() {
  let bonus = 0;
  if (bonusCapeEl.checked) bonus += 0.05;
  if (bonusJatSetEl.checked) bonus += 0.03;
  return 1 + bonus;
}

// quest 1 of the day is free; quest k after that costs 3000*(k-1)^2 gems,
// a fixed formula confirmed on the wiki's Formula section
function roleGemCostForDay(questsThatDay) {
  let total = 0;
  for (let q = 1; q <= questsThatDay; q++) {
    if (q > 1) total += ROLE_QUEST_BASE_GEM * (q - 1) * (q - 1);
  }
  return total;
}

function roleUpdateCapeLabel() {
  const isSupplier = SUPPLIER_ROLES.includes(roleTypeEl.value);
  bonusCapeLabelEl.textContent = isSupplier ? "Supplier's Cape" : "Crafter's Cape";
  bonusCapeIconEl.src = isSupplier ? "assets/roles/supplier-cape.png" : "assets/roles/crafter-cape.png";
}

// clamp a field's own displayed value, not just the number used internally,
// so typing 456235 or a negative doesn't just get silently reinterpreted.
// Leaves an empty field alone (returns min for the calc) instead of
// snapping it back to min instantly — otherwise backspacing to retype a
// new number gets stomped before you can type the replacement digit.
function clampFieldValue(el, min, max) {
  if (el.value === "") return min;
  const n = Math.floor(Number(el.value) || 0);
  const clamped = Math.min(max, Math.max(min, n));
  if (String(clamped) !== el.value) el.value = clamped;
  return clamped;
}

function roleCompute() {
  roleUpdateCapeLabel();

  const currentLevel = clampFieldValue(roleCurrentLevelEl, 0, 9);
  const currentPoints = clampFieldValue(roleCurrentPointsEl, 0, Number.MAX_SAFE_INTEGER);
  const targetLevel = clampFieldValue(roleTargetLevelEl, 1, ROLE_MAX_LEVEL);
  const questsPerDay = clampFieldValue(roleQuestsPerDayEl, 0, 999999);
  const gearMultiplier = roleGearMultiplier();

  roleTableBody.innerHTML = "";
  let totalPoints = 0;
  let totalQuests = 0;
  let unreachable = false;

  for (let level = currentLevel; level < targetLevel; level++) {
    const levelTotal = rolePointsForLevel(level);
    const alreadyEarned = level === currentLevel ? Math.min(currentPoints, levelTotal) : 0;
    const remaining = Math.max(0, levelTotal - alreadyEarned);
    const rate = rolePointsPerQuestBase(level) * gearMultiplier;
    const quests = remaining > 0 ? Math.ceil(remaining / rate) : 0;
    if (remaining > 0 && questsPerDay <= 0) unreachable = true;

    totalPoints += remaining;
    totalQuests += quests;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>Level ${level} → ${level + 1}</td>
      <td>${rate.toLocaleString("en-US", { maximumFractionDigits: 1 })}</td>
      <td>${remaining.toLocaleString("en-US")}</td>
      <td>${quests.toLocaleString("en-US")}</td>
      <td>${questsPerDay > 0 ? Math.ceil(quests / questsPerDay).toLocaleString("en-US") : "—"}</td>
    `;
    roleTableBody.appendChild(tr);
  }

  const totalDays = questsPerDay > 0 ? Math.ceil(totalQuests / questsPerDay) : 0;
  rolePointsEl.textContent = totalPoints.toLocaleString("en-US");
  roleQuestsEl.textContent = totalQuests.toLocaleString("en-US");
  roleDaysEl.textContent = unreachable ? "never (0 quests/day)" : totalDays.toLocaleString("en-US");

  // gem cost: full days at questsPerDay, plus one partial day for the
  // leftover quests on the last day
  const dailyGemCost = roleGemCostForDay(questsPerDay);
  roleDailyGemsEl.textContent = dailyGemCost.toLocaleString("en-US");

  let totalGemCost = 0;
  if (questsPerDay > 0) {
    const fullDays = Math.floor(totalQuests / questsPerDay);
    const leftoverQuests = totalQuests % questsPerDay;
    totalGemCost = fullDays * dailyGemCost + roleGemCostForDay(leftoverQuests);
  }
  roleTotalGemsEl.textContent = unreachable ? "—" : totalGemCost.toLocaleString("en-US");

  // Gems → WL converter always reflects this total — no separate manual entry
  roleGemsSpentEl.value = unreachable ? 0 : totalGemCost;
  roleComputeGemsToWl();
}

function roleComputeGemsToWl() {
  const gemsSpent = clampFieldValue(roleGemsSpentEl, 0, Number.MAX_SAFE_INTEGER);
  const gemsPerWl = clampFieldValue(roleGemsPerWlEl, 0, Number.MAX_SAFE_INTEGER);
  const wl = gemsPerWl > 0 ? gemsSpent / gemsPerWl : 0;
  roleGemsAsWlEl.textContent = wl.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " WL";
  roleGemsAsWlLocklineEl.innerHTML = formatLocks(wl);
}

[roleQuestsPerDayEl, roleCurrentLevelEl, roleCurrentPointsEl, roleTargetLevelEl,
 bonusCapeEl, bonusJatSetEl].forEach((el) => {
  el.addEventListener("input", roleCompute);
  el.addEventListener("change", roleCompute);
});
roleTypeEl.addEventListener("change", roleCompute);

// custom role picker: a styled dropdown over the hidden #roleType input
rolePickerToggleEl.addEventListener("click", () => {
  rolePickerMenuEl.hidden = !rolePickerMenuEl.hidden;
});
document.addEventListener("click", (e) => {
  if (!rolePickerEl.contains(e.target)) rolePickerMenuEl.hidden = true;
});
rolePickerMenuEl.querySelectorAll(".role-picker-item").forEach((item) => {
  item.addEventListener("click", () => {
    rolePickerMenuEl.querySelectorAll(".role-picker-item").forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    rolePickerIconEl.src = item.querySelector("img").src;
    rolePickerLabelEl.textContent = item.dataset.label;
    rolePickerMenuEl.hidden = true;
    roleTypeEl.value = item.dataset.value;
    roleTypeEl.dispatchEvent(new Event("change"));
  });
});

roleGemsPerWlEl.addEventListener("input", roleComputeGemsToWl);

// if you tab/click away leaving a number field empty, snap it back to its
// minimum instead of leaving it blank
[[roleCurrentLevelEl, 0], [roleCurrentPointsEl, 0], [roleTargetLevelEl, 1], [roleQuestsPerDayEl, 0]]
  .forEach(([el, min]) => {
    el.addEventListener("blur", () => {
      if (el.value === "") el.value = min;
      roleCompute();
    });
  });

roleCompute();
