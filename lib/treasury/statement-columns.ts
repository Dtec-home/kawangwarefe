/**
 * Cash Statement column helpers (spec 03 §2.2).
 */

/** Purposes page select: how a purpose maps to Cash Statement columns. */
export type StatementColumnChoice = "inherit" | "trust" | "local";

/** Select value → DepartmentPurpose.trustFundOverride (null inherits the department). */
export function statementColumnChoiceToOverride(choice: StatementColumnChoice): boolean | null {
  if (choice === "trust") return true;
  if (choice === "local") return false;
  return null;
}

/** DepartmentPurpose.trustFundOverride → select value. */
export function overrideToStatementColumnChoice(
  override: boolean | null | undefined,
): StatementColumnChoice {
  if (override === true) return "trust";
  if (override === false) return "local";
  return "inherit";
}
