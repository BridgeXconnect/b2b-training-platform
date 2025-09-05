"use strict";
/**
 * Delegation Coordinator for BMAD System
 * Handles intelligent task delegation, load balancing, and agent coordination
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegationCoordinator = void 0;
const events_1 = require("events");
const bmad_agent_system_1 = require("./bmad-agent-system");
// Enhanced Task Analyzer
class TaskAnalyzer {
    analyzeTask(request, sessionContext) {
        const complexity = this.calculateComplexity(request);
        const decomposition = this.decomposeTask(request);
        const agentRequirements = this.determineAgentRequirements(request, decomposition);
        const coordinationNeeds = this.analyzeCoordinationNeeds(decomposition, complexity);
        return {
            complexity,
            decomposition,
            agentRequirements,
            coordinationNeeds,
            recommendedStrategy: this.recommendStrategy(complexity, agentRequirements),
            estimatedDuration: this.estimateDuration(decomposition, complexity),
            riskAssessment: this.assessRisks(request, decomposition)
        };
    }
    calculateComplexity(request) {
        let score = 0.1; // Base complexity
        // Analyze request characteristics
        if (request.multiStep)
            score += 0.3;
        if (request.requiresCreativity)
            score += 0.2;
        if (request.requiresAnalysis)
            score += 0.2;
        if (request.timeConstraints)
            score += 0.1;
        if (request.dependencies?.length > 0)
            score += 0.1 * request.dependencies.length;
        if (request.dataVolume === 'large')
            score += 0.2;
        return {
            overall: Math.min(score, 1.0),
            cognitive: this.calculateCognitiveComplexity(request),
            technical: this.calculateTechnicalComplexity(request),
            temporal: this.calculateTemporalComplexity(request),
            coordination: this.calculateCoordinationComplexity(request)
        };
    }
    decomposeTask(request) {
        // Intelligent task decomposition based on request type
        const steps = [];
        const agentMap = new Map();
        switch (request.type) {
            case 'comprehensive-learning':
                steps.push({ id: 'analyze-current-level', agentType: bmad_agent_system_1.AgentType.ANALYSIS, parallel: false }, { id: 'create-study-plan', agentType: bmad_agent_system_1.AgentType.PLANNING, parallel: false }, { id: 'generate-content', agentType: bmad_agent_system_1.AgentType.CONTENT, parallel: true }, { id: 'create-assessments', agentType: bmad_agent_system_1.AgentType.ASSESSMENT, parallel: true }, { id: 'coordinate-delivery', agentType: bmad_agent_system_1.AgentType.COORDINATION, parallel: false });
                break;
            case 'content-creation-suite':
                steps.push({ id: 'analyze-requirements', agentType: bmad_agent_system_1.AgentType.ANALYSIS, parallel: false }, { id: 'create-lessons', agentType: bmad_agent_system_1.AgentType.CONTENT, parallel: true }, { id: 'create-quizzes', agentType: bmad_agent_system_1.AgentType.CONTENT, parallel: true }, { id: 'create-assessments', agentType: bmad_agent_system_1.AgentType.ASSESSMENT, parallel: true }, { id: 'review-quality', agentType: bmad_agent_system_1.AgentType.ANALYSIS, parallel: false });
                break;
            case 'personalized-tutoring':
                steps.push({ id: 'analyze-student', agentType: bmad_agent_system_1.AgentType.ANALYSIS, parallel: false }, { id: 'adaptive-conversation', agentType: bmad_agent_system_1.AgentType.CONVERSATION, parallel: false }, { id: 'generate-practice', agentType: bmad_agent_system_1.AgentType.CONTENT, parallel: true }, { id: 'assess-progress', agentType: bmad_agent_system_1.AgentType.ASSESSMENT, parallel: false }, { id: 'update-plan', agentType: bmad_agent_system_1.AgentType.PLANNING, parallel: false });
                break;
            default:
                steps.push({ id: 'single-agent-task', agentType: this.selectBestAgentForTask(request), parallel: false });
        }
        return {
            steps,
            parallelGroups: this.identifyParallelGroups(steps),
            criticalPath: this.identifyCriticalPath(steps),
            dependencies: this.mapDependencies(steps)
        };
    }
    determineAgentRequirements(request, decomposition) {
        const requirements = [];
        for (const step of decomposition.steps) {
            const requirement = {
                agentType: step.agentType,
                capabilities: this.getRequiredCapabilities(step, request),
                performanceRequirements: this.getPerformanceRequirements(step, request),
                resourceRequirements: this.getResourceRequirements(step, request),
                qualityThresholds: this.getQualityThresholds(step, request)
            };
            requirements.push(requirement);
        }
        return requirements;
    }
    analyzeCoordinationNeeds(decomposition, complexity) {
        return {
            requiresOrchestration: complexity.coordination > 0.5,
            parallelismOpportunities: decomposition.parallelGroups.length,
            synchronizationPoints: this.identifySyncPoints(decomposition),
            dataFlowComplexity: this.analyzeDataFlow(decomposition),
            conflictPotential: this.assessConflictPotential(decomposition)
        };
    }
    recommendStrategy(complexity, requirements) {
        if (complexity.overall < 0.3) {
            return {
                type: 'single-agent',
                reasoning: 'Low complexity task suitable for single agent',
                confidence: 0.9
            };
        }
        if (complexity.coordination > 0.7) {
            return {
                type: 'orchestrated-parallel',
                reasoning: 'High coordination needs require orchestrated approach',
                confidence: 0.8
            };
        }
        if (requirements.length > 3) {
            return {
                type: 'multi-agent-parallel',
                reasoning: 'Multiple agents needed, parallel execution beneficial',
                confidence: 0.85
            };
        }
        return {
            type: 'sequential-multi-agent',
            reasoning: 'Moderate complexity with sequential dependencies',
            confidence: 0.75
        };
    }
    estimateDuration(decomposition, complexity) {
        let baseDuration = 0;
        // Sequential duration
        const sequentialSteps = decomposition.steps.filter(s => !s.parallel);
        baseDuration += sequentialSteps.length * 30; // 30 seconds per sequential step
        // Parallel duration (max of parallel group)
        for (const group of decomposition.parallelGroups) {
            const groupDuration = Math.max(...group.map(() => 45)); // 45 seconds for parallel steps
            baseDuration += groupDuration;
        }
        // Complexity multiplier
        const complexityMultiplier = 1 + complexity.overall;
        return Math.ceil(baseDuration * complexityMultiplier);
    }
    assessRisks(request, decomposition) {
        const risks = [];
        if (decomposition.steps.length > 5) {
            risks.push({
                type: 'complexity',
                level: 'medium',
                description: 'High task complexity may lead to coordination challenges',
                mitigation: 'Use experienced coordination agent and implement checkpoints'
            });
        }
        if (request.timeConstraints && request.timeConstraints.urgent) {
            risks.push({
                type: 'time-pressure',
                level: 'high',
                description: 'Urgent timeline may compromise quality',
                mitigation: 'Prioritize critical components and use performance-optimized agents'
            });
        }
        return {
            overall: this.calculateOverallRisk(risks),
            risks,
            recommendations: this.generateRiskMitigationRecommendations(risks)
        };
    }
    // Helper methods for complexity calculation
    calculateCognitiveComplexity(request) {
        let complexity = 0.1;
        if (request.requiresReasoning)
            complexity += 0.3;
        if (request.requiresCreativity)
            complexity += 0.2;
        if (request.requiresAnalysis)
            complexity += 0.2;
        return Math.min(complexity, 1.0);
    }
    calculateTechnicalComplexity(request) {
        let complexity = 0.1;
        if (request.multipleDataSources)
            complexity += 0.2;
        if (request.requiresIntegration)
            complexity += 0.2;
        if (request.customRequirements)
            complexity += 0.1;
        return Math.min(complexity, 1.0);
    }
    calculateTemporalComplexity(request) {
        let complexity = 0.1;
        if (request.timeConstraints?.urgent)
            complexity += 0.3;
        if (request.dependencies?.length > 2)
            complexity += 0.2;
        return Math.min(complexity, 1.0);
    }
    calculateCoordinationComplexity(request) {
        let complexity = 0.1;
        if (request.multipleAgentsNeeded)
            complexity += 0.4;
        if (request.requiresAggregation)
            complexity += 0.2;
        if (request.conflictPotential)
            complexity += 0.2;
        return Math.min(complexity, 1.0);
    }
    selectBestAgentForTask(request) {
        // Simple agent selection logic
        if (request.type?.includes('content') || request.type?.includes('lesson')) {
            return bmad_agent_system_1.AgentType.CONTENT;
        }
        if (request.type?.includes('assess') || request.type?.includes('quiz')) {
            return bmad_agent_system_1.AgentType.ASSESSMENT;
        }
        if (request.type?.includes('analyze') || request.type?.includes('review')) {
            return bmad_agent_system_1.AgentType.ANALYSIS;
        }
        if (request.type?.includes('plan') || request.type?.includes('strategy')) {
            return bmad_agent_system_1.AgentType.PLANNING;
        }
        if (request.type?.includes('chat') || request.type?.includes('conversation')) {
            return bmad_agent_system_1.AgentType.CONVERSATION;
        }
        return bmad_agent_system_1.AgentType.COORDINATION;
    }
    identifyParallelGroups(steps) {
        const groups = [];
        let currentGroup = [];
        for (const step of steps) {
            if (step.parallel) {
                currentGroup.push(step);
            }
            else {
                if (currentGroup.length > 0) {
                    groups.push(currentGroup);
                    currentGroup = [];
                }
                groups.push([step]);
            }
        }
        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }
        return groups.filter(group => group.length > 1);
    }
    identifyCriticalPath(steps) {
        // Simple critical path identification
        return steps.filter(s => !s.parallel).map(s => s.id);
    }
    mapDependencies(steps) {
        const dependencies = new Map();
        // Simple dependency mapping based on step order
        for (let i = 1; i < steps.length; i++) {
            const currentStep = steps[i];
            const prevStep = steps[i - 1];
            if (!currentStep.parallel) {
                dependencies.set(currentStep.id, [prevStep.id]);
            }
        }
        return dependencies;
    }
    getRequiredCapabilities(step, request) {
        // Map step types to required capabilities
        const capabilityMap = {
            [bmad_agent_system_1.AgentType.CONTENT]: ['content-generation', 'educational-design'],
            [bmad_agent_system_1.AgentType.CONVERSATION]: ['natural-language', 'context-awareness'],
            [bmad_agent_system_1.AgentType.ANALYSIS]: ['data-analysis', 'pattern-recognition'],
            [bmad_agent_system_1.AgentType.ASSESSMENT]: ['evaluation', 'feedback-generation'],
            [bmad_agent_system_1.AgentType.PLANNING]: ['strategic-planning', 'optimization'],
            [bmad_agent_system_1.AgentType.COORDINATION]: ['orchestration', 'conflict-resolution']
        };
        return capabilityMap[step.agentType] || [];
    }
    getPerformanceRequirements(step, request) {
        return {
            responseTime: request.urgent ? 5000 : 15000,
            throughput: 1,
            accuracy: 0.85,
            availability: 0.99
        };
    }
    getResourceRequirements(step, request) {
        return {
            memory: 'normal',
            cpu: 'normal',
            network: 'low',
            storage: 'minimal'
        };
    }
    getQualityThresholds(step, request) {
        return {
            minConfidence: 0.7,
            minAccuracy: 0.8,
            maxErrorRate: 0.1
        };
    }
    identifySyncPoints(decomposition) {
        return decomposition.steps
            .filter((step, index) => index === decomposition.steps.length - 1 || !step.parallel)
            .map(step => step.id);
    }
    analyzeDataFlow(decomposition) {
        if (decomposition.parallelGroups.length > 2)
            return 'complex';
        if (decomposition.parallelGroups.length > 0)
            return 'moderate';
        return 'simple';
    }
    assessConflictPotential(decomposition) {
        if (decomposition.parallelGroups.length > 2)
            return 'high';
        if (decomposition.parallelGroups.length > 0)
            return 'medium';
        return 'low';
    }
    calculateOverallRisk(risks) {
        if (risks.some(r => r.level === 'critical'))
            return 'critical';
        if (risks.some(r => r.level === 'high'))
            return 'high';
        if (risks.some(r => r.level === 'medium'))
            return 'medium';
        return 'low';
    }
    generateRiskMitigationRecommendations(risks) {
        return risks.map(risk => risk.mitigation);
    }
}
// Main Delegation Coordinator
class DelegationCoordinator extends events_1.EventEmitter {
    constructor(bmadSystem, sessionManager) {
        super();
        this.bmadSystem = bmadSystem;
        this.sessionManager = sessionManager;
        this.taskAnalyzer = new TaskAnalyzer();
        this.activeTasks = new Map();
        this.taskResults = new Map();
        this.performanceMetrics = new Map();
        this.initializePerformanceTracking();
    }
    async delegateTask(sessionId, request, options = {}) {
        try {
            // Get session context
            const session = await this.sessionManager.getSession(sessionId);
            if (!session) {
                throw new Error('Invalid session ID');
            }
            // Analyze the task
            const analysis = this.taskAnalyzer.analyzeTask(request, session.context);
            // Create delegation task
            const delegationTask = this.createDelegationTask(request, analysis, options);
            this.activeTasks.set(delegationTask.id, delegationTask);
            this.emit('taskDelegationStarted', {
                taskId: delegationTask.id,
                sessionId,
                strategy: analysis.recommendedStrategy.type,
                estimatedDuration: analysis.estimatedDuration
            });
            // Execute the delegation
            const result = await this.executeDelegationTask(delegationTask, session);
            // Store result
            this.taskResults.set(delegationTask.id, result);
            // Update performance metrics
            this.updatePerformanceMetrics(delegationTask, result);
            // Record interaction in session
            await this.sessionManager.recordAgentInteraction(sessionId, bmad_agent_system_1.AgentType.COORDINATION, request, {
                id: delegationTask.id,
                agentType: bmad_agent_system_1.AgentType.COORDINATION,
                success: result.success,
                data: result,
                processingTime: result.executionTime,
                metadata: { confidence: result.success ? 0.9 : 0.5 }
            });
            this.emit('taskDelegationCompleted', {
                taskId: delegationTask.id,
                sessionId,
                success: result.success,
                executionTime: result.executionTime
            });
            return result;
        }
        catch (error) {
            this.emit('taskDelegationFailed', { sessionId, error: error.message });
            throw error;
        }
    }
    createDelegationTask(request, analysis, options) {
        const taskId = this.generateTaskId();
        // Create subtasks from decomposition
        const subtasks = analysis.decomposition.steps.map((step, index) => ({
            id: `${taskId}_subtask_${index}`,
            agentType: step.agentType,
            payload: this.createSubtaskPayload(step, request),
            dependencies: this.getStepDependencies(step, analysis.decomposition),
            timeout: options.timeout || 30000,
            retries: options.retries || 2,
            weight: this.calculateSubtaskWeight(step, analysis),
            optional: step.optional || false
        }));
        // Determine coordination strategy
        const coordinationStrategy = {
            type: this.selectCoordinationStrategy(analysis),
            parameters: {
                maxConcurrent: options.maxConcurrent || 3,
                timeouts: true,
                performanceThreshold: 0.7
            }
        };
        // Set up aggregation rules if needed
        const aggregationRules = subtasks.length > 1 ? {
            method: options.aggregationMethod || 'combined',
            confidenceThreshold: 0.7,
            minimumAgreement: 0.6,
            conflictResolution: 'highest-confidence'
        } : undefined;
        // Configure failure handling
        const failureHandling = {
            onAgentFailure: {
                strategy: 'retry',
                maxRetries: 2,
                fallbackAgent: this.selectFallbackAgent(request),
                escalation: true
            },
            onTimeout: {
                strategy: 'fallback',
                maxRetries: 1,
                escalation: false
            },
            onCriticalError: {
                strategy: 'abort',
                maxRetries: 0,
                escalation: true
            },
            recoveryProcedures: this.createRecoveryProcedures(analysis)
        };
        return {
            id: taskId,
            type: this.determineTaskType(analysis),
            priority: options.priority || 'medium',
            timeout: options.timeout || analysis.estimatedDuration * 1.5,
            dependencies: [],
            subtasks,
            coordinationStrategy,
            aggregationRules,
            failureHandling
        };
    }
    async executeDelegationTask(task, session) {
        const startTime = Date.now();
        const results = new Map();
        const warnings = [];
        const errors = [];
        try {
            switch (task.type) {
                case 'parallel':
                    return await this.executeParallelTask(task, session, results, warnings, errors, startTime);
                case 'sequential':
                    return await this.executeSequentialTask(task, session, results, warnings, errors, startTime);
                case 'conditional':
                    return await this.executeConditionalTask(task, session, results, warnings, errors, startTime);
                case 'aggregated':
                    return await this.executeAggregatedTask(task, session, results, warnings, errors, startTime);
                default:
                    throw new Error(`Unsupported task type: ${task.type}`);
            }
        }
        catch (error) {
            errors.push(error.message);
            return {
                taskId: task.id,
                success: false,
                results,
                executionTime: Date.now() - startTime,
                warnings,
                errors
            };
        }
        finally {
            this.activeTasks.delete(task.id);
        }
    }
    async executeParallelTask(task, session, results, warnings, errors, startTime) {
        const promises = task.subtasks.map(async (subtask) => {
            try {
                const agentRequest = {
                    id: subtask.id,
                    type: subtask.agentType,
                    payload: subtask.payload,
                    context: session.context,
                    priority: task.priority,
                    timeout: subtask.timeout,
                    retries: subtask.retries
                };
                const response = await this.bmadSystem.processRequest(session.id, subtask.agentType, subtask.payload, { timeout: subtask.timeout });
                results.set(subtask.id, response);
                return response;
            }
            catch (error) {
                if (!subtask.optional) {
                    errors.push(`Subtask ${subtask.id} failed: ${error.message}`);
                }
                else {
                    warnings.push(`Optional subtask ${subtask.id} failed: ${error.message}`);
                }
                return null;
            }
        });
        await Promise.allSettled(promises);
        const aggregatedResult = task.aggregationRules
            ? this.aggregateResults(results, task.aggregationRules)
            : this.combineResults(results);
        return {
            taskId: task.id,
            success: errors.length === 0,
            results,
            aggregatedResult,
            executionTime: Date.now() - startTime,
            warnings,
            errors,
            partialSuccess: results.size > 0 && errors.length > 0
        };
    }
    async executeSequentialTask(task, session, results, warnings, errors, startTime) {
        for (const subtask of task.subtasks) {
            try {
                // Check dependencies
                if (!this.areDependenciesMet(subtask, results)) {
                    errors.push(`Dependencies not met for subtask ${subtask.id}`);
                    break;
                }
                const response = await this.bmadSystem.processRequest(session.id, subtask.agentType, this.enrichPayloadWithContext(subtask.payload, results), { timeout: subtask.timeout });
                results.set(subtask.id, response);
                if (!response.success && !subtask.optional) {
                    errors.push(`Critical subtask ${subtask.id} failed`);
                    break;
                }
            }
            catch (error) {
                if (!subtask.optional) {
                    errors.push(`Subtask ${subtask.id} failed: ${error.message}`);
                    break;
                }
                else {
                    warnings.push(`Optional subtask ${subtask.id} failed: ${error.message}`);
                }
            }
        }
        const aggregatedResult = task.aggregationRules
            ? this.aggregateResults(results, task.aggregationRules)
            : this.combineResults(results);
        return {
            taskId: task.id,
            success: errors.length === 0,
            results,
            aggregatedResult,
            executionTime: Date.now() - startTime,
            warnings,
            errors
        };
    }
    async executeConditionalTask(task, session, results, warnings, errors, startTime) {
        // Simplified conditional execution - can be enhanced
        for (const subtask of task.subtasks) {
            const shouldExecute = this.evaluateCondition(subtask, results, session);
            if (shouldExecute) {
                try {
                    const response = await this.bmadSystem.processRequest(session.id, subtask.agentType, subtask.payload, { timeout: subtask.timeout });
                    results.set(subtask.id, response);
                }
                catch (error) {
                    if (!subtask.optional) {
                        errors.push(`Conditional subtask ${subtask.id} failed: ${error.message}`);
                    }
                    else {
                        warnings.push(`Optional conditional subtask ${subtask.id} failed: ${error.message}`);
                    }
                }
            }
        }
        return {
            taskId: task.id,
            success: errors.length === 0,
            results,
            executionTime: Date.now() - startTime,
            warnings,
            errors
        };
    }
    async executeAggregatedTask(task, session, results, warnings, errors, startTime) {
        // Execute all subtasks and then intelligently aggregate results
        const parallelResult = await this.executeParallelTask(task, session, results, warnings, errors, startTime);
        if (task.aggregationRules && results.size > 1) {
            const smartAggregation = this.performIntelligentAggregation(results, task.aggregationRules, session.context);
            parallelResult.aggregatedResult = smartAggregation;
        }
        return parallelResult;
    }
    // Helper Methods
    generateTaskId() {
        return `delegation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    createSubtaskPayload(step, originalRequest) {
        // Create appropriate payload for each subtask based on the step and original request
        const basePayload = {
            ...originalRequest,
            stepId: step.id,
            stepType: step.agentType
        };
        // Customize payload based on agent type
        switch (step.agentType) {
            case bmad_agent_system_1.AgentType.CONTENT:
                return {
                    ...basePayload,
                    type: step.id.includes('lesson') ? 'lesson' :
                        step.id.includes('quiz') ? 'quiz' : 'content'
                };
            case bmad_agent_system_1.AgentType.ANALYSIS:
                return {
                    ...basePayload,
                    analysisType: step.id.includes('current-level') ? 'progress' : 'performance'
                };
            case bmad_agent_system_1.AgentType.PLANNING:
                return {
                    ...basePayload,
                    planType: 'study-plan'
                };
            case bmad_agent_system_1.AgentType.ASSESSMENT:
                return {
                    ...basePayload,
                    assessmentType: 'create'
                };
            case bmad_agent_system_1.AgentType.CONVERSATION:
                return {
                    ...basePayload,
                    conversationType: 'tutoring'
                };
            default:
                return basePayload;
        }
    }
    getStepDependencies(step, decomposition) {
        return decomposition.dependencies.get(step.id) || [];
    }
    calculateSubtaskWeight(step, analysis) {
        // Calculate weight based on importance in the overall task
        if (analysis.decomposition.criticalPath.includes(step.id)) {
            return 1.0;
        }
        return 0.5;
    }
    selectCoordinationStrategy(analysis) {
        if (analysis.coordinationNeeds.parallelismOpportunities > 2) {
            return 'performance-based';
        }
        if (analysis.complexity.coordination > 0.7) {
            return 'capability-based';
        }
        return 'load-balanced';
    }
    selectFallbackAgent(request) {
        // Simple fallback selection
        if (request.type?.includes('content'))
            return bmad_agent_system_1.AgentType.CONVERSATION;
        if (request.type?.includes('analysis'))
            return bmad_agent_system_1.AgentType.CONTENT;
        return bmad_agent_system_1.AgentType.COORDINATION;
    }
    createRecoveryProcedures(analysis) {
        const procedures = [];
        if (analysis.riskAssessment.overall === 'high') {
            procedures.push({
                condition: 'high-failure-rate',
                action: 'simplify-task',
                parameters: { maxComplexity: 0.5 }
            });
        }
        return procedures;
    }
    determineTaskType(analysis) {
        if (analysis.coordinationNeeds.requiresOrchestration) {
            return 'aggregated';
        }
        if (analysis.decomposition.parallelGroups.length > 0) {
            return 'parallel';
        }
        return 'sequential';
    }
    areDependenciesMet(subtask, results) {
        return subtask.dependencies.every(dep => results.has(dep) && results.get(dep)?.success);
    }
    enrichPayloadWithContext(payload, previousResults) {
        const enrichedPayload = { ...payload };
        // Add context from previous results
        const contextData = {};
        for (const [id, result] of previousResults.entries()) {
            if (result.success && result.data) {
                contextData[id] = result.data;
            }
        }
        enrichedPayload.previousResults = contextData;
        return enrichedPayload;
    }
    evaluateCondition(subtask, results, session) {
        // Simple condition evaluation - can be enhanced with rule engine
        if (subtask.dependencies.length === 0)
            return true;
        return subtask.dependencies.some(dep => {
            const result = results.get(dep);
            return result?.success && result?.metadata?.confidence > 0.7;
        });
    }
    aggregateResults(results, rules) {
        const successfulResults = Array.from(results.values()).filter(r => r.success);
        if (successfulResults.length === 0) {
            return { success: false, message: 'No successful results to aggregate' };
        }
        switch (rules.method) {
            case 'consensus':
                return this.findConsensus(successfulResults, rules);
            case 'weighted-average':
                return this.calculateWeightedAverage(successfulResults, rules);
            case 'best-result':
                return this.selectBestResult(successfulResults, rules);
            case 'combined':
                return this.combineResults(results);
            case 'majority-vote':
                return this.majorityVote(successfulResults, rules);
            default:
                return this.combineResults(results);
        }
    }
    performIntelligentAggregation(results, rules, context) {
        // Enhanced aggregation with context awareness
        const aggregation = this.aggregateResults(results, rules);
        // Add confidence scoring
        const avgConfidence = Array.from(results.values())
            .filter(r => r.success)
            .reduce((sum, r) => sum + r.metadata.confidence, 0) / results.size;
        return {
            ...aggregation,
            confidence: avgConfidence,
            resultCount: results.size,
            successRate: Array.from(results.values()).filter(r => r.success).length / results.size,
            aggregationMethod: rules.method
        };
    }
    combineResults(results) {
        const combined = {
            success: Array.from(results.values()).some(r => r.success),
            results: {},
            summary: []
        };
        for (const [id, result] of results.entries()) {
            combined.results[id] = result.data;
            if (result.success) {
                combined.summary.push(`${id}: Success`);
            }
            else {
                combined.summary.push(`${id}: ${result.error || 'Failed'}`);
            }
        }
        return combined;
    }
    findConsensus(results, rules) {
        // Simplified consensus finding
        const highConfidenceResults = results.filter(r => r.metadata.confidence >= rules.confidenceThreshold);
        if (highConfidenceResults.length >= results.length * rules.minimumAgreement) {
            return {
                success: true,
                consensusReached: true,
                result: highConfidenceResults[0].data,
                confidence: highConfidenceResults.reduce((sum, r) => sum + r.metadata.confidence, 0) / highConfidenceResults.length
            };
        }
        return {
            success: false,
            consensusReached: false,
            message: 'No consensus reached among agents'
        };
    }
    calculateWeightedAverage(results, rules) {
        // Simplified weighted average - mainly for numerical results
        const weightedSum = results.reduce((sum, result, index) => {
            const weight = result.metadata.confidence;
            const value = typeof result.data === 'number' ? result.data : 1;
            return sum + (value * weight);
        }, 0);
        const totalWeight = results.reduce((sum, result) => sum + result.metadata.confidence, 0);
        return {
            success: true,
            weightedAverage: weightedSum / totalWeight,
            confidence: totalWeight / results.length
        };
    }
    selectBestResult(results, rules) {
        const bestResult = results.reduce((best, current) => current.metadata.confidence > best.metadata.confidence ? current : best);
        return {
            success: true,
            bestResult: bestResult.data,
            confidence: bestResult.metadata.confidence,
            selectedFrom: results.length
        };
    }
    majorityVote(results, rules) {
        // Simple majority vote implementation
        const votes = new Map();
        results.forEach(result => {
            const key = JSON.stringify(result.data);
            votes.set(key, (votes.get(key) || 0) + 1);
        });
        const winner = Array.from(votes.entries()).reduce((a, b) => a[1] > b[1] ? a : b);
        return {
            success: true,
            majorityChoice: JSON.parse(winner[0]),
            votes: winner[1],
            totalVotes: results.length,
            confidence: winner[1] / results.length
        };
    }
    initializePerformanceTracking() {
        // Initialize performance metrics for all agent types
        Object.values(bmad_agent_system_1.AgentType).forEach(agentType => {
            this.performanceMetrics.set(agentType, {
                totalDelegations: 0,
                successfulDelegations: 0,
                averageResponseTime: 0,
                averageConfidence: 0,
                lastUpdated: new Date()
            });
        });
    }
    updatePerformanceMetrics(task, result) {
        // Update performance metrics for coordination
        const coordMetrics = this.performanceMetrics.get(bmad_agent_system_1.AgentType.COORDINATION);
        coordMetrics.totalDelegations++;
        if (result.success)
            coordMetrics.successfulDelegations++;
        coordMetrics.averageResponseTime =
            ((coordMetrics.averageResponseTime * (coordMetrics.totalDelegations - 1)) + result.executionTime) /
                coordMetrics.totalDelegations;
        // Update metrics for individual agents
        for (const [subtaskId, response] of result.results.entries()) {
            const agentMetrics = this.performanceMetrics.get(response.agentType);
            agentMetrics.totalDelegations++;
            if (response.success)
                agentMetrics.successfulDelegations++;
            agentMetrics.averageResponseTime =
                ((agentMetrics.averageResponseTime * (agentMetrics.totalDelegations - 1)) + response.processingTime) /
                    agentMetrics.totalDelegations;
            agentMetrics.averageConfidence =
                ((agentMetrics.averageConfidence * (agentMetrics.totalDelegations - 1)) + response.metadata.confidence) /
                    agentMetrics.totalDelegations;
            agentMetrics.lastUpdated = new Date();
        }
    }
    // Public API methods
    getPerformanceMetrics() {
        return new Map(this.performanceMetrics);
    }
    getActiveTaskCount() {
        return this.activeTasks.size;
    }
    getTaskResult(taskId) {
        return this.taskResults.get(taskId) || null;
    }
    cancelTask(taskId) {
        if (this.activeTasks.has(taskId)) {
            this.activeTasks.delete(taskId);
            this.emit('taskCancelled', { taskId });
            return true;
        }
        return false;
    }
}
exports.DelegationCoordinator = DelegationCoordinator;
