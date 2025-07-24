import { describe, it, expect } from 'vitest';
import { deepMerge, findConfigFiles, resolveConfigPath } from '../src/utils';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), 'test-utils');

describe('工具函数', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('deepMerge', () => {
    it('应该能够深度合并两个对象', () => {
      const target = {
        name: 'app',
        database: {
          host: 'localhost',
          port: 5432,
          ssl: false
        },
        features: ['auth']
      };

      const source = {
        version: '1.0.0',
        database: {
          host: 'remote.host',
          ssl: true,
          timeout: 5000
        },
        features: ['auth', 'api'],
        debug: true
      };

      const result = deepMerge(target, source);

      expect(result).toEqual({
        name: 'app',
        version: '1.0.0',
        database: {
          host: 'remote.host',
          port: 5432,
          ssl: true,
          timeout: 5000
        },
        features: ['auth', 'api'],
        debug: true
      });
    });

    it('应该处理嵌套对象的合并', () => {
      const target = {
        config: {
          database: {
            primary: {
              host: 'localhost',
              port: 5432
            },
            secondary: {
              host: 'backup.host',
              port: 5433
            }
          }
        }
      };

      const source = {
        config: {
          database: {
            primary: {
              ssl: true,
              timeout: 3000
            },
            cache: {
              host: 'cache.host',
              port: 6379
            }
          },
          logging: {
            level: 'info'
          }
        }
      };

      const result = deepMerge(target, source);

      expect(result).toEqual({
        config: {
          database: {
            primary: {
              host: 'localhost',
              port: 5432,
              ssl: true,
              timeout: 3000
            },
            secondary: {
              host: 'backup.host',
              port: 5433
            },
            cache: {
              host: 'cache.host',
              port: 6379
            }
          },
          logging: {
            level: 'info'
          }
        }
      });
    });

    it('应该处理数组的覆盖', () => {
      const target = {
        features: ['auth', 'logging'],
        tags: ['v1', 'stable']
      };

      const source = {
        features: ['auth', 'api', 'monitoring'],
        environments: ['dev', 'prod']
      };

      const result = deepMerge(target, source);

      expect(result).toEqual({
        features: ['auth', 'api', 'monitoring'],
        tags: ['v1', 'stable'],
        environments: ['dev', 'prod']
      });
    });

    it('应该处理 null 和 undefined 值', () => {
      const target = {
        name: 'app',
        version: null,
        description: undefined,
        config: {
          debug: true
        }
      };

      const source = {
        version: '1.0.0',
        author: 'developer',
        config: {
          debug: false,
          timeout: null
        }
      };

      const result = deepMerge(target, source);

      expect(result).toEqual({
        name: 'app',
        version: '1.0.0',
        description: undefined,
        author: 'developer',
        config: {
          debug: false,
          timeout: null
        }
      });
    });

    it('应该处理空对象', () => {
      const target = {};
      const source = {
        name: 'app',
        version: '1.0.0'
      };

      const result = deepMerge(target, source);

      expect(result).toEqual(source);
    });
  });

  describe('findConfigFiles', () => {
    it('应该能够找到所有支持格式的配置文件', () => {
      // 创建各种格式的配置文件
      writeFileSync(join(TEST_DIR, 'app.config.ts'), 'export default {};');
      writeFileSync(join(TEST_DIR, 'app.config.js'), 'module.exports = {};');
      writeFileSync(join(TEST_DIR, 'app.config.json'), '{}');
      writeFileSync(join(TEST_DIR, 'app.config.yaml'), 'name: app');
      writeFileSync(join(TEST_DIR, 'app.config.yml'), 'name: app');
      writeFileSync(join(TEST_DIR, 'app.config.json5'), '{}');
      writeFileSync(join(TEST_DIR, 'app.config.env'), 'APP_NAME=app');

      const files = findConfigFiles('app', TEST_DIR);

      expect(files).toHaveLength(7);
      expect(files.map(f => f.ext)).toContain('.ts');
      expect(files.map(f => f.ext)).toContain('.js');
      expect(files.map(f => f.ext)).toContain('.json');
      expect(files.map(f => f.ext)).toContain('.yaml');
      expect(files.map(f => f.ext)).toContain('.yml');
      expect(files.map(f => f.ext)).toContain('.json5');
      expect(files.map(f => f.ext)).toContain('.env');
    });

    it('应该能够找到环境特定的配置文件', () => {
      writeFileSync(join(TEST_DIR, 'app.config.ts'), 'export default {};');
      writeFileSync(join(TEST_DIR, 'app.config.dev.ts'), 'export default {};');
      writeFileSync(join(TEST_DIR, 'app.config.prod.json'), '{}');
      writeFileSync(join(TEST_DIR, 'app.config.test.yaml'), 'name: test');

      const baseFiles = findConfigFiles('app', TEST_DIR);
      const devFiles = findConfigFiles('app', TEST_DIR, 'dev');
      const prodFiles = findConfigFiles('app', TEST_DIR, 'prod');
      const testFiles = findConfigFiles('app', TEST_DIR, 'test');

      expect(baseFiles).toHaveLength(1);
      expect(baseFiles[0].env).toBeUndefined();

      expect(devFiles).toHaveLength(2); // base + dev
      expect(devFiles.find(f => f.env === 'dev')).toBeDefined();
      expect(devFiles.find(f => f.isBase)).toBeDefined();

      expect(prodFiles).toHaveLength(2); // base + prod
      expect(prodFiles.find(f => f.env === 'prod')).toBeDefined();
      expect(prodFiles.find(f => f.isBase)).toBeDefined();

      expect(testFiles).toHaveLength(2); // base + test
      expect(testFiles.find(f => f.env === 'test')).toBeDefined();
      expect(testFiles.find(f => f.isBase)).toBeDefined();
    });

    it('应该按照优先级排序配置文件', () => {
      writeFileSync(join(TEST_DIR, 'app.config.json'), '{}');
      writeFileSync(join(TEST_DIR, 'app.config.js'), 'module.exports = {};');
      writeFileSync(join(TEST_DIR, 'app.config.ts'), 'export default {};');

      const files = findConfigFiles('app', TEST_DIR);

      // 文件按优先级排序：低优先级在前，高优先级在后
      expect(files[0].ext).toBe('.json');
      expect(files[1].ext).toBe('.js');
      expect(files[2].ext).toBe('.ts');
    });

    it('应该返回空数组当没有配置文件时', () => {
      const files = findConfigFiles('nonexistent', TEST_DIR);
      expect(files).toHaveLength(0);
    });
  });

  describe('resolveConfigPath', () => {
    it('应该解析相对路径', () => {
      const result = resolveConfigPath('./config', process.cwd());
      expect(result).toBe(join(process.cwd(), 'config'));
    });

    it('应该解析绝对路径', () => {
      const absolutePath = join(process.cwd(), 'config');
      const result = resolveConfigPath(absolutePath, process.cwd());
      expect(result).toBe(absolutePath);
    });

    it('应该使用默认基础路径', () => {
      const result = resolveConfigPath('config');
      expect(result).toBe(join(process.cwd(), 'config'));
    });

    it('应该处理波浪号路径', () => {
      const result = resolveConfigPath('~/config');
      expect(result).toContain('config');
    });

    it('应该规范化路径分隔符', () => {
      const result = resolveConfigPath('config/app/settings', process.cwd());
      expect(result).toBe(join(process.cwd(), 'config', 'app', 'settings'));
    });
  });
});