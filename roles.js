// Role leveling curve (same shape for every role, only reward flavor differs
// per role in-game). Confirmed on growtopiawiki.com/w/Update:Role_Up!/Farmer
// (Role Overview table matches this formula exactly). The gem-cost-per-quest
// formula is confirmed on the main Update:Role_Up! page's "Formula" section.
const ROLE_BASE_POINTS = 1300;
const ROLE_BASE_PER_QUEST = 270;
const ROLE_MAX_LEVEL = 10;
const ROLE_QUEST_BASE_GEM = 3000; // fixed cost of the 2nd quest of the day, same for every role/player
const ROLE_BONUS_DAY_BOOST = 0.25; // full +25% on an actual Roles Day / Jack of All Trades Day

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
const roleQuestsNormalEl = document.getElementById("roleQuestsNormal");
const roleQuestsBonusEl = document.getElementById("roleQuestsBonus");
const roleCurrentLevelEl = document.getElementById("roleCurrentLevel");
const roleCurrentPointsEl = document.getElementById("roleCurrentPoints");
const roleTargetLevelEl = document.getElementById("roleTargetLevel");
const bonusCapeEl = document.getElementById("bonusCape");
const bonusCapeLabelEl = document.getElementById("bonusCapeLabel");
const bonusCapeIconEl = document.getElementById("bonusCapeIcon");
const bonusJatSetEl = document.getElementById("bonusJatSet");
const bonusRolesDayEl = document.getElementById("bonusRolesDay");
const bonusJoatDayEl = document.getElementById("bonusJoatDay");
const rolePointsEl = document.getElementById("rolePoints");
const roleQuestsEl = document.getElementById("roleQuests");
const roleDaysEl = document.getElementById("roleDays");
const roleTableBody = document.querySelector("#roleTable tbody");
const roleDailyGemsNormalEl = document.getElementById("roleDailyGemsNormal");
const roleDailyGemsBonusEl = document.getElementById("roleDailyGemsBonus");
const roleTotalGemsEl = document.getElementById("roleTotalGems");
const roleGemsSpentEl = document.getElementById("roleGemsSpent");
const roleGemsPerWlEl = document.getElementById("roleGemsPerWl");
const roleGemsAsWlEl = document.getElementById("roleGemsAsWl");
const roleGemsAsWlLocklineEl = document.getElementById("roleGemsAsWlLockline");
const roleUseTotalGemsBtn = document.getElementById("roleUseTotalGems");

function roleGearMultiplier() {
  let bonus = 0;
  if (bonusCapeEl.checked) bonus += 0.05;
  if (bonusJatSetEl.checked) bonus += 0.03;
  return 1 + bonus;
}

