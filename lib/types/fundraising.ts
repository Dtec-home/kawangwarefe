/**
 * Fundraising GraphQL contract as TypeScript types (Fundraising S0, frozen).
 *
 * Mirrors church_BE/fundraising/api/schema.graphql field for field. UI lanes
 * write their own GraphQL documents under lib/graphql/fundraising/ and type the
 * results with these interfaces. A change is a REQUEST to the Integrator,
 * made together with the backend SDL change.
 *
 * Money is a string (Decimal as text), as everywhere else in the schema.
 */

export type CampaignStatus = "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "PAUSED" | "CLOSED";
export type PledgeStatus = "PENDING_OTP" | "OPEN" | "FULFILLED" | "OVERDUE" | "CANCELLED";
export type ChampionStatus = "PENDING" | "ACTIVE" | "INACTIVE";

export interface CampaignProgress {
  target: string;
  raised: string;
  remaining: string;
  percent: number;
  donorCount: number;
  giftCount: number;
  pledged: string;
}

export interface GalleryItem {
  kind: "image" | "youtube" | string;
  url: string;
}

export interface ReminderPolicy {
  frequency: "none" | "weekly" | "monthly" | string;
  daysBeforeDue: number;
  overdueNotices: number;
}

export interface PaymentInstructions {
  paybillNumber: string;
  accountReference: string;
  text: string;
}

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  summary: string;
  story: string;
  coverImageUrl: string;
  gallery: GalleryItem[];
  categoryId: string;
  categoryName: string;
  purposeId: string | null;
  purposeName: string | null;
  targetAmount: string;
  startDate: string | null;
  endDate: string | null;
  paybillCode: string;
  status: CampaignStatus;
  isPublic: boolean;
  allowPledges: boolean;
  allowChampions: boolean;
  reminderPolicy: ReminderPolicy;
  createdByName: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  publicUrl: string;
  paymentInstructions: PaymentInstructions;
  progress: CampaignProgress;
  canApprove: boolean;
}

export interface CampaignInput {
  title: string;
  categoryId: string;
  targetAmount: string;
  paybillCode: string;
  summary?: string;
  story?: string;
  coverImageUrl?: string;
  gallery?: GalleryItem[] | null;
  purposeId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isPublic?: boolean;
  allowPledges?: boolean;
  allowChampions?: boolean;
  reminderPolicy?: Partial<ReminderPolicy> | null;
}

export interface MutationResult {
  success: boolean;
  message: string;
}

export interface CampaignResponse extends MutationResult {
  campaign: Campaign | null;
}

export interface CampaignUpdate {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  publishedAt: string | null;
  smsSentAt: string | null;
  postedByName: string | null;
}

export interface CampaignUpdateResponse extends MutationResult {
  update: CampaignUpdate | null;
}

/** Public view: aggregates only, never donor names. */
export interface PublicCampaign {
  slug: string;
  title: string;
  summary: string;
  story: string;
  coverImageUrl: string;
  gallery: GalleryItem[];
  targetAmount: string;
  endDate: string | null;
  daysLeft: number | null;
  isAcceptingGifts: boolean;
  allowPledges: boolean;
  allowChampions: boolean;
  categoryId: string;
  /** Sent with the gift so a department's auto-split never splits campaign money. */
  purposeId: string | null;
  campaignId: string;
  publicUrl: string;
  paymentInstructions: PaymentInstructions;
  progress: CampaignProgress;
  updates: CampaignUpdate[];
}

export interface ContributorEntry {
  rank: number;
  name: string;
  amount: string;
  giftCount: number;
  lastGivenAt: string;
}

/** Decision 7: every donor named with their cumulative amount. */
export interface WhatsAppContributorList {
  text: string;
  contributorCount: number;
  totalAmount: string;
  asAt: string;
  shareUrl: string;
}

export interface Pledge {
  id: string;
  memberId: string;
  memberName: string;
  campaignId: string | null;
  campaignTitle: string | null;
  categoryId: string | null;
  categoryName: string | null;
  amount: string;
  paid: string;
  balance: string;
  dueDate: string | null;
  status: PledgeStatus;
  source: string;
  createdAt: string;
}

export interface PledgeInput {
  amount: string;
  campaignId?: string | null;
  categoryId?: string | null;
  dueDate?: string | null;
}

export interface PledgeResponse extends MutationResult {
  pledge: Pledge | null;
}

export interface GuestPledgeStartResponse extends MutationResult {
  pledgeId: string | null;
}

export interface PledgeSummary {
  pledged: string;
  paid: string;
  outstanding: string;
  pledgeCount: number;
}

export interface StatementRow {
  on: string;
  description: string;
  channel: string;
  moneyIn: string;
  moneyOut: string;
  balance: string;
}

export interface CampaignStatement {
  campaignId: string;
  dateFrom: string | null;
  dateTo: string | null;
  rows: StatementRow[];
  totalIn: string;
  totalOut: string;
  balance: string;
}

export interface Champion {
  id: string;
  campaignId: string;
  campaignTitle: string;
  campaignSlug: string;
  memberName: string;
  code: string;
  personalTarget: string | null;
  status: ChampionStatus;
  showOnLeaderboard: boolean;
  raised: string;
  donorCount: number;
  publicUrl: string;
  paymentInstructions: PaymentInstructions;
}

export interface ChampionResponse extends MutationResult {
  champion: Champion | null;
}

/** Decision 4: a champion sees names and amounts of their own donors. */
export interface ChampionDashboard {
  champion: Champion;
  donors: ContributorEntry[];
}

export interface PublicChampion {
  campaign: PublicCampaign;
  championName: string;
  code: string;
  raised: string;
  donorCount: number;
  personalTarget: string | null;
  publicUrl: string;
  paymentInstructions: PaymentInstructions;
}

export interface LeaderboardEntry {
  rank: number;
  championName: string;
  code: string;
  raised: string;
  donorCount: number;
}

/** Same shape as the existing ReportResponse (exports). */
export interface FileExportResponse extends MutationResult {
  fileData: string | null;
  filename: string | null;
  contentType: string | null;
}
