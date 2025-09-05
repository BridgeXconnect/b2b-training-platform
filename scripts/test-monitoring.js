#!/usr/bin/env node

/**
 * Test script for monitoring system
 * Run with: node scripts/test-monitoring.js
 */

const { monitoringScheduler } = require('../lib/services/monitoring-scheduler');
const { startupInitializer } = require('../lib/services/startup-initializer');

async function testMonitoringSystem() {
  console.log('🧪 Testing Monitoring System...\n');

  try {
    // Test startup initializer
    console.log('1. Testing Startup Initializer...');
    const startupStatus = startupInitializer.getStatus();
    console.log(`   Initial status: ${startupStatus.isInitialized ? 'Initialized' : 'Not initialized'}`);
    
    if (!startupStatus.isInitialized) {
      console.log('   Initializing...');
      await startupInitializer.initialize();
      console.log('   ✅ Startup initialization completed');
    }

    // Test scheduler
    console.log('\n2. Testing Monitoring Scheduler...');
    const schedulerStatus = monitoringScheduler.getStatus();
    console.log(`   Scheduler running: ${schedulerStatus.isRunning}`);
    console.log(`   Health status: ${schedulerStatus.health.isHealthy ? 'Healthy' : 'Unhealthy'}`);
    console.log(`   Uptime: ${Math.round(schedulerStatus.uptime / 1000)}s`);

    if (!schedulerStatus.isRunning) {
      console.log('   Starting scheduler...');
      await monitoringScheduler.start();
      console.log('   ✅ Scheduler started');
    }

    // Wait a bit and check health
    console.log('\n3. Waiting 5 seconds for health check...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const updatedStatus = monitoringScheduler.getStatus();
    console.log(`   Updated health: ${updatedStatus.health.isHealthy ? 'Healthy' : 'Unhealthy'}`);
    console.log(`   Consecutive failures: ${updatedStatus.health.consecutiveFailures}`);

    // Test graceful shutdown
    console.log('\n4. Testing graceful shutdown...');
    await monitoringScheduler.stop(true);
    console.log('   ✅ Graceful shutdown completed');

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n⏹️ Received SIGINT, shutting down...');
  try {
    await startupInitializer.shutdown();
    console.log('✅ Clean shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Shutdown error:', error);
    process.exit(1);
  }
});

// Run the test
testMonitoringSystem();