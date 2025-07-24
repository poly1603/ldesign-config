import { defineConfig } from '../src';

export default defineConfig({
  // 开发环境数据库配置
  database: {
    host: 'localhost',
    port: 5432,
    name: 'myapp_dev',
    debug: true,
    pool: {
      min: 2,
      max: 10
    }
  },
  
  // 开发环境服务器配置
  server: {
    port: 3000,
    host: '0.0.0.0',
    cors: true,
    compression: false
  },
  
  // 开发环境特性
  features: ['auth', 'logging', 'hot-reload', 'dev-tools'],
  
  // 开发环境应用配置
  app: {
    debug: true,
    logLevel: 'debug',
    hotReload: true
  },
  
  // 开发环境缓存配置（较小的缓存）
  cache: {
    ttl: 300, // 5分钟
    maxSize: 100,
    enabled: false // 开发环境禁用缓存
  },
  
  // 开发环境专用配置
  development: {
    mockData: true,
    apiDelay: 100,
    showErrors: true
  }
});