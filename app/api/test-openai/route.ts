import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey || apiKey === 'sk-your-openai-api-key-here') {
      return NextResponse.json({
        error: 'OpenAI API key not configured',
        apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET'
      }, { status: 500 });
    }

    // Test OpenAI connection
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    console.log('🤖 Testing OpenAI API with gpt-4o-mini...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello World" in a friendly way.' }
      ],
      max_tokens: 50,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'No response';

    return NextResponse.json({
      success: true,
      apiKeyConfigured: true,
      response: response,
      model: 'gpt-4o-mini',
      usage: completion.usage
    });

  } catch (error) {
    return NextResponse.json({
      error: 'OpenAI API test failed',
      details: error instanceof Error ? error.message : String(error),
      apiKeyConfigured: !!process.env.OPENAI_API_KEY
    }, { status: 500 });
  }
}