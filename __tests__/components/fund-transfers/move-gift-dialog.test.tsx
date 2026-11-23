/**
 * "Move gift…" dialog (RA-2, US-19): target lines start as the payment's
 * lines (purpose matched by name), add/remove lines, running total vs the
 * payment total, Preview (before/after) gates "Move gift", the reason is
 * required, refusal codes are mapped and success toasts + calls onMoved.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing/react";

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("sonner", () => ({ toast }));

import { MoveGiftDialog } from "@/components/fund-transfers/move-gift-dialog";
import type { PaymentLine } from "@/lib/fund-transfers/types";

import {
  categoriesMock,
  previewMock,
  previewOk,
  previewRefused,
  purpose,
  purposesMock,
  reallocateMock,
} from "./fixtures";

const GROUP = "3f1c9a6e-0000-4000-8000-000000000001";
const LINES: PaymentLine[] = [{ departmentId: "3", departmentName: "Tithe", purposeName: null, amount: "1000.00" }];

afterEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
});

function renderDialog(extra: MockedResponse[] = [], lines = LINES, onMoved = vi.fn()) {
  render(
    <MockedProvider
      mocks={[
        categoriesMock(),
        purposesMock("1", [purpose("7", "Camp")]),
        purposesMock("2", [purpose("8", "Roof")]),
        purposesMock("3", [purpose("9", "Mission")]),
        ...extra,
      ]}
    >
      <MoveGiftDialog open onOpenChange={() => {}} contributionGroupId={GROUP} lines={lines} onMoved={onMoved} />
    </MockedProvider>,
  );
  return onMoved;
}

const dialog = () => screen.getByRole("dialog", { name: "Move gift" });
const total = () => screen.getByTestId("move-gift-total");

async function splitIntoBuildingAndYouth() {
  await within(dialog()).findAllByRole("option", { name: "Youth" });
  fireEvent.change(screen.getByLabelText("Department (line 1)"), { target: { value: "2" } });
  await screen.findByRole("option", { name: "Roof" });
  fireEvent.change(screen.getByLabelText("Purpose (line 1)"), { target: { value: "8" } });
  fireEvent.change(screen.getByLabelText("Amount (line 1)"), { target: { value: "600" } });
  fireEvent.click(screen.getByRole("button", { name: /Add line/ }));
  fireEvent.change(screen.getByLabelText("Department (line 2)"), { target: { value: "1" } });
}

const TARGETS = [
  { departmentId: "2", purposeId: "8", amount: "600.00" },
  { departmentId: "1", purposeId: null, amount: "400.00" },
];

describe("MoveGiftDialog", () => {
  it("starts from the payment's lines, purpose matched by name", async () => {
    renderDialog([], [
      { departmentId: "3", departmentName: "Tithe", purposeName: "Mission", amount: "700.00" },
      { departmentId: "1", departmentName: "Youth", purposeName: null, amount: "300.00" },
    ]);
    expect(dialog()).toHaveTextContent("KES 1,000.00");
    expect(screen.getAllByTestId("move-gift-row")).toHaveLength(2);
    await waitFor(() => expect(screen.getByLabelText("Department (line 1)")).toHaveValue("3"));
    await waitFor(() => expect(screen.getByLabelText("Purpose (line 1)")).toHaveValue("9"));
    expect(screen.getByLabelText("Amount (line 2)")).toHaveValue("300.00");
    expect(total()).toHaveTextContent("KES 1,000.00 of KES 1,000.00");
  });

  it("sends the purpose matched by name when the user kept it", async () => {
    const lines = [{ departmentId: "3", departmentName: "Tithe", purposeName: "Mission", amount: "1000.00" }];
    renderDialog([previewMock(GROUP, [{ departmentId: "3", purposeId: "9", amount: "1000.00" }], previewRefused("total_mismatch", "same"))], lines);
    await waitFor(() => expect(screen.getByLabelText("Purpose (line 1)")).toHaveValue("9"));
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("exactly the payment total"));
  });

  it("keeps a running total and blocks preview when it does not match", async () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText("Amount (line 1)"), { target: { value: "600" } });
    expect(total()).toHaveTextContent("KES 600.00 of KES 1,000.00 (short by KES 400.00)");
    fireEvent.click(screen.getByRole("button", { name: /Add line/ }));
    expect(screen.getByLabelText("Amount (line 2)")).toHaveValue("400.00");
    fireEvent.change(screen.getByLabelText("Amount (line 2)"), { target: { value: "500" } });
    expect(total()).toHaveTextContent("(over by KES 100.00)");
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a department on every line.");
    fireEvent.click(screen.getByRole("button", { name: "Remove line 2" }));
    expect(screen.getAllByTestId("move-gift-row")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Remove line 1" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByRole("alert")).toHaveTextContent("The lines add up to KES 600.00 but the payment is KES 1,000.00.");
    expect(screen.getByRole("button", { name: "Move gift" })).toBeDisabled();
  });

  it("previews before/after, needs a reason, then moves the gift", async () => {
    let applied = false;
    const onMoved = renderDialog([
      previewMock(GROUP, TARGETS, previewOk()),
      reallocateMock(GROUP, TARGETS, "Giver meant Building", previewOk({ message: "Gift moved." }), () => {
        applied = true;
      }),
    ]);
    await splitIntoBuildingAndYouth();
    expect(total()).toHaveTextContent("KES 1,000.00 of KES 1,000.00");
    expect(screen.getByRole("button", { name: "Move gift" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    const preview = await screen.findByTestId("move-gift-preview");
    expect(preview).toHaveTextContent("Before");
    expect(preview).toHaveTextContent("Tithe");
    expect(preview).toHaveTextContent("Building Fund / Roof");
    expect(preview).toHaveTextContent("KES 600.00");

    fireEvent.click(screen.getByRole("button", { name: "Move gift" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Say why the gift is being moved.");
    expect(applied).toBe(false);

    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Giver meant Building" } });
    fireEvent.click(screen.getByRole("button", { name: "Move gift" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Gift moved"));
    expect(applied).toBe(true);
    expect(onMoved).toHaveBeenCalled();
  });

  it("changing a line discards the preview", async () => {
    renderDialog([previewMock(GROUP, TARGETS, previewOk())]);
    await splitIntoBuildingAndYouth();
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    await screen.findByTestId("move-gift-preview");
    fireEvent.change(screen.getByLabelText("Amount (line 1)"), { target: { value: "601" } });
    expect(screen.queryByTestId("move-gift-preview")).toBeNull();
    expect(screen.getByRole("button", { name: "Move gift" })).toBeDisabled();
  });

  it.each([
    ["total_mismatch", "The new lines must add up to exactly the payment total."],
    ["invalid_target", "Check each line: the department or purpose is not valid."],
    ["not_found", "This payment can't be found. It may have already been moved — refresh the list."],
  ])("maps the %s refusal", async (code, message) => {
    renderDialog([previewMock(GROUP, TARGETS, previewRefused(code, "raw"))]);
    await splitIntoBuildingAndYouth();
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(message));
    expect(screen.queryByTestId("move-gift-preview")).toBeNull();
  });

  it("maps a refusal at apply time and keeps the dialog open", async () => {
    const onMoved = renderDialog([
      previewMock(GROUP, TARGETS, previewOk()),
      reallocateMock(GROUP, TARGETS, "Oops", previewRefused("not_found", "raw")),
    ]);
    await splitIntoBuildingAndYouth();
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    await screen.findByTestId("move-gift-preview");
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Oops" } });
    fireEvent.click(screen.getByRole("button", { name: "Move gift" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("already been moved")));
    expect(onMoved).not.toHaveBeenCalled();
    expect(dialog()).toBeInTheDocument();
  });
});
