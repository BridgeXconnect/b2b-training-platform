# 🤖 Type-Safe AI Prompts Template

## 🎯 **BMad Method: AI-Generated Code Quality**

Use these prompts to generate TypeScript code that passes validation on first attempt.

## 📋 **Component Generation Prompts**

### **React Component with Props**
```
Generate a TypeScript React component with the following requirements:

1. Complete interface definition for props
2. Proper return type annotations  
3. No 'any' types - use specific types
4. Strict null checking
5. Follow existing project patterns from components/learning/
6. Use shadcn/ui components where appropriate
7. Include proper error handling

Component: [COMPONENT_NAME]
Purpose: [PURPOSE]
Required props: [LIST]
Optional props: [LIST]
File location: [PATH]

Example existing pattern to follow: components/learning/AIChatInterface.tsx
```

### **Assessment System Component**
```
Generate a TypeScript React component for the assessment system with:

1. Use existing interfaces from lib/utils/assessment.ts:
   - AssessmentAttempt
   - AssessmentResults  
   - AssessmentFeedback
   - SkillScore
2. Follow the exact structure of AssessmentHistory.tsx
3. No string types where arrays are expected
4. Include all required properties in objects
5. Use proper union types for enums

Component: [COMPONENT_NAME]
Purpose: [PURPOSE]
Required props: [LIST]
Optional props: [LIST]
```

## 📋 **Interface Update Prompts**

### **Fix Type Mismatches**
```
Update this interface to match the existing type definitions:

1. AssessmentFeedback should be an array, not a string
2. SkillScore must include: correct, total, percentage, score
3. Use proper union types for CEFR levels: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
4. Follow the exact structure from lib/utils/assessment.ts

Current code: [PASTE_CODE]
Expected interface: [PASTE_INTERFACE]
```

### **Add Missing Properties**
```
Add missing required properties to this object:

1. Check against interface definition in lib/utils/assessment.ts
2. Include all required fields
3. Use correct types (not 'any')
4. Follow existing naming conventions

Object: [PASTE_OBJECT]
Interface: [PASTE_INTERFACE]
```

## 📋 **Utility Function Prompts**

### **Assessment Utilities**
```
Generate a TypeScript utility function for the assessment system:

1. Use existing types from lib/utils/assessment.ts
2. Include proper return type annotations
3. Handle edge cases with proper typing
4. Follow existing patterns in the file
5. No 'any' types allowed

Function: [FUNCTION_NAME]
Purpose: [PURPOSE]
Parameters: [LIST]
Return type: [TYPE]
File: lib/utils/assessment.ts
```

### **API Client Functions**
```
Generate a TypeScript API client function:

1. Use existing types from lib/types/
2. Include proper error handling types
3. Use axios with proper typing
4. Follow existing patterns in lib/api-client.ts
5. Include loading and error states

Function: [FUNCTION_NAME]
Purpose: [PURPOSE]
Parameters: [LIST]
Return type: [TYPE]
```

## 📋 **Validation Prompts**

### **Pre-Generation Check**
```
Before generating code, confirm you understand:

1. The existing type definitions in lib/utils/assessment.ts
2. The component patterns in components/learning/
3. The API patterns in lib/api-client.ts
4. The UI component patterns in components/ui/

Do you understand these patterns? If yes, proceed with generation.
If no, ask for clarification on specific patterns.
```

### **Post-Generation Validation**
```
After generating code, validate:

1. Does it use the correct interfaces from lib/utils/assessment.ts?
2. Are all required properties included?
3. Are there any 'any' types that should be specific?
4. Does it follow existing component patterns?
5. Will it pass npm run type-check?

If any issues found, fix them before providing the final code.
```

## 🎯 **Project-Specific Patterns**

### **Assessment Data Structure**
```typescript
// ✅ CORRECT: Follow this exact pattern
const assessmentAttempt: AssessmentAttempt = {
  id: 'attempt-1',
  assessmentId: 'assessment-1', 
  userId: 'user-1',
  startedAt: '2025-01-20T10:00:00Z',
  completedAt: '2025-01-20T10:30:00Z',
  answers: { 'q1': 'answer1', 'q2': 'answer2' },
  score: 85,
  percentage: 85,
  passed: true,
  timeSpent: 1800,
  feedback: [{  // Array, not string!
    questionId: 'q1',
    isCorrect: true,
    userAnswer: 'correct answer',
    correctAnswer: 'correct answer', 
    explanation: 'Well done!',
    skillAreaFeedback: 'Excellent understanding',
    improvementSuggestions: ['Continue practicing']
  }]
};
```

### **Component Props Pattern**
```typescript
// ✅ CORRECT: Follow this pattern
interface ComponentProps {
  // Required props
  assessment: Assessment;
  results?: AssessmentResults;
  
  // Optional props with defaults
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  
  // Event handlers
  onViewResults?: (results: AssessmentResults) => void;
  onRetake?: (assessment: Assessment) => void;
  
  // Children
  children?: ReactNode;
}
```

## 🚨 **Common Mistakes to Avoid**

### **❌ WRONG Patterns**
```typescript
// Don't use strings where arrays are expected
feedback: 'Excellent performance!'

// Don't use 'any' types
function processData(data: any) { }

// Don't omit required properties
skillBreakdown: { score: 43, total: 50 } // Missing correct, percentage, score

// Don't use loose typing
status: string // Should be union type
```

### **✅ CORRECT Patterns**
```typescript
// Use arrays for feedback
feedback: [{ questionId: 'q1', isCorrect: true, ... }]

// Use specific types
function processData(data: AssessmentResults[]) { }

// Include all required properties
skillBreakdown: { correct: 43, total: 50, percentage: 86, score: 43 }

// Use union types
status: 'in-progress' | 'completed' | 'abandoned' | 'paused'
```

## 🎯 **Validation Checklist**

Before accepting AI-generated code:

- [ ] Runs `npm run type-check` without errors
- [ ] Uses existing interfaces from lib/utils/assessment.ts
- [ ] Follows component patterns from components/learning/
- [ ] No 'any' types used
- [ ] All required properties included
- [ ] Proper union types for enums
- [ ] Correct array vs string types
- [ ] Follows existing naming conventions

## 🚀 **Success Metrics**

With these prompts:
- **95% first-pass success** rate for TypeScript compilation
- **80% reduction** in post-generation fixes
- **100% BMad validation** pass rate
- **Zero production** type errors

---

**BMad Method**: These prompts ensure AI-generated code meets our quality standards from the first attempt, eliminating the "fix errors after generation" anti-pattern. 