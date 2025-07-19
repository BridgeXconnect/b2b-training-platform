# Git Workflow Guide

## 🌟 Branch Strategy Overview

The B2B English Training Platform uses a **GitFlow-based branching strategy** optimized for continuous development and stable releases.

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Branch                        │
│  main ●────●────●────●────●────●────●────●────●────●────●  │
│         \    \    \         \    \    \                    │
│          \    \    \         \    \    \                   │
│           \    \    hotfix/   \    \    \                  │
│            \    \   critical   \    \    \                 │
│             \    \             \    \    \                │
└──────────────\────\─────────────\────\────\───────────────┘
               │    │             │    │    │
┌──────────────\────\─────────────\────\────\───────────────┐
│               \    \             \    \    \               │
│  develop ●────●────●────●────●────●────●────●────●────●   │
│            \    \    \    \    \    \    \               │
│             \    \    \    \    \    \    \              │
│              \    \    \    \    \    \    \             │
│               \    \    \    \    \    \    release/v2.0  │
│                \    \    \    \    \    \                 │
└─────────────────\────\────\────\────\────\────────────────┘
                  │    │    │    │    │    │
┌─────────────────\────\────\────\────\────\────────────────┐
│                  \    \    \    \    \    \               │
│  feature/auth ●───●────●    \    \    \    \              │
│                           \    \    \    \                │
│  feature/api ●─────────────●────●    \    \               │
│                                  \    \    \              │
│  feature/ui ●─────────────────────●────●    \             │
│                                           \    \          │
│  bugfix/validation ●───────────────────────●    \         │
│                                                \    \     │
│  feature/docs ●─────────────────────────────────●────●    │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## 🎯 Branch Types and Purposes

### **1. `main` - Production Branch**
- **Purpose**: Stable, production-ready code
- **Protection**: Requires PR reviews, all checks must pass
- **Deployment**: Auto-deploys to production
- **Direct commits**: ❌ Never

### **2. `develop` - Integration Branch**
- **Purpose**: Integration point for all feature development
- **Protection**: Requires status checks
- **Merges from**: Feature branches, release branches, hotfixes
- **Merges to**: Release branches
- **Direct commits**: ⚠️ Only for urgent integration fixes

### **3. Feature Branches**
- **Purpose**: New feature development
- **Naming**: `feature/[category]-[description]`
- **Base**: `develop`
- **Merge to**: `develop`
- **Lifespan**: Short-lived (days to weeks)

### **4. Bugfix Branches**
- **Purpose**: Non-critical bug fixes
- **Naming**: `bugfix/[description]`
- **Base**: `develop`
- **Merge to**: `develop`
- **Lifespan**: Short-lived (hours to days)

### **5. Hotfix Branches**
- **Purpose**: Critical production fixes
- **Naming**: `hotfix/[description]`
- **Base**: `main`
- **Merge to**: `main` AND `develop`
- **Lifespan**: Very short-lived (hours)

### **6. Release Branches**
- **Purpose**: Release preparation and final testing
- **Naming**: `release/v[major].[minor].[patch]`
- **Base**: `develop`
- **Merge to**: `main` AND `develop`
- **Lifespan**: Short-lived (days)

## 🚀 Common Workflows

### Starting a New Feature

```bash
# 1. Switch to develop and pull latest
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/course-generation-improvements

# 3. Make your changes
# ... code, test, commit ...

# 4. Push branch
git push -u origin feature/course-generation-improvements

# 5. Create PR to develop branch
# Use GitHub UI to create PR
```

### Bug Fix Workflow

```bash
# 1. From develop branch
git checkout develop
git pull origin develop

# 2. Create bugfix branch
git checkout -b bugfix/api-validation-error

# 3. Fix the bug
# ... code, test, commit ...

# 4. Push and create PR
git push -u origin bugfix/api-validation-error
```

### Critical Hotfix Workflow

```bash
# 1. From main branch (production)
git checkout main
git pull origin main

# 2. Create hotfix branch
git checkout -b hotfix/security-vulnerability

# 3. Fix the critical issue
# ... code, test, commit ...

# 4. Push branch
git push -u origin hotfix/security-vulnerability

# 5. Create TWO PRs:
#    - PR to main (for immediate production fix)
#    - PR to develop (to include fix in future releases)
```

### Release Workflow

```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Prepare release
# - Update version numbers
# - Generate changelog
# - Final testing
# - Bug fixes only (no new features)

# 3. Push release branch
git push -u origin release/v1.2.0

# 4. Create PRs to both main and develop
# 5. After merge, tag the release
git tag v1.2.0
git push origin v1.2.0
```

## 📝 Commit Message Standards

### Format
```
type(scope): brief description (max 50 chars)

Detailed explanation of the change (wrap at 72 chars)
- Can include bullet points
- Reference issues with #123
- Explain the why, not just the what

BREAKING CHANGE: describe any breaking changes
Closes #123, #456
```

### Types
- **feat**: New feature for users
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code formatting (no logic changes)
- **refactor**: Code restructuring (no functionality change)
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates
- **perf**: Performance improvements
- **ci**: Changes to CI/CD configuration

