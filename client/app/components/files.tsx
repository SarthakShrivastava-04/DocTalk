"use client";

import React from "react";
import { FileText } from "lucide-react";
import { type UploadedFile, formatFileSize } from "@/lib/upload";

interface AttachedFilesPanelProps {
  files: UploadedFile[];
}

const AttachedFilesPanel: React.FC<AttachedFilesPanelProps> = ({ files }) => {
  if (files.length === 0) return null;

  return (
    <aside className="fixed left-6 top-20 z-30 hidden max-h-[calc(100vh-6rem)] w-64 flex-col overflow-hidden rounded-xl border border-sidebar-border bg-sidebar xl:flex">
      <div className="border-b border-sidebar-border px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Documents ({files.length})
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-start gap-2.5 border-b border-sidebar-border/60 px-4 py-3 last:border-b-0"
          >
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p
                className="truncate text-sm font-medium text-sidebar-foreground"
                title={file.name}
              >
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default AttachedFilesPanel;
