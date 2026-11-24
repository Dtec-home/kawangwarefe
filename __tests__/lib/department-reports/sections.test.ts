/**
 * Department reports section registry (DR-6): hints, the registry → zod schema
 * builder and client-side progress, all driven by `ReportSectionSpec`s.
 */
import { describe, it, expect } from "vitest";
import * as lucide from "lucide-react";

import {
  DEFAULT_SECTION_SPECS,
  ITEM_KIND_BY_SECTION,
  SECTION_HINTS,
  buildSectionSchemas,
  sectionProgress,
  sectionValue,
  type ReportDraftContent,
  requiredSectionCount,
  sectionState,
} from "@/lib/department-reports/sections";
import type { ReportSectionSpec, SectionKey } from "@/lib/department-reports/types";

const KEYS: SectionKey[] = [
  "introduction", "leaders", "objectives", "achievements",
  "challenges", "recommendations", "financial", "conclusion",
];

const spec = (key: SectionKey) => DEFAULT_SECTION_SPECS.find((s) => s.key === key)!;

const empty: ReportDraftContent = {
  introduction: "", conclusion: "", financialNote: "", leaders: [], items: [],
};

const complete: ReportDraftContent = {
  introduction: "We care for the youth.",
  conclusion: "Thank you.",
  financialNote: "",
  leaders: [{ name: "Jane", roleTitle: "Leader", phone: "", memberId: null }],
  items: [
    { id: "1", kind: "objective", order: 1, text: "Run a camp", fulfilsId: null, carriedFromId: null },
    { id: "2", kind: "achievement", order: 1, text: "Camp held", fulfilsId: "1", carriedFromId: null },
  ],
};

