'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ChatMessageProps } from '@/components/learning/ChatMessage';

export interface ChatMessage extends ChatMessageProps {
  timestamp: Date;
  cefrLevel?: string;
  messageType?: 'greeting' | 'practice' | 'feedback' | 'encouragement';
}

export interface ChatSettings {
  cefrLevel: string;
  businessContext: string;
  learningGoals: string[];
  sessionId?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  settings: ChatSettings;
  currentSessionId: string | null;
}

export interface ChatContextProps extends ChatState {
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  startNewSession: (businessContext: string, learningGoals: string[], cefrLevel: string) => void;
}

export const ChatContext = createContext<ChatContextProps | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  initialSettings?: Partial<ChatSettings>;
}

export function ChatProvider({ children, initialSettings }: ChatProviderProps) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    settings: {
      cefrLevel: initialSettings?.cefrLevel || 'B1',
      businessContext: initialSettings?.businessContext || '',
      learningGoals: initialSettings?.learningGoals || [],
      sessionId: initialSettings?.sessionId || '',
    },
    currentSessionId: null,
  });

  const [controller, setController] = useState<AbortController | null>(null);

  const startNewSession = useCallback((businessContext: string, learningGoals: string[], cefrLevel: string) => {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setState(prevState => ({
      ...prevState,
      messages: [],
      currentSessionId: sessionId,
      settings: {
        ...prevState.settings,
        businessContext,
        learningGoals,
        cefrLevel,
        sessionId,
      },
    }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<ChatSettings>) => {
    setState(prevState => ({
      ...prevState,
      settings: { ...prevState.settings, ...newSettings },
    }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    const abortController = new AbortController();
    setController(abortController);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          settings: state.settings,
          sessionId: state.currentSessionId,
          messages: state.messages.slice(-10), // Context for AI
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        cefrLevel: data.cefrLevel || state.settings.cefrLevel,
        messageType: data.messageType || 'practice',
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        const errorMessage: ChatMessage = {
          id: `msg-error-${Date.now()}`,
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your message. Please try again.',
          timestamp: new Date(),
        };
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
          isLoading: false,
        }));
      }
    } finally {
      setController(null);
    }
  }, [state.settings, state.currentSessionId, state.messages]);

  const clearChat = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
  }, []);

  const contextValue: ChatContextProps = {
    ...state,
    sendMessage,
    clearChat,
    updateSettings,
    startNewSession,
  };

  const abortCurrentMessage = useCallback(() => {
    if (controller) {
      controller.abort();
      setController(null);
    }
  }, [controller]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}