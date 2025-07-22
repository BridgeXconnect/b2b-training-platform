/**
 * BaseAction abstract class implementation
 */

import { z } from 'zod';
import {
  BaseAction as IBaseAction,
  ActionParameter,
  ActionContext,
  ActionResult,
  ActionError,
  ActionCategory,
  ActionHandler,
  ActionValidator
} from '../types';

export abstract class BaseAction implements IBaseAction {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly category: ActionCategory;
  public readonly parameters: ActionParameter[];
  
  protected handler: ActionHandler;
  protected validator?: ActionValidator;
  
  constructor(config: {
    id: string;
    name: string;
    description: string;
    category: ActionCategory;
    parameters: ActionParameter[];
    handler: ActionHandler;
    validator?: ActionValidator;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.category = config.category;
    this.parameters = config.parameters;
    this.handler = config.handler;
    this.validator = config.validator;
  }
  
  /**
   * Validate action parameters
   */
  async validate(params: any): Promise<boolean> {
    try {
      // Use custom validator if provided
      if (this.validator) {
        return await this.validator(params);
      }
      
      // Default validation using Zod schemas
      const schema = this.buildValidationSchema();
      const result = await schema.safeParseAsync(params);
      
      if (!result.success) {
        console.error(`Validation failed for action ${this.id}:`, result.error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Validation error in action ${this.id}:`, error);
      return false;
    }
  }
  
  /**
   * Execute the action
   */
  async execute(params: any, context: ActionContext): Promise<ActionResult> {
    const startTime = Date.now();
    
    try {
      // Pre-execution hook
      if (this.beforeExecute) {
        await this.beforeExecute(params, context);
      }
      
      // Validate parameters
      const isValid = await this.validate(params);
      if (!isValid) {
        throw this.createError(
          'VALIDATION_ERROR',
          'Invalid parameters provided',
          { params },
          true
        );
      }
      
      // Execute the action handler
      const result = await this.handler(params, context);
      
      // Add execution metadata
      result.metadata = {
        ...result.metadata,
        executionTime: Date.now() - startTime
      };
      
      // Post-execution hook
      if (this.afterExecute) {
        await this.afterExecute(result, context);
      }
      
      return result;
      
    } catch (error) {
      const actionError = this.normalizeError(error);
      
      // Error hook
      if (this.onError) {
        await this.onError(actionError, context);
      }
      
      return {
        success: false,
        error: actionError,
        metadata: {
          executionTime: Date.now() - startTime
        }
      };
    }
  }
  
  /**
   * Optional hooks - can be overridden by subclasses
   */
  async beforeExecute?(params: any, context: ActionContext): Promise<void>;
  async afterExecute?(result: ActionResult, context: ActionContext): Promise<void>;
  async onError?(error: ActionError, context: ActionContext): Promise<void>;
  
  /**
   * Build Zod validation schema from parameters
   */
  protected buildValidationSchema(): z.ZodType<any> {
    const schemaObject: Record<string, z.ZodType<any>> = {};
    
    for (const param of this.parameters) {
      let paramSchema: z.ZodType<any>;
      
      // Use custom validation if provided
      if (param.validation) {
        paramSchema = param.validation;
      } else {
        // Build schema based on type
        switch (param.type) {
          case 'string':
            paramSchema = z.string();
            break;
          case 'number':
            paramSchema = z.number();
            break;
          case 'boolean':
            paramSchema = z.boolean();
            break;
          case 'string[]':
            paramSchema = z.array(z.string());
            break;
          case 'number[]':
            paramSchema = z.array(z.number());
            break;
          case 'object':
            paramSchema = z.object({});
            break;
          case 'array':
            paramSchema = z.array(z.any());
            break;
          default:
            paramSchema = z.any();
        }
      }
      
      // Apply required/optional
      if (!param.required) {
        paramSchema = paramSchema.optional();
      }
      
      // Apply default value
      if (param.default !== undefined) {
        paramSchema = paramSchema.default(param.default);
      }
      
      schemaObject[param.name] = paramSchema;
    }
    
    return z.object(schemaObject);
  }
  
  /**
   * Create a standardized error
   */
  protected createError(
    code: string,
    message: string,
    details?: any,
    recoverable: boolean = false
  ): ActionError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
      recoverable
    };
  }
  
  /**
   * Normalize any error to ActionError
   */
  protected normalizeError(error: any): ActionError {
    if (error && typeof error === 'object' && 'code' in error) {
      return error as ActionError;
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'An unknown error occurred',
      details: error,
      timestamp: new Date(),
      recoverable: false
    };
  }
  
  /**
   * Get parameter by name
   */
  protected getParameter(name: string): ActionParameter | undefined {
    return this.parameters.find(p => p.name === name);
  }
  
  /**
   * Check if parameter is required
   */
  protected isParameterRequired(name: string): boolean {
    const param = this.getParameter(name);
    return param?.required ?? false;
  }
}