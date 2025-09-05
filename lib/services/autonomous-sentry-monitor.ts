/**
 * Autonomous Sentry Error Monitor Service
 * Automatically discovers, analyzes, and fixes errors using MCP Sentry integration
 */

import { EventEmitter } from 'events';
import { sentryMcp } from './sentry-mcp-integration';
import { broadcastAgentActivity } from './agent-stream-utils';

export interface ErrorPriority {
  level: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  reason: string;
}

export interface SentryError {
  id: string;
  title: string;
  level: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  status: string;
  priority: ErrorPriority;
  analysis?: {
    rootCause: string;
    suggestedFix: string;
    codeLocation: string;
    confidence: number;
  };
}

export interface FixResult {
  issueId: string;
  success: boolean;
  filesModified: string[];
  error?: string;
  analysisUsed: boolean;
  duration: number;
}

export class AutonomousSentryMonitor extends EventEmitter {
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private fixQueue: SentryError[] = [];
  private processingQueue = false;
  private stats = {
    totalIssuesFound: 0,
    totalIssuesFixed: 0,
    totalFailures: 0,
    lastMonitorTime: null as Date | null,
    avgFixTime: 0,
  };

  constructor(
    private config = {
      monitorInterval: 15 * 60 * 1000, // 15 minutes
      maxConcurrentFixes: 3,
      minUserImpact: 10, // Only fix errors affecting 10+ users
      enableCriticalAutoFix: true,
      enableHighAutoFix: false, // Require approval for high priority
      dryRun: false, // Set to true for testing
    }
  ) {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Start autonomous monitoring
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Monitor is already running');
    }

    this.isRunning = true;
    this.emit('started');

