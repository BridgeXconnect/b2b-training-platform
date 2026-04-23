import axios, { AxiosInstance, AxiosError } from 'axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type UserRole = 'SALES' | 'COURSE_MANAGER' | 'TRAINER' | 'STUDENT' | 'ADMIN';
export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REQUIRES_REVIEW';
export type CourseStatus = 'GENERATED' | 'UNDER_REVIEW' | 'APPROVED' | 'REQUIRES_REVISION';
export type DeliveryMethod = 'IN_PERSON' | 'VIRTUAL' | 'HYBRID';
export type Frequency = 'DAILY' | 'WEEKLY' | 'BI_WEEKLY';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SOPDocument {
  id: string;
  requestId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  extractedText?: string;
  analysis?: SOPAnalysis | null;
  createdAt: string;
}

export interface SOPAnalysis {
  keyResponsibilities: string[];
  communicationNeeds: string[];
  industryTerminology: string[];
  skillsGaps: string[];
  trainingFocus: string[];
  recommendedCEFRLevel: string;
  rationale: string;
}

export interface ClientRequest {
  id: string;
  salesRepId: string;
  status: RequestStatus;
  companyName: string;
  companyIndustry: string;
  companySize: number;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contactPosition: string;
  participantCount: number;
  currentLevel: CEFRLevel;
  targetLevel: CEFRLevel;
  departments: string[];
  goals: string[];
  painPoints: string[];
  successCriteria: string[];
  totalHours: number;
  lessonsPerModule: number;
  deliveryMethod: DeliveryMethod;
  frequency: Frequency;
  lessonDuration: number;
  preferredTimes: string[];
  sopDocuments: SOPDocument[];
  courses: GeneratedCourse[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseActivity {
  type: string;
  title: string;
  description: string;
  sopIntegrated: boolean;
  estimatedMinutes: number;
}

export interface CourseLesson {
  title: string;
  duration: number;
  cefrFocus: string;
  skillsFocus: string[];
  activities: CourseActivity[];
}

export interface CourseModule {
  title: string;
  description: string;
  learningObjectives: string[];
  lessons: CourseLesson[];
  assessment: {
    title: string;
    type: string;
    description: string;
    passingScore: number;
  };
}

export interface GeneratedCourse {
  id: string;
  requestId: string;
  title: string;
  description: string;
  cefrLevel: CEFRLevel;
  totalHours: number;
  status: CourseStatus;
  modules: CourseModule[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalRequests: number;
  activeRequests: number;
  completedCourses: number;
  totalParticipants: number;
}

// ─── Client ──────────────────────────────────────────────────────────────────

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

  private constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 60000,
    });

    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (r) => r,
      (err: AxiosError) => {
        const isLoginRequest = (err.config?.url ?? '').includes('/api/auth/login');
        if (err.response?.status === 401 && !isLoginRequest) {
          this.clearToken();
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        const message = (err.response?.data as { message?: string })?.message ?? err.message;
        return Promise.reject(new Error(message));
      }
    );
  }

  static getInstance() {
    if (!ApiClient.instance) ApiClient.instance = new ApiClient();
    return ApiClient.instance;
  }

  getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  }
  setToken(token: string) {
    if (typeof window !== 'undefined') localStorage.setItem('token', token);
  }
  clearToken() {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
  }

  // Auth
  async register(data: { email: string; name: string; password: string }): Promise<{ user: User; token: string }> {
    const r = await this.client.post('/api/auth/register', data);
    return r.data;
  }
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const r = await this.client.post('/api/auth/login', credentials);
    return r.data;
  }
  async getCurrentUser(): Promise<User> {
    const r = await this.client.get('/api/auth/me');
    return r.data;
  }

  // Stats
  async getStats(): Promise<DashboardStats> {
    const r = await this.client.get('/api/clients/stats');
    return r.data;
  }

  // Client requests
  async createClientRequest(data: Omit<ClientRequest, 'id' | 'salesRepId' | 'status' | 'sopDocuments' | 'courses' | 'createdAt' | 'updatedAt'>): Promise<ClientRequest> {
    const r = await this.client.post('/api/clients/requests', data);
    return r.data;
  }
  async getClientRequests(): Promise<ClientRequest[]> {
    const r = await this.client.get('/api/clients/requests');
    return r.data;
  }
  async getClientRequest(id: string): Promise<ClientRequest> {
    const r = await this.client.get(`/api/clients/requests/${id}`);
    return r.data;
  }

  // SOP
  async uploadSOPDocument(file: File, requestId: string): Promise<SOPDocument> {
    const form = new FormData();
    form.append('file', file);
    const r = await this.client.post(`/api/clients/requests/${requestId}/sop`, form);
    return r.data;
  }
  async analyzeSOPs(requestId: string): Promise<SOPAnalysis> {
    const r = await this.client.post(`/api/clients/requests/${requestId}/analyze`);
    return r.data;
  }

  // Courses
  async generateCourse(requestId: string): Promise<GeneratedCourse> {
    const r = await this.client.post(`/api/courses/generate/${requestId}`);
    return r.data;
  }
  async getCourse(id: string): Promise<GeneratedCourse> {
    const r = await this.client.get(`/api/courses/${id}`);
    return r.data;
  }
}

export const apiClient = ApiClient.getInstance();
export default apiClient;
