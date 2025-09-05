/**
 * Dynamic Import Helper with Error Recovery
 * Provides robust dynamic importing with fallback mechanisms
 */

interface ImportOptions {
  retries?: number;
  timeout?: number;
  fallback?: () => Promise<any>;
  onError?: (error: Error, attempt: number) => void;
}

interface ImportResult<T> {
  success: boolean;
  module?: T;
  error?: Error;
  attempts: number;
}

/**
 * Enhanced dynamic import with retry and error recovery
 */
export async function dynamicImportWithRetry<T = any>(
  importFn: () => Promise<T>,
  options: ImportOptions = {}
): Promise<ImportResult<T>> {
  const {
    retries = 3,
    timeout = 30000,
    fallback,
    onError
  } = options;

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Import timeout')), timeout);
      });

      // Race between import and timeout
      const module = await Promise.race([
        importFn(),
        timeoutPromise
      ]);

      return {
        success: true,
        module,
        attempts: attempt
      };

    } catch (error) {
      lastError = error as Error;
      
      if (onError) {
        onError(lastError, attempt);
      }

      console.warn(`Dynamic import failed (attempt ${attempt}/${retries}):`, lastError.message);

      // If this is the last attempt and we have a fallback, try it
      if (attempt === retries && fallback) {
        try {
          const fallbackModule = await fallback();
          return {
            success: true,
            module: fallbackModule,
            attempts: attempt + 1
          };
        } catch (fallbackError) {
          console.error('Fallback import also failed:', fallbackError);
        }
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    error: lastError || new Error('Unknown import error'),
    attempts: retries
  };
}

/**
 * Lazy load React component with error boundary integration
 */
export function lazyLoadComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: ImportOptions & { 
    fallbackComponent?: React.ComponentType<any>;
    loadingComponent?: React.ComponentType<any>;
  } = {}
): React.LazyExoticComponent<T> {
  const { fallbackComponent: FallbackComponent, loadingComponent: LoadingComponent, ...importOptions } = options;

  return React.lazy(async () => {
    const result = await dynamicImportWithRetry(importFn, {
      ...importOptions,
      fallback: FallbackComponent ? async () => ({ default: FallbackComponent }) : undefined,
      onError: (error, attempt) => {
        // Report to Sentry if available
        if (typeof window !== 'undefined' && window.Sentry) {
          window.Sentry.captureException(error, {
            tags: {
              component: 'dynamic-import-helper',
              attempt: attempt,
              type: 'component_loading_error'
            }
          });
        }
        
        if (options.onError) {
          options.onError(error, attempt);
        }
      }
    });

    if (!result.success) {
      throw result.error;
    }

    return result.module!;
  });
}

/**
 * Preload dynamic imports for better performance
 */
export async function preloadDynamicImport(
  importFn: () => Promise<any>,
  priority: 'high' | 'low' = 'low'
): Promise<void> {
  try {
    // Use requestIdleCallback for low priority preloading
    if (priority === 'low' && typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      return new Promise(resolve => {
        window.requestIdleCallback(async () => {
          try {
            await importFn();
            resolve();
          } catch (error) {
            console.warn('Preload failed:', error);
            resolve();
          }
        });
      });
    }

    // High priority or fallback - load immediately
    await importFn();
  } catch (error) {
    console.warn('Preload failed:', error);
  }
}

/**
 * Dynamic import utility for modules with TypeScript support
 */
export async function importModule<T = any>(
  modulePath: string,
  options: ImportOptions = {}
): Promise<ImportResult<T>> {
  return dynamicImportWithRetry(
    () => import(modulePath),
    options
  );
}

/**
 * Batch preload multiple dynamic imports
 */
export async function batchPreload(
  imports: Array<{
    importFn: () => Promise<any>;
    priority?: 'high' | 'low';
  }>
): Promise<void> {
  const highPriorityImports = imports.filter(imp => imp.priority === 'high');
  const lowPriorityImports = imports.filter(imp => imp.priority !== 'high');

  // Load high priority imports first
  if (highPriorityImports.length > 0) {
    await Promise.allSettled(
      highPriorityImports.map(imp => preloadDynamicImport(imp.importFn, 'high'))
    );
  }

  // Load low priority imports after
  if (lowPriorityImports.length > 0) {
    Promise.allSettled(
      lowPriorityImports.map(imp => preloadDynamicImport(imp.importFn, 'low'))
    );
  }
}

/**
 * React Hook for dynamic imports with loading states
 */
export function useDynamicImport<T = any>(
  importFn: () => Promise<T>,
  options: ImportOptions = {}
) {
  const [state, setState] = React.useState<{
    loading: boolean;
    module: T | null;
    error: Error | null;
  }>({
    loading: false,
    module: null,
    error: null
  });

  const load = React.useCallback(async () => {
    setState({ loading: true, module: null, error: null });
    
    const result = await dynamicImportWithRetry(importFn, options);
    
    setState({
      loading: false,
      module: result.module || null,
      error: result.error || null
    });
  }, [importFn, options]);

  return {
    ...state,
    load
  };
}

// Re-export React for lazy loading
import React from 'react';