describe("DEFAULT_SECTION_SPECS", () => {
  it("mirrors the contract defaults in template order", () => {
    expect(DEFAULT_SECTION_SPECS.map((s) => s.key)).toEqual(KEYS);
    expect(DEFAULT_SECTION_SPECS.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(spec("introduction")).toMatchObject({ kind: "text", required: true, maxChars: 1500, title: "Introduction / Departmental Mission" });
    expect(spec("leaders")).toMatchObject({ kind: "leaders", minItems: 1 });
    expect(spec("objectives")).toMatchObject({ kind: "list", minItems: 1, maxItems: 15 });
    expect(spec("achievements")).toMatchObject({ kind: "list", minItems: 1, maxItems: 20 });
    expect(spec("challenges")).toMatchObject({ kind: "list", minItems: 0, maxItems: 15 });
    expect(spec("recommendations")).toMatchObject({ kind: "list", minItems: 0, maxItems: 15 });
    expect(spec("financial")).toMatchObject({ kind: "financial", title: "Financial Statement" });
    expect(spec("conclusion")).toMatchObject({ kind: "text", required: true, maxChars: 1000 });
  });
});

describe("SECTION_HINTS", () => {
  it("has a hint, an example and a real lucide icon for every section", () => {
    for (const key of KEYS) {
      const hint = SECTION_HINTS[key];
      expect(hint.hint.length).toBeGreaterThan(10);
      expect(hint.example.length).toBeGreaterThan(5);
      expect(lucide[hint.icon as keyof typeof lucide], `${key}: ${hint.icon}`).toBeDefined();
    }
  });

  it("maps list sections to their item kind", () => {
    expect(ITEM_KIND_BY_SECTION).toEqual({
      objectives: "objective", achievements: "achievement",
      challenges: "challenge", recommendations: "recommendation",
    });
  });
});

describe("buildSectionSchemas", () => {
  const schemas = buildSectionSchemas(DEFAULT_SECTION_SPECS);

  it("builds one schema per spec key", () => {
    expect(Object.keys(schemas)).toEqual(KEYS);
  });

  it("text: required and limited to maxChars", () => {
    expect(schemas.introduction.safeParse("Hello").success).toBe(true);
    const blank = schemas.introduction.safeParse("   ");
    expect(blank.success).toBe(false);
    expect(blank.error?.issues[0].message).toBe("Introduction / Departmental Mission is required");
    expect(schemas.introduction.safeParse("x".repeat(1500)).success).toBe(true);
    const long = schemas.introduction.safeParse("x".repeat(1501));
    expect(long.success).toBe(false);
    expect(long.error?.issues[0].message).toBe("Keep it under 1500 characters");
  });

  it("text: optional when not required", () => {
    const [s] = [{ ...spec("conclusion"), required: false }];
    expect(buildSectionSchemas([s]).conclusion.safeParse("").success).toBe(true);
  });

  it("list: min and max items with friendly messages", () => {
    const none = schemas.objectives.safeParse([]);
    expect(none.success).toBe(false);
    expect(none.error?.issues[0].message).toBe("Add at least 1 objective");
    const many = Array.from({ length: 16 }, (_, i) => ({ text: `Objective ${i}` }));
    const tooMany = schemas.objectives.safeParse(many);
    expect(tooMany.success).toBe(false);
    expect(tooMany.error?.issues[0].message).toBe("No more than 15 objectives");
    expect(schemas.challenges.safeParse([]).success).toBe(true);
    expect(schemas.achievements.safeParse([{ text: "Camp held", fulfilsId: "1" }]).success).toBe(true);
  });

  it("list: every item needs text of at most 500 characters", () => {
    expect(schemas.objectives.safeParse([{ text: " " }]).success).toBe(false);
    expect(schemas.objectives.safeParse([{ text: "x".repeat(501) }]).success).toBe(false);
    expect(schemas.objectives.safeParse([{ id: "4", text: "x".repeat(500), fulfilsId: null }]).success).toBe(true);
  });

  it("list: maxItems 0 means no upper bound", () => {
    const s: ReportSectionSpec = { ...spec("challenges"), maxItems: 0 };
    const many = Array.from({ length: 50 }, () => ({ text: "c" }));
    expect(buildSectionSchemas([s]).challenges.safeParse(many).success).toBe(true);
  });

  it("leaders: at least one, each with a name and a role", () => {
    const none = schemas.leaders.safeParse([]);
    expect(none.success).toBe(false);
    expect(none.error?.issues[0].message).toBe("Add at least 1 leader");
    expect(schemas.leaders.safeParse([{ name: "Jane", roleTitle: "Leader" }]).success).toBe(true);
    expect(schemas.leaders.safeParse([{ name: "", roleTitle: "Leader" }]).success).toBe(false);
    expect(schemas.leaders.safeParse([{ name: "Jane", roleTitle: "" }]).success).toBe(false);
  });

  it("financial: a note and line notes, all optional", () => {
    expect(schemas.financial.safeParse({ note: "", lineNotes: [] }).success).toBe(true);
    expect(schemas.financial.safeParse({
      note: "Good year", lineNotes: [{ direction: "in", label: "General", note: "Sunday offerings" }],
    }).success).toBe(true);
    expect(schemas.financial.safeParse({
      note: "", lineNotes: [{ direction: "sideways", label: "General", note: "" }],
    }).success).toBe(false);
  });

  it("follows the server's specs, not the defaults (registry-driven)", () => {
    const custom = buildSectionSchemas([{ ...spec("introduction"), maxChars: 10 }]);
    expect(custom.introduction.safeParse("x".repeat(11)).success).toBe(false);
  });
});

describe("sectionValue", () => {
  it("reads each section's value out of a report, items in order and by kind", () => {
    const content: ReportDraftContent = {
      ...complete,
      items: [
        { id: "9", kind: "objective", order: 2, text: "Second", fulfilsId: null, carriedFromId: null },
        { id: "8", kind: "objective", order: 1, text: "First", fulfilsId: null, carriedFromId: "3" },
        { id: "7", kind: "challenge", order: 1, text: "Rain", fulfilsId: null, carriedFromId: null },
      ],
    };
    expect(sectionValue(content, spec("introduction"))).toBe("We care for the youth.");
    expect(sectionValue(content, spec("objectives"))).toEqual([
      { id: "8", text: "First", fulfilsId: null },
      { id: "9", text: "Second", fulfilsId: null },
    ]);
    expect(sectionValue(content, spec("challenges"))).toEqual([{ id: "7", text: "Rain", fulfilsId: null }]);
    expect(sectionValue(content, spec("leaders"))).toEqual([{ name: "Jane", roleTitle: "Leader", phone: "", memberId: null }]);
    expect(sectionValue(content, spec("financial"))).toEqual({ note: "", lineNotes: [] });
  });
});

describe("sectionProgress", () => {
  it("counts required sections only, so optional ones never look done before anything is written", () => {
    const p = sectionProgress(empty, DEFAULT_SECTION_SPECS);
    expect(p.total).toBe(6);
    // only the financial statement (from the books) passes on an empty report
    expect(p.done).toBe(1);
    expect(p.complete).toEqual({
      introduction: false, leaders: false, objectives: false, achievements: false,
      challenges: true, recommendations: true, financial: true, conclusion: false,
    });
    expect(p.states).toEqual({
      introduction: "todo", leaders: "todo", objectives: "todo", achievements: "todo",
      challenges: "optional", recommendations: "optional", financial: "done", conclusion: "todo",
    });
  });

  it("reports 6 of 6 for a complete report", () => {
    expect(sectionProgress(complete, DEFAULT_SECTION_SPECS)).toMatchObject({ done: 6, total: 6 });
  });

  it("handles a null report (loading) as nothing done", () => {
    expect(sectionProgress(null, DEFAULT_SECTION_SPECS)).toMatchObject({ done: 0, total: 6 });
  });
});

describe("sectionState", () => {
  it.each([
    [true, true, true, "done"],
    [true, false, true, "todo"],
    [false, true, false, "optional"],
    [false, true, true, "done"],
    [false, false, true, "todo"],
  ] as const)("required=%s passes=%s hasContent=%s -> %s", (required, passes, hasContent, state) => {
    expect(sectionState({ ...spec("challenges"), required }, passes, hasContent)).toBe(state);
  });

  it("counts the required sections", () => {
    expect(requiredSectionCount(DEFAULT_SECTION_SPECS)).toBe(6);
  });
});
