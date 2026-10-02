import playwright from "../../RestaurantCommon/node_modules/@playwright/test/index.js";
const { test, expect } = playwright;
import { createGame, encode, decode } from "../../CommonAdvanced/src/engine";
import { content } from "../src/content";
const read = (page: any) =>
  page.evaluate(() => {
    dispatchEvent(new Event("pagehide"));
    return JSON.parse(localStorage.getItem("restaurant.world.v1")!).state;
  });
function fixture(full = false) {
  const s = createGame(content),
    b = s.branches[0];
  b.open = false;
  b.cleanPlates = full ? 1 : 4;
  s.nextId = 10;
  b.orders = [
    {
      id: 2,
      table: 0,
      state: "bill",
      timer: 0,
      billed: false,
      lines: [{ id: 3, recipeId: "roast", state: "served", reserved: {} }],
    },
  ];
  if (full)
    for (let i = 0; i < 4; i++)
      b.player.tray.push({
        kind: "dirty",
        orderId: 0,
        lineId: 0,
        recipeId: "",
        stage: 0,
      });
  else {
    b.orders.push({
      id: 4,
      table: 1,
      state: "eating",
      timer: 20,
      billed: false,
      lines: [{ id: 5, recipeId: "salad", state: "served", reserved: {} }],
    });
    b.selectedOrder = 4;
  }
  if (!decode(encode(s, 1000), content, 1000)) throw Error("Invalid fixture");
  return s;
}
test("manual bill has priority over eating, shows payment and dirty cleanup", async ({
  page,
}) => {
  await page.addInitScript((raw) => {
    if (!localStorage.getItem("restaurant.world.v1"))
      localStorage.setItem("restaurant.world.v1", raw);
  }, encode(fixture()));
  await page.goto("http://localhost:4176/?test=payment");
  await expect(page.locator("#mission-text")).toHaveText("Účet");
  await expect(page.locator('[data-table="0"]')).toContainText("27 $");
  await page.locator('[data-action="goal"]').click();
  await expect.poll(async () => (await read(page)).branches[0].served).toBe(1);
  await expect(page.locator(".world-toast")).toContainText("+27");
  await expect
    .poll(async () => (await read(page)).branches[0].player.tray[0]?.kind)
    .toBe("dirty");
  await page.locator('[data-action="goal"]').click();
  await expect
    .poll(async () => (await read(page)).branches[0].player.tray.length, {
      timeout: 15000,
    })
    .toBe(0);
  expect((await read(page)).money).toBe(277);
});
test("full tray still collects money once; wash, return and clear survive reload", async ({
  page,
}) => {
  await page.addInitScript(
    (raw) => {
      if (!localStorage.getItem("restaurant.world.v1"))
        localStorage.setItem("restaurant.world.v1", raw);
    },
    encode(fixture(true)),
  );
  await page.goto("http://localhost:4176/?test=full-tray");
  await page.locator('[data-table="0"]').click();
  await expect.poll(async () => (await read(page)).branches[0].served).toBe(1);
  let s = await read(page);
  expect(s.money).toBe(277);
  expect(s.branches[0].orders[0].state).toBe("dirty");
  expect(s.branches[0].player.tray.length).toBe(4);
  await page.reload();
  await page.locator('[data-action="goal"]').click();
  await expect
    .poll(async () => (await read(page)).branches[0].player.tray.length, {
      timeout: 20000,
    })
    .toBe(0);
  await page.locator('[data-action="goal"]').click();
  await expect
    .poll(async () => (await read(page)).branches[0].orders.length, {
      timeout: 15000,
    })
    .toBe(0);
  await page.locator('[data-action="goal"]').click();
  await expect
    .poll(async () => (await read(page)).branches[0].cleanPlates, {
      timeout: 15000,
    })
    .toBe(6);
  s = await read(page);
  expect(s.money).toBe(277);
  expect(s.branches[0].served).toBe(1);
  expect(decode(encode(s), content, Date.now())).not.toBeNull();
});
test("ready food on the pass is collected instead of returning to ingredients", async ({
  page,
}) => {
  const s = createGame(content),
    b = s.branches[0];
  b.open = false;
  s.nextId = 10;
  b.cleanPlates = 5;
  b.orders = [
    {
      id: 2,
      table: 0,
      state: "accepted",
      timer: 0,
      billed: false,
      lines: [{ id: 3, recipeId: "roast", state: "ready", reserved: {} }],
    },
  ];
  b.shelf = [
    { kind: "meal", orderId: 2, lineId: 3, recipeId: "roast", stage: 2 },
  ];
  b.selectedOrder = 2;
  expect(decode(encode(s, 1000), content, 1000)).not.toBeNull();
  await page.addInitScript(
    (raw) => localStorage.setItem("restaurant.world.v1", raw),
    encode(s),
  );
  await page.goto("http://localhost:4176/?test=ready-pass");
  await expect(page.locator("#mission-text")).toHaveText("Hotovo");
  await page.locator('[data-action="goal"]').click();
  await expect
    .poll(
      async () => {
        const b = (await read(page)).branches[0];
        return b.player.tray[0]?.kind ?? JSON.stringify(b.player);
      },
      { timeout: 12000 },
    )
    .toBe("meal");
  await expect(page.locator("#mission-text")).toHaveText("Obsluž stůl");
  await page.locator('[data-action="goal"]').click();
  await expect
    .poll(async () => (await read(page)).branches[0].orders[0]?.state)
    .toBe("eating");
});
