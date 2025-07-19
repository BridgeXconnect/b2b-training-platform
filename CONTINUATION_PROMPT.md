# 🚀 Claude Code Continuation Prompt

## Copy and paste this entire prompt into your new Claude Code instance:

---

**You are continuing development on the B2B English Training Platform. Follow these instructions EXACTLY:**

## 🎯 CRITICAL CONTEXT

**Project**: B2B English Training Platform  
**Current Status**: Epic 1-3 Complete, Epic 4 Ready to Start  
**Methodology**: BMAD (Business-Managed AI Development) - Follow STRICTLY  
**Current Branch**: `feature/ai-course-creation-engine`  
**Next Story**: Epic 4, Story 4.1 - Interactive AI Chat Interface

## 📋 IMMEDIATE REQUIREMENTS

### 1. READ THESE DOCUMENTS FIRST (in this order):
- `docs/QUICK_REFERENCE.md` - Quick overview and commands
- `docs/PROJECT_ROADMAP.md` - Current status and next steps  
- `docs/DEVELOPMENT_CONTEXT.md` - What's built and what to build next
- `docs/STORY_TRACKING.md` - Detailed implementation plans
- `docs/IMPLEMENTATION_SUMMARY.md` - Technical details

### 2. VERIFY CURRENT STATE:
- Check git status and current branch
- Verify all documentation files exist in `docs/`
- Confirm project structure matches documentation

### 3. START WITH EPIC 4, STORY 4.1:
**Story**: Interactive AI Chat Interface  
**Priority**: High  
**Status**: Not Started  
**Dependencies**: Epic 1 (Complete)

## 🎯 BMAD METHODOLOGY - FOLLOW STRICTLY

### Phase 1: Document Analysis
1. **Read all documentation** in the order specified above
2. **Analyze current codebase** structure and implementation
3. **Identify integration points** with existing features
4. **Understand technical architecture** and patterns

### Phase 2: Story Breakdown
1. **Review Story 4.1 acceptance criteria** from `docs/STORY_TRACKING.md`
2. **Break down into implementable tasks**
3. **Identify files to create/modify**
4. **Plan testing approach**

### Phase 3: Implementation
1. **Follow TypeScript best practices**
2. **Use existing component patterns** from the codebase
3. **Implement error handling** consistently
4. **Add proper documentation**

### Phase 4: Validation
1. **Test all acceptance criteria**
2. **Verify integration** with existing features
3. **Check for regressions**
4. **Validate user experience**

## 🔧 CONTEXT7 MCP UTILIZATION

### Use Context7 MCP for:
1. **Library Documentation**: Look up React, Next.js, TypeScript, CopilotKit documentation
2. **Framework Examples**: Get code examples for specific features
3. **API References**: Find official documentation for libraries
4. **Best Practices**: Research current best practices for implementation

### Context7 Usage Pattern:
- Before implementing any feature, search for relevant documentation
- Use specific queries like "React chat interface best practices" or "CopilotKit real-time messaging"
- Verify implementation approaches against official documentation
- Cross-reference multiple sources for best practices

## 🚨 STRICT REQUIREMENTS

### NO HALLUCINATIONS:
- **ALWAYS** verify information against documentation
- **NEVER** make assumptions about codebase structure
- **ALWAYS** check existing files before creating new ones
- **USE Context7 MCP** to verify technical approaches

### FOLLOW EXISTING PATTERNS:
- Use the same file structure and naming conventions
- Follow existing component patterns from `components/sales/`
- Use the same styling approach (Tailwind CSS + shadcn/ui)
- Maintain consistent TypeScript patterns

### DOCUMENTATION UPDATES:
- Update `docs/STORY_TRACKING.md` as you progress
- Update `docs/PROJECT_ROADMAP.md` with completion status
- Add inline code comments for complex logic
- Update implementation summary when stories complete

## 🎯 STORY 4.1 IMPLEMENTATION PLAN

### Acceptance Criteria (from docs):
- [ ] Real-time AI chat interface for language practice
- [ ] CEFR-level appropriate responses
- [ ] Integration with existing CopilotKit setup
- [ ] Progress tracking integration
- [ ] Message history and persistence
- [ ] User-friendly chat UI with typing indicators

### Files to Create/Modify:
- `components/learning/AIChatInterface.tsx` (NEW)
- `components/learning/ChatMessage.tsx` (NEW)
- `app/sales/page.tsx` (ADD chat tab)
- `lib/contexts/ChatContext.tsx` (NEW)
- `app/api/chat/route.ts` (NEW)

### Implementation Steps:
1. **Day 1**: Create basic chat component structure
2. **Day 2**: Implement real-time messaging with CopilotKit
3. **Day 3**: Add CEFR-level filtering and progress integration
4. **Day 4**: Polish UI and add message persistence

## 🔍 VERIFICATION CHECKLIST

Before starting implementation:
- [ ] All documentation files read and understood
- [ ] Current codebase structure verified
- [ ] Context7 MCP tested and working
- [ ] Story 4.1 requirements fully understood
- [ ] Integration points identified
- [ ] BMAD methodology steps planned

## 📞 IF YOU NEED HELP

### Check These Resources:
- `docs/PRD.md` - Product requirements
- `docs/IMPLEMENTATION_SUMMARY.md` - Technical details
- `CONTRIBUTING.md` - Development guidelines
- `LOCAL_SETUP.md` - Environment setup

### Use Context7 MCP for:
- Technical documentation lookup
- Code examples and best practices
- Framework-specific guidance
- API reference verification

## 🚀 START HERE

1. **Read the documentation** in the specified order
2. **Verify current state** of the codebase
3. **Use Context7 MCP** to research implementation approaches
4. **Begin Story 4.1** following BMAD methodology
5. **Update documentation** as you progress

**Remember**: Follow BMAD methodology strictly, use Context7 MCP for factual information, and never hallucinate about the codebase structure or requirements.

---

**Copy this entire prompt and paste it into your new Claude Code instance to continue development exactly where you left off.** 