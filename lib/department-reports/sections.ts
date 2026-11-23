/**
 * The client side of the section registry (DEPARTMENT_REPORTS plan §4.2).
 *
 * The server's `reportSectionSpecs` is the source of truth for titles, order,
 * kinds and limits; the stepper, zod schemas, preview and progress are all
 * built from it. Only the hint text, examples and icon names live here.
 */

import { z } from "zod";

import type {
  DepartmentReportDraft,
  FinancialNotesValue,
  ReportItemInput,
  ReportItemKind,
  ReportLeaderInput,
  ReportSectionSpec,
  SectionKey,
  SectionValue,
} from "@/lib/department-reports/types";

/** `ReportItem.text` limit (02_CONTRACTS.md § Models). */
export const ITEM_MAX_CHARS = 500;
/** Per money-line note (backend `LINE_NOTE_MAX_CHARS`). */
export const LINE_NOTE_MAX_CHARS = 300;

/** List sections → the `kind` their items are saved under. */
export const ITEM_KIND_BY_SECTION = {
  objectives: "objective",
  achievements: "achievement",
  challenges: "challenge",
  recommendations: "recommendation",
} as const satisfies Partial<Record<SectionKey, ReportItemKind>>;

export type ListSectionKey = keyof typeof ITEM_KIND_BY_SECTION;

export function isListSection(key: SectionKey): key is ListSectionKey {
  return key in ITEM_KIND_BY_SECTION;
}

/** Names of the lucide-react icons used for the sections. */
export type SectionIconName =
  | "BookOpen"
  | "Users"
  | "Target"
  | "Trophy"
  | "TriangleAlert"
  | "Lightbulb"
  | "Wallet"
  | "Flag";

export interface SectionHint {
  /** One line telling the leader what to write. */
  hint: string;
  /** A short example, shown as placeholder or helper text. */
  example: string;
  icon: SectionIconName;
}

export const SECTION_HINTS: Record<SectionKey, SectionHint> = {
  introduction: {
    hint: "In two or three sentences, say why your department exists and who it serves.",
    example: "The Youth Department nurtures young people aged 13–35 in faith, fellowship and service.",
    icon: "BookOpen",
  },
  leaders: {
    hint: "List the people who led the department this year and the role each one held.",
    example: "Jane Wanjiru — Leader; Peter Otieno — Secretary",
    icon: "Users",
  },
  objectives: {
    hint: "What did the department set out to do this year? One short goal per line.",
    example: "Hold a youth camp in August",
    icon: "Target",
  },
  achievements: {
    hint: "What did you get done? Link each achievement to the objective it fulfils, if any.",
    example: "Youth camp held at Kamulu with 120 campers",
    icon: "Trophy",
  },
  challenges: {
    hint: "What got in the way? Keep it factual and leave out names.",
    example: "Transport costs rose mid-year",
    icon: "TriangleAlert",
  },
  recommendations: {
    hint: "What should the church or next year's leaders do differently?",
    example: "Start camp savings in January",
    icon: "Lightbulb",
  },
  financial: {
    hint: "These figures come from the treasurer's books and can't be edited. Add a note to explain any line.",
    example: "Most of the money out went to the youth camp.",
    icon: "Wallet",
  },
  conclusion: {
    hint: "Close with a short word of thanks or a look ahead to next year.",
    example: "We thank God and every member who supported the department this year.",
    icon: "Flag",
  },
};

/**
 * The contract defaults (02_CONTRACTS.md § Section registry). For tests and
 * loading states only — real screens use the server's `reportSectionSpecs`.
 */
export const DEFAULT_SECTION_SPECS: readonly ReportSectionSpec[] = [
  { key: "introduction", number: 1, title: "Introduction / Departmental Mission", kind: "text", required: true, minItems: 0, maxItems: 0, maxChars: 1500 },
  { key: "leaders", number: 2, title: "Leaders", kind: "leaders", required: true, minItems: 1, maxItems: 30, maxChars: 0 },
  { key: "objectives", number: 3, title: "Objectives", kind: "list", required: true, minItems: 1, maxItems: 15, maxChars: 500 },
  { key: "achievements", number: 4, title: "Achievements", kind: "list", required: true, minItems: 1, maxItems: 20, maxChars: 500 },
  { key: "challenges", number: 5, title: "Challenges", kind: "list", required: false, minItems: 0, maxItems: 15, maxChars: 500 },
  { key: "recommendations", number: 6, title: "Recommendations", kind: "list", required: false, minItems: 0, maxItems: 15, maxChars: 500 },
  { key: "financial", number: 7, title: "Financial Statement", kind: "financial", required: true, minItems: 0, maxItems: 0, maxChars: 1000 },
  { key: "conclusion", number: 8, title: "Conclusion", kind: "text", required: true, minItems: 0, maxItems: 0, maxChars: 1000 },
];

// ── Schemas ──────────────────────────────────────────────────────────────

const ITEM_NOUN: Record<ListSectionKey, string> = {
  objectives: "objective",
  achievements: "achievement",
  challenges: "challenge",
  recommendations: "recommendation",
};

function itemNoun(spec: ReportSectionSpec): string {
  if (spec.kind === "leaders") return "leader";
  if (isListSection(spec.key)) return ITEM_NOUN[spec.key];
  return "item";
}

