/**
 * Yearly department reports (DEPARTMENT_REPORTS plan): API shortcuts for the
 * Given steps, and the page locators the UI promises in 02_CONTRACTS.md § UI.
 */

import { Page, expect } from "@playwright/test";
import { Backend } from "./backend";
import { World } from "./fixtures";
import { tokenOnce } from "./desk";

const REPORT_ID = (code: string) => `deptReport.${code}`;

async function call(backend: Backend, token: string, query: string, variables: Record<string, unknown>) {
  const result = await backend.graphql(query, variables, token);
  expect(result.errors, JSON.stringify(result.errors)).toBeUndefined();
  const payload = Object.values(result.data as Record<string, Record<string, unknown>>)[0];
  expect(payload.__typename, JSON.stringify(payload)).not.toBe("ReportError");
  return payload;
}

export function departmentCode(world: World, name: string): string {
  const entry = Object.entries(world.seed!.departments).find(([, d]) => d.name === name);
  if (!entry) throw new Error(`no seeded department "${name}"`);
  return entry[0];
}

export async function tokenOfRole(backend: Backend, world: World, role: string) {
  return tokenOnce(backend, world.values, world.seed!.people[role].phone);
}

export async function openPeriodThroughApi(
  backend: Backend, world: World, label: string, start: string, end: string, due: string,
) {
  const token = await tokenOfRole(backend, world, "admin");
  const period = await call(backend, token, `
    mutation($input: ReportingPeriodInput!) {
      openReportingPeriod(input: $input) { __typename ... on ReportingPeriod { id } ... on ReportError { code message } }
    }`, { input: { label, startDate: start, endDate: end, dueDate: due } });
  world.values[`period.${label}`] = String(period.id);
}

const RESULT = `__typename ... on DepartmentReport { id } ... on ReportError { code message }`;

/** Start, fill every required section and submit, as `role`, through the API. */
export async function submitCompleteReport(backend: Backend, world: World, role: string, department: string) {
  const token = await tokenOfRole(backend, world, role);
  const code = departmentCode(world, department);
  const periodId = Object.entries(world.values).find(([k]) => k.startsWith("period."))![1];
  const report = await call(backend, token,
    `mutation($p: ID!, $d: ID!) { startDepartmentReport(periodId: $p, departmentId: $d) { ${RESULT} } }`,
    { p: periodId, d: String(world.seed!.departments[code].id) });
  const id = String(report.id);
  world.values[REPORT_ID(code)] = id;
  const text = `mutation($id: ID!, $s: String!, $t: String!) { saveReportText(id: $id, section: $s, text: $t) { ${RESULT} } }`;
  const items = `mutation($id: ID!, $k: String!, $i: [ReportItemInput!]!) { saveReportItems(id: $id, kind: $k, items: $i) { ${RESULT} } }`;
  await call(backend, token, text, { id, s: "introduction", t: "We look after the church buildings." });
  await call(backend, token, items, { id, k: "objective", i: [{ text: "Repair the roof" }] });
  await call(backend, token, items, { id, k: "achievement", i: [{ text: "Roof repaired in March" }] });
  await call(backend, token, text, { id, s: "conclusion", t: "Thank you to every giver." });
  await call(backend, token, `mutation($id: ID!) { submitDepartmentReport(id: $id) { ${RESULT} } }`, { id });
}

export function reportIdOf(world: World, department: string): string {
  return world.values[REPORT_ID(departmentCode(world, department))];
}

// ── UI locators (02_CONTRACTS.md § UI test contract) ─────────────────────
export const reportCard = (page: Page, department: string) =>
  page.getByTestId("dept-report-card").filter({ hasText: department });

export const trackerRow = (page: Page, department: string) =>
  page.getByTestId("dept-report-tracker-row").filter({ hasText: department });

export const sectionStep = (page: Page, title: string | RegExp) =>
  page.getByTestId("dept-report-stepper").getByRole("button", { name: title });

export async function goToSection(page: Page, title: string | RegExp) {
  await sectionStep(page, title).click();
}
