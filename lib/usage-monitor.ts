/**
 * AI Usage Monitoring and Cost Tracking System
 * Tracks token usage, costs, and implements budget controls
 */

import { aiConfig } from './ai-config';
import type { SystemDailyStats } from './content/types';

export interface UsageRecord {
  userId: string;
  sessionId: string;
  timestamp: Date;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  feature: string; // 'chat', 'content-generation', 'copilot', etc.
  cefrLevel?: string;
  businessContext?: string;
}

export interface UserUsageStats {
  userId: string;
  daily: {
    date: string;
    totalCost: number;
    totalTokens: number;
    requestCount: number;
  };
  monthly: {
    month: string;
    totalCost: number;
    totalTokens: number;
    requestCount: number;
  };
  limits: {
    dailyTokensRemaining: number;
    dailyBudgetRemaining: number;
    monthlyBudgetRemaining: number;
  };
}

export interface SystemUsageStats {
  daily: {
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    uniqueUsers: number;
  };
  monthly: {
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    uniqueUsers: number;
  };
  budgetStatus: {
    dailyUsedPercentage: number;
    monthlyUsedPercentage: number;
    isOverBudget: boolean;
  };
}

// In-memory storage for demo - in production, use Redis or database
class UsageStorage {
  private static records: UsageRecord[] = [];
  private static dailyUsage: Map<string, Map<string, number>> = new Map(); // userId -> date -> tokens
  private static monthlyUsage: Map<string, Map<string, number>> = new Map(); // userId -> month -> tokens
  private static dailyCosts: Map<string, Map<string, number>> = new Map(); // userId -> date -> cost
  private static monthlyCosts: Map<string, Map<string, number>> = new Map(); // userId -> month -> cost

  public static addRecord(record: UsageRecord): void {
    this.records.push(record);
    
    const dateKey = record.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
    const monthKey = `${record.timestamp.getFullYear()}-${record.timestamp.getMonth() + 1}`; // YYYY-M

    // Track daily tokens
    if (!this.dailyUsage.has(record.userId)) {
      this.dailyUsage.set(record.userId, new Map());
    }
    const userDailyTokens = this.dailyUsage.get(record.userId)!.get(dateKey) || 0;
    this.dailyUsage.get(record.userId)!.set(dateKey, userDailyTokens + record.totalTokens);

    // Track monthly tokens
    if (!this.monthlyUsage.has(record.userId)) {
      this.monthlyUsage.set(record.userId, new Map());
    }
    const userMonthlyTokens = this.monthlyUsage.get(record.userId)!.get(monthKey) || 0;
    this.monthlyUsage.get(record.userId)!.set(monthKey, userMonthlyTokens + record.totalTokens);

    // Track daily costs
    if (!this.dailyCosts.has(record.userId)) {
      this.dailyCosts.set(record.userId, new Map());
    }
    const userDailyCost = this.dailyCosts.get(record.userId)!.get(dateKey) || 0;
    this.dailyCosts.get(record.userId)!.set(dateKey, userDailyCost + record.estimatedCost);

    // Track monthly costs
    if (!this.monthlyCosts.has(record.userId)) {
      this.monthlyCosts.set(record.userId, new Map());
    }
    const userMonthlyCost = this.monthlyCosts.get(record.userId)!.get(monthKey) || 0;
    this.monthlyCosts.get(record.userId)!.set(monthKey, userMonthlyCost + record.estimatedCost);

    // Clean old records (keep last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.records = this.records.filter(r => r.timestamp >= thirtyDaysAgo);
  }

  public static getUserDailyTokens(userId: string, date?: string): number {
    const dateKey = date || new Date().toISOString().split('T')[0];
    return this.dailyUsage.get(userId)?.get(dateKey) || 0;
  }

  public static getUserDailyCost(userId: string, date?: string): number {
    const dateKey = date || new Date().toISOString().split('T')[0];
    return this.dailyCosts.get(userId)?.get(dateKey) || 0;
  }

  public static getUserMonthlyTokens(userId: string, month?: string): number {
    const monthKey = month || `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
    return this.monthlyUsage.get(userId)?.get(monthKey) || 0;
  }

  public static getUserMonthlyCost(userId: string, month?: string): number {
    const monthKey = month || `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
    return this.monthlyCosts.get(userId)?.get(monthKey) || 0;
  }

  public static getAllRecords(limit?: number): UsageRecord[] {
    return limit ? this.records.slice(-limit) : this.records;
  }

