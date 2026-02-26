/**
 * Member Import Page
 * Sprint 2: Admin Dashboard - Member Import
 *
 * Allows admins to import members via CSV/Excel files
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { IMPORT_MEMBERS, GET_MEMBER_IMPORT_TEMPLATE } from "@/lib/graphql/member-import-mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { FileUpload } from "@/components/admin/file-upload";
import {
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Users
} from "lucide-react";
import Link from "next/link";

interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
  duplicates: string[];
}

interface ImportMembersResult {
  importMembers: ImportResult;
}

interface GetTemplateResult {
  getMemberImportTemplate: string;
}

function MemberImportPageContent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [importMembers] = useMutation<ImportMembersResult>(IMPORT_MEMBERS);
  const [getTemplate] = useMutation<GetTemplateResult>(GET_MEMBER_IMPORT_TEMPLATE);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setImportResult(null);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setImportResult(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const { data } = await getTemplate();
      if (data?.getMemberImportTemplate) {
        // Create a blob and download
        const blob = new Blob([data.getMemberImportTemplate], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'member_import_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setImportResult(null);

    try {
      // Read file content
      const fileContent = await readFileContent(selectedFile);
      const fileType = selectedFile.name.endsWith('.csv') ? 'csv' : 'excel';

      // Call import mutation
      const { data } = await importMembers({
        variables: {
          csvData: fileContent,
          fileType: fileType,
          sendNotifications: false,
        },
      });

      if (data?.importMembers) {
        setImportResult(data.importMembers);
      }
    } catch (error: any) {
      setImportResult({
        success: false,
        message: error.message || 'Import failed',
        importedCount: 0,
        skippedCount: 0,
        errorCount: 1,
        errors: [error.message || 'Unknown error occurred'],
        duplicates: [],
      });
    } finally {
      setImporting(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          resolve(content);
        } else if (content instanceof ArrayBuffer) {
          // For Excel files, convert to base64
          const base64 = btoa(
            new Uint8Array(content).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ''
            )
          );
          resolve(base64);
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));

      // Read as text for CSV, as array buffer for Excel
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/admin/members">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Import Members</h1>
            </div>
            <p className="text-muted-foreground">
              Upload a CSV or Excel file to import members in bulk
            </p>
          </div>
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Download the CSV template using the button above</li>
              <li>Fill in member details (first_name, last_name, phone_number are required)</li>
              <li>Phone numbers should be in format: 0712345678 or 254712345678</li>
              <li>Upload the completed file below</li>
              <li>Review any errors and click Import to complete</li>
            </ol>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Select a CSV or Excel file containing member data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              accept=".csv,.xlsx,.xls"
              maxSize={10}
              onFileSelect={handleFileSelect}
              onClear={handleClearFile}
              selectedFile={selectedFile}
            />

            {selectedFile && !importing && !importResult && (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Members
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Progress */}
        {importing && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <p className="font-medium">Importing members...</p>
                </div>
                <Progress value={undefined} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="space-y-4">
            {/* Summary */}
            <Alert variant={importResult.success ? "default" : "destructive"}>
              {importResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {importResult.success ? "Import Successful" : "Import Failed"}
              </AlertTitle>
              <AlertDescription>{importResult.message}</AlertDescription>
            </Alert>

            {/* Statistics */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Imported
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.importedCount}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Skipped (Duplicates)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {importResult.skippedCount}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.errorCount}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Errors */}
            {importResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Errors ({importResult.errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-600 dark:text-red-400">
                        • {error}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Duplicates */}
            {importResult.duplicates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-yellow-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Duplicates ({importResult.duplicates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {importResult.duplicates.map((duplicate, index) => (
                      <p key={index} className="text-sm text-yellow-600 dark:text-yellow-400">
                        • {duplicate}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleClearFile} variant="outline">
                Import Another File
              </Button>
              <Link href="/admin/members">
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  View All Members
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function MemberImportPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <MemberImportPageContent />
    </AdminProtectedRoute>
  );
}
