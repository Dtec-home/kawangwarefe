/**
 * Mocked-GraphQL fakes for the department-roles journeys
 * (DEPARTMENT_REPORTS/05_DEPARTMENT_ROLES_PLAN.md, R1-R4).
 *
 * - `fakeGivePage`  — the public give page; `contributionCategories(forGiving: true)`
 *                     leaves out Elders, the admin list does not (R2).
 * - `fakeClerk`     — a clerk-only user on the department-report screens (R4),
 *                     built on the DR-8 staff fake's read-only `clerk` persona.
 * - `fakeDeptAdmins`— the admin on Dept. Admins assigning a leader with a profile (R3).
 *
 * Only the Next dev server is needed.
 */

import type { Page } from "@playwright/test";
import { injectSession } from "./auth";
import { fakeDepartmentReports, type FakeState } from "./department-reports-staff";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "POST, OPTIONS",
};

type Call = { op: string; query: string; variables: Record<string, unknown> };

function department(id: string, name: string, acceptsGiving: boolean) {
  return {
    __typename: "ContributionCategoryType",
    id,
    name,
    code: name.slice(0, 6).toUpperCase(),
    description: "",
    isActive: true,
    routingMode: "TOP_LEVEL",
    fallbackIfNoGroup: null,
    audience: null,
    hasAutoSplit: false,
    tracksMemberIdentifier: false,
    identifierLabel: null,
    identifierFormat: null,
    allowedGroups: [],
    acceptsGiving,
  };
}

const TITHE = department("1", "Tithe", true);
const OFFERING = department("2", "Offering", true);
const ELDERS = department("9", "Elders", false);

async function routeGraphQL(
  page: Page,
  handler: (call: Call, respond: (data: unknown) => Promise<void>) => Promise<void>,
) {
  await page.route(/\/graphql\/?$/, async (route, request) => {
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    let body: { query?: string; operationName?: string; variables?: Record<string, unknown> } = {};
    try {
      body = request.postDataJSON() ?? {};
    } catch {
      /* not JSON */
    }
    const respond = (data: unknown) =>
      route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify({ data }) });
    await handler({ op: body.operationName ?? "", query: body.query ?? "", variables: body.variables ?? {} }, respond);
  });
}

// ── Give page (R2) ──────────────────────────────────────────────────────

export interface GivePageState {
  categoryQueries: string[];
}

export async function fakeGivePage(page: Page): Promise<GivePageState> {
  const state: GivePageState = { categoryQueries: [] };
  await routeGraphQL(page, async ({ query }, respond) => {
    if (query.includes("contributionCategories")) {
      state.categoryQueries.push(query);
      // The server filters with forGiving: true (Elders accepts no giving).
      const giving = /forGiving:\s*true/.test(query);
      return respond({ contributionCategories: giving ? [TITHE, OFFERING] : [TITHE, OFFERING, ELDERS] });
    }
    if (query.includes("departmentPurposes")) return respond({ departmentPurposes: [] });
    return respond(null);
  });
  return state;
}

// ── Clerk (R4) ──────────────────────────────────────────────────────────

export function fakeClerk(page: Page): Promise<FakeState> {
  return fakeDepartmentReports(page, { persona: "clerk" });
}

// ── Dept. Admins with a leader profile (R3) ─────────────────────────────

interface Profile {
  title: string;
  bio: string;
  photoUrl: string;
  showOnWebsite: boolean;
  displayOrder: number;
}

export interface DeptAdminsState {
  assignments: Array<{ id: string; memberId: string; categoryId: string; profile: Profile | null }>;
  calls: Call[];
}

const ADMIN_ROLE = {
  __typename: "UserRoleInfo",
  isAuthenticated: true,
  isStaff: true,
  isCategoryAdmin: false,
  isGroupAdmin: false,
  isContentAdmin: false,
  canSendBulkMessage: true,
  isRecorder: false,
  canVoidReceipts: true,
  isAdmin: true,
  isTreasurer: false,
  isClerk: false,
  adminCategoryIds: [],
  ledDepartmentIds: [],
  adminGroupNames: [],
  adminCategories: [],
};

const MEMBERS = [
  {
    __typename: "MemberType",
    id: "m3",
    fullName: "Mary Atieno",
    firstName: "Mary",
    lastName: "Atieno",
    phoneNumber: "254700000003",
    memberNumber: null,
    email: null,
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    roles: [],
    groups: [],
    departmentIdentifiers: [],
  },
];

export async function fakeDeptAdmins(page: Page): Promise<DeptAdminsState> {
  const state: DeptAdminsState = { assignments: [], calls: [] };
  await injectSession(page, { fullName: "Test admin" });

  const categoryAdmins = () =>
    state.assignments.map((a) => {
      const member = MEMBERS.find((m) => m.id === a.memberId)!;
      const category = [TITHE, OFFERING, ELDERS].find((c) => c.id === a.categoryId)!;
      return {
        __typename: "CategoryAdminType",
        id: a.id,
        member: {
          __typename: "MemberType",
          id: member.id,
          fullName: member.fullName,
          phoneNumber: member.phoneNumber,
          memberNumber: member.memberNumber,
          email: member.email,
        },
        category: { __typename: "ContributionCategoryType", id: category.id, name: category.name, code: category.code, description: "" },
        assignedBy: null,
        assignedAt: "2026-11-25T08:00:00Z",
        isActive: true,
        profile: a.profile ? { __typename: "LeaderProfileType", ...a.profile } : null,
      };
    });

  await routeGraphQL(page, async (call, respond) => {
    const { op, query, variables } = call;
    if (query.includes("currentUserRole")) return respond({ currentUserRole: ADMIN_ROLE });
    // The page tour would cover the form: mark it seen.
    if (query.includes("isTutorialCompleted")) return respond({ isTutorialCompleted: true });
    if (op) state.calls.push(call);
    switch (op) {
      case "GetContributionCategories":
        return respond({ contributionCategories: [TITHE, OFFERING, ELDERS] });
      case "GetMembersList":
        return respond({ membersList: { __typename: "MemberListType", items: MEMBERS, total: MEMBERS.length, hasMore: false } });
      case "GetCategoryAdmins":
        return respond({ categoryAdmins: categoryAdmins() });
      case "AssignCategoryAdmin": {
        const profile = (variables.profile as Profile | null) ?? null;
        state.assignments.push({
          id: `ca${state.assignments.length + 1}`,
          memberId: String(variables.memberId),
          categoryId: String(variables.categoryId),
          profile: profile ? { title: "", bio: "", photoUrl: "", showOnWebsite: true, displayOrder: 0, ...profile } : null,
        });
        const created = categoryAdmins()[state.assignments.length - 1];
        return respond({ assignCategoryAdmin: { success: true, message: "Mary Atieno is now a department admin", categoryAdmin: created } });
      }
      case "UpdateDepartmentLeaderProfile": {
        const a = state.assignments.find((x) => x.id === String(variables.categoryAdminId))!;
        a.profile = variables.profile as Profile;
        const updated = categoryAdmins().find((x) => x.id === a.id)!;
        return respond({
          updateDepartmentLeaderProfile: {
            success: true,
            message: "Profile saved",
            categoryAdmin: { __typename: "CategoryAdminType", id: a.id, profile: updated.profile },
          },
        });
      }
      default:
        return respond(null);
    }
  });
  return state;
}
