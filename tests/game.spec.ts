import playwright from "../../RestaurantCommon/node_modules/@playwright/test/index.js";
const { test, expect } = playwright;
import { createGame, encode } from "../../CommonAdvanced/src/engine";
import { content } from "../src/content";
const read = (
  page: import("../../RestaurantCommon/node_modules/@playwright/test/index.js").Page,
) =>
  page.evaluate(() => {
    dispatchEvent(new Event("pagehide"));
    return JSON.parse(localStorage.getItem("restaurant.world.v1")!).state;
  });
test("manual order, meal and drink, bill and reusable plate", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:4176/?test=manual");
  await page.locator('.world-dialog-head [data-action="close"]').click();
  await expect(page.locator("#orders .world-order").first()).toBeVisible();
  let complete = false;
  for (let i = 0; i < 180; i++) {
    await page.locator('[data-action="goal"]').click();
    await page.waitForTimeout(350);
    const s = await read(page),
      b = s.branches[0];
    if (
      b.served >= 1 &&
      b.cleanPlates === b.totalPlates &&
      !b.player.tray.some((i: any) => i.kind === "dirty")
    ) {
      complete = true;
      break;
    }
  }
  expect(complete).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "docs/playable-desktop.png" });
  await page.reload();
  expect((await read(page)).branches[0].served).toBeGreaterThanOrEqual(1);
});
test("two choices, supplies, paid hiring and firing, new cuisine branch, save and mobile", async ({
  page,
}) => {
  const state = createGame(content);
  state.money = 20000;
  state.branches[0].owned = content.expansions.slice(0, -2).map((e) => e.id);
  state.branches[0].cleanPlates += content.expansions
    .slice(0, -2)
    .reduce((n, e) => n + (e.plates ?? 0), 0);
  state.branches[0].totalPlates = state.branches[0].cleanPlates;
  await page.addInitScript(
    (raw) => localStorage.setItem("restaurant.world.v1", raw),
    encode(state, Date.now()),
  );
  await page.goto("http://localhost:4176/?test=network");
  await page.locator('.world-nav [data-open="expand"]').click();
  await expect(page.locator("[data-expand]")).toHaveCount(2);
  await page.locator('[data-expand="12"]').click();
  await expect(page.locator('[data-expand="11"]')).toBeVisible();
  await page.locator('[data-expand="11"]').click();
  await page.locator('.world-dialog-head [data-action="close"]').click();
  await page.locator('.world-nav [data-open="team"]').click();
  await page.locator('[data-hire="cook"]').click();
  await expect(page.locator("[data-fire]")).toHaveCount(1);
  await page.locator("[data-fire]").click();
  await expect(page.locator("[data-fire]")).toHaveCount(0);
  await page.locator('.world-dialog-head [data-action="close"]').click();
  await page.locator('.world-nav [data-open="supply"]').click();
  await page.locator('[data-buy="chicken"]').click();
  expect((await read(page)).branches[0].delivery).not.toBeNull();
  await page.locator('.world-dialog-head [data-action="close"]').click();
  await page.locator('.world-nav [data-open="network"]').click();
  await page.locator("#new-style").selectOption("wok");
  await page.locator('[data-travel="1"]').click();
  let saved = await read(page);
  expect(saved.active).toBe(1);
  expect(saved.branches[1].owned).toEqual([]);
  expect(saved.branches[1].style).toBe("wok");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.world-mobile [data-open="network"]').click();
  await page.locator('[data-travel="0"]').click();
  expect((await read(page)).active).toBe(0);
  await page.locator('[data-action="overview"]').click();
  await page.waitForTimeout(1200);
  expect(await page.locator(".world-connectors path").count()).toBeGreaterThan(
    0,
  );
  await page.screenshot({ path: "docs/playable-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("blur stops walking; reset clears pause; background preserves save timestamp", async ({
  page,
}) => {
  await page.goto("http://localhost:4176/?test=lifecycle");
  await page.locator('.world-dialog-head [data-action="close"]').click();
  await page.locator('[data-station="source"]').first().click();
  await page.evaluate(() => dispatchEvent(new Event("blur")));
  expect((await read(page)).branches[0].player.target).toBeNull();
  await page.locator('[data-open="settings"]').first().click();
  await page.locator('[data-action="pause"]').click();
  await page.locator('[data-open="settings"]').first().click();
  await page.locator('[data-open="reset"]').click();
  await page.locator('[data-action="reset"]').click();
  await expect(page.locator("#orders .world-order").first()).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const stamp = await page.evaluate(() =>
    localStorage.getItem("restaurant.world.v1"),
  );
  await page.waitForTimeout(5300);
  expect(
    await page.evaluate(() => localStorage.getItem("restaurant.world.v1")),
  ).toBe(stamp);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect((await read(page)).branches[0].workers).toHaveLength(0);
});
