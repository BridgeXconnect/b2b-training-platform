# Product Requirements Document — B2B English Training Platform
## MVP Release

**Version:** 1.0  
**Date:** 2026-04-25  
**Status:** Draft  
**Branch:** `claude/audit-and-plan-mvp-1Jkto`

---

## 1. Problem Statement

Corporate teams operating across languages face a consistent gap: generic "business English" courses don't reflect their actual workflows, terminology, or communication gaps. Training vendors spend weeks manually scoping programs that still miss the mark.

B2B English Training Platform solves this by letting a sales rep upload a company's Standard Operating Procedures (SOPs), have Claude AI extract the real communication gaps, and generate a complete CEFR-aligned English course — specific to that company's industry and team — in minutes.

---

## 2. Goals

| Goal | Metric |
|---|---|
| Sales rep can produce a demo-ready course in < 10 minutes | Time-to-course < 10 min end-to-end |
| Course Manager can review and approve a course without leaving the platform | 0 external tools needed for review |
| Trainer has all cohort context and can annotate lessons | Notes persist across sessions |
| Student can complete a lesson and see their progress | Progress % updates on completion |
| Admin can onboard any role without DB access | All role creation via UI |

---

## 3. Users & Roles

### 3.1 SALES
Sales representatives who prospect and onboard new B2B training clients.

**Needs:**
- Capture full client requirements in a structured intake form
- Upload client SOPs (PDF, DOCX, TXT)
- Trigger AI analysis of SOPs to surface skill gaps and terminology
- Generate a CEFR-aligned course from the analysis
- Track request status through the approval pipeline
- See when their course has been approved or needs revision

### 3.2 COURSE_MANAGER
Training program managers responsible for quality assurance of AI-generated courses.

**Needs:**
- View all client requests and generated courses across all sales reps
- Review full course structure (modules, lessons, activities, assessments)
- Approve a course (moves it to delivery pipeline)
- Request revision with a written note (sends course back for AI re-generation)
- Assign a trainer to an approved course
- See dashboard stats across all programs

### 3.3 TRAINER
English trainers who deliver approved courses to student cohorts.

**Needs:**
- View all courses assigned to them (status: APPROVED)
- See full cohort info: company, participants, CEFR levels, schedule, delivery method
- Navigate full course structure: modules → lessons → activities
- Add delivery notes per lesson (preparation notes, timing adjustments)
- View student progress count per course

### 3.4 STUDENT
Corporate employees enrolled in a training program.

**Needs:**
- View their enrolled course(s) with progress bars
- Navigate lessons sequentially (locked until previous lesson is complete)
- View all activities per lesson (reading, speaking, writing, vocabulary, grammar, listening)
- Mark a lesson as complete
- Submit module-end self-assessments (pass/needs practice)
- See overall course progress percentage

### 3.5 ADMIN
Platform administrators responsible for user management and system oversight.

**Needs:**
- View all users, search by name/email, filter by role
- Change any user's role
- Create new users with any role (bypasses self-registration SALES-only default)
- Enroll students in approved courses
- View system-wide stats (users by role, requests, courses, enrollments)

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization

| ID | Requirement | Priority |
|---|---|---|
| AUTH-01 | Users can register via email + password. Self-registration always creates SALES role. | P0 |
| AUTH-02 | Users can log in and receive a JWT stored securely. | P0 |
| AUTH-03 | After login, users are redirected to their role-appropriate portal. | P0 |
| AUTH-04 | Each portal page is guarded by RoleGuard — unauthorized roles are redirected to login. | P0 |
| AUTH-05 | Admin can create users with any role via the admin panel. | P0 |
| AUTH-06 | Admin can change any existing user's role. | P0 |
| AUTH-07 | A seed script creates one default ADMIN user (`admin@platform.com`) for first-run setup. | P0 |

### 4.2 Sales Portal (`/sales`)

| ID | Requirement | Priority |
|---|---|---|
| SALES-01 | Overview tab shows: active requests, total requests, courses generated, total participants. | P0 |
| SALES-02 | New Client Request form captures: company details, contact info, cohort size, CEFR levels, departments, goals, pain points, success criteria, schedule preferences. | P0 |
| SALES-03 | Submitted requests appear in Manage Requests tab with status badge. | P0 |
| SALES-04 | Sales rep can upload 1–n SOP documents (PDF, DOCX, TXT, max 10MB each) to a request. | P0 |
| SALES-05 | Sales rep can trigger AI SOP analysis. Results show: key responsibilities, communication needs, industry terminology, skill gaps, training focus, recommended CEFR level. | P0 |
| SALES-06 | Sales rep can trigger course generation. A full course (title, description, modules, lessons, activities, assessments) is generated and displayed. | P0 |
| SALES-07 | Course status is visible on each request: GENERATED, UNDER_REVIEW, APPROVED, REQUIRES_REVISION. | P0 |
| SALES-08 | When a course has REQUIRES_REVISION status, the revision note from the Course Manager is visible. | P0 |
| SALES-09 | Sales rep can delete an uploaded SOP document. | P1 |
| SALES-10 | All API errors surface as toast notifications — no silent console.error failures. | P0 |

