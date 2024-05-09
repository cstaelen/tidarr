import test, { expect } from "@playwright/test";
import { mockAPI } from "./utils/mock";

import dotenv from "dotenv";

dotenv.config({ path: "../.env", override: false });

test("Tidarr config : Should display modal error if no tidal token exists", async ({
  page,
}) => {
  await page.route("*/**/check", async (route) => {
    const json = {
      noToken: true,
      output: "",
    };
    await route.fulfill({ json });
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Tidal token not found !" }),
  ).toBeVisible();

  await expect(page.getByText("$ docker exec -it tidarr")).toBeVisible();
  page.getByRole("button", { name: "Close" }).click();

  await expect(
    page.getByRole("heading", { name: "Tidal token not found !" }),
  ).not.toBeVisible();
});

test("Tidarr config : Should see app version", async ({ page }) => {
  mockAPI(page);
  await page.goto("/");

  await expect(page.locator("span")).toContainText(
    `v${process.env.REACT_APP_TIDARR_VERSION}`,
  );
});
