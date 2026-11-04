/** A member's number (MP-2, 02_CONTRACTS.md §1). */
export interface MemberPhone {
  id: string;
  /** null for a Pay Bill number known only by its hash. */
  phoneNumber: string | null;
  label: string;
  isPrimary: boolean;
  verified: boolean;
  source: string;
  createdAt: string;
}

/** What a phone mutation answers (PhoneResponse). */
export interface PhoneResult {
  success: boolean;
  message: string;
  code?: string | null;
  conflictMemberId?: string | null;
  conflictMemberName?: string | null;
}

export const HIDDEN_NUMBER = "Pay Bill number (hidden)";

/** "0711 000 001" for 254711000001; the hidden label for a hash-only number. */
export function displayPhone(phoneNumber: string | null): string {
  if (!phoneNumber) return HIDDEN_NUMBER;
  const local = phoneNumber.startsWith("254") ? `0${phoneNumber.slice(3)}` : phoneNumber;
  return local.length === 10 ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : local;
}
