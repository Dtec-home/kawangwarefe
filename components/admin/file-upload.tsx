/**
 * File Upload Component
 * Reusable drag-and-drop file upload with validation
 */

"use client";

import { useCallback, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File) => void;
  onClear?: () => void;
  selectedFile?: File | null;
}

export function FileUpload({
  accept = ".csv,.xlsx,.xls",
  maxSize = 5,
  onFileSelect,
  onClear,
  selectedFile,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");

  const validateFile = (file: File): boolean => {
    setError("");

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`File size must be less than ${maxSize}MB`);
      return false;
    }

    // Check file type
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const acceptedExtensions = accept.split(",").map((ext) => ext.replace(".", "").trim());

    if (fileExtension && !acceptedExtensions.includes(fileExtension)) {
      setError(`File type must be one of: ${accept}`);
      return false;
    }

    return true;
  };

  const handleFileChange = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileChange(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleClear = () => {
    setError("");
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="space-y-2">
      {!selectedFile ? (
        <Card
          className={`border-2 border-dashed transition-colors ${isDragging
              ? "border-primary bg-primary/5"
              : error
                ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Upload className={`h-12 w-12 mb-4 ${error ? "text-red-500" : "text-muted-foreground"}`} />
            <h3 className="font-semibold mb-2">
              {isDragging ? "Drop file here" : "Upload File"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <input
              type="file"
              accept={accept}
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button type="button" variant="outline" asChild>
                <span>Choose File</span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-4">
              Accepted formats: {accept} (Max {maxSize}MB)
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
