import "./styles.css";
import { content } from "./content";
import { createWorldScene } from "./scene";
import { createInput } from "../../RestaurantCommon/src/input";
import { icon } from "../../RestaurantCommon/src/ui/icons";
import {
  locales,
  resolveLocale,
  isLocale,
  type Locale,
} from "../../RestaurantCommon/src/ui/i18n";
import { tr, local } from "./locales";
import {
  createGame,
  activeBranch,
  step,
  command,
  offeredExpansions,
  trainingCost,
  tableCount,
  staffLimit,
  trayCapacity,
  storageCapacity,
  supplyCost,
  occupiedStorage,
  rescueQuote,
  branchCost,
  encode,
  decode,
  wagePerMinute,
  styleOf,
} from "../../CommonAdvanced/src/engine";
import {
  ROLES,
  WAGES,
  type State,
  type Command,
  type Order,
  type Vec,
} from "../../CommonAdvanced/src/types";
const root = document.querySelector<HTMLElement>("#app")!;
const key = "restaurant.world.v1";
let state: State = createGame(content),
  protectedSave = false,
  paused = false,
  modal = "",
  lang: Locale = resolveLocale(null, navigator.languages),
  toastUntil = 0,
  first = true;
try {
  const choice = localStorage.getItem("restaurant.world.language");
  if (choice && isLocale(choice)) lang = choice;
  const raw = localStorage.getItem(key);
  if (raw) {
    const loaded = decode(raw, content, Date.now());
    if (loaded) {
      state = loaded.state;
      first = false;
    } else protectedSave = true;
  }
} catch {
  protectedSave = true;
}
const t = (k: string) => tr(k, lang),
  l = (v: { cs: string; en: string }) => local(v, lang),
  fmt = (n: number) =>
    new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(
      Math.max(0, n),
    );
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const roleNames: Record<string, string> = {
  cook: "Cook",
  waiter: "Waiter",
  bartender: "Bartender",
  dishwasher: "Dishwasher",
  porter: "Porter",
};
root.innerHTML = `<div class="world-app"><header class="world-header"><div class="world-brand"><img src="./icon.svg" alt=""><div><strong>Restaurant World</strong><small id="branch-name"></small></div></div><div class="world-header-actions"><div class="world-wallet"><small id="wallet-label"></small><b id="money"></b></div><button class="world-icon" data-open="settings" aria-label="Settings">${icon("settings")}</button></div></header><main class="world-layout"><section class="world-stage"><canvas id="world" tabindex="0"></canvas><svg class="world-connectors" aria-hidden="true"></svg><div class="world-labels"></div><div class="world-mission"><small id="mission-label"></small><strong id="mission-text"></strong></div><div class="world-tools"><button class="world-icon" data-action="overview" aria-label="Map overview">${icon("map")}</button><button class="world-icon" data-action="help" aria-label="Help">${icon("help")}</button><button class="world-icon" data-action="goal" aria-label="Go to task">${icon("arrow")}</button></div><div class="world-carry"><span>${icon("bag")}</span><div><strong id="carry"></strong><small id="carry-items"></small></div></div><div class="joystick"><span></span></div><div class="world-toast" hidden></div></section><aside class="world-side"><h2 id="orders-title"></h2><p class="world-kicker" id="order-hint"></p><div id="orders" class="world-orders"></div><div class="world-nav">${[
  ["supply", "bag", "Supplies"],
  ["team", "team", "Team"],
  ["expand", "star", "Expand"],
  ["network", "map", "Network"],
]
  .map(
    ([id, i, text]) =>
      `<button data-open="${id}">${icon(i)}<span data-text="${text}"></span>${icon("arrow", 16)}</button>`,
  )
  .join(
    "",
  )}</div><div class="world-stat"><span id="plates"></span><span id="save-status"></span></div></aside></main><nav class="world-mobile">${[
  ["orders", "list", "Orders"],
  ["supply", "bag", "Supplies"],
  ["team", "team", "Team"],
  ["expand", "star", "Expand"],
  ["network", "map", "Network"],
]
  .map(
    ([id, i, text]) =>
      `<button data-open="${id}">${icon(i)}<span data-text="${text}"></span></button>`,
  )
  .join(
    "",
  )}</nav></div><dialog class="world-dialog"><div class="world-dialog-head"><h2 id="dialog-title"></h2><button class="world-icon" data-action="close" aria-label="Close">${icon("close")}</button></div><div id="dialog-content"></div></dialog><input type="file" id="import" accept="application/json,.json" hidden>`;
