#!/usr/bin/env node

/**
 * Sentry Configuration Validation Script
 * Validates that only one Session Replay instance is configured
 */

const fs = require('fs');
const path = require('path');

function validateSentryConfig() {
  console.log('🔍 Validating Sentry Configuration...\n');
  
  const results = {
    issues: [],
    successes: [],
    warnings: []
  };
  
  // Check if redundant instrumentation-client.ts was removed
  const instrumentationClientPath = path.join(process.cwd(), 'instrumentation-client.ts');
  if (!fs.existsSync(instrumentationClientPath)) {
    results.successes.push('✅ Redundant instrumentation-client.ts removed');
  } else {
    results.issues.push('❌ instrumentation-client.ts still exists (should be removed)');
  }
  
  // Check if proper client configuration exists
  const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
  if (fs.existsSync(clientConfigPath)) {
    results.successes.push('✅ sentry.client.config.ts exists');
    
    // Check content for single Session Replay integration
    const clientContent = fs.readFileSync(clientConfigPath, 'utf8');
    const replayMatches = clientContent.match(/replayIntegration/g);
    if (replayMatches && replayMatches.length === 1) {
      results.successes.push('✅ Single replayIntegration found in client config');
    } else if (replayMatches && replayMatches.length > 1) {
      results.issues.push(`❌ Multiple replayIntegration calls found: ${replayMatches.length}`);
    } else {
      results.warnings.push('⚠️ No replayIntegration found in client config');
    }
  } else {
    results.issues.push('❌ sentry.client.config.ts missing');
  }
  
  // Check server configuration doesn't have Session Replay
  const serverConfigPath = path.join(process.cwd(), 'sentry.server.config.ts');
  if (fs.existsSync(serverConfigPath)) {
    results.successes.push('✅ sentry.server.config.ts exists');
    
    const serverContent = fs.readFileSync(serverConfigPath, 'utf8');
    if (!serverContent.includes('replayIntegration')) {
      results.successes.push('✅ Server config correctly excludes Session Replay');
    } else {
      results.issues.push('❌ Server config contains replayIntegration (should not)');
    }
  } else {
    results.issues.push('❌ sentry.server.config.ts missing');
  }
  
  // Check edge configuration doesn't have Session Replay
  const edgeConfigPath = path.join(process.cwd(), 'sentry.edge.config.ts');
  if (fs.existsSync(edgeConfigPath)) {
    results.successes.push('✅ sentry.edge.config.ts exists');
    
    const edgeContent = fs.readFileSync(edgeConfigPath, 'utf8');
    if (!edgeContent.includes('replayIntegration')) {
      results.successes.push('✅ Edge config correctly excludes Session Replay');
    } else {
      results.issues.push('❌ Edge config contains replayIntegration (not supported)');
    }
  } else {
    results.issues.push('❌ sentry.edge.config.ts missing');
  }
  
  // Check centralized configuration
  const centralConfigPath = path.join(process.cwd(), 'lib/config/sentry-config.ts');
  if (fs.existsSync(centralConfigPath)) {
    results.successes.push('✅ Centralized sentry-config.ts exists');
  } else {
    results.warnings.push('⚠️ Centralized config missing (recommended)');
  }
  
  // Check monitoring utilities
  const monitoringPath = path.join(process.cwd(), 'lib/monitoring/sentry-health.ts');
  if (fs.existsSync(monitoringPath)) {
    results.successes.push('✅ Sentry health monitoring utilities available');
  } else {
    results.warnings.push('⚠️ Sentry health monitoring utilities missing');
  }
  
  // Check environment variables
  const envExamplePath = path.join(process.cwd(), '.env.local.example');
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    if (envContent.includes('NEXT_PUBLIC_SENTRY_DSN') && envContent.includes('SENTRY_DSN')) {
      results.successes.push('✅ Environment variables configured correctly');
    } else {
      results.warnings.push('⚠️ Check environment variable configuration');
    }
  }
  
  // Print results
  console.log('SUCCESS ITEMS:');
  results.successes.forEach(success => console.log(`  ${success}`));
  
  if (results.warnings.length > 0) {
    console.log('\nWARNINGS:');
    results.warnings.forEach(warning => console.log(`  ${warning}`));
  }
  
  if (results.issues.length > 0) {
    console.log('\nISSUES:');
    results.issues.forEach(issue => console.log(`  ${issue}`));
  }
  
  console.log('\n📊 SUMMARY:');
  console.log(`✅ ${results.successes.length} success items`);
  console.log(`⚠️ ${results.warnings.length} warnings`);
  console.log(`❌ ${results.issues.length} critical issues`);
  
  if (results.issues.length === 0) {
    console.log('\n🎉 Sentry configuration validation PASSED!');
    console.log('   Single Session Replay instance configured correctly.');
    return true;
  } else {
    console.log('\n🚨 Sentry configuration validation FAILED!');
    console.log('   Please fix the critical issues above.');
    return false;
  }
}

// Run validation if called directly
if (require.main === module) {
  const success = validateSentryConfig();
  process.exit(success ? 0 : 1);
}

module.exports = { validateSentryConfig };