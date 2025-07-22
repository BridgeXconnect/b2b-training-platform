// Caching and Performance Optimization for Recommendation System
// Task 2: Build Intelligent Content Recommendation Engine

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
  size: number; // Estimated memory size in bytes
}

export interface CacheMetrics {
  totalEntries: number;
  totalMemoryUsage: number; // bytes
  hitRate: number;
  missRate: number;
  evictionsCount: number;
  oldestEntryAge: number; // milliseconds
}

export interface CacheConfiguration {
  maxSize: number; // Maximum number of entries
  maxMemory: number; // Maximum memory usage in bytes
  defaultTTL: number; // Default time-to-live in milliseconds
  compressionThreshold: number; // Compress entries larger than this size
  evictionPolicy: 'LRU' | 'LFU' | 'TTL' | 'SIZE';
  enableCompression: boolean;
}

export class RecommendationCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private accessOrder: string[]; // For LRU eviction
  private config: CacheConfiguration;
  private metrics: {
    hits: number;
    misses: number;
    evictions: number;
  };

  constructor(config: Partial<CacheConfiguration> = {}) {
    this.cache = new Map();
    this.accessOrder = [];
    this.metrics = { hits: 0, misses: 0, evictions: 0 };
    
    this.config = {
      maxSize: 1000,
      maxMemory: 50 * 1024 * 1024, // 50MB
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      compressionThreshold: 10 * 1024, // 10KB
      evictionPolicy: 'LRU',
      enableCompression: false,
      ...config
    };
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    // Check TTL
    const now = Date.now();
    if (now - entry.timestamp > this.config.defaultTTL) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.metrics.misses++;
      return null;
    }

    // Update access statistics
    entry.hits++;
    this.updateAccessOrder(key);
    this.metrics.hits++;

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const size = this.estimateSize(value);
    
    // Check if we need to make space
    this.evictIfNecessary(size);

    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      hits: 0,
      size
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
    }
    return deleted;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.metrics = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    const totalMemoryUsage = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? this.metrics.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.metrics.misses / totalRequests : 0;

    let oldestEntryAge = 0;
    const now = Date.now();
    const cacheValues = Array.from(this.cache.values());
    for (const entry of cacheValues) {
      const age = now - entry.timestamp;
      oldestEntryAge = Math.max(oldestEntryAge, age);
    }

    return {
      totalEntries: this.cache.size,
      totalMemoryUsage,
      hitRate,
      missRate,
      evictionsCount: this.metrics.evictions,
      oldestEntryAge
    };
  }

  /**
   * Get cache efficiency score (0-1)
   */
  getEfficiencyScore(): number {
    const metrics = this.getMetrics();
    const hitRateScore = metrics.hitRate;
    const memoryEfficiency = Math.max(0, 1 - (metrics.totalMemoryUsage / this.config.maxMemory));
    const sizeEfficiency = Math.max(0, 1 - (metrics.totalEntries / this.config.maxSize));
    
    return (hitRateScore * 0.6 + memoryEfficiency * 0.2 + sizeEfficiency * 0.2);
  }

  /**
   * Optimize cache by removing expired and least valuable entries
   */
  optimize(): {
    removed: number;
    memoryFreed: number;
    oldHitRate: number;
    newHitRate: number;
  } {
    const oldMetrics = this.getMetrics();
    const now = Date.now();
    let removed = 0;
    let memoryFreed = 0;

    // Remove expired entries
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > this.config.defaultTTL) {
        memoryFreed += entry.size;
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        removed++;
      }
    }

    // Remove low-value entries if still over limits
    if (this.cache.size > this.config.maxSize * 0.8) {
      const entries = Array.from(this.cache.entries());
      entries.sort(([, a], [, b]) => {
        // Sort by value score (hits per age)
        const aScore = a.hits / Math.max(1, (now - a.timestamp) / 1000);
        const bScore = b.hits / Math.max(1, (now - b.timestamp) / 1000);
        return aScore - bScore;
      });

      const removeCount = Math.floor(this.config.maxSize * 0.2);
      for (let i = 0; i < removeCount && i < entries.length; i++) {
        const [key, entry] = entries[i];
        memoryFreed += entry.size;
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        removed++;
      }
    }

    const newMetrics = this.getMetrics();
    return {
      removed,
      memoryFreed,
      oldHitRate: oldMetrics.hitRate,
      newHitRate: newMetrics.hitRate
    };
  }

  private evictIfNecessary(newEntrySize: number): void {
    const currentMemory = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);

    // Check memory limit
    if (currentMemory + newEntrySize > this.config.maxMemory) {
      this.evictByMemory(newEntrySize);
    }

    // Check size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictByPolicy(1);
    }
  }

  private evictByMemory(requiredSpace: number): void {
    let freedSpace = 0;
    const entries = this.getSortedEntriesForEviction();

    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;
      
      freedSpace += entry.size;
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.metrics.evictions++;
    }
  }

  private evictByPolicy(count: number): void {
    const entries = this.getSortedEntriesForEviction();
    
    for (let i = 0; i < count && i < entries.length; i++) {
      const [key] = entries[i];
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.metrics.evictions++;
    }
  }

  private getSortedEntriesForEviction(): [string, CacheEntry<T>][] {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    switch (this.config.evictionPolicy) {
      case 'LRU':
        // Sort by access order (oldest first)
        return entries.sort(([a], [b]) => {
          const aIndex = this.accessOrder.indexOf(a);
          const bIndex = this.accessOrder.indexOf(b);
          return aIndex - bIndex;
        });

      case 'LFU':
        // Sort by hit count (least frequent first)
        return entries.sort(([, a], [, b]) => a.hits - b.hits);

      case 'TTL':
        // Sort by age (oldest first)
        return entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);

      case 'SIZE':
        // Sort by size (largest first)
        return entries.sort(([, a], [, b]) => b.size - a.size);

      default:
        return entries;
    }
  }

  private updateAccessOrder(key: string): void {
    // Remove from current position
    this.removeFromAccessOrder(key);
    // Add to end (most recent)
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private estimateSize(value: T): number {
    try {
      // Rough estimation of object size in bytes
      const jsonString = JSON.stringify(value);
      return jsonString.length * 2; // 2 bytes per character for UTF-16
    } catch {
      return 1024; // Default 1KB if can't serialize
    }
  }
}

