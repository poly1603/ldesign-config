import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LDesignConfig, deepMerge, conditionalMerge, transformMerge, validateConfig, applyTemplate } from '../src';
import type { MergeOptions, ValidationSchema, ConfigTemplate } from '../src';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const testDir = join(process.cwd(), 'test-configs-advanced');

describe('Advanced Configuration Features', () => {
  beforeEach(() => {
    // 创建测试目录
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // 清理测试目录
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('Enhanced Deep Merge', () => {
    it('should merge with array concat strategy', () => {
      const target = { features: ['auth', 'logging'] };
      const source = { features: ['monitoring', 'cache'] };
      const options: MergeOptions = { arrayMergeStrategy: 'concat' };
      
      const result = deepMerge(target, source, options);
      expect(result.features).toEqual(['auth', 'logging', 'monitoring', 'cache']);
    });

    it('should merge with array replace strategy', () => {
      const target = { features: ['auth', 'logging'] };
      const source = { features: ['monitoring'] };
      const options: MergeOptions = { arrayMergeStrategy: 'replace' };
      
      const result = deepMerge(target, source, options);
      expect(result.features).toEqual(['monitoring']);
    });

    it('should use custom mergers', () => {
      const target = { tags: ['tag1', 'tag2'] };
      const source = { tags: ['tag2', 'tag3'] };
      const options: MergeOptions = {
        customMergers: {
          tags: (target: string[], source: string[]) => {
            const combined = [...target, ...source];
            return [...new Set(combined)]; // 去重
          }
        }
      };
      
      const result = deepMerge(target, source, options);
      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should skip specified keys', () => {
      const target = { public: 'data', _internal: 'secret' };
      const source = { public: 'new-data', _internal: 'new-secret' };
      const options: MergeOptions = { skipKeys: ['_internal'] };
      
      const result = deepMerge(target, source, options);
      expect(result.public).toBe('new-data');
      expect(result._internal).toBe('secret'); // 保持原值
    });

    it('should only merge specified keys', () => {
      const target = { a: 1, b: 2, c: 3 };
      const source = { a: 10, b: 20, c: 30 };
      const options: MergeOptions = { onlyKeys: ['a', 'b'] };
      
      const result = deepMerge(target, source, options);
      expect(result.a).toBe(10);
      expect(result.b).toBe(20);
      expect(result.c).toBe(3); // 保持原值
    });
  });

  describe('Conditional Merge', () => {
    it('should merge based on condition function', () => {
      const target = { dev: 'value', prod: 'value' };
      const source = { dev: 'new-dev', prod: 'new-prod' };
      
      const result = conditionalMerge(target, source, (key) => key === 'dev');
      expect(result.dev).toBe('new-dev');
      expect(result.prod).toBe('value'); // 未合并
    });

    it('should handle complex condition logic', () => {
      const target = {
        database: { host: 'localhost' },
        cache: { enabled: false }
      };
      const source = {
        database: { host: 'production' },
        cache: { enabled: true }
      };
      
      const result = conditionalMerge(
        target,
        source,
        (key, targetVal, sourceVal) => {
          if (key === 'database') {
            return process.env.NODE_ENV === 'production';
          }
          return true;
        }
      );
      
      expect(result.cache.enabled).toBe(true);
      // database 合并取决于环境
    });
  });

  describe('Transform Merge', () => {
    it('should apply transformers during merge', () => {
      const target = { port: '3000', timeout: '5000' };
      const source = { host: 'localhost', port: '8080' };
      
      const transformers = {
        port: (value: any) => {
          if (typeof value === 'string' && /^\d+$/.test(value)) {
            return parseInt(value, 10);
          }
          return value;
        },
        timeout: (value: any) => {
          if (typeof value === 'string' && /^\d+$/.test(value)) {
            return parseInt(value, 10);
          }
          return value;
        }
      };
      
      const result = transformMerge(target, source, transformers);
      expect(typeof result.port).toBe('number');
      expect(result.port).toBe(8080);
      expect(typeof result.timeout).toBe('number');
      expect(result.timeout).toBe(5000);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration against schema', () => {
      const config = {
        database: {
          host: 'localhost',
          port: 5432,
          name: 'testdb'
        },
        server: {
          port: 3000
        }
      };
      
      const schema: ValidationSchema = {
        database: {
          required: true,
          type: 'object',
          children: {
            host: { required: true, type: 'string' },
            port: { required: true, type: 'number' },
            name: { required: true, type: 'string' }
          }
        },
        server: {
          required: true,
          type: 'object',
          children: {
            port: { required: true, type: 'number' }
          }
        }
      };
      
      const result = validateConfig(config, schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors', () => {
      const config = {
        database: {
          host: 'localhost'
          // 缺少 port 和 name
        }
      };
      
      const schema: ValidationSchema = {
        database: {
          required: true,
          type: 'object',
          children: {
            host: { required: true, type: 'string' },
            port: { required: true, type: 'number' },
            name: { required: true, type: 'string' }
          }
        }
      };
      
      const result = validateConfig(config, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should apply default values', () => {
      const config = {
        database: {
          host: 'localhost',
          port: 5432,
          name: 'testdb'
        }
      };
      
      const schema: ValidationSchema = {
        database: {
          required: true,
          type: 'object',
          children: {
            host: { required: true, type: 'string' },
            port: { required: true, type: 'number' },
            name: { required: true, type: 'string' }
          }
        },
        server: {
          required: false,
          type: 'object',
          default: { port: 3000, host: 'localhost' },
          children: {
            port: { required: true, type: 'number' },
            host: { required: false, type: 'string', default: 'localhost' }
          }
        }
      };
      
      const result = validateConfig(config, schema);
      expect(result.isValid).toBe(true);
      expect(result.validated.server).toEqual({ port: 3000, host: 'localhost' });
    });
  });

  describe('Configuration Templates', () => {
    it('should apply templates based on conditions', () => {
      const config = {
        server: { port: 3000 }
        // 缺少 database 配置
      };
      
      const template: ConfigTemplate = {
        name: 'database-template',
        condition: (config) => !config.database,
        template: {
          database: {
            host: 'localhost',
            port: 5432,
            name: 'defaultdb'
          }
        }
      };
      
      const result = applyTemplate(config, template);
      expect(result.database).toEqual({
        host: 'localhost',
        port: 5432,
        name: 'defaultdb'
      });
      expect(result.server).toEqual({ port: 3000 });
    });

    it('should not apply template when condition is false', () => {
      const config = {
        database: { host: 'existing' },
        server: { port: 3000 }
      };
      
      const template: ConfigTemplate = {
        name: 'database-template',
        condition: (config) => !config.database,
        template: {
          database: {
            host: 'localhost',
            port: 5432
          }
        }
      };
      
      const result = applyTemplate(config, template);
      expect(result.database).toEqual({ host: 'existing' });
    });
  });

  describe('LDesignConfig with Advanced Features', () => {
    it('should load and merge configurations with advanced options', async () => {
      // 创建测试配置文件
      const baseConfig = {
        database: { host: 'localhost', port: 5432, name: 'base_db' },
        features: ['auth']
      };
      
      const devConfig = {
        database: { name: 'dev_db', debug: true },
        features: ['logging', 'dev-tools']
      };
      
      writeFileSync(
        join(testDir, 'test-config.config.js'),
        `module.exports = ${JSON.stringify(baseConfig, null, 2)};`
      );
      
      writeFileSync(
        join(testDir, 'test-config.config.development.js'),
        `module.exports = ${JSON.stringify(devConfig, null, 2)};`
      );
      
      const mergeOptions: MergeOptions = {
        arrayMergeStrategy: 'concat',
        customMergers: {
          features: (target: string[], source: string[]) => {
            const combined = [...(target || []), ...(source || [])];
            return [...new Set(combined)];
          }
        }
      };
      
      const validationSchema: ValidationSchema = {
        database: {
          required: true,
          type: 'object',
          children: {
            host: { required: true, type: 'string' },
            port: { required: true, type: 'number' },
            name: { required: true, type: 'string' }
          }
        }
      };
      
      // 设置开发环境
      process.env.NODE_ENV = 'development';
      
      const configLoader = new LDesignConfig('test-config', {
        configDir: testDir,
        mergeOptions,
        validationSchema
      });
      
      const result = await configLoader.getConfig();
      
      expect(result.config.database.host).toBe('localhost');
      expect(result.config.database.port).toBe(5432);
      expect(result.config.database.name).toBe('dev_db');
      expect(result.config.database.debug).toBe(true);
      expect(result.config.features).toEqual(['auth', 'logging', 'dev-tools']);
      
      configLoader.destroy();
    });

    it('should validate configuration and throw error on validation failure', async () => {
      const invalidConfig = {
        database: { host: 'localhost' } // 缺少必需的 port
      };
      
      writeFileSync(
        join(testDir, 'invalid-config.config.js'),
        `module.exports = ${JSON.stringify(invalidConfig, null, 2)};`
      );
      
      const validationSchema: ValidationSchema = {
        database: {
          required: true,
          type: 'object',
          children: {
            host: { required: true, type: 'string' },
            port: { required: true, type: 'number' }
          }
        }
      };
      
      const configLoader = new LDesignConfig('invalid-config', {
        configDir: testDir,
        validationSchema
      });
      
      await expect(configLoader.getConfig()).rejects.toThrow('Configuration validation failed');
      
      configLoader.destroy();
    });
  });
});