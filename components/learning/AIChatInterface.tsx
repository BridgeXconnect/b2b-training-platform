'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, BookOpen, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from './ChatMessage';
import { useChat, ChatProvider } from '@/lib/contexts/ChatContext';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

function AIChatInterfaceContent({ businessContext, learningGoals, cefrLevel }: {
  businessContext: string;
  learningGoals: string[];
  cefrLevel: string;
}) {
  const [inputValue, setInputValue] = useState('');
  const { messages, isLoading, sendMessage, currentSessionId } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-focus textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat session when component mounts
  useEffect(() => {
    if (!currentSessionId) {
      // Session will be initialized by parent components
    }
  }, [currentSessionId, businessContext, learningGoals, cefrLevel]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    await sendMessage(inputValue.trim());
    setInputValue('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const suggestedPrompts = [
    "Start a business conversation about project updates",
    "Help me practice giving feedback to team members",
    "Let's discuss quarterly budget planning",
    "Role-play a client presentation",
    "Practice explaining technical concepts simply"
  ];

  const suggestions = [
    { text: "Start a business conversation", emoji: "👔", category: "Practice" },
    { text: "Give feedback to team", emoji: "💬", category: "Practice" },
    { text: "Explain quarterly budget", emoji: "📊", category: "Explain" },
    { text: "Practice client presentation", emoji: "🎯", category: "Practice" },
    { text: "Simplify technical concepts", emoji: "🔧", category: "Practice" },
  ];

  // Session greeting for new sessions
  const getSessionGreeting = () => {
    if (messages.length === 0) {
      return `Welcome to your ${businessContext} training session! I'm here to help you practice ${learningGoals.join(" and ")} at CEFR ${cefrLevel} level. How would you like to start?`;
    }
    return null;
  };

  const greeting = getSessionGreeting();

  return (
    <div className="flex flex-col h-[600px] max-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                B2B English Learning Assistant
              </CardTitle>
              <CardDescription className="text-sm">
                Practice {businessContext} conversations at CEFR {cefrLevel} level
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                CEFR {cefrLevel}
              </Badge>
              {currentSessionId && (
                <Badge variant="secondary" className="text-xs">
                  Session Active
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Session greeting */}
        {greeting && (
          <Alert>
            <Smile className="h-4 w-4" />
            <AlertDescription>{greeting}</AlertDescription>
          </Alert>
        )}

        {/* Suggested prompts for empty chat */}
        {messages.length === 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">Try practicing with:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion.text}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto py-2 px-3 text-xs"
                  onClick={() => setInputValue(suggestion.text)}
                >
                  <span className="mr-2">{suggestion.emoji}</span>
                  <span className="text-gray-600">{suggestion.text}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Existing messages */}
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              {...message}
            />
          ))}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI is thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <Card className="rounded-none border-x-0 border-b-0 bg-white">
        <div className="p-4">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message for language practice..."
              className="min-h-[44px] max-h-[120px] resize-none bg-gray-50 border-gray-200"
              rows={1}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="h-10 px-3 bg-blue-600 hover:bg-blue-700"
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Press Enter to send • Shift+Enter for new line</span>
            <span>{inputValue.length}/1000</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface AIChatInterfaceProps {
  businessContext: string;
  learningGoals: string[];
  cefrLevel: string;
}

export default function AIChatInterface({ businessContext, learningGoals, cefrLevel }: AIChatInterfaceProps) {
  return (
    <ChatProvider>
      <AIChatInterfaceContent
        businessContext={businessContext}
        learningGoals={learningGoals}
        cefrLevel={cefrLevel}
      />
    </ChatProvider>
  );
}

// Wrapper component for easier usage
export function LearningChatInterface({ user }: { user: { cefrLevel: string } }) {
  const businessContext = "B2B sales";
  const learningGoals = ["email writing", "presentations", "client communication", "negotiations"];
  
  return (
    <AIChatInterface
      businessContext={businessContext}
      learningGoals={learningGoals}
      cefrLevel={user.cefrLevel}
    />
  );
}