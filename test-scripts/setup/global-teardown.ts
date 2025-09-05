/**
 * Global Test Teardown for Integration Testing
 * Cleanup, reporting, and metrics collection
 */

import { FullConfig } from '@playwright/test';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  const startTime = Date.now();
  const teardownResults = {
    timestamp: new Date().toISOString(),
    cleanup: {
      artifacts: false,
      reports: false,
      logs: false
    },
    metrics: {
      totalDuration: 0,
      testFiles: 0,
      screenshots: 0,
      videos: 0,
      traces: 0
    },
    summary: null as any,
    errors: [] as string[]
  };

  try {
    // Collect test artifacts
    console.log('📊 Collecting test artifacts...');
    await collectTestArtifacts(teardownResults);

    // Generate final integration report
    console.log('📄 Generating final integration report...');
    await generateFinalReport(teardownResults);

    // Cleanup temporary files
    console.log('🗑️  Cleaning up temporary files...');
    await cleanupTempFiles(teardownResults);

    // Collect performance metrics
    console.log('⚡ Collecting performance metrics...');
    await collectPerformanceMetrics(teardownResults);

    // Generate summary report
    console.log('📋 Generating summary report...');
    const summary = await generateSummaryReport(teardownResults);
    teardownResults.summary = summary;

    // Save teardown report
    const teardownDuration = Date.now() - startTime;
    teardownResults.metrics.totalDuration = teardownDuration;
    
    saveTeardownReport(teardownResults);

    console.log(`✅ Global teardown completed in ${teardownDuration}ms`);
    
    // Print final summary
    printFinalSummary(summary);

  } catch (error) {
    const errorMsg = `Global teardown failed: ${error}`;
    teardownResults.errors.push(errorMsg);
    console.error('❌', errorMsg);
    
    saveTeardownReport(teardownResults);
  }
}

// Collect test artifacts and count files
async function collectTestArtifacts(results: any) {
  const artifactDirs = [
    'test-scripts/__tests__/screenshots',
    'test-scripts/__tests__/videos', 
    'test-scripts/__tests__/traces',
    'test-scripts/__tests__/artifacts'
  ];

  try {
    const fs = require('fs');
    
    for (const dir of artifactDirs) {
      const fullPath = join(process.cwd(), dir);
      if (existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        
        if (dir.includes('screenshots')) {
          results.metrics.screenshots = files.filter(f => f.endsWith('.png')).length;
        } else if (dir.includes('videos')) {
          results.metrics.videos = files.filter(f => f.endsWith('.webm')).length;
        } else if (dir.includes('traces')) {
          results.metrics.traces = files.filter(f => f.endsWith('.zip')).length;
        }
      }
    }
    
    results.cleanup.artifacts = true;
    console.log('✅ Test artifacts collected');
  } catch (error) {
    results.errors.push(`Artifact collection failed: ${error}`);
    console.error('❌ Artifact collection failed:', error);
  }
}

// Generate final integration report
async function generateFinalReport(results: any) {
  try {
    const reportFiles = [
      'test-scripts/__tests__/reports/playwright-results.json',
      'test-scripts/__tests__/reports/setup-report.json'
    ];

    const reports = {};
    
    for (const reportFile of reportFiles) {
      const fullPath = join(process.cwd(), reportFile);
      if (existsSync(fullPath)) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          const reportName = reportFile.split('/').pop()?.replace('.json', '') || 'unknown';
          reports[reportName] = JSON.parse(content);
        } catch (error) {
          console.log(`⚠️  Failed to read report ${reportFile}: ${error}`);
        }
      }
    }

    // Create consolidated report
    const consolidatedReport = {
      timestamp: new Date().toISOString(),
      testSuite: 'Integration Error Recovery Tests',
      version: '1.0.0',
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: !!process.env.CI
      },
      reports,
      artifacts: {
        screenshots: results.metrics.screenshots,
        videos: results.metrics.videos,
        traces: results.metrics.traces
      }
    };

    const consolidatedPath = join(process.cwd(), 'test-scripts/__tests__/reports', 'final-integration-report.json');
    writeFileSync(consolidatedPath, JSON.stringify(consolidatedReport, null, 2));
    
    results.cleanup.reports = true;
    console.log(`✅ Final integration report saved: ${consolidatedPath}`);
  } catch (error) {
    results.errors.push(`Final report generation failed: ${error}`);
    console.error('❌ Final report generation failed:', error);
  }
}

