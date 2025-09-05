"use client";

import { Upload, Loader2 } from "lucide-react";
import * as React from "react";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

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
  disabled = false
}) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    console.error("API URL is not defined in environment variables.");
    return null;
  }

  const handleFileUpload = () => {
    if (disabled || isUploading) return;

    const el = document.createElement("input");
    el.setAttribute("type", "file");
    el.setAttribute("accept", "application/pdf");
    el.setAttribute("multiple", "true"); // Allow multiple files

    el.addEventListener("change", async () => {
      if (el.files && el.files.length > 0) {
        // Process each file
        for (let i = 0; i < el.files.length; i++) {
          const file = el.files[i];
          
          // Validate file size (e.g., max 10MB)
          if (file.size > 10 * 1024 * 1024) {
            onUploadError?.(`File "${file.name}" is too large. Maximum size is 10MB.`);
            continue;
          }

          try {
            onUploadStart?.(file.name);
            
            const formData = new FormData();
            formData.append("pdf", file);

            const res = await fetch(`${apiUrl}/upload/pdf`, {
              method: "POST",
              body: formData,
            });

            if (res.ok) {
              const uploadedFile: UploadedFile = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                size: file.size,
                uploadedAt: new Date(),
              };
              
              console.log(`File "${file.name}" uploaded successfully!`);
              onUploadSuccess?.(uploadedFile);
            } else {
              const errorText = await res.text();
              throw new Error(errorText || "Upload failed");
            }
          } catch (error) {
            console.error(`File upload failed for "${file.name}":`, error);
            onUploadError?.(
              `Failed to upload "${file.name}": ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        }
      }
    });

    el.click();
  };

  return (
    <div
      onClick={handleFileUpload}
      className={`flex justify-center items-center w-10 h-10 rounded-full border border-stone-600 bg-stone-900 p-1 transition-colors duration-300 ${
        disabled || isUploading 
          ? "opacity-50 cursor-not-allowed" 
          : "cursor-pointer hover:bg-stone-800/70"
      }`}
      title={isUploading ? "Uploading..." : "Upload PDF files"}
    >
      {isUploading ? (
        <Loader2 className="w-5 h-5 text-foreground animate-spin" />
      ) : (
        <Upload className="w-5 h-5 text-foreground" />
      )}
    </div>
  );
};

export default FileUploadComponent;