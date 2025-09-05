/**
 * Sentry MCP Integration Layer
 * Connects autonomous monitor to actual Sentry MCP server tools
 */

interface McpSentryTools {
  search_issues: (query: string, limit?: number) => Promise<any[]>;
  search_events: (query: string, limit?: number) => Promise<any[]>;
  get_issue_details: (issueId: string) => Promise<any>;
  analyze_issue_with_seer: (issueId: string) => Promise<any>;
  update_issue: (issueId: string, status: string) => Promise<any>;
}

/**
 * MCP Sentry Integration Service
 * Provides type-safe interface to Sentry MCP tools
 */
export class SentryMcpIntegration {
  private static instance: SentryMcpIntegration;
  private tools: McpSentryTools | null = null;

  private constructor() {}

  static getInstance(): SentryMcpIntegration {
    if (!SentryMcpIntegration.instance) {
      SentryMcpIntegration.instance = new SentryMcpIntegration();
    }
    return SentryMcpIntegration.instance;
  }

  /**
   * Initialize MCP connection (would be called by Claude Code runtime)
   */
  async initialize(tools: McpSentryTools): Promise<void> {
    this.tools = tools;
  }

  /**
   * Check if MCP tools are available
   */
  isAvailable(): boolean {
    return this.tools !== null;
  }

  /**
   * Search for Sentry issues using natural language query
   */
  async searchIssues(query: string, limit = 50): Promise<any[]> {
    if (!this.tools) {
      throw new Error('MCP Sentry tools not initialized');
    }

    try {
      return await this.tools.search_issues(query, limit);
    } catch (error) {
      throw new Error(`Failed to search issues: ${error.message}`);
    }
  }

  /**
   * Search for Sentry events and get statistics
   */
  async searchEvents(query: string, limit = 100): Promise<any[]> {
    if (!this.tools) {
      throw new Error('MCP Sentry tools not initialized');
    }

    try {
      return await this.tools.search_events(query, limit);
    } catch (error) {
      throw new Error(`Failed to search events: ${error.message}`);
    }
  }

  /**
   * Get detailed information about a specific issue
   */
  async getIssueDetails(issueId: string): Promise<any> {
    if (!this.tools) {
      throw new Error('MCP Sentry tools not initialized');
    }

    try {
      return await this.tools.get_issue_details(issueId);
    } catch (error) {
      throw new Error(`Failed to get issue details: ${error.message}`);
    }
  }

  /**
   * Analyze issue with Sentry's Seer AI
   */
  async analyzeIssueWithSeer(issueId: string): Promise<{
    rootCause: string;
    suggestedFix: string;
    codeLocation: string;
    confidence: number;
    analysis: any;
  }> {
    if (!this.tools) {
      throw new Error('MCP Sentry tools not initialized');
    }

    try {
      const analysis = await this.tools.analyze_issue_with_seer(issueId);
      
      // Extract structured data from Seer analysis
      return {
        rootCause: this.extractRootCause(analysis),
        suggestedFix: this.extractSuggestedFix(analysis),
        codeLocation: this.extractCodeLocation(analysis),
        confidence: this.extractConfidence(analysis),
        analysis: analysis, // Full analysis for reference
      };
    } catch (error) {
      throw new Error(`Failed to analyze issue with Seer: ${error.message}`);
    }
  }

  /**
   * Update issue status in Sentry
   */
  async updateIssueStatus(issueId: string, status: 'resolved' | 'ignored' | 'unresolved'): Promise<void> {
    if (!this.tools) {
      throw new Error('MCP Sentry tools not initialized');
    }

    try {
      await this.tools.update_issue(issueId, status);
    } catch (error) {
      throw new Error(`Failed to update issue status: ${error.message}`);
    }
  }

