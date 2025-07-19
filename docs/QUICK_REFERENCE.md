# ⚡ Quick Reference Guide

## 🚨 Need to Continue Development?

### 1. Read These Files First:
- `docs/PROJECT_ROADMAP.md` - Current status and next steps
- `docs/DEVELOPMENT_CONTEXT.md` - What's built and what to do next
- `docs/STORY_TRACKING.md` - Detailed story status and implementation

### 2. Current Status:
- ✅ **Epic 1-3 Complete**: AI Course Creation, Sales Portal, Authentication
- 🔄 **Epic 4 Ready**: Core Learning Features (4 stories planned)
- 📋 **Next Story**: 4.1 - Interactive AI Chat Interface

### 3. Quick Start Commands:
```bash
# Check current branch
git branch

# Install dependencies
npm install

# Start development
npm run dev

# Check environment
cat .env.local
```

### 4. Key Files to Know:
- `app/sales/page.tsx` - Main sales portal
- `components/sales/CourseGenerator.tsx` - AI course generation
- `components/sales/ClientRequestForm.tsx` - SOP upload
- `lib/api-client.ts` - API client and types

### 5. Next Development Steps:
1. Start Epic 4, Story 4.1 (Interactive AI Chat Interface)
2. Follow BMAD methodology
3. Update documentation as you go
4. Commit with conventional commits

---

## 🎯 BMAD Methodology Quick Reference

### 1. Document Analysis
- Understand current codebase
- Review existing documentation
- Identify integration points

### 2. Epic Creation
- Define high-level features
- Break into implementable stories
- Set priorities and dependencies

### 3. Story Implementation
- Follow acceptance criteria
- Implement systematically
- Test thoroughly
- Document progress

### 4. Validation
- Verify all acceptance criteria
- Check integration points
- Validate user experience
- Update documentation

---

## 📞 Need Help?

### Check These Resources:
- `docs/PRD.md` - Product requirements
- `docs/IMPLEMENTATION_SUMMARY.md` - Technical details
- `CONTRIBUTING.md` - Development guidelines
- `LOCAL_SETUP.md` - Environment setup

### Common Issues:
- **Environment Variables**: Check `.env.local` and `.env`
- **Dependencies**: Run `npm install` and `pip install -r requirements.txt`
- **Build Issues**: Check TypeScript errors with `npm run type-check`
- **AI Integration**: Verify OpenAI API key in environment

---

**This quick reference ensures you can always get back up to speed quickly!** ⚡ 