### 4.3 Course Manager Portal (`/course-manager`)

| ID | Requirement | Priority |
|---|---|---|
| CM-01 | Overview tab shows stats across all requests and courses. | P0 |
| CM-02 | All Requests tab lists every client request with company name, status, date, and course count. | P0 |
| CM-03 | Courses for Review tab lists courses with status GENERATED or REQUIRES_REVISION. | P0 |
| CM-04 | Course Manager can open any course and view full structure: modules, lessons, activities, assessments. | P0 |
| CM-05 | Course Manager can approve a course. Status → APPROVED; parent request status → COMPLETED. | P0 |
| CM-06 | Course Manager can request revision. Requires a written revision note. Status → REQUIRES_REVISION. | P0 |
| CM-07 | Course Manager can assign a trainer (from a list of TRAINER-role users) to an approved course. | P1 |

### 4.4 Trainer Portal (`/trainer`)

| ID | Requirement | Priority |
|---|---|---|
| TR-01 | Trainer sees all APPROVED courses. For MVP, all trainers see all approved courses (assignment is optional). | P0 |
| TR-02 | Trainer can view full course structure in a read-optimized layout. | P0 |
| TR-03 | Trainer can see cohort info card: company, participant count, CEFR from/to, delivery method, frequency, duration, preferred times. | P0 |
| TR-04 | Trainer can add a per-lesson delivery note. Note persists to database and shows on next visit. | P1 |
| TR-05 | Trainer can see enrolled student count and lessons-completed count per course. | P1 |

### 4.5 Student Portal (`/student`)

| ID | Requirement | Priority |
|---|---|---|
| ST-01 | Student sees all courses they are enrolled in, each showing a progress bar (% lessons complete). | P0 |
| ST-02 | Student can open a course and see all modules and lessons. Completed lessons show a checkmark. Future lessons are locked until prior lesson is complete. | P0 |
| ST-03 | Student can open a lesson and view all activities, each rendered by type (reading, speaking, writing, vocabulary, grammar, listening) with estimated minutes. | P0 |
| ST-04 | Student can mark a lesson as complete. Progress updates immediately. The next lesson unlocks. | P0 |
| ST-05 | At the end of each module, student sees the module assessment (title, description, passing score). Student submits self-assessed result: Pass or Needs Practice. | P0 |
| ST-06 | Student cannot access lessons beyond their current unlocked position. | P0 |

### 4.6 Admin Panel (`/admin`)

| ID | Requirement | Priority |
|---|---|---|
| ADMIN-01 | Users tab lists all users with name, email, role, created date. | P0 |
| ADMIN-02 | Admin can search users by name or email. | P1 |
| ADMIN-03 | Admin can change any user's role via an inline dropdown. | P0 |
| ADMIN-04 | Admin cannot demote the last remaining ADMIN user. | P0 |
| ADMIN-05 | Admin can create a new user with any role (name, email, password, role). | P0 |
| ADMIN-06 | Admin can enroll a student in an approved course. | P0 |
| ADMIN-07 | Stats tab shows: users by role, total requests, courses by status, total enrollments. | P1 |

### 4.7 AI Course Generation

| ID | Requirement | Priority |
|---|---|---|
| AI-01 | SOP text is capped at 15,000 characters before being sent to Claude (prevents token overflow). | P0 |
| AI-02 | Claude analyzes SOPs and returns structured JSON: responsibilities, communication needs, terminology, skill gaps, training focus, recommended CEFR level, rationale. | P0 |
| AI-03 | Claude generates a complete course: title, description, N modules each with M lessons each with K activities and an end-of-module assessment. | P0 |
| AI-04 | AI responses are validated with Zod schemas before being stored. | P0 |
| AI-05 | If JSON parsing of an AI response fails, the system retries once before returning a 500 error. | P1 |
| AI-06 | Prompt caching is applied to stable system prompt blocks to reduce API costs. | P1 |
| AI-07 | Re-analysis only processes SOP documents that have not yet been analyzed (filter `analysis: null`). | P0 |
| AI-08 | Course generation merges all available SOP analyses (not just the last one). | P0 |

### 4.8 System & Infrastructure

