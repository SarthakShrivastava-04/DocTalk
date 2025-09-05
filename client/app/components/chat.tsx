"use client";

import React from "react";
import { Button } from "@/app/components/ui/button";
import { ArrowRight, ChevronDown, ChevronUp, X, FileText, AlertCircle, Upload } from "lucide-react";
import Link from "next/link";
import FileUploadComponent, { UploadedFile } from "./file-upload";
import { Logo } from "./logo";
import { ExitIcon } from "@radix-ui/react-icons";

interface Doc {
  pageContent?: string;
  metadata?: {
    source?: string;
    loc?: { pageNumber?: number };
  };
}

interface Message {
  role: "user" | "assistant";
  content?: string;
  docs?: Doc[];
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [expandedDocs, setExpandedDocs] = React.useState<{
    [key: number]: boolean;
  }>({});
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [uploadError, setUploadError] = React.useState<string>("");
  
  // Drag and drop states
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [dragCounter, setDragCounter] = React.useState<number>(0);
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const dropZoneRef = React.useRef<HTMLDivElement>(null);

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

  // Drag and Drop Event Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    
    // Check if dragged items contain files
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    
    // Only hide drag overlay when all drag events have left
    if (dragCounter <= 1) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Set dropEffect to indicate this is a valid drop zone
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    
    // Filter for PDF files only
    const pdfFiles = files.filter(file => file.type === "application/pdf");
    
    if (pdfFiles.length === 0) {
      setUploadError("Please drop only PDF files.");
      return;
    }

    if (files.length > pdfFiles.length) {
      setUploadError("Some files were skipped. Only PDF files are supported.");
    }

    // Upload each PDF file
    await uploadFiles(pdfFiles);
  };

  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      // Validate file size (e.g., max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        continue;
      }

      try {
        handleUploadStart(file.name);
        
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
          handleUploadSuccess(uploadedFile);
        } else {
          const errorText = await res.text();
          throw new Error(errorText || "Upload failed");
        }
      } catch (error) {
        console.error(`File upload failed for "${file.name}":`, error);
        handleUploadError(
          `Failed to upload "${file.name}": ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = { role: "user" as const, content: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);

    // Clear uploaded files after sending message
    setUploadedFiles([]);
    setUploadError("");

    try {
      const res = await fetch(
        `${apiUrl}/chat?message=${encodeURIComponent(message)}`
      );
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
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDocs = (index: number) => {
    setExpandedDocs((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
    setUploadError("");
  };

  const handleUploadSuccess = (file: UploadedFile) => {
    setUploadedFiles((prev) => [...prev, file]);
    setIsUploading(false);
    setUploadError("");
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setIsUploading(false);
  };

  const removeFile = async (fileId: string) => {
    try {
      // Optional: Call API to delete file from server[will add this later]
      setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
    } catch (error) {
      console.error("Error removing file:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const hasFiles = uploadedFiles.length > 0;

  return (
    <div 
      ref={dropZoneRef}
      className="flex flex-col h-screen bg-background text-foreground relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => setIsDragging(false)} 
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-stone-900 border-2 border-dashed border-blue-400 rounded-3xl p-12 text-center max-w-md mx-4">
            <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Drop PDF files here</h3>
            <p className="text-stone-300">Release to upload your PDF documents</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header>
        <nav className="fixed top-0 left-0 right-0 w-full border-b border-stone-700 bg-background px-4 py-5 z-40">
          <div className="relative max-w-[67rem] mx-auto h-[40px]">
            <Link
              href="/"
              aria-label="home"
              className="absolute top-1/2 -translate-y-1/2 flex items-center"
            >
              <Logo />
            </Link>

            <Link
              href="/"
              className="absolute right-[1px] top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:underline"
            >
              <ExitIcon className="w-4 h-4 mr-1" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Messages */}
      <div className="flex-1 w-3xl mx-auto mt-8 pb-24 pt-14 px-2">
        {messages.length === 0 && (
          <div className="text-center mt-60">
            {hasFiles ? (
              <>
                <h2 className="text-3xl font-bold">
                  Start Chatting with Your PDFs
                </h2>
                <p className="text-muted-foreground mt-4 text-lg">
                  Ask questions, get insights, and view references instantly—no
                  signup required.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold">
                  Upload PDFs to get started
                </h2>
                <p className="text-muted-foreground mt-4 text-lg">
                  Upload one or multiple PDF files to start chatting with them.
                </p>
                <p className="text-muted-foreground mt-2 text-base">
                  💡 Tip: You can also drag and drop PDF files anywhere on this page
                </p>
              </>
            )}
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            } mb-2`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-3xl shadow bg-muted whitespace-pre-wrap break-words ${
                msg.role === "user"
                  ? "bg-stone-800/60 text-foreground"
                  : "bg-stone-950 text-foreground"
              }`}
            >
              <p className="text-base">{msg.content}</p>

              {msg.role === "assistant" && (msg.docs?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDocs(index)}
                    className="flex items-center text-muted-foreground"
                  >
                    {expandedDocs[index] ? (
                      <ChevronUp className="w-4 h-4 mr-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 mr-1" />
                    )}
                    References ({msg.docs?.length})
                  </Button>

                  {expandedDocs[index] && (
                    <div className="mt-2 p-3 bg-background rounded-3xl border">
                      {msg.docs?.map((doc, docIndex) => (
                        <div
                          key={docIndex}
                          className="mb-3 text-sm text-muted-foreground"
                        >
                          <p>
                            <strong>Source:</strong>{" "}
                            {doc.metadata?.source || "N/A"}
                          </p>
                          <p>
                            <strong>Page:</strong>{" "}
                            {doc.metadata?.loc?.pageNumber || "N/A"}
                          </p>
                          <p>{doc.pageContent?.substring(0, 100)}...</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="fixed bottom-0 left-0 right-0 pb-2 px-2 bg-background">
        <div className="max-w-3xl mx-auto">
          <div 
            className={`bg-stone-900 rounded-3xl p-4 shadow transition-all duration-300 ${
              hasFiles || uploadError ? 'pb-6' : ''
            }`}
          >
            {/* Error Message */}
            {uploadError && (
              <div className="mb-3 p-3 bg-red-900/20 border border-red-700 rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm">{uploadError}</p>
                <button
                  onClick={() => setUploadError("")}
                  className="ml-auto p-1 hover:bg-red-800/30 rounded-lg"
                >
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </div>
            )}

            {/* Uploaded Files */}
            {hasFiles && (
              <div className="mb-3 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  Uploaded Files ({uploadedFiles.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 bg-stone-800 rounded-2xl px-3 py-2 border border-stone-600"
                    >
                      <FileText className="w-4 h-4 text-blue-400" />
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground font-medium">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="ml-2 p-1 hover:bg-stone-700 rounded-lg transition-colors"
                        title="Remove file"
                      >
                        <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-end gap-3">
              <FileUploadComponent 
                onUploadStart={handleUploadStart}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                isUploading={isUploading}
                disabled={isLoading}
              />
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder={
                  hasFiles
                    ? "Ask your PDFs anything..."
                    : "Upload PDFs to get started..."
                }
                rows={1}
                className="flex-1 bg-stone-900 text-foreground rounded-3xl py-3 px-4 resize-none max-h-60 border-none outline-none focus:outline-none focus:border-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isLoading || !hasFiles}
                className="bg-stone-900 text-foreground mb-1 rounded-2xl border border-stone-600 px-6 py-3 flex items-center gap-2 cursor-pointer transition-colors duration-300 hover:bg-stone-800/70 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  "..."
                ) : (
                  <>
                    Send <ArrowRight className="w-4 h-4" />
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