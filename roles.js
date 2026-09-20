// Role leveling curve (same shape for every role, only reward flavor differs
// per role in-game). This points curve is NOT wiki-confirmed — it's an
// estimate carried over from a community calculator — so treat it as
// approximate. The gem-cost-per-quest formula below IS wiki-confirmed:
// growtopiawiki.com/wiki/Update:Role_Up! ("Formula" section).
const ROLE_BASE_POINTS = 1300;
const ROLE_BASE_PER_QUEST = 270;
const ROLE_MAX_LEVEL = 10;

// Supplier's Cape roles vs Crafter's Cape roles, per the wiki's Trivia note.
const SUPPLIER_ROLES = ["Farmer", "Surgeon", "Fishing", "Star Captain"];

function rolePointsForLevel(fromLevel) {
  return ROLE_BASE_POINTS * (fromLevel + 1) * (fromLevel + 1);
}
function rolePointsPerQuestBase(fromLevel) {
  return ROLE_BASE_PER_QUEST * (fromLevel + 1);
}

const roleTypeEl = document.getElementById("roleType");
const roleCurrentLevelEl = document.getElementById("roleCurrentLevel");
const roleCurrentPointsEl = document.getElementById("roleCurrentPoints");
const roleTargetLevelEl = document.getElementById("roleTargetLevel");
const roleQuestsPerDayEl = document.getElementById("roleQuestsPerDay");
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
const ROLE_QUEST_BASE_GEM = 3000; // fixed cost of the 2nd quest of the day, same for every role/player
const roleDailyGemsEl = document.getElementById("roleDailyGems");
const roleTotalGemsEl = document.getElementById("roleTotalGems");

function roleBonusMultiplier() {
  let bonus = 0;
  if (bonusCapeEl.checked) bonus += 0.05;
  if (bonusJatSetEl.checked) bonus += 0.03;
  // Roles Day and Jack of All Trades Day land on two DIFFERENT days of the
  // week (day 1 and day 2) — they can never both hit the same day, so each
  // is averaged in separately as its own 1/7 share, never combined into one.
  if (bonusRolesDayEl.checked) bonus += 0.25 / 7;
  if (bonusJoatDayEl.checked) bonus += 0.25 / 7;
  return 1 + bonus;
}

// quest 1 of the day is free; quest k after that costs 3000*(k-1)^2 gems,
// a fixed formula confirmed on the wiki's Formula section
function roleGemCostForQuest(questNumber) {
  if (questNumber <= 1) return 0;
  return ROLE_QUEST_BASE_GEM * (questNumber - 1) * (questNumber - 1);
}

function roleUpdateCapeLabel() {
  const isSupplier = SUPPLIER_ROLES.includes(roleTypeEl.value);
  bonusCapeLabelEl.textContent = isSupplier ? "Supplier's Cape" : "Crafter's Cape";
  bonusCapeIconEl.src = isSupplier ? "assets/roles/supplier-cape.png" : "assets/roles/crafter-cape.png";
}

// clamp a field's own displayed value, not just the number used internally,
// so typing 456235 or a negative doesn't just get silently reinterpreted
function clampFieldValue(el, min, max) {
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
  const questsPerDay = Math.max(1, clampFieldValue(roleQuestsPerDayEl, 1, 999999));
  const multiplier = roleBonusMultiplier();

  roleTableBody.innerHTML = "";
  let totalPoints = 0;
  let totalQuests = 0;

  for (let level = currentLevel; level < targetLevel; level++) {
    const levelTotal = rolePointsForLevel(level);
    const alreadyEarned = level === currentLevel ? Math.min(currentPoints, levelTotal) : 0;
    const remaining = Math.max(0, levelTotal - alreadyEarned);
    const perQuest = rolePointsPerQuestBase(level) * multiplier;
    const quests = remaining > 0 ? Math.ceil(remaining / perQuest) : 0;

    totalPoints += remaining;
    totalQuests += quests;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>Level ${level} → ${level + 1}</td>
      <td>${perQuest.toLocaleString("en-US", { maximumFractionDigits: 1 })}</td>
      <td>${remaining.toLocaleString("en-US")}</td>
      <td>${quests.toLocaleString("en-US")}</td>
      <td>${Math.ceil(quests / questsPerDay).toLocaleString("en-US")}</td>
    `;
    roleTableBody.appendChild(tr);
  }

  const totalDays = Math.ceil(totalQuests / questsPerDay);
  rolePointsEl.textContent = totalPoints.toLocaleString("en-US");
  roleQuestsEl.textContent = totalQuests.toLocaleString("en-US");
  roleDaysEl.textContent = totalDays.toLocaleString("en-US");

  let dailyGems = 0;
  for (let q = 1; q <= questsPerDay; q++) dailyGems += roleGemCostForQuest(q);
  roleDailyGemsEl.textContent = dailyGems.toLocaleString("en-US");
  roleTotalGemsEl.textContent = (dailyGems * totalDays).toLocaleString("en-US");
}

[roleCurrentLevelEl, roleCurrentPointsEl, roleTargetLevelEl, roleQuestsPerDayEl,
 bonusCapeEl, bonusJatSetEl].forEach((el) => {
  el.addEventListener("input", roleCompute);
  el.addEventListener("change", roleCompute);
});
roleTypeEl.addEventListener("change", roleCompute);

// Roles Day and Jack of All Trades Day are two different days of the week —
// can never both be "today", so checking one always clears the other.
bonusRolesDayEl.addEventListener("change", () => {
  if (bonusRolesDayEl.checked) bonusJoatDayEl.checked = false;
  roleCompute();
});
bonusJoatDayEl.addEventListener("change", () => {
  if (bonusJoatDayEl.checked) bonusRolesDayEl.checked = false;
  roleCompute();
});

roleCompute();
