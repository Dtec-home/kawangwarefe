/** Merge shapes (MG-2, MEMBER_IDENTITY/02_CONTRACTS.md §2). */

export interface MergeMember {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  memberNumber: string | null;
  isGuest: boolean;
}

export interface MergeMove { key: string; label: string; count: number }
export interface MergeConflict { key: string; description: string; resolution: string }

export interface MergePreviewData {
  survivor: MergeMember;
  duplicate: MergeMember;
  moves: MergeMove[];
  conflicts: MergeConflict[];
  blockers: string[];
  totals: { givenAmount: string; giftCount: number; receiptCount: number; pledgedAmount: string; pledgePaidAmount: string };
  previewHash: string;
}

export interface MemberMergeRecord {
  id: string;
  status: string;
  reason: string;
  mergedBy: string;
  executedAt: string;
  reversedBy?: string | null;
  reversedAt?: string | null;
  reverseReason?: string | null;
  survivor: MergeMember;
  duplicate: MergeMember;
}

export function wholeKes(amount: string): string {
  const value = Number.parseFloat(amount);
  return `KES ${Math.round(Number.isFinite(value) ? value : 0).toLocaleString("en-KE")}`;
}

/** "2 gifts", "1 receipt" from a move. */
export function moveText(move: MergeMove): string {
  const noun = move.label.toLowerCase();
  return `${move.count} ${move.count === 1 ? noun.replace(/s$/, "") : noun}`;
}

export function sameName(typed: string, name: string): boolean {
  const norm = (v: string) => v.trim().replace(/\s+/g, " ").toLowerCase();
  return norm(typed) !== "" && norm(typed) === norm(name);
}