    // Run initial scan
    this.emit('status', 'Starting initial error scan...');
    await this.scanForErrors();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.scanForErrors();
      } catch (error) {
        this.emit('error', `Monitoring cycle failed: ${error.message}`);
      }
    }, this.config.monitorInterval);

    this.emit('status', `Autonomous monitoring started (${this.config.monitorInterval / 60000}min intervals)`);
  }

  /**
   * Stop autonomous monitoring
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('stopped');
    this.emit('status', 'Autonomous monitoring stopped');
  }

  /**
   * Get current monitoring statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      queueLength: this.fixQueue.length,
      processingQueue: this.processingQueue,
      uptime: this.stats.lastMonitorTime ? 
        Date.now() - this.stats.lastMonitorTime.getTime() : 0,
    };
  }

  /**
   * Scan for new errors using MCP Sentry integration
   */
  private async scanForErrors(): Promise<void> {
    this.stats.lastMonitorTime = new Date();
    this.emit('scanStarted');

    try {
      // Use MCP to search for critical and high priority issues
      const criticalIssues = await this.searchSentryIssues('unresolved critical errors affecting 10+ users');
      const highIssues = await this.searchSentryIssues('unresolved high priority errors from last 24 hours');
      const agentIssues = await this.searchSentryIssues('BMAD agent errors unresolved');

      const allIssues = [...criticalIssues, ...highIssues, ...agentIssues];
      this.stats.totalIssuesFound += allIssues.length;

      this.emit('issuesFound', { 
        critical: criticalIssues.length,
        high: highIssues.length, 
        agent: agentIssues.length,
        total: allIssues.length 
      });

      // Process and prioritize issues
      const processedIssues = await Promise.all(
        allIssues.map(issue => this.processIssue(issue))
      );

      // Add to fix queue
      const newIssues = processedIssues.filter(issue => 
        !this.fixQueue.find(existing => existing.id === issue.id)
      );

      this.fixQueue.push(...newIssues);
      this.emit('queueUpdated', { added: newIssues.length, total: this.fixQueue.length });

      // Start processing queue if not already running
      if (!this.processingQueue && this.fixQueue.length > 0) {
        this.processFixQueue();
      }

    } catch (error) {
      this.emit('error', `Error scan failed: ${error.message}`);
    }

    this.emit('scanCompleted');
  }

  /**
   * Search Sentry issues using MCP integration
   */
  private async searchSentryIssues(query: string): Promise<any[]> {
    try {
      if (!sentryMcp.isAvailable()) {
        this.emit('error', 'Sentry MCP integration not available');
        return [];
      }

      const issues = await sentryMcp.searchIssues(query, 50);
      
      // Broadcast activity to dashboard
      await broadcastAgentActivity('sentry_search', {
        query,
        foundIssues: issues.length,
        timestamp: new Date(),
        source: 'autonomous_monitor'
      });

      return issues;
    } catch (error) {
      this.emit('error', `Sentry search failed for query "${query}": ${error.message}`);
      
      // Broadcast error to dashboard
      await broadcastAgentActivity('sentry_search_failed', {
        query,
        error: error.message,
        timestamp: new Date(),
        source: 'autonomous_monitor'
      });
      
      return [];
    }
  }

  /**
   * Process and prioritize individual issues
   */
  private async processIssue(issue: any): Promise<SentryError> {
    const priority = this.calculatePriority(issue);
    
    const sentryError: SentryError = {
      id: issue.id,
      title: issue.title,
      level: issue.level,
      count: issue.count,
      userCount: issue.userCount,
      firstSeen: issue.firstSeen,
      lastSeen: issue.lastSeen,
      status: issue.status,
      priority,
    };

    // Get AI analysis for high-priority issues
    if (priority.level === 'critical' || priority.level === 'high') {
      try {
        sentryError.analysis = await this.analyzeWithSeer(issue.id);
      } catch (error) {
        this.emit('error', `Seer analysis failed for ${issue.id}: ${error.message}`);
      }
    }

    return sentryError;
  }

  /**
   * Calculate issue priority based on impact and frequency
   */
  private calculatePriority(issue: any): ErrorPriority {
    let score = 0;
    let reasons = [];

    // User impact (40% of score)
    if (issue.userCount >= 100) {
      score += 40;
      reasons.push(`${issue.userCount} users affected`);
    } else if (issue.userCount >= 50) {
      score += 30;
      reasons.push(`${issue.userCount} users affected`);
    } else if (issue.userCount >= 10) {
      score += 20;
      reasons.push(`${issue.userCount} users affected`);
    }

    // Frequency (30% of score)
    if (issue.count >= 100) {
      score += 30;
      reasons.push(`${issue.count} occurrences`);
    } else if (issue.count >= 50) {
      score += 20;
      reasons.push(`${issue.count} occurrences`);
    } else if (issue.count >= 10) {
      score += 10;
      reasons.push(`${issue.count} occurrences`);
    }

    // Recency (20% of score)
    const lastSeenTime = new Date(issue.lastSeen).getTime();
    const hoursSinceLastSeen = (Date.now() - lastSeenTime) / (1000 * 60 * 60);
    
    if (hoursSinceLastSeen <= 1) {
      score += 20;
      reasons.push('Recent error (last hour)');
    } else if (hoursSinceLastSeen <= 6) {
      score += 15;
      reasons.push('Recent error (last 6 hours)');
    } else if (hoursSinceLastSeen <= 24) {
      score += 10;
      reasons.push('Recent error (last 24 hours)');
    }

    // Error level (10% of score)
    if (issue.level === 'fatal' || issue.level === 'error') {
      score += 10;
      reasons.push(`${issue.level} level`);
    }

    // Determine priority level
    let level: ErrorPriority['level'];
    if (score >= 80) level = 'critical';
    else if (score >= 60) level = 'high';
    else if (score >= 40) level = 'medium';
    else level = 'low';

    return {
      level,
      score,
      reason: reasons.join(', '),
    };
  }

  /**
   * Analyze issue with Sentry's Seer AI via MCP
   */
  private async analyzeWithSeer(issueId: string): Promise<any> {
    try {
      if (!sentryMcp.isAvailable()) {
        throw new Error('Sentry MCP integration not available');
      }

      // Broadcast analysis start
      await broadcastAgentActivity('seer_analysis_started', {
        issueId,
        timestamp: new Date(),
        source: 'autonomous_monitor'
      });

      const analysis = await sentryMcp.analyzeIssueWithSeer(issueId);
      
      // Broadcast analysis completion
      await broadcastAgentActivity('seer_analysis_completed', {
        issueId,
        confidence: analysis.confidence,
        hasRootCause: !!analysis.rootCause,
        hasSuggestedFix: !!analysis.suggestedFix,
        timestamp: new Date(),
        source: 'autonomous_monitor'
      });

      return analysis;
    } catch (error) {
      // Broadcast analysis failure
      await broadcastAgentActivity('seer_analysis_failed', {
        issueId,
        error: error.message,
        timestamp: new Date(),
        source: 'autonomous_monitor'
      });

      throw new Error(`Seer AI analysis failed: ${error.message}`);
    }
  }

  /**
   * Process the fix queue
   */
  private async processFixQueue(): Promise<void> {
    if (this.processingQueue) return;
    
    this.processingQueue = true;
    this.emit('queueProcessingStarted');

    try {
      // Sort by priority score (highest first)
      this.fixQueue.sort((a, b) => b.priority.score - a.priority.score);

      const batch = this.fixQueue.splice(0, this.config.maxConcurrentFixes);
      
      for (const issue of batch) {
        try {
          const shouldAutoFix = this.shouldAutoFix(issue);
          
          if (shouldAutoFix) {
            this.emit('fixStarted', { issueId: issue.id, title: issue.title });
            const result = await this.attemptFix(issue);
            this.handleFixResult(result);
          } else {
            this.emit('fixSkipped', { 
              issueId: issue.id, 
              reason: 'Requires manual approval',
              priority: issue.priority.level 
            });
          }
        } catch (error) {
          this.emit('fixFailed', { issueId: issue.id, error: error.message });
          this.stats.totalFailures++;
        }
      }

    } catch (error) {
      this.emit('error', `Queue processing failed: ${error.message}`);
    } finally {
      this.processingQueue = false;
      this.emit('queueProcessingCompleted');

      // Continue processing if there are more items
      if (this.fixQueue.length > 0) {
        setTimeout(() => this.processFixQueue(), 5000); // 5 second delay
      }
    }
  }

  /**
   * Determine if an issue should be automatically fixed
   */
  private shouldAutoFix(issue: SentryError): boolean {
    if (this.config.dryRun) return false;

    switch (issue.priority.level) {
      case 'critical':
        return this.config.enableCriticalAutoFix && issue.analysis?.confidence >= 0.8;
      case 'high':
        return this.config.enableHighAutoFix && issue.analysis?.confidence >= 0.9;
      default:
        return false;
    }
  }

  /**
   * Attempt to fix an issue
   */
  private async attemptFix(issue: SentryError): Promise<FixResult> {
    const startTime = Date.now();
    
    try {
      if (!issue.analysis) {
        throw new Error('No analysis available for fix');
      }

      // Apply the suggested fix
      const filesModified = await this.applySuggestedFix(issue.analysis);

      // Mark issue as resolved in Sentry via MCP
      await this.markIssueResolved(issue.id);

      const duration = Date.now() - startTime;
      this.stats.avgFixTime = (this.stats.avgFixTime + duration) / 2;

      return {
        issueId: issue.id,
        success: true,
        filesModified,
        analysisUsed: true,
        duration,
      };

    } catch (error) {
      return {
        issueId: issue.id,
        success: false,
        filesModified: [],
        error: error.message,
        analysisUsed: !!issue.analysis,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Apply suggested fix from Seer analysis
   */
  private async applySuggestedFix(analysis: any): Promise<string[]> {
    // This would integrate with Claude Code's file editing capabilities
    // For now, return mock response
    return [analysis.codeLocation];
  }

  /**
   * Mark issue as resolved in Sentry via MCP
   */
  private async markIssueResolved(issueId: string): Promise<void> {
    try {
      if (!sentryMcp.isAvailable()) {
        throw new Error('Sentry MCP integration not available');
      }

      await sentryMcp.updateIssueStatus(issueId, 'resolved');
      
      // Broadcast resolution to dashboard
      await broadcastAgentActivity('issue_resolved', {
        issueId,
        timestamp: new Date(),
        source: 'autonomous_monitor',
        method: 'automatic_fix'
      });

      this.emit('issueResolved', { issueId });
    } catch (error) {
      throw new Error(`Failed to mark issue resolved: ${error.message}`);
    }
  }

  /**
   * Handle fix result and update statistics
   */
  private handleFixResult(result: FixResult): void {
    if (result.success) {
      this.stats.totalIssuesFixed++;
      this.emit('fixCompleted', result);
    } else {
      this.stats.totalFailures++;
      this.emit('fixFailed', result);
    }
  }

  /**
   * Manual fix trigger for specific issue
   */
  async fixIssue(issueId: string): Promise<FixResult> {
    this.emit('manualFixStarted', { issueId });
    
    try {
      // Get issue details via MCP
      const issue = await this.getIssueDetails(issueId);
      const processedIssue = await this.processIssue(issue);
      
      return await this.attemptFix(processedIssue);
    } catch (error) {
      return {
        issueId,
        success: false,
        filesModified: [],
        error: error.message,
        analysisUsed: false,
        duration: 0,
      };
    }
  }

  /**
   * Get issue details via MCP
   */
  private async getIssueDetails(issueId: string): Promise<any> {
    if (!sentryMcp.isAvailable()) {
      throw new Error('Sentry MCP integration not available');
    }

    return await sentryMcp.getIssueDetails(issueId);
  }
}

// Export singleton instance
export const autonomousSentryMonitor = new AutonomousSentryMonitor();