const plural = (count: number, noun: string) => (count === 1 ? noun : `${noun}s`);

function withCount<T extends z.ZodType>(schema: z.ZodArray<T>, spec: ReportSectionSpec): z.ZodArray<T> {
  const noun = itemNoun(spec);
  let out = schema;
  if (spec.minItems > 0) out = out.min(spec.minItems, `Add at least ${spec.minItems} ${plural(spec.minItems, noun)}`);
  if (spec.maxItems > 0) out = out.max(spec.maxItems, `No more than ${spec.maxItems} ${plural(spec.maxItems, noun)}`);
  return out;
}

function textSchema(spec: ReportSectionSpec): z.ZodType<string> {
  let schema = z.string();
  if (spec.maxChars > 0) schema = schema.max(spec.maxChars, `Keep it under ${spec.maxChars} characters`);
  if (!spec.required) return schema;
  return schema.refine((value) => value.trim().length > 0, `${spec.title} is required`);
}

const itemSchema = z.object({
  id: z.string().nullish(),
  text: z
    .string()
    .refine((value) => value.trim().length > 0, "Write something or remove this line")
    .refine((value) => value.length <= ITEM_MAX_CHARS, `Keep it under ${ITEM_MAX_CHARS} characters`),
  fulfilsId: z.string().nullish(),
});

const leaderSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  roleTitle: z.string().trim().min(1, "Role is required"),
  phone: z.string().nullish(),
  memberId: z.string().nullish(),
});

function financialSchema(spec: ReportSectionSpec): z.ZodType<FinancialNotesValue> {
  let note = z.string();
  if (spec.maxChars > 0) note = note.max(spec.maxChars, `Keep it under ${spec.maxChars} characters`);
  return z.object({
    note,
    lineNotes: z.array(
      z.object({
        direction: z.enum(["in", "out"]),
        label: z.string(),
        note: z.string().max(LINE_NOTE_MAX_CHARS, `Keep it under ${LINE_NOTE_MAX_CHARS} characters`),
      }),
    ),
  });
}

/** A schema for one section, derived from its spec (kind + limits). */
export function buildSectionSchema(spec: ReportSectionSpec): z.ZodType<SectionValue> {
  switch (spec.kind) {
    case "text":
      return textSchema(spec);
    case "list":
      return withCount(z.array(itemSchema), spec) as z.ZodType<ReportItemInput[]>;
    case "leaders":
      return withCount(z.array(leaderSchema), spec) as z.ZodType<ReportLeaderInput[]>;
    case "financial":
      return financialSchema(spec);
  }
}

/** One zod schema per section key, built from the server's registry. */
export function buildSectionSchemas(
  specs: readonly ReportSectionSpec[],
): Record<SectionKey, z.ZodType<SectionValue>> {
  const out = {} as Record<SectionKey, z.ZodType<SectionValue>>;
  for (const spec of specs) out[spec.key] = buildSectionSchema(spec);
  return out;
}

// ── Values and progress ──────────────────────────────────────────────────

/** The parts of a report that hold section content. */
export type ReportDraftContent = Pick<
  DepartmentReportDraft,
  "introduction" | "conclusion" | "financialNote" | "leaders" | "items"
> & {
  /** Present on a full report; line notes come from the statement lines. */
  financial?: { lines: { direction: "in" | "out"; label: string; note: string }[] };
};

/** A section's current value in the shape `saveSection` and its schema take. */
export function sectionValue(report: ReportDraftContent, spec: ReportSectionSpec): SectionValue {
  switch (spec.kind) {
    case "text":
      return spec.key === "conclusion" ? report.conclusion : spec.key === "introduction" ? report.introduction : "";
    case "leaders":
      return report.leaders.map(({ name, roleTitle, phone, memberId }) => ({ name, roleTitle, phone, memberId }));
    case "list": {
      if (!isListSection(spec.key)) return [];
      const kind = ITEM_KIND_BY_SECTION[spec.key];
      return report.items
        .filter((item) => item.kind === kind)
        .sort((a, b) => a.order - b.order)
        .map(({ id, text, fulfilsId }) => ({ id, text, fulfilsId }));
    }
    case "financial":
      return {
        note: report.financialNote,
        lineNotes: (report.financial?.lines ?? [])
          .filter((line) => line.note)
          .map(({ direction, label, note }) => ({ direction, label, note })),
      };
  }
}

export interface SectionProgress {
  done: number;
  total: number;
  /** Per key: does the section's value pass its schema? */
  complete: Record<SectionKey, boolean>;
}

/**
 * Client-side progress: a section is done when its value passes its schema
 * (so an empty optional list counts, matching the server's completeness
 * check). The server's `report.progress` is authoritative once saved.
 */
export function sectionProgress(
  report: ReportDraftContent | null | undefined,
  specs: readonly ReportSectionSpec[],
): SectionProgress {
  const complete = {} as Record<SectionKey, boolean>;
  let done = 0;
  for (const spec of specs) {
    const ok = !!report && buildSectionSchema(spec).safeParse(sectionValue(report, spec)).success;
    complete[spec.key] = ok;
    if (ok) done += 1;
  }
  return { done, total: specs.length, complete };
}
