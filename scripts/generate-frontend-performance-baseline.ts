#!/usr/bin/env npx tsx

/**
 * Frontend Performance Baseline Generator
 * 
 * Comprehensive performance analysis and baseline establishment
 * for the AI Course Platform frontend application.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { analyzeBundleStats, generateBundleReport } from '../bundle-analyzer-config';

interface FrontendPerformanceBaseline {
  timestamp: string;
  version: string;
  environment: string;
  
  // Bundle Analysis
  bundleAnalysis: {
    totalSize: number;
    totalSizeFormatted: string;
    bundles: Record<string, {
      size: number;
      sizeFormatted: string;
      files: number;
      largest: string;
    }>;
    recommendations: Array<{
      type: string;
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      actions: string[];
    }>;
  };
  
  // Core Web Vitals Targets
  webVitalsTargets: {
    lcp: { target: number; current?: number; status: 'good' | 'needs-improvement' | 'poor' | 'unknown' };
    fid: { target: number; current?: number; status: 'good' | 'needs-improvement' | 'poor' | 'unknown' };
    cls: { target: number; current?: number; status: 'good' | 'needs-improvement' | 'poor' | 'unknown' };
    fcp: { target: number; current?: number; status: 'good' | 'needs-improvement' | 'poor' | 'unknown' };
    ttfb: { target: number; current?: number; status: 'good' | 'needs-improvement' | 'poor' | 'unknown' };
  };
  
  // Component Analysis
  componentAnalysis: {
    totalComponents: number;
    heavyComponents: string[];
    optimizationOpportunities: string[];
    renderPerformance: {
      averageRenderTime: number;
      slowestComponents: Array<{
        name: string;
        renderTime: number;
        complexity: 'low' | 'medium' | 'high';
      }>;
    };
  };
  
  // Asset Optimization
  assetOptimization: {
    images: {
      total: number;
      optimized: number;
      unoptimized: number;
      recommendations: string[];
    };
    fonts: {
      total: number;
      preloaded: number;
      recommendations: string[];
    };
    css: {
      totalSize: number;
      criticalPathSize: number;
      unusedCSS: number;
      recommendations: string[];
    };
    javascript: {
      totalSize: number;
      treeShakeable: number;
      duplicateCode: number;
      recommendations: string[];
    };
  };
  
  // Network Performance
  networkOptimization: {
    httpRequests: number;
    cachingStrategy: string[];
    compressionEnabled: boolean;
    cdnUsage: boolean;
    recommendations: string[];
  };
  
  // Accessibility Performance
  accessibilityPerformance: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  
  // Overall Performance Score
  performanceScore: {
    overall: number;
    breakdown: {
      bundleSize: number;
      webVitals: number;
      componentPerformance: number;
      assetOptimization: number;
      networkOptimization: number;
      accessibility: number;
    };
  };
  
  // Optimization Roadmap
  optimizationRoadmap: Array<{
    phase: number;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    tasks: string[];
    estimatedImprovement: string;
  }>;
}

class FrontendPerformanceAnalyzer {
  private projectRoot: string;
  private reportsDir: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.reportsDir = path.join(this.projectRoot, 'reports', 'frontend-performance');
    
    this.ensureReportsDirectory();
  }

  private ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async generateBaseline(): Promise<FrontendPerformanceBaseline> {
    console.log('🚀 Generating Frontend Performance Baseline...\n');

    const baseline: FrontendPerformanceBaseline = {
      timestamp: new Date().toISOString(),
      version: this.getVersion(),
      environment: process.env.NODE_ENV || 'development',
      bundleAnalysis: await this.analyzeBundles(),
      webVitalsTargets: this.getWebVitalsTargets(),
      componentAnalysis: await this.analyzeComponents(),
      assetOptimization: await this.analyzeAssets(),
      networkOptimization: await this.analyzeNetwork(),
      accessibilityPerformance: await this.analyzeAccessibility(),
      performanceScore: { overall: 0, breakdown: { bundleSize: 0, webVitals: 0, componentPerformance: 0, assetOptimization: 0, networkOptimization: 0, accessibility: 0 } },
      optimizationRoadmap: [],
    };

    // Calculate performance scores
    baseline.performanceScore = this.calculatePerformanceScore(baseline);
    
    // Generate optimization roadmap
    baseline.optimizationRoadmap = this.generateOptimizationRoadmap(baseline);

    // Save baseline
    await this.saveBaseline(baseline);

    console.log('✅ Frontend Performance Baseline Generated Successfully!\n');
    this.printSummary(baseline);

    return baseline;
  }

  private getVersion(): string {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8')
      );
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  private async analyzeBundles(): Promise<FrontendPerformanceBaseline['bundleAnalysis']> {
    console.log('📦 Analyzing bundle sizes...');

    try {
      // Build the project to get accurate bundle sizes
      console.log('  Building project for analysis...');
      execSync('npm run build', { cwd: this.projectRoot, stdio: 'pipe' });

      // Analyze .next build output
      const nextDir = path.join(this.projectRoot, '.next');
      const staticDir = path.join(nextDir, 'static');
      
      if (!fs.existsSync(staticDir)) {
        throw new Error('Build output not found. Please run npm run build first.');
      }

      const bundles: Record<string, any> = {};
      let totalSize = 0;

      // Analyze chunks
      const chunksDir = path.join(staticDir, 'chunks');
      if (fs.existsSync(chunksDir)) {
        const chunkFiles = fs.readdirSync(chunksDir);
        const chunkSizes = chunkFiles
          .filter(file => file.endsWith('.js'))
          .map(file => {
            const size = fs.statSync(path.join(chunksDir, file)).size;
            totalSize += size;
            return { name: file, size };
          })
          .sort((a, b) => b.size - a.size);

        bundles.chunks = {
          size: chunkSizes.reduce((sum, chunk) => sum + chunk.size, 0),
          sizeFormatted: this.formatBytes(chunkSizes.reduce((sum, chunk) => sum + chunk.size, 0)),
          files: chunkSizes.length,
          largest: chunkSizes[0]?.name || 'N/A',
        };
      }

      // Analyze CSS
      const cssDir = path.join(staticDir, 'css');
      if (fs.existsSync(cssDir)) {
        const cssFiles = fs.readdirSync(cssDir);
        const cssSize = cssFiles
          .filter(file => file.endsWith('.css'))
          .reduce((sum, file) => {
            const size = fs.statSync(path.join(cssDir, file)).size;
            totalSize += size;
            return sum + size;
          }, 0);

        bundles.css = {
          size: cssSize,
          sizeFormatted: this.formatBytes(cssSize),
          files: cssFiles.length,
          largest: 'Combined CSS',
        };
      }

      return {
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        bundles,
        recommendations: this.getBundleRecommendations(totalSize, bundles),
      };
    } catch (error) {
      console.warn('  Warning: Could not analyze bundles:', error);
      return {
        totalSize: 0,
        totalSizeFormatted: '0 Bytes',
        bundles: {},
        recommendations: ['Enable bundle analysis by ensuring build process completes successfully'],
      };
    }
  }

  private getBundleRecommendations(totalSize: number, bundles: Record<string, any>): Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actions: string[];
  }> {
    const recommendations = [];

    // Large bundle size
    if (totalSize > 2 * 1024 * 1024) { // 2MB
      recommendations.push({
        type: 'bundle_size',
        priority: 'high' as const,
        title: 'Large Bundle Size',
        description: `Total bundle size is ${this.formatBytes(totalSize)}. This may impact loading performance.`,
        actions: [
          'Implement code splitting with dynamic imports',
          'Use React.lazy() for component-level splitting',
          'Analyze and remove unused dependencies',
          'Enable tree shaking optimization',
        ],
      });
    }

    // Large chunk analysis
    if (bundles.chunks && bundles.chunks.size > 1 * 1024 * 1024) { // 1MB
      recommendations.push({
        type: 'chunk_optimization',
        priority: 'medium' as const,
        title: 'Large JavaScript Chunks',
        description: 'JavaScript chunks are large and may benefit from further splitting.',
        actions: [
          'Split large routes into separate chunks',
          'Move vendor libraries to separate chunks',
          'Implement granular code splitting',
          'Use webpack chunk optimization',
        ],
      });
    }

    return recommendations;
  }

  private getWebVitalsTargets(): FrontendPerformanceBaseline['webVitalsTargets'] {
    return {
      lcp: { target: 2500, status: 'unknown' },
      fid: { target: 100, status: 'unknown' },
      cls: { target: 0.1, status: 'unknown' },
      fcp: { target: 1800, status: 'unknown' },
      ttfb: { target: 800, status: 'unknown' },
    };
  }

  private async analyzeComponents(): Promise<FrontendPerformanceBaseline['componentAnalysis']> {
    console.log('🧩 Analyzing React components...');

    const componentsDir = path.join(this.projectRoot, 'components');
    const appDir = path.join(this.projectRoot, 'app');
    
    let totalComponents = 0;
    const heavyComponents: string[] = [];
    const optimizationOpportunities: string[] = [];

    // Count components
    if (fs.existsSync(componentsDir)) {
      totalComponents += this.countFilesRecursively(componentsDir, /\.(tsx|jsx)$/);
    }
    if (fs.existsSync(appDir)) {
      totalComponents += this.countFilesRecursively(appDir, /\.(tsx|jsx)$/);
    }

    // Analyze for heavy components (simplified heuristic)
    const componentFiles = this.findFilesRecursively(componentsDir, /\.(tsx|jsx)$/);
    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const size = content.length;
      
      // Consider components over 10KB as potentially heavy
      if (size > 10 * 1024) {
        heavyComponents.push(path.basename(file));
      }

      // Look for optimization opportunities
      if (content.includes('useEffect') && !content.includes('useMemo')) {
        optimizationOpportunities.push(`Consider useMemo in ${path.basename(file)}`);
      }
      if (content.includes('useState') && content.split('useState').length > 5) {
        optimizationOpportunities.push(`Multiple state variables in ${path.basename(file)} - consider useReducer`);
      }
    }

    return {
      totalComponents,
      heavyComponents: heavyComponents.slice(0, 10), // Top 10
      optimizationOpportunities: optimizationOpportunities.slice(0, 5), // Top 5
      renderPerformance: {
        averageRenderTime: 0, // Would need runtime profiling
        slowestComponents: [], // Would need runtime profiling
      },
    };
  }

  private async analyzeAssets(): Promise<FrontendPerformanceBaseline['assetOptimization']> {
    console.log('🖼️  Analyzing assets optimization...');

    const publicDir = path.join(this.projectRoot, 'public');
    const assetsDir = path.join(this.projectRoot, 'assets');
    
    const images = {
      total: 0,
      optimized: 0,
      unoptimized: 0,
      recommendations: [] as string[],
    };

    const fonts = {
      total: 0,
      preloaded: 0,
      recommendations: [] as string[],
    };

    const css = {
      totalSize: 0,
      criticalPathSize: 0,
      unusedCSS: 0,
      recommendations: [] as string[],
    };

    const javascript = {
      totalSize: 0,
      treeShakeable: 0,
      duplicateCode: 0,
      recommendations: [] as string[],
    };

    // Analyze images
    if (fs.existsSync(publicDir)) {
      const imageFiles = this.findFilesRecursively(publicDir, /\.(jpg|jpeg|png|gif|webp|svg)$/i);
      images.total = imageFiles.length;
      
      imageFiles.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (ext === '.webp' || ext === '.svg') {
          images.optimized++;
        } else {
          images.unoptimized++;
        }
      });

      if (images.unoptimized > 0) {
        images.recommendations.push('Convert images to WebP format for better compression');
        images.recommendations.push('Use next/image component for automatic optimization');
      }
    }

    // Analyze CSS
    const stylesDir = path.join(this.projectRoot, 'styles');
    if (fs.existsSync(stylesDir)) {
      const cssFiles = this.findFilesRecursively(stylesDir, /\.css$/);
      css.totalSize = cssFiles.reduce((sum, file) => {
        return sum + fs.statSync(file).size;
      }, 0);

      css.recommendations.push('Implement critical CSS extraction');
      css.recommendations.push('Use CSS purging to remove unused styles');
    }

    return {
      images,
      fonts,
      css,
      javascript,
    };
  }

  private async analyzeNetwork(): Promise<FrontendPerformanceBaseline['networkOptimization']> {
    console.log('🌐 Analyzing network optimization...');

    // Analyze Next.js configuration
    const nextConfigPath = path.join(this.projectRoot, 'next.config.js');
    let compressionEnabled = false;
    let cdnUsage = false;

    if (fs.existsSync(nextConfigPath)) {
      const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
      compressionEnabled = nextConfig.includes('compress: true');
      cdnUsage = nextConfig.includes('assetPrefix') || nextConfig.includes('cdn');
    }

    const recommendations = [];
    
    if (!compressionEnabled) {
      recommendations.push('Enable gzip/brotli compression');
    }
    
    if (!cdnUsage) {
      recommendations.push('Consider using a CDN for static assets');
    }

    recommendations.push('Implement service worker for caching');
    recommendations.push('Use HTTP/2 server push for critical resources');

    return {
      httpRequests: 0, // Would need runtime analysis
      cachingStrategy: ['Static file caching', 'API response caching'],
      compressionEnabled,
      cdnUsage,
      recommendations,
    };
  }

  private async analyzeAccessibility(): Promise<FrontendPerformanceBaseline['accessibilityPerformance']> {
    console.log('♿ Analyzing accessibility performance...');

    // Basic accessibility analysis
    const componentFiles = this.findFilesRecursively(
      path.join(this.projectRoot, 'components'),
      /\.(tsx|jsx)$/
    );

    const issues = [];
    const recommendations = [];

    let hasAriaLabels = 0;
    let totalInteractiveElements = 0;

    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Count aria labels
      if (content.includes('aria-label') || content.includes('aria-labelledby')) {
        hasAriaLabels++;
      }

      // Count interactive elements
      if (content.includes('<button') || content.includes('<input') || content.includes('<select')) {
        totalInteractiveElements++;
      }

      // Check for common issues
      if (content.includes('<img') && !content.includes('alt=')) {
        issues.push(`Missing alt text in ${path.basename(file)}`);
      }
    }

    const score = totalInteractiveElements > 0 ? 
      Math.round((hasAriaLabels / totalInteractiveElements) * 100) : 100;

    if (score < 80) {
      recommendations.push('Add aria-labels to interactive elements');
      recommendations.push('Implement proper heading hierarchy');
      recommendations.push('Ensure adequate color contrast ratios');
    }

    return {
      score,
      issues: issues.slice(0, 5), // Top 5 issues
      recommendations,
    };
  }

  private calculatePerformanceScore(baseline: FrontendPerformanceBaseline) {
    // Bundle size score (smaller is better)
    const bundleScore = Math.max(0, 100 - (baseline.bundleAnalysis.totalSize / (1024 * 1024)) * 20);
    
    // Web vitals score (would be updated with actual measurements)
    const webVitalsScore = 80; // Placeholder
    
    // Component performance score
    const componentScore = Math.max(0, 100 - baseline.componentAnalysis.heavyComponents.length * 10);
    
    // Asset optimization score
    const imageOptimizationRatio = baseline.assetOptimization.images.total > 0 ?
      (baseline.assetOptimization.images.optimized / baseline.assetOptimization.images.total) * 100 : 100;
    
    // Network optimization score
    const networkScore = (baseline.networkOptimization.compressionEnabled ? 40 : 0) +
                        (baseline.networkOptimization.cdnUsage ? 40 : 0) + 20;
    
    // Accessibility score
    const accessibilityScore = baseline.accessibilityPerformance.score;

    const overall = Math.round(
      (bundleScore * 0.2) +
      (webVitalsScore * 0.25) +
      (componentScore * 0.15) +
      (imageOptimizationRatio * 0.15) +
      (networkScore * 0.15) +
      (accessibilityScore * 0.1)
    );

    return {
      overall,
      breakdown: {
        bundleSize: Math.round(bundleScore),
        webVitals: Math.round(webVitalsScore),
        componentPerformance: Math.round(componentScore),
        assetOptimization: Math.round(imageOptimizationRatio),
        networkOptimization: Math.round(networkScore),
        accessibility: Math.round(accessibilityScore),
      },
    };
  }

  private generateOptimizationRoadmap(baseline: FrontendPerformanceBaseline) {
    const roadmap = [];

    // Phase 1: Quick wins
    roadmap.push({
      phase: 1,
      title: 'Quick Performance Wins',
      description: 'Low-effort, high-impact optimizations',
      impact: 'high' as const,
      effort: 'low' as const,
      tasks: [
        'Enable compression in Next.js config',
        'Add next/image to existing images',
        'Implement lazy loading for components',
        'Add performance monitoring',
      ],
      estimatedImprovement: '15-25% performance improvement',
    });

    // Phase 2: Bundle optimization
    if (baseline.bundleAnalysis.totalSize > 1024 * 1024) {
      roadmap.push({
        phase: 2,
        title: 'Bundle Size Optimization',
        description: 'Reduce bundle sizes through code splitting and optimization',
        impact: 'high' as const,
        effort: 'medium' as const,
        tasks: [
          'Implement route-based code splitting',
          'Split vendor libraries into separate chunks',
          'Remove unused dependencies',
          'Enable tree shaking',
        ],
        estimatedImprovement: '20-30% bundle size reduction',
      });
    }

    // Phase 3: Advanced optimizations
    roadmap.push({
      phase: 3,
      title: 'Advanced Performance Optimization',
      description: 'Advanced techniques for maximum performance',
      impact: 'medium' as const,
      effort: 'high' as const,
      tasks: [
        'Implement service worker for caching',
        'Add CDN for static assets',
        'Optimize component rendering with profiling',
        'Implement prefetching strategies',
      ],
      estimatedImprovement: '10-20% additional improvement',
    });

    return roadmap;
  }

  private countFilesRecursively(dir: string, pattern: RegExp): number {
    if (!fs.existsSync(dir)) return 0;
    
    let count = 0;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        count += this.countFilesRecursively(filePath, pattern);
      } else if (pattern.test(file)) {
        count++;
      }
    }
    
    return count;
  }

  private findFilesRecursively(dir: string, pattern: RegExp): string[] {
    if (!fs.existsSync(dir)) return [];
    
    const files: string[] = [];
    const dirFiles = fs.readdirSync(dir);
    
    for (const file of dirFiles) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        files.push(...this.findFilesRecursively(filePath, pattern));
      } else if (pattern.test(file)) {
        files.push(filePath);
      }
    }
    
    return files;
  }

  private async saveBaseline(baseline: FrontendPerformanceBaseline) {
    const filename = `frontend-performance-baseline-${baseline.timestamp.split('T')[0]}.json`;
    const filepath = path.join(this.reportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(baseline, null, 2));
    
    // Also save as latest
    const latestPath = path.join(this.reportsDir, 'latest-baseline.json');
    fs.writeFileSync(latestPath, JSON.stringify(baseline, null, 2));
    
    console.log(`💾 Baseline saved to: ${filepath}`);
  }

  private printSummary(baseline: FrontendPerformanceBaseline) {
    console.log('\n📊 FRONTEND PERFORMANCE BASELINE SUMMARY');
    console.log('==========================================');
    console.log(`Overall Performance Score: ${baseline.performanceScore.overall}/100`);
    console.log(`Total Bundle Size: ${baseline.bundleAnalysis.totalSizeFormatted}`);
    console.log(`Total Components: ${baseline.componentAnalysis.totalComponents}`);
    console.log(`Accessibility Score: ${baseline.accessibilityPerformance.score}/100`);
    
    console.log('\n🎯 OPTIMIZATION PRIORITIES:');
    baseline.optimizationRoadmap.forEach((phase, index) => {
      console.log(`${index + 1}. ${phase.title} (${phase.impact} impact, ${phase.effort} effort)`);
    });

    console.log('\n📋 TOP RECOMMENDATIONS:');
    const allRecommendations = [
      ...baseline.bundleAnalysis.recommendations,
      ...baseline.assetOptimization.images.recommendations,
      ...baseline.networkOptimization.recommendations,
    ].slice(0, 5);
    
    allRecommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${typeof rec === 'string' ? rec : rec.title}`);
    });

    console.log('\n✅ Baseline generation complete!');
    console.log(`📁 Full report available in: ${this.reportsDir}`);
  }
}

// Main execution
async function main() {
  try {
    const analyzer = new FrontendPerformanceAnalyzer();
    await analyzer.generateBaseline();
  } catch (error) {
    console.error('❌ Error generating frontend performance baseline:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { FrontendPerformanceAnalyzer };