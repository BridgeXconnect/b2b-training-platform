import { 
  useCopilotAction
} from '@copilotkit/react-core';

// Advanced Chat Action Types
export type ChatActionType = 
  | 'visual_analysis'
  | 'scenario_simulation'
  | 'personalized_coaching'
  | 'multi_turn_conversation';

export interface VisualAnalysisAction {
  type: 'visual_analysis';
  imageUrl?: string;
  visualDescription: string;
  languagePoints: string[];
  vocabulary: Array<{
    term: string;
    meaning: string;
    usage: string;
  }>;
  culturalContext?: string;
}

export interface ScenarioSimulationAction {
  type: 'scenario_simulation';
  scenario: {
    title: string;
    context: string;
    roleYouPlay: string;
    roleAIPlays: string;
    objectives: string[];
    challengeLevel: number; // 1-10
  };
  stages: Array<{
    name: string;
    description: string;
    requiredActions: string[];
    successCriteria: string[];
  }>;
  feedback: {
    realTime: boolean;
    focusAreas: string[];
  };
}

export interface PersonalizedCoachingAction {
  type: 'personalized_coaching';
  coachingStyle: 'supportive' | 'challenging' | 'balanced';
  focus: {
    area: string;
    specificSkill: string;
    currentLevel: number; // 1-10
    targetLevel: number; // 1-10
  };
  techniques: Array<{
    name: string;
    description: string;
    example: string;
  }>;
  practiceExercises: Array<{
    type: string;
    duration: number;
    difficulty: number;
    instructions: string;
  }>;
}

export interface MultiTurnConversationFlow {
  type: 'multi_turn_conversation';
  conversationId: string;
  currentTurn: number;
  maxTurns: number;
  context: {
    topic: string;
    businessScenario: string;
    previousPoints: string[];
    upcomingPoints: string[];
  };
  memory: {
    userMistakes: string[];
    successfulPhrases: string[];
    vocabularyUsed: string[];
    grammarPatterns: string[];
  };
  adaptations: {
    difficultyAdjustment: number; // -2 to +2
    focusShift?: string;
    encouragementLevel: number; // 1-5
  };
}

