import * as T from "three";
import {
  box,
  ball,
  cylinder,
  plant,
  person,
  sign,
  bakeScenery,
  type PersonModel,
} from "../../RestaurantCommon/src/render/models";
import type {
  Branch,
  Content,
  State,
  Item,
} from "../../CommonAdvanced/src/types";
export interface Target {
  id: string;
  x: number;
  y: number;
  visible: boolean;
  anchorX: number;
  anchorY: number;
}
export function createWorldScene(canvas: HTMLCanvasElement, c: Content) {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const scene = new T.Scene();
  scene.background = new T.Color("#bad2bc");
  scene.add(new T.HemisphereLight("#fff5d9", "#7c9985", 2.6));
  const sun = new T.DirectionalLight("#fff0cd", 3);
  sun.position.set(-9, 23, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -22,
    right: 22,
    top: 22,
    bottom: -22,
    near: 0.1,
    far: 70,
  });
  sun.shadow.bias = -0.0007;
  scene.add(sun);
  const camera = new T.OrthographicCamera(-15, 15, 15, -15, 0.1, 120);
  const focus = new T.Vector3(0, 0, 2);
  let overview = false,
    width = 0,
    height = 0,
    identity: Branch | undefined;
  let scenery = new T.Group();
  scene.add(scenery);
  const people = new Map<number, PersonModel>();
  const tableGroups: T.Group[] = [];
  const additions: Array<{ id: number; g: T.Group }> = [];
  const markers = new T.Group();
  scene.add(markers);
  const jobs = new T.Group();
  scene.add(jobs);
  let jobsKey = "";
  function release(g: T.Object3D) {
    g.traverse((o) => {
      if (o instanceof T.Mesh) o.geometry.dispose();
      if (o instanceof T.Sprite) {
        o.material.map?.dispose();
        o.material.dispose();
      }
    });
    g.removeFromParent();
  }
  function dish(parent: T.Object3D, item: Item, b: Branch) {
    const r = c.styles
      .find((v) => v.id === b.style)!
      .recipes.find((r) => r.id === item.recipeId);
    if (item.kind === "dirty") {
      cylinder(parent, 0, 0.05, 0, 0.28, 0.06, "#e8dfc3");
      ball(parent, 0.05, 0.1, 0.03, 0.1, "#aa8b62");
      return;
    }
    if (item.kind === "work") {
      box(parent, 0, 0.12, 0, 0.45, 0.22, 0.35, "#bd9970");
      ball(parent, 0, 0.3, 0, 0.17, r?.color ?? "#a3af76");
      return;
    }
    if (item.kind === "drink") {
      cylinder(parent, 0, 0.21, 0, 0.16, 0.4, "#fff8df");
      cylinder(parent, 0, 0.42, 0, 0.135, 0.025, r?.color ?? "#e8ca74");
      return;
    }
    cylinder(parent, 0, 0.04, 0, 0.34, 0.06, "#fff5d7");
    if (b.style === "wok" || b.style === "curry")
      cylinder(parent, 0, 0.13, 0, 0.28, 0.15, "#e5cc9f", 0.2);
    ball(parent, 0, 0.2, 0, 0.23, r?.color ?? "#b77844", 1, 0.5, 1);
    for (const x of [-0.16, 0.16]) ball(parent, x, 0.19, 0.12, 0.08, "#7a9e4f");
  }
  function rebuild(b: Branch) {
    release(scenery);
    scenery = new T.Group();
    scene.add(scenery);
    tableGroups.length = 0;
    additions.length = 0;
    for (const p of people.values()) release(p.group);
    people.clear();
    const style = c.styles.find((v) => v.id === b.style)!;
    const accent = style.color;
    box(scenery, 0, -0.35, 2, 17.4, 0.65, 20.5, "#8ba994");
    box(scenery, 0, -0.015, 2, 17, 0.06, 20, "#e7dcc1");
    for (let x = -8; x <= 8; x++)
      for (let z = -7; z <= 11; z++)
        box(
          scenery,
          x,
          0.02,
          z,
          0.975,
          0.03,
          0.975,
          (x + z) % 2 ? "#e9dfc7" : "#e4d7b7",
        );
    box(scenery, 0, 0.065, -4, 16.8, 0.04, 6, "#bfcebd");
    box(scenery, 0, 0.65, -8, 17, 1.3, 0.2, "#527766");
    box(scenery, 0, 1.35, -8, 17, 0.15, 0.3, "#254c47");
    for (const x of [-8.4, 8.4])
      box(scenery, x, 0.45, -4, 0.18, 0.9, 8, "#527766");
    const title = sign(style.name.en, "#fff1c7", "#254c47", 6.5, 1.2);
    title.position.set(0, 3.6, -7.9);
    scenery.add(title);
    for (const x of [-3.7, 3.7])
      box(scenery, x, 2, -7.9, 0.12, 3, 0.12, "#254c47");
    for (let i = 0; i < 12; i++)
      box(
        scenery,
        -7.7 + i * 1.4,
        2,
        -7.7,
        1.4,
        0.12,
        0.8,
        i % 2 ? "#fff4d7" : accent,
      );
    for (const def of c.stations) {
      const x = def.x,
        z = def.z;
      box(scenery, x, 0.58, z, 2.5, 1.1, 1.3, "#31574c");
      box(scenery, x, 1.19, z, 2.7, 0.15, 1.45, "#f3e9cd");
      for (const dx of [-0.9, 0.9])
        box(scenery, x + dx, 0.12, z, 0.12, 0.24, 1, "#405d51");
      if (def.capability === "source") {
        for (const dz of [-0.3, 0.25])
          for (const dx of [-0.7, 0, 0.7]) {
            box(scenery, x + dx, 1.38, z + dz, 0.6, 0.25, 0.45, "#bf9460");
            ball(
              scenery,
              x + dx,
              1.58,
              z + dz,
              0.17,
              dx ? "#87a655" : "#d7a855",
            );
          }
        box(scenery, x, 1.95, z - 0.5, 2.5, 0.13, 0.6, "#ba9367");
      }
      if (def.capability === "prep") {
        box(scenery, x, 1.3, z, 1.8, 0.08, 1, "#c29b70");
        for (const dx of [-0.5, 0, 0.5])
          ball(scenery, x + dx, 1.45, z, 0.15, "#cfa85e");
        box(scenery, x + 0.8, 1.4, z, 0.1, 0.04, 0.55, "#a2b2a8");
      }
      if (def.capability === "heat") {
        if (b.style === "bistro") {
          box(scenery, x, 1.72, z - 0.15, 2.3, 1, 1.2, "#bb7851");
          ball(scenery, x, 2.18, z - 0.15, 1.12, "#c18c60", 1, 0.65, 0.6);
          box(scenery, x, 1.65, z + 0.48, 1.6, 0.6, 0.05, "#583c31");
          box(scenery, x, 1.43, z + 0.52, 1.4, 0.13, 0.06, "#f3aa44");
        } else if (b.style === "diner") {
          box(scenery, x, 1.33, z, 2.3, 0.12, 1.1, "#364b44");
          for (let i = 0; i < 10; i++)
            box(
              scenery,
              x - 1 + i * 0.22,
              1.42,
              z,
              0.045,
              0.05,
              1.05,
              "#a4b2a1",
            );
          for (const dx of [-0.6, 0, 0.6])
            cylinder(scenery, x + dx, 1.5, z, 0.2, 0.07, "#854c35");
        } else {
          for (const dx of [-0.65, 0.65]) {
            cylinder(
              scenery,
              x + dx,
              1.4,
              z,
              0.43,
              0.28,
              b.style === "wok" ? "#3c5048" : "#bbaa88",
              b.style === "wok" ? 0.22 : 0.43,
            );
            cylinder(
              scenery,
              x + dx,
              1.56,
              z,
              0.36,
              0.03,
              b.style === "wok" ? "#d9ba73" : "#cf8f39",
            );
            box(scenery, x + dx, 1.5, z + 0.5, 0.1, 0.1, 0.5, "#6b5944");
          }
        }
      }
      if (def.capability === "bar") {
        box(scenery, x - 0.55, 1.63, z - 0.2, 1.05, 0.75, 0.65, accent);
        box(scenery, x - 0.55, 1.68, z + 0.15, 0.7, 0.2, 0.06, "#344f48");
        for (const dx of [0.4, 0.85])
          cylinder(
            scenery,
            x + dx,
            1.53,
            z,
            0.19,
            0.55,
            b.style === "curry" ? "#f2e5c6" : "#c8ddbf",
          );
      }
      if (def.capability === "wash") {
        box(scenery, x, 1.3, z, 1.7, 0.1, 1, "#899f95");
        box(scenery, x, 1.34, z, 1.4, 0.04, 0.7, "#bdd7cc");
        cylinder(scenery, x, 1.63, z - 0.5, 0.055, 0.65, "#aab9aa");
        box(scenery, x, 1.92, z - 0.35, 0.1, 0.1, 0.4, "#aab9aa");
      }
      if (def.capability === "pass") {
        for (const dx of [-0.8, 0.8])
          for (let i = 0; i < 4; i++)
            cylinder(
              scenery,
              x + dx,
              1.32 + i * 0.04,
              z,
              0.3,
              0.035,
              "#fff2d3",
            );
      }
    }
    for (const pos of c.tables) {
      const g = new T.Group();
      cylinder(g, 0, 0.6, 0, 0.14, 1.2, "#31584a");
      cylinder(g, 0, 1.24, 0, 0.8, 0.17, "#e8c278");
      for (const x of [-1.05, 1.05]) {
        box(g, x, 0.5, 0, 0.55, 0.16, 0.55, accent);
        box(g, x, 0.85, x < 0 ? -0.25 : 0.25, 0.55, 0.6, 0.1, accent);
        for (const z of [-0.17, 0.17])
          box(g, x, 0.2, z, 0.1, 0.45, 0.1, "#31584a");
      }
      cylinder(g, 0, 1.43, 0, 0.09, 0.2, "#fff1d0");
      ball(g, 0, 1.62, 0, 0.13, "#7a995b");
      bakeScenery(g);
      g.position.set(pos.x, 0, pos.z);
      scenery.add(g);
      tableGroups.push(g);
    }
    for (const id of [3, 4, 6, 8, 10, 12]) {
      const g = new T.Group();
      if (id === 3) {
        box(g, -7, 0.6, 8, 1.6, 1.2, 0.6, accent);
        box(g, -7, 1.3, 8, 1.7, 0.1, 0.75, "#efd9ae");
      }
      if (id === 4) {
        for (const y of [0.4, 1.1, 1.8]) {
          box(g, -7.7, y, -2, 1, 0.12, 1.5, "#b19068");
          for (const z of [-2.4, -1.7])
            box(g, -7.7, y + 0.25, z, 0.7, 0.4, 0.5, "#d6bc8b");
        }
      }
      if (id === 6) {
        box(g, 6, 0.8, 0, 1.2, 0.12, 0.8, "#d2b287");
        box(g, 6, 0.35, 0, 1.2, 0.1, 0.8, "#d2b287");
        for (const x of [5.5, 6.5])
          cylinder(g, x, 0.12, 0, 0.12, 0.2, "#40584b");
      }
      if (id === 8) {
        box(g, -7, 0.6, 10, 1.6, 1.2, 0.8, "#719687");
        for (let i = 0; i < 6; i++)
          cylinder(g, -7, 1.25 + i * 0.04, 10, 0.45, 0.035, "#fff3cf");
      }
      if (id === 10) {
        box(g, 7, 0.85, -2, 1.4, 1.7, 1, "#b8c8b5");
        box(g, 7.4, 0.9, -1.47, 0.08, 0.5, 0.05, "#55786a");
      }
      if (id === 12) {
        for (const x of [-2, 2]) {
          cylinder(g, x, 1, 11.3, 0.16, 2, "#d3ad58");
          ball(g, x, 2.15, 11.3, 0.32, "#ffe29a");
        }
        const trophy = sign("★ ★ ★", "#fff1c7", "#b38d3f", 2.5, 0.6);
        trophy.position.set(0, 4.7, -7.8);
        g.add(trophy);
      }
      scenery.add(g);
      additions.push({ id, g });
    }
    for (const [x, z] of [
      [-8, 3],
      [-8, 11],
      [7.8, 11],
      [7.8, 2],
    ])
      plant(scenery, x, z, true);
    for (const [x, z] of [
      [-11, -3],
      [-11, 10],
      [12, -5],
      [13, 12],
    ]) {
      cylinder(scenery, x, 1, z, 0.23, 2, "#ad8a5d");
      ball(scenery, x, 2.5, z, 1.1, "#7fa173");
    }
    const wing = new T.Group();
    box(wing, 9, -0.3, 7, 2.5, 0.6, 10, "#8ba994");
    box(wing, 9, 0.025, 7, 2.5, 0.05, 10, "#e5d6b7");
    for (const z of [2, 12]) plant(wing, 9.5, z, true);
    scenery.add(wing);
    additions.push({ id: 9, g: wing });
    identity = b;
    jobsKey = "";
  }
  function pose(
    model: PersonModel,
    actor: { x: number; z: number; angle: number; tray: Item[] },
    time: number,
    b: Branch,
  ) {
    const moving =
      Math.hypot(actor.x - model.lastX, actor.z - model.lastZ) > 0.002;
    model.lastX = actor.x;
    model.lastZ = actor.z;
    model.group.position.set(
      actor.x,
      moving ? Math.abs(Math.sin(time * 10)) * 0.035 : 0,
      actor.z,
    );
    model.group.rotation.y = actor.angle;
    model.left.rotation.x = moving ? Math.sin(time * 10) * 0.5 : 0;
    model.right.rotation.x = -model.left.rotation.x;
    const key = JSON.stringify(actor.tray);
    if (model.stack.userData.key !== key) {
      for (const o of [...model.stack.children]) release(o);
      actor.tray.forEach((item, i) => {
        const g = new T.Group();
        dish(g, item, b);
        g.position.set(i % 2 === 0 ? -0.18 : 0.2, Math.floor(i / 2) * 0.32, 0);
        model.stack.add(g);
      });
      model.stack.userData.key = key;
    }
  }
  function render(state: State, dt: number, count: number) {
    const b = state.branches[state.active];
    if (identity !== b) rebuild(b);
    if (canvas.clientWidth !== width || canvas.clientHeight !== height) {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      renderer.setSize(width, height, false);
    }
    const aspect = width / Math.max(1, height),
      portrait = aspect < 0.85;
    const view = overview ? Math.max(31, 31 / aspect) : portrait ? 22 : 26;
    camera.left = (-view * aspect) / 2;
    camera.right = (view * aspect) / 2;
    camera.top = view / 2;
    camera.bottom = -view / 2;
    camera.updateProjectionMatrix();
    focus.lerp(
      new T.Vector3(
        portrait && !overview ? b.player.x * 0.75 : 0,
        0,
        portrait && !overview ? b.player.z * 0.6 : 2,
      ),
      Math.min(1, dt * 5),
    );
    camera.position.copy(focus).add(new T.Vector3(14, 23, 22));
    camera.lookAt(focus);
    tableGroups.forEach((g, i) => (g.visible = i < count));
    additions.forEach((a) => (a.g.visible = b.owned.includes(a.id)));
    const ids = new Set<number>();
    for (const actor of [b.player, ...b.workers]) {
      ids.add(actor.id);
      let m = people.get(actor.id);
      if (!m) {
        m = person(
          actor.role === "player"
            ? "#ba643e"
            : actor.role === "cook"
              ? "#e2d4ad"
              : actor.role === "dishwasher"
                ? "#7097aa"
                : "#82a17c",
          actor.role === "player" || actor.role === "cook",
        );
        scene.add(m.group);
        people.set(actor.id, m);
      }
      pose(m, actor, b.time, b);
    }
    for (const o of b.orders) {
      if (o.state === "dirty") continue;
      const id = -o.id - 100;
      ids.add(id);
      let m = people.get(id);
      if (!m) {
        m = person(["#dca25a", "#a17aa6", "#6a9f9a", "#af795d"][o.id % 4]);
        scene.add(m.group);
        people.set(id, m);
      }
      const t = c.tables[o.table];
      pose(
        m,
        { x: t.x - 1.05, z: t.z, angle: Math.PI / 2, tray: [] },
        b.time,
        b,
      );
    }
    for (const [id, m] of people)
      if (!ids.has(id)) {
        release(m.group);
        people.delete(id);
      }
    const key = JSON.stringify([
      b.jobs.map((j) => [j.station, j.ready, j.item.recipeId]),
      b.orders.map((o) => [
        o.id,
        o.state,
        o.lines.filter((l) => l.state === "served").length,
      ]),
    ]);
    if (key !== jobsKey) {
      for (const o of [...jobs.children]) release(o);
      for (const job of b.jobs) {
        const st = c.stations.find((s) => s.id === job.station)!;
        const g = new T.Group();
        dish(g, { ...job.item, kind: job.ready ? job.item.kind : "work" }, b);
        g.position.set(st.x, 1.35, st.z);
        jobs.add(g);
      }
      for (const o of b.orders) {
        if (!["eating", "bill", "dirty"].includes(o.state)) continue;
        const pos = c.tables[o.table];
        const g = new T.Group();
        dish(
          g,
          {
            kind: o.state === "dirty" ? "dirty" : "meal",
            recipeId: o.lines[0]?.recipeId ?? "",
            lineId: 0,
            orderId: o.id,
            stage: 0,
          },
          b,
        );
        g.position.set(pos.x, 1.36, pos.z);
        jobs.add(g);
      }
      jobsKey = key;
    }
    const targets: Target[] = [
      ...c.stations.map((st) => ({ id: st.id, pos: st })),
      ...c.tables.slice(0, count).map((pos, i) => ({ id: "table-" + i, pos })),
    ].map((v) => {
      const p = new T.Vector3(v.pos.x, 1.9, v.pos.z + 0.55).project(camera);
      return {
        id: v.id,
        anchorX: ((p.x + 1) * width) / 2,
        anchorY: ((1 - p.y) * height) / 2,
        x: ((p.x + 1) * width) / 2,
        y: ((1 - p.y) * height) / 2,
        visible: p.x > -0.95 && p.x < 0.95 && p.y > -0.8 && p.y < 0.8,
      };
    });
    if (portrait) {
      const slots: Array<{ x: number; y: number }> = [];
      for (let y = 105; y < height - 90; y += 48)
        for (const x of [72, width - 72]) slots.push({ x, y });
      for (const t of targets
        .filter((t) => overview || t.visible)
        .sort((a, b) => a.y - b.y)) {
        if (!slots.length) break;
        let index = 0,
          cost = Infinity;
        slots.forEach((p, i) => {
          const n = (t.x - p.x) ** 2 + (t.y - p.y) ** 2;
          if (n < cost) {
            index = i;
            cost = n;
          }
        });
        Object.assign(t, slots.splice(index, 1)[0], { visible: true });
      }
    }
    renderer.render(scene, camera);
    return targets;
  }
  return {
    render,
    toggleOverview() {
      overview = !overview;
      return overview;
    },
    dispose() {
      renderer.dispose();
      release(scenery);
    },
  };
}
