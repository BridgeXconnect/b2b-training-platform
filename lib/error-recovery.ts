/**
 * Error Recovery Utilities
 * Handles cross-system error recovery coordination between frontend and backend
 */

import * as Sentry from '@sentry/nextjs';

export interface ErrorRecoveryContext {
  userId: string;
  sessionId?: string;
  feature: string;
  section: string;
  errorBoundaryLevel: 'page' | 'section' | 'component';
  error: Error;
  context?: Record<string, any>;
  recoveryActions?: string[];
}

export interface RecoveryResult {
  success: boolean;
  actions: Record<string, boolean>;
  message: string;
  recommendations?: {
    userActions: string[];
    systemActions: string[];
    preventionMeasures: string[];
  };
}

export class ErrorRecoveryManager {
  private static instance: ErrorRecoveryManager;
  private recoveryInProgress = new Set<string>();

  public static getInstance(): ErrorRecoveryManager {
    if (!ErrorRecoveryManager.instance) {
      ErrorRecoveryManager.instance = new ErrorRecoveryManager();
    }
    return ErrorRecoveryManager.instance;
  }

  /**
   * Comprehensive error recovery workflow
   */
  async recoverFromError(context: ErrorRecoveryContext): Promise<RecoveryResult> {
    const recoveryKey = `${context.feature}_${context.userId}_${Date.now()}`;
    
    if (this.recoveryInProgress.has(recoveryKey)) {
      console.warn('Recovery already in progress for:', recoveryKey);
      return {
        success: false,
        actions: {},
        message: 'Recovery already in progress'
      };
    }

    this.recoveryInProgress.add(recoveryKey);

    try {
      console.log('Starting error recovery for:', context.feature);

      // Step 1: Report error to backend with detailed context
      const errorReport = await this.reportError(context);
      
      // Step 2: Perform frontend cleanup
      const frontendCleanup = await this.performFrontendCleanup(context);
      
      // Step 3: Perform backend cleanup via API
      const backendCleanup = await this.performBackendCleanup(context);
      
      // Step 4: Attempt service reinitialization
      const reinitialize = await this.reinitializeServices(context);

      const allActions = {
        ...frontendCleanup,
        ...backendCleanup,
        reinitialize
      };

      const successCount = Object.values(allActions).filter(Boolean).length;
      const totalCount = Object.values(allActions).length;
      const success = successCount > (totalCount / 2); // Majority success

      console.log(`Error recovery completed: ${successCount}/${totalCount} actions successful`);

      // Track recovery completion
      Sentry.addBreadcrumb({
        message: 'Error recovery completed',
        category: 'error.recovery',
        level: success ? 'info' : 'warning',
        data: {
          feature: context.feature,
          userId: context.userId,
          successRate: successCount / totalCount,
          actions: allActions
        }
      });

      return {
        success,
        actions: allActions,
        message: success 
          ? 'Recovery completed successfully'
          : 'Recovery partially successful',
        recommendations: errorReport.recommendations
      };

    } catch (recoveryError) {
      console.error('Error recovery failed:', recoveryError);
      
      Sentry.captureException(recoveryError, {
        tags: {
          error_recovery: true,
          feature: context.feature,
          userId: context.userId
        }
      });

      return {
        success: false,
        actions: {},
        message: 'Recovery failed: ' + (recoveryError instanceof Error ? recoveryError.message : 'Unknown error')
      };
    } finally {
      this.recoveryInProgress.delete(recoveryKey);
    }
  }

  /**
   * Report error to backend error reporting endpoint
   */
  private async reportError(context: ErrorRecoveryContext): Promise<any> {
    try {
      const response = await fetch('/api/error/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: context.userId,
          sessionId: context.sessionId || `session_${Date.now()}`,
          feature: context.feature,
          section: context.section,
          errorBoundaryLevel: context.errorBoundaryLevel,
          error: {
            message: context.error.message,
            stack: context.error.stack,
            name: context.error.name
          },
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          context: context.context,
          recoveryAttempted: true,
          recoveryActions: context.recoveryActions || []
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Error reported successfully:', result.errorId);
        return result;
      } else {
        console.error('Error reporting failed:', response.status, response.statusText);
        return { recommendations: this.getDefaultRecommendations(context.feature) };
      }
    } catch (error) {
      console.error('Failed to report error:', error);
      return { recommendations: this.getDefaultRecommendations(context.feature) };
    }
  }

