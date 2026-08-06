import type { HelpArticle } from "../types";

export const ADMIN_REPORTS_ARTICLE: HelpArticle = {
  slug: "admin-reports",
  title: "Generating reports and exploring giving analytics",
  category: "Reports",
  roles: ["admin"],
  relatedRoute: "/admin/reports",
  relatedTourKey: "admin_reports_v1",
  body: `The Reports page (Admin → Reports) has four views, switched with the buttons under the page title:

**Overview**
The default view. A live "Department Routing Analytics" card shows a summary — Total Completed, Guest Top-level, Member Routed to Group, and Member Top-level giving — plus a Top Departments / Top Department Purposes / Top Department Groups breakdown, all filterable by department, purpose, date range, and (via "More Filters") group or routing type. Active filters appear as chips; Reset Filters clears them.

**Explore Data**
Everything from Overview, plus a "Detailed Breakdowns" section with sortable, searchable, paginated tables for Departments, Purposes, and Groups. Click any row to open a drill-down dialog with more detail for that row. Choose Sort By (Amount/Count), Direction, and Rows Per Page, or search by name.

**Member Progress**
Look up one member's contribution history. Choose a Department (required), optionally break the results down by Purpose or Group, filter by date range, and choose whether to see individual transactions or Monthly totals. Click Load Report to run it. Once loaded, you can toggle between a table and chart view, and export the result to Excel.

**Exports** (staff only)
Configure and download a report:
- Report Type — Daily, Weekly, Monthly, or a Custom date range.
- Export Format — Excel (.xlsx) or PDF.
- Filter by Departments (optional) — leave nothing checked to include all departments.

Click "Generate & Download Report" to run it, or use one of the three Quick Report Actions cards (Today's Report, Weekly Report, Monthly Report) to generate a common report in one click. Every export attempt — success or failure — is logged in the Export Activity list below, with a Retry Export button on failed attempts.`,
};
