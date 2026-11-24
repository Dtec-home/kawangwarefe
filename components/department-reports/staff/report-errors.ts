/**
 * Friendly wording for `ReportError.code` (02_CONTRACTS.md § Errors) on the
 * staff screens (DR-8). Unknown codes fall back to the server's message.
 */

export interface ReportErrorLike {
  code: string;
  message?: string | null;
}

const FRIENDLY: Record<string, string> = {
  forbidden: "You don't have permission to do that.",
  period_already_open: "Another reporting period is still open. Close it before opening a new one.",
  invalid_dates: "Check the dates: the period must start before it ends, and be due on or after its end.",
  period_closed: "This reporting period is closed.",
  not_found: "That report no longer exists.",
  locked: "This report is locked and can't be changed right now.",
  incomplete: "Some sections still need to be filled in.",
  comment_required: "Say what needs to change before sending the report back.",
  reason_required: "Give a reason for reopening the report.",
  invalid_transition: "This report has changed since you opened it. Refresh the page and try again.",
};

/** Server messages that say more than the generic wording (e.g. a duplicate label). */
const DEFAULT_SERVER_MESSAGES: Record<string, string> = {
  invalid_dates: "The period must start before it ends, and be due on or after its end.",
};

export function reportErrorMessage(error: ReportErrorLike | null | undefined, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;
  const serverMessage = error.message?.trim();
  const generic = DEFAULT_SERVER_MESSAGES[error.code];
  if (generic && serverMessage && serverMessage !== generic) return serverMessage;
  return FRIENDLY[error.code] ?? (serverMessage || fallback);
}

/** A thrown network / GraphQL error as a toast message. */
export function thrownMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return /not allowed/i.test(error.message) ? "You don't have permission to do that." : error.message;
  }
  return fallback;
}
