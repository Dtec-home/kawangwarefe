import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

test.describe("Admin Groups CRUD", () => {
  test("staff can create group and sees duplicate validation message", async ({ page }) => {
    await injectSession(page);

    const groups = [
      { id: "1", name: "Youth" },
      { id: "2", name: "Choir" },
    ];

    await page.route(/\/graphql\/?$/, async (route, request) => {
      const body = request.postDataJSON() as { query?: string; variables?: Record<string, unknown> };
      const query = body?.query || "";

      if (query.includes("currentUserRole")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              currentUserRole: {
                isAuthenticated: true,
                isStaff: true,
                isCategoryAdmin: false,
                isGroupAdmin: false,
                isContentAdmin: false,
                adminCategoryIds: [],
                adminGroupNames: [],
                adminCategories: [],
              },
            },
          }),
        });
        return;
      }

      if (query.includes("groupsList")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: { groupsList: groups } }),
        });
        return;
      }

      if (query.includes("createGroup")) {
        const name = String(body?.variables?.name || "").trim();
        const exists = groups.some((g) => g.name.toLowerCase() === name.toLowerCase());

        if (exists) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                createGroup: {
                  success: false,
                  message: `Group '${name}' already exists`,
                  group: null,
                },
              },
            }),
          });
          return;
        }

        const created = { id: `${groups.length + 1}`, name };
        groups.push(created);

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              createGroup: {
                success: true,
                message: `Group '${name}' created successfully`,
                group: created,
              },
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: null }),
      });
    });

    await page.goto("/admin/groups", { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: /^groups$/i })).toBeVisible();
    await expect(page.getByText("Youth")).toBeVisible();
    await expect(page.getByText("Choir")).toBeVisible();

    await page.getByLabel(/group name/i).fill("Hospitality");
    await page.getByRole("button", { name: /create group/i }).click();

    await expect(page.getByText(/created successfully/i)).toBeVisible();
    await expect(page.locator("div.font-medium", { hasText: "Hospitality" }).first()).toBeVisible();

    await page.getByLabel(/group name/i).fill("Youth");
    await page.getByRole("button", { name: /create group/i }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible();
  });
});
