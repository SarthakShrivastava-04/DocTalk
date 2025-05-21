"use client";
import { Upload } from "lucide-react";
import * as React from "react";

const FileUploadComponent: React.FC = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    console.error("API URL is not defined in environment variables.");
    return;
  }

  const handleFileUpload = () => {
    const el = document.createElement("input");
    el.setAttribute("type", "file");
    el.setAttribute("accept", "application/pdf");
    el.setAttribute("multiple", "false");
    el.addEventListener("change", async (e) => {
      if (el.files && el.files.length > 0) {
        const file = el.files[0];
        if (file) {
          const formData = new FormData();
          formData.append("pdf", file);

          await fetch(`${apiUrl}/upload/pdf`, {
            method: "POST",
            body: formData,
          });
          console.log("File uploaded successfully!");
        }
      }
    });
    el.click();
  };

  return (
    <div
      onClick={handleFileUpload}
      className="
    flex justify-center items-center
    w-10 h-10
    rounded-full
    border border-stone-600
    bg-stone-900
    p-1
    cursor-pointer
    transition-colors duration-300
    hover:bg-stone-800/70
  "
    >
      <Upload className="w-5 h-5 text-foreground" />
    </div>
  );
};

export default FileUploadComponent;
