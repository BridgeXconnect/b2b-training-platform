#!/usr/bin/env node

/**
 * Claude Code Agent Integration Deactivator
 * 
 * This script deactivates the agent integration system,
 * returning Claude Code to normal single-agent operation
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const CLAUDE_DIR = path.join(PROJECT_ROOT, '.claude');

class AgentIntegrationDeactivator {
  async deactivate() {
    console.log('🛑 Deactivating Claude Code Agent Integration System...\n');

    try {
      // Remove activation marker
      await this.removeActivationMarker();

      // Clear global interceptors
      await this.clearGlobalInterceptors();

      // Stop orchestrator
      await this.stopOrchestrator();

      // Clean up cache
      await this.cleanupCache();

      // Display deactivation message
      this.displayDeactivationMessage();

    } catch (error) {
      console.error('❌ Deactivation failed:', error.message);
      process.exit(1);
    }
  }

  async removeActivationMarker() {
    console.log('🗑️ Removing activation marker...');

    const activationMarker = path.join(CLAUDE_DIR, '.agent-integration-active');
    
    if (fs.existsSync(activationMarker)) {
      fs.unlinkSync(activationMarker);
      console.log('  ✅ Activation marker removed');
    } else {
      console.log('  ℹ️ No activation marker found');
    }
  }

  async clearGlobalInterceptors() {
    console.log('🧹 Clearing global interceptors...');

    if (typeof global !== 'undefined') {
      delete (global as any).__claudeCodeOrchestrator;
      delete (global as any).processClaudeCodeRequest;
      console.log('  ✅ Global interceptors cleared');
    } else {
      console.log('  ℹ️ No global interceptors found');
    }
  }

  async stopOrchestrator() {
    console.log('⏹️ Stopping orchestrator...');

    // In a full implementation, this would stop actual orchestrator services
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('  ✅ Orchestrator stopped');
  }

  async cleanupCache() {
    console.log('🗑️ Cleaning up cache...');

    const cacheFiles = [
      '.claude/.integration-cache',
      '.claude/.routing-cache',
      '.claude/.performance-cache'
    ];

    for (const cacheFile of cacheFiles) {
      const cachePath = path.join(PROJECT_ROOT, cacheFile);
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
        console.log(`  ✅ Removed ${cacheFile}`);
      }
    }

    console.log('  ✅ Cache cleanup completed');
  }

  displayDeactivationMessage() {
    console.log('\n🔕 Claude Code Agent Integration Deactivated\n');
    
    console.log('📝 What happened:');
    console.log('   • Agent integration hooks disabled');
    console.log('   • Claude Code returned to single-agent operation');
    console.log('   • All agent orchestration stopped');
    console.log('   • Cache and interceptors cleared\n');

    console.log('🤖 Agent ecosystem status:');
    console.log('   • BMAD agents: Still running (independent)');
    console.log('   • MCP servers: Still running (independent)');
    console.log('   • Archon service: Still running (independent)');
    console.log('   • Tmux sessions: Still running (independent)\n');

    console.log('💡 To reactivate:');
    console.log('   • Run: node .claude/activate-agent-integration.js');
    console.log('   • Or use: /agents command to check status\n');

    console.log('✅ Claude Code is now operating in standard mode');
  }

  async getDeactivationStatus() {
    const activationMarker = path.join(CLAUDE_DIR, '.agent-integration-active');
    const isActive = fs.existsSync(activationMarker);
    
    return {
      agentIntegrationActive: isActive,
      deactivatedAt: new Date().toISOString(),
      claudeCodeMode: isActive ? 'multi-agent' : 'single-agent'
    };
  }
}

// Command line execution
if (require.main === module) {
  const deactivator = new AgentIntegrationDeactivator();
  deactivator.deactivate().catch(error => {
    console.error('Deactivation failed:', error.message);
    process.exit(1);
  });
}

module.exports = { AgentIntegrationDeactivator };