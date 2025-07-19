import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'sales' | 'course_manager' | 'trainer' | 'student' | 'admin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  topics: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// B2B English Training Platform Specific Types
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  position: string;
}

export interface ClientRequest {
  id?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'requires_review';
  companyDetails: {
    name: string;
    industry: string;
    size: number;
    primaryContact: ContactInfo;
  };
  trainingCohort: {
    participantCount: number;
    currentCEFRLevel: CEFRLevel;
    targetCEFRLevel: CEFRLevel;
    rolesAndDepartments: string[];
  };
  trainingObjectives: {
    specificGoals: string[];
    painPoints: string[];
    successCriteria: string[];
  };
  sopDocuments: SOPDocument[];
  coursePreferences: {
    totalLength: number; // in hours
    lessonsPerModule: number;
    deliveryMethod: 'in-person' | 'virtual' | 'hybrid';
    scheduling: {
      frequency: 'daily' | 'weekly' | 'bi-weekly';
      duration: number; // lesson duration in minutes
      preferredTimes: string[];
    };
  };
  salesRepId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SOPDocument {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  processed: boolean;
  extractedContent?: string;
  embeddings?: boolean;
}

export interface GeneratedCourse {
  id: string;
  clientRequestId: string;
  title: string;
  description: string;
  cefrLevel: CEFRLevel;
  totalDuration: number;
  modules: CourseModule[];
  status: 'generated' | 'under_review' | 'approved' | 'requires_revision';
  generatedBy: 'ai' | 'manual';
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  assessments: Assessment[];
  duration: number; // in minutes
  learningObjectives: string[];
  sopReferences: string[]; // References to SOP content used
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  activities: Activity[];
  duration: number;
  materials: string[];
  cefrFocus: CEFRLevel;
}

export interface Activity {
  id: string;
  type: 'reading' | 'listening' | 'speaking' | 'writing' | 'grammar' | 'vocabulary';
  title: string;
  instructions: string;
  content: string;
  sopIntegrated: boolean; // Uses company-specific terminology
  estimatedTime: number;
}

export interface Assessment {
  id: string;
  type: 'quiz' | 'assignment' | 'presentation' | 'practical';
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  cefrLevel: CEFRLevel;
  passingScore: number;
}

export interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string;
  sopContext?: string; // Company-specific context
}

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 errors (token expiration)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshAccessToken(refreshToken);
              this.setAuthTokens(response.access_token, response.refresh_token);
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearAuthTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    const defaultError: ApiError = {
      message: 'An unexpected error occurred',
      status: 500,
    };

    if (!error.response) {
      return {
        ...defaultError,
        message: 'Network error - please check your connection',
      };
    }

    const { status, data } = error.response;
    
    return {
      message: (data as any)?.message || defaultError.message,
      status,
      errors: (data as any)?.errors,
    };
  }

  // Token management
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  public setAuthTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  public clearAuthTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Authentication API calls
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  public async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearAuthTokens();
    }
  }

  public async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  }

  public async getCurrentUser(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/users/me');
    return response.data.data;
  }

  // Course API calls
  public async getCourses(): Promise<Course[]> {
    const response = await this.client.get<ApiResponse<Course[]>>('/courses');
    return response.data.data;
  }

  public async getCourse(id: string): Promise<Course> {
    const response = await this.client.get<ApiResponse<Course>>(`/courses/${id}`);
    return response.data.data;
  }

  public async createCourse(course: Partial<Course>): Promise<Course> {
    const response = await this.client.post<ApiResponse<Course>>('/courses', course);
    return response.data.data;
  }

  public async updateCourse(id: string, course: Partial<Course>): Promise<Course> {
    const response = await this.client.put<ApiResponse<Course>>(`/courses/${id}`, course);
    return response.data.data;
  }

  public async deleteCourse(id: string): Promise<void> {
    await this.client.delete(`/courses/${id}`);
  }

  // B2B English Training Platform API methods

  // Client Request Management
  public async createClientRequest(request: Omit<ClientRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClientRequest> {
    const response = await this.client.post<ApiResponse<ClientRequest>>('/client-requests', request);
    return response.data.data;
  }

  public async getClientRequests(): Promise<ClientRequest[]> {
    const response = await this.client.get<ApiResponse<ClientRequest[]>>('/client-requests');
    return response.data.data;
  }

  public async getClientRequest(id: string): Promise<ClientRequest> {
    const response = await this.client.get<ApiResponse<ClientRequest>>(`/client-requests/${id}`);
    return response.data.data;
  }

  public async updateClientRequest(id: string, request: Partial<ClientRequest>): Promise<ClientRequest> {
    const response = await this.client.put<ApiResponse<ClientRequest>>(`/client-requests/${id}`, request);
    return response.data.data;
  }

  // SOP Document Management
  public async uploadSOPDocument(file: File, clientRequestId: string): Promise<SOPDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientRequestId', clientRequestId);

    const response = await this.client.post<ApiResponse<SOPDocument>>('/sop-documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  public async getSOPDocuments(clientRequestId: string): Promise<SOPDocument[]> {
    const response = await this.client.get<ApiResponse<SOPDocument[]>>(`/sop-documents?clientRequestId=${clientRequestId}`);
    return response.data.data;
  }

  public async deleteSOPDocument(id: string): Promise<void> {
    await this.client.delete(`/sop-documents/${id}`);
  }

  // Course Generation
  public async generateCourseFromSOP(params: {
    clientRequestId: string;
    sopDocumentIds: string[];
    cefrLevel: CEFRLevel;
    courseLength: number;
  }): Promise<GeneratedCourse> {
    const response = await this.client.post<ApiResponse<GeneratedCourse>>('/courses/generate', params);
    return response.data.data;
  }

  public async getGeneratedCourses(): Promise<GeneratedCourse[]> {
    const response = await this.client.get<ApiResponse<GeneratedCourse[]>>('/courses/generated');
    return response.data.data;
  }

  public async getGeneratedCourse(id: string): Promise<GeneratedCourse> {
    const response = await this.client.get<ApiResponse<GeneratedCourse>>(`/courses/generated/${id}`);
    return response.data.data;
  }

  public async reviewCourse(id: string, status: GeneratedCourse['status'], reviewNotes?: string): Promise<GeneratedCourse> {
    const response = await this.client.put<ApiResponse<GeneratedCourse>>(`/courses/generated/${id}/review`, {
      status,
      reviewNotes,
    });
    return response.data.data;
  }

  // CEFR Level Validation
  public async validateCEFRContent(content: string, targetLevel: CEFRLevel): Promise<{ isValid: boolean; score: number; suggestions: string[] }> {
    const response = await this.client.post<ApiResponse<{ isValid: boolean; score: number; suggestions: string[] }>>('/cefr/validate', {
      content,
      targetLevel,
    });
    return response.data.data;
  }

  // Health check
  public async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Export default for convenience
export default apiClient;