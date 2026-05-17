/**
 * Admin Reports Page
 * Sprint 4: Reporting System
 *
 * Allows staff to generate and download contribution reports
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { GENERATE_CONTRIBUTION_REPORT } from "@/lib/graphql/mutations";
import { GET_CONTRIBUTION_CATEGORIES, GET_DEPARTMENT_PURPOSES } from "@/lib/graphql/queries";
import { GET_DEPARTMENT_ROUTING_REPORT, GET_MEMBER_PROGRESS_REPORT } from "@/lib/graphql/admin-queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { DepartmentBarChart } from "@/components/admin/DepartmentBarChart";
import { MemberTimelineChart } from "@/components/admin/MemberTimelineChart";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart2, ChevronDown, ChevronRight, Download, FileText, Table as TableIcon, Calendar, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  code: string;
}

interface CategoriesData {
  contributionCategories: Category[];
}

interface Purpose {
  id: string;
  name: string;
  code: string;
}

interface PurposesData {
  departmentPurposes: Purpose[];
}

interface ReportResponse {
  generateContributionReport: {
    success: boolean;
    message: string;
    fileData: string | null;
    filename: string | null;
    contentType: string | null;
  };
}

interface ExportRequestVariables {
  format: string;
  reportType: string;
  dateFrom: string | null;
  dateTo: string | null;
  categoryIds: number[] | null;
  purposeId: number | null;
  groupId: number | null;
  routingType: string | null;
  memberId: number | null;
}

interface ExportActivityItem {
  id: string;
  createdAt: string;
  reportType: string;
  format: string;
  scope: string;
  status: "pending" | "success" | "failed";
  message: string;
  filename: string | null;
  requestVariables: ExportRequestVariables;
}

interface DepartmentRoutingSummary {
  totalCompletedAmount: string;
  totalCompletedCount: number;
  guestTopLevelAmount: string;
  guestTopLevelCount: number;
  memberRoutedAmount: string;
  memberRoutedCount: number;
  memberTopLevelAmount: string;
  memberTopLevelCount: number;
}

interface DepartmentBreakdownItem {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  totalAmount: string;
  totalCount: number;
}

interface DepartmentPurposeBreakdownItem {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  purposeId: string;
  purposeName: string;
  purposeCode: string;
  totalAmount: string;
  totalCount: number;
}

interface DepartmentGroupBreakdownItem {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  groupId: string | null;
  groupName: string;
  isTopLevel: boolean;
  totalAmount: string;
  totalCount: number;
}

interface DepartmentRoutingReportData {
  departmentRoutingReport: {
    summary: DepartmentRoutingSummary;
    byDepartment: DepartmentBreakdownItem[];
    byDepartmentPurpose: DepartmentPurposeBreakdownItem[];
    byDepartmentGroup: DepartmentGroupBreakdownItem[];
  };
}

interface ContributionProgressEntry {
  contributionId: string;
  transactionDate: string;
  amount: string;
  entryType: string;
  purposeId: string | null;
  purposeName: string | null;
  groupId: string | null;
  groupName: string | null;
  runningTotal: string;
}

interface PurposeSubtotal {
  purposeId: string;
  purposeName: string;
  totalAmount: string;
  contributionCount: number;
}

interface GroupSubtotal {
  groupId: string | null;
  groupName: string;
  totalAmount: string;
  contributionCount: number;
}

interface MemberProgressRow {
  memberId: string;
  memberName: string;
  memberNumber: string;
  phoneNumber: string;
  grandTotal: string;
  contributionCount: number;
  byPurpose: PurposeSubtotal[];
  byGroup: GroupSubtotal[];
  contributions: ContributionProgressEntry[];
}

interface MemberProgressReport {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  purposeName: string | null;
  groupName: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  breakdownBy: string;
  totalAmount: string;
  contributingMemberCount: number;
  members: MemberProgressRow[];
}

interface MemberProgressReportData {
  memberProgressReport: MemberProgressReport;
}

interface ProgressQueryVars {
  categoryId: string;
  purposeId: string | null;
  groupId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  memberId: string | null;
  breakdownBy: string;
  timeBucket: string | null;
}

function ReportsPageContent() {
  const { isStaff, isCategoryAdmin, adminCategoryIds } = useUserRole();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [reportMode, setReportMode] = useState<"overview" | "explore" | "exports" | "progress">(() => {
    const m = searchParams.get("mode");
    if (m === "progress" || m === "overview" || m === "explore" || m === "exports") return m;
    return "overview";
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [reportType, setReportType] = useState<string>("daily");
  const [format, setFormat] = useState<string>("excel");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [analyticsCategoryId, setAnalyticsCategoryId] = useState<string>("all");
  const [analyticsPurposeId, setAnalyticsPurposeId] = useState<string>("all");
  const [analyticsGroupId, setAnalyticsGroupId] = useState<string>("all");
  const [analyticsRoutingType, setAnalyticsRoutingType] = useState<string>("all");
  const [exportActivity, setExportActivity] = useState<ExportActivityItem[]>([]);
  const [activeBreakdownTab, setActiveBreakdownTab] = useState<"department" | "purpose" | "group">("department");
  const [breakdownSortBy, setBreakdownSortBy] = useState<"amount" | "count">("amount");
  const [breakdownSortDirection, setBreakdownSortDirection] = useState<"desc" | "asc">("desc");
  const [breakdownPage, setBreakdownPage] = useState<number>(1);
  const [breakdownPageSize, setBreakdownPageSize] = useState<number>(10);
  const [breakdownSearch, setBreakdownSearch] = useState<string>("");
  const [selectedDrillDownRow, setSelectedDrillDownRow] = useState<{type: "department" | "purpose" | "group", data: any} | null>(null);
  const [drillDownOpen, setDrillDownOpen] = useState<boolean>(false);

  // Progress tab state
  const [progressCategoryId, setProgressCategoryId] = useState<string>("");
  const [progressPurposeId, setProgressPurposeId] = useState<string>("");
  const [progressGroupId, setProgressGroupId] = useState<string>("");
  const [progressDateFrom, setProgressDateFrom] = useState<string>("");
  const [progressDateTo, setProgressDateTo] = useState<string>("");
  const [progressMemberSearch, setProgressMemberSearch] = useState<string>("");
  const [progressMemberId, setProgressMemberId] = useState<string>("");
  const [progressBreakdownBy, setProgressBreakdownBy] = useState<"none" | "purpose" | "group">("none");
  const [progressTimeBucket, setProgressTimeBucket] = useState<"none" | "monthly">("none");
  const [progressViewMode, setProgressViewMode] = useState<"table" | "chart">("table");
  const [progressExpandedMembers, setProgressExpandedMembers] = useState<Set<string>>(new Set());
  const [progressSortBy, setProgressSortBy] = useState<"total" | "name" | "count">("total");
  const [progressChartMemberId, setProgressChartMemberId] = useState<string | null>(null);

  const { data: categoriesData } = useQuery<CategoriesData>(GET_CONTRIBUTION_CATEGORIES);
  const allCategories = categoriesData?.contributionCategories || [];
  const categories = isCategoryAdmin && !isStaff
    ? allCategories.filter((category) => adminCategoryIds.includes(category.id))
    : allCategories;

  // Progress tab: purposes for selected department
  const { data: progressPurposesData } = useQuery<PurposesData>(GET_DEPARTMENT_PURPOSES, {
    variables: { categoryId: progressCategoryId, isActive: null },
    skip: !progressCategoryId || progressBreakdownBy !== "purpose",
  });
  const progressPurposes = progressPurposesData?.departmentPurposes || [];

  // Progress tab: lazy query — fires only when admin clicks "Load Report"
  const [loadProgressReport, { data: progressData, loading: progressLoading, error: progressError }] =
    useLazyQuery<MemberProgressReportData>(GET_MEMBER_PROGRESS_REPORT, { fetchPolicy: "network-only" });

  const progressReport = progressData?.memberProgressReport;

  // On mount: if URL has ?mode=progress&member=<id>, pre-fill state
  useEffect(() => {
    const memberParam = searchParams.get("member");
    if (memberParam && reportMode === "progress") {
      setProgressMemberId(memberParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedAnalyticsCategoryId = analyticsCategoryId === "all" ? undefined : analyticsCategoryId;
  const { data: purposesData } = useQuery<PurposesData>(GET_DEPARTMENT_PURPOSES, {
    variables: { categoryId: selectedAnalyticsCategoryId, isActive: null },
    skip: !selectedAnalyticsCategoryId,
  });
  const analyticsPurposes = purposesData?.departmentPurposes || [];

  const customDateFrom = reportType === "custom" && dateFrom
    ? new Date(dateFrom).toISOString()
    : null;
  const customDateTo = reportType === "custom" && dateTo
    ? new Date(dateTo).toISOString()
    : null;

  const selectedExportCategoryIds = selectedCategoryIds.length > 0
    ? selectedCategoryIds
    : (analyticsCategoryId !== "all" ? [analyticsCategoryId] : []);

  const {
    data: routingReportData,
    loading: routingReportLoading,
  } = useQuery<DepartmentRoutingReportData>(GET_DEPARTMENT_ROUTING_REPORT, {
    variables: {
      dateFrom: customDateFrom,
      dateTo: customDateTo,
      categoryId: selectedAnalyticsCategoryId,
      purposeId: analyticsPurposeId === "all" ? null : analyticsPurposeId,
      groupId: analyticsGroupId === "all" ? null : analyticsGroupId,
      routingType: analyticsRoutingType === "all" ? null : analyticsRoutingType,
    },
  });

  const [generateReport, { loading }] = useMutation<ReportResponse>(GENERATE_CONTRIBUTION_REPORT);

  const downloadFile = (base64Data: string, filename: string, contentType: string) => {
    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.codePointAt(i) ?? 0;
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });

    // Create download link
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(url);
  };

  const runExportForActivity = async (activityId: string, requestVariables: ExportRequestVariables) => {
    try {
      const { data } = await generateReport({ variables: requestVariables });

      const result = data?.generateContributionReport;
      if (result?.success) {
        toast.success(result.message);

        if (result.fileData && result.filename) {
          downloadFile(
            result.fileData,
            result.filename,
            result.contentType || "application/octet-stream"
          );
        }

        setExportActivity((prev) => prev.map((item) => (
          item.id === activityId
            ? {
              ...item,
              status: "success",
              message: result.message,
              filename: result.filename,
            }
            : item
        )));
      } else {
        const message = result?.message || "Export failed";
        toast.error(message);
        setExportActivity((prev) => prev.map((item) => (
          item.id === activityId
            ? { ...item, status: "failed", message }
            : item
        )));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      toast.error(`Error: ${message}`);
      setExportActivity((prev) => prev.map((item) => (
        item.id === activityId
          ? { ...item, status: "failed", message }
          : item
      )));
    }
  };

  const handleGenerateReport = async () => {
    // Validate custom date range
    if (reportType === "custom" && (!dateFrom || !dateTo)) {
      toast.error("Please select both start and end dates for custom reports");
      return;
    }

    if (reportType === "custom" && new Date(dateFrom) > new Date(dateTo)) {
      toast.error("Start date must be before end date");
      return;
    }

    const activityId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const scopeSummary = [
      analyticsCategoryId === "all" ? "All Departments" : (categories.find((c) => c.id === analyticsCategoryId)?.name || analyticsCategoryId),
      analyticsPurposeId === "all" ? "All Purposes" : (analyticsPurposes.find((p) => p.id === analyticsPurposeId)?.name || analyticsPurposeId),
      analyticsGroupId === "all" ? "All Groups" : (analyticsGroups.find((g) => g.id === analyticsGroupId)?.name || analyticsGroupId),
      analyticsRoutingType === "all" ? "All Routing" : analyticsRoutingType,
    ].join(" • ");

    const requestVariables: ExportRequestVariables = {
      format,
      reportType,
      dateFrom: customDateFrom,
      dateTo: customDateTo,
      categoryIds: selectedExportCategoryIds.length > 0
        ? selectedExportCategoryIds.map((id) => Number.parseInt(id, 10))
        : null,
      purposeId: analyticsPurposeId === "all" ? null : Number.parseInt(analyticsPurposeId, 10),
      groupId: analyticsGroupId === "all" ? null : Number.parseInt(analyticsGroupId, 10),
      routingType: analyticsRoutingType === "all" ? null : analyticsRoutingType,
      memberId: null,
    };

    setExportActivity((prev) => [
      {
        id: activityId,
        createdAt: new Date().toISOString(),
        reportType,
        format,
        scope: scopeSummary,
        status: "pending" as const,
        message: "Preparing export...",
        filename: null,
        requestVariables,
      },
      ...prev,
    ].slice(0, 10));

    await runExportForActivity(activityId, requestVariables);
  };

  const handleLoadProgressReport = () => {
    if (!progressCategoryId) {
      toast.error("Please select a department first");
      return;
    }
    loadProgressReport({
      variables: {
        categoryId: progressCategoryId,
        purposeId: progressBreakdownBy === "purpose" && progressPurposeId ? progressPurposeId : null,
        groupId: progressBreakdownBy === "group" && progressGroupId ? progressGroupId : null,
        dateFrom: progressDateFrom ? new Date(progressDateFrom).toISOString() : null,
        dateTo: progressDateTo ? new Date(progressDateTo).toISOString() : null,
        memberId: progressMemberId || null,
        breakdownBy: progressBreakdownBy,
        timeBucket: progressTimeBucket === "monthly" ? "monthly" : null,
        limit: 500,
      },
    });
  };

  const toggleProgressMember = (memberId: string) => {
    setProgressExpandedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const sortedProgressMembers = useMemo(() => {
    if (!progressReport) return [];
    const members = [...progressReport.members];
    if (progressSortBy === "total") return members.sort((a, b) => Number(b.grandTotal) - Number(a.grandTotal));
    if (progressSortBy === "name") return members.sort((a, b) => a.memberName.localeCompare(b.memberName));
    return members.sort((a, b) => b.contributionCount - a.contributionCount);
  }, [progressReport, progressSortBy]);

  const progressGrandTotal = useMemo(() => {
    if (!progressReport) return "0";
    return progressReport.totalAmount;
  }, [progressReport]);

  const formatKes = (amount: string | number) => {
    const n = Number(amount);
    if (Number.isNaN(n)) return "KES 0";
    return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const entryTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      mpesa: "bg-green-100 text-green-800",
      cash: "bg-blue-100 text-blue-800",
      manual: "bg-amber-100 text-amber-800",
      envelope: "bg-purple-100 text-purple-800",
      monthly_aggregate: "bg-slate-100 text-slate-700",
    };
    return map[type] || "bg-gray-100 text-gray-700";
  };

  const routingSummary = routingReportData?.departmentRoutingReport?.summary;
  const allDepartmentBreakdown = routingReportData?.departmentRoutingReport?.byDepartment || [];
  const allPurposeBreakdown = routingReportData?.departmentRoutingReport?.byDepartmentPurpose || [];
  const allGroupBreakdown = routingReportData?.departmentRoutingReport?.byDepartmentGroup || [];
  const analyticsGroups = allGroupBreakdown
    .filter((row) => row.groupId)
    .reduce<Array<{ id: string; name: string }>>((acc, row) => {
      if (!row.groupId || acc.some((group) => group.id === row.groupId)) {
        return acc;
      }
      acc.push({ id: row.groupId, name: row.groupName });
      return acc;
    }, []);
  const topDepartments = (routingReportData?.departmentRoutingReport?.byDepartment || []).slice(0, 5);
  const topPurposeBreakdown = (routingReportData?.departmentRoutingReport?.byDepartmentPurpose || []).slice(0, 5);
  const topGroupBreakdown = (routingReportData?.departmentRoutingReport?.byDepartmentGroup || []).slice(0, 5);

  const activeFilterChips = [
    reportType === "custom" && dateFrom && dateTo ? `${dateFrom} → ${dateTo}` : reportType !== "custom" ? reportType : null,
    analyticsCategoryId !== "all" ? `Department: ${categories.find((c) => c.id === analyticsCategoryId)?.name || analyticsCategoryId}` : null,
    analyticsPurposeId !== "all" ? `Purpose: ${analyticsPurposes.find((p) => p.id === analyticsPurposeId)?.name || analyticsPurposeId}` : null,
    analyticsGroupId !== "all" ? `Group: ${analyticsGroups.find((g) => g.id === analyticsGroupId)?.name || analyticsGroupId}` : null,
    analyticsRoutingType !== "all" ? `Routing: ${analyticsRoutingType.replaceAll("_", " ")}` : null,
  ].filter(Boolean) as string[];

  const resetAnalyticsFilters = () => {
    setAnalyticsCategoryId("all");
    setAnalyticsPurposeId("all");
    setAnalyticsGroupId("all");
    setAnalyticsRoutingType("all");
    setReportType("daily");
    setDateFrom("");
    setDateTo("");
  };

  const sortedDepartmentBreakdown = useMemo(() => {
    let rows = [...allDepartmentBreakdown];
    // Apply search filter
    if (breakdownSearch.trim()) {
      const searchLower = breakdownSearch.toLowerCase();
      rows = rows.filter((row) => row.departmentName.toLowerCase().includes(searchLower));
    }
    // Apply sorting
    rows.sort((a, b) => {
      const left = breakdownSortBy === "amount" ? Number(a.totalAmount) : a.totalCount;
      const right = breakdownSortBy === "amount" ? Number(b.totalAmount) : b.totalCount;
      return breakdownSortDirection === "desc" ? right - left : left - right;
    });
    return rows;
  }, [allDepartmentBreakdown, breakdownSortBy, breakdownSortDirection, breakdownSearch]);

  const sortedPurposeBreakdown = useMemo(() => {
    let rows = [...allPurposeBreakdown];
    // Apply search filter
    if (breakdownSearch.trim()) {
      const searchLower = breakdownSearch.toLowerCase();
      rows = rows.filter((row) =>
        row.departmentName.toLowerCase().includes(searchLower) ||
        row.purposeName.toLowerCase().includes(searchLower)
      );
    }
    // Apply sorting
    rows.sort((a, b) => {
      const left = breakdownSortBy === "amount" ? Number(a.totalAmount) : a.totalCount;
      const right = breakdownSortBy === "amount" ? Number(b.totalAmount) : b.totalCount;
      return breakdownSortDirection === "desc" ? right - left : left - right;
    });
    return rows;
  }, [allPurposeBreakdown, breakdownSortBy, breakdownSortDirection, breakdownSearch]);

  const sortedGroupBreakdown = useMemo(() => {
    let rows = [...allGroupBreakdown];
    // Apply search filter
    if (breakdownSearch.trim()) {
      const searchLower = breakdownSearch.toLowerCase();
      rows = rows.filter((row) =>
        row.departmentName.toLowerCase().includes(searchLower) ||
        row.groupName.toLowerCase().includes(searchLower)
      );
    }
    // Apply sorting
    rows.sort((a, b) => {
      const left = breakdownSortBy === "amount" ? Number(a.totalAmount) : a.totalCount;
      const right = breakdownSortBy === "amount" ? Number(b.totalAmount) : b.totalCount;
      return breakdownSortDirection === "desc" ? right - left : left - right;
    });
    return rows;
  }, [allGroupBreakdown, breakdownSortBy, breakdownSortDirection, breakdownSearch]);

  const activeRowsCount = activeBreakdownTab === "department"
    ? sortedDepartmentBreakdown.length
    : activeBreakdownTab === "purpose"
      ? sortedPurposeBreakdown.length
      : sortedGroupBreakdown.length;
  const totalBreakdownPages = Math.max(1, Math.ceil(activeRowsCount / breakdownPageSize));
  const normalizedBreakdownPage = Math.min(breakdownPage, totalBreakdownPages);
  const breakdownStart = (normalizedBreakdownPage - 1) * breakdownPageSize;
  const breakdownEnd = breakdownStart + breakdownPageSize;
  const pagedDepartmentBreakdown = sortedDepartmentBreakdown.slice(breakdownStart, breakdownEnd);
  const pagedPurposeBreakdown = sortedPurposeBreakdown.slice(breakdownStart, breakdownEnd);
  const pagedGroupBreakdown = sortedGroupBreakdown.slice(breakdownStart, breakdownEnd);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and download contribution reports</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={reportMode === "overview" ? "default" : "outline"}
            onClick={() => setReportMode("overview")}
          >
            Overview
          </Button>
          <Button
            variant={reportMode === "explore" ? "default" : "outline"}
            onClick={() => setReportMode("explore")}
          >
            Explore Data
          </Button>
          <Button
            variant={reportMode === "progress" ? "default" : "outline"}
            onClick={() => setReportMode("progress")}
            className="flex items-center gap-1"
          >
            <TrendingUp className="h-4 w-4" />
            Member Progress
          </Button>
          {isStaff && (
            <Button
              variant={reportMode === "exports" ? "default" : "outline"}
              onClick={() => setReportMode("exports")}
            >
              Exports
            </Button>
          )}
        </div>

        {/* Report Configuration */}
        {isStaff && reportMode === "exports" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Report
            </CardTitle>
            <CardDescription>
              Configure report parameters and download in your preferred format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Type */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="reportType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Daily Report (Today)
                      </div>
                    </SelectItem>
                    <SelectItem value="weekly">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Weekly Report (This Week)
                      </div>
                    </SelectItem>
                    <SelectItem value="monthly">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Monthly Report (This Month)
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Custom Date Range
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Export Format */}
              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger id="format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <TableIcon className="h-4 w-4" />
                        Excel (.xlsx)
                      </div>
                    </SelectItem>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        PDF (.pdf)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Date Range */}
            {reportType === "custom" && (
              <div className="grid md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Start Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">End Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Department Filter */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Filter by Departments (Optional)</h3>
                {selectedCategoryIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategoryIds([])}
                  >
                    Clear selection
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedCategoryIds.length === 0
                  ? "All departments will be included"
                  : `${selectedCategoryIds.length} department(s) selected`}
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                {categories.map((category) => {
                  const isChecked = selectedCategoryIds.includes(category.id);
                  return (
                    <label
                      key={category.id}
                      className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-primary/10 border-primary"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                          } else {
                            setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== category.id));
                          }
                        }}
                      />
                      <div>
                        <span className="font-medium text-sm">{category.name}</span>
                        <span className="text-xs text-muted-foreground ml-1">({category.code})</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleGenerateReport}
                disabled={loading}
                size="lg"
              >
                <Download className="h-4 w-4 mr-2" />
                {loading ? "Generating..." : "Generate & Download Report"}
              </Button>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Quick Report Actions */}
        {isStaff && reportMode === "exports" && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            onClick={() => {
              setReportType("daily");
              setFormat("excel");
              setSelectedCategoryIds([]);
              setTimeout(handleGenerateReport, 100);
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <h3 className="font-semibold">Today's Report</h3>
                  <p className="text-sm text-muted-foreground">Excel format</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            onClick={() => {
              setReportType("weekly");
              setFormat("excel");
              setSelectedCategoryIds([]);
              setTimeout(handleGenerateReport, 100);
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <h3 className="font-semibold">Weekly Report</h3>
                  <p className="text-sm text-muted-foreground">Excel format</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            onClick={() => {
              setReportType("monthly");
              setFormat("pdf");
              setSelectedCategoryIds([]);
              setTimeout(handleGenerateReport, 100);
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <h3 className="font-semibold">Monthly Report</h3>
                  <p className="text-sm text-muted-foreground">PDF format</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {isStaff && reportMode === "exports" && (
          <Card>
            <CardHeader>
              <CardTitle>Export Activity</CardTitle>
              <CardDescription>
                Recent export attempts and statuses. Latest 10 entries are shown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exportActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No exports yet. Generate a report to see activity here.</p>
              ) : (
                <div className="space-y-3">
                  {exportActivity.map((activity) => (
                    <div key={activity.id} className="rounded-md border p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {activity.reportType.toUpperCase()} • {activity.format.toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</p>
                        </div>
                        <span
                          className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium ${
                            activity.status === "success"
                              ? "bg-emerald-100 text-emerald-700"
                              : activity.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {activity.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{activity.scope}</p>
                      <p className="mt-1 text-sm">{activity.message}</p>
                      {activity.filename && (
                        <p className="mt-1 text-xs text-muted-foreground">File: {activity.filename}</p>
                      )}
                      {activity.status === "failed" && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              setExportActivity((prev) => prev.map((item) => (
                                item.id === activity.id
                                  ? { ...item, status: "pending", message: "Retrying export..." }
                                  : item
                              )));
                              await runExportForActivity(activity.id, activity.requestVariables);
                            }}
                          >
                            Retry Export
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Department Routing Analytics */}
        {(reportMode === "overview" || reportMode === "explore") && (
        <Card>
          <CardHeader>
            <CardTitle>Department Routing Analytics</CardTitle>
            <CardDescription>
              Live split of top-level, purpose-based, and group-routed giving
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Active Filters</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {activeFilterChips.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No filters applied</span>
                  ) : (
                    activeFilterChips.map((chip) => (
                      <span key={chip} className="rounded-full border px-2 py-1 text-xs">
                        {chip}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters((current) => !current)}
                >
                  {showAdvancedFilters ? "Hide Advanced Filters" : "More Filters"}
                </Button>
                <Button variant="ghost" size="sm" onClick={resetAnalyticsFilters}>
                  Reset Filters
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="analytics-department">Department</Label>
                <Select
                  value={analyticsCategoryId}
                  onValueChange={(value) => {
                    setAnalyticsCategoryId(value);
                    setAnalyticsPurposeId("all");
                    setAnalyticsGroupId("all");
                  }}
                >
                  <SelectTrigger id="analytics-department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="analytics-purpose">Purpose</Label>
                <Select
                  value={analyticsPurposeId}
                  onValueChange={(value) => {
                    setAnalyticsPurposeId(value);
                    setAnalyticsGroupId("all");
                  }}
                  disabled={!selectedAnalyticsCategoryId}
                >
                  <SelectTrigger id="analytics-purpose">
                    <SelectValue placeholder={selectedAnalyticsCategoryId ? "All Purposes" : "Select department first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Purposes</SelectItem>
                    {analyticsPurposes.map((purpose) => (
                      <SelectItem key={purpose.id} value={purpose.id}>
                        {purpose.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showAdvancedFilters && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="analytics-group">Group</Label>
                <Select
                  value={analyticsGroupId}
                  onValueChange={setAnalyticsGroupId}
                >
                  <SelectTrigger id="analytics-group">
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {analyticsGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}

              {showAdvancedFilters && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="analytics-routing-type">Routing Type</Label>
                <Select
                  value={analyticsRoutingType}
                  onValueChange={setAnalyticsRoutingType}
                >
                  <SelectTrigger id="analytics-routing-type">
                    <SelectValue placeholder="All Routing Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Routing Types</SelectItem>
                    <SelectItem value="GUEST_TOP_LEVEL">Guest Top-level</SelectItem>
                    <SelectItem value="MEMBER_ROUTED">Member Routed to Group</SelectItem>
                    <SelectItem value="MEMBER_TOP_LEVEL">Member Top-level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              )}
            </div>

            {routingReportLoading && (
              <p className="text-sm text-muted-foreground">Loading routing analytics...</p>
            )}

            {!routingReportLoading && routingSummary && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Total Completed</p>
                    <p className="text-lg font-semibold">KES {Number(routingSummary.totalCompletedAmount).toLocaleString("en-KE")}</p>
                    <p className="text-xs text-muted-foreground">{routingSummary.totalCompletedCount} contributions</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Guest Top-level</p>
                    <p className="text-lg font-semibold">KES {Number(routingSummary.guestTopLevelAmount).toLocaleString("en-KE")}</p>
                    <p className="text-xs text-muted-foreground">{routingSummary.guestTopLevelCount} contributions</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Member Routed to Group</p>
                    <p className="text-lg font-semibold">KES {Number(routingSummary.memberRoutedAmount).toLocaleString("en-KE")}</p>
                    <p className="text-xs text-muted-foreground">{routingSummary.memberRoutedCount} contributions</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Member Top-level</p>
                    <p className="text-lg font-semibold">KES {Number(routingSummary.memberTopLevelAmount).toLocaleString("en-KE")}</p>
                    <p className="text-xs text-muted-foreground">{routingSummary.memberTopLevelCount} contributions</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <p className="mb-2 text-sm font-medium">Top Departments</p>
                    <div className="space-y-2">
                      {topDepartments.length === 0 && (
                        <p className="text-xs text-muted-foreground">No department data</p>
                      )}
                      {topDepartments.map((row) => (
                        <div key={row.departmentId} className="flex items-center justify-between text-sm">
                          <span>{row.departmentName}</span>
                          <span className="font-medium">KES {Number(row.totalAmount).toLocaleString("en-KE")}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md border p-3">
                    <p className="mb-2 text-sm font-medium">Top Department Purposes</p>
                    <div className="space-y-2">
                      {topPurposeBreakdown.length === 0 && (
                        <p className="text-xs text-muted-foreground">No purpose data</p>
                      )}
                      {topPurposeBreakdown.map((row) => (
                        <div key={`${row.departmentId}-${row.purposeId}`} className="flex items-center justify-between text-sm">
                          <span>{row.departmentName} • {row.purposeName}</span>
                          <span className="font-medium">KES {Number(row.totalAmount).toLocaleString("en-KE")}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md border p-3">
                    <p className="mb-2 text-sm font-medium">Top Department Groups</p>
                    <div className="space-y-2">
                      {topGroupBreakdown.length === 0 && (
                        <p className="text-xs text-muted-foreground">No group data</p>
                      )}
                      {topGroupBreakdown.map((row, index) => {
                        const groupKey = row.groupId || `top-${index}`;
                        return (
                          <div key={`${row.departmentId}-${groupKey}`} className="flex items-center justify-between text-sm">
                            <span>{row.departmentName} • {row.groupName}</span>
                            <span className="font-medium">KES {Number(row.totalAmount).toLocaleString("en-KE")}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {reportMode === "explore" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Detailed Breakdowns</h3>

                  <div className="flex flex-col gap-3 rounded-md border p-3">
                    <p className="text-sm font-medium">Breakdown View</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={activeBreakdownTab === "department" ? "default" : "outline"}
                        onClick={() => {
                          setActiveBreakdownTab("department");
                          setBreakdownPage(1);
                        }}
                      >
                        Departments
                      </Button>
                      <Button
                        size="sm"
                        variant={activeBreakdownTab === "purpose" ? "default" : "outline"}
                        onClick={() => {
                          setActiveBreakdownTab("purpose");
                          setBreakdownPage(1);
                        }}
                      >
                        Purposes
                      </Button>
                      <Button
                        size="sm"
                        variant={activeBreakdownTab === "group" ? "default" : "outline"}
                        onClick={() => {
                          setActiveBreakdownTab("group");
                          setBreakdownPage(1);
                        }}
                      >
                        Groups
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="space-y-1 md:col-span-1">
                        <Label htmlFor="breakdown-sort-by">Sort By</Label>
                        <Select
                          value={breakdownSortBy}
                          onValueChange={(value) => {
                            setBreakdownSortBy(value as "amount" | "count");
                            setBreakdownPage(1);
                          }}
                        >
                          <SelectTrigger id="breakdown-sort-by">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="amount">Amount</SelectItem>
                            <SelectItem value="count">Count</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 md:col-span-1">
                        <Label htmlFor="breakdown-sort-direction">Direction</Label>
                        <Select
                          value={breakdownSortDirection}
                          onValueChange={(value) => {
                            setBreakdownSortDirection(value as "desc" | "asc");
                            setBreakdownPage(1);
                          }}
                        >
                          <SelectTrigger id="breakdown-sort-direction">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">Highest First</SelectItem>
                            <SelectItem value="asc">Lowest First</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 md:col-span-1">
                        <Label htmlFor="breakdown-page-size">Rows Per Page</Label>
                        <Select
                          value={String(breakdownPageSize)}
                          onValueChange={(value) => {
                            setBreakdownPageSize(Number.parseInt(value, 10));
                            setBreakdownPage(1);
                          }}
                        >
                          <SelectTrigger id="breakdown-page-size">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-1 flex items-end justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setBreakdownPage((current) => Math.max(1, current - 1))}
                          disabled={normalizedBreakdownPage <= 1}
                        >
                          Previous
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setBreakdownPage((current) => Math.min(totalBreakdownPages, current + 1))}
                          disabled={normalizedBreakdownPage >= totalBreakdownPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Page {normalizedBreakdownPage} of {totalBreakdownPages} • {activeRowsCount} row(s)
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor="breakdown-search">Search {activeBreakdownTab === "department" ? "Departments" : activeBreakdownTab === "purpose" ? "Purposes" : "Groups"}</Label>
                      <Input
                        id="breakdown-search"
                        placeholder="Search by name..."
                        value={breakdownSearch}
                        onChange={(e) => {
                          setBreakdownSearch(e.target.value);
                          setBreakdownPage(1);
                        }}
                      />
                    </div>
                  </div>

                  {activeBreakdownTab === "department" && (
                  <div className="rounded-md border">
                    <div className="border-b px-4 py-3">
                      <p className="text-sm font-medium">By Department ({allDepartmentBreakdown.length})</p>
                    </div>
                    <div className="overflow-auto">
                      {allDepartmentBreakdown.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-muted-foreground">No department data</p>
                      ) : (
                        <>
                          {/* Desktop Table View */}
                          <div className="hidden md:block max-h-96">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/40">
                                  <th className="px-4 py-2 text-left font-medium">Department</th>
                                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                                  <th className="px-4 py-2 text-right font-medium">Count</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pagedDepartmentBreakdown.map((row) => (
                                  <tr
                                    key={row.departmentId}
                                    className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => {
                                      setSelectedDrillDownRow({type: "department", data: row});
                                      setDrillDownOpen(true);
                                    }}
                                  >
                                    <td className="px-4 py-2">{row.departmentName}</td>
                                    <td className="px-4 py-2 text-right font-medium">KES {Number(row.totalAmount).toLocaleString("en-KE")}</td>
                                    <td className="px-4 py-2 text-right">{row.totalCount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Card View */}
                          <div className="md:hidden space-y-2 p-4 max-h-96 overflow-auto">
                            {pagedDepartmentBreakdown.map((row) => (
                              <div
                                key={row.departmentId}
                                className="rounded-md border p-3 bg-card cursor-pointer hover:shadow-sm transition-shadow active:bg-muted/50"
                                onClick={() => {
                                  setSelectedDrillDownRow({type: "department", data: row});
                                  setDrillDownOpen(true);
                                }}
                              >
                                <p className="font-medium text-sm">{row.departmentName}</p>
                                <div className="grid grid-cols-2 gap-3 mt-2 text-xs text-muted-foreground">
                                  <div>
                                    <p className="text-muted-foreground">Amount</p>
                                    <p className="font-semibold text-foreground">KES {Number(row.totalAmount).toLocaleString("en-KE")}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Count</p>
                                    <p className="font-semibold text-foreground">{row.totalCount}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  )}

                  {activeBreakdownTab === "purpose" && (
                  <div className="rounded-md border">
                    <div className="border-b px-4 py-3">
                      <p className="text-sm font-medium">By Purpose ({allPurposeBreakdown.length})</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Purpose totals include contributions auto-split to this purpose</p>
                    </div>
                    <div className="overflow-auto">
                      {allPurposeBreakdown.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-muted-foreground">No purpose data</p>
                      ) : (
                        <>
                          {/* Desktop Table View */}
                          <div className="hidden md:block max-h-96">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/40">
                                  <th className="px-4 py-2 text-left font-medium">Department</th>
                                  <th className="px-4 py-2 text-left font-medium">Purpose</th>
                                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                                  <th className="px-4 py-2 text-right font-medium">Count</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pagedPurposeBreakdown.map((row) => (
                                  <tr
                                    key={`${row.departmentId}-${row.purposeId}`}
                                    className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => {
                                      setSelectedDrillDownRow({type: "purpose", data: row});
                                      setDrillDownOpen(true);
                                    }}
                                  >
                                    <td className="px-4 py-2">{row.departmentName}</td>
                                    <td className="px-4 py-2">{row.purposeName}</td>
                                    <td className="px-4 py-2 text-right font-medium">KES {Number(row.totalAmount).toLocaleString("en-KE")}</td>
                                    <td className="px-4 py-2 text-right">{row.totalCount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Card View */}
                          <div className="md:hidden space-y-2 p-4 max-h-96 overflow-auto">
                            {pagedPurposeBreakdown.map((row) => (
                              <div
                                key={`${row.departmentId}-${row.purposeId}`}
                                className="rounded-md border p-3 bg-card cursor-pointer hover:shadow-sm transition-shadow active:bg-muted/50"
                                onClick={() => {
                                  setSelectedDrillDownRow({type: "purpose", data: row});
                                  setDrillDownOpen(true);
                                }}
                              >
                                <p className="font-medium text-sm">{row.departmentName}</p>
                                <p className="text-xs text-muted-foreground">{row.purposeName}</p>
                                <div className="grid grid-cols-2 gap-3 mt-2 text-xs text-muted-foreground">
                                  <div>
                                    <p className="text-muted-foreground">Amount</p>
                                    <p className="font-semibold text-foreground">KES {Number(row.totalAmount).toLocaleString("en-KE")}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Count</p>
                                    <p className="font-semibold text-foreground">{row.totalCount}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  )}

                  {activeBreakdownTab === "group" && (
                  <div className="rounded-md border">
                    <div className="border-b px-4 py-3">
                      <p className="text-sm font-medium">By Group ({allGroupBreakdown.length})</p>
                    </div>
                    <div className="overflow-auto">
                      {allGroupBreakdown.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-muted-foreground">No group data</p>
                      ) : (
                        <>
                          {/* Desktop Table View */}
                          <div className="hidden md:block max-h-96">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/40">
                                  <th className="px-4 py-2 text-left font-medium">Department</th>
                                  <th className="px-4 py-2 text-left font-medium">Group</th>
                                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                                  <th className="px-4 py-2 text-right font-medium">Count</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pagedGroupBreakdown.map((row, index) => {
                                  const groupKey = row.groupId || `top-${breakdownStart + index}`;
                                  return (
                                    <tr
                                      key={`${row.departmentId}-${groupKey}`}
                                      className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                                      onClick={() => {
                                        setSelectedDrillDownRow({type: "group", data: row});
                                        setDrillDownOpen(true);
                                      }}
                                    >
                                      <td className="px-4 py-2">{row.departmentName}</td>
                                      <td className="px-4 py-2">{row.groupName}</td>
                                      <td className="px-4 py-2 text-right font-medium">KES {Number(row.totalAmount).toLocaleString("en-KE")}</td>
                                      <td className="px-4 py-2 text-right">{row.totalCount}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Card View */}
                          <div className="md:hidden space-y-2 p-4 max-h-96 overflow-auto">
                            {pagedGroupBreakdown.map((row, index) => {
                              const groupKey = row.groupId || `top-${breakdownStart + index}`;
                              return (
                                <div
                                  key={`${row.departmentId}-${groupKey}`}
                                  className="rounded-md border p-3 bg-card cursor-pointer hover:shadow-sm transition-shadow active:bg-muted/50"
                                  onClick={() => {
                                    setSelectedDrillDownRow({type: "group", data: row});
                                    setDrillDownOpen(true);
                                  }}
                                >
                                  <p className="font-medium text-sm">{row.departmentName}</p>
                                  <p className="text-xs text-muted-foreground">{row.groupName}</p>
                                  <div className="grid grid-cols-2 gap-3 mt-2 text-xs text-muted-foreground">
                                    <div>
                                      <p className="text-muted-foreground">Amount</p>
                                      <p className="font-semibold text-foreground">KES {Number(row.totalAmount).toLocaleString("en-KE")}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Count</p>
                                      <p className="font-semibold text-foreground">{row.totalCount}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  )}
                </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        )}
      </div>

      {/* Drill-Down Dialog */}
      <Dialog open={drillDownOpen} onOpenChange={setDrillDownOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDrillDownRow?.type === "department"
                ? selectedDrillDownRow?.data?.departmentName
                : selectedDrillDownRow?.type === "purpose"
                  ? `${selectedDrillDownRow?.data?.departmentName} → ${selectedDrillDownRow?.data?.purposeName}`
                  : `${selectedDrillDownRow?.data?.departmentName} → ${selectedDrillDownRow?.data?.groupName}`}
            </DialogTitle>
            <DialogDescription>
              {selectedDrillDownRow?.type === "department"
                ? "Detailed breakdown by purpose"
                : selectedDrillDownRow?.type === "purpose"
                  ? "Detailed breakdown by group"
                  : "Contribution details"}
            </DialogDescription>
          </DialogHeader>

          <div className="px-4 py-3 space-y-4 max-h-96 overflow-auto">
            {selectedDrillDownRow && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-semibold">KES {Number(selectedDrillDownRow.data.totalAmount).toLocaleString("en-KE")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Count</p>
                    <p className="text-lg font-semibold">{selectedDrillDownRow.data.totalCount} contributions</p>
                  </div>
                </div>

                {selectedDrillDownRow.type === "department" && (
                  <>
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-3">Top Purposes</p>
                      <div className="space-y-2">
                        {allPurposeBreakdown
                          .filter((row) => row.departmentId === selectedDrillDownRow.data.departmentId)
                          .sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount))
                          .slice(0, 5)
                          .map((row) => (
                            <div key={row.purposeId} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                              <span className="text-sm">{row.purposeName}</span>
                              <div className="text-right text-xs">
                                <p className="font-medium">KES {Number(row.totalAmount).toLocaleString("en-KE")}</p>
                                <p className="text-muted-foreground">{row.totalCount} items</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedDrillDownRow.type === "purpose" && (
                  <>
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-3">Top Groups</p>
                      <div className="space-y-2">
                        {allGroupBreakdown
                          .filter(
                            (row) =>
                              row.departmentId === selectedDrillDownRow.data.departmentId
                          )
                          .sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount))
                          .slice(0, 5)
                          .map((row, index) => (
                            <div key={row.groupId || `${row.departmentId}-${index}`} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                              <span className="text-sm">{row.groupName}</span>
                              <div className="text-right text-xs">
                                <p className="font-medium">KES {Number(row.totalAmount).toLocaleString("en-KE")}</p>
                                <p className="text-muted-foreground">{row.totalCount} items</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Member Progress Tab ──────────────────────────────────────────── */}
      {reportMode === "progress" && (
        <div className="space-y-6">
          {/* Filter panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Member Contribution Progress
              </CardTitle>
              <CardDescription>
                View individual member contribution history with running totals, broken down by department, purpose, or group.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Department (required) */}
                <div className="space-y-1">
                  <Label>Department <span className="text-destructive">*</span></Label>
                  <Select value={progressCategoryId} onValueChange={(v) => {
                    setProgressCategoryId(v);
                    setProgressPurposeId("");
                    setProgressGroupId("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department…" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Break down by */}
                <div className="space-y-1">
                  <Label>Break down by</Label>
                  <Select value={progressBreakdownBy} onValueChange={(v) => {
                    setProgressBreakdownBy(v as "none" | "purpose" | "group");
                    setProgressPurposeId("");
                    setProgressGroupId("");
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (totals only)</SelectItem>
                      <SelectItem value="purpose">By Purpose</SelectItem>
                      <SelectItem value="group">By Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Purpose filter — only when breakdown = purpose */}
                {progressBreakdownBy === "purpose" && (
                  <div className="space-y-1">
                    <Label>Purpose (optional filter)</Label>
                    <Select value={progressPurposeId || "all"} onValueChange={(v) => setProgressPurposeId(v === "all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All purposes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All purposes</SelectItem>
                        {progressPurposes.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Date range */}
                <div className="space-y-1">
                  <Label>Date from</Label>
                  <Input type="date" value={progressDateFrom} onChange={(e) => setProgressDateFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Date to</Label>
                  <Input type="date" value={progressDateTo} onChange={(e) => setProgressDateTo(e.target.value)} />
                </div>

                {/* Time bucket */}
                <div className="space-y-1">
                  <Label>Time grouping</Label>
                  <Select value={progressTimeBucket} onValueChange={(v) => setProgressTimeBucket(v as "none" | "monthly")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Individual transactions</SelectItem>
                      <SelectItem value="monthly">Monthly totals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleLoadProgressReport} disabled={progressLoading || !progressCategoryId}>
                  {progressLoading ? "Loading…" : "Load Report"}
                </Button>
                {progressReport && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => setProgressViewMode((m) => m === "table" ? "chart" : "table")}
                    >
                      {progressViewMode === "table" ? <><BarChart2 className="h-4 w-4" /> Chart view</> : <><TableIcon className="h-4 w-4" /> Table view</>}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => {
                        generateReport({
                          variables: {
                            format: "excel",
                            reportType: "member_progress",
                            categoryId: Number(progressCategoryId),
                            purposeId: progressPurposeId ? Number(progressPurposeId) : null,
                            groupId: progressGroupId ? Number(progressGroupId) : null,
                            dateFrom: progressDateFrom ? new Date(progressDateFrom).toISOString() : null,
                            dateTo: progressDateTo ? new Date(progressDateTo).toISOString() : null,
                            memberId: progressMemberId ? Number(progressMemberId) : null,
                            timeBucket: progressTimeBucket === "monthly" ? "monthly" : null,
                          },
                        }).then(({ data }) => {
                          const r = data?.generateContributionReport;
                          if (r?.success && r.fileData && r.filename) {
                            downloadFile(r.fileData, r.filename, r.contentType || "application/octet-stream");
                            toast.success("Excel downloaded");
                          } else {
                            toast.error(r?.message || "Export failed");
                          }
                        });
                      }}
                    >
                      <Download className="h-4 w-4" /> Export Excel
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error state */}
          {progressError && (
            <Card className="border-destructive">
              <CardContent className="pt-4 text-destructive text-sm">
                {progressError.message}
              </CardContent>
            </Card>
          )}

          {/* Loading skeleton */}
          {progressLoading && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty state — department selected, report ran, no results */}
          {!progressLoading && progressReport && progressReport.members.length === 0 && (
            <Card>
              <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                No contributions found for the selected filters.
              </CardContent>
            </Card>
          )}

          {/* Prompt — no report loaded yet */}
          {!progressLoading && !progressReport && !progressError && (
            <Card>
              <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                Select a department above and click <strong>Load Report</strong> to view member progress.
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {!progressLoading && progressReport && progressReport.members.length > 0 && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Total Collected</p>
                    <p className="text-2xl font-bold">{formatKes(progressReport.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{progressReport.departmentName}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Contributing Members</p>
                    <p className="text-2xl font-bold">{progressReport.contributingMemberCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Average per Member</p>
                    <p className="text-2xl font-bold">
                      {formatKes(
                        progressReport.contributingMemberCount > 0
                          ? Number(progressReport.totalAmount) / progressReport.contributingMemberCount
                          : 0
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Sort controls (only shown in table mode) */}
              {progressViewMode === "table" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  {(["total", "name", "count"] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={progressSortBy === s ? "default" : "outline"}
                      onClick={() => setProgressSortBy(s)}
                    >
                      {s === "total" ? "Grand Total" : s === "name" ? "Name" : "# Contributions"}
                    </Button>
                  ))}
                </div>
              )}

              {/* Chart view */}
              {progressViewMode === "chart" && (
                <Card>
                  <CardContent className="pt-6">
                    {progressChartMemberId ? (() => {
                      const m = progressReport!.members.find((m) => m.memberId === progressChartMemberId);
                      return m ? (
                        <MemberTimelineChart
                          memberName={m.memberName}
                          contributions={m.contributions}
                          timeBucket={progressTimeBucket}
                          onBack={() => setProgressChartMemberId(null)}
                        />
                      ) : null;
                    })() : (
                      <DepartmentBarChart
                        members={sortedProgressMembers}
                        breakdownBy={progressBreakdownBy}
                        onMemberClick={(id) => setProgressChartMemberId(id)}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Member Progress Table */}
              {progressViewMode === "table" && <Card>
                <CardContent className="pt-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium w-8" />
                        <th className="text-left p-3 font-medium">Member</th>
                        <th className="text-left p-3 font-medium hidden sm:table-cell">Phone</th>
                        {progressBreakdownBy === "purpose" && (
                          sortedProgressMembers[0]?.byPurpose.map((p) => (
                            <th key={p.purposeId} className="text-right p-3 font-medium">{p.purposeName}</th>
                          ))
                        )}
                        {progressBreakdownBy === "group" && (
                          sortedProgressMembers[0]?.byGroup.map((g) => (
                            <th key={g.groupId ?? "top"} className="text-right p-3 font-medium">{g.groupName}</th>
                          ))
                        )}
                        <th className="text-right p-3 font-medium"># Contribs</th>
                        <th className="text-right p-3 font-medium">Grand Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProgressMembers.map((member) => {
                        const isExpanded = progressExpandedMembers.has(member.memberId);
                        return (
                          <>
                            <tr
                              key={member.memberId}
                              className="border-b hover:bg-muted/30 cursor-pointer"
                              onClick={() => toggleProgressMember(member.memberId)}
                            >
                              <td className="p-3 text-muted-foreground">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </td>
                              <td className="p-3 font-medium">{member.memberName}</td>
                              <td className="p-3 text-muted-foreground hidden sm:table-cell">{member.phoneNumber}</td>
                              {progressBreakdownBy === "purpose" && (() => {
                                const purposeMap = Object.fromEntries(member.byPurpose.map((p) => [p.purposeId, p.totalAmount]));
                                return sortedProgressMembers[0]?.byPurpose.map((p) => (
                                  <td key={p.purposeId} className="p-3 text-right">
                                    {purposeMap[p.purposeId] ? formatKes(purposeMap[p.purposeId]) : "—"}
                                  </td>
                                ));
                              })()}
                              {progressBreakdownBy === "group" && (() => {
                                const groupMap = Object.fromEntries(member.byGroup.map((g) => [g.groupId ?? "top", g.totalAmount]));
                                return sortedProgressMembers[0]?.byGroup.map((g) => (
                                  <td key={g.groupId ?? "top"} className="p-3 text-right">
                                    {groupMap[g.groupId ?? "top"] ? formatKes(groupMap[g.groupId ?? "top"]) : "—"}
                                  </td>
                                ));
                              })()}
                              <td className="p-3 text-right text-muted-foreground">{member.contributionCount}</td>
                              <td className="p-3 text-right font-semibold">{formatKes(member.grandTotal)}</td>
                            </tr>

                            {/* Expanded individual contribution rows */}
                            {isExpanded && member.contributions.map((entry, idx) => (
                              <tr key={entry.contributionId} className="bg-muted/20 border-b text-xs">
                                <td className="p-2 pl-8 text-muted-foreground">{idx + 1}</td>
                                <td className="p-2 text-muted-foreground" colSpan={2}>
                                  {progressTimeBucket === "monthly"
                                    ? new Date(entry.transactionDate).toLocaleDateString("en-KE", { month: "short", year: "numeric" })
                                    : new Date(entry.transactionDate).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
                                  {" "}
                                  <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-medium ${entryTypeBadge(entry.entryType)}`}>
                                    {entry.entryType}
                                  </span>
                                  {entry.purposeName && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600">{entry.purposeName}</span>
                                  )}
                                  {entry.groupName && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600">{entry.groupName}</span>
                                  )}
                                </td>
                                {/* empty cells for purpose/group breakdown columns */}
                                {progressBreakdownBy === "purpose" && sortedProgressMembers[0]?.byPurpose.map((p) => (
                                  <td key={p.purposeId} className="p-2" />
                                ))}
                                {progressBreakdownBy === "group" && sortedProgressMembers[0]?.byGroup.map((g) => (
                                  <td key={g.groupId ?? "top"} className="p-2" />
                                ))}
                                <td className="p-2 text-right">{formatKes(entry.amount)}</td>
                                <td className="p-2 text-right text-muted-foreground">↑ {formatKes(entry.runningTotal)}</td>
                              </tr>
                            ))}
                          </>
                        );
                      })}

                      {/* Grand total row */}
                      <tr className="border-t-2 font-semibold bg-muted/30">
                        <td className="p-3" colSpan={2}>TOTAL</td>
                        <td className="p-3 hidden sm:table-cell" />
                        {progressBreakdownBy === "purpose" && sortedProgressMembers[0]?.byPurpose.map((p) => {
                          const colTotal = sortedProgressMembers.reduce((sum, m) => {
                            const found = m.byPurpose.find((bp) => bp.purposeId === p.purposeId);
                            return sum + Number(found?.totalAmount ?? 0);
                          }, 0);
                          return <td key={p.purposeId} className="p-3 text-right">{formatKes(colTotal)}</td>;
                        })}
                        {progressBreakdownBy === "group" && sortedProgressMembers[0]?.byGroup.map((g) => {
                          const colTotal = sortedProgressMembers.reduce((sum, m) => {
                            const found = m.byGroup.find((bg) => (bg.groupId ?? "top") === (g.groupId ?? "top"));
                            return sum + Number(found?.totalAmount ?? 0);
                          }, 0);
                          return <td key={g.groupId ?? "top"} className="p-3 text-right">{formatKes(colTotal)}</td>;
                        })}
                        <td className="p-3 text-right">
                          {sortedProgressMembers.reduce((s, m) => s + m.contributionCount, 0)}
                        </td>
                        <td className="p-3 text-right">{formatKes(progressGrandTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

export default function ReportsPage() {
  return (
    <AdminProtectedRoute requiredAccess="any-admin">
      <ReportsPageContent />
    </AdminProtectedRoute>
  );
}
