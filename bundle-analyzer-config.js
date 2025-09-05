/**
 * Webpack Bundle Analyzer Configuration
 * 
 * Provides comprehensive bundle analysis for the AI Course Platform
 * to identify optimization opportunities and monitor bundle sizes.
 */

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const path = require('path');

/**
 * Bundle analysis configuration
 */
const bundleAnalyzerConfig = {
  // Analysis mode: 'server', 'static', or 'json'
  analyzerMode: process.env.BUNDLE_ANALYZE_MODE || 'server',
  
  // Server configuration
  analyzerHost: process.env.BUNDLE_ANALYZE_HOST || '127.0.0.1',
  analyzerPort: process.env.BUNDLE_ANALYZE_PORT || 8888,
  
  // Static report configuration
  reportFilename: path.join(process.cwd(), 'reports', 'bundle-analysis.html'),
  
  // JSON report configuration for CI/CD
  generateStatsFile: true,
  statsFilename: path.join(process.cwd(), 'reports', 'bundle-stats.json'),
  
  // Analysis options
  openAnalyzer: process.env.NODE_ENV !== 'production',
  logLevel: 'info',
  
  // Custom analyzer options
  defaultSizes: 'gzip', // 'stat', 'parsed', or 'gzip'
  excludeAssets: [
    /\.map$/,
    /^sourcemaps\//,
    /hot-update/,
  ],
};

/**
 * Performance budgets for different bundle types
 */
const performanceBudgets = {
  // Main application bundle
  main: {
    maxSize: 500 * 1024, // 500KB
    warning: 400 * 1024, // 400KB
  },
  
  // Vendor libraries bundle
  vendor: {
    maxSize: 800 * 1024, // 800KB
    warning: 600 * 1024, // 600KB
  },
  
  // Individual chunks
  chunk: {
    maxSize: 250 * 1024, // 250KB
    warning: 200 * 1024, // 200KB
  },
  
  // Initial bundle (critical path)
  initial: {
    maxSize: 300 * 1024, // 300KB
    warning: 250 * 1024, // 250KB
  },
  
  // Async chunks
  async: {
    maxSize: 500 * 1024, // 500KB
    warning: 400 * 1024, // 400KB
  },
};

/**
 * Create bundle analyzer plugin with custom configuration
 */
function createBundleAnalyzerPlugin(options = {}) {
  const config = {
    ...bundleAnalyzerConfig,
    ...options,
  };
  
  return new BundleAnalyzerPlugin(config);
}

/**
 * Analyze bundle and provide recommendations
 */
function analyzeBundleStats(stats) {
  const assets = stats.assets || [];
  const chunks = stats.chunks || [];
  
  const analysis = {
    totalSize: 0,
    bundles: {},
    warnings: [],
    recommendations: [],
    largestAssets: [],
    unusedCode: [],
  };
  
  // Analyze assets
  assets.forEach(asset => {
    analysis.totalSize += asset.size;
    
    // Categorize bundles
    let category = 'other';
    if (asset.name.includes('main')) category = 'main';
    else if (asset.name.includes('vendor') || asset.name.includes('lib')) category = 'vendor';
    else if (asset.name.includes('chunk')) category = 'chunk';
    else if (asset.name.includes('runtime')) category = 'runtime';
    
    if (!analysis.bundles[category]) {
      analysis.bundles[category] = { size: 0, assets: [] };
    }
    
    analysis.bundles[category].size += asset.size;
    analysis.bundles[category].assets.push(asset);
    
    // Check against performance budgets
    const budget = performanceBudgets[category];
    if (budget) {
      if (asset.size > budget.maxSize) {
        analysis.warnings.push({
          type: 'size_exceeded',
          asset: asset.name,
          category,
          size: asset.size,
          limit: budget.maxSize,
          severity: 'high',
        });
      } else if (asset.size > budget.warning) {
        analysis.warnings.push({
          type: 'size_warning',
          asset: asset.name,
          category,
          size: asset.size,
          limit: budget.warning,
          severity: 'medium',
        });
      }
    }
  });
  
  // Find largest assets
  analysis.largestAssets = assets
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .map(asset => ({
      name: asset.name,
      size: asset.size,
      sizeFormatted: formatBytes(asset.size),
    }));
  
  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);
  
  return analysis;
}

/**
 * Generate optimization recommendations based on bundle analysis
 */
