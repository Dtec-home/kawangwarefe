/**
 * Component tests for the KCB payout-channel capture piece of the admin
 * expenses page (EPIC 6/7 of KCB_EXPENSE_DISBURSEMENT_SPRINT_PLAN.md).
 *
 * `PayoutChannelFields` has no Apollo/GraphQL dependency of its own — it's a
 * controlled, purely presentational component (value/onChange props) — so
 * no MockedProvider is needed here, unlike hook tests such as
 * use-user-role.test.tsx. What's covered here is conditional rendering by
 * prop and the beneficiary input callbacks; the actual Radix Select
 * open/pick interaction (documented elsewhere in this repo as unreliable
 * under jsdom — see __tests__/components/ui/dialog.test.tsx) is exercised
 * for real in e2e/admin-expense-disbursement.spec.ts, which runs in a real
 * browser.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  PayoutChannelFields,
  isValidKenyanPhone,
} from "@/app/(dashboard)/admin/expenses/payout-channel-fields";

function renderFields(overrides: Partial<Parameters<typeof PayoutChannelFields>[0]> = {}) {
  const props = {
    idPrefix: "test",
    payoutChannel: "manual",
    setPayoutChannel: vi.fn(),
    beneficiaryAccountNumber: "",
    setBeneficiaryAccountNumber: vi.fn(),
    beneficiaryPhoneNumber: "",
    setBeneficiaryPhoneNumber: vi.fn(),
    beneficiaryBankCode: "",
    setBeneficiaryBankCode: vi.fn(),
    ...overrides,
  };
  render(<PayoutChannelFields {...props} />);
  return props;
}

describe("PayoutChannelFields", () => {
  it("shows no beneficiary fields when payoutChannel is manual", () => {
    renderFields({ payoutChannel: "manual" });
    expect(screen.queryByLabelText(/beneficiary account number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/beneficiary phone number/i)).not.toBeInTheDocument();
  });

  it("shows account number + bank code fields when payoutChannel is bank", () => {
    renderFields({ payoutChannel: "bank" });
    expect(screen.getByLabelText(/beneficiary account number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bank code/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/beneficiary phone number/i)).not.toBeInTheDocument();
  });

  it("shows only the phone field when payoutChannel is mobile_money", () => {
    renderFields({ payoutChannel: "mobile_money" });
    expect(screen.getByLabelText(/beneficiary phone number/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/beneficiary account number/i)).not.toBeInTheDocument();
  });

  it("calls setBeneficiaryPhoneNumber as the user types", async () => {
    const user = userEvent.setup();
    const props = renderFields({ payoutChannel: "mobile_money" });

    await user.type(screen.getByLabelText(/beneficiary phone number/i), "2");

    expect(props.setBeneficiaryPhoneNumber).toHaveBeenCalledWith("2");
  });

  it("calls setBeneficiaryAccountNumber as the user types", async () => {
    const user = userEvent.setup();
    const props = renderFields({ payoutChannel: "bank" });

    await user.type(screen.getByLabelText(/beneficiary account number/i), "1");

    expect(props.setBeneficiaryAccountNumber).toHaveBeenCalledWith("1");
  });

  it("uses idPrefix to keep field ids unique across two instances", () => {
    renderFields({ idPrefix: "req", payoutChannel: "bank" });
    expect(document.getElementById("req-beneficiary-account")).toBeInTheDocument();
  });
});

describe("isValidKenyanPhone", () => {
  it("accepts a well-formed 254 number", () => {
    expect(isValidKenyanPhone("254712345678")).toBe(true);
  });

  it("rejects a number missing the 254 prefix", () => {
    expect(isValidKenyanPhone("0712345678")).toBe(false);
  });

  it("rejects a number with the wrong length", () => {
    expect(isValidKenyanPhone("25471234567")).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(isValidKenyanPhone("254abc345678")).toBe(false);
  });

  it("tolerates surrounding whitespace", () => {
    expect(isValidKenyanPhone("  254712345678  ")).toBe(true);
  });
});
