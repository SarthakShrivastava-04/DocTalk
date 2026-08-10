export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; 

export async function uploadPdfFile(
  file: File,
  apiUrl: string,
): Promise<UploadedFile> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" is larger than 10MB.`);
  }

  const formData = new FormData();
  formData.append("pdf", file);

  const res = await fetch(`${apiUrl}/upload/pdf`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Upload failed");
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: file.name,
    size: file.size,
    uploadedAt: new Date(),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}