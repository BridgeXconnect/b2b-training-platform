import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, BookOpen, Target, CheckSquare, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface ChatMessageProps {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  cefrLevel?: string;
  messageType?: "greeting" | "practice" | "feedback" | "encouragement" | "lesson";
}

const StructuredLesson = ({ lesson }: { lesson: any }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold flex items-center"><BookOpen className="mr-2" /> {lesson.title}</h3>
    <div className="flex items-center space-x-4">
      <Badge>{lesson.cefrLevel}</Badge>
      <Badge variant="outline">{lesson.duration} minutes</Badge>
    </div>
    <div>
      <h4 className="font-semibold flex items-center"><Target className="mr-2" />Learning Objectives</h4>
      <ul className="list-disc list-inside mt-2 space-y-1">
        {lesson.learningObjectives.map((objective: string, index: number) => <li key={index}>{objective}</li>)}
      </ul>
    </div>
    <div>
      <h4 className="font-semibold flex items-center"><CheckSquare className="mr-2" />Activities</h4>
      <ul className="list-disc list-inside mt-2 space-y-1">
        {lesson.activities.map((activity: any, index: number) => <li key={index}>{activity.title} ({activity.duration} mins) - {activity.type}</li>)}
      </ul>
    </div>
    <div>
      <h4 className="font-semibold flex items-center"><Lightbulb className="mr-2" />Vocabulary</h4>
      <ul className="list-disc list-inside mt-2 space-y-1">
        {lesson.vocabulary.map((vocab: any, index: number) => <li key={index}><strong>{vocab.word}:</strong> {vocab.meaning} <em>e.g., "{vocab.example}"</em></li>)}
      </ul>
    </div>
    <div>
      <h4 className="font-semibold flex items-center"><CheckSquare className="mr-2" />Assessment</h4>
      <ul className="list-disc list-inside mt-2 space-y-1">
        {lesson.assessment.map((question: any, index: number) => <li key={index}>{question.question} ({question.type})</li>)}
      </ul>
    </div>
  </div>
);

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

  const renderContent = () => {
    try {
      const parsedContent = JSON.parse(content);
      if (parsedContent.title && parsedContent.activities) {
        return <StructuredLesson lesson={parsedContent} />;
      }
    } catch (error) {
      // Not a JSON object, render as plain text
    }
    return content;
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
              {renderContent()}
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