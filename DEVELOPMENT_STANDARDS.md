# 🛠️ Development Standards & Technical Debt Prevention

This document outlines the coding standards, practices, and automated checks to prevent technical debt accumulation in the AI Course Platform.

## 🚨 Critical Rules (Will Block Commits)

### 1. TypeScript Standards
- **NO `any` types** - Use proper interfaces and type definitions
- **NO `@ts-ignore`** - Fix type issues properly
- **ALL exports must be typed** - Explicit return types for functions
- **Use strict TypeScript configuration**

```typescript
// ❌ BAD
function processData(data: any): any {
  return data.something;
}

// ✅ GOOD  
interface UserData {
  id: string;
  name: string;
}

function processData(data: UserData): ProcessedUser {
  return {
    id: data.id,
    displayName: data.name
  };
}
```

### 2. Logging Standards
- **NO console.log/warn/error in production code**
- **Use structured logging with context**
- **Include metadata for debugging**

```typescript
// ❌ BAD
console.log('User logged in:', userId);
console.error('Something failed:', error);

// ✅ GOOD
import { log } from '@/lib/logger';

log.userAction('User logged in', userId, { sessionId, timestamp });
log.error('Authentication failed', 'AUTH', { error: error.message, userId });
```

### 3. Error Handling Standards
- **Use unified error handling utilities**
- **NO silent error swallowing**
- **Proper error classification and context**

```typescript
// ❌ BAD
try {
  await riskyOperation();
} catch (error) {
  // Silent failure
}

// ✅ GOOD
import { ErrorHandler, commonErrors } from '@/lib/error-utils';

try {
  await riskyOperation();
} catch (error) {
  throw ErrorHandler.handle(error, 'RISKY_OPERATION', { userId, operationId });
}
```

### 4. Security Standards
- **NO secrets in code**
- **Regular dependency audits**
- **Input validation on all endpoints**
- **Proper authentication checks**

## 📋 Code Quality Standards

### File Organization
```
lib/
├── logger.ts          # Centralized logging
├── error-utils.ts     # Unified error handling  
├── types/            # Shared type definitions
├── api-client.ts     # API communication
└── utils/            # Helper utilities

components/
├── ui/               # Reusable UI components
├── learning/         # Learning-specific components
└── sales/            # Sales-specific components
```

### Naming Conventions
- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Types/Interfaces**: PascalCase (`UserData`, `APIResponse`)

### Function Guidelines
- **Max 100 lines per function**
- **Single responsibility principle**
- **Descriptive names over comments**
- **Pure functions when possible**

```typescript
// ✅ GOOD - Single responsibility, clear name
function calculateCEFRScore(answers: AssessmentAnswer[]): number {
  return answers.reduce((score, answer) => {
    return score + (answer.isCorrect ? answer.points : 0);
  }, 0) / answers.length;
}
```

### Import Organization
```typescript
// 1. Node modules
import React from 'react';
import { NextRequest } from 'next/server';

// 2. Internal modules (absolute paths)
import { log } from '@/lib/logger';
import { ErrorHandler } from '@/lib/error-utils';
import type { UserData } from '@/lib/types/user';

// 3. Relative imports
import './styles.css';
```

## 🔄 Development Workflow

### Before Starting Work
1. **Pull latest changes** from main branch
2. **Run dependency audit**: `npm audit`
3. **Check type safety**: `npm run type-check`
4. **Create feature branch**: `git checkout -b feature/description`

### During Development
1. **Write types first** - Define interfaces before implementation
2. **Use logger instead of console** - Structured logging with context
3. **Handle errors properly** - Use error utilities, don't swallow errors
4. **Test incrementally** - Run checks frequently

### Before Committing
1. **Run all checks**: `npm run validate-story`
2. **Fix all TypeScript errors**
3. **Remove console statements**
4. **Update documentation if needed**

### Commit Messages
```
feat: add user authentication system
fix: resolve type errors in assessment module  
refactor: consolidate error handling patterns
docs: update development standards
```

## 🛡️ Automated Quality Gates

### Pre-commit Hooks
- ✅ TypeScript type checking
- ✅ ESLint validation
- ✅ Console statement detection
- ✅ 'any' type detection  
- ✅ Security vulnerability scan
- ✅ Large file detection

### CI/CD Pipeline
```yaml
# .github/workflows/quality.yml
name: Quality Gates
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Type check
        run: npm run type-check
      - name: Lint
        run: npm run lint
      - name: Security audit
        run: npm audit --audit-level high
      - name: Build
        run: npm run build
```

## 📊 Quality Metrics & Monitoring

### Acceptable Thresholds
- **Console statements**: ≤ 5 files (tests only)
- **'any' types**: ≤ 3 instances (migration cases only)
- **Function length**: ≤ 100 lines
- **File length**: ≤ 1000 lines
- **Cyclomatic complexity**: ≤ 15
- **Security vulnerabilities**: 0 high/critical

### Weekly Reviews
- **Dependency audit**: Check for new vulnerabilities
- **Code metrics**: Review complexity and file sizes
- **Technical debt**: Address accumulated TODO/FIXME items
- **Performance**: Monitor bundle size and load times

## 🚀 AI Integration Standards

### Content Generation
- **Use real AI APIs** - No mock implementations in production
- **Implement fallbacks** - Graceful degradation when AI fails
- **Quality assessment** - Automated content validation
- **Cost monitoring** - Track token usage and costs

### Error Handling for AI
```typescript
// ✅ Proper AI error handling
const result = await ErrorHandler.handleAIError(
  () => generateContent(prompt),
  () => getFallbackContent(contentType),
  'CONTENT_GENERATION',
  { userId, contentType }
);
```

## 📚 Learning Resources

### Required Reading
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Best Practices](https://react.dev/learn)
- [Next.js Documentation](https://nextjs.org/docs)
- [ESLint Rules](https://eslint.org/docs/rules/)

### Internal Documentation
- `lib/logger.ts` - Logging system usage
- `lib/error-utils.ts` - Error handling patterns
- `lib/content/types.ts` - Type definitions
- `SECURITY_NOTES.md` - Security considerations

## 🔧 Tools & Extensions

### Required VS Code Extensions
- TypeScript Importer
- ESLint
- Prettier
- Error Lens
- GitLens
- Thunder Client (API testing)

### Recommended Settings
```json
{
  "typescript.preferences.strictGenericChecks": true,
  "eslint.validate": ["typescript", "typescriptreact"],
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 📈 Continuous Improvement

### Monthly Reviews
- **Update dependencies** - Keep packages current
- **Review ESLint rules** - Add new rules as needed
- **Analyze metrics** - Identify trends and areas for improvement
- **Team feedback** - Gather input on standards and tools

### Quarterly Goals
- **Reduce technical debt** - Target specific metrics
- **Improve automation** - Enhance quality gates
- **Update training** - Keep team skills current
- **Tool evaluation** - Assess new tools and practices

---

## 🆘 When Standards Are Violated

### Immediate Actions
1. **Fix the issue** before proceeding
2. **Document the fix** in commit message
3. **Update standards** if needed
4. **Share learnings** with team

### Escalation Process
1. **Developer** - Fixes basic violations
2. **Tech Lead** - Reviews complex violations  
3. **Architect** - Approves standard changes
4. **Team** - Discusses systemic issues

Remember: **Quality is everyone's responsibility!** 🎯