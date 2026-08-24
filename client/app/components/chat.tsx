"use client";

import React from "react";
import { ArrowRight, Loader2, X, AlertCircle, FileText } from "lucide-react";
import Link from "next/link";
import { ExitIcon } from "@radix-ui/react-icons";
import { Button } from "@/app/components/ui/button";
import FileUploadComponent, { type UploadedFile } from "./file-upload";
import ChatMessage, { type Doc } from "./chat-message";
import AttachedFilesPanel from "./files";
import { Logo } from "./logo";
import { uploadPdfFile, formatFileSize } from "@/lib/upload";

interface Message {
  role: "user" | "assistant";
  content?: string;
  docs?: Doc[];
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [expandedSources, setExpandedSources] = React.useState<{
    [key: number]: boolean;
  }>({});
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const [attachedFiles, setAttachedFiles] = React.useState<UploadedFile[]>([]);

  const [pendingFiles, setPendingFiles] = React.useState<UploadedFile[]>([]);

  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [uploadingFileName, setUploadingFileName] = React.useState<string>("");
  const [uploadError, setUploadError] = React.useState<string>("");

  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [dragCounter, setDragCounter] = React.useState<number>(0);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    console.error("API URL is not defined in environment variables.");
    return null;
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  React.useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev - 1);
    if (dragCounter <= 1) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter((file) => file.type === "application/pdf");

    if (pdfFiles.length === 0) {
      setUploadError("Only PDF files are supported.");
      return;
    }
    if (files.length > pdfFiles.length) {
      setUploadError("Some files were skipped. Only PDF files are supported.");
    }

    await uploadFiles(pdfFiles);
  };

  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      try {
        handleUploadStart(file.name);
        const uploaded = await uploadPdfFile(file, apiUrl);
        handleUploadSuccess(uploaded);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        handleUploadError(`Failed to upload "${file.name}": ${msg}`);
      }
    }
  };

  const canSend = message.trim().length > 0 && !isUploading && !isLoading;

  const handleSend = async () => {
    if (!canSend) return;

    const currentFile =
      pendingFiles[pendingFiles.length - 1] ??
      attachedFiles[attachedFiles.length - 1];
    const previousAnswer =
      [...messages]
        .reverse()
        .find((item) => item.role === "assistant" && item.content?.trim())
        ?.content ?? "";
    const userMessage = { role: "user" as const, content: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);
    setUploadError("");

    if (pendingFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...pendingFiles]);
      setPendingFiles([]);
    }

    try {
      const query = new URLSearchParams({
        message,
        fileName: currentFile?.name ?? "",
        lastAnswer: previousAnswer,
      });
      const res = await fetch(`${apiUrl}/chat?${query.toString()}`);
      if (!res.ok) throw new Error("Network error");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant" as const, content: data.message, docs: data.docs },
      ]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSources = (index: number) => {
    setExpandedSources((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleUploadStart = (fileName: string) => {
    setIsUploading(true);
    setUploadingFileName(fileName);
    setUploadError("");
  };

  const handleUploadSuccess = (file: UploadedFile) => {
    setPendingFiles((prev) => [...prev, file]);
    setIsUploading(false);
    setUploadingFileName("");
    setUploadError("");
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setIsUploading(false);
    setUploadingFileName("");
  };

  const removePendingFile = (fileId: string) => {
    setPendingFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const hasAnyFiles = attachedFiles.length > 0 || pendingFiles.length > 0;

  return (
    <div
      className="relative flex h-screen flex-col bg-background text-foreground"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 max-w-md rounded-xl border-2 border-dashed border-muted-foreground bg-card p-10 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">
              Upload PDF
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Drop your file here
            </p>
          </div>
        </div>
      )}

      <header>
        <nav className="fixed left-0 right-0 top-0 z-40 border-b border-border bg-background px-4 py-2.5 sm:px-6">
          <div className="relative mx-auto flex h-7 max-w-[830px] items-center justify-between">
            <Link href="/" aria-label="Home" className="flex items-center">
              <Logo />
            </Link>
            <Link
              href="/"
              aria-label="Exit"
              title="Exit"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExitIcon className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      </header>

      <AttachedFilesPanel files={attachedFiles} />

      <div className="mx-auto w-full max-w-[830px] flex-1 overflow-y-auto scrollbar-none px-4 pb-32 pt-20 sm:px-6">
        {messages.length === 0 && (
          <div className="mt-24 text-center sm:mt-40">
            {hasAnyFiles ? (
              <>
                <h2 className="text-xl font-semibold text-foreground">
                  No messages yet
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ask a question about your document to get started.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-foreground">
                  Upload PDF
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add a PDF to start asking questions about it.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  You can also drag and drop a file anywhere on this page.
                </p>
              </>
            )}
          </div>
        )}

        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            role={msg.role}
            content={msg.content}
            docs={msg.docs}
            showSources={!!expandedSources[index]}
            onToggleSources={() => toggleSources(index)}
          />
        ))}

        {isLoading && (
          <div className="mb-3 flex justify-start">
            <div className="px-4 py-3 text-[15px] text-muted-foreground">
              <span className="animate-pulse">Processing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-[830px]">
          {uploadError && (
            <div className="mb-2 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{uploadError}</p>
              <button
                type="button"
                onClick={() => setUploadError("")}
                aria-label="Dismiss"
                className="ml-auto shrink-0 text-destructive/70 transition-colors hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div
            className={`rounded-[28px] border border-border max-w-[820px] bg-card px-3 py-2`}
          >
            {(pendingFiles.length > 0 || isUploading) && (
              <div className="flex flex-wrap gap-2 px-1 pb-2 pt-1">
                {pendingFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-2 rounded-[28px] border border-border bg-secondary py-1 pl-3 pr-2`}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="max-w-[10rem] truncate text-xs font-medium text-secondary-foreground">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePendingFile(file.id)}
                      aria-label={`Remove ${file.name}`}
                      className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {isUploading && (
                  <div
                    className={`flex items-center gap-2 rounded-[28px] border border-border bg-secondary py-1 pl-3 pr-3`}
                  >
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                    <span className="max-w-[10rem] truncate text-xs font-medium text-secondary-foreground">
                      {uploadingFileName || "Uploading..."}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end gap-2">
              <FileUploadComponent
                onUploadStart={handleUploadStart}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                isUploading={isUploading}
              />
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder={
                  hasAnyFiles
                    ? "Ask a question about your document"
                    : "Upload a PDF to get started"
                }
                rows={1}
                className="max-h-60 flex-1 resize-none border-none bg-transparent px-1 py-1.5 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
              />
              <Button
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send"
                variant="default"
                className={`mb-0.5 flex h-9 shrink-0 items-center gap-1.5 rounded-[28px] px-4 text-sm font-medium`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Send <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
