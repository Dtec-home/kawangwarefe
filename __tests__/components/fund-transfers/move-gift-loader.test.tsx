import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { toPaymentLines } from "@/components/fund-transfers/move-gift-loader";

const query = vi.hoisted(() => ({ result: {} as Record<string, unknown> }));
vi.mock("@apollo/client/react", () => ({ useQuery: () => query.result }));
vi.mock("@/components/fund-transfers/move-gift-dialog", () => ({
  MoveGiftDialog: ({ lines }: { lines: { departmentName: string; amount: string }[] }) => (
    <ul data-testid="dialog-lines">
      {lines.map((l) => <li key={l.departmentName + l.amount}>{`${l.departmentName} ${l.amount}`}</li>)}
    </ul>
  ),
}));

import { MoveGiftLoader } from "@/components/fund-transfers/move-gift-loader";

const pageLines = [{ departmentId: "3", departmentName: "Tithe", purposeName: null, amount: "600.00" }];
const serverLines = [
  { departmentId: "3", department: "Tithe", purposeId: null, purpose: null, amount: "600.00" },
  { departmentId: "2", department: "Building Fund", purposeId: "9", purpose: "Roof", amount: "400.00" },
];

const renderLoader = () =>
  render(<MoveGiftLoader contributionGroupId="g1" pageLines={pageLines} onClose={vi.fn()} onMoved={vi.fn()} />);

describe("MoveGiftLoader", () => {
  it("maps server lines to dialog lines", () => {
    expect(toPaymentLines(serverLines)[1]).toEqual({
      departmentId: "2", departmentName: "Building Fund", purposeName: "Roof", amount: "400.00",
    });
  });

  it("shows a loading dialog first", () => {
    query.result = { loading: true };
    renderLoader();
    expect(screen.getByText("Loading the payment…")).toBeInTheDocument();
  });

  it("opens the dialog with the whole payment from the server", () => {
    query.result = { loading: false, data: { paymentLines: serverLines } };
    renderLoader();
    expect(screen.getByTestId("dialog-lines")).toHaveTextContent("Tithe 600.00Building Fund 400.00");
  });

  it("falls back to the page's lines when the server cannot answer", () => {
    query.result = { loading: false, error: new Error("down") };
    renderLoader();
    expect(screen.getByTestId("dialog-lines")).toHaveTextContent("Tithe 600.00");
  });
});
