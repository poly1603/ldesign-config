import { defineConfig, type MergeOptions, type ValidationSchema, type ConfigTemplate } from '../src';

// 定义配置验证模式
const validationSchema: ValidationSchema = {
  database: {
    required: true,
    type: 'object',
    properties: {
      host: { required: true, type: 'string' },
      port: { required: true, type: 'number' },
      name: { required: true, type: 'string' }
    }
  },
  server: {
    required: true,
    type: 'object',
    properties: {
      port: { required: true, type: 'number' },
      host: { required: false, type: 'string', default: 'localhost' }
    }
  },
  features: {
    required: false,
    type: 'array',
    default: []
  }
};

// 定义配置模板
const templates: ConfigTemplate[] = [
  {
    name: 'database-template',
    condition: (config) => !config.database,
    template: {
      database: {
        host: 'localhost',
        port: 5432,
        name: 'myapp'
      }
    }
  },
  {
    name: 'server-template',
    condition: (config) => !config.server,
    template: {
      server: {
        port: 3000,
        host: 'localhost'
      }
    }
  }
];

// 定义合并选项
const mergeOptions: MergeOptions = {
  arrayMergeStrategy: 'concat', // 数组合并策略：连接
  customMergers: {
    // 自定义合并器：对于 features 数组，去重合并
    features: (target: string[], source: string[]) => {
      const combined = [...(target || []), ...(source || [])];
      return [...new Set(combined)];
    }
  },
  skipKeys: ['_internal'], // 跳过内部配置
  onlyKeys: undefined // 不限制键
};

// 定义配置转换器
const transformers = {
  // 环境变量插值
  envInterpolation: (value: any) => {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const envVar = value.slice(2, -1);
      return process.env[envVar] || value;
    }
    return value;
  },
  // 端口号标准化
  portNormalization: (value: any) => {
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    return value;
  }
};

export default defineConfig({
  // 基础配置
  database: {
    host: '${DB_HOST}',
    port: '${DB_PORT}',
    name: '${DB_NAME}'
  },
  server: {
    port: '${SERVER_PORT}',
    host: '${SERVER_HOST}'
  },
  features: ['auth', 'logging'],
  
  // 应用级配置
  app: {
    name: 'LDesign Config Demo',
    version: '1.0.0',
    debug: process.env.NODE_ENV === 'development'
  },
  
  // 缓存配置
  cache: {
    ttl: 3600,
    maxSize: 1000
  }
}, {
  // 配置选项
  mergeOptions,
  validationSchema,
  templates,
  transformers
});