// Action Handlers
export const chatActionHandlers = {
  // Visual Analysis and Explanation
  analyze_visual: {
    name: "analyze_visual",
    description: "Analyze images, diagrams, or visual business content and explain in the target language",
    parameters: [
      {
        name: "visualContent",
        type: "object",
        description: "Visual content to analyze (image URL or description)",
        required: true,
      },
      {
        name: "analysisDepth",
        type: "string",
        description: "Depth of analysis (basic, intermediate, advanced)",
        required: false,
      },
      {
        name: "languageFocus",
        type: "string",
        description: "Language skill to focus on (vocabulary, description, presentation)",
        required: false,
      }
    ],
    handler: async ({ visualContent, analysisDepth = "intermediate", languageFocus = "vocabulary" }: any) => {
      const analysis: VisualAnalysisAction = {
        type: 'visual_analysis',
        imageUrl: visualContent.imageUrl,
        visualDescription: visualContent.description || "Business chart showing quarterly results",
        languagePoints: [
          "Use 'The chart illustrates...' to introduce visual data",
          "Employ comparative language: 'higher than', 'compared to'",
          "Practice trend vocabulary: 'increase', 'decrease', 'fluctuate'",
          "Use precise percentages and figures in presentations"
        ],
        vocabulary: [
          {
            term: "illustrate",
            meaning: "to show or demonstrate something clearly",
            usage: "The graph illustrates our revenue growth over the past year."
          },
          {
            term: "fluctuate",
            meaning: "to rise and fall irregularly",
            usage: "Sales tend to fluctuate during the holiday season."
          },
          {
            term: "significant",
            meaning: "important or notable",
            usage: "We observed a significant increase in Q3 performance."
          }
        ],
        culturalContext: "In business presentations, always lead with the main conclusion before diving into details."
      };

      return {
        success: true,
        analysis,
        message: `I'll help you analyze this ${visualContent.type || 'visual content'} and practice relevant business English. Let's focus on ${languageFocus} skills while discussing what we see.`
      };
    }
  },

  // Practical Scenario Simulations
  start_scenario: {
    name: "start_scenario",
    description: "Begin an immersive business scenario simulation for practical language practice",
    parameters: [
      {
        name: "scenarioType",
        type: "string",
        description: "Type of scenario (negotiation, presentation, meeting, email_chain, phone_call)",
        required: true,
      },
      {
        name: "difficulty",
        type: "number",
        description: "Difficulty level 1-10",
        required: false,
      },
      {
        name: "industry",
        type: "string",
        description: "Industry context for the scenario",
        required: false,
      }
    ],
    handler: async ({ scenarioType, difficulty = 5, industry = "technology" }: any) => {
      const scenarios: Record<string, ScenarioSimulationAction> = {
        negotiation: {
          type: 'scenario_simulation',
          scenario: {
            title: "Software License Negotiation",
            context: `You're negotiating a software license deal with a potential client. The client is interested but concerned about pricing and implementation timeline.`,
            roleYouPlay: "Sales Manager at TechSoft Solutions",
            roleAIPlays: "Procurement Director at GlobalCorp",
            objectives: [
              "Understand client's budget constraints",
              "Highlight value proposition",
              "Negotiate favorable terms",
              "Secure commitment for next steps"
            ],
            challengeLevel: difficulty
          },
          stages: [
            {
              name: "Opening & Relationship Building",
              description: "Establish rapport and set collaborative tone",
              requiredActions: ["Greet professionally", "Find common ground", "Set agenda"],
              successCriteria: ["Appropriate greeting", "Active listening", "Clear communication"]
            },
            {
              name: "Discovery & Needs Analysis",
              description: "Understand client requirements and constraints",
              requiredActions: ["Ask open-ended questions", "Clarify requirements", "Identify pain points"],
              successCriteria: ["Relevant questions asked", "Active listening demonstrated", "Needs documented"]
            },
            {
              name: "Value Presentation",
              description: "Present solution and demonstrate value",
              requiredActions: ["Link features to benefits", "Use data/evidence", "Address concerns"],
              successCriteria: ["Clear value proposition", "Benefit-focused language", "Objection handling"]
            },
            {
              name: "Negotiation & Closing",
              description: "Negotiate terms and secure agreement",
              requiredActions: ["Propose win-win solutions", "Handle objections", "Secure next steps"],
              successCriteria: ["Professional negotiation", "Flexibility shown", "Clear action items"]
            }
          ],
          feedback: {
            realTime: true,
            focusAreas: ["Professional vocabulary", "Negotiation phrases", "Question formation", "Persuasive language"]
          }
        },
        presentation: {
          type: 'scenario_simulation',
          scenario: {
            title: "Quarterly Business Review Presentation",
            context: `You're presenting Q3 results to senior management and proposing strategic initiatives for Q4.`,
            roleYouPlay: "Regional Sales Director",
            roleAIPlays: "Executive Team (CEO, CFO, COO)",
            objectives: [
              "Present Q3 performance clearly",
              "Explain variances from targets",
              "Propose Q4 strategy",
              "Handle executive questions"
            ],
            challengeLevel: difficulty
          },
          stages: [
            {
              name: "Executive Summary",
              description: "Open with key messages and agenda",
              requiredActions: ["State main points upfront", "Set expectations", "Grab attention"],
              successCriteria: ["Clear opening", "Confident delivery", "Structured agenda"]
            },
            {
              name: "Performance Review",
              description: "Present Q3 results with analysis",
              requiredActions: ["Present data clearly", "Explain trends", "Acknowledge challenges"],
              successCriteria: ["Data articulation", "Trend explanation", "Balanced perspective"]
            },
            {
              name: "Strategic Proposals",
              description: "Present Q4 initiatives and recommendations",
              requiredActions: ["Link strategy to results", "Show ROI projections", "Request resources"],
              successCriteria: ["Clear proposals", "Business justification", "Actionable recommendations"]
            },
            {
              name: "Q&A Session",
              description: "Handle executive questions and concerns",
              requiredActions: ["Listen carefully", "Answer concisely", "Admit unknowns professionally"],
              successCriteria: ["Active listening", "Clear responses", "Professional demeanor"]
            }
          ],
          feedback: {
            realTime: true,
            focusAreas: ["Presentation language", "Data description", "Executive communication", "Q&A handling"]
          }
        }
      };

      const selectedScenario = scenarios[scenarioType] || scenarios.negotiation;
      
      return {
        success: true,
        scenario: selectedScenario,
        message: `Let's begin the ${scenarioType} scenario. I'll play ${selectedScenario.scenario.roleAIPlays} and guide you through each stage. Remember to use professional business English throughout!`
      };
    }
  },

  // Personalized Coaching Response
  provide_coaching: {
    name: "provide_coaching",
    description: "Provide personalized language coaching based on user's specific needs and performance",
    parameters: [
      {
        name: "coachingArea",
        type: "string",
        description: "Area to coach (pronunciation, grammar, vocabulary, fluency, cultural_communication)",
        required: true,
      },
      {
        name: "userLevel",
        type: "number",
        description: "Current skill level 1-10",
        required: true,
      },
      {
        name: "specificChallenge",
        type: "string",
        description: "Specific challenge the user is facing",
        required: false,
      }
    ],
    handler: async ({ coachingArea, userLevel, specificChallenge }: any) => {
      const coachingPlans: Record<string, PersonalizedCoachingAction> = {
        pronunciation: {
          type: 'personalized_coaching',
          coachingStyle: userLevel < 5 ? 'supportive' : 'balanced',
          focus: {
            area: 'pronunciation',
            specificSkill: specificChallenge || 'business terminology pronunciation',
            currentLevel: userLevel,
            targetLevel: Math.min(userLevel + 2, 10)
          },
          techniques: [
            {
              name: "Syllable Stress Patterns",
              description: "Master stress patterns in multi-syllable business words",
              example: "pre-SEN-ta-tion, not PRE-sen-ta-tion"
            },
            {
              name: "Linking Sounds",
              description: "Connect words smoothly in professional phrases",
              example: "'set up' sounds like 'se-tup', 'find out' sounds like 'fine-dout'"
            },
            {
              name: "Intonation for Impact",
              description: "Use rising and falling tones to convey confidence",
              example: "Questions rise: 'Can we MEET tomorrow?' Statements fall: 'The results are EXcellent.'"
            }
          ],
          practiceExercises: [
            {
              type: "Listen and Repeat",
              duration: 5,
              difficulty: userLevel,
              instructions: "I'll say key business phrases. Repeat them, focusing on stress and rhythm."
            },
            {
              type: "Sentence Building",
              duration: 10,
              difficulty: userLevel + 1,
              instructions: "Create sentences using target vocabulary, paying attention to pronunciation."
            }
          ]
        },
        grammar: {
          type: 'personalized_coaching',
          coachingStyle: 'balanced',
          focus: {
            area: 'grammar',
            specificSkill: specificChallenge || 'professional email structures',
            currentLevel: userLevel,
            targetLevel: Math.min(userLevel + 2, 10)
          },
          techniques: [
            {
              name: "Conditional Mastery",
              description: "Use conditionals for professional hypotheticals",
              example: "If we were to proceed, we would need approval by Friday."
            },
            {
              name: "Passive Voice for Diplomacy",
              description: "Use passive voice to maintain professional tone",
              example: "The report will be reviewed (instead of 'John will review the report')"
            },
            {
              name: "Modal Verbs for Politeness",
              description: "Soften requests and suggestions professionally",
              example: "Could you possibly send...? We might want to consider..."
            }
          ],
          practiceExercises: [
            {
              type: "Sentence Transformation",
              duration: 8,
              difficulty: userLevel,
              instructions: "Transform direct sentences into more professional, polite versions."
            },
            {
              type: "Error Correction",
              duration: 7,
              difficulty: userLevel + 1,
              instructions: "Identify and correct grammar mistakes in business emails."
            }
          ]
        }
      };

      const selectedCoaching = coachingPlans[coachingArea] || coachingPlans.grammar;
      
      return {
        success: true,
        coaching: selectedCoaching,
        message: `I'll provide personalized coaching for ${coachingArea}. Based on your current level (${userLevel}/10), I've prepared targeted exercises to help you improve.`
      };
    }
  },

  // Multi-turn Conversation Management
  continue_conversation: {
    name: "continue_conversation",
    description: "Manage multi-turn conversations with context awareness and progression",
    parameters: [
      {
        name: "conversationId",
        type: "string",
        description: "ID of the ongoing conversation",
        required: true,
      },
      {
        name: "userResponse",
        type: "string",
        description: "User's latest response in the conversation",
        required: true,
      },
      {
        name: "performanceMetrics",
        type: "object",
        description: "Performance indicators from the response",
        required: false,
      }
    ],
    handler: async ({ conversationId, userResponse, performanceMetrics }: any) => {
      // Analyze user response for language quality
      const languageAnalysis = {
        grammarScore: performanceMetrics?.grammar || 0.8,
        vocabularyScore: performanceMetrics?.vocabulary || 0.75,
        fluencyScore: performanceMetrics?.fluency || 0.7,
        appropriatenessScore: performanceMetrics?.appropriateness || 0.85
      };

      const conversationFlow: MultiTurnConversationFlow = {
        type: 'multi_turn_conversation',
        conversationId,
        currentTurn: 3, // Example turn number
        maxTurns: 8,
        context: {
          topic: "Project Status Update Meeting",
          businessScenario: "Weekly team sync discussing project delays and solutions",
          previousPoints: [
            "Identified 2-week delay in development",
            "Discussed resource constraints",
            "Proposed timeline adjustments"
          ],
          upcomingPoints: [
            "Budget implications",
            "Stakeholder communication",
            "Risk mitigation strategies"
          ]
        },
        memory: {
          userMistakes: [
            "Confusion between 'delay' and 'postpone'",
            "Incorrect use of present perfect tense"
          ],
          successfulPhrases: [
            "We need to address this issue promptly",
            "I'd like to propose an alternative approach",
            "Could we explore other options?"
          ],
          vocabularyUsed: ["constraints", "mitigation", "stakeholder", "timeline"],
          grammarPatterns: ["conditional sentences", "modal verbs", "passive voice"]
        },
        adaptations: {
          difficultyAdjustment: languageAnalysis.fluencyScore < 0.6 ? -1 : 0,
          focusShift: languageAnalysis.grammarScore < 0.7 ? "grammar reinforcement" : undefined,
          encouragementLevel: Math.min(5, Math.floor((languageAnalysis.fluencyScore + languageAnalysis.appropriatenessScore) * 2.5))
        }
      };

      return {
        success: true,
        conversationFlow,
        analysis: languageAnalysis,
        nextPrompt: "Let's now discuss the budget implications. How would you explain the financial impact to the stakeholders?",
        feedback: {
          positive: "Great use of professional vocabulary!",
          improvement: "Try using more conditional sentences when discussing possibilities.",
          suggestion: "Next time, try: 'If we were to extend the deadline, we would need to...'",
          message: `Good progress! You're on turn ${conversationFlow.currentTurn} of ${conversationFlow.maxTurns}. ${conversationFlow.adaptations.encouragementLevel >= 4 ? "You're doing excellently!" : "Keep practicing!"}`
        }
      };
    }
  }
};

