/**
 * Web binding for `fund-transfers/fund_transfers.feature` (FT-2, RA-2).
 *
 * Renders the real Fund transfers screen, the department report money table
 * and the Move gift dialog against Apollo's MockedProvider with the production
 * documents from lib/graphql/fund-transfers.ts, so variables must match what
 * the backend receives.
 */

import { defineFeature, loadFeature } from "jest-cucumber";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing/react";
import { afterEach, expect, vi } from "vitest";

const { toast, role } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
  role: { isAdmin: false, isTreasurer: true, ledDepartmentIds: [] as string[] },
}));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/hooks/use-user-role", () => ({ useUserRole: () => role }));

import { FundTransfersView } from "@/components/fund-transfers/fund-transfers-view";
import { MoveGiftDialog } from "@/components/fund-transfers/move-gift-dialog";
import { FinancialTable } from "@/components/department-reports/editor/financial-table";
import { APPROVE_FUND_TRANSFER, REJECT_FUND_TRANSFER, REQUEST_FUND_TRANSFER } from "@/lib/graphql/fund-transfers";
import type { FundTransfer, FundTransferInput } from "@/lib/fund-transfers/types";
import { nairobiToday } from "@/lib/treasury/entry-dates";
import type { FinancialStatement } from "@/lib/department-reports/types";

import {
  DEPARTMENTS,
  balanceMock,
  categoriesMock,
  makeTransfer,
  previewMock,
  previewOk,
  purpose,
  purposesMock,
  reallocateMock,
  transfersMock,
} from "../../components/fund-transfers/fixtures";
import { makeStatement } from "../../components/department-reports/staff/fixtures";

const feature = loadFeature("./fund_transfers.feature", { loadRelativePath: true });
const TODAY = nairobiToday();
const idOf = (name: string) => DEPARTMENTS.find((d) => d.name === name)!.id;

afterEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
});

type World = {
  list: FundTransfer[];
  requested: FundTransferInput[];
  balances: MockedResponse[];
  moved: boolean;
};
const newWorld = (): World => ({ list: [], requested: [], balances: [], moved: false });

function renderTransfers(world: World, extra: MockedResponse[] = []) {
  render(
    <MockedProvider
      mocks={[
        categoriesMock(),
        transfersMock(() => world.list),
        ...["1", "2", "3"].map((id) => purposesMock(id, [])),
        ...world.balances,
        ...extra,
      ]}
    >
      <FundTransfersView />
    </MockedProvider>,
  );
}

const requestMock = (world: World, input: FundTransferInput): MockedResponse => ({
  request: { query: REQUEST_FUND_TRANSFER, variables: { input } },
  result: () => {
    world.requested.push(input);
    const created = makeTransfer({ id: "20", amount: `${input.amount}.00`, reason: input.reason, canCancel: true });
    world.list = [created];
    return { data: { requestFundTransfer: created } };
  },
});

const row = () => screen.getByTestId("fund-transfer-row");

async function askToMove(world: World, amount: string, from: string, to: string, reason: string) {
  fireEvent.click(await screen.findByRole("button", { name: /New transfer/ }));
  const dialog = await screen.findByRole("dialog", { name: "Move money between funds" });
  await within(dialog).findAllByRole("option", { name: from });
  fireEvent.change(within(dialog).getByLabelText("From department"), { target: { value: idOf(from) } });
  fireEvent.change(within(dialog).getByLabelText("To department"), { target: { value: idOf(to) } });
  fireEvent.change(within(dialog).getByLabelText("Amount"), { target: { value: amount } });
  fireEvent.change(within(dialog).getByLabelText("Reason"), { target: { value: reason } });
  await waitFor(() => expect(within(dialog).getByTestId("ft-available")).toHaveTextContent("Available:"));
  fireEvent.click(within(dialog).getByRole("button", { name: "Request transfer" }));
}

