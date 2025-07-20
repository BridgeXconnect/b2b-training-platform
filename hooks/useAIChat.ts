import { useState, useCallback, useRef } from 'react';
import { useAsync } from './useAsync';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  contextWindow?: number;
}

export function useAIChat(config: ChatConfig = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { execute, loading, error, reset } = useAsync();

  const defaultConfig: Required<ChatConfig> = {
    model: config.model || 'claude-3-sonnet-20240229',
    temperature: config.temperature ?? 0.7,
    maxTokens: config.maxTokens ?? 1000,
    systemPrompt: config.systemPrompt || 'You are a helpful AI assistant.',
    contextWindow: config.contextWindow ?? 10,
  };

  const sendMessage = useCallback(async (content: string, options?: Partial<ChatConfig>) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    // Abort previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: options?.systemPrompt || defaultConfig.systemPrompt },
            ...messages.slice(-defaultConfig.contextWindow),
            userMessage,
          ],
          model: options?.model || defaultConfig.model,
          temperature: options?.temperature ?? defaultConfig.temperature,
          max_tokens: options?.maxTokens ?? defaultConfig.maxTokens,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        metadata: data.metadata,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Chat error:', error);
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages, defaultConfig]);

  const clearChat = useCallback(() => {
    setMessages([]);
    reset();
  }, [reset]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return {
    messages,
    sendMessage,
    clearChat,
    stopStreaming,
    isStreaming,
    loading,
    error,
  };
} 