/**
 * Multi-level cache system for recommendations
 */
export class RecommendationCacheManager {
  private l1Cache: RecommendationCache<any>; // Hot data, fast access
  private l2Cache: RecommendationCache<any>; // Warm data, larger capacity
  private userContextCache: RecommendationCache<any>;
  private similarityCache: RecommendationCache<any>;
  
  constructor() {
    // L1 Cache: Fast, small, recent recommendations
    this.l1Cache = new RecommendationCache({
      maxSize: 100,
      maxMemory: 10 * 1024 * 1024, // 10MB
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      evictionPolicy: 'LRU'
    });

    // L2 Cache: Larger, longer TTL
    this.l2Cache = new RecommendationCache({
      maxSize: 500,
      maxMemory: 30 * 1024 * 1024, // 30MB
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      evictionPolicy: 'LFU'
    });

    // User context cache
    this.userContextCache = new RecommendationCache({
      maxSize: 200,
      maxMemory: 15 * 1024 * 1024, // 15MB
      defaultTTL: 20 * 60 * 1000, // 20 minutes
      evictionPolicy: 'LRU'
    });

    // Content similarity cache
    this.similarityCache = new RecommendationCache({
      maxSize: 1000,
      maxMemory: 20 * 1024 * 1024, // 20MB
      defaultTTL: 60 * 60 * 1000, // 60 minutes
      evictionPolicy: 'TTL'
    });
  }

  /**
   * Get recommendation with multi-level cache lookup
   */
  getRecommendation(key: string): any {
    // Try L1 first (fastest)
    let result = this.l1Cache.get(key);
    if (result) return result;

    // Try L2 (still fast)
    result = this.l2Cache.get(key);
    if (result) {
      // Promote to L1
      this.l1Cache.set(key, result);
      return result;
    }

    return null;
  }

  /**
   * Set recommendation in appropriate cache level
   */
  setRecommendation(key: string, value: any, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    if (priority === 'high') {
      this.l1Cache.set(key, value);
    } else {
      this.l2Cache.set(key, value);
    }
  }

  /**
   * Get user context from cache
   */
  getUserContext(userId: string): any {
    return this.userContextCache.get(`user_context_${userId}`);
  }

  /**
   * Set user context in cache
   */
  setUserContext(userId: string, context: any): void {
    this.userContextCache.set(`user_context_${userId}`, context);
  }

  /**
   * Get similarity matrix from cache
   */
  getSimilarityMatrix(key: string): any {
    return this.similarityCache.get(`similarity_${key}`);
  }

  /**
   * Set similarity matrix in cache
   */
  setSimilarityMatrix(key: string, matrix: any): void {
    this.similarityCache.set(`similarity_${key}`, matrix);
  }

  /**
   * Invalidate cache for specific user
   */
  invalidateUser(userId: string): void {
    // Remove user-specific entries
    const patterns = [
      `rec_${userId}_`,
      `user_context_${userId}`,
      `perf_${userId}_`
    ];

    for (const pattern of patterns) {
      this.invalidatePattern(pattern);
    }
  }

