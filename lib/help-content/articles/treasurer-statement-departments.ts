import type { HelpArticle } from "../types";

export const TREASURER_STATEMENT_DEPARTMENTS_ARTICLE: HelpArticle = {
  slug: "treasurer-statement-departments",
  title: "Setting up departments for the Cash Statement",
  category: "Treasury",
  roles: ["admin"],
  relatedRoute: "/admin/categories",
  body: `The columns of the Treasurer's Cash Statement come from your departments — nothing is fixed in the system. Set each department up once, and new departments appear on the statement automatically. The treasurer decides the values. Treasurers can edit a department and save Trust fund and Statement order; changing any other department field needs the admin role.

**Trust fund (remitted to conference)**
On Admin → Categories, edit a department and switch on "Trust fund (remitted to conference)" for money that goes to the conference — for example Tithe, Combined Offering, Camp Meeting Offering, Thanksgiving Offering, Conference Evangelism and Station Fund. Leave it off for local funds such as Church Budget, Building, Local Evangelism, Sabbath School, Choir or Welfare. Each department shows a Trust or Local badge in the list.

**Statement order**
Set "Statement order" to control where the column appears: lower numbers come first. Trust columns always come before local columns; within each group columns follow statement order, then name. Tip: use 10, 20, 30… in the order of the paper sheet so you can slot new departments in between.

**Purposes with their own column**
Sometimes one department holds both trust and local money — for example COMBINED with purposes CKC (trust) and LCB (local). Open the department's Purposes page (treasurer or admin) and set the purpose's "Cash Statement column":
- Inherit from department — the purpose's money is added to the department's column (the default).
- Own column – Trust, or Own column – Local — the purpose gets its own column labelled "DEPARTMENT – PURPOSE" (e.g. COMBINED – CKC), placed after its department's column.

**Which columns are shown**
Every active department, plus any inactive department (or overriding purpose) that received money in the exported period. Renaming a department renames its column.

**Check before exporting**
Use "Statement preview" on the Categories page (or "Preview columns" on the Cash Statement card) to see the trust and local columns in order. A warning appears if no department is marked as a trust fund.`,
};
