# B2B English Training Platform

> AI-powered B2B English training course generation platform with SOP integration and CEFR alignment

[![CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io)

## 🚀 Live Demo

Click the CodeSandbox badge above to run this project instantly in your browser!

## ✨ Features

- **AI-Powered Course Generation** - Create CEFR-aligned English training courses
- **SOP Integration** - Upload and analyze Standard Operating Procedures
- **CopilotKit AI Assistant** - Intelligent chat interface for training expertise
- **B2B Sales Portal** - Complete workflow management for training requests
- **CEFR Compliance** - Validated alignment with Common European Framework

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **CopilotKit** - AI integration and chat interfaces
- **shadcn/ui** - Modern UI components
- **Tailwind CSS** - Utility-first styling
- **React Hook Form + Zod** - Form handling and validation

## 🏗️ Architecture

```
app/
├── layout.tsx              # CopilotKit provider integration
├── page.tsx                # Landing page
├── sales/
│   └── page.tsx           # Main sales portal with 5 tabs
└── api/
    └── copilotkit/
        └── route.ts       # AI API endpoint

components/
├── ui/                    # shadcn/ui base components
└── sales/
    ├── ClientRequestForm.tsx    # Enhanced with SOP upload
    ├── RequestsList.tsx         # Request management
    └── CourseGenerator.tsx      # AI course generation

lib/
├── api-client.ts          # Complete API client with B2B types
├── contexts/
│   └── AuthContext.tsx    # Authentication and RBAC
└── utils.ts               # Utility functions
```

## 🚀 Quick Start (CodeSandbox)

1. **Open in CodeSandbox** - Click the badge above
2. **Environment Setup** - Add your API keys in the Environment Variables section:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_COPILOT_CLOUD_API_KEY=your_copilot_cloud_api_key_here
   ```
3. **Start Development** - The project will automatically start
4. **Access Features**:
   - Sales Portal: Main interface with 5 tabs
   - SOP Upload: Upload and analyze company procedures
   - AI Assistant: Chat with training expertise
   - Course Generator: Create CEFR-aligned courses

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

## 📋 Environment Variables

Required for full functionality:

```env
# OpenAI Integration
OPENAI_API_KEY=your_openai_api_key_here

# CopilotKit Integration
NEXT_PUBLIC_COPILOT_CLOUD_API_KEY=your_copilot_cloud_api_key_here

# Application Configuration
NEXT_PUBLIC_APP_NAME=B2B English Training Platform
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 Key Features

### 1. Sales Portal
- **Overview Dashboard**: Metrics and quick actions
- **Client Request Form**: Comprehensive B2B client information capture
- **SOP Upload & Analysis**: AI-powered document processing
- **AI Assistant**: CopilotKit chat interface for training expertise
- **Course Generator**: CEFR-aligned course creation with SOP integration

### 2. SOP Processing Pipeline
- **File Upload**: Support for PDF, DOC, DOCX, TXT formats
- **AI Analysis**: Extract training requirements and terminology
- **Results Display**: Structured presentation of analysis findings
- **Integration**: Seamless connection to course generation

### 3. CEFR-Aligned Course Generation
- **Level Selection**: A1-C2 CEFR level targeting
- **Module Structure**: Systematic course organization
- **SOP Integration**: Company-specific terminology and procedures
- **Assessment Generation**: CEFR-appropriate evaluation tools
- **Validation Scoring**: AI-powered alignment verification

## 📚 Documentation

- [Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md) - Complete development overview
- [BMAD Methodology](./docs/architecture/) - Business-Managed AI Development approach
- [Product Requirements](./docs/prd/) - Detailed specifications
- [Development Tools](./DEVELOPMENT_TOOLS.md) - Sophisticated development team and orchestration tools

## 🧙 Development vs Production

**This repository contains**:
- ✅ **The AI Course Platform** - Production application code
- ✅ **BMAD Internal Agents** - App features for content generation, conversations, assessments
- ✅ **OpenAI Integration** - AI functionality for users

**Development tools are separate**:
- 🛠️ **46+ Development Agents** - Your Claude Code development team (see DEVELOPMENT_TOOLS.md)
- 🛠️ **Tmux Orchestration** - Multi-terminal development workflows
- 🛠️ **MCP Servers** - Enhanced development capabilities
- 🛠️ **Agent Orchestration** - Development workflow automation

The app itself is focused on providing excellent AI-powered English training for B2B users.

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

## 🚀 Deployment

### CodeSandbox
- Automatic deployment on every commit
- Environment variables configured in sandbox settings
- Live preview with instant updates

### Production
Ready for deployment to:
- Vercel
- Netlify
- AWS Amplify
- Docker containers

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) for detailed information about our development process.

### Quick Start for Contributors

1. **Fork and clone the repository**
2. **Create a feature branch from `develop`:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes and test thoroughly**
4. **Follow our commit message format:**
   ```bash
   git commit -m "feat: add new feature description"
   ```
5. **Push and create a Pull Request to `develop`**

### Git Workflow

We use a **GitFlow-based branching strategy**:

- **`main`** - Production-ready code
- **`develop`** - Integration branch for ongoing development  
- **`feature/*`** - New features and enhancements
- **`bugfix/*`** - Bug fixes
- **`hotfix/*`** - Critical production fixes

See our [Git Workflow Guide](./docs/development/git-workflow.md) for detailed branching strategies and best practices.

### Development Setup

**Frontend:**
```bash
npm install
npm run dev
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Configure your environment
python start.py
```

**Testing:**
```bash
# Frontend
npm run test
npm run lint

# Backend  
cd backend && python -m pytest
```

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **BMAD Methodology** - Systematic AI development approach
- **CopilotKit** - AI integration framework
- **shadcn/ui** - Beautiful UI components
- **Next.js Team** - Amazing React framework

---

**Ready to transform B2B English training with AI!** 🚀
