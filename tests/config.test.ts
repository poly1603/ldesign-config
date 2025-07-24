import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LDesignConfig } from '../src/config';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), 'test-configs');

describe('LDesignConfig', () => {
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

  describe('基础配置加载', () => {
    it('应该能够加载 TypeScript 配置文件', async () => {
      const configContent = `
export default {
  name: 'test-app',
  version: '1.0.0',
  database: {
    host: 'localhost',
    port: 5432
  }
};
`;
      writeFileSync(join(TEST_DIR, 'app.config.ts'), configContent);

      const config = new LDesignConfig('app', { configDir: TEST_DIR });
      const result = await config.getConfig();

      expect(result.config).toEqual({
        name: 'test-app',
        version: '1.0.0',
        database: {
          host: 'localhost',
          port: 5432
        }
      });
    });

    it('应该能够加载 JavaScript 配置文件', async () => {
      const configContent = `
module.exports = {
  name: 'test-app',
  version: '1.0.0'
};
`;
      writeFileSync(join(TEST_DIR, 'app.config.js'), configContent);

      const config = new LDesignConfig('app', { configDir: TEST_DIR });
      const result = await config.getConfig();

      expect(result.config).toEqual({
        name: 'test-app',
        version: '1.0.0'
      });
    });

    it('应该能够加载 JSON 配置文件', async () => {
      const configContent = {
        name: 'test-app',
        version: '1.0.0',
        features: ['auth', 'api']
      };
      writeFileSync(join(TEST_DIR, 'app.config.json'), JSON.stringify(configContent, null, 2));

      const config = new LDesignConfig('app', { configDir: TEST_DIR });
      const result = await config.getConfig();

      expect(result.config).toEqual(configContent);
    });

    it('应该能够加载 YAML 配置文件', async () => {
      const configContent = `
name: test-app
version: 1.0.0
database:
  host: localhost
  port: 5432
features:
  - auth
  - api
`;
      writeFileSync(join(TEST_DIR, 'app.config.yaml'), configContent);

      const config = new LDesignConfig('app', { configDir: TEST_DIR });
      const result = await config.getConfig();

      expect(result.config).toEqual({
        name: 'test-app',
        version: '1.0.0',
        database: {
          host: 'localhost',
          port: 5432
        },
        features: ['auth', 'api']
      });
    });

    it('应该能够加载 JSON5 配置文件', async () => {
      const configContent = `{
  // 应用配置
  name: 'test-app',
  version: '1.0.0',
  // 数据库配置
  database: {
    host: 'localhost',
    port: 5432,
  },
}`;
      writeFileSync(join(TEST_DIR, 'app.config.json5'), configContent);

      const config = new LDesignConfig('app', { configDir: TEST_DIR });
      const result = await config.getConfig();

      expect(result.config).toEqual({
        name: 'test-app',
        version: '1.0.0',
        database: {
          host: 'localhost',
          port: 5432
        }
      });
    });

    it('应该能够加载 ENV 配置文件', async () => {
      const configContent = `
APP_NAME=test-app
APP_VERSION=1.0.0
DB_HOST=localhost
DB_PORT=5432
`;
      writeFileSync(join(TEST_DIR, 'app.config.env'), configContent);

      const config = new LDesignConfig('app', { configDir: TEST_DIR });
      const result = await config.getConfig();

      expect(result.config).toEqual({
        APP_NAME: 'test-app',
        APP_VERSION: '1.0.0',
        DB_HOST: 'localhost',
        DB_PORT: '5432'
      });
    });
  });

  describe('环境配置覆盖', () => {
    it('应该能够合并基础配置和环境配置', async () => {
      // 基础配置
      const baseConfig = {
        name: 'test-app',
        version: '1.0.0',
        database: {
          host: 'localhost',
          port: 5432,
          ssl: false
        },
        features: ['auth']
      };
      writeFileSync(join(TEST_DIR, 'app.config.json'), JSON.stringify(baseConfig, null, 2));

      // 开发环境配置
      const devConfig = {
        database: {
          host: 'dev.localhost',
          ssl: true
        },
        features: ['auth', 'debug'],
        debug: true
      };
      writeFileSync(join(TEST_DIR, 'app.config.dev.json'), JSON.stringify(devConfig, null, 2));

      const config = new LDesignConfig('app', { configDir: TEST_DIR });
      const result = await config.getConfig('dev');

      expect(result.config).toEqual({
        name: 'test-app',
        version: '1.0.0',
        database: {
          host: 'dev.localhost',
          port: 5432,
          ssl: true
        },
        features: ['auth', 'debug'],
        debug: true
      });
    });

    it('环境配置应该覆盖基础配置', async () => {
      const baseConfig = {
        name: 'test-app',
        env: 'production',
        debug: false
      };
      writeFileSync(join(TEST_DIR, 'app.config.json'), JSON.stringify(baseConfig, null, 2));

      const testConfig = {
        env: 'test',
        debug: true
      };
      writeFileSync(join(TEST_DIR, 'app.config.test.json'), JSON.stringify(testConfig, null, 2));

      const config = new LDesignConfig('app', { configDir: TEST_DIR });
      const result = await config.getConfig('test');

      expect(result.config).toEqual({
        name: 'test-app',
        env: 'test',
        debug: true
      });
    });
  });

  describe('错误处理', () => {
    it('当配置文件不存在时应该返回空对象', async () => {
      const config = new LDesignConfig('nonexistent', { configDir: TEST_DIR });
      const result = await config.getConfig();

      expect(result.config).toEqual({});
    });

    it('当环境配置不存在时应该只返回基础配置', async () => {
      const baseConfig = {
        name: 'test-app',
        version: '1.0.0'
      };
      writeFileSync(join(TEST_DIR, 'app.config.json'), JSON.stringify(baseConfig, null, 2));

      const config = new LDesignConfig('app', { configDir: TEST_DIR });
      const result = await config.getConfig('nonexistent');

      expect(result.config).toEqual(baseConfig);
    });

    it('应该处理无效的 JSON 文件', async () => {
      writeFileSync(join(TEST_DIR, 'app.config.json'), '{ invalid json }');

      const config = new LDesignConfig('app', { configDir: TEST_DIR });
      
      await expect(config.getConfig()).rejects.toThrow();
    });
  });

  describe('配置文件优先级', () => {
    it('应该按照正确的优先级加载配置文件', async () => {
      // 创建多个格式的配置文件
      writeFileSync(join(TEST_DIR, 'priority.config.json'), JSON.stringify({ source: 'json', value: 1 }));
      writeFileSync(join(TEST_DIR, 'priority.config.js'), 'module.exports = { source: "js", value: 2 };');
      writeFileSync(join(TEST_DIR, 'priority.config.ts'), 'export default { source: "ts", value: 3 };');

      const config = new LDesignConfig('priority', { configDir: TEST_DIR });
      const result = await config.getConfig();

      // 所有配置文件会按优先级合并，TypeScript 文件的值会覆盖其他文件
      expect(result.config).toEqual({ source: 'ts', value: 3 });
    });
  });
});