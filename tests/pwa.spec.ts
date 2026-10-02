import playwright from "../../RestaurantCommon/node_modules/@playwright/test/index.js";
const { test, expect } = playwright;

test("production installation reloads offline with preserved progress", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://localhost:4186/?verify=offline");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    dispatchEvent(new Event("pagehide"));
  });
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem("restaurant.world.v1")!).state,
  );
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("canvas#world")).toBeVisible();
  await expect(page.locator("#money")).toContainText("250");
  const after = await page.evaluate(
    () => JSON.parse(localStorage.getItem("restaurant.world.v1")!).state,
  );
  expect(after.id).toBe(before.id);
  expect(after.branches[0].owned).toEqual(before.branches[0].owned);
  expect(errors).toEqual([]);
  await context.setOffline(false);
});