| ID | Requirement | Priority |
|---|---|---|
| SYS-01 | All API errors surface to users via toast notifications — no silent failures. | P0 |
| SYS-02 | Empty states are shown for all list views when no data exists. | P1 |
| SYS-03 | Skeleton loaders are shown during data fetches. | P1 |
| SYS-04 | React Error Boundaries prevent full-page crashes — show recoverable error card. | P1 |
| SYS-05 | API proxy destination is configured via `NEXT_PUBLIC_API_URL` env var, not hardcoded. | P0 |
| SYS-06 | All list endpoints support pagination (`?page=&limit=`). | P1 |
| SYS-07 | File upload accepts PDF, DOCX, TXT only (validated server-side by magic bytes + MIME type). | P0 |
| SYS-08 | File upload is limited to 10MB per file, validated by multer. | P0 |
| SYS-09 | Auth endpoints are rate-limited (max 5 attempts per 15 minutes per IP). | P1 |
| SYS-10 | A health check endpoint `GET /health` returns `{ status: "ok" }`. | P0 (exists) |
| SYS-11 | Prisma migrations are version-controlled and deployed via `prisma migrate deploy`. | P0 |

---

## 5. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Course generation response time | < 60 seconds (p95) |
| SOP analysis response time | < 30 seconds (p95) |
| API availability | 99% uptime (MVP) |
| Max file upload size | 10MB per file |
| Max SOP text sent to Claude | 15,000 characters |
| Browser support | Chrome/Edge/Firefox latest 2 versions, desktop only |
| Session duration | JWT valid for 7 days |

---

## 6. Out of Scope for MVP

The following features are explicitly **not** part of this MVP release:

- Email notifications (status change alerts)
- Course export to PDF or SCORM
- Payment / billing / subscription management
- CopilotKit AI chat assistant
- Real multiple-choice quiz engine (self-assessed pass/fail is sufficient)
- Mobile responsiveness (desktop-first)
- Multi-language UI
- SSO / OAuth login
- Bulk enrollment of students
- Video or audio lesson content
- External LMS integrations (Moodle, Canvas, etc.)
- Analytics beyond basic counts

---

## 7. Data Models (MVP)

```
User
  id, email, password(hashed), name, role(SALES|COURSE_MANAGER|TRAINER|STUDENT|ADMIN)

ClientRequest
  id, salesRepId → User, status(PENDING|IN_PROGRESS|COMPLETED|REQUIRES_REVIEW)
  companyName, companyIndustry, companySize
  contactName, contactEmail, contactPhone?, contactPosition
  participantCount, currentLevel(CEFR), targetLevel(CEFR), departments[]
  goals[], painPoints[], successCriteria[]
  totalHours, lessonsPerModule, deliveryMethod, frequency, lessonDuration, preferredTimes[]

SOPDocument
  id, requestId → ClientRequest, filename, fileSize, mimeType
  extractedText(Text)?, analysis(Json)?

GeneratedCourse
  id, requestId → ClientRequest, title, description(Text)
  cefrLevel(CEFR), totalHours, status(GENERATED|UNDER_REVIEW|APPROVED|REQUIRES_REVISION)
  modules(Json), revisionNote(Text)?, trainerId → User?

TrainerNote  [Phase 2]
  id, courseId → GeneratedCourse, trainerId → User
  moduleIndex(Int), lessonIndex(Int), note(Text)
  @@unique([courseId, moduleIndex, lessonIndex])

CourseEnrollment  [Phase 3]
  id, courseId → GeneratedCourse, studentId → User
  enrolledAt, status(ACTIVE|COMPLETED)

LessonProgress  [Phase 3]
  id, enrollmentId → CourseEnrollment, moduleIndex, lessonIndex, completedAt

AssessmentResult  [Phase 3]
  id, enrollmentId → CourseEnrollment, moduleIndex, passed(Boolean), score(Int)?, submittedAt

Notification  [Phase 5]
  id, userId → User, message, read(Boolean), createdAt
```

---

## 8. User Flows

### 8.1 Primary Flow: Sales → Course Generation
```
Sales logs in
  → redirected to /sales
  → clicks "New Client Request"
  → fills intake form (company, contact, cohort, goals, schedule)
  → submits → request created (status: PENDING)
  → opens request in Manage Requests
  → uploads SOP files
  → clicks "Analyse with AI"
    → Claude extracts gaps → analysis displayed in UI
  → clicks "Generate Course"
    → Claude generates full course → course displayed
    → request status → IN_PROGRESS, course status → GENERATED
```

### 8.2 Approval Flow: Course Manager → Approve
```
Course Manager logs in
  → redirected to /course-manager
  → opens "Courses for Review" tab
  → clicks into a GENERATED course
  → reviews modules, lessons, activities
  → clicks "Approve"
    → course status → APPROVED
    → request status → COMPLETED
  OR clicks "Request Revision"
    → enters revision note → submits
    → course status → REQUIRES_REVISION
    → Sales rep sees revision note on their request
```