### Examples
```bash
# Good commit messages
feat(auth): implement JWT refresh token rotation

fix(api): resolve CORS headers for client requests
- Add missing Access-Control-Allow-Headers
- Include credentials in CORS configuration
- Update API documentation

Closes #234

docs(readme): add local development setup instructions

style(frontend): apply consistent button styling across components

refactor(backend): extract database connection logic into separate module

test(courses): add integration tests for course generation API

chore(deps): update dependencies to latest stable versions
- Update React to 18.2.0
- Update FastAPI to 0.104.0
- Fix security vulnerabilities in dependencies

perf(frontend): optimize bundle size with dynamic imports
- Implement route-based code splitting
- Lazy load non-critical components
- Reduce initial bundle size by 40%

BREAKING CHANGE: API response format changed for course endpoints
```

## 🔄 Pull Request Process

### Before Creating a PR

1. **Rebase on target branch**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout feature/your-feature
   git rebase develop
   ```

2. **Run all tests**:
   ```bash
   # Frontend
   npm run test
   npm run lint
   npm run type-check

   # Backend
   cd backend
   python -m pytest
   python -m black --check .
   python -m isort --check-only .
   ```

3. **Self-review your changes**:
   ```bash
   git diff develop...HEAD
   ```

### PR Requirements Checklist

- [ ] **Title follows conventional commit format**
- [ ] **Description explains what, why, and how**
- [ ] **All tests pass locally**
- [ ] **Code follows style guidelines**
- [ ] **Documentation updated (if needed)**
- [ ] **No merge conflicts with target branch**
- [ ] **Screenshots included (for UI changes)**
- [ ] **Breaking changes documented**

### Review Process

1. **Automated Checks**: All CI/CD checks must pass
2. **Code Review**: At least one approval required
3. **Final Review**: Code owner approval for significant changes
4. **Merge**: Use "Squash and merge" for feature branches

## 🏷️ Branching Naming Conventions

### Feature Branches
```
feature/auth-improvements
feature/course-generation-v2
feature/ui-dashboard-redesign
feature/api-endpoints-v3
feature/sop-document-processing
feature/cefr-validation-engine
```

### Bugfix Branches
```
bugfix/login-validation-error
bugfix/api-timeout-handling
bugfix/course-generation-crash
bugfix/ui-responsive-layout
```

### Hotfix Branches
```
hotfix/security-patch-2024-01
hotfix/critical-api-bug
hotfix/database-connection-issue
```

### Release Branches
```
release/v1.0.0
release/v1.2.0
release/v2.0.0-beta
release/v2.1.0-rc1
```

## 🛡️ Branch Protection Rules

### `main` Branch Protection
- ✅ Require pull request reviews (2 approvals)
- ✅ Dismiss stale reviews when new commits are pushed
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators in restrictions
- ✅ Allow force pushes: ❌
- ✅ Allow deletions: ❌

### `develop` Branch Protection
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Allow force pushes: ❌
- ✅ Allow deletions: ❌

### Required Status Checks
- ✅ Frontend tests (Jest)
- ✅ Frontend build (Next.js)
- ✅ Frontend linting (ESLint)
- ✅ Backend tests (pytest)
- ✅ Backend linting (Black, isort)
- ✅ Type checking (TypeScript, mypy)
- ✅ Security scanning
- ✅ Dependency vulnerability check

## 🚀 Advanced Git Commands

### Cleaning Up Feature Branches
```bash
# Delete merged feature branches
git branch --merged | grep -v "\*\|main\|develop" | xargs -n 1 git branch -d

# Delete remote tracking branches that no longer exist
git remote prune origin
```

### Interactive Rebase for Clean History
```bash
# Squash commits before creating PR
git rebase -i HEAD~3

# Example: squash last 3 commits into one
# Change 'pick' to 'squash' for commits to combine
```

### Cherry-picking Hotfixes
```bash
# Apply hotfix commit to develop branch
git checkout develop
git cherry-pick <hotfix-commit-hash>
```

### Handling Merge Conflicts
```bash
# During rebase conflicts
git status                    # See conflicted files
# Edit files to resolve conflicts
git add .                     # Stage resolved files
git rebase --continue         # Continue rebase

# Abort if needed
git rebase --abort
```

## 📊 Workflow Metrics

### Key Performance Indicators

**Development Velocity:**
- Average feature branch lifetime: < 5 days
- Average PR review time: < 24 hours
- Time from PR merge to production: < 2 hours

**Code Quality:**
- Test coverage: > 80%
- Successful builds: > 95%
- Hotfix frequency: < 1 per month

**Team Collaboration:**
- PR approval rate: > 90% on first review
- Code review participation: 100% of team
- Documentation coverage: > 90%

## 🔧 Troubleshooting

### Common Issues

**"Branch is X commits behind main"**
```bash
# Rebase your feature branch
git checkout feature/your-branch
git rebase main
git push --force-with-lease origin feature/your-branch
```

**"Merge conflicts in PR"**
```bash
# Resolve conflicts locally
git checkout feature/your-branch
git rebase develop
# Resolve conflicts in editor
git add .
git rebase --continue
git push --force-with-lease origin feature/your-branch
```

**"CI checks failing"**
```bash
# Run checks locally to debug
npm run test      # Frontend tests
npm run lint      # Frontend linting
cd backend
python -m pytest # Backend tests
```

### Getting Help

- **Git Issues**: Check [Git documentation](https://git-scm.com/docs)
- **GitHub Issues**: Review [GitHub guides](https://guides.github.com/)
- **Team Support**: Ask in team chat or create discussion issue

---

## 📚 Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitFlow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Semantic Versioning](https://semver.org/)
- [Git Best Practices](https://sethrobertson.github.io/GitBestPractices/)

---

*This workflow guide is a living document. Please suggest improvements through PRs or issues!*