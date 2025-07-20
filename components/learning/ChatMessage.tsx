import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface ChatMessageProps {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  cefrLevel?: string;
  messageType?: "greeting" | "practice" | "feedback" | "encouragement";
}

export function ChatMessage({ 
  role, 
  content, 
  timestamp, 
  isStreaming, 
  cefrLevel,
  messageType 
}: ChatMessageProps) {
  const isUser = role === "user";

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  return (
    <div className={cn(
      "flex gap-3 w-full",
      isUser && "justify-end"
    )}>
      {!isUser && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white">
                  AI
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>CEFR {cefrLevel || "Generic"} Response</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <div className={cn(
        "flex flex-col max-w-[85%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "relative group",
          isUser ? "order-first" : "order-2"
        )}>
          <Card 
            className={cn(
              "relative p-3 rounded-lg",
              isUser 
                ? "bg-blue-500 text-white rounded-br-none" 
                : "bg-gray-100 rounded-bl-none"
            )}
          >
            <div className="text-sm whitespace-pre-wrap break-words">
              {content}
              {isStreaming && (
                <span className="animate-pulse">│</span>
              )}
            </div>

            {/* CEFR Level Indicator for assistant messages */}
            {!isUser && cefrLevel && messageType && (
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-xs px-1 py-0.5">
                  {cefrLevel}
                </Badge>
                <Badge variant="secondary" className="text-xs px-1 py-0.5">
                  {messageType}
                </Badge>
              </div>
            )}
          </Card>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200"
                  onClick={handleCopy}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className={cn(
          "flex items-center gap-2 text-xs text-gray-500",
          isUser ? "order-2" : "order-first"
        )}>
          <span>{formatTime(timestamp)}</span>
        </div>
      </div>

      {isUser && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-green-500 text-white">
                  You
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>Your message</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}