// Cleanup temporary files (optional)
async function cleanupTempFiles(results: any) {
  try {
    // Only cleanup in CI environment or if explicitly requested
    if (process.env.CI || process.env.CLEANUP_TEMP_FILES) {
      const fs = require('fs');
      const path = require('path');
      
      const tempDirs = [
        'test-scripts/__tests__/temp',
        '.playwright-temp'
      ];

      for (const dir of tempDirs) {
        const fullPath = join(process.cwd(), dir);
        if (existsSync(fullPath)) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`🗑️  Cleaned up: ${dir}`);
        }
      }
    }
    
    results.cleanup.logs = true;
    console.log('✅ Temporary files cleaned up');
  } catch (error) {
    results.errors.push(`Cleanup failed: ${error}`);
    console.error('❌ Cleanup failed:', error);
  }
}

// Collect performance metrics
async function collectPerformanceMetrics(results: any) {
  try {
    // Count test files
    const fs = require('fs');
    const testDir = join(process.cwd(), 'test-scripts/__tests__');
    
    if (existsSync(testDir)) {
      const countFiles = (dir: string): number => {
        let count = 0;
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            count += countFiles(fullPath);
          } else if (item.endsWith('.test.ts') || item.endsWith('.test.tsx') || item.endsWith('.spec.ts')) {
            count++;
          }
        }
        
        return count;
      };
      
      results.metrics.testFiles = countFiles(testDir);
    }

    console.log('✅ Performance metrics collected');
  } catch (error) {
    results.errors.push(`Performance metrics collection failed: ${error}`);
    console.error('❌ Performance metrics collection failed:', error);
  }
}

// Generate summary report
async function generateSummaryReport(results: any): Promise<any> {
  const summary = {
    timestamp: new Date().toISOString(),
    testExecution: {
      totalTestFiles: results.metrics.testFiles,
      totalDuration: results.metrics.totalDuration
    },
    artifacts: {
      screenshots: results.metrics.screenshots,
      videos: results.metrics.videos,
      traces: results.metrics.traces,
      reports: 0
    },
    cleanup: results.cleanup,
    issues: {
      totalErrors: results.errors.length,
      errors: results.errors
    },
    recommendations: generateRecommendations(results)
  };

  // Count report files
  try {
    const fs = require('fs');
    const reportsDir = join(process.cwd(), 'test-scripts/__tests__/reports');
    if (existsSync(reportsDir)) {
      const reportFiles = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json') || f.endsWith('.html'));
      summary.artifacts.reports = reportFiles.length;
    }
  } catch (error) {
    console.log('⚠️  Failed to count report files:', error);
  }

  return summary;
}

// Generate recommendations based on teardown results
function generateRecommendations(results: any): string[] {
  const recommendations = [];

  // Performance recommendations
  if (results.metrics.totalDuration > 300000) { // 5 minutes
    recommendations.push('Consider optimizing test execution time - current duration exceeds 5 minutes');
  }

  // Artifact recommendations
  if (results.metrics.screenshots > 50) {
    recommendations.push('High number of screenshots captured - review failing tests');
  }

  if (results.metrics.videos > 20) {
    recommendations.push('Many videos recorded - indicates potential test instability');
  }

  // Error recommendations
  if (results.errors.length > 0) {
    recommendations.push('Teardown encountered errors - review cleanup processes');
  }

  // General recommendations
  recommendations.push('Review integration test reports for performance insights');
  recommendations.push('Monitor error recovery metrics in production');
  recommendations.push('Update test scenarios based on real-world error patterns');

  return recommendations;
}

// Save teardown report
function saveTeardownReport(results: any) {
  const reportPath = join(process.cwd(), 'test-scripts/__tests__/reports', 'teardown-report.json');
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Teardown report saved: ${reportPath}`);
}

// Print final summary to console
function printFinalSummary(summary: any) {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 INTEGRATION TEST SUITE SUMMARY');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${summary.timestamp}`);
  console.log('');
  console.log('📊 Test Execution:');
  console.log(`  Test Files: ${summary.testExecution.totalTestFiles}`);
  console.log(`  Duration: ${Math.round(summary.testExecution.totalDuration / 1000)}s`);
  console.log('');
  console.log('📁 Artifacts Generated:');
  console.log(`  Screenshots: ${summary.artifacts.screenshots}`);
  console.log(`  Videos: ${summary.artifacts.videos}`);
  console.log(`  Traces: ${summary.artifacts.traces}`);
  console.log(`  Reports: ${summary.artifacts.reports}`);
  console.log('');
  
  if (summary.issues.totalErrors > 0) {
    console.log('⚠️  Issues Encountered:');
    summary.issues.errors.forEach((error: string, index: number) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    console.log('');
  }
  
  console.log('💡 Recommendations:');
  summary.recommendations.forEach((rec: string, index: number) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
  console.log('');
  console.log('📄 Detailed reports available in: test-scripts/__tests__/reports/');
  console.log('='.repeat(80));
  
  if (summary.issues.totalErrors === 0) {
    console.log('✅ Integration test suite completed successfully!');
  } else {
    console.log('⚠️  Integration test suite completed with warnings - please review reports');
  }
}

export default globalTeardown;