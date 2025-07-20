import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, settings, sessionId, messages } = await request.json();

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // For now, provide a mock response since OpenAI API key isn't configured
    // In production, this would call the OpenAI API with proper context
    const aiResponse = generateMockResponse(message, settings);

    return NextResponse.json({
      content: aiResponse.content,
      cefrLevel: settings?.cefrLevel || 'B1',
      messageType: aiResponse.messageType,
      sessionId: sessionId,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// Mock response generator for development/demo purposes
function generateMockResponse(message: string, settings: any) {
  const cefrLevel = settings?.cefrLevel || 'B1';
  const businessContext = settings?.businessContext || 'B2B sales';
  const learningGoals = settings?.learningGoals || ['communication'];

  // Simple pattern matching for demo responses
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('presentation') || lowerMessage.includes('present')) {
    return {
      content: `Great! Let's practice presentations in ${businessContext}. For ${cefrLevel} level, I recommend structuring your presentation with: 1) Clear introduction, 2) Main points with examples, 3) Strong conclusion. Try starting with: "Good morning, everyone. Today I'd like to discuss..." What topic would you like to present?`,
      messageType: 'practice' as const
    };
  }

  if (lowerMessage.includes('feedback') || lowerMessage.includes('review')) {
    return {
      content: `Excellent! Giving constructive feedback is crucial in ${businessContext}. For ${cefrLevel} level, use this structure: 1) Start with something positive, 2) Address areas for improvement specifically, 3) End with encouragement. Try this: "I appreciate your work on... One area we could improve is... I'm confident you can..." Practice with a specific scenario?`,
      messageType: 'practice' as const
    };
  }

  if (lowerMessage.includes('budget') || lowerMessage.includes('financial')) {
    return {
      content: `Perfect! Budget discussions require clear, precise language. For ${cefrLevel} level, focus on: 1) Key figures and percentages, 2) Trends (increasing/decreasing), 3) Justifications for decisions. Use phrases like "Our quarterly budget shows...", "We've allocated X for...", "The ROI indicates...". What specific budget topic would you like to discuss?`,
      messageType: 'practice' as const
    };
  }

  if (lowerMessage.includes('client') || lowerMessage.includes('customer')) {
    return {
      content: `Wonderful! Client communication is essential in ${businessContext}. For ${cefrLevel} level, remember: 1) Professional tone, 2) Clear expectations, 3) Active listening. Practice phrases: "I understand your concerns about...", "Let me clarify our approach...", "What would work best for your timeline?" Would you like to role-play a specific client scenario?`,
      messageType: 'practice' as const
    };
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('start')) {
    return {
      content: `Hello! I'm excited to help you practice ${learningGoals.join(' and ')} in ${businessContext} at ${cefrLevel} level. I can help you with presentations, client communication, giving feedback, or discussing business topics. What would you like to practice today?`,
      messageType: 'greeting' as const
    };
  }

  // Default response
  return {
    content: `I appreciate you sharing that with me! For ${cefrLevel} level practice in ${businessContext}, let's work on expressing your ideas clearly and professionally. Could you elaborate on your thoughts or ask me about a specific business scenario you'd like to practice? I'm here to help you improve your ${learningGoals.join(', ')} skills.`,
    messageType: 'encouragement' as const
  };
}