// Helper function to create action configurations for CopilotKit
export function createChatActions() {
  return Object.values(chatActionHandlers).map(handler => ({
    ...handler,
    render: ({ status, result }: any) => {
      if (status === "complete" && result) {
        // Return appropriate rendering based on action type
        return null; // Rendering handled in component
      }
      return null;
    }
  }));
}

// Multi-turn conversation state manager
export class ConversationStateManager {
  private conversations: Map<string, MultiTurnConversationFlow> = new Map();

  startConversation(topic: string, scenario: string): string {
    const conversationId = `conv_${Date.now()}`;
    const conversation: MultiTurnConversationFlow = {
      type: 'multi_turn_conversation',
      conversationId,
      currentTurn: 1,
      maxTurns: 8,
      context: {
        topic,
        businessScenario: scenario,
        previousPoints: [],
        upcomingPoints: []
      },
      memory: {
        userMistakes: [],
        successfulPhrases: [],
        vocabularyUsed: [],
        grammarPatterns: []
      },
      adaptations: {
        difficultyAdjustment: 0,
        encouragementLevel: 3
      }
    };
    
    this.conversations.set(conversationId, conversation);
    return conversationId;
  }

  updateConversation(
    conversationId: string, 
    updates: Partial<MultiTurnConversationFlow>
  ): MultiTurnConversationFlow | null {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    const updated = {
      ...conversation,
      ...updates,
      currentTurn: conversation.currentTurn + 1
    };

    this.conversations.set(conversationId, updated);
    return updated;
  }

  getConversation(conversationId: string): MultiTurnConversationFlow | null {
    return this.conversations.get(conversationId) || null;
  }

  endConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }
}

// Export singleton instance
export const conversationManager = new ConversationStateManager();