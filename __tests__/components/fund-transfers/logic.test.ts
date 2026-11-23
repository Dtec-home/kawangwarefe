import { describe, expect, it } from "vitest";
import { buildSchema, parse, validate } from "graphql";
import { readFileSync, existsSync } from "node:fs";
import { print } from "graphql";

import {
  amountToCents,
  centsToAmount,
  fundLabel,
  isFundTransferError,
  reallocationErrorMessage,
  sumTargets,
  transferErrorMessage,
  validateMoveGift,
  validateTransfer,
  TRANSFER_STATUS_FILTERS,
} from "@/lib/fund-transfers/logic";
import * as docs from "@/lib/graphql/fund-transfers";

const draft = {
  fromDepartmentId: "1",
  fromPurposeId: "",
  toDepartmentId: "2",
  toPurposeId: "",
  amount: "500",
  transferDate: "2026-11-20",
  reason: "Youth surplus to Building",
};

describe("validateTransfer (mirrors FundTransferService.request)", () => {
  it("accepts a valid draft", () => {
    expect(validateTransfer(draft, "1000.00")).toBeNull();
  });
  it("needs both departments", () => {
    expect(validateTransfer({ ...draft, fromDepartmentId: "" }, "1000.00")).toBe("Choose the department to move money from.");
    expect(validateTransfer({ ...draft, toDepartmentId: "" }, "1000.00")).toBe("Choose the department to move money to.");
  });
  it("refuses the same fund, but allows another purpose of the same department", () => {
    expect(validateTransfer({ ...draft, toDepartmentId: "1" }, "1000.00")).toBe(
      "Choose a different department or purpose to move the money to.",
    );
    expect(validateTransfer({ ...draft, toDepartmentId: "1", toPurposeId: "7" }, "1000.00")).toBeNull();
  });
  it("needs an amount above 0 with at most two decimals", () => {
    for (const amount of ["", "0", "-5", "abc", "1.234"]) {
      expect(validateTransfer({ ...draft, amount }, "1000.00")).toBe(
        "Enter an amount greater than 0 with at most two decimals.",
      );
    }
    expect(validateTransfer({ ...draft, amount: "1,000.50" }, "2000.00")).toBeNull();
  });
  it("refuses more than is available", () => {
    expect(validateTransfer({ ...draft, amount: "1000.01" }, "1000.00")).toBe(
      "The source only holds KES 1,000.00 on that date.",
    );
    expect(validateTransfer({ ...draft, amount: "1000" }, "1000.00")).toBeNull();
  });
  it("does not block on the balance while it is still loading", () => {
    expect(validateTransfer(draft, null)).toBeNull();
  });
  it("needs a date and a reason", () => {
    expect(validateTransfer({ ...draft, transferDate: "" }, "1000.00")).toBe("Choose the transfer date.");
    expect(validateTransfer({ ...draft, reason: "  " }, "1000.00")).toBe("Give a reason.");
  });
});

describe("error mapping", () => {
  it("maps every FundTransferError code to a friendly message", () => {
    expect(transferErrorMessage("insufficient_funds")).toBe(
      "The source fund does not hold that much on the transfer date.",
    );
    expect(transferErrorMessage("forbidden")).toMatch(/not allowed/);
    expect(transferErrorMessage("same_fund")).toMatch(/different department or purpose/);
    expect(transferErrorMessage("invalid_transition")).toMatch(/already been decided/);
    expect(transferErrorMessage("not_found")).toMatch(/no longer exists/);
    expect(transferErrorMessage("purpose_mismatch")).toMatch(/does not belong/);
    expect(transferErrorMessage("reason_required")).toMatch(/reason/);
    expect(transferErrorMessage("invalid_amount")).toMatch(/greater than 0/);
    expect(transferErrorMessage("weird", "Server said no")).toBe("Server said no");
  });
  it("maps reallocation codes", () => {
    expect(reallocationErrorMessage("total_mismatch", "x")).toBe(
      "The new lines must add up to exactly the payment total.",
    );
    expect(reallocationErrorMessage("invalid_target", "x")).toMatch(/department or purpose/);
    expect(reallocationErrorMessage("not_found", "x")).toMatch(/already been moved/);
    expect(reallocationErrorMessage(null, "Fallback")).toBe("Fallback");
  });
  it("recognises the error arm of the union", () => {
    expect(isFundTransferError({ __typename: "FundTransferError", code: "forbidden", message: "" })).toBe(true);
    expect(isFundTransferError(undefined)).toBe(false);
  });
});

describe("money helpers", () => {
  it("adds target amounts in cents", () => {
    expect(sumTargets([{ amount: "0.10" }, { amount: "0.20" }, { amount: "" }])).toBe(30);
    expect(centsToAmount(amountToCents("1,250.5")!)).toBe("1250.50");
  });
  it("labels a fund with its purpose", () => {
    expect(fundLabel({ id: "1", name: "Youth", code: "Y" }, null)).toBe("Youth");
    expect(fundLabel({ id: "1", name: "Youth", code: "Y" }, { id: "2", name: "Camp", code: "C" })).toBe("Youth / Camp");
  });
  it("offers the four status filters", () => {
    expect(TRANSFER_STATUS_FILTERS.map((s) => s.label)).toEqual(["Requested", "Approved", "Rejected", "Cancelled"]);
  });
});

describe("validateMoveGift", () => {
  const rows = [{ departmentId: "1", purposeId: "", amount: "600" }, { departmentId: "2", purposeId: "", amount: "400" }];
  it("accepts rows that add up to the payment", () => {
    expect(validateMoveGift(rows, 100000)).toBeNull();
  });
  it("needs a department and a positive amount on every row", () => {
    expect(validateMoveGift([{ departmentId: "", purposeId: "", amount: "1000" }], 100000)).toBe(
      "Choose a department on every line.",
    );
    expect(validateMoveGift([{ departmentId: "1", purposeId: "", amount: "0" }], 0)).toBe(
      "Every line needs an amount greater than 0.",
    );
  });
  it("needs the exact total", () => {
    expect(validateMoveGift(rows, 120000)).toBe("The lines add up to KES 1,000.00 but the payment is KES 1,200.00.");
  });
});

// The documents must validate against the live backend schema when it has been printed.
const SCHEMA = process.env.FT_SCHEMA_PATH;
describe.skipIf(!SCHEMA || !existsSync(SCHEMA))("documents vs live schema", () => {
  it("every document validates", () => {
    const schema = buildSchema(readFileSync(SCHEMA!, "utf8"));
    for (const [name, doc] of Object.entries(docs)) {
      if (!doc || typeof doc !== "object" || !("kind" in doc)) continue;
      if (name === "FUND_TRANSFER_FIELDS") continue;
      const errors = validate(schema, parse(print(doc)));
      expect(errors.map((e) => `${name}: ${e.message}`)).toEqual([]);
    }
  });
});
