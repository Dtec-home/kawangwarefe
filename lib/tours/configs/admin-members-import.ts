/**
 * Tour config for /admin/members/import (Bulk Member Import).
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_MEMBERS_IMPORT_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="import-header"]',
    title: "Bulk Import Members",
    description:
      "Upload a CSV or Excel file to create or update many members at once. Download the template first to get the exact column headers.",
    side: "bottom",
  },
  {
    element: '[data-tour="import-instructions"]',
    title: "How Import Works",
    description:
      "first_name, last_name, and phone_number are required for every row. Existing members are matched by phone number and updated, never deleted.",
    side: "bottom",
  },
  {
    element: '[data-tour="import-upload"]',
    title: "Upload Your File",
    description:
      "Drag and drop your completed CSV or Excel file here, or click to browse. The (?) icon summarizes the expected columns — see the Help Center for the full format and constraints.",
    side: "top",
  },
]);
