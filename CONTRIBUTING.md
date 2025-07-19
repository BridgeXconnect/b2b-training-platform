# Contributing to B2B English Training Platform

Thank you for your interest in contributing to the B2B English Training Platform! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch Strategy](#branch-strategy)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## 🤝 Code of Conduct

Please be respectful and professional in all interactions. We're building a tool to help people learn and grow - let's embody those values in our development process.

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm/pnpm
- **Python** 3.12+ for backend development
- **Git** with SSH keys configured
- **PostgreSQL** (or access to Supabase)

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BridgeXconnect/b2b-training-platform.git
   cd b2b-training-platform
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up backend environment:**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Environment variables:**
   ```bash
   cp .env.example .env.local
   # Add your API keys and configuration
   ```

5. **Start development servers:**
   ```bash
   # Frontend (terminal 1)
   npm run dev

   # Backend (terminal 2)
   cd backend && python start.py
   ```

## 🔄 Development Workflow

### Branch Strategy

We use **GitFlow** with the following branches:

```
main           ← Production-ready code
├── develop    ← Integration branch for features
    ├── feature/auth-improvements
    ├── feature/api-endpoints
    └── feature/ui-enhancements
├── hotfix/critical-bug    ← Emergency fixes
└── release/v1.2.0         ← Release preparation
```

### Branch Naming Conventions

**Feature Branches:**
- `feature/[category]-[description]`
- Examples: `feature/auth-improvements`, `feature/course-generation`, `feature/ui-dashboard`

**Bug Fix Branches:**
- `bugfix/[description]`
- Examples: `bugfix/login-validation`, `bugfix/api-error-handling`

**Hotfix Branches:**
- `hotfix/[description]`
- Examples: `hotfix/security-patch`, `hotfix/critical-api-bug`

**Release Branches:**
- `release/v[version]`
- Examples: `release/v1.2.0`, `release/v2.0.0-beta`

### Feature Development Workflow

1. **Start from develop:**
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes:**
   - Write code following our standards
   - Add tests for new functionality
   - Update documentation if needed

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add user authentication flow

   - Implement JWT-based authentication
   - Add role-based access control
   - Update API endpoints with auth middleware
   
   Closes #123"
   ```

5. **Push and create PR:**
   ```bash
   git push -u origin feature/your-feature-name
   # Create PR through GitHub UI targeting 'develop'
   ```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): brief description

Optional longer description explaining the change

- Bullet points for multiple changes
- Reference issues with #123
- Breaking changes noted with BREAKING CHANGE:

Closes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): implement JWT authentication flow
fix(api): resolve CORS issue for client requests
docs(readme): update installation instructions
style(frontend): apply consistent button styling
refactor(backend): extract database connection logic
test(courses): add unit tests for course generation
chore(deps): update dependencies to latest versions
```

## 🎨 Coding Standards

### Frontend (TypeScript/React)

- **TypeScript**: Strict mode enabled, prefer interfaces over types
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **State**: Zustand for global state, React hooks for local state
- **Forms**: React Hook Form with Zod validation

**Code Style:**
```typescript
// Good: Descriptive naming, proper typing
interface ClientRequestFormData {
  companyName: string;
  industry: string;
  participantCount: number;
}

// Component structure
export function ClientRequestForm({ onSubmit }: ClientRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = useCallback(async (data: ClientRequestFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setIsLoading(false);
    }
  }, [onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form content */}
    </form>
  );
}
```

### Backend (Python/FastAPI)

- **Type Hints**: Use type hints for all function signatures
- **Async/Await**: Prefer async functions for I/O operations
- **Pydantic**: Use for request/response models and validation
- **Error Handling**: Proper exception handling with HTTP status codes

**Code Style:**
```python
# Good: Proper typing, async patterns, error handling
from typing import List, Optional
from fastapi import HTTPException, status
from pydantic import BaseModel

class ClientRequestCreate(BaseModel):
    company_name: str
    industry: str
    participant_count: int

@router.post("/requests", response_model=ClientRequestResponse)
async def create_client_request(
    request: ClientRequestCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ClientRequestResponse:
    """Create a new client training request."""
    try:
        # Implementation
        return ClientRequestResponse.from_orm(db_request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create client request"
        )
```

### Database

- **Migrations**: Use Alembic for database schema changes
- **Queries**: Prefer SQLAlchemy ORM with proper typing
- **Indexing**: Add indexes for frequently queried columns
- **Security**: Never expose sensitive data in logs or responses

## 🧪 Testing

### Frontend Testing
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Backend Testing
```bash
# Run unit tests
cd backend && python -m pytest

# Run with coverage
python -m pytest --cov=.

# Run specific test file
python -m pytest tests/test_auth.py
```

### Test Requirements
- **Unit Tests**: All new functions and components
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Critical user workflows
- **Coverage**: Maintain >80% code coverage

## 📥 Pull Request Process

### Before Creating a PR

1. **Self-review your code**
2. **Run all tests locally**
3. **Update documentation**
4. **Rebase on latest develop**

### PR Requirements

- [ ] **Title**: Clear, descriptive title following conventional commits
- [ ] **Description**: Explain what, why, and how
- [ ] **Tests**: Include tests for new functionality
- [ ] **Documentation**: Update relevant documentation
- [ ] **No merge conflicts** with target branch
- [ ] **All CI checks pass**

### Code Review Process

1. **Automated checks** must pass
2. **At least one approval** from code owner
3. **All conversations resolved**
4. **No requested changes** outstanding

### Review Criteria

**Code Quality:**
- Follows coding standards
- Proper error handling
- Performance considerations
- Security best practices

**Testing:**
- Adequate test coverage
- Tests pass consistently
- Edge cases covered

**Documentation:**
- Code is self-documenting
- Complex logic explained
- API changes documented

## 🐛 Issue Reporting

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Check documentation** for known solutions
3. **Try latest version** to see if already fixed

### Issue Templates

Use our issue templates for:
- **Bug Reports**: Include reproduction steps, environment details
- **Feature Requests**: Describe use case, acceptance criteria
- **Performance Issues**: Include profiling data, benchmarks

### Issue Labels

**Priority:**
- `critical`: System down, data loss, security issue
- `high`: Major feature broken, blocks development
- `medium`: Important but workaround exists
- `low`: Minor improvement, polish

**Type:**
- `bug`: Something isn't working
- `feature`: New functionality
- `enhancement`: Improvement to existing feature
- `documentation`: Documentation needs update

**Area:**
- `frontend`: React/TypeScript client
- `backend`: FastAPI server
- `api`: REST API endpoints
- `database`: PostgreSQL/Supabase
- `infrastructure`: DevOps, deployment

## 🎯 Feature Development Guidelines

### B2B Training Platform Specifics

**CEFR Compliance:**
- All language content must align with CEFR levels
- Include level validation in course generation
- Test with authentic language samples

**SOP Integration:**
- Support multiple document formats (PDF, DOC, TXT)
- Extract industry-specific terminology
- Maintain document security and privacy

**AI-Powered Features:**
- Use OpenAI API responsibly with rate limits
- Implement fallback for AI service outages
- Validate AI-generated content quality

### Performance Considerations

**Frontend:**
- Lazy load components and routes
- Optimize bundle size with code splitting
- Use React.memo for expensive renders
- Implement proper loading states

**Backend:**
- Use async/await for I/O operations
- Implement proper database indexing
- Add caching where appropriate
- Monitor API response times

## 🚀 Release Process

### Release Checklist

**Pre-release:**
- [ ] All features tested and documented
- [ ] Database migrations tested
- [ ] Security review completed
- [ ] Performance benchmarks met

**Release:**
- [ ] Create release branch from develop
- [ ] Update version numbers
- [ ] Generate changelog
- [ ] Tag release in Git
- [ ] Deploy to staging for final testing
- [ ] Deploy to production
- [ ] Monitor for issues

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, backwards compatible

## 📞 Getting Help

**Questions?**
- Check our [documentation](./docs/)
- Review existing [issues](https://github.com/BridgeXconnect/b2b-training-platform/issues)
- Ask in GitHub Discussions

**Found a security issue?**
- Do NOT create a public issue
- Email security@bridgexconnect.com
- Include detailed reproduction steps

---

Thank you for contributing to the B2B English Training Platform! Together, we're building tools that help people learn and grow. 🚀