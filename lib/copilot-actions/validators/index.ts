/**
 * Parameter validation utilities for CopilotKit actions
 */

import { z } from 'zod';
import { ActionParameter } from '../types';

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  // CEFR levels
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  
  // Time durations
  duration: z.number().min(5).max(180),
  
  // Percentages
  percentage: z.number().min(0).max(100),
  
  // Ratings
  rating: z.number().min(1).max(5),
  
  // Email
  email: z.string().email(),
  
  // URL
  url: z.string().url(),
  
  // Date
  date: z.string().datetime(),
  
  // Non-empty string
  nonEmptyString: z.string().min(1),
  
  // Array with length constraints
  nonEmptyArray: <T extends z.ZodType>(schema: T) => z.array(schema).min(1),
  
  // Bounded array
  boundedArray: <T extends z.ZodType>(schema: T, min: number, max: number) => 
    z.array(schema).min(min).max(max)
};

/**
 * Learning-specific validation schemas
 */
export const LearningSchemas = {
  // Learning styles
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'mixed']),
  
  // Study time preferences
  studyTime: z.enum(['morning', 'afternoon', 'evening', 'flexible']),
  
  // Difficulty levels
  difficulty: z.enum(['adaptive', 'challenging', 'comfortable', 'beginner', 'intermediate', 'advanced']),
  
  // Assessment types
  assessmentType: z.enum(['diagnostic', 'formative', 'summative', 'placement']),
  
  // Content types
  contentType: z.enum(['lesson', 'quiz', 'vocabulary', 'dialogue', 'business-case', 'roleplay']),
  
  // Skill areas
  skillArea: z.enum([
    'speaking', 'listening', 'reading', 'writing', 
    'grammar', 'vocabulary', 'pronunciation', 'fluency'
  ]),
  
  // Topic with minimum length
  topic: z.string().min(3).max(200),
  
  // Study hours per week
  studyHoursPerWeek: z.number().min(1).max(40),
  
  // Question count
  questionCount: z.number().min(5).max(50),
  
  // Challenge level
  challengeLevel: z.enum(['maintain', 'increase', 'decrease'])
};

/**
 * Validation helper class
 */
export class ValidationHelper {
  /**
   * Create validation schema from parameter definition
   */
  static createSchema(param: ActionParameter): z.ZodType<any> {
    let schema: z.ZodType<any>;
    
    // Use custom validation if provided
    if (param.validation) {
      schema = param.validation;
    } else {
      // Build schema based on type
      schema = this.getBaseSchema(param.type);
    }
    
    // Apply required/optional
    if (!param.required) {
      schema = schema.optional();
    }
    
    // Apply default value
    if (param.default !== undefined) {
      schema = schema.default(param.default);
    }
    
    return schema;
  }
  
  /**
   * Get base schema for parameter type
   */
  static getBaseSchema(type: ActionParameter['type']): z.ZodType<any> {
    switch (type) {
      case 'string':
        return z.string();
      case 'number':
        return z.number();
      case 'boolean':
        return z.boolean();
      case 'string[]':
        return z.array(z.string());
      case 'number[]':
        return z.array(z.number());
      case 'object':
        return z.object({});
      case 'array':
        return z.array(z.any());
      default:
        return z.any();
    }
  }
  
  /**
   * Create composite validation schema
   */
  static createCompositeSchema(params: ActionParameter[]): z.ZodObject<any> {
    const schemaObject: Record<string, z.ZodType<any>> = {};
    
    for (const param of params) {
      schemaObject[param.name] = this.createSchema(param);
    }
    
    return z.object(schemaObject);
  }
  
  /**
   * Validate parameters against schema
   */
  static async validate<T>(
    params: T,
    schema: z.ZodType<T>
  ): Promise<{ valid: boolean; data?: T; errors?: z.ZodError }> {
    try {
      const result = await schema.parseAsync(params);
      return { valid: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: error };
      }
      throw error;
    }
  }
  
  /**
   * Format validation errors for user display
   */
  static formatErrors(errors: z.ZodError): string[] {
    return errors.errors.map(err => {
      const path = err.path.join('.');
      return `${path}: ${err.message}`;
    });
  }
  
  /**
   * Check if value matches expected type
   */
  static isValidType(value: any, type: ActionParameter['type']): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'string[]':
        return Array.isArray(value) && value.every(v => typeof v === 'string');
      case 'number[]':
        return Array.isArray(value) && value.every(v => typeof v === 'number' && !isNaN(v));
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }
}

/**
 * Custom validators for complex scenarios
 */
export class CustomValidators {
  /**
   * Validate CEFR progression (e.g., current level to target level)
   */
  static cefrProgression(current: string, target: string): boolean {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(current);
    const targetIndex = levels.indexOf(target);
    
    return currentIndex !== -1 && targetIndex !== -1 && targetIndex > currentIndex;
  }
  
  /**
   * Validate time availability
   */
  static timeAvailability(
    hoursPerWeek: number,
    sessionDuration: number,
    sessionsPerWeek: number
  ): boolean {
    const totalRequired = sessionDuration * sessionsPerWeek / 60; // Convert to hours
    return totalRequired <= hoursPerWeek;
  }
  
  /**
   * Validate skill combination
   */
  static skillCombination(skills: string[]): boolean {
    const validSkills = [
      'speaking', 'listening', 'reading', 'writing',
      'grammar', 'vocabulary', 'pronunciation', 'fluency'
    ];
    
    return skills.every(skill => validSkills.includes(skill)) && skills.length > 0;
  }
  
  /**
   * Validate content appropriateness for level
   */
  static contentLevelMatch(contentType: string, cefrLevel: string): boolean {
    const advancedContent = ['business-case', 'roleplay'];
    const advancedLevels = ['B2', 'C1', 'C2'];
    
    if (advancedContent.includes(contentType)) {
      return advancedLevels.includes(cefrLevel);
    }
    
    return true;
  }
}

/**
 * Parameter validation decorators (for future use with TypeScript decorators)
 */
export const Validators = {
  Required: () => (target: any, propertyKey: string) => {
    // Implementation for required validation
  },
  
  MinLength: (length: number) => (target: any, propertyKey: string) => {
    // Implementation for min length validation
  },
  
  MaxLength: (length: number) => (target: any, propertyKey: string) => {
    // Implementation for max length validation
  },
  
  InRange: (min: number, max: number) => (target: any, propertyKey: string) => {
    // Implementation for range validation
  },
  
  Pattern: (pattern: RegExp) => (target: any, propertyKey: string) => {
    // Implementation for pattern validation
  }
};