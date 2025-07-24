import { describe, it, expect } from 'vitest';
import { parseTypeScript, parseJavaScript, parseJSON, parseYAML, parseJSON5, parseEnv } from '../src/parsers';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), 'test-parsers');

describe('配置文件解析器', () => {
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

  describe('TypeScript 解析器', () => {
    it('应该能够解析 TypeScript 配置文件', async () => {
      const configPath = join(TEST_DIR, 'test.config.ts');
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
      writeFileSync(configPath, configContent);

      const result = await parseTypeScript(configPath);

      expect(result).toEqual({
        name: 'test-app',
        version: '1.0.0',
        database: {
          host: 'localhost',
          port: 5432
        }
      });
    });

    it('应该能够解析带有类型定义的 TypeScript 配置', async () => {
      const configPath = join(TEST_DIR, 'typed.config.ts');
      const configContent = `
interface DatabaseConfig {
  host: string;
  port: number;
  ssl?: boolean;
}

interface AppConfig {
  name: string;
  database: DatabaseConfig;
}

const config: AppConfig = {
  name: 'typed-app',
  database: {
    host: 'localhost',
    port: 5432,
    ssl: true
  }
};

export default config;
`;
      writeFileSync(configPath, configContent);

      const result = await parseTypeScript(configPath);

      expect(result).toEqual({
        name: 'typed-app',
        database: {
          host: 'localhost',
          port: 5432,
          ssl: true
        }
      });
    });
  });

  describe('JavaScript 解析器', () => {
    it('应该能够解析 CommonJS 格式的 JavaScript 配置', async () => {
      const configPath = join(TEST_DIR, 'commonjs.config.js');
      const configContent = `
module.exports = {
  name: 'commonjs-app',
  version: '1.0.0',
  features: ['auth', 'api']
};
`;
      writeFileSync(configPath, configContent);

      const result = await parseJavaScript(configPath);

      expect(result).toEqual({
        name: 'commonjs-app',
        version: '1.0.0',
        features: ['auth', 'api']
      });
    });

    it('应该能够解析 ES6 模块格式的 JavaScript 配置', async () => {
      const configPath = join(TEST_DIR, 'esm.config.js');
      const configContent = `
export default {
  name: 'esm-app',
  version: '2.0.0',
  database: {
    host: 'localhost',
    port: 3306
  }
};
`;
      writeFileSync(configPath, configContent);

      const result = await parseJavaScript(configPath);

      expect(result).toEqual({
        name: 'esm-app',
        version: '2.0.0',
        database: {
          host: 'localhost',
          port: 3306
        }
      });
    });
  });

  describe('JSON 解析器', () => {
    it('应该能够解析标准 JSON 配置文件', async () => {
      const configPath = join(TEST_DIR, 'standard.config.json');
      const configContent = {
        name: 'json-app',
        version: '1.0.0',
        settings: {
          debug: true,
          timeout: 5000
        }
      };
      writeFileSync(configPath, JSON.stringify(configContent, null, 2));

      const result = await parseJSON(configPath);

      expect(result).toEqual(configContent);
    });

    it('应该处理空的 JSON 文件', async () => {
      const configPath = join(TEST_DIR, 'empty.config.json');
      writeFileSync(configPath, '{}');

      const result = await parseJSON(configPath);

      expect(result).toEqual({});
    });

    it('应该抛出错误当 JSON 格式无效时', async () => {
      const configPath = join(TEST_DIR, 'invalid.config.json');
      writeFileSync(configPath, '{ invalid json }');

      await expect(parseJSON(configPath)).rejects.toThrow();
    });
  });

  describe('YAML 解析器', () => {
    it('应该能够解析 YAML 配置文件', async () => {
      const configPath = join(TEST_DIR, 'app.config.yaml');
      const configContent = `
name: yaml-app
version: 1.0.0
database:
  host: localhost
  port: 5432
  ssl: true
features:
  - auth
  - api
  - logging
settings:
  debug: false
  timeout: 3000
`;
      writeFileSync(configPath, configContent);

      const result = await parseYAML(configPath);

      expect(result).toEqual({
        name: 'yaml-app',
        version: '1.0.0',
        database: {
          host: 'localhost',
          port: 5432,
          ssl: true
        },
        features: ['auth', 'api', 'logging'],
        settings: {
          debug: false,
          timeout: 3000
        }
      });
    });

    it('应该能够解析 YML 扩展名的文件', async () => {
      const configPath = join(TEST_DIR, 'app.config.yml');
      const configContent = `
name: yml-app
version: 2.0.0
`;
      writeFileSync(configPath, configContent);

      const result = await parseYAML(configPath);

      expect(result).toEqual({
        name: 'yml-app',
        version: '2.0.0'
      });
    });
  });

  describe('JSON5 解析器', () => {
    it('应该能够解析带注释的 JSON5 配置文件', async () => {
      const configPath = join(TEST_DIR, 'app.config.json5');
      const configContent = `{
  // 应用基本信息
  name: 'json5-app',
  version: '1.0.0',
  
  // 数据库配置
  database: {
    host: 'localhost',
    port: 5432,
    // 是否启用 SSL
    ssl: true,
  },
  
  /* 功能列表 */
  features: [
    'auth',
    'api',
    // 'logging', // 暂时禁用
  ],
}`;
      writeFileSync(configPath, configContent);

      const result = await parseJSON5(configPath);

      expect(result).toEqual({
        name: 'json5-app',
        version: '1.0.0',
        database: {
          host: 'localhost',
          port: 5432,
          ssl: true
        },
        features: ['auth', 'api']
      });
    });

    it('应该能够解析带有尾随逗号的 JSON5', async () => {
      const configPath = join(TEST_DIR, 'trailing.config.json5');
      const configContent = `{
  name: 'trailing-app',
  version: '1.0.0',
  features: [
    'auth',
    'api',
  ],
}`;
      writeFileSync(configPath, configContent);

      const result = await parseJSON5(configPath);

      expect(result).toEqual({
        name: 'trailing-app',
        version: '1.0.0',
        features: ['auth', 'api']
      });
    });
  });

  describe('ENV 解析器', () => {
    it('应该能够解析环境变量文件', async () => {
      const configPath = join(TEST_DIR, 'app.config.env');
      const configContent = `
# 应用配置
APP_NAME=env-app
APP_VERSION=1.0.0

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_SSL=true

# 功能开关
FEATURE_AUTH=enabled
FEATURE_API=enabled
FEATURE_DEBUG=disabled
`;
      writeFileSync(configPath, configContent);

      const result = await parseEnv(configPath);

      expect(result).toEqual({
        APP_NAME: 'env-app',
        APP_VERSION: '1.0.0',
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_SSL: 'true',
        FEATURE_AUTH: 'enabled',
        FEATURE_API: 'enabled',
        FEATURE_DEBUG: 'disabled'
      });
    });

    it('应该忽略注释和空行', async () => {
      const configPath = join(TEST_DIR, 'comments.config.env');
      const configContent = `
# 这是注释
APP_NAME=test-app

# 另一个注释
APP_VERSION=1.0.0

# 空行上面

DB_HOST=localhost
`;
      writeFileSync(configPath, configContent);

      const result = await parseEnv(configPath);

      expect(result).toEqual({
        APP_NAME: 'test-app',
        APP_VERSION: '1.0.0',
        DB_HOST: 'localhost'
      });
    });

    it('应该处理带引号的值', async () => {
      const configPath = join(TEST_DIR, 'quoted.config.env');
      const configContent = `
APP_NAME="quoted app"
APP_DESCRIPTION='Single quoted description'
APP_MESSAGE="Message with 'mixed' quotes"
`;
      writeFileSync(configPath, configContent);

      const result = await parseEnv(configPath);

      expect(result).toEqual({
        APP_NAME: 'quoted app',
        APP_DESCRIPTION: 'Single quoted description',
        APP_MESSAGE: "Message with 'mixed' quotes"
      });
    });
  });
});