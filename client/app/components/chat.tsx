"use client";

import React from "react";
import { Button } from "@/app/components/ui/button";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import FileUploadComponent from "./file-upload";
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
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    console.error("API URL is not defined in environment variables.");
    return;
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  React.useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = { role: "user" as const, content: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);

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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground relative">
      <header>
        <nav className="fixed top-0 left-0 right-0 w-full border-b border-stone-700 bg-background px-4 py-5 z-50">
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

      <div className="flex-1 w-3xl mx-auto mt-8 pb-24 pt-14 px-2">
        {messages.length === 0 && (
          <div className="text-center mt-60">
            <h2 className="text-3xl font-bold">
              Start Chatting with Your PDFs
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Ask questions, get insights, and view references instantly—no
              signup required.
            </p>
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
              {msg.role === "assistant" && msg.docs && msg.docs.length > 0 && (
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
                    References ({msg.docs.length})
                  </Button>
                  {expandedDocs[index] && (
                    <div className="mt-2 p-3 bg-background rounded-3xl border">
                      {msg.docs.map((doc, docIndex) => (
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

      <div className="fixed bottom-0 left-0 right-0 pb-2 px-2 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-stone-900 rounded-3xl p-4 shadow">
            <FileUploadComponent />
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder="Ask your PDFs anything..."
              rows={1}
              className="
                flex-1 
                bg-stone-900 
                text-foreground 
                rounded-3xl 
                py-3 px-4 
                resize-none 
                max-h-60
                border-none 
                outline-none 
                focus:outline-none 
                focus:border-none
              "
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="
                bg-stone-900 
                text-foreground 
                mb-1 
                rounded-2xl
                border border-stone-600 
                px-6 
                py-3 
                flex 
                items-center 
                gap-2
                cursor-pointer
                transition-colors duration-300
                hover:bg-stone-800/70
              "
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
  );
};

export default ChatComponent;