### 8.3 Delivery Flow: Trainer → Notes
```
Trainer logs in
  → redirected to /trainer
  → sees list of APPROVED courses
  → opens a course
  → views cohort info card
  → browses modules and lessons
  → adds delivery notes per lesson → saved to DB
```

### 8.4 Learning Flow: Student → Progress
```
Student logs in
  → redirected to /student
  → sees enrolled course(s) with progress bars
  → opens course → sees module/lesson list
  → opens first lesson → views activities
  → clicks "Mark Complete"
    → LessonProgress record created
    → next lesson unlocks
    → progress % updates
  → completes all lessons in module
  → sees module assessment
  → clicks "I Passed" or "I Need More Practice"
    → AssessmentResult saved
```

---

## 9. API Endpoints (MVP)

### Auth (`/api/auth`)
| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/register` | Public | Create SALES user |
| POST | `/login` | Public | Get JWT |
| GET | `/me` | Any auth | Get current user |
| GET | `/users?role=` | CM, ADMIN | List users by role |

### Clients (`/api/clients`)
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/stats` | SALES, CM, ADMIN | Dashboard stats |
| POST | `/requests` | SALES | Create client request |
| GET | `/requests` | SALES, CM, ADMIN | List requests (paginated) |
| GET | `/requests/:id` | SALES, CM, ADMIN | Get request detail |
| POST | `/requests/:id/sop` | SALES | Upload SOP document |
| DELETE | `/requests/:id/sop/:docId` | SALES | Delete SOP document |
| POST | `/requests/:id/analyze` | SALES | Trigger AI SOP analysis |

### Courses (`/api/courses`)
| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/generate/:requestId` | SALES | Generate course with Claude |
| GET | `/` | CM, ADMIN | List all courses (paginated) |
| GET | `/trainer` | TRAINER | List APPROVED courses |
| GET | `/request/:requestId` | SALES, CM, ADMIN | Courses for a request |
| GET | `/:id` | SALES, CM, TRAINER, ADMIN | Get course detail |
| PATCH | `/:id/status` | CM, ADMIN | Update course status + revision note |
| PATCH | `/:id/assign-trainer` | CM, ADMIN | Assign trainer to course |
| POST | `/:id/notes` | TRAINER | Add/update trainer note |
| GET | `/:id/notes` | TRAINER, CM | Get trainer notes |

### Enrollments (`/api/enrollments`)
| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/` | ADMIN, CM | Enroll student in course |
| GET | `/my` | STUDENT | Get my enrollments |
| POST | `/:id/progress` | STUDENT | Mark lesson complete |
| POST | `/:id/assessment` | STUDENT | Submit assessment result |
| GET | `/course/:courseId` | TRAINER, CM, ADMIN | All enrollments for a course |

### Admin (`/api/admin`)
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/users` | ADMIN | List all users (paginated, searchable) |
| POST | `/users` | ADMIN | Create user with any role |
| PATCH | `/users/:id/role` | ADMIN | Change user role |
| GET | `/stats` | ADMIN | System-wide stats |

---

## 10. Implementation Phases

| Phase | Scope | Effort |
|---|---|---|
| **Phase 0** | Foundation fixes: bugs, toast errors, admin seed, status endpoint, env vars | 1–2 days |
| **Phase 1** | Course Manager portal: review, approve, request revision | 3–5 days |
| **Phase 2** | Trainer portal: course view, cohort card, lesson notes | 3–5 days |
| **Phase 3** | Student portal: enrollment, lesson nav, progress, assessments | 5–7 days |
| **Phase 4** | Admin panel: user management, role assignment, enrollment, pagination | 3–5 days |
| **Phase 5** | Prompt caching, course print export, notification badges | 3–5 days |

**Total MVP estimated effort: 18–29 days**

---

## 11. Acceptance Criteria (MVP Demo-Ready)

The MVP is complete when a live demo can demonstrate this uninterrupted flow:

1. Admin logs in (seeded credentials) → creates users of all 5 roles
2. Sales logs in → creates client request → uploads SOP → AI analyzes → AI generates course (no errors, all feedback in UI)
3. Course Manager logs in → reviews course → approves → status updates visible
4. Trainer logs in → sees approved course → adds lesson note → note persists on refresh
5. Admin enrolls student in course
6. Student logs in → sees enrolled course → completes lesson → progress updates → submits assessment
7. Trainer sees updated student progress count

**Non-negotiable:** Zero white screens, zero silent failures, all 5 roles have a functional portal, real Claude AI (not mock data).