defineFeature(feature, (test) => {
  test("A treasurer requests a transfer within the available balance (US-16)", ({ given, and, when, then }) => {
    const world = newWorld();
    const input: FundTransferInput = {
      fromDepartmentId: "1",
      fromPurposeId: null,
      toDepartmentId: "2",
      toPurposeId: null,
      amount: "5000",
      transferDate: TODAY,
      reason: "Youth surplus to the roof",
    };
    given("the treasurer opens Fund transfers", () => {
      role.isTreasurer = true;
    });
    and(/^"(.*)" holds "KES (.*)" today$/, (dept: string, amount: string) => {
      world.balances.push(balanceMock(idOf(dept), null, TODAY, amount.replace(/,/g, "")));
      renderTransfers(world, [requestMock(world, input)]);
    });
    when(/^the treasurer asks to move "(.*)" from "(.*)" to "(.*)" because "(.*)"$/, async (amount, from, to, reason) => {
      await askToMove(world, amount, from, to, reason);
      await waitFor(() => expect(world.requested).toHaveLength(1));
    });
    then(/^the transfer from "(.*)" to "(.*)" is listed as "(.*)"$/, async (from: string, to: string, status: string) => {
      await waitFor(() => expect(row()).toHaveTextContent(status));
      expect(row()).toHaveTextContent(from);
      expect(row()).toHaveTextContent(to);
    });
  });

  test("A transfer above the available balance is refused before sending (US-16)", ({ given, and, when, then }) => {
    const world = newWorld();
    given("the treasurer opens Fund transfers", () => {
      role.isTreasurer = true;
    });
    and(/^"(.*)" holds "KES (.*)" today$/, (dept: string, amount: string) => {
      world.balances.push(balanceMock(idOf(dept), null, TODAY, amount.replace(/,/g, "")));
      renderTransfers(world);
    });
    when(/^the treasurer asks to move "(.*)" from "(.*)" to "(.*)" because "(.*)"$/, async (amount, from, to, reason) => {
      await askToMove(world, amount, from, to, reason);
    });
    then(/^the dialog says "(.*)"$/, (message: string) => {
      expect(within(screen.getByRole("dialog")).getByRole("alert")).toHaveTextContent(message);
    });
    and("no transfer was requested", () => {
      expect(world.requested).toHaveLength(0);
    });
  });

  test("The requester cannot approve their own transfer (US-17)", ({ given, then }) => {
    given("the treasurer opens Fund transfers with their own requested transfer", async () => {
      const world = newWorld();
      world.list = [makeTransfer({ canCancel: true, canApprove: false })];
      renderTransfers(world);
      await screen.findByTestId("fund-transfer-row");
    });
    then("the transfer can be cancelled but not approved or rejected", () => {
      expect(within(row()).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      expect(within(row()).queryByRole("button", { name: /Approve/ })).toBeNull();
      expect(within(row()).queryByRole("button", { name: /Reject/ })).toBeNull();
    });
  });

  test("Another treasurer approves the transfer (US-17)", ({ given, when, then }) => {
    const world = newWorld();
    given("a second treasurer opens Fund transfers with a requested transfer", async () => {
      world.list = [makeTransfer({ canApprove: true })];
      renderTransfers(world, [
        {
          request: { query: APPROVE_FUND_TRANSFER, variables: { id: "10" } },
          result: () => {
            world.list = [makeTransfer({ status: "approved", decidedBy: "Second Treasurer" })];
            return { data: { approveFundTransfer: world.list[0] } };
          },
        },
      ]);
      await screen.findByTestId("fund-transfer-row");
    });
    when("they approve it", () => {
      fireEvent.click(within(row()).getByRole("button", { name: /Approve/ }));
    });
    then(/^the transfer is listed as "(.*)"$/, async (status: string) => {
      await waitFor(() => expect(row()).toHaveTextContent(status));
      expect(row()).toHaveTextContent("Approved by Second Treasurer");
    });
  });

  test("Rejecting needs a note (US-17)", ({ given, when, then }) => {
    const world = newWorld();
    given("a second treasurer opens Fund transfers with a requested transfer", async () => {
      world.list = [makeTransfer({ canApprove: true })];
      renderTransfers(world, [
        {
          request: { query: REJECT_FUND_TRANSFER, variables: { id: "10", note: "Not this year" } },
          result: () => {
            world.list = [makeTransfer({ status: "rejected", decidedBy: "Second Treasurer", decisionNote: "Not this year" })];
            return { data: { rejectFundTransfer: world.list[0] } };
          },
        },
      ]);
      await screen.findByTestId("fund-transfer-row");
    });
    when("they reject it without a note", async () => {
      fireEvent.click(within(row()).getByRole("button", { name: /Reject/ }));
      const dialog = await screen.findByRole("dialog", { name: "Reject transfer?" });
      fireEvent.click(within(dialog).getByRole("button", { name: "Reject transfer" }));
    });
    then(/^the dialog says "(.*)"$/, (message: string) => {
      expect(within(screen.getByRole("dialog")).getByRole("alert")).toHaveTextContent(message);
    });
    when(/^they reject it with the note "(.*)"$/, (note: string) => {
      const dialog = screen.getByRole("dialog", { name: "Reject transfer?" });
      fireEvent.change(within(dialog).getByLabelText("Note"), { target: { value: note } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Reject transfer" }));
    });
    then(/^the transfer is listed as "(.*)"$/, async (status: string) => {
      await waitFor(() => expect(row()).toHaveTextContent(status));
      expect(row()).toHaveTextContent("Not this year");
    });
  });

  test("The department report shows the transfers (US-18)", ({ given, then, and }) => {
    given(
      /^the Building Fund statement has a transfer in from "(.*)" of "(.*)" and a transfer out to "(.*)" of "(.*)"$/,
      (from: string, inAmount: string, to: string, outAmount: string) => {
        const statement = makeStatement({
          lines: [
            { __typename: "FinancialLine", direction: "in", label: "Gifts", amount: "4000.00", note: "" },
            { __typename: "FinancialLine", direction: "in", label: `Transfer in from ${from}`, amount: inAmount, note: "" },
            { __typename: "FinancialLine", direction: "out", label: `Transfer out to ${to}`, amount: outAmount, note: "" },
          ],
        } as Partial<FinancialStatement>);
        render(<FinancialTable statement={statement} />);
      },
    );
    const sectionOf = (label: string) => {
      const lines = screen.getAllByTestId("financial-line");
      const index = lines.findIndex((l) => l.textContent?.includes(label));
      expect(index).toBeGreaterThanOrEqual(0);
      const moneyOutTotal = screen.getByTestId("financial-row-money-in");
      // DOM order: money-in lines come before the "Total money in" row.
      return lines[index].compareDocumentPosition(moneyOutTotal) & Node.DOCUMENT_POSITION_FOLLOWING ? "in" : "out";
    };
    then(/^"(.*)" is listed under money in$/, (label: string) => {
      expect(sectionOf(label)).toBe("in");
    });
    and(/^"(.*)" is listed under money out$/, (label: string) => {
      expect(sectionOf(label)).toBe("out");
    });
  });

  test("The treasurer moves a gift put in the wrong department (US-19)", ({ given, when, and, then }) => {
    const world = newWorld();
    const group = "3f1c9a6e-0000-4000-8000-000000000001";
    const targets = [
      { departmentId: "2", purposeId: null, amount: "600.00" },
      { departmentId: "1", purposeId: null, amount: "400.00" },
    ];
    const onMoved = vi.fn();
    given(/^the treasurer opens "Move gift" on a payment of "(.*)" to "(.*)"$/, async (amount: string, dept: string) => {
      render(
        <MockedProvider
          mocks={[
            categoriesMock(),
            ...["1", "2", "3"].map((id) => purposesMock(id, id === "2" ? [purpose("8", "Roof")] : [])),
            previewMock(group, targets, previewOk()),
            reallocateMock(group, targets, "Giver meant Building", previewOk({ message: "Gift moved." }), () => {
              world.moved = true;
            }),
          ]}
        >
          <MoveGiftDialog
            open
            onOpenChange={() => {}}
            contributionGroupId={group}
            lines={[{ departmentId: idOf(dept), departmentName: dept, purposeName: null, amount }]}
            onMoved={onMoved}
          />
        </MockedProvider>,
      );
      await screen.findAllByRole("option", { name: "Youth" });
    });
    when(/^the treasurer moves "(.*)" to "(.*)" and "(.*)" to "(.*)"$/, (a1: string, d1: string, a2: string, d2: string) => {
      fireEvent.change(screen.getByLabelText("Department (line 1)"), { target: { value: idOf(d1) } });
      fireEvent.change(screen.getByLabelText("Amount (line 1)"), { target: { value: a1 } });
      fireEvent.click(screen.getByRole("button", { name: /Add line/ }));
      fireEvent.change(screen.getByLabelText("Department (line 2)"), { target: { value: idOf(d2) } });
      fireEvent.change(screen.getByLabelText("Amount (line 2)"), { target: { value: a2 } });
      expect(screen.getByTestId("move-gift-total")).toHaveTextContent("KES 1,000.00 of KES 1,000.00");
    });
    and("previews the move", () => {
      fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    });
    then(/^the preview shows "(.*)" before and "(.*)" after$/, async (before: string, after: string) => {
      const preview = await screen.findByTestId("move-gift-preview");
      expect(preview).toHaveTextContent(before);
      expect(preview).toHaveTextContent(after);
    });
    when(/^the treasurer confirms because "(.*)"$/, (reason: string) => {
      fireEvent.change(screen.getByLabelText("Reason"), { target: { value: reason } });
      fireEvent.click(screen.getByRole("button", { name: "Move gift" }));
    });
    then("the gift is moved", async () => {
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Gift moved"));
      expect(world.moved).toBe(true);
      expect(onMoved).toHaveBeenCalled();
    });
  });
});