  /**
   * Get comprehensive metrics from all caches
   */
  getComprehensiveMetrics(): {
    l1: CacheMetrics;
    l2: CacheMetrics;
    userContext: CacheMetrics;
    similarity: CacheMetrics;
    overall: {
      totalMemory: number;
      totalEntries: number;
      averageHitRate: number;
      totalEvictions: number;
    };
  } {
    const l1 = this.l1Cache.getMetrics();
    const l2 = this.l2Cache.getMetrics();
    const userContext = this.userContextCache.getMetrics();
    const similarity = this.similarityCache.getMetrics();

    const totalMemory = l1.totalMemoryUsage + l2.totalMemoryUsage + 
                       userContext.totalMemoryUsage + similarity.totalMemoryUsage;
    const totalEntries = l1.totalEntries + l2.totalEntries + 
                        userContext.totalEntries + similarity.totalEntries;
    const averageHitRate = (l1.hitRate + l2.hitRate + userContext.hitRate + similarity.hitRate) / 4;
    const totalEvictions = l1.evictionsCount + l2.evictionsCount + 
                          userContext.evictionsCount + similarity.evictionsCount;

    return {
      l1,
      l2,
      userContext,
      similarity,
      overall: {
        totalMemory,
        totalEntries,
        averageHitRate,
        totalEvictions
      }
    };
  }

  /**
   * Optimize all caches
   */
  optimizeAll(): {
    l1: any;
    l2: any;
    userContext: any;
    similarity: any;
  } {
    return {
      l1: this.l1Cache.optimize(),
      l2: this.l2Cache.optimize(),
      userContext: this.userContextCache.optimize(),
      similarity: this.similarityCache.optimize()
    };
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
    this.userContextCache.clear();
    this.similarityCache.clear();
  }

  private invalidatePattern(pattern: string): void {
    const caches = [this.l1Cache, this.l2Cache, this.userContextCache, this.similarityCache];
    
    for (const cache of caches) {
      const keysToDelete: string[] = [];
      
      // Get all keys that match the pattern
      for (const key of (cache as any).cache.keys()) {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }
      
      // Delete matching keys
      for (const key of keysToDelete) {
        cache.delete(key);
      }
    }
  }
}

/**
 * Performance monitoring for cache system
 */
export class CachePerformanceMonitor {
  private metricsHistory: Array<{
    timestamp: Date;
    metrics: any;
  }> = [];

  private alertThresholds = {
    lowHitRate: 0.5,
    highMemoryUsage: 0.8,
    highEvictionRate: 0.1
  };

  constructor(private cacheManager: RecommendationCacheManager) {
    // Start monitoring
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Collect metrics every minute
    setInterval(() => {
      this.collectMetrics();
    }, 60 * 1000);

    // Run optimization every 10 minutes
    setInterval(() => {
      this.runOptimizations();
    }, 10 * 60 * 1000);
  }

  private collectMetrics(): void {
    const metrics = this.cacheManager.getComprehensiveMetrics();
    
    this.metricsHistory.push({
      timestamp: new Date(),
      metrics
    });

    // Keep only last 24 hours of metrics
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > cutoff);

    // Check for alerts
    this.checkAlerts(metrics);
  }

  private checkAlerts(metrics: any): void {
    const alerts: string[] = [];

    if (metrics.overall.averageHitRate < this.alertThresholds.lowHitRate) {
      alerts.push(`Low hit rate: ${(metrics.overall.averageHitRate * 100).toFixed(1)}%`);
    }

    if (metrics.l1.totalMemoryUsage / (10 * 1024 * 1024) > this.alertThresholds.highMemoryUsage) {
      alerts.push('L1 cache memory usage high');
    }

    if (alerts.length > 0) {
      console.warn('Cache Performance Alerts:', alerts);
    }
  }

  private runOptimizations(): void {
    const results = this.cacheManager.optimizeAll();
    console.log('Cache optimization completed:', results);
  }

  getPerformanceReport(): {
    current: any;
    trends: {
      hitRateTrend: number[];
      memoryUsageTrend: number[];
      evictionsTrend: number[];
    };
    recommendations: string[];
  } {
    const current = this.cacheManager.getComprehensiveMetrics();
    const recent = this.metricsHistory.slice(-10); // Last 10 data points

    const hitRateTrend = recent.map(m => m.metrics.overall.averageHitRate);
    const memoryUsageTrend = recent.map(m => m.metrics.overall.totalMemory);
    const evictionsTrend = recent.map(m => m.metrics.overall.totalEvictions);

    const recommendations = this.generateRecommendations(current, {
      hitRateTrend,
      memoryUsageTrend,
      evictionsTrend
    });

    return {
      current,
      trends: {
        hitRateTrend,
        memoryUsageTrend,
        evictionsTrend
      },
      recommendations
    };
  }

  private generateRecommendations(current: any, trends: any): string[] {
    const recommendations: string[] = [];

    if (current.overall.averageHitRate < 0.6) {
      recommendations.push('Consider increasing cache TTL or size');
    }

    if (current.overall.totalMemory > 50 * 1024 * 1024) {
      recommendations.push('High memory usage - consider enabling compression');
    }

    const hitRateDecline = trends.hitRateTrend.length > 1 &&
      trends.hitRateTrend[trends.hitRateTrend.length - 1] < trends.hitRateTrend[0];

    if (hitRateDecline) {
      recommendations.push('Hit rate declining - review cache configuration');
    }

    return recommendations;
  }
}

// Export singleton instances
export const recommendationCacheManager = new RecommendationCacheManager();
export const cachePerformanceMonitor = new CachePerformanceMonitor(recommendationCacheManager);