function generateRecommendations(analysis) {
  const recommendations = [];
  
  // Large bundle recommendations
  if (analysis.totalSize > 2 * 1024 * 1024) { // 2MB
    recommendations.push({
      type: 'bundle_size',
      priority: 'high',
      title: 'Overall bundle size is large',
      description: `Total bundle size is ${formatBytes(analysis.totalSize)}. Consider implementing code splitting and lazy loading.`,
      actions: [
        'Implement dynamic imports for route-based code splitting',
        'Use React.lazy() for component-level code splitting',
        'Analyze and remove unused dependencies',
        'Optimize images and assets',
      ],
    });
  }
  
  // Vendor bundle optimization
  if (analysis.bundles.vendor && analysis.bundles.vendor.size > 800 * 1024) {
    recommendations.push({
      type: 'vendor_optimization',
      priority: 'medium',
      title: 'Vendor bundle is large',
      description: `Vendor bundle is ${formatBytes(analysis.bundles.vendor.size)}. Consider optimizing third-party dependencies.`,
      actions: [
        'Use tree shaking to eliminate unused code',
        'Consider lighter alternatives to heavy libraries',
        'Implement selective imports (e.g., import only needed Lodash functions)',
        'Use module replacement for development-only dependencies',
      ],
    });
  }
  
  // Chunk optimization
  const largeChunks = Object.entries(analysis.bundles)
    .filter(([category, bundle]) => category === 'chunk' && bundle.size > 300 * 1024);
  
  if (largeChunks.length > 0) {
    recommendations.push({
      type: 'chunk_optimization',
      priority: 'medium',
      title: 'Large chunks detected',
      description: `${largeChunks.length} chunks are larger than 300KB. Consider further splitting.`,
      actions: [
        'Split large chunks into smaller, more focused chunks',
        'Implement granular lazy loading',
        'Use webpack SplitChunksPlugin optimization',
        'Consider moving shared utilities to a separate chunk',
      ],
    });
  }
  
  // Performance recommendations
  if (analysis.warnings.filter(w => w.severity === 'high').length > 0) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      title: 'Performance budget exceeded',
      description: 'Several assets exceed their performance budgets.',
      actions: [
        'Implement compression (gzip/brotli)',
        'Use CDN for static assets',
        'Implement resource preloading for critical assets',
        'Consider service worker for caching',
      ],
    });
  }
  
  // AI/ML specific recommendations
  if (analysis.bundles.vendor && 
      analysis.bundles.vendor.assets.some(asset => 
        asset.name.includes('openai') || 
        asset.name.includes('langchain') || 
        asset.name.includes('copilotkit')
      )) {
    recommendations.push({
      type: 'ai_optimization',
      priority: 'medium',
      title: 'AI/ML libraries detected',
      description: 'AI/ML libraries can be large. Consider optimization strategies.',
      actions: [
        'Lazy load AI components only when needed',
        'Consider server-side AI processing to reduce client bundle',
        'Implement progressive loading for AI features',
        'Use web workers for AI computations to avoid blocking main thread',
      ],
    });
  }
  
  return recommendations;
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate bundle report
 */
function generateBundleReport(stats, options = {}) {
  const analysis = analyzeBundleStats(stats);
  
  const report = {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    analysis,
    performanceBudgets,
    summary: {
      totalSize: analysis.totalSize,
      totalSizeFormatted: formatBytes(analysis.totalSize),
      bundleCount: Object.keys(analysis.bundles).length,
      warningCount: analysis.warnings.length,
      recommendationCount: analysis.recommendations.length,
      largestBundle: analysis.largestAssets[0]?.name || 'N/A',
    },
  };
  
  // Save report if requested
  if (options.saveReport) {
    const fs = require('fs');
    const reportPath = path.join(process.cwd(), 'reports', 'bundle-report.json');
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Bundle report saved to: ${reportPath}`);
  }
  
  return report;
}

/**
 * Webpack plugin to integrate bundle analysis
 */
class BundleAnalysisPlugin {
  constructor(options = {}) {
    this.options = {
      saveReport: true,
      threshold: 1024 * 1024, // 1MB
      ...options,
    };
  }
  
  apply(compiler) {
    compiler.hooks.done.tap('BundleAnalysisPlugin', (stats) => {
      const statsJson = stats.toJson({
        assets: true,
        chunks: true,
        modules: false,
        children: false,
      });
      
      const report = generateBundleReport(statsJson, this.options);
      
      // Log warnings
      if (report.analysis.warnings.length > 0) {
        console.warn('\n🚨 Bundle Analysis Warnings:');
        report.analysis.warnings.forEach(warning => {
          console.warn(`  ${warning.severity.toUpperCase()}: ${warning.asset} (${formatBytes(warning.size)})`);
        });
      }
      
      // Log recommendations
      if (report.analysis.recommendations.length > 0) {
        console.log('\n💡 Bundle Optimization Recommendations:');
        report.analysis.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec.title} (${rec.priority} priority)`);
        });
      }
      
      console.log(`\n📊 Bundle Summary: ${report.summary.totalSizeFormatted} across ${report.summary.bundleCount} bundles`);
    });
  }
}

module.exports = {
  bundleAnalyzerConfig,
  performanceBudgets,
  createBundleAnalyzerPlugin,
  analyzeBundleStats,
  generateRecommendations,
  generateBundleReport,
  BundleAnalysisPlugin,
  formatBytes,
};

// CLI usage
if (require.main === module) {
  const statsPath = process.argv[2];
  
  if (!statsPath) {
    console.error('Usage: node bundle-analyzer-config.js <path-to-stats.json>');
    process.exit(1);
  }
  
  try {
    const fs = require('fs');
    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    const report = generateBundleReport(stats, { saveReport: true });
    
    console.log('\n📊 Bundle Analysis Complete!');
    console.log(`Total Size: ${report.summary.totalSizeFormatted}`);
    console.log(`Warnings: ${report.summary.warningCount}`);
    console.log(`Recommendations: ${report.summary.recommendationCount}`);
    
    if (report.analysis.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      report.analysis.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.title}`);
        console.log(`     ${rec.description}`);
      });
    }
  } catch (error) {
    console.error('Error analyzing bundle:', error.message);
    process.exit(1);
  }
}