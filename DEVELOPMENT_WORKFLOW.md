# 🔄 AUTONOMOUS GITHUB WORKFLOW

## **Branch Strategy & Safety Protocol**

### **Current Branch Structure:**
```
main                           ← Protected production branch
feature/ai-course-creation-engine  ← Stable configuration base
feature/bmad-development      ← Active development branch (current)
```

### **🤖 Autonomous GitHub Workflow Rules**

#### **1. COMMIT EARLY, COMMIT OFTEN**
- **Before** making any significant changes
- **After** completing each logical unit of work
- **Before** trying experimental approaches
- **When** reaching stable milestones

#### **2. BRANCH PROTECTION PATTERN**
```bash
# Create feature branches from stable base
git checkout -b feature/[story-name] feature/ai-course-creation-engine

# Work incrementally with safety commits
git add . && git commit -m "checkpoint: [what works]"
git push origin feature/[story-name]

# Never work directly on main or stable branches
```

#### **3. SAFETY CHECKPOINT PROTOCOL**
- ✅ **Green State**: Working functionality → Immediate commit & push
- ⚠️ **Yellow State**: Experimental changes → Commit with "experiment:" prefix  
- ❌ **Red State**: Broken functionality → Immediate revert to last green commit

#### **4. COMMIT MESSAGE PATTERNS**
```
feat: [new functionality]
fix: [bug fixes]
checkpoint: [working state preservation]
experiment: [trying new approach]
revert: [back to working state]
docs: [documentation updates]
config: [configuration changes]
```

#### **5. AUTOMATED WORKFLOW TRIGGERS**

**Before Major Changes:**
1. Commit current working state
2. Push to remote
3. Create checkpoint branch if needed
4. Proceed with changes

**After Changes:**
1. Test functionality
2. If working → Commit & push
3. If broken → Revert & analyze
4. Document what worked/failed

#### **6. REVERT STRATEGY**
```bash
# Quick revert to last working state
git reset --hard HEAD~1

# Revert to specific working commit
git reset --hard [commit-hash]

# Create new branch from last stable point
git checkout -b feature/[name] [stable-commit]
```

### **🎯 Current Development Focus: BMAD Stories**

**Active Branch**: `feature/bmad-development`
**Base Stability**: `feature/ai-course-creation-engine` (commit: e88d315)
**Next Stories**: Continue from Story 4.2 onwards

### **📊 Workflow Metrics**
- **Commit Frequency**: Every 15-30 minutes during active development
- **Push Frequency**: Every 1-2 commits or at logical breakpoints
- **Branch Lifetime**: 1-3 days max before merge/archive
- **Revert Rate**: <10% (target for stable development)

### **🚨 Emergency Protocols**
1. **Broken Frontend**: Immediate revert to last working commit
2. **Dependency Issues**: Revert to stable config, document problem
3. **Circular Debugging**: Create new branch from last stable point
4. **Time Investment >1hr**: Commit current state, reassess approach

---

**This workflow ensures we save what works before we break it and prevents circular debugging loops.**