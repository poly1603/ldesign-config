# 快速开始

欢迎使用 LDesign Config！这个指南将帮助您在 5 分钟内上手使用这个强大的配置管理工具。

## 🎯 概述

LDesign Config 是一个现代化的 Node.js 配置加载插件，它提供：

- 🚀 **多格式支持** - TypeScript、JavaScript、JSON、YAML、JSON5、ENV
- 🌍 **环境配置** - 开发、测试、生产环境配置管理
- 🔥 **热重载** - 实时监听配置文件变更
- 💎 **TypeScript 优先** - 完整的类型支持和智能提示

## 📦 安装

选择您喜欢的包管理器：

::: code-group

```bash [pnpm]
pnpm add ldesign-config
```

```bash [npm]
npm install ldesign-config
```

```bash [yarn]
yarn add ldesign-config
```

:::

## 🚀 第一个配置文件

### 1. 创建配置文件

在项目根目录创建一个配置文件。我们推荐使用 TypeScript 格式以获得最佳的开发体验：

```typescript
// ldesign.config.ts
import { defineConfig } from 'ldesign-config';

export default defineConfig({
  // 应用基本信息
  name: 'my-awesome-app',
  version: '1.0.0',
  
  // 数据库配置
  database: {
    host: 'localhost',
    port: 5432,
    name: 'myapp_db',
    ssl: false
  },
  
  // 功能开关
  features: {
    auth: true,
    api: true,
    logging: true
  },
  
  // 服务器配置
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
```

::: tip 💡 提示
使用 `defineConfig` 函数可以获得完整的 TypeScript 类型提示和智能补全！
:::

### 2. 加载配置

在您的应用中加载配置：

```typescript
// app.ts
import { LDesignConfig } from 'ldesign-config';

// 创建配置加载器
const config = new LDesignConfig('ldesign', {
  configDir: process.cwd() // 配置文件目录，默认为当前工作目录
});

// 加载配置
const appConfig = await config.getConfig();

console.log('应用名称:', appConfig.name);
console.log('数据库配置:', appConfig.database);
console.log('服务器端口:', appConfig.server.port);
```

### 3. 运行应用

```bash
# 如果使用 TypeScript
npx tsx app.ts

# 或者先编译再运行
npx tsc && node dist/app.js
```

## 🌍 环境配置

### 创建环境特定配置

为不同环境创建专门的配置文件：

```typescript
// ldesign.config.dev.ts - 开发环境
export default {
  database: {
    host: 'localhost',
    name: 'myapp_dev',
    ssl: false
  },
  server: {
    port: 3001
  },
  debug: true,
  hotReload: true
};
```

```typescript
// ldesign.config.prod.ts - 生产环境
export default {
  database: {
    host: process.env.DB_HOST,
    name: process.env.DB_NAME,
    ssl: true,
    pool: {
      min: 5,
      max: 20
    }
  },
  server: {
    port: parseInt(process.env.PORT || '3000')
  },
  debug: false,
  logging: {
    level: 'error',
    file: '/var/log/myapp.log'
  }
};
```

### 加载环境配置

```typescript
// 根据 NODE_ENV 加载对应环境配置
const env = process.env.NODE_ENV || 'development';
const config = await configLoader.getConfig(env);

// 或者显式指定环境
const devConfig = await configLoader.getConfig('dev');
const prodConfig = await configLoader.getConfig('prod');
```

::: info 📝 配置合并规则
环境配置会与基础配置进行深度合并：
- 环境配置的属性会覆盖基础配置的同名属性
- 嵌套对象会进行递归合并
- 数组会被完全替换
:::

## 🔥 热重载

启用配置文件的实时监听和热重载：

```typescript
import { LDesignConfig } from 'ldesign-config';

const config = new LDesignConfig('ldesign');

// 启用热重载
config.watch((newConfig, changedFile) => {
  console.log('🔄 配置已更新!');
  console.log('📁 变更文件:', changedFile);
  console.log('⚙️ 新配置:', newConfig);
  
  // 在这里更新您的应用配置
  updateAppConfig(newConfig);
});

function updateAppConfig(newConfig: any) {
  // 重新初始化数据库连接
  if (newConfig.database) {
    database.updateConfig(newConfig.database);
  }
  
  // 更新服务器配置
  if (newConfig.server) {
    server.updateConfig(newConfig.server);
  }
}
```

## 📁 支持的文件格式

### TypeScript (.ts)

```typescript
// ldesign.config.ts
import { defineConfig } from 'ldesign-config';

interface DatabaseConfig {
  host: string;
  port: number;
  ssl: boolean;
}

export default defineConfig({
  database: {
    host: 'localhost',
    port: 5432,
    ssl: false
  } as DatabaseConfig
});
```

### JavaScript (.js)

```javascript
// ldesign.config.js
module.exports = {
  name: 'my-app',
  database: {
    host: 'localhost',
    port: 5432
  }
};
```

### JSON (.json)

```json
// ldesign.config.json
{
  "name": "my-app",
  "database": {
    "host": "localhost",
    "port": 5432
  }
}
```

### YAML (.yaml/.yml)

```yaml
# ldesign.config.yaml
name: my-app
database:
  host: localhost
  port: 5432
  ssl: false
features:
  - auth
  - api
  - logging
```

### JSON5 (.json5)

```json5
// ldesign.config.json5
{
  // 应用配置
  name: 'my-app',
  
  // 数据库配置
  database: {
    host: 'localhost',
    port: 5432,
    ssl: false, // 开发环境不使用 SSL
  },
  
  /* 功能列表 */
  features: [
    'auth',
    'api',
    // 'premium', // 暂时禁用高级功能
  ]
}
```

### ENV (.env)

```bash
# ldesign.config.env
APP_NAME=my-app
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false
FEATURE_AUTH=true
FEATURE_API=true
```

## 🎯 配置文件优先级

当存在多个格式的配置文件时，加载优先级为：

1. **TypeScript** (`.ts`) - 最高优先级
2. **JavaScript** (`.js`)
3. **JSON5** (`.json5`)
4. **JSON** (`.json`)
5. **YAML** (`.yaml/.yml`)
6. **ENV** (`.env`) - 最低优先级

环境配置的优先级：

1. **环境特定配置** (`ldesign.config.{env}.{ext}`)
2. **基础配置** (`ldesign.config.{ext}`)

## ✨ 下一步

恭喜！您已经掌握了 LDesign Config 的基础用法。接下来您可以：

- 📖 深入了解配置文件格式
- 🌍 学习环境配置管理
- 🔄 探索配置合并机制
- 👀 了解文件监听功能
- 💎 掌握 TypeScript 高级用法

## 🆘 需要帮助？

如果您遇到任何问题：

- 📚 查看 API 参考文档
- 💡 浏览使用示例
- 🐛 [提交 Issue](https://github.com/ldesign/ldesign-config/issues)
- 💬 [参与讨论](https://github.com/ldesign/ldesign-config/discussions)