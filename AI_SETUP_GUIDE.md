# AI Integration Setup Guide

## Quick Start

Your AI Course Platform v2 now has **real AI integration**! Follow these steps to get everything working:

### 1. Environment Setup

1. **Copy the environment template:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Get your OpenAI API key:**
   - Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Create a new secret key
   - Copy the key (starts with `sk-`)

3. **Configure your `.env.local` file:**
   ```bash
   # Required - Replace with your actual API key
   OPENAI_API_KEY=sk-your-actual-key-here
   
   # Optional - For enhanced features
   ANTHROPIC_API_KEY=your-anthropic-key-here
   OPENAI_ORG_ID=your-org-id-here
   ```

### 2. Install Dependencies

```bash
npm install
# or
npm install --legacy-peer-deps
```

### 3. Test Your Setup

Run the test script to verify everything is working:

```bash
node test-ai-integration.js
```

Expected output:
```
🚀 Starting AI Integration Tests
✅ Passed: 7
❌ Failed: 0
⚠️  Skipped: 1
📈 Success Rate: 100%
```

### 4. Start the Application

```bash
npm run dev
```

Visit `http://localhost:3000` and test the chat interface!

---

## What's Been Implemented

### ✅ Phase 1 Complete (Real AI Integration)

1. **Chat API Replacement**
   - ❌ Mock responses → ✅ Real OpenAI GPT-4 integration
   - ✅ CEFR-appropriate responses (A1-C2)
   - ✅ Business context awareness
   - ✅ Conversation memory

2. **Rate Limiting & Cost Control**
   - ✅ Per-user request limits (60/minute)
   - ✅ Daily token limits (50K/user)
   - ✅ Budget monitoring ($50/user/month)
   - ✅ Automatic fallbacks

3. **Error Handling & Fallbacks**
   - ✅ Graceful error handling
   - ✅ Automatic fallback responses
   - ✅ Multiple model support (GPT-4 → GPT-3.5)
   - ✅ User-friendly error messages

4. **Monitoring & Health Checks**
   - ✅ Real-time usage tracking
   - ✅ Cost estimation
   - ✅ System health monitoring
   - ✅ Error analytics

### 🔄 Still Mock (Phase 2 & 3)

- Content Generation Engine (`/lib/content/generators/core.ts`)
- CopilotKit Actions (`/lib/copilotkit/advancedActions.ts`)

---

## API Endpoints

### Chat API
```bash
POST /api/chat
```
**Body:**
```json
{
  "message": "Hello, I want to practice presentations",
  "settings": {
    "cefrLevel": "B2",
    "businessContext": "B2B sales",
    "learningGoals": ["presentations", "communication"],
    "userId": "user123"
  },
  "sessionId": "session123",
  "messages": []
}
```

### Usage Monitoring
```bash
GET /api/usage?action=stats&userId=user123
GET /api/usage?action=check&userId=user123
GET /api/usage?action=report&userId=user123
```

### Health Check
```bash
GET /api/health
GET /api/health?detailed=true
```

---

## Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | - | ✅ |
| `AI_MODEL_PRIMARY` | Primary AI model | `gpt-4-turbo-preview` | ❌ |
| `AI_MODEL_SECONDARY` | Fallback model | `gpt-3.5-turbo` | ❌ |
| `AI_MAX_TOKENS` | Max tokens per request | `4000` | ❌ |
| `AI_TEMPERATURE` | Response creativity | `0.7` | ❌ |
| `AI_DAILY_BUDGET_USD` | Daily budget limit | `50` | ❌ |
| `AI_MONTHLY_BUDGET_USD` | Monthly budget limit | `1000` | ❌ |

### CEFR Level Support

The AI automatically adjusts responses based on CEFR level:

- **A1**: Simple present tense, 500-1000 basic words
- **A2**: Past/future tense, 1000-2000 common words  
- **B1**: Complex sentences, 2000-3000 words, opinions
- **B2**: Abstract topics, 3000-4000 words, detailed arguments
- **C1**: Sophisticated language, 4000-5000 words, nuanced expression
- **C2**: Native-like precision, 5000+ words, cultural competency

---

## Cost Management

### Estimated Costs (per user per month)

| Usage Level | Requests/Month | Est. Tokens | Est. Cost |
|-------------|----------------|-------------|-----------|
| Light | 100 | 100K | $3-5 |
| Moderate | 500 | 500K | $15-25 |
| Heavy | 1000+ | 1M+ | $30-50 |

### Cost Optimization Tips

1. **Use appropriate models:**
   - GPT-3.5 Turbo for simple conversations (10x cheaper)
   - GPT-4 for complex business scenarios

2. **Monitor usage:**
   - Check `/api/usage?action=stats` regularly
   - Set up budget alerts

3. **Optimize prompts:**
   - Keep conversation history to 10 messages
   - Use efficient system prompts

---

## Troubleshooting

### Common Issues

**❌ "OPENAI_API_KEY is required"**
```
Solution: Add your OpenAI API key to .env.local
```

**❌ "Rate limit exceeded"**
```
Solution: Wait 1 minute or increase AI_MAX_REQUESTS_PER_MINUTE
```

**❌ "Service temporarily unavailable"**
```
Solution: Check budget limits or OpenAI service status
```

**❌ Chat returns fallback responses**
```
Solution: Check API key, quota, and network connectivity
```

### Debug Commands

```bash
# Check health
curl http://localhost:3000/api/health?detailed=true

# Check user limits
curl "http://localhost:3000/api/usage?action=check&userId=test123"

# Test configuration
curl -X POST http://localhost:3000/api/health \
  -H "Content-Type: application/json" \
  -d '{"action": "validate-config"}'
```

### Log Analysis

Check console logs for:
- `[Usage]` - Token usage tracking
- `[AI Error]` - Error handling and fallbacks
- `OpenAI API error:` - API communication issues

---

## Next Steps

### Phase 2: Content Generation (Next)
- Replace content generation mocks with real AI
- Implement lesson/quiz/exercise generation
- Add CEFR validation for generated content

### Phase 3: CopilotKit Enhancement
- Upgrade CopilotKit actions with real AI
- Add context-aware personalization
- Implement real-time adaptation

### Phase 4: Production Deployment
- Performance optimization
- Security audit
- Monitoring setup
- User acceptance testing

---

## Support

- **Health Check**: `GET /api/health?detailed=true`
- **Test Script**: `node test-ai-integration.js`
- **Documentation**: This guide
- **Error Logs**: Check browser console and server logs

**🎉 Congratulations!** Your AI Course Platform now has real AI integration. Users can have actual conversations with GPT-4 for business English practice!