  public static getUserRecords(userId: string, limit?: number): UsageRecord[] {
    const userRecords = this.records.filter(r => r.userId === userId);
    return limit ? userRecords.slice(-limit) : userRecords;
  }

  public static getSystemDailyStats(date?: string): SystemDailyStats {
    const dateKey = date || new Date().toISOString().split('T')[0];
    const dayRecords = this.records.filter(r => 
      r.timestamp.toISOString().split('T')[0] === dateKey
    );

    return {
      date: new Date().toISOString().split('T')[0],
      totalUsers: new Set(dayRecords.map(r => r.userId)).size,
      totalRequests: dayRecords.length,
      totalTokens: dayRecords.reduce((sum, r) => sum + r.totalTokens, 0),
      totalCost: dayRecords.reduce((sum, r) => sum + r.estimatedCost, 0),
      averageResponseTime: 0, // Placeholder - responseTime not in UsageRecord
      errorRate: 0, // Placeholder - error not in UsageRecord
      topFeatures: ['content-generation', 'assessment', 'chat'],
      uniqueUsers: new Set(dayRecords.map(r => r.userId)).size,
    };
  }
}

export class UsageMonitor {
  // Record AI usage for tracking and billing
  public static async recordUsage(
    userId: string,
    sessionId: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    estimatedCost: number,
    feature: string = 'chat',
    metadata?: {
      cefrLevel?: string;
      businessContext?: string;
    }
  ): Promise<void> {
    const record: UsageRecord = {
      userId,
      sessionId,
      timestamp: new Date(),
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCost,
      feature,
      cefrLevel: metadata?.cefrLevel,
      businessContext: metadata?.businessContext,
    };

    UsageStorage.addRecord(record);

    // Log for monitoring (in production, send to analytics service)
    console.log(`[Usage] User ${userId}: ${record.totalTokens} tokens, $${record.estimatedCost.toFixed(4)}`);
  }

  // Check if user can make request based on daily limits
  public static canUserMakeRequest(userId: string): {
    allowed: boolean;
    reason?: string;
    tokensRemaining?: number;
    budgetRemaining?: number;
  } {
    const dailyTokens = UsageStorage.getUserDailyTokens(userId);
    const dailyCost = UsageStorage.getUserDailyCost(userId);

    // Check daily token limit
    if (dailyTokens >= aiConfig.rateLimit.maxTokensPerUserDaily) {
      return {
        allowed: false,
        reason: 'Daily token limit exceeded',
        tokensRemaining: 0,
      };
    }

    // Check daily budget limit (per user - calculate from system budget)
    const userDailyBudget = aiConfig.budget.dailyUSD * 0.1; // 10% of system budget per user max
    if (dailyCost >= userDailyBudget) {
      return {
        allowed: false,
        reason: 'Daily budget limit exceeded',
        budgetRemaining: 0,
      };
    }

    return {
      allowed: true,
      tokensRemaining: aiConfig.rateLimit.maxTokensPerUserDaily - dailyTokens,
      budgetRemaining: userDailyBudget - dailyCost,
    };
  }

  // Get user usage statistics
  public static getUserStats(userId: string): UserUsageStats {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;

    const dailyTokens = UsageStorage.getUserDailyTokens(userId);
    const dailyCost = UsageStorage.getUserDailyCost(userId);
    const monthlyTokens = UsageStorage.getUserMonthlyTokens(userId);
    const monthlyCost = UsageStorage.getUserMonthlyCost(userId);

    const userDailyBudget = aiConfig.budget.dailyUSD * 0.1;
    const userMonthlyBudget = aiConfig.budget.monthlyUSD * 0.1;

    const userRecords = UsageStorage.getUserRecords(userId);
    const dailyRequests = userRecords.filter(r => 
      r.timestamp.toISOString().split('T')[0] === today
    ).length;
    const monthlyRequests = userRecords.filter(r => {
      const recordMonth = `${r.timestamp.getFullYear()}-${r.timestamp.getMonth() + 1}`;
      return recordMonth === thisMonth;
    }).length;

    return {
      userId,
      daily: {
        date: today,
        totalCost: dailyCost,
        totalTokens: dailyTokens,
        requestCount: dailyRequests,
      },
      monthly: {
        month: thisMonth,
        totalCost: monthlyCost,
        totalTokens: monthlyTokens,
        requestCount: monthlyRequests,
      },
      limits: {
        dailyTokensRemaining: Math.max(0, aiConfig.rateLimit.maxTokensPerUserDaily - dailyTokens),
        dailyBudgetRemaining: Math.max(0, userDailyBudget - dailyCost),
        monthlyBudgetRemaining: Math.max(0, userMonthlyBudget - monthlyCost),
      },
    };
  }

