import test, { expect } from "@playwright/test";

import { goToHome } from "./utils/helpers";
import { mockConfigAPI, mockRelease } from "./utils/mock";

test("Tidarr Home : Should see 'Tidal trends' tab content", async ({
  page,
}) => {
  await mockConfigAPI(page);
  await mockRelease(page);

  await goToHome(page);
  await page.evaluate("localStorage.clear()");

  await expect(page.getByRole("heading")).toContainText("Tidarr");

  await expect(page.getByText("Tidal Trends")).toBeVisible();
});
