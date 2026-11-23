/**
 * Fund transfers screen (FT-2; US-16, US-17): filters, the "Move money between
 * funds" dialog (validation, live available balance, request), approve/reject/
 * cancel visibility from canApprove/canCancel, and FundTransferError mapping.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing/react";

const { toast, role } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
  role: { isAdmin: false, isTreasurer: true, ledDepartmentIds: [] as string[] },
}));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/hooks/use-user-role", () => ({ useUserRole: () => role }));

import { FundTransfersView } from "@/components/fund-transfers/fund-transfers-view";
import {
  APPROVE_FUND_TRANSFER,
  CANCEL_FUND_TRANSFER,
  REJECT_FUND_TRANSFER,
  REQUEST_FUND_TRANSFER,
} from "@/lib/graphql/fund-transfers";
import { nairobiToday } from "@/lib/treasury/entry-dates";
import type { FundTransfer } from "@/lib/fund-transfers/types";

import { balanceMock, categoriesMock, makeTransfer, purpose, purposesMock, transfersMock } from "./fixtures";

const TODAY = nairobiToday();

beforeEach(() => {
  role.isAdmin = false;
  role.isTreasurer = true;
  role.ledDepartmentIds = [];
});
afterEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
});

function renderView(list: () => FundTransfer[], extra: MockedResponse[] = []) {
  return render(
    <MockedProvider
      mocks={[
        categoriesMock(),
        transfersMock(list),
        purposesMock("1", [purpose("7", "Camp")]),
        purposesMock("2", [purpose("8", "Roof")]),
        purposesMock("3", []),
        ...extra,
      ]}
    >
      <FundTransfersView />
    </MockedProvider>,
  );
}

const rows = () => screen.findAllByTestId("fund-transfer-row");

describe("the list", () => {
  it("shows from → to, amount, date, reason, requester and decision", async () => {
    renderView(() => [
      makeTransfer({
        status: "approved",
        toPurpose: { __typename: "DepartmentPurposeType", id: "8", name: "Roof", code: "ROOF" },
        decidedBy: "Peter Admin",
        decisionNote: "Fine",
      }),
    ]);
    const [row] = await rows();
    expect(row).toHaveTextContent("Youth");
    expect(row).toHaveTextContent("Building Fund / Roof");
    expect(row).toHaveTextContent("KES 5,000.00");
    expect(row).toHaveTextContent("20 Nov 2026");
    expect(row).toHaveTextContent("Youth surplus to the roof");
    expect(row).toHaveTextContent("Requested by Grace Treasurer");
    expect(row).toHaveTextContent("Approved by Peter Admin — “Fine”");
  });

  it("filters by status chip and by department", async () => {
    const all = [makeTransfer(), makeTransfer({ id: "11", status: "rejected", reason: "Wrong fund" })];
    renderView(() => all, [
      transfersMock(() => [all[1]], { status: "rejected", departmentId: null }),
      transfersMock(() => [all[1]], { status: "rejected", departmentId: "2" }),
    ]);
    expect(await rows()).toHaveLength(2);
    for (const label of ["Requested", "Approved", "Rejected", "Cancelled"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("button", { name: "Rejected" }));
    await waitFor(() => expect(screen.getAllByTestId("fund-transfer-row")).toHaveLength(1));
    expect(screen.getByRole("button", { name: "Rejected" })).toHaveAttribute("aria-pressed", "true");
    await screen.findByRole("option", { name: "Building Fund" });
    fireEvent.change(screen.getByLabelText("Department"), { target: { value: "2" } });
    await waitFor(() => expect(screen.getAllByTestId("fund-transfer-row")[0]).toHaveTextContent("Wrong fund"));
  });

  it("shows an empty state", async () => {
    renderView(() => []);
    expect(await screen.findByText("No transfers")).toBeInTheDocument();
  });
});

describe("row actions", () => {
  it("Approve/Reject only with canApprove, Cancel only with canCancel", async () => {
    renderView(() => [
      makeTransfer({ id: "1", reason: "Mine", canCancel: true }),
      makeTransfer({ id: "2", reason: "Theirs", canApprove: true }),
      makeTransfer({ id: "3", reason: "Done", status: "approved" }),
    ]);
    const [mine, theirs, done] = await rows();
    expect(within(mine).queryByRole("button", { name: /Approve/ })).toBeNull();
    expect(within(mine).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(within(theirs).getByRole("button", { name: /Approve/ })).toBeInTheDocument();
    expect(within(theirs).getByRole("button", { name: /Reject/ })).toBeInTheDocument();
    expect(within(theirs).queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(within(done).queryAllByRole("button")).toHaveLength(0);
  });

  it("approves, refetches and toasts", async () => {
    let list = [makeTransfer({ canApprove: true })];
    renderView(() => list, [
      {
        request: { query: APPROVE_FUND_TRANSFER, variables: { id: "10" } },
        result: () => {
          list = [makeTransfer({ status: "approved", decidedBy: "Peter Admin" })];
          return { data: { approveFundTransfer: list[0] } };
        },
      },
    ]);
    const [row] = await rows();
    fireEvent.click(within(row).getByRole("button", { name: /Approve/ }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Transfer approved"));
    await waitFor(() => expect(screen.getByTestId("fund-transfer-row")).toHaveTextContent("Approved by Peter Admin"));
  });

  it("maps an approval refusal to a friendly message", async () => {
    renderView(() => [makeTransfer({ canApprove: true })], [
      {
        request: { query: APPROVE_FUND_TRANSFER, variables: { id: "10" } },
        result: { data: { approveFundTransfer: { __typename: "FundTransferError", code: "insufficient_funds", message: "raw" } } },
      },
    ]);
    const [row] = await rows();
    fireEvent.click(within(row).getByRole("button", { name: /Approve/ }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("The source fund does not hold that much on the transfer date."),
    );
  });

  it("reject needs a note", async () => {
    let sent: unknown = null;
    renderView(() => [makeTransfer({ canApprove: true })], [
      {
        request: { query: REJECT_FUND_TRANSFER, variables: { id: "10", note: "Not this year" } },
        result: () => {
          sent = true;
          return { data: { rejectFundTransfer: makeTransfer({ status: "rejected" }) } };
        },
      },
    ]);
    const [row] = await rows();
    fireEvent.click(within(row).getByRole("button", { name: /Reject/ }));
    const dialog = await screen.findByRole("dialog", { name: "Reject transfer?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Reject transfer" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Say why the transfer is rejected.");
    expect(sent).toBeNull();
    fireEvent.change(within(dialog).getByLabelText("Note"), { target: { value: "Not this year" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Reject transfer" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Transfer rejected"));
    expect(sent).toBe(true);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("cancels my own request", async () => {
    renderView(() => [makeTransfer({ canCancel: true })], [
      {
        request: { query: CANCEL_FUND_TRANSFER, variables: { id: "10" } },
        result: { data: { cancelFundTransfer: makeTransfer({ status: "cancelled" }) } },
      },
    ]);
    const [row] = await rows();
    fireEvent.click(within(row).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Transfer cancelled"));
  });
});

describe("New transfer dialog", () => {
  const open = async () => {
    fireEvent.click(await screen.findByRole("button", { name: /New transfer/ }));
    const dialog = await screen.findByRole("dialog", { name: "Move money between funds" });
    await within(dialog).findAllByRole("option", { name: "Youth" });
    return dialog;
  };

  it("is hidden from a pastor who leads nothing", async () => {
    role.isTreasurer = false;
    renderView(() => []);
    await screen.findByText("No transfers");
    expect(screen.queryByRole("button", { name: /New transfer/ })).toBeNull();
  });

  it("a leader may only move money out of a department they lead", async () => {
    role.isTreasurer = false;
    role.ledDepartmentIds = ["1"];
    renderView(() => []);
    const dialog = await open();
    const from = within(dialog).getByLabelText("From department");
    expect(within(from).getAllByRole("option").map((o) => o.textContent)).toEqual(["Choose a department", "Youth"]);
    const to = within(dialog).getByLabelText("To department");
    expect(within(to).getAllByRole("option")).toHaveLength(4);
  });

  it("shows the available balance live and re-reads it for a purpose", async () => {
    renderView(() => [], [balanceMock("1", null, TODAY, "8000.00"), balanceMock("1", "7", TODAY, "1200.00")]);
    const dialog = await open();
    expect(within(dialog).getByTestId("ft-available")).toHaveTextContent("Choose where the money comes from");
    fireEvent.change(within(dialog).getByLabelText("From department"), { target: { value: "1" } });
    await waitFor(() => expect(within(dialog).getByTestId("ft-available")).toHaveTextContent("Available: KES 8,000.00"));
    await within(dialog).findByRole("option", { name: "Camp" });
    fireEvent.change(within(dialog).getByLabelText("From purpose"), { target: { value: "7" } });
    await waitFor(() => expect(within(dialog).getByTestId("ft-available")).toHaveTextContent("Available: KES 1,200.00"));
  });

  it("validates like the backend before sending", async () => {
    renderView(() => [], [balanceMock("1", null, TODAY, "8000.00")]);
    const dialog = await open();
    const submit = () => fireEvent.click(within(dialog).getByRole("button", { name: "Request transfer" }));
    const alert = () => within(dialog).getByRole("alert");

    submit();
    expect(alert()).toHaveTextContent("Choose the department to move money from.");
    fireEvent.change(within(dialog).getByLabelText("From department"), { target: { value: "1" } });
    fireEvent.change(within(dialog).getByLabelText("To department"), { target: { value: "1" } });
    submit();
    expect(alert()).toHaveTextContent("Choose a different department or purpose");
    fireEvent.change(within(dialog).getByLabelText("To department"), { target: { value: "2" } });
    fireEvent.change(within(dialog).getByLabelText("Amount"), { target: { value: "0" } });
    submit();
    expect(alert()).toHaveTextContent("Enter an amount greater than 0");
    await waitFor(() => expect(within(dialog).getByTestId("ft-available")).toHaveTextContent("KES 8,000.00"));
    fireEvent.change(within(dialog).getByLabelText("Amount"), { target: { value: "9000" } });
    submit();
    expect(alert()).toHaveTextContent("The source only holds KES 8,000.00 on that date.");
    fireEvent.change(within(dialog).getByLabelText("Amount"), { target: { value: "5000" } });
    submit();
    expect(alert()).toHaveTextContent("Give a reason.");
  });

  it("requests the transfer and maps a server refusal", async () => {
    const input = {
      fromDepartmentId: "1",
      fromPurposeId: null,
      toDepartmentId: "2",
      toPurposeId: "8",
      amount: "5000",
      transferDate: TODAY,
      reason: "Roof",
    };
    let calls = 0;
    let list: FundTransfer[] = [];
    renderView(() => list, [
      balanceMock("1", null, TODAY, "8000.00"),
      {
        request: { query: REQUEST_FUND_TRANSFER, variables: { input } },
        result: () => {
          calls += 1;
          if (calls === 1) {
            return { data: { requestFundTransfer: { __typename: "FundTransferError", code: "insufficient_funds", message: "x" } } };
          }
          list = [makeTransfer({ canCancel: true, reason: "Roof" })];
          return { data: { requestFundTransfer: list[0] } };
        },
        maxUsageCount: 2,
      },
    ]);
    const dialog = await open();
    fireEvent.change(within(dialog).getByLabelText("From department"), { target: { value: "1" } });
    fireEvent.change(within(dialog).getByLabelText("To department"), { target: { value: "2" } });
    await within(dialog).findByRole("option", { name: "Roof" });
    fireEvent.change(within(dialog).getByLabelText("To purpose"), { target: { value: "8" } });
    fireEvent.change(within(dialog).getByLabelText("Amount"), { target: { value: "5000" } });
    fireEvent.change(within(dialog).getByLabelText("Reason"), { target: { value: "Roof" } });
    await waitFor(() => expect(within(dialog).getByTestId("ft-available")).toHaveTextContent("KES 8,000.00"));

    fireEvent.click(within(dialog).getByRole("button", { name: "Request transfer" }));
    await waitFor(() =>
      expect(within(dialog).getByRole("alert")).toHaveTextContent("The source fund does not hold that much"),
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Request transfer" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(await rows()).toHaveLength(1);
  });
});
