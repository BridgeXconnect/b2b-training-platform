# CopilotKit Advanced Action Framework

A comprehensive, TypeScript-first framework for creating, managing, and monitoring AI-powered actions in CopilotKit applications. This framework extends the basic CopilotKit action system with advanced features including parameter validation, error handling, monitoring, and intelligent action recommendations.

## Features

### 🏗️ **Architecture**
- **BaseAction**: Foundation class with validation, execution, and lifecycle hooks
- **AdvancedAction**: Extended functionality with availability checking, recommendation scoring, rate limiting, and retry policies
- **ActionRegistry**: Centralized management of all actions with category filtering and context-aware recommendations
- **Type Safety**: Full TypeScript support with comprehensive interfaces and type definitions

### ✅ **Validation System**
- **Zod Integration**: Powerful schema validation with custom validators
- **Learning-Specific Schemas**: Pre-built validators for CEFR levels, learning styles, content types
- **Custom Validation**: Support for complex business logic validation
- **Parameter Validation**: Automatic validation of action parameters with detailed error messages

### 🔧 **Error Handling**
- **Structured Errors**: Standardized error format with severity levels and correlation IDs
- **Error Recovery**: Automatic retry policies with exponential backoff
- **Error Listeners**: Extensible error handling with custom listeners
- **User-Friendly Messages**: Convert technical errors to user-friendly messages

### 📊 **Monitoring & Analytics**
- **Real-time Tracking**: Monitor action executions, performance, and failures
- **Performance Metrics**: Track execution time, token usage, and resource consumption
- **Alert System**: Configurable alerts for error rates, performance issues, and rate limits
- **Historical Data**: Hourly and daily statistics with retention policies

### 🎯 **Intelligent Recommendations**
- **Context Awareness**: Actions adapt based on user learning context and progress
- **Recommendation Scoring**: Intelligent scoring system for action suggestions
- **Availability Checking**: Dynamic availability based on user state and permissions
- **Action Chaining**: Support for sequential and composed action workflows

## Quick Start

### Installation

```bash
# Install dependencies
npm install zod openai @copilotkit/runtime @copilotkit/react-core
```

### Basic Usage

```typescript
import { BaseAction, ActionCategory, initializeActionFramework } from '@/lib/copilot-actions';

// Initialize the framework
initializeActionFramework({
  monitoring: true,
  monitoringConfig: {
    logLevel: 'info',
    alertingEnabled: true
  }
});

// Create a simple action
class MyLessonAction extends BaseAction {
  constructor() {
    super({
      id: 'my_lesson_action',
      name: 'Create Custom Lesson',
      description: 'Generate a personalized lesson',
      category: ActionCategory.LESSON_CREATION,
      parameters: [
        {
          name: 'topic',
          type: 'string',
          description: 'Lesson topic',
          required: true,
          validation: LearningSchemas.topic
        }
      ],
      handler: async (params, context) => {
        // Your lesson generation logic here
        return {
          success: true,
          data: { lesson: 'Generated lesson content...' }
        };
      }
    });
  }
}

// Register the action
import { actionRegistry } from '@/lib/copilot-actions';
actionRegistry.register(new MyLessonAction());
```

### Advanced Usage

```typescript
import { AdvancedAction, ActionCategory } from '@/lib/copilot-actions';

class SmartLessonAction extends AdvancedAction {
  constructor() {
    super({
      id: 'smart_lesson_action',
      name: 'Smart Lesson Generator',
      description: 'AI-powered lesson generation with personalization',
      category: ActionCategory.LESSON_CREATION,
      parameters: [/* ... */],
      handler: async (params, context) => {/* ... */},
      priority: 1,
      rateLimit: {
        maxCallsPerMinute: 10,
        maxCallsPerHour: 100
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        retryableErrors: ['AI_SERVICE_ERROR', 'NETWORK_ERROR']
      },
      chainWith: ['assessment_action', 'progress_tracker']
    });
  }

  async isAvailable(context: ActionContext): Promise<boolean> {
    // Check if user has completed onboarding
    return context.learningContext?.progressData.completedLessons > 0;
  }

  async getRecommendationScore(context: ActionContext): Promise<number> {
    // Higher score if user hasn't had a lesson recently
    const hoursSinceLastLesson = context.metadata?.hoursSinceLastLesson || 0;
    return hoursSinceLastLesson > 24 ? 0.9 : 0.4;
  }
}
```

## Core Components

### BaseAction

Foundation class for all actions with built-in validation and lifecycle management.

