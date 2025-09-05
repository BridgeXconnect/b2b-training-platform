/**
 * Chunk Retry Polyfill for Production Module Loading
 * Implements intelligent retry mechanisms for failed JavaScript chunk loads
 */

(function() {
  // Configuration for chunk retry behavior
  const RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000, // Base delay in milliseconds
    backoffMultiplier: 2,
    maxDelay: 10000,
    retryableErrors: ['Loading chunk', 'ChunkLoadError', 'Loading CSS chunk']
  };

  // Track retry attempts per chunk
  const chunkRetryMap = new Map();

  // Original webpack require function
  const originalRequire = typeof __webpack_require__ !== 'undefined' ? __webpack_require__ : null;

  if (!originalRequire) {
    console.warn('Webpack not detected - chunk retry polyfill disabled');
    return;
  }

  /**
   * Check if error is retryable
   */
  function isRetryableError(error) {
    const errorMessage = error?.message || error?.toString() || '';
    return RETRY_CONFIG.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError)
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  function calculateRetryDelay(attempt) {
    const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
    return Math.min(delay, RETRY_CONFIG.maxDelay);
  }

  /**
   * Retry chunk loading with exponential backoff
   */
  function retryChunkLoad(chunkId, originalLoader, attempt = 1) {
    return new Promise((resolve, reject) => {
      const retryKey = `chunk_${chunkId}`;
      
      if (attempt > RETRY_CONFIG.maxRetries) {
        console.error(`Chunk ${chunkId} failed to load after ${RETRY_CONFIG.maxRetries} attempts`);
        chunkRetryMap.delete(retryKey);
        
        // Report to Sentry if available
        if (typeof window !== 'undefined' && window.Sentry) {
          window.Sentry.captureException(new Error(`Chunk loading failed: ${chunkId}`), {
            tags: {
              chunkId: chunkId,
              attempts: attempt - 1,
              component: 'chunk-retry-polyfill'
            }
          });
        }
        
        reject(new Error(`Failed to load chunk ${chunkId} after ${RETRY_CONFIG.maxRetries} attempts`));
        return;
      }

      // Store retry attempt
      chunkRetryMap.set(retryKey, attempt);

      // Calculate delay for this attempt
      const delay = attempt === 1 ? 0 : calculateRetryDelay(attempt - 1);

      setTimeout(() => {
        console.log(`Attempting to load chunk ${chunkId} (attempt ${attempt}/${RETRY_CONFIG.maxRetries})`);
        
        // Try loading the chunk
        originalLoader()
          .then(result => {
            console.log(`Chunk ${chunkId} loaded successfully on attempt ${attempt}`);
            chunkRetryMap.delete(retryKey);
            resolve(result);
          })
          .catch(error => {
            if (isRetryableError(error)) {
              console.warn(`Chunk ${chunkId} failed on attempt ${attempt}, retrying...`, error.message);
              retryChunkLoad(chunkId, originalLoader, attempt + 1)
                .then(resolve)
                .catch(reject);
            } else {
              console.error(`Non-retryable error loading chunk ${chunkId}:`, error);
              chunkRetryMap.delete(retryKey);
              reject(error);
            }
          });
      }, delay);
    });
  }

  /**
   * Enhanced chunk loading with retry mechanism
   */
  function enhancedChunkLoad(chunkId) {
    const originalEnsure = originalRequire.ensure || originalRequire.e;
    
    if (!originalEnsure) {
      console.warn('Webpack chunk loading not available');
      return Promise.reject(new Error('Chunk loading not supported'));
    }

    // Create loader function
    const loader = () => originalEnsure.call(originalRequire, chunkId);
    
    // Attempt loading with retry
    return retryChunkLoad(chunkId, loader);
  }

  // Override webpack chunk loading
  if (originalRequire.ensure) {
    const originalEnsure = originalRequire.ensure;
    originalRequire.ensure = function(chunkId) {
      return enhancedChunkLoad(chunkId);
    };
  }

  if (originalRequire.e) {
    const originalE = originalRequire.e;
    originalRequire.e = function(chunkId) {
      return enhancedChunkLoad(chunkId);
    };
  }

  // Global error handler for unhandled chunk load errors
  window.addEventListener('error', function(event) {
    if (event.error && isRetryableError(event.error)) {
      console.warn('Unhandled chunk load error detected:', event.error.message);
      
      // Extract chunk ID from error if possible
      const chunkIdMatch = event.error.message.match(/Loading chunk (\d+) failed/);
      if (chunkIdMatch) {
        const chunkId = chunkIdMatch[1];
        console.log(`Attempting recovery for chunk ${chunkId}`);
        
        // Try to reload the page as last resort
        setTimeout(() => {
          if (confirm('A loading error occurred. Would you like to reload the page?')) {
            window.location.reload();
          }
        }, 2000);
      }
    }
  });

  // Service Worker integration for chunk caching
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      // Send chunk retry statistics to service worker
      registration.active?.postMessage({
        type: 'CHUNK_RETRY_STATS',
        stats: Array.from(chunkRetryMap.entries())
      });
    }).catch(error => {
      console.warn('Service worker not available for chunk caching:', error);
    });
  }

  // Expose configuration for testing
  if (typeof window !== 'undefined') {
    window.__CHUNK_RETRY_CONFIG__ = RETRY_CONFIG;
    window.__CHUNK_RETRY_MAP__ = chunkRetryMap;
  }

  console.log('Chunk retry polyfill initialized successfully');
})();