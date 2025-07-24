# 基础示例

本页面展示了 LDesign Config 的基础使用示例。

## 简单配置加载

### 1. 创建配置文件

```typescript
// config/app.config.ts
export default {
  name: 'My Application',
  version: '1.0.0',
  port: 3000,
  debug: false
};
```

### 2. 加载配置

```typescript
// src/index.ts
import { LDesignConfig } from 'ldesign-config';

const configLoader = new LDesignConfig({
  configDir: './config'
});

const config = await configLoader.getConfig('app');

console.log(`启动 ${config.name} v${config.version}`);
console.log(`服务器端口: ${config.port}`);
console.log(`调试模式: ${config.debug ? '开启' : '关闭'}`);
```

## 环境特定配置

### 1. 基础配置

```typescript
// config/database.config.ts
export default {
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  ssl: false,
  pool: {
    min: 2,
    max: 10
  }
};
```

### 2. 生产环境配置

```typescript
// config/database.config.production.ts
export default {
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  ssl: true,
  pool: {
    min: 5,
    max: 20
  }
};
```

### 3. 加载环境配置

```typescript
// 设置环境变量
process.env.NODE_ENV = 'production';
process.env.DB_HOST = 'prod-db.example.com';
process.env.DB_NAME = 'myapp_prod';

const config = await configLoader.getConfig('database');

console.log(config);
// 输出合并后的配置:
// {
//   host: 'prod-db.example.com',
//   port: 5432,
//   database: 'myapp_prod',
//   ssl: true,
//   pool: { min: 5, max: 20 }
// }
```

## 多格式配置

### JSON 配置

```json
// config/features.config.json
{
  "authentication": true,
  "logging": {
    "level": "info",
    "file": "app.log"
  },
  "cache": {
    "enabled": false,
    "ttl": 3600
  }
}
```

### YAML 配置

```yaml
# config/services.config.yaml
redis:
  host: localhost
  port: 6379
  db: 0

email:
  provider: smtp
  host: smtp.gmail.com
  port: 587
  secure: false

api:
  baseUrl: https://api.example.com
  timeout: 5000
  retries: 3
```

### 环境变量配置

```env
# config/secrets.config.env
JWT_SECRET=your-super-secret-key
API_KEY=your-api-key
ENCRYPTION_KEY=your-encryption-key
```

## 配置验证

```typescript
import { LDesignConfig } from 'ldesign-config';

interface AppConfig {
  name: string;
  version: string;
  port: number;
  debug: boolean;
}

function validateConfig(config: any): config is AppConfig {
  return (
    typeof config.name === 'string' &&
    typeof config.version === 'string' &&
    typeof config.port === 'number' &&
    typeof config.debug === 'boolean'
  );
}

const configLoader = new LDesignConfig();
const rawConfig = await configLoader.getConfig('app');

if (validateConfig(rawConfig)) {
  console.log('配置验证通过');
  // 现在可以安全地使用 rawConfig 作为 AppConfig
} else {
  throw new Error('配置验证失败');
}
```

## 配置缓存

```typescript
const configLoader = new LDesignConfig();

// 第一次加载（从文件系统读取）
const config1 = await configLoader.getConfig('app');
console.log('第一次加载完成');

// 第二次加载（从缓存读取，更快）
const config2 = await configLoader.getConfig('app');
console.log('第二次加载完成（来自缓存）');

// 清除缓存
configLoader.clearCache();

// 重新从文件系统加载
const config3 = await configLoader.getConfig('app');
console.log('缓存清除后重新加载');
```

## 错误处理示例

```typescript
import { LDesignConfig, ConfigError } from 'ldesign-config';

const configLoader = new LDesignConfig();

try {
  const config = await configLoader.getConfig('nonexistent');
} catch (error) {
  if (error instanceof ConfigError) {
    switch (error.code) {
      case 'CONFIG_NOT_FOUND':
        console.error('配置文件未找到:', error.filePath);
        break;
      case 'PARSE_ERROR':
        console.error('配置文件解析失败:', error.message);
        break;
      case 'VALIDATION_ERROR':
        console.error('配置验证失败:', error.message);
        break;
      default:
        console.error('未知配置错误:', error.message);
    }
  } else {
    console.error('系统错误:', error);
  }
}
```

## 下一步

- 查看 [TypeScript 项目示例](./typescript.md)
- 了解 [Express 应用集成](./express.md)
- 探索 [高级功能](../guide/hot-reload.md)