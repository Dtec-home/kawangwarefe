/**
 * RA-2: the "Move gift…" row action on the admin contributions list is for a
 * treasurer or an admin only, needs a payment group id, and hands the whole
 * payment's lines to the dialog.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { role, dialogProps } = vi.hoisted(() => ({
  role: { isStaff: true, isCategoryAdmin: false, isGroupAdmin: false, isAdmin: false, isTreasurer: false },
  dialogProps: { current: null as null | Record<string, unknown> },
}));

const line = (id: string, amount: string, category: { id: string; name: string; code: string }, extra = {}) => ({
  id,
  amount,
  status: "completed",
  channel: "paybill",
  transactionDate: "2026-11-20T10:30:00Z",
  notes: null,
  manualReceiptNumber: null,
  receiptNumber: null,
  contributionGroupId: "g-1",
  purposeName: null,
  member: { id: "m1", fullName: "John Kamau", phoneNumber: "254712345678", memberNumber: null },
  category,
  mpesaTransaction: null,
  ...extra,
});

vi.mock("@apollo/client/react", () => ({
  useQuery: () => ({
    data: {
      contributionCategories: [],
      contributionStats: null,
      allContributions: {
        items: [
          line("c1", "600.00", { id: "3", name: "Tithe", code: "TITHE" }),
          line("c2", "400.00", { id: "2", name: "Building Fund", code: "BUILD" }, { purposeName: "Roof" }),
          line("c3", "50.00", { id: "3", name: "Tithe", code: "TITHE" }, { contributionGroupId: null, member: { id: "m2", fullName: "No Group", phoneNumber: "254700000000", memberNumber: null } }),
        ],
        total: 3,
        hasMore: false,
      },
      myGroupNames: [],
      groupContributions: [],
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useMutation: () => [vi.fn(), { loading: false }],
}));
vi.mock("@/lib/hooks/use-user-role", () => ({ useUserRole: () => role }));
vi.mock("@/components/layouts/admin-layout", () => ({
  AdminLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("@/hooks/use-tour", () => ({ useTour: () => ({ start: vi.fn(), isReady: false }) }));
vi.mock("@/components/fund-transfers/move-gift-dialog", () => ({
  MoveGiftDialog: (props: Record<string, unknown>) => {
    dialogProps.current = props;
    return <div role="dialog" aria-label="Move gift" />;
  },
}));

import ContributionsPage from "@/app/(dashboard)/admin/contributions/page";

beforeEach(() => {
  role.isAdmin = false;
  role.isTreasurer = false;
  dialogProps.current = null;
});

describe("Move gift… on a contribution row", () => {
  it("is hidden from staff who are neither treasurer nor admin", () => {
    render(<ContributionsPage />);
    expect(screen.queryAllByRole("button", { name: "Move gift…" })).toHaveLength(0);
  });

  it("a treasurer moves the whole payment; rows without a payment id get no action", () => {
    role.isTreasurer = true;
    render(<ContributionsPage />);
    // One grouped payment (g-1) × mobile + desktop views; the ungrouped row has none.
    const buttons = screen.getAllByRole("button", { name: "Move gift…" });
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[0]);
    expect(screen.getByRole("dialog", { name: "Move gift" })).toBeInTheDocument();
    expect(dialogProps.current?.contributionGroupId).toBe("g-1");
    expect(dialogProps.current?.lines).toEqual([
      { departmentId: "3", departmentName: "Tithe", purposeName: null, amount: "600.00" },
      { departmentId: "2", departmentName: "Building Fund", purposeName: "Roof", amount: "400.00" },
    ]);
  });

  it("an admin sees it too", () => {
    role.isAdmin = true;
    render(<ContributionsPage />);
    expect(screen.getAllByRole("button", { name: "Move gift…" }).length).toBeGreaterThan(0);
  });
});
