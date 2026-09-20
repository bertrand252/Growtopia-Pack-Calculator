# 🌱 Growtopia Tools

A single-page toolkit for Growtopia players — pack profit math, machine simulators, and farming calculators. No build step, no dependencies, no backend. Just open `index.html` and go.

![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-f7df1e?logo=javascript&logoColor=000)
![No Build Step](https://img.shields.io/badge/build-none-brightgreen)
![No Dependencies](https://img.shields.io/badge/dependencies-0-blue)

---

## ✨ Tools

| Tool | What it does |
|---|---|
| 🎒 **Pack Calculator** | Pick a pack (Master Surgeon's Tool Bag, Crime Wave, Galactic Goodies), enter price paid and quantity, get total capital, tools received, and profit — with a lock (BGL/DL/WL) breakdown. |
| 🧪 **Autoclave** | Simulates repeatedly converting batches of 20 surgical tools into 1 of every other tool in the pool, so you know exactly what you'll end up with. |
| 🔬 **Nanoforge** | Same conversion mechanic as Autoclave, for its own tool pool. |
| 🩺 **Surgery Calculator** | Works out tool costs and totals for the Doctor's Office / surgical items. |
| 🎭 **Roles** | Plans out weekly Role-Up quest progress (normal + bonus days), gem cost per quest, and a Gems → WL converter — all with the literal formula shown so the math is verifiable by hand. |
| 🌾 **Farm Calculator** | Gems-from-breaking-blocks math, an Extra Block/Extra Gems gear planner (with a live 60-combo avatar preview), a farmable-vs-not picker, and a multi-cycle seed farming simulator. |

---

## 🚀 Running it

No build, no install, no server required.

```bash
start index.html   # Windows
open index.html     # macOS
```

...or just double-click it. Any static file server works too, if you'd rather not open the file directly.

---

## 🛠️ Tech

Plain **HTML / CSS / JavaScript** — no frameworks, no bundler, no package.json. Each tool is its own classic `<script>` file sharing a few globals (lock formatting, price math, icon-dropdown UI) with `script.js`.

```
index.html        shell + all tool sections
style.css          theme (light/dark, toggled + persisted to localStorage)
script.js          Pack Calculator logic + shared helpers
autoclave.js       Autoclave simulator
nanoforge.js       Nanoforge simulator
surgery.js         Surgery Calculator
roles.js           Roles Calculator
farm.js            Farm Calculator
nav.js             sidebar tool switching
assets/            item/lock/tool icons, sourced from growtopiawiki.com
```

---

## ⚠️ A note on accuracy

Growtopia doesn't publish official formulas for everything (Extra Block/Gems item mods, seed drop rates, farming yields). Where this app models those, it says so — numbers are cross-referenced from wiki pages, forum posts, and community calculators, flagged as estimates rather than presented as fact. Pack contents and guaranteed drops, on the other hand, are pulled straight from each pack's own wiki page.

---

Made for Growtopia resellers and farmers who'd rather trust math than vibes. 🌻
