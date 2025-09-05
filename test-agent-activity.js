/**
 * Test script to simulate BMAD agent activity for dashboard testing
 */

const { BMADSystem, AgentType, AgentStatus, BaseAgent } = require('./lib/agents/bmad-agent-system');

// Mock agent implementation for testing
class TestAgent extends BaseAgent {
  constructor(type, maxConcurrent = 3) {
    super(type, maxConcurrent);
  }

  async process(request) {
    // Simulate processing time
    const processingTime = Math.random() * 3000 + 500; // 500ms to 3.5s
    
    // Log what we're doing
    this.logActivity('processing', {
      task: request.payload.task || 'Unknown task',
      complexity: request.payload.complexity || 'medium'
    }, request.id);

    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Simulate occasional failures (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Simulated processing error');
    }

    return {
      id: request.id,
      agentType: this.type,
      success: true,
      data: {
        result: `Processed ${request.payload.task || 'task'} successfully`,
        processingTime,
        timestamp: new Date().toISOString()
      },
      metadata: {
        confidence: Math.random() * 0.4 + 0.6 // 60-100% confidence
      }
    };
  }
}

// Initialize BMAD system with test agents
async function setupTestSystem() {
  console.log('🚀 Setting up BMAD test system...');
  
  const bmadSystem = new BMADSystem();
  
  // Create test agents
  const agents = [
    new TestAgent(AgentType.CONTENT, 2),
    new TestAgent(AgentType.CONTENT, 2),
    new TestAgent(AgentType.CONVERSATION, 3),
    new TestAgent(AgentType.CONVERSATION, 3),
    new TestAgent(AgentType.CONVERSATION, 3),
    new TestAgent(AgentType.ANALYSIS, 2),
    new TestAgent(AgentType.ANALYSIS, 2),
    new TestAgent(AgentType.ASSESSMENT, 2),
    new TestAgent(AgentType.ASSESSMENT, 2),
    new TestAgent(AgentType.PLANNING, 1)
  ];

  await bmadSystem.initialize(agents);
  
  console.log(`✅ Initialized ${agents.length} test agents`);
  console.log('📊 Dashboard should be available at: http://localhost:3001/agents/dashboard');
  
  return bmadSystem;
}

// Simulate various agent activities
async function simulateActivity(bmadSystem) {
  const activities = [
    { type: AgentType.CONTENT, task: 'Generate lesson content', complexity: 'high' },
    { type: AgentType.CONTENT, task: 'Create quiz questions', complexity: 'medium' },
    { type: AgentType.CONVERSATION, task: 'Process student question', complexity: 'medium' },
    { type: AgentType.CONVERSATION, task: 'Provide tutoring assistance', complexity: 'high' },
    { type: AgentType.ANALYSIS, task: 'Analyze learning progress', complexity: 'high' },
    { type: AgentType.ANALYSIS, task: 'Generate performance report', complexity: 'medium' },
    { type: AgentType.ASSESSMENT, task: 'Create adaptive assessment', complexity: 'high' },
    { type: AgentType.ASSESSMENT, task: 'Grade student responses', complexity: 'low' },
    { type: AgentType.PLANNING, task: 'Plan learning path', complexity: 'high' }
  ];

  console.log('🎭 Starting activity simulation...');
  
  let activityCount = 0;
  
  setInterval(async () => {
    try {
      const activity = activities[Math.floor(Math.random() * activities.length)];
      const sessionId = bmadSystem.createSession(`user-${Math.floor(Math.random() * 100)}`, 'student');
      
      console.log(`📋 Activity ${++activityCount}: ${activity.task} (${activity.type})`);
      
      const response = await bmadSystem.processRequest(
        sessionId,
        activity.type,
        activity,
        {
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          timeout: 10000
        }
      );
      
      if (response.success) {
        console.log(`✅ Completed: ${activity.task} in ${response.processingTime}ms`);
      } else {
        console.log(`❌ Failed: ${activity.task} - ${response.error}`);
      }
      
    } catch (error) {
      console.error('💥 Activity simulation error:', error.message);
    }
  }, Math.random() * 5000 + 2000); // Random interval between 2-7 seconds
}

// Main execution
async function main() {
  try {
    const bmadSystem = await setupTestSystem();
    
    // Start activity simulation
    await simulateActivity(bmadSystem);
    
    console.log('🎯 Test system running! Check your dashboard for real-time activity.');
    console.log('💡 Press Ctrl+C to stop the simulation.');
    
  } catch (error) {
    console.error('❌ Failed to start test system:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping agent activity simulation...');
  process.exit(0);
});

if (require.main === module) {
  main();
}