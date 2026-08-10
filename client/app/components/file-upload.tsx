"use client";

import * as React from "react";
import { Upload, Loader2 } from "lucide-react";
import { uploadPdfFile, type UploadedFile } from "@/lib/upload";

export type { UploadedFile };

type FileUploadProps = {
  onUploadStart?: (fileName: string) => void;
  onUploadSuccess?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
  isUploading?: boolean;
  disabled?: boolean;
};

const FileUploadComponent: React.FC<FileUploadProps> = ({
  onUploadStart,
  onUploadSuccess,
  onUploadError,
  isUploading = false,
  disabled = false,
}) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    console.error("API URL is not defined in environment variables.");
    return null;
  }

  const handleFileUpload = () => {
    if (disabled || isUploading) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.multiple = true;

    input.addEventListener("change", async () => {
      if (!input.files) return;

      for (const file of Array.from(input.files)) {
        try {
          onUploadStart?.(file.name);
          const uploaded = await uploadPdfFile(file, apiUrl);
          onUploadSuccess?.(uploaded);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          onUploadError?.(`Failed to upload "${file.name}": ${message}`);
        }
      }
    });

    input.click();
  };

  const isDisabled = disabled || isUploading;

  return (
    <button
      type="button"
      onClick={handleFileUpload}
      disabled={isDisabled}
      title={isUploading ? "Processing..." : "Upload PDF"}
      aria-label="Upload PDF"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[28px] border border-border bg-secondary transition-colors ${
        isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-accent"
      }`}
    >
      {isUploading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Upload className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
};

export default FileUploadComponent;