import { defineConfig } from '../src';

export default defineConfig({
  // 生产环境数据库配置
  database: {
    host: '${PROD_DB_HOST}',
    port: 5432,
    name: 'myapp_prod',
    ssl: true,
    pool: {
      min: 10,
      max: 50
    },
    connectionTimeout: 30000
  },
  
  // 生产环境服务器配置
  server: {
    port: 8080,
    host: '0.0.0.0',
    cors: false,
    compression: true,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100 // 限制每个IP 15分钟内最多100个请求
    }
  },
  
  // 生产环境特性（移除开发工具）
  features: ['auth', 'logging', 'monitoring', 'security'],
  
  // 生产环境应用配置
  app: {
    debug: false,
    logLevel: 'info',
    hotReload: false,
    cluster: true,
    workers: 4
  },
  
  // 生产环境缓存配置（更大的缓存）
  cache: {
    ttl: 7200, // 2小时
    maxSize: 10000,
    enabled: true,
    redis: {
      host: '${REDIS_HOST}',
      port: 6379,
      password: '${REDIS_PASSWORD}'
    }
  },
  
  // 生产环境专用配置
  production: {
    monitoring: {
      enabled: true,
      endpoint: '${MONITORING_ENDPOINT}',
      interval: 60000
    },
    security: {
      helmet: true,
      csrf: true,
      xss: true
    },
    performance: {
      gzip: true,
      minify: true,
      cdn: '${CDN_URL}'
    }
  }
});