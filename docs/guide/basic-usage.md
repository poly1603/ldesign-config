# 基础用法

## 创建配置文件

首先，在项目根目录创建一个配置文件。LDesign Config 支持多种格式：

### TypeScript 配置文件

```typescript
// app.config.ts
export default {
  port: 3000,
  database: {
    host: 'localhost',
    port: 5432,
    name: 'myapp'
  },
  features: {
    auth: true,
    cache: false
  }
};
```

### JavaScript 配置文件

```javascript
// app.config.js
module.exports = {
  port: 3000,
  database: {
    host: 'localhost',
    port: 5432,
    name: 'myapp'
  },
  features: {
    auth: true,
    cache: false
  }
};
```

### JSON 配置文件

```json
// app.config.json
{
  "port": 3000,
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp"
  },
  "features": {
    "auth": true,
    "cache": false
  }
}
```

## 加载配置

### 基础加载

```typescript
import { LDesignConfig } from 'ldesign-config';

const configLoader = new LDesignConfig();
const config = await configLoader.getConfig('app');

console.log(config);
// 输出: { port: 3000, database: { ... }, features: { ... } }
```

### 指定配置目录

```typescript
const configLoader = new LDesignConfig({
  configDir: './config'
});

const config = await configLoader.getConfig('app');
```

### 使用静态方法

```typescript
const config = await LDesignConfig.loadConfig('app');
```

## 访问配置值

```typescript
const config = await configLoader.getConfig('app');

// 访问顶级属性
console.log(config.port); // 3000

// 访问嵌套属性
console.log(config.database.host); // 'localhost'
console.log(config.database.port); // 5432

// 使用解构
const { port, database } = config;
const { host, port: dbPort } = database;
```

## 类型安全（TypeScript）

```typescript
interface AppConfig {
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
  };
  features: {
    auth: boolean;
    cache: boolean;
  };
}

const config = await configLoader.getConfig<AppConfig>('app');

// 现在 config 具有完整的类型信息
config.port; // number
config.database.host; // string
config.features.auth; // boolean
```

## 错误处理

```typescript
try {
  const config = await configLoader.getConfig('app');
  // 使用配置
} catch (error) {
  if (error.code === 'CONFIG_NOT_FOUND') {
    console.error('配置文件未找到');
  } else if (error.code === 'PARSE_ERROR') {
    console.error('配置文件解析失败:', error.message);
  } else {
    console.error('未知错误:', error);
  }
}
```

## 下一步

- 了解 [配置文件格式](./file-formats.md)
- 学习 [环境配置](./environment-config.md)
- 探索 [文件监听](./file-watching.md) 功能