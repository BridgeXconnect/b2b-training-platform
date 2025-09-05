/**
 * Assessment Service - Frontend API integration for assessments
 * Connects AssessmentGenerator to backend assessment persistence
 */

import { API_BASE } from './progress-service';

export interface AssessmentSubmission {
  assessment_type: string;
  cefr_level: string;
  started_at: string;
  completed_at?: string;
  time_spent?: number;
  percentage?: number;
  skill_breakdown?: Record<string, any>;
}

export interface AssessmentRecord {
  id: string;
  user_id: string;
  assessment_type: string;
  cefr_level: string;
  started_at: string;
  completed_at?: string;
  time_spent?: number;
  percentage?: number;
  skill_breakdown?: Record<string, any>;
  created_at: string;
}

export interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  user_id: string;
  answers: Record<string, any>;
  score: number;
  time_spent: number;
  completed_at: string;
  feedback?: string;
}

export class AssessmentService {
  private static instance: AssessmentService;
  
  public static getInstance(): AssessmentService {
    if (!AssessmentService.instance) {
      AssessmentService.instance = new AssessmentService();
    }
    return AssessmentService.instance;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // In development, bypass auth
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
      return headers;
    }
    
    // Get auth token from localStorage or cookies
    const token = localStorage.getItem('auth-token') || 
                  document.cookie.replace(/(?:(?:^|.*;\s*)auth-token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Create a new assessment record when user starts an assessment
   */
  async startAssessment(assessmentData: Omit<AssessmentSubmission, 'started_at'>): Promise<AssessmentRecord> {
    const submission: AssessmentSubmission = {
      ...assessmentData,
      started_at: new Date().toISOString(),
    };

    const response = await fetch(`${API_BASE}/api/progress/assessments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(submission),
    });

    return this.handleResponse<AssessmentRecord>(response);
  }

  /**
   * Complete an assessment and record the results
   */
  async completeAssessment(
    assessmentId: string, 
    percentage: number, 
    timeSpent: number,
    skillBreakdown?: Record<string, any>
  ): Promise<AssessmentRecord> {
    const completion = {
      completed_at: new Date().toISOString(),
      percentage,
      time_spent: timeSpent,
      skill_breakdown: skillBreakdown,
    };

    const response = await fetch(`${API_BASE}/api/progress/assessments/${assessmentId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(completion),
    });

    return this.handleResponse<AssessmentRecord>(response);
  }

  /**
   * Get user's recent assessments
   */
  async getUserAssessments(limit: number = 10): Promise<AssessmentRecord[]> {
    const response = await fetch(`${API_BASE}/api/progress/assessments?limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<AssessmentRecord[]>(response);
  }

  /**
   * Record assessment attempt with answers and results
   */
  async recordAssessmentAttempt(attempt: {
    assessment_id: string;
    answers: Record<string, any>;
    score: number;
    time_spent: number;
    feedback?: string;
  }): Promise<AssessmentAttempt> {
    const submission = {
      ...attempt,
      completed_at: new Date().toISOString(),
    };

    const response = await fetch(`${API_BASE}/api/progress/assessment-attempts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(submission),
    });

    return this.handleResponse<AssessmentAttempt>(response);
  }

  /**
   * Get assessment analytics and insights
   */
  async getAssessmentAnalytics(timeframe: 'week' | 'month' | 'all' = 'month'): Promise<{
    totalAssessments: number;
    averageScore: number;
    bestScore: number;
    recentScore: number;
    skillPerformance: Record<string, number>;
    progressTrend: Array<{ date: string; score: number }>;
  }> {
    const response = await fetch(`${API_BASE}/api/progress/assessments/analytics?timeframe=${timeframe}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  /**
   * Get assessment recommendations based on performance
   */
  async getAssessmentRecommendations(): Promise<{
    recommendedLevel: string;
    focusAreas: string[];
    nextAssessmentType: string;
    reasoning: string;
  }> {
    const response = await fetch(`${API_BASE}/api/progress/assessments/recommendations`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  /**
   * Save assessment configuration for future use
   */
  async saveAssessmentTemplate(template: {
    name: string;
    description: string;
    configuration: Record<string, any>;
    isPublic?: boolean;
  }): Promise<{ id: string; name: string }> {
    const response = await fetch(`${API_BASE}/api/progress/assessment-templates`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(template),
    });

    return this.handleResponse<any>(response);
  }

  /**
   * Get user's saved assessment templates
   */
  async getAssessmentTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    configuration: Record<string, any>;
    created_at: string;
  }>> {
    const response = await fetch(`${API_BASE}/api/progress/assessment-templates`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }
}

// Export singleton instance
export const assessmentService = AssessmentService.getInstance();
export default assessmentService;