```typescript
class MyAction extends BaseAction {
  constructor() {
    super({
      id: 'unique_action_id',
      name: 'Human Readable Name',
      description: 'Action description',
      category: ActionCategory.LESSON_CREATION,
      parameters: [
        {
          name: 'paramName',
          type: 'string',
          description: 'Parameter description',
          required: true,
          validation: z.string().min(3) // Optional Zod schema
        }
      ],
      handler: async (params, context) => {
        // Action logic here
        return { success: true, data: result };
      }
    });
  }

  // Optional lifecycle hooks
  async beforeExecute(params: any, context: ActionContext): Promise<void> {
    // Pre-execution logic
  }

  async afterExecute(result: ActionResult, context: ActionContext): Promise<void> {
    // Post-execution logic
  }

  async onError(error: ActionError, context: ActionContext): Promise<void> {
    // Error handling logic
  }
}
```

### AdvancedAction

Extended functionality with intelligent features and monitoring.

```typescript
class MyAdvancedAction extends AdvancedAction {
  constructor() {
    super({
      // ... base configuration
      priority: 1, // Higher priority = recommended first
      rateLimit: {
        maxCallsPerMinute: 5,
        maxCallsPerHour: 50
      },
      chainWith: ['next_action_id'], // Actions that can follow this one
      composeWith: ['parallel_action_id'], // Actions that can run in parallel
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        retryableErrors: ['NETWORK_ERROR', 'AI_SERVICE_ERROR']
      }
    });
  }

  async isAvailable(context: ActionContext): Promise<boolean> {
    // Return true if action should be available to user
    return context.learningContext?.progressData.currentStreak > 0;
  }

  async getRecommendationScore(context: ActionContext): Promise<number> {
    // Return 0-1 score for how much to recommend this action
    let score = 0.5;
    if (context.learningContext?.assessmentHistory.weakAreas.length > 0) {
      score += 0.3;
    }
    return score;
  }
}
```

### Action Registry

Central management of all actions with intelligent filtering and recommendations.

```typescript
import { actionRegistry, ActionCategory } from '@/lib/copilot-actions';

// Register actions
actionRegistry.register(new MyAction());
actionRegistry.register(new MyAdvancedAction());

// Get actions by category
const lessonActions = actionRegistry.getByCategory(ActionCategory.LESSON_CREATION);

// Get available actions for user
const availableActions = await actionRegistry.getAvailable(userContext);

// Get recommended actions
const recommendations = await actionRegistry.getRecommended(userContext, 5);

// Execute action
const result = await actionRegistry.execute('action_id', params, context);
```

## Validation System

### Pre-built Schemas

```typescript
import { CommonSchemas, LearningSchemas } from '@/lib/copilot-actions';

// Common validations
CommonSchemas.cefrLevel      // A1, A2, B1, B2, C1, C2
CommonSchemas.email          // Valid email format
CommonSchemas.duration       // 5-180 minutes
CommonSchemas.percentage     // 0-100

// Learning-specific validations
LearningSchemas.learningStyle    // visual, auditory, kinesthetic, mixed
LearningSchemas.assessmentType   // diagnostic, formative, summative, placement
LearningSchemas.skillArea        // speaking, listening, reading, writing, etc.
LearningSchemas.contentType      // lesson, quiz, vocabulary, dialogue, etc.
```

### Custom Validation

```typescript
import { z } from 'zod';

const parameters = [
  {
    name: 'customParam',
    type: 'string',
    description: 'Parameter with custom validation',
    required: true,
    validation: z.string()
      .min(5, 'Must be at least 5 characters')
      .max(50, 'Must be less than 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Only letters and spaces allowed')
  }
];
```

### Complex Validation

```typescript
import { CustomValidators } from '@/lib/copilot-actions';

// Validate CEFR level progression
CustomValidators.cefrProgression('A1', 'B1'); // true
CustomValidators.cefrProgression('B2', 'A1'); // false

// Validate time availability
CustomValidators.timeAvailability(10, 60, 5); // 5 hours needed, 10 available = true

// Validate skill combinations
CustomValidators.skillCombination(['speaking', 'listening']); // true
CustomValidators.skillCombination(['invalid_skill']); // false
```

## Error Handling

### Error Types

```typescript
import { ErrorCode, ErrorSeverity, ErrorHandler } from '@/lib/copilot-actions';

// Create structured errors
const error = ErrorHandler.createError(
  ErrorCode.VALIDATION_ERROR,
  'Invalid parameter provided',
  {
    parameter: 'cefrLevel',
    value: 'invalid',
    expected: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  },
  true // recoverable
);

// Handle errors
try {
  // Action execution
} catch (error) {
  const handledError = await ErrorHandler.handle(error, context);
  // Error is logged, monitored, and normalized
}
```

