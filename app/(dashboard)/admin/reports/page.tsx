/**
 * Admin Reports Page
 * Sprint 4: Reporting System
 *
 * Allows staff to generate and download contribution reports
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GENERATE_CONTRIBUTION_REPORT } from "@/lib/graphql/mutations";
import { GET_CONTRIBUTION_CATEGORIES } from "@/lib/graphql/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Table as TableIcon, Calendar } from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  code: string;
}

interface CategoriesData {
  contributionCategories: Category[];
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

function ReportsPageContent() {
  const [reportType, setReportType] = useState<string>("daily");
  const [format, setFormat] = useState<string>("excel");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const { data: categoriesData } = useQuery<CategoriesData>(GET_CONTRIBUTION_CATEGORIES);
  const categories = categoriesData?.contributionCategories || [];

  const [generateReport, { loading }] = useMutation<ReportResponse>(GENERATE_CONTRIBUTION_REPORT, {
    onCompleted: (data) => {
      if (data.generateContributionReport.success) {
        toast.success(data.generateContributionReport.message);

        // Download the file
        if (data.generateContributionReport.fileData && data.generateContributionReport.filename) {
          downloadFile(
            data.generateContributionReport.fileData,
            data.generateContributionReport.filename,
            data.generateContributionReport.contentType || "application/octet-stream"
          );
        }
      } else {
        toast.error(data.generateContributionReport.message);
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const downloadFile = (base64Data: string, filename: string, contentType: string) => {
    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateReport = () => {
    // Validate custom date range
    if (reportType === "custom" && (!dateFrom || !dateTo)) {
      toast.error("Please select both start and end dates for custom reports");
      return;
    }

    if (reportType === "custom" && new Date(dateFrom) > new Date(dateTo)) {
      toast.error("Start date must be before end date");
      return;
    }

    generateReport({
      variables: {
        format,
        reportType,
        dateFrom: reportType === "custom" && dateFrom ? new Date(dateFrom).toISOString() : null,
        dateTo: reportType === "custom" && dateTo ? new Date(dateTo).toISOString() : null,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds.map((id) => Number.parseInt(id)) : null,
        memberId: null, // Can be added later if needed
      },
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and download contribution reports</p>
        </div>

        {/* Report Configuration */}
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

            {/* Category Filter */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Filter by Categories (Optional)</h3>
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
                  ? "All categories will be included"
                  : `${selectedCategoryIds.length} category(ies) selected`}
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

        {/* Quick Report Actions */}
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
      </div>
    </AdminLayout>
  );
}

export default function ReportsPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <ReportsPageContent />
    </AdminProtectedRoute>
  );
}