  // Get system-wide usage statistics
  public static getSystemStats(): SystemUsageStats {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;

    const dailyStats = UsageStorage.getSystemDailyStats(today);
    
    // Calculate monthly stats
    const allRecords = UsageStorage.getAllRecords();
    const monthlyRecords = allRecords.filter(r => {
      const recordMonth = `${r.timestamp.getFullYear()}-${r.timestamp.getMonth() + 1}`;
      return recordMonth === thisMonth;
    });

    const monthlyStats = {
      totalCost: monthlyRecords.reduce((sum, r) => sum + r.estimatedCost, 0),
      totalTokens: monthlyRecords.reduce((sum, r) => sum + r.totalTokens, 0),
      totalRequests: monthlyRecords.length,
      uniqueUsers: new Set(monthlyRecords.map(r => r.userId)).size,
    };

    return {
      daily: dailyStats,
      monthly: monthlyStats,
      budgetStatus: {
        dailyUsedPercentage: (dailyStats.totalCost / aiConfig.budget.dailyUSD) * 100,
        monthlyUsedPercentage: (monthlyStats.totalCost / aiConfig.budget.monthlyUSD) * 100,
        isOverBudget: monthlyStats.totalCost > aiConfig.budget.monthlyUSD,
      },
    };
  }

  // Check system budget status
  public static isSystemOverBudget(): {
    overBudget: boolean;
    dailyPercentage: number;
    monthlyPercentage: number;
    shouldBlock: boolean;
  } {
    const stats = this.getSystemStats();
    const shouldBlock = stats.budgetStatus.monthlyUsedPercentage > 95; // Block at 95%

    return {
      overBudget: stats.budgetStatus.isOverBudget,
      dailyPercentage: stats.budgetStatus.dailyUsedPercentage,
      monthlyPercentage: stats.budgetStatus.monthlyUsedPercentage,
      shouldBlock,
    };
  }

  // Export usage data (for reporting)
  public static exportUsageData(userId?: string, startDate?: Date, endDate?: Date): UsageRecord[] {
    let records = userId ? 
      UsageStorage.getUserRecords(userId) : 
      UsageStorage.getAllRecords();

    if (startDate || endDate) {
      records = records.filter(r => {
        if (startDate && r.timestamp < startDate) return false;
        if (endDate && r.timestamp > endDate) return false;
        return true;
      });
    }

    return records;
  }

  // Generate usage report
  public static generateReport(userId?: string): string {
    const stats = userId ? this.getUserStats(userId) : this.getSystemStats();
    
    if (userId) {
      const userStats = stats as UserUsageStats;
      return `
Usage Report for User: ${userId}
Daily (${userStats.daily.date}):
  - Requests: ${userStats.daily.requestCount}
  - Tokens: ${userStats.daily.totalTokens}
  - Cost: $${userStats.daily.totalCost.toFixed(4)}

Monthly (${userStats.monthly.month}):
  - Requests: ${userStats.monthly.requestCount}
  - Tokens: ${userStats.monthly.totalTokens}
  - Cost: $${userStats.monthly.totalCost.toFixed(4)}

Remaining Limits:
  - Daily Tokens: ${userStats.limits.dailyTokensRemaining}
  - Daily Budget: $${userStats.limits.dailyBudgetRemaining.toFixed(4)}
  - Monthly Budget: $${userStats.limits.monthlyBudgetRemaining.toFixed(4)}
      `.trim();
    } else {
      const systemStats = stats as SystemUsageStats;
      return `
System Usage Report
Daily:
  - Requests: ${systemStats.daily.totalRequests}
  - Tokens: ${systemStats.daily.totalTokens}
  - Cost: $${systemStats.daily.totalCost.toFixed(4)}
  - Users: ${systemStats.daily.uniqueUsers}

Monthly:
  - Requests: ${systemStats.monthly.totalRequests}
  - Tokens: ${systemStats.monthly.totalTokens}
  - Cost: $${systemStats.monthly.totalCost.toFixed(4)}
  - Users: ${systemStats.monthly.uniqueUsers}

Budget Status:
  - Daily Used: ${systemStats.budgetStatus.dailyUsedPercentage.toFixed(1)}%
  - Monthly Used: ${systemStats.budgetStatus.monthlyUsedPercentage.toFixed(1)}%
  - Over Budget: ${systemStats.budgetStatus.isOverBudget ? 'YES' : 'NO'}
      `.trim();
    }
  }
}

export default UsageMonitor;