const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allow builds to continue with TypeScript errors during development
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    // Allow builds to continue with ESLint errors during development
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  experimental: {
    // Enable instrumentation hook for server-side Sentry initialization
    instrumentationHook: true,
  },
  
  // Production optimization settings
  poweredByHeader: false,
  compress: true,
  
  // Webpack optimization for chunk loading
  webpack: (config, { dev, isServer, webpack }) => {
    // Only apply optimizations in production
    if (!dev && !isServer) {
      // Enhanced chunk splitting for better loading performance
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          automaticNameDelimiter: '~',
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            
            // Framework bundle (React, Next.js core)
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            
            // Large libraries bundle
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'lib',
              priority: 30,
              chunks: 'all',
              minChunks: 1,
            },
            
            // UI components bundle
            ui: {
              test: /[\\/](components|ui)[\\/]/,
              name: 'ui',
              priority: 20,
              chunks: 'all',
              minChunks: 2,
            },
            
            // AI/ML libraries bundle
            ai: {
              test: /[\\/]node_modules[\\/](@langchain|openai|@copilotkit)[\\/]/,
              name: 'ai',
              priority: 35,
              chunks: 'all',
              enforce: true,
            },
            
            // Monitoring libraries bundle
            monitoring: {
              test: /[\\/]node_modules[\\/](@sentry)[\\/]/,
              name: 'monitoring',
              priority: 35,
              chunks: 'all',
              enforce: true,
            },
            
            // Common components used across multiple pages
            common: {
              test: /[\\/](lib|utils|services)[\\/]/,
              name: 'common',
              priority: 10,
              chunks: 'all',
              minChunks: 2,
            },
          },
        },
        
        // Module concatenation for better tree shaking
        concatenateModules: true,
        
        // Better module IDs for caching
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      };
      
      // Add chunk retry logic
      config.output.chunkLoadingGlobal = 'webpackChunkjsonnxtjs';
      config.output.chunkLoading = 'jsonp';
      
      // Enable tree shaking for better bundle optimization
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Add chunk loading error recovery
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();
        
        // Add chunk retry polyfill to main entry
        if (entries['main.js'] && !entries['main.js'].includes('./lib/utils/chunk-retry-polyfill.js')) {
          entries['main.js'].unshift('./lib/utils/chunk-retry-polyfill.js');
        }
        
        return entries;
      };
      
      // Add additional chunk loading optimizations
      config.output = {
        ...config.output,
        // Improve chunk loading reliability
        chunkLoadTimeout: 30000, // 30 seconds
        crossOriginLoading: 'anonymous',
        // Better error messages for chunk loading
        pathinfo: false,
      };
      
      // Add performance optimizations
      config.performance = {
        hints: false, // Disable performance hints for cleaner builds
        maxEntrypointSize: 512000, // 500kb
        maxAssetSize: 512000, // 500kb
      };
    }
    
    // Add module resolution optimizations
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Optimize bundle analyzer in development
    if (dev && process.env.ANALYZE) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      );
    }
    
    return config;
  },
};

// Modern v8 Sentry configuration - merged options
const sentryConfig = {
  // Sentry webpack plugin options
  org: 'bridgex-uc',
  project: 'ai-course-platform-frontend',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Source map configuration
  widenClientFileUpload: true,
  hideSourceMaps: true,
  automaticVercelMonitors: true,
  
  // Upload configuration
  silent: process.env.NODE_ENV !== 'production',
  disableLogger: process.env.NODE_ENV === 'production',
  
  // Enhanced source map options for better debugging
  sourcemaps: {
    // Upload source maps to Sentry
    disable: false,
    // Delete source maps after upload to reduce bundle size
    deleteSourcemapsAfterUpload: true,
  },
  
  // Automatic instrumentation options (optimized for single instance)
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
  autoInstrumentAppDirectory: true,
  
  // Prevent duplicate instrumentation
  tunnelRoute: '/monitoring',
  
  // Session Replay optimization
  clientMaxErrorRetries: 2,
};

// Export with merged configuration (v8 syntax)
module.exports = withSentryConfig(nextConfig, sentryConfig);