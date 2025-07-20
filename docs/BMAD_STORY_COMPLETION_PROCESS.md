# 🧙 BMad Story Completion Process

## 🚨 **CRITICAL: No Story is Complete Without This Process**

This document establishes the **mandatory validation process** for all story completions to prevent "hallucination completions" where work is declared done without proper validation.

## 📋 **Mandatory Validation Sequence**

### **Phase 1: Technical Validation (AUTOMATED)**
```bash
# MUST PASS before proceeding to Phase 2
npm run story-dod
```

This command runs:
- ✅ **TypeScript Compilation**: `tsc --noEmit` - Zero errors allowed
- ✅ **ESLint Validation**: `next lint --max-warnings 0` - Zero warnings allowed  
- ✅ **Build Test**: `npm run build` - Must build successfully

**IF ANY FAIL**: Story status = ❌ **IN PROGRESS** (not complete)

### **Phase 2: BMad DoD Checklist (MANUAL)**
Execute the complete **Story Definition of Done Checklist**:

#### 1. Requirements Met
- [ ] All functional requirements implemented
- [ ] All acceptance criteria satisfied

#### 2. Code Quality
- [ ] No linter errors/warnings introduced
- [ ] Code follows project standards
- [ ] Proper error handling implemented
- [ ] Security best practices followed

#### 3. Testing
- [ ] Manual verification completed
- [ ] Edge cases handled
- [ ] Error conditions tested

#### 4. Build & Dependencies
- [ ] Project builds successfully
- [ ] No compilation errors
- [ ] Dependencies properly managed

### **Phase 3: User Business Validation (REQUIRED FOR UI/UX STORIES)**
- [ ] **User tests core workflow** - Primary use case works end-to-end
- [ ] **Business logic verified** - Generates expected results
- [ ] **Error scenarios tested** - Provides useful feedback
- [ ] **Performance acceptable** - No noticeable slowdowns

## 🎯 **Story Status Definitions**

| Status | Criteria |
|--------|----------|
| ❌ **In Progress** | Phase 1 (Technical) fails OR significant Phase 2 items incomplete |
| ⚠️ **Needs Review** | Phase 1 passes, Phase 2 complete, Phase 3 pending |
| ✅ **Complete** | All three phases confirmed complete |

## 🚫 **Never Again: Hallucination Prevention**

**FORBIDDEN PATTERNS:**
- ❌ Declaring stories "complete" without running `npm run story-dod`
- ❌ Ignoring TypeScript errors as "minor issues"
- ❌ Marking complete without user testing business logic
- ❌ Assuming code works without manual verification

**REQUIRED PATTERNS:**
- ✅ Always run technical validation before claiming completion
- ✅ Document any incomplete items honestly
- ✅ Get user validation for business-critical functionality
- ✅ Fix all compilation errors before declaring done

## 🔧 **Implementation Commands**

### Daily Development
```bash
# Check current technical status
npm run type-check

# Fix linting issues
npm run lint:fix

# Full story validation
npm run story-dod
```

### Story Completion
```bash
# 1. Technical validation
npm run story-dod

# 2. If passes, run DoD checklist manually
# 3. Get user validation for business logic
# 4. Only then mark story as complete
```

## 📊 **Quality Gates**

### Gate 1: Technical Compliance
- **Entry**: Code implementation complete
- **Exit**: `npm run story-dod` passes without errors
- **Owner**: Developer Agent

### Gate 2: BMad DoD Checklist
- **Entry**: Technical compliance achieved
- **Exit**: All applicable checklist items confirmed
- **Owner**: Developer Agent (self-assessment)

### Gate 3: Business Validation  
- **Entry**: Technical and DoD validation complete
- **Exit**: User confirms business requirements met
- **Owner**: Product Owner/User

## 🎯 **Success Metrics**

- **Zero** stories marked complete with compilation errors
- **Zero** "surprise" issues discovered after completion
- **100%** technical validation before review
- **Clear** documentation of any incomplete items

## 🔄 **Process Enforcement**

This process is **mandatory** for all stories. Any deviation must be:
1. **Documented** with specific justification
2. **Approved** by project owner
3. **Time-boxed** for immediate resolution

**The goal is sustainable quality delivery, not just feature velocity.** 