### Error Listeners

```typescript
// Add custom error handling
ErrorHandler.addListener((error, context) => {
  if (error.severity === ErrorSeverity.CRITICAL) {
    // Send to alerting system
    alertingService.sendAlert(error);
  }
});
```

## Monitoring

### Basic Monitoring

```typescript
import { ActionMonitor } from '@/lib/copilot-actions';

const monitor = ActionMonitor.getInstance({
  logLevel: 'info',
  performanceThresholds: {
    warningMs: 3000,
    criticalMs: 10000,
    maxTokens: 4000
  },
  alertingEnabled: true
});

// Get action metrics
const metrics = monitor.getMetrics('action_id');
console.log(metrics.totalExecutions, metrics.successfulExecutions, metrics.errorRate);

// Get performance insights
const insights = monitor.getPerformanceInsights();
console.log(insights.slowestActions);
```

### Performance Tracking

```typescript
import { performanceTracker } from '@/lib/copilot-actions';

// Manual tracking
performanceTracker.start('my_operation', context);
// ... perform operation
const metrics = performanceTracker.end('my_operation', context);

// Decorator-based tracking
class MyService {
  @trackPerformance
  async slowOperation() {
    // This method will be automatically tracked
  }
}
```

## Migration from Existing CopilotKit Actions

The framework includes migration utilities for existing actions:

```typescript
import { getMigratedActions } from '@/lib/copilot-actions/integration';

// Get all migrated actions in CopilotKit format
const actions = getMigratedActions();

// Use in CopilotKit runtime
const runtime = new CopilotRuntime({ actions });
```

## Testing

The framework includes comprehensive test utilities:

```bash
# Run tests
cd lib/copilot-actions
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test BaseAction.test.ts
```

### Test Utilities

```typescript
import { createMockAction, mockActionContext } from '@/lib/copilot-actions/__tests__/setup';

describe('My Action', () => {
  it('should execute successfully', async () => {
    const action = createMockAction();
    const result = await action.execute({}, mockActionContext);
    expect(result.success).toBe(true);
  });
});
```

## Configuration

### Framework Initialization

```typescript
initializeActionFramework({
  monitoring: true,
  monitoringConfig: {
    enabled: true,
    logLevel: 'info',
    performanceThresholds: {
      warningMs: 3000,
      criticalMs: 10000,
      maxTokens: 4000
    },
    metricsRetentionDays: 30,
    alertingEnabled: true
  },
  errorListeners: [
    (error, context) => {
      // Custom error handling
    }
  ]
});
```

### Environment Variables

```bash
OPENAI_API_KEY=your_api_key
COPILOT_ADAPTER=openai
OPENAI_MODEL=gpt-4-turbo-preview
NODE_ENV=production
```

## Best Practices

### 1. Action Design
- Use descriptive IDs and names
- Provide comprehensive parameter descriptions
- Implement proper validation for all parameters
- Handle errors gracefully with meaningful messages

### 2. Performance
- Set appropriate rate limits
- Use retry policies for transient failures
- Monitor token usage and execution time
- Implement caching where appropriate

### 3. User Experience
- Implement availability checks to show relevant actions
- Use recommendation scoring to prioritize useful actions
- Provide clear feedback for all action states
- Chain related actions for smooth workflows

### 4. Monitoring
- Enable comprehensive monitoring in production
- Set up alerts for critical errors and performance issues
- Review metrics regularly to optimize action performance
- Use performance tracking to identify bottlenecks

## API Reference

### Core Classes
- [`BaseAction`](./core/BaseAction.ts) - Foundation action class
- [`AdvancedAction`](./core/AdvancedAction.ts) - Extended action functionality
- [`ActionRegistry`](./core/ActionRegistry.ts) - Action management system

### Validation
- [`CommonSchemas`](./validators/index.ts) - Common validation schemas
- [`LearningSchemas`](./validators/index.ts) - Learning-specific schemas
- [`ValidationHelper`](./validators/index.ts) - Validation utilities
- [`CustomValidators`](./validators/index.ts) - Custom validation functions

### Error Handling
- [`ErrorHandler`](./handlers/ErrorHandler.ts) - Error management system
- [`ErrorCode`](./handlers/ErrorHandler.ts) - Standard error codes
- [`ErrorSeverity`](./handlers/ErrorHandler.ts) - Error severity levels

### Monitoring
- [`ActionMonitor`](./monitoring/ActionMonitor.ts) - Action monitoring system
- [`PerformanceTracker`](./monitoring/PerformanceTracker.ts) - Performance tracking
- [`MonitoringMiddleware`](./monitoring/MonitoringMiddleware.ts) - Middleware system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.