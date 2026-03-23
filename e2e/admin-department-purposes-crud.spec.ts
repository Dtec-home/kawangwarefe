import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

test.describe("Department Purpose CRUD", () => {
  test("staff can create, toggle, and delete purposes", async ({ page }) => {
    await injectSession(page);

    const purposes = [
      {
        id: "p-1",
        name: "Camp Meeting",
        code: "CAMP",
        description: "Camp support",
        isActive: true,
      },
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

      if (query.includes("departmentPurposes")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: { departmentPurposes: purposes } }),
        });
        return;
      }

      if (query.includes("createDepartmentPurpose")) {
        const name = String(body?.variables?.name || "").trim();
        const code = String(body?.variables?.code || "").trim().toUpperCase();
        const description = String(body?.variables?.description || "").trim();

        const duplicate = purposes.some(
          (p) => p.name.toLowerCase() === name.toLowerCase() || p.code.toLowerCase() === code.toLowerCase()
        );

        if (duplicate) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                createDepartmentPurpose: {
                  success: false,
                  message: `Purpose '${name || code}' already exists in this department`,
                  purpose: null,
                },
              },
            }),
          });
          return;
        }

        const created = {
          id: `p-${purposes.length + 1}`,
          name,
          code,
          description,
          isActive: true,
        };
        purposes.push(created);

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              createDepartmentPurpose: {
                success: true,
                message: `Purpose '${name}' created successfully`,
                purpose: created,
              },
            },
          }),
        });
        return;
      }

      if (query.includes("updateDepartmentPurpose")) {
        const purposeId = String(body?.variables?.purposeId || "");
        const isActive = body?.variables?.isActive as boolean | undefined;

        const idx = purposes.findIndex((p) => p.id === purposeId);
        if (idx === -1) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                updateDepartmentPurpose: {
                  success: false,
                  message: "Purpose not found",
                  purpose: null,
                },
              },
            }),
          });
          return;
        }

        if (typeof isActive === "boolean") {
          purposes[idx] = { ...purposes[idx], isActive };
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              updateDepartmentPurpose: {
                success: true,
                message: `Purpose '${purposes[idx].name}' updated successfully`,
                purpose: purposes[idx],
              },
            },
          }),
        });
        return;
      }

      if (query.includes("deleteDepartmentPurpose")) {
        const purposeId = String(body?.variables?.purposeId || "");
        const idx = purposes.findIndex((p) => p.id === purposeId);

        if (idx === -1) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                deleteDepartmentPurpose: {
                  success: false,
                  message: "Purpose not found",
                },
              },
            }),
          });
          return;
        }

        const removed = purposes[idx];
        purposes.splice(idx, 1);

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              deleteDepartmentPurpose: {
                success: true,
                message: `Purpose '${removed.name}' deleted successfully`,
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

    await page.goto("/admin/categories/cat-1/purposes", { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: /department purposes/i })).toBeVisible();
    await expect(page.getByText("Camp Meeting")).toBeVisible();

    await page.getByLabel(/purpose name/i).fill("Transport");
    await page.getByLabel(/purpose code/i).fill("TRAN");
    await page.getByLabel(/description/i).fill("Transport support");
    await page.getByRole("button", { name: /save purpose/i }).click();

    await expect(page.getByText(/created successfully/i)).toBeVisible();
    await expect(page.getByText("Transport", { exact: true })).toBeVisible();

    await page.getByLabel(/purpose name/i).fill("Transport");
    await page.getByLabel(/purpose code/i).fill("TRAN");
    await page.getByRole("button", { name: /save purpose/i }).click();
    await expect(page.getByText(/already exists/i)).toBeVisible();

    const transportRow = page.locator("div.border.rounded-md", { hasText: "Transport" }).first();
    await transportRow.getByRole("button", { name: /deactivate/i }).click();
    await expect(transportRow.getByRole("button", { name: /activate/i })).toBeVisible();

    page.on("dialog", (dialog) => dialog.accept());
    await transportRow.getByRole("button", { name: /delete/i }).click();
    await expect(page.getByText(/deleted successfully/i)).toBeVisible();
    await expect(page.getByText("Transport", { exact: true })).toHaveCount(0);
  });
});
