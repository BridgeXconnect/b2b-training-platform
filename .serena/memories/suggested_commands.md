# Suggested Development Commands

## Core Development Commands

### Development Server
```bash
# Start development server
npm run dev
# Start with type checking
npm run dev:type-safe
```

### Build and Validation
```bash
# Type checking only
npm run type-check
npm run type-check:watch

# Build project
npm run build

# Full validation pipeline
npm run validate
npm run validate:strict
npm run validate:ci
```

### Backend Development
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Configure environment
python start.py       # Start FastAPI server
```

### Testing and Quality
```bash
# AI safety check
npm run ai-safety-check

# Story Definition of Done validation
npm run story-dod

# Fix TypeScript issues
npm run fix-types
```

### Git Workflow
```bash
# Feature development
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Commit format
git commit -m "feat: description"
git commit -m "fix: description"
git commit -m "docs: description"
```

### System Testing
```bash
# Test AI integration
node test-ai-integration.js

# Test BMAD system
node test-bmad-system.js

# Test API connection
node test-api-connection.js
```

## Environment Setup
- Node.js version managed via `.nvmrc`
- Package manager: npm (with legacy peer deps support)
- Python backend: FastAPI with requirements.txt
- Environment files: `.env.local` for frontend, `.env` for backend