function roleBonusDaysCount() {
  return (bonusRolesDayEl.checked ? 1 : 0) + (bonusJoatDayEl.checked ? 1 : 0);
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

// walks actual whole days (not a continuous/fractional average) until
// `remaining` points are earned, so quests/days/gems all land on numbers
// you could literally check off day by day. Normal days are simulated
// before bonus days within each 7-day week (we don't know the real
// weekday assignment, so this is just a consistent order to pick from).
function roleSimulateLevel(remaining, normalDays, bonusDays, questsNormal, questsBonus, normalRate, bonusRate) {
  const dayTypes = [];
  for (let i = 0; i < normalDays; i++) dayTypes.push({ q: questsNormal, rate: normalRate });
  for (let i = 0; i < bonusDays; i++) dayTypes.push({ q: questsBonus, rate: bonusRate });

  let quests = 0;
  let days = 0;
  let gemCost = 0;
  let cursor = 0;
  const maxDays = 20000; // safety cap so a 0-quest setup can't infinite-loop

  while (remaining > 0 && days < maxDays) {
    const day = dayTypes[cursor % dayTypes.length];
    cursor++;
    const pointsAvailable = day.q * day.rate;
    days++;
    if (pointsAvailable <= 0) continue; // this day type earns nothing, just passes

    if (pointsAvailable >= remaining) {
      const questsNeeded = Math.ceil(remaining / day.rate);
      quests += questsNeeded;
      gemCost += roleGemCostForDay(questsNeeded);
      remaining = 0;
    } else {
      quests += day.q;
      gemCost += roleGemCostForDay(day.q);
      remaining -= pointsAvailable;
    }
  }
  return { quests, days, gemCost, reachable: remaining <= 0 };
}

function roleCompute() {
  roleUpdateCapeLabel();

  const currentLevel = clampFieldValue(roleCurrentLevelEl, 0, 9);
  const currentPoints = clampFieldValue(roleCurrentPointsEl, 0, Number.MAX_SAFE_INTEGER);
  const targetLevel = clampFieldValue(roleTargetLevelEl, 1, ROLE_MAX_LEVEL);
  const questsNormal = clampFieldValue(roleQuestsNormalEl, 0, 999999);
  const questsBonus = clampFieldValue(roleQuestsBonusEl, 0, 999999);
  const gearMultiplier = roleGearMultiplier();

  const bonusDays = roleBonusDaysCount();
  const normalDays = 7 - bonusDays;

  roleTableBody.innerHTML = "";
  let totalPoints = 0;
  let totalQuests = 0;
  let totalDays = 0;
  let totalGemCost = 0;
  let unreachable = false;

  for (let level = currentLevel; level < targetLevel; level++) {
    const levelTotal = rolePointsForLevel(level);
    const alreadyEarned = level === currentLevel ? Math.min(currentPoints, levelTotal) : 0;
    const remaining = Math.max(0, levelTotal - alreadyEarned);

    const baseRate = rolePointsPerQuestBase(level) * gearMultiplier;
    const normalRate = baseRate;
    const bonusRate = baseRate * (1 + ROLE_BONUS_DAY_BOOST);

    const sim = roleSimulateLevel(remaining, normalDays, bonusDays, questsNormal, questsBonus, normalRate, bonusRate);
    if (!sim.reachable) unreachable = true;

    totalPoints += remaining;
    totalQuests += sim.quests;
    totalDays += sim.days;
    totalGemCost += sim.gemCost;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>Level ${level} → ${level + 1}</td>
      <td>${normalRate.toLocaleString("en-US", { maximumFractionDigits: 1 })}</td>
      <td>${bonusRate.toLocaleString("en-US", { maximumFractionDigits: 1 })}</td>
      <td>${remaining.toLocaleString("en-US")}</td>
      <td>${sim.reachable ? sim.quests.toLocaleString("en-US") : "—"}</td>
      <td>${sim.reachable ? sim.days.toLocaleString("en-US") : "never"}</td>
    `;
    roleTableBody.appendChild(tr);
  }

  rolePointsEl.textContent = totalPoints.toLocaleString("en-US");
  roleQuestsEl.textContent = unreachable ? "—" : totalQuests.toLocaleString("en-US");
  roleDaysEl.textContent = unreachable ? "never (0 quests/day)" : totalDays.toLocaleString("en-US");

  roleDailyGemsNormalEl.textContent = roleGemCostForDay(questsNormal).toLocaleString("en-US");
  roleDailyGemsBonusEl.textContent = roleGemCostForDay(questsBonus).toLocaleString("en-US");
  roleTotalGemsEl.textContent = unreachable ? "—" : totalGemCost.toLocaleString("en-US");

  roleCompute.lastTotalGemCost = totalGemCost;
  roleComputeGemsToWl();
}

function roleComputeGemsToWl() {
  const gemsSpent = clampFieldValue(roleGemsSpentEl, 0, Number.MAX_SAFE_INTEGER);
  const gemsPerWl = clampFieldValue(roleGemsPerWlEl, 0, Number.MAX_SAFE_INTEGER);
  const wl = gemsPerWl > 0 ? gemsSpent / gemsPerWl : 0;
  roleGemsAsWlEl.textContent = wl.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " WL";
  roleGemsAsWlLocklineEl.innerHTML = formatLocks(wl);
}

[roleQuestsNormalEl, roleQuestsBonusEl, roleCurrentLevelEl, roleCurrentPointsEl, roleTargetLevelEl,
 bonusCapeEl, bonusJatSetEl, bonusRolesDayEl, bonusJoatDayEl].forEach((el) => {
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

[roleGemsSpentEl, roleGemsPerWlEl].forEach((el) => {
  el.addEventListener("input", roleComputeGemsToWl);
});
roleUseTotalGemsBtn.addEventListener("click", () => {
  roleGemsSpentEl.value = roleCompute.lastTotalGemCost || 0;
  roleComputeGemsToWl();
});

// if you tab/click away leaving a number field empty, snap it back to its
// minimum instead of leaving it blank
[[roleCurrentLevelEl, 0], [roleCurrentPointsEl, 0], [roleTargetLevelEl, 1],
 [roleQuestsNormalEl, 0], [roleQuestsBonusEl, 0]].forEach(([el, min]) => {
  el.addEventListener("blur", () => {
    if (el.value === "") el.value = min;
    roleCompute();
  });
});

roleCompute();