  /**
   * Perform frontend-side cleanup
   */
  private async performFrontendCleanup(context: ErrorRecoveryContext): Promise<Record<string, boolean>> {
    const actions: Record<string, boolean> = {};

    try {
      // Clear relevant session storage
      actions.clearSessionStorage = this.clearRelevantSessionStorage(context.feature);
      
      // Clear relevant local storage
      actions.clearLocalStorage = this.clearRelevantLocalStorage(context.feature);
      
      // Reset global state if applicable
      actions.resetGlobalState = this.resetGlobalState(context.feature);
      
      // Clear service worker cache if applicable
      actions.clearServiceWorkerCache = await this.clearServiceWorkerCache(context.feature);

    } catch (error) {
      console.error('Frontend cleanup failed:', error);
    }

    return actions;
  }

  /**
   * Perform backend cleanup via API
   */
  private async performBackendCleanup(context: ErrorRecoveryContext): Promise<Record<string, boolean>> {
    try {
      const cleanupActions = this.getFeatureCleanupActions(context.feature);
      
      const response = await fetch('/api/session/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: context.userId,
          sessionId: context.sessionId || `session_${Date.now()}`,
          feature: context.feature,
          errorType: context.error.name,
          cleanupActions
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Backend cleanup completed:', result.summary);
        return result.results || {};
      } else {
        console.error('Backend cleanup failed:', response.status);
        return {};
      }
    } catch (error) {
      console.error('Backend cleanup request failed:', error);
      return {};
    }
  }

  /**
   * Reinitialize services after cleanup
   */
  private async reinitializeServices(context: ErrorRecoveryContext): Promise<boolean> {
    try {
      switch (context.feature) {
        case 'voice_practice':
          return await this.reinitializeVoiceServices();
        case 'assessment_generator':
          return await this.reinitializeAssessmentServices();
        case 'advanced_chat':
          return await this.reinitializeChatServices();
        default:
          return true; // No specific reinitialization needed
      }
    } catch (error) {
      console.error('Service reinitialization failed:', error);
      return false;
    }
  }

  /**
   * Feature-specific cleanup actions
   */
  private getFeatureCleanupActions(feature: string): string[] {
    switch (feature) {
      case 'voice_practice':
        return ['reset_voice_state', 'clear_audio_buffers', 'reinitialize_speech_api'];
      case 'assessment_generator':
        return ['retry_generation', 'clear_generation_cache', 'fallback_to_simple_mode'];
      case 'advanced_chat':
        return ['preserve_chat_state', 'restore_conversation_context', 'reinitialize_ai_services'];
      default:
        return [];
    }
  }

  /**
   * Clear relevant session storage
   */
  private clearRelevantSessionStorage(feature: string): boolean {
    try {
      const keysToRemove = this.getSessionStorageKeys(feature);
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear session storage:', error);
      return false;
    }
  }

  /**
   * Clear relevant local storage
   */
  private clearRelevantLocalStorage(feature: string): boolean {
    try {
      const keysToRemove = this.getLocalStorageKeys(feature);
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear local storage:', error);
      return false;
    }
  }

  /**
   * Reset global state
   */
  private resetGlobalState(feature: string): boolean {
    try {
      // Reset any global variables or state related to the feature
      switch (feature) {
        case 'voice_practice':
          // Clear any global audio contexts
          if (typeof window !== 'undefined') {
            (window as any).__audioContexts = [];
            (window as any).__speechRecognition = null;
          }
          break;
        case 'assessment_generator':
          // Clear any global assessment state
          if (typeof window !== 'undefined') {
            (window as any).__assessmentCache = {};
          }
          break;
        case 'advanced_chat':
          // Clear any global chat state
          if (typeof window !== 'undefined') {
            (window as any).__chatContext = null;
          }
          break;
      }
      return true;
    } catch (error) {
      console.error('Failed to reset global state:', error);
      return false;
    }
  }

