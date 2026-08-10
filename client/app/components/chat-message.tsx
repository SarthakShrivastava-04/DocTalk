"use client";

import React from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

export interface Doc {
  pageContent?: string;
  metadata?: {
    source?: string;
    loc?: { pageNumber?: number };
  };
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content?: string;
  docs?: Doc[];
  showSources: boolean;
  onToggleSources: () => void;
}

const CopyButton: React.FC<{ text?: string; visibility: string }> = ({ text, visibility }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable 
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy"
      title="Copy"
      className={`flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-opacity duration-150 hover:bg-secondary hover:text-foreground focus:opacity-100 focus:outline-none ${visibility}`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  docs,
  showSources,
  onToggleSources,
}) => {
  const isUser = role === "user";
  const hasDocs = (docs?.length ?? 0) > 0;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`group relative whitespace-pre-wrap break-words px-4 py-3 text-[15px] leading-relaxed text-foreground ${
          isUser ? "max-w-[85%] sm:max-w-[75%] rounded-2xl border border-border bg-card" : "w-[97%]"
        }`}
      >
  
        <div className={`absolute -bottom-6 ${isUser ? "right-0" : "left-0"}`}>
          <CopyButton text={content} visibility="opacity-0 group-hover:opacity-100" />
        </div>

        <p>{content}</p>

        {!isUser && hasDocs && (
          <div className="mt-3">
            <button
              type="button"
              onClick={onToggleSources}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {showSources ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              Sources ({docs?.length})
            </button>

            {showSources && (
              <div className="mt-2 space-y-1 rounded-lg border border-border bg-card p-3">
                {docs?.map((doc, i) => (
                  <div key={i} className="group/source relative rounded-md px-1 py-2 text-xs">
                    <div className="absolute right-0 top-1">
                      <CopyButton
                        text={doc.pageContent}
                        visibility="opacity-0 group-hover/source:opacity-100"
                      />
                    </div>
                    <div className="mb-1 flex flex-wrap items-center gap-x-2 pr-7 font-medium text-secondary-foreground">
                      <span>{doc.metadata?.source || "Unknown source"}</span>
                      {doc.metadata?.loc?.pageNumber && (
                        <span className="text-muted-foreground">
                          Page {doc.metadata.loc.pageNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {doc.pageContent?.substring(0, 140)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;