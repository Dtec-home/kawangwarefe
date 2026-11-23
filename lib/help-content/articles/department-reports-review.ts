import type { HelpArticle } from "../types";

export const DEPARTMENT_REPORTS_REVIEW_ARTICLE: HelpArticle = {
  slug: "department-reports-review",
  title: "Reviewing department reports and the AGM book",
  category: "Department reports",
  roles: ["admin"],
  relatedRoute: "/admin/department-reports",
  body: `Church staff follow the yearly department reports from Admin → Department Reports.

**Reporting periods (admins)**
Open "Reporting periods" and click "Open period": give it a label such as 2025-2026, the first and last day of the church year, and the date reports are due. Only one period can be open at a time. Close it when the year's reports are done.

**The tracker**
"Open the tracker" lists every department with its status — Not started, Draft, Submitted, Returned or Approved — who leads it, how many sections are done, and an Overdue mark once the due date has passed. Use the chips at the top to filter. Departments with no leader assigned are flagged so you can assign one under Category Admins.

**Reviewing a report (pastor or admin)**
Open a submitted report from the tracker. "Send back" lets you pick a section and say what needs to change (add as many comments as you need); the leader sees them in the report. "Approve" locks the report and files it for the AGM book. You can never approve or send back a report you submitted yourself.

**Money figures**
The financial statement in a submitted report is frozen at the moment it was submitted. Staff also see "Books today vs submitted", which shows whether a late entry has changed the figures since then.

**Reopening (admins)**
An approved report can be reopened with a reason, for example when a late expense was put in the wrong fund. It goes back to the leader as a new version; the reason is kept in the audit log.

**Downloads**
Every report downloads as PDF or Word in the standard layout, with a signature block. On the tracker, "Download AGM book" makes one PDF of all approved reports for the period, with a contents page and a summary table of each department's figures.`,
};