  /**
   * Get comprehensive error statistics
   */
  async getErrorStatistics(): Promise<{
    criticalErrors: number;
    highErrors: number;
    totalErrors: number;
    affectedUsers: number;
    recentTrend: 'increasing' | 'decreasing' | 'stable';
  }> {
    if (!this.tools) {
      throw new Error('MCP Sentry tools not initialized');
    }

    try {
      // Get error counts for different time periods
      const [
        criticalToday,
        highToday,
        criticalYesterday,
        totalErrors,
        affectedUsers
      ] = await Promise.all([
        this.tools.search_events('critical errors today'),
        this.tools.search_events('high priority errors today'), 
        this.tools.search_events('critical errors yesterday'),
        this.tools.search_events('total errors today'),
        this.tools.search_events('unique users with errors today'),
      ]);

      // Determine trend
      const todayCount = criticalToday.length;
      const yesterdayCount = criticalYesterday.length;
      let recentTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      
      if (todayCount > yesterdayCount * 1.1) recentTrend = 'increasing';
      else if (todayCount < yesterdayCount * 0.9) recentTrend = 'decreasing';

      return {
        criticalErrors: criticalToday.length,
        highErrors: highToday.length,
        totalErrors: totalErrors.length,
        affectedUsers: affectedUsers.length,
        recentTrend,
      };
    } catch (error) {
      throw new Error(`Failed to get error statistics: ${error.message}`);
    }
  }

  /**
   * Get issues that are good candidates for autonomous fixing
   */
  async getAutoFixCandidates(): Promise<any[]> {
    if (!this.tools) {
      throw new Error('MCP Sentry tools not initialized');
    }

    const queries = [
      'unresolved critical errors affecting 10+ users',
      'recurring errors from last 24 hours',
      'TypeError undefined property unresolved',
      'BMAD agent errors unresolved',
      'authentication errors unresolved',
      'database connection errors unresolved',
    ];

    try {
      const results = await Promise.all(
        queries.map(query => this.tools!.search_issues(query, 10))
      );

      // Flatten and deduplicate by issue ID
      const allIssues = results.flat();
      const uniqueIssues = allIssues.filter((issue, index, array) => 
        array.findIndex(i => i.id === issue.id) === index
      );

      return uniqueIssues;
    } catch (error) {
      throw new Error(`Failed to get auto-fix candidates: ${error.message}`);
    }
  }

  /**
   * Extract root cause from Seer analysis
   */
  private extractRootCause(analysis: any): string {
    // Parse Seer AI response to extract root cause
    if (analysis.rootCause) return analysis.rootCause;
    if (analysis.analysis && analysis.analysis.includes('Root cause:')) {
      const match = analysis.analysis.match(/Root cause:([^\\n]+)/);
      return match ? match[1].trim() : 'Unable to determine root cause';
    }
    return 'Root cause analysis not available';
  }

  /**
   * Extract suggested fix from Seer analysis
   */
  private extractSuggestedFix(analysis: any): string {
    if (analysis.suggestedFix) return analysis.suggestedFix;
    if (analysis.analysis && analysis.analysis.includes('Suggested fix:')) {
      const match = analysis.analysis.match(/Suggested fix:([^\\n]+)/);
      return match ? match[1].trim() : 'No specific fix suggested';
    }
    return 'Fix suggestions not available';
  }

  /**
   * Extract code location from Seer analysis
   */
  private extractCodeLocation(analysis: any): string {
    // Look for file paths in various formats
    const patterns = [
      /([\\w\\/\\-\\.]+\\.(?:ts|js|tsx|jsx|py|go|java))(?::(\\d+))?/,
      /File: ([^\\n]+)/,
      /Location: ([^\\n]+)/,
    ];

    const text = JSON.stringify(analysis);
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return 'Code location not specified';
  }

  /**
   * Extract confidence score from Seer analysis
   */
  private extractConfidence(analysis: any): number {
    if (analysis.confidence) return analysis.confidence;
    
    // Look for confidence indicators in the analysis text
    const text = JSON.stringify(analysis).toLowerCase();
    
    if (text.includes('high confidence') || text.includes('very likely')) return 0.9;
    if (text.includes('medium confidence') || text.includes('likely')) return 0.7;
    if (text.includes('low confidence') || text.includes('possible')) return 0.5;
    
    // Default confidence based on analysis completeness
    if (analysis.analysis && analysis.analysis.length > 100) return 0.8;
    
    return 0.6; // Default moderate confidence
  }
}

// Export singleton instance
export const sentryMcp = SentryMcpIntegration.getInstance();