const get = (id: string) => document.getElementById(id)!;
const stage = root.querySelector<HTMLElement>(".world-stage")!,
  canvas = get("world") as HTMLCanvasElement,
  dialog = root.querySelector("dialog")!;
const scene = createWorldScene(canvas, content),
  input = createInput(stage, root.querySelector(".joystick")!);
const labels = new Map<string, HTMLButtonElement>();
for (const st of content.stations) {
  const el = document.createElement("button");
  el.className = "world-target";
  el.dataset.station = st.id;
  root.querySelector(".world-labels")!.append(el);
  labels.set(st.id, el);
}
content.tables.forEach((pos, i) => {
  const el = document.createElement("button");
  el.className = "world-target";
  el.dataset.table = String(i);
  root.querySelector(".world-labels")!.append(el);
  labels.set("table-" + i, el);
});
function save() {
  if (protectedSave) return;
  try {
    localStorage.setItem(key, encode(state, Date.now()));
    get("save-status").textContent = t("Saved");
  } catch {
    get("save-status").textContent = t("Could not save. Export a backup.");
  }
}
function toast(message: string) {
  const el = root.querySelector<HTMLElement>(".world-toast")!;
  el.textContent = message;
  el.hidden = false;
  toastUntil = performance.now() + 3500;
}
function perform(cmd: Command) {
  const ok = command(state, content, cmd);
  if (!ok) toast(t("Not enough funds or capacity."));
  else save();
  return ok;
}
function go(target: Vec) {
  input.reset();
  perform({ type: "move", target });
  close();
}
function close() {
  dialog.close();
  modal = "";
  input.reset();
}
function open(name: string) {
  modal = name;
  input.reset();
  renderModal();
  if (!dialog.open) dialog.showModal();
}
function recipe(id: string) {
  return styleOf(activeBranch(state), content).recipes.find(
    (r) => r.id === id,
  )!;
}
function selected() {
  const b = activeBranch(state);
  return (
    b.orders.find((o) => o.state === "bill") ??
    b.orders.find((o) => o.state === "dirty") ??
    b.orders.find((o) => o.id === b.selectedOrder && o.state !== "eating") ??
    b.orders.find((o) => o.state === "accepted") ??
    b.orders.find((o) => o.state === "waiting") ??
    b.orders[0]
  );
}
function goal(): { text: string; target: Vec } {
  const b = activeBranch(state),
    item = b.player.tray[0];
  let cap = "",
    text = "";
  if (item) {
    if (item.kind === "dirty") {
      cap = "wash";
      text = "Wash the dishes";
    } else if (item.kind === "meal" || item.kind === "drink") {
      const o = b.orders.find((o) => o.id === item.orderId);
      if (o)
        return { text: "Serve the table", target: content.tables[o.table] };
    } else {
      const r = recipe(item.recipeId);
      cap = r.steps[item.stage]?.capability ?? "pass";
      text =
        cap === "prep"
          ? "Prepare ingredients"
          : cap === "heat"
            ? "Cook the meal"
            : cap === "bar"
              ? "Prepare the drink"
              : "Plate the meal";
    }
  }
  if (cap)
    return {
      text,
      target: content.stations.find((s) => s.capability === cap)!,
    };
  const o = selected();
  if (o) {
    if (o.state !== "accepted")
      return {
        text:
          o.state === "waiting"
            ? missingStock(o)
              ? "Missing ingredients"
              : "Go to table"
            : o.state === "bill"
              ? "Bill"
              : o.state === "dirty"
                ? "Clear the table"
                : "Eating",
        target: content.tables[o.table],
      };
    if (
      b.shelf.some(
        (item) =>
          item.orderId === o.id &&
          (item.kind === "meal" || item.kind === "drink"),
      )
    )
      return {
        text: "Ready",
        target: content.stations.find((st) => st.capability === "pass")!,
      };
    const job = b.jobs.find((j) => j.item.orderId === o.id);
    if (job)
      return {
        text: job.ready ? "Ready" : "Preparing",
        target: content.stations.find((s) => s.id === job.station)!,
      };
    return {
      text: "Collect ingredients",
      target: content.stations.find((s) => s.id === "source")!,
    };
  }
  return { text: "Welcome your guests", target: { x: 0, z: 3 } };
}
function missingStock(o: Order) {
  const required: Record<string, number> = {};
  for (const line of o.lines)
    for (const [id, n] of Object.entries(recipe(line.recipeId).ingredients))
      required[id] = (required[id] ?? 0) + n;
  return (
    o.state === "waiting" &&
    Object.entries(required).some(
      ([id, n]) => (activeBranch(state).stock[id] ?? 0) < n,
    )
  );
}
function orderHtml(o: Order) {
  const b = activeBranch(state);
  return `<div><button class="world-order ${o.id === b.selectedOrder ? "active" : ""}" data-order="${o.id}"><div class="world-order-top"><b>${t("Table")} ${o.table + 1}</b><span>${t({ waiting: "Waiting for an order", accepted: "Preparing", eating: "Eating", bill: "Bill", dirty: "Clear the table" }[o.state])}</span></div><div class="world-order-items">${o.lines.map((line) => `${line.state === "served" ? "✓ " : ""}${escape(l(recipe(line.recipeId).name))}`).join(" · ")}</div><small>${t(missingStock(o) ? "Missing ingredients" : "Go to table")} →</small></button>${["waiting", "accepted"].includes(o.state) ? `<button class="world-cancel" data-cancel-order="${o.id}">${t("Cancel order")}</button>` : ""}</div>`;
}
function renderModal() {
  const b = activeBranch(state);
  let title = "",
    html = "";
  if (modal === "orders") {
    title = t("Orders");
    html = `<div class="world-orders">${b.orders.map(orderHtml).join("") || `<p>${t("No guests yet. Your first table will arrive shortly.")}</p>`}</div>`;
  }
  if (modal === "supply") {
    title = t("Supplies");
    const used = new Set(
      styleOf(b, content).recipes.flatMap((r) => Object.keys(r.ingredients)),
    );
    const amount = occupiedStorage(b),
      room = storageCapacity(b, content) - amount;
    html = `<p>${t("Delivery takes 12 seconds. Pay once when ordering.")}</p><p><b>${t("Storage capacity")}: ${fmt(amount)} / ${storageCapacity(b, content)}</b></p>${b.delivery ? `<p>${t("Delivery on its way")} · ${Math.ceil(b.delivery.remaining)} s</p>` : ""}${Object.values(b.crates).some((n) => n > 0) ? `<button class="world-buy" data-station="source">${t("Collect delivery at the stockroom.")}</button>` : ""}${content.ingredients
      .filter((i) => used.has(i.id))
      .map((i) => {
        const qty = Math.max(
          1,
          Math.min(4, room, Math.floor(state.money / i.cost)),
        );
        return `<div class="world-row"><div><strong>${escape(l(i.name))}</strong><small>${t("Available")}: ${b.stock[i.id] ?? 0} · ${fmt(i.cost)} $ / 1</small></div><button class="world-buy" data-buy="${i.id}" data-qty="${qty}" ${b.delivery || room < 1 || state.money < i.cost * qty ? "disabled" : ""}>+${qty} · ${fmt(i.cost * qty)} $</button></div>`;
      })
      .join("")}`;
    const rescue = rescueQuote(state, content);
    html += `<p>${t("Supply debt")}: ${fmt(b.rescueOutstanding)} $</p>`;
    if (rescue)
      html += `<div class="world-card"><h3>${t("Emergency ingredients")}</h3><p>${t("Borrow a small kit. Its cost is repaid from future sales.")}</p><button class="world-buy" data-action="rescue">${t("Borrow kit")} · ${fmt(supplyCost(content, rescue))} $</button></div>`;
  }
  if (modal === "team") {
    title = t("Team");
    html = `<p>${t("Employee slots")}: ${b.workers.length} / ${staffLimit(b, content)} · ${t("Wages per minute")}: ${fmt(wagePerMinute(b))} $<br>${t("Unpaid wages")}: ${fmt(b.debt - b.rescueOutstanding)} $</p><p>${t("Staff keep working on credit. Firing does not erase debt.")}</p>${ROLES.map((role) => `<div class="world-row"><span>${icon(role === "cook" ? "chef" : "team")}</span><div><strong>${t(roleNames[role])}</strong><small>${fmt(WAGES[role])} $ / ${t("min")} · ${t("Recruitment fee")} ${fmt(WAGES[role] * 5)} $</small></div><button class="world-buy" data-hire="${role}" ${b.workers.length >= staffLimit(b, content) || state.money < WAGES[role] * 5 ? "disabled" : ""}>${t("Hire")}</button></div>`).join("")}${b.workers.map((w) => `<div class="world-row"><div><strong>${t(roleNames[w.role])} #${w.id}</strong><small>${w.tray.length} / ${trayCapacity(b, content)}</small></div><button class="world-buy world-danger" data-fire="${w.id}">${t("Fire")}</button></div>`).join("")}`;
  }
  if (modal === "expand") {
    title = t("Choose your next improvement");
    const offers = offeredExpansions(state, content);
    html = `<p>${t("Both choices stay available until purchased.")} ${b.owned.length} / ${content.expansions.length}</p><div class="world-choices">${offers.map((e) => `<article class="world-card"><h3>${escape(l(e.name))}</h3><p>${escape(l(e.description))}</p><button class="world-buy" data-expand="${e.id}" ${state.money < e.cost ? "disabled" : ""}>${t("Buy")} · ${fmt(e.cost)} $</button></article>`).join("") || `<p>${t("All improvements purchased. Visit your network to open a new branch.")}</p><button class="world-buy" data-open="network">${t("Network")}</button>`}</div>`;
  }
  if (
    modal === "expand" &&
    offeredExpansions(state, content).length === 1 &&
    b.training < 10
  ) {
    html = html.replace(
      "</div>",
      `<article class="world-card"><h3>${lang === "cs" ? "Trénink pohybu" : "Movement training"}</h3><p>${lang === "cs" ? "Rychlost pohybu +0,2" : "Movement speed +0.2"}</p><button class="world-buy" data-action="train" ${state.money < trainingCost(b) ? "disabled" : ""}>${t("Buy")} · ${fmt(trainingCost(b))} $</button></article></div>`,
    );
  }
  if (modal === "network") {
    title = t("Network");
    html = `<p>${t("New branches start from zero. Your wallet is shared.")}</p><label class="world-option">${t("Choose a cuisine for the next branch")}<select id="new-style">${content.styles.map((s) => `<option value="${s.id}">${escape(l(s.name))}</option>`).join("")}</select></label><div class="world-grid">${Array.from(
      { length: 9 },
      (_, index) => {
        const owned = state.branches[index],
          available =
            index === state.branches.length &&
            state.branches[index - 1]?.owned.length ===
              content.expansions.length;
        return `<article class="world-card ${index === state.active ? "current" : ""}"><small>${t(["City", "Country", "World"][Math.floor(index / 3)])}</small><h3>${t("Branch")} ${index + 1}</h3><p>${owned ? escape(l(styleOf(owned, content).name)) : fmt(branchCost(index)) + " $"}</p><div class="world-progress"><i style="width:${((owned?.owned.length ?? 0) / content.expansions.length) * 100}%"></i></div><small>${owned ? owned.owned.length + " / " + content.expansions.length : t("Finish the previous restaurant first.")}</small><button class="world-buy" data-travel="${index}" ${index === state.active || (!owned && (!available || state.money < branchCost(index))) ? "disabled" : ""}>${t(index === state.active ? "Current branch" : owned ? "Visit" : "Open branch")}</button></article>`;
      },
    ).join("")}</div>`;
  }
  if (modal === "settings") {
    title = t("Settings");
    html = `<label class="world-option">${t("Language")}<select id="language">${locales.map((v) => `<option value="${v.code}" ${v.code === lang ? "selected" : ""}>${v.name}</option>`).join("")}</select></label><div class="world-controls"><button class="world-buy" data-action="export">${t("Export save")}</button><button class="world-buy world-secondary" data-action="import">${t("Import save")}</button></div><div class="world-controls"><button class="world-buy world-secondary" data-action="pause">${t(paused ? "Continue" : "Pause")}</button><button class="world-buy world-secondary" data-action="open">${t(b.open ? "Close for new guests" : "Open restaurant")}</button></div><button class="world-buy world-danger" data-open="reset" style="margin-top:20px">${t("Reset progress")}</button>`;
  }
  if (modal === "reset") {
    title = t("Start over?");
    html = `<p>${t("This deletes only Restaurant World progress.")}</p><div class="world-controls"><button class="world-buy world-secondary" data-action="close">${t("Cancel")}</button><button class="world-buy world-danger" data-action="reset">${t("Confirm reset")}</button></div>`;
  }
  if (modal === "help") {
    title = t("Welcome to your bistro");
    html = `<p class="world-welcome">${t("Walk to a table to take an order. Collect ingredients, prepare, cook and plate. Serve food and drinks, collect the bill and wash the plates.")}</p><p>${t("Tap a label to walk there. WASD, arrows or drag to move.")}</p><div class="world-controls"><button class="world-buy" data-action="close">${t("Let’s cook")}</button></div>`;
  }
  get("dialog-title").textContent = title;
  get("dialog-content").innerHTML = html;
}
root.addEventListener("click", (e) => {
  const el =
    e.target instanceof Element
      ? e.target.closest<HTMLButtonElement>("button")
      : null;
  if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.open) {
    open(d.open);
    return;
  }
  if (d.station) {
    const st = content.stations.find((s) => s.id === d.station)!;
    go({ x: st.x, z: st.z + 1.35 });
    return;
  }
  if (d.table) {
    const pos = content.tables[Number(d.table)];
    go({ x: pos.x, z: pos.z - 1.35 });
    return;
  }
  if (d.order) {
    const o = activeBranch(state).orders.find((o) => o.id === Number(d.order));
    if (o) {
      perform({ type: "select-order", id: o.id });
      const pos = content.tables[o.table];
      go({ x: pos.x, z: pos.z - 1.35 });
    }
    return;
  }
  if (d.cancelOrder) {
    perform({ type: "cancel-order", id: Number(d.cancelOrder) });
    if (modal) renderModal();
    return;
  }
  if (d.buy) {
    perform({ type: "supply", cargo: { [d.buy]: Number(d.qty) } });
    renderModal();
    return;
  }
  if (d.hire) {
    perform({ type: "hire", role: d.hire as (typeof ROLES)[number] });
    renderModal();
    return;
  }
  if (d.fire) {
    perform({ type: "fire", id: Number(d.fire) });
    renderModal();
    return;
  }
  if (d.expand) {
    perform({ type: "expand", id: Number(d.expand) });
    renderModal();
    return;
  }
  if (d.travel) {
    const style = (get("new-style") as HTMLSelectElement).value;
    if (perform({ type: "travel", index: Number(d.travel), style })) close();
    return;
  }
  switch (d.action) {
    case "train":
      perform({ type: "train" });
      renderModal();
      break;
    case "rescue":
      perform({ type: "rescue" });
      renderModal();
      break;
    case "close":
      close();
      break;
    case "overview":
      el.setAttribute("aria-pressed", String(scene.toggleOverview()));
      break;
    case "goal": {
      const g = goal();
      const st = content.stations.find(
        (s) => s.x === g.target.x && s.z === g.target.z,
      );
      go({ x: g.target.x, z: g.target.z + (st ? 1.35 : -1.35) });
      break;
    }
    case "help":
      open("help");
      break;
    case "pause":
      paused = !paused;
      close();
      break;
    case "open":
      perform({ type: "open" });
      renderModal();
      break;
    case "import":
      get("import").click();
      break;
    case "export": {
      const url = URL.createObjectURL(
        new Blob([encode(state, Date.now())], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "restaurant-world.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      break;
    }
    case "reset":
      state = createGame(content);
      paused = false;
      input.reset();
      accumulator = 0;
      protectedSave = false;
      save();
      close();
      break;
  }
});
root.addEventListener("change", async (e) => {
  const el = e.target as HTMLInputElement;
  if (el.id === "language") {
    lang = el.value as Locale;
    try {
      localStorage.setItem("restaurant.world.language", lang);
    } catch {}
    renderModal();
  }
  if (el.id === "import" && el.files?.[0]) {
    try {
      if (el.files[0].size > 2e6) throw new Error();
      const loaded = decode(await el.files[0].text(), content, Date.now());
      if (!loaded) throw new Error();
      state = loaded.state;
      protectedSave = false;
      save();
      close();
      toast(t("Progress restored."));
    } catch {
      toast(t("Invalid save. Original data preserved."));
    }
    el.value = "";
  }
});
dialog.addEventListener("cancel", (e) => {
  e.preventDefault();
  close();
});
let last = performance.now(),
  accumulator = 0,
  lastHud = 0,
  lastSave = 0;
const receipts = new WeakMap(
  state.branches.map((b) => [b, b.revenue] as const),
);
function updateHud(targets: ReturnType<typeof scene.render>) {
  const b = activeBranch(state);
  const previousRevenue = receipts.get(b);
  if (previousRevenue !== undefined && b.revenue > previousRevenue)
    toast(`${t("Bill")} +${fmt(b.revenue - previousRevenue)} $`);
  receipts.set(b, b.revenue);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  get("branch-name").textContent =
    `${l(styleOf(b, content).name)} · ${t("Branch")} ${state.active + 1}`;
  get("wallet-label").textContent = t("Available funds");
  get("money").textContent = fmt(state.money) + " $";
  get("orders-title").textContent = t("Orders");
  get("order-hint").textContent = t(
    "Select a ticket, then follow the kitchen steps.",
  );
  get("mission-label").textContent = t("Your next task");
  get("mission-text").textContent = t(goal().text);
  get("carry").textContent =
    `${b.player.tray.length} / ${trayCapacity(b, content)}`;
  get("carry-items").textContent =
    b.player.tray
      .map((i) =>
        i.kind === "dirty"
          ? t("Dirty dishes")
          : i.kind === "work"
            ? t("Work in progress")
            : l(recipe(i.recipeId).name),
      )
      .join(" · ") || t("Empty tray");
  get("plates").textContent =
    `${t("Clean plates")}: ${b.cleanPlates}/${b.totalPlates}`;
  get("orders").innerHTML =
    b.orders.map(orderHtml).join("") ||
    `<p class="world-empty">${t("No guests yet. Your first table will arrive shortly.")}</p>`;
  root
    .querySelectorAll<HTMLElement>("[data-text]")
    .forEach((el) => (el.textContent = t(el.dataset.text!)));
  const connectors = root.querySelector<SVGSVGElement>(".world-connectors")!;
  connectors.setAttribute(
    "viewBox",
    `0 0 ${canvas.clientWidth} ${canvas.clientHeight}`,
  );
  connectors.innerHTML = targets
    .filter(
      (p) => p.visible && Math.hypot(p.x - p.anchorX, p.y - p.anchorY) > 18,
    )
    .map(
      (p) =>
        `<path d="M${p.anchorX},${p.anchorY} L${p.x},${p.y}"/><circle cx="${p.anchorX}" cy="${p.anchorY}" r="3"/>`,
    )
    .join("");
  for (const target of targets) {
    const el = labels.get(target.id)!;
    el.hidden = !target.visible;
    el.style.transform = `translate(${target.x}px,${target.y}px) translate(-50%,-50%)`;
    if (target.id.startsWith("table-")) {
      const i = Number(target.id.slice(6)),
        o = b.orders.find((o) => o.table === i);
      el.textContent = `${t("Table")} ${i + 1}${o ? " · " + t({ waiting: "Waiting for an order", accepted: "Preparing", eating: "Eating", bill: "Bill", dirty: "Clear the table" }[o.state]) : ""}`;
      if (o?.state === "bill")
        el.textContent += ` · ${fmt(o.lines.reduce((sum, line) => sum + recipe(line.recipeId).price, 0))} $`;
    } else {
      const st = content.stations.find((s) => s.id === target.id)!,
        j = b.jobs.find((j) => j.station === st.id);
      el.innerHTML = `<strong>${escape(l(st.name))}</strong>${j ? `<small>${j.ready ? t("Ready") : Math.ceil(j.remaining) + " s"}</small>` : ""}`;
    }
  }
  for (let i = tableCount(b, content); i < content.tables.length; i++)
    labels.get("table-" + i)!.hidden = true;
}
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!paused && !dialog.open && !document.hidden) {
    accumulator += dt;
    while (accumulator >= 1 / 30) {
      step(state, content, input.read(), 1 / 30);
      accumulator -= 1 / 30;
    }
  } else accumulator = 0;
  const targets = scene.render(
    state,
    dt,
    tableCount(activeBranch(state), content),
  );
  if (now - lastHud > 120) {
    updateHud(targets);
    lastHud = now;
  }
  if (!document.hidden && now - lastSave > 5000) {
    save();
    lastSave = now;
  }
  if (now > toastUntil)
    root.querySelector<HTMLElement>(".world-toast")!.hidden = true;
  requestAnimationFrame(frame);
}
let hiddenAt: number | null = null;
let backgroundRunning = false;
window.addEventListener("blur", () => {
  input.reset();
  activeBranch(state).player.target = null;
});
window.addEventListener("pagehide", () => {
  if (hiddenAt === null) save();
});
document.addEventListener("visibilitychange", () => {
  input.reset();
  activeBranch(state).player.target = null;
  last = performance.now();
  accumulator = 0;
  if (document.hidden) {
    hiddenAt = Date.now();
    backgroundRunning = !paused && !dialog.open;
    save();
  } else if (hiddenAt !== null) {
    if (backgroundRunning) {
      const resumed = decode(encode(state, hiddenAt), content, Date.now());
      if (resumed) state = resumed.state;
    }
    hiddenAt = null;
    save();
  }
});
requestAnimationFrame(frame);
if (protectedSave) toast(t("Invalid save. Original data preserved."));
else if (first) open("help");
if ("serviceWorker" in navigator && location.port !== "4176")
  navigator.serviceWorker.register("./sw.js").catch(() => {});