  /**
   * Clear service worker cache
   */
  private async clearServiceWorkerCache(feature: string): Promise<boolean> {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const relevantCaches = cacheNames.filter(name => 
          name.includes(feature) || name.includes('api') || name.includes('dynamic')
        );
        
        await Promise.all(
          relevantCaches.map(cacheName => caches.delete(cacheName))
        );
        return true;
      }
      return true; // No caches to clear
    } catch (error) {
      console.error('Failed to clear service worker cache:', error);
      return false;
    }
  }

  /**
   * Reinitialize voice services
   */
  private async reinitializeVoiceServices(): Promise<boolean> {
    try {
      // Wait a bit before reinitializing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if voice services are available
      if (typeof window !== 'undefined') {
        const hasAudioContext = 'AudioContext' in window || 'webkitAudioContext' in window;
        const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
        
        if (hasAudioContext && hasSpeechRecognition) {
          console.log('Voice services reinitialized successfully');
          return true;
        }
      }
      
      console.warn('Voice services not available after reinitialization');
      return false;
    } catch (error) {
      console.error('Voice service reinitialization failed:', error);
      return false;
    }
  }

  /**
   * Reinitialize assessment services
   */
  private async reinitializeAssessmentServices(): Promise<boolean> {
    try {
      // Test if assessment generation APIs are working
      const healthCheck = await fetch('/api/health', { method: 'GET' });
      return healthCheck.ok;
    } catch (error) {
      console.error('Assessment service reinitialization failed:', error);
      return false;
    }
  }

  /**
   * Reinitialize chat services
   */
  private async reinitializeChatServices(): Promise<boolean> {
    try {
      // Test if chat APIs are working
      const healthCheck = await fetch('/api/chat', { method: 'HEAD' });
      return healthCheck.ok;
    } catch (error) {
      console.error('Chat service reinitialization failed:', error);
      return false;
    }
  }

  /**
   * Get session storage keys for a feature
   */
  private getSessionStorageKeys(feature: string): string[] {
    const commonKeys = ['error_state', 'recovery_state'];
    
    switch (feature) {
      case 'voice_practice':
        return [...commonKeys, 'voice_practice_cache', 'voice_settings', 'audio_permissions'];
      case 'assessment_generator':
        return [...commonKeys, 'assessment_generation_cache', 'bmad_assessment_cache', 'generation_settings'];
      case 'advanced_chat':
        return [...commonKeys, 'advanced_chat_context', 'chat_history', 'conversation_state'];
      default:
        return commonKeys;
    }
  }

  /**
   * Get local storage keys for a feature
   */
  private getLocalStorageKeys(feature: string): string[] {
    const commonKeys = ['feature_preferences'];
    
    switch (feature) {
      case 'voice_practice':
        return [...commonKeys, 'voice_settings_cache', 'microphone_permissions'];
      case 'assessment_generator':
        return [...commonKeys, 'assessment_preferences', 'generation_history'];
      case 'advanced_chat':
        return [...commonKeys, 'chat_preferences', 'conversation_backup'];
      default:
        return commonKeys;
    }
  }

  /**
   * Get default recommendations when API fails
   */
  private getDefaultRecommendations(feature: string): any {
    return {
      userActions: ['Refresh the page', 'Check internet connection', 'Try again later'],
      systemActions: ['Clear cache', 'Reset state', 'Reinitialize services'],
      preventionMeasures: ['Better error handling', 'Improved monitoring', 'User feedback']
    };
  }
}

/**
 * Convenience function for error recovery
 */
export async function recoverFromError(context: ErrorRecoveryContext): Promise<RecoveryResult> {
  const manager = ErrorRecoveryManager.getInstance();
  return manager.recoverFromError(context);
}