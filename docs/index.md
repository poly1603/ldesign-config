---
layout: home

hero:
  name: "LDesign Config"
  text: "强大的 Node.js 配置加载插件"
  tagline: 支持多种格式、环境配置和热重载的现代配置管理解决方案
  image:
    src: /logo.svg
    alt: LDesign Config
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看示例
      link: /examples/basic
    - theme: alt
      text: GitHub
      link: https://github.com/ldesign/ldesign-config

features:
  - icon: 🚀
    title: 多格式支持
    details: 支持 TypeScript、JavaScript、JSON、YAML、JSON5、ENV 等多种配置文件格式，满足不同项目需求
  
  - icon: 🌍
    title: 环境配置
    details: 内置环境配置支持，轻松管理开发、测试、生产等不同环境的配置，支持配置继承和覆盖
  
  - icon: 🔥
    title: 热重载
    details: 实时监听配置文件变更，自动重新加载配置，提升开发体验，支持自定义变更回调
  
  - icon: 💎
    title: TypeScript 优先
    details: 完整的 TypeScript 支持，提供类型安全的配置定义，智能代码补全和错误检查
  
  - icon: ⚡
    title: 高性能
    details: 优化的文件解析和缓存机制，快速加载配置文件，支持大型项目的配置管理需求
  
  - icon: 🛠️
    title: 易于使用
    details: 简洁的 API 设计，零配置开箱即用，同时提供丰富的自定义选项满足高级需求
---

## 🚀 快速开始

### 安装

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

### 基础使用

1. **创建配置文件**

```typescript
// ldesign.config.ts
import { defineConfig } from 'ldesign-config';

export default defineConfig({
  name: 'my-app',
  version: '1.0.0',
  database: {
    host: 'localhost',
    port: 5432,
    ssl: false
  },
  features: ['auth', 'api']
});
```

2. **加载配置**

```typescript
import { LDesignConfig } from 'ldesign-config';

// 创建配置加载器
const config = new LDesignConfig('ldesign', {
  configDir: process.cwd()
});

// 获取配置
const appConfig = await config.getConfig();
console.log(appConfig.name); // 'my-app'

// 获取环境特定配置
const devConfig = await config.getConfig('dev');
```

3. **环境配置**

```typescript
// ldesign.config.dev.ts
export default {
  database: {
    host: 'dev.localhost',
    ssl: true
  },
  debug: true
};
```

## 🌟 主要特性

### 📁 多种配置格式

支持主流的配置文件格式：

- **TypeScript** (`.ts`) - 类型安全，智能提示
- **JavaScript** (`.js`) - 灵活的逻辑配置
- **JSON** (`.json`) - 标准数据格式
- **YAML** (`.yaml/.yml`) - 人类友好的格式
- **JSON5** (`.json5`) - 支持注释的 JSON
- **ENV** (`.env`) - 环境变量格式

### 🎯 环境配置管理

```typescript
// 基础配置：ldesign.config.ts
export default {
  name: 'my-app',
  database: { host: 'localhost' }
};

// 生产环境：ldesign.config.prod.ts
export default {
  database: { host: 'prod.example.com', ssl: true }
};

// 自动合并配置
const prodConfig = await config.getConfig('prod');
// 结果：{ name: 'my-app', database: { host: 'prod.example.com', ssl: true } }
```

### 🔄 实时热重载

```typescript
const config = new LDesignConfig('ldesign');

// 启用文件监听
config.watch((newConfig, changedFile) => {
  console.log('配置已更新:', newConfig);
  console.log('变更文件:', changedFile);
  
  // 重新初始化应用
  app.updateConfig(newConfig);
});
```

## 📖 文档导航

- [**快速开始**](/guide/getting-started) - 5 分钟上手指南
- [**API 参考**](/api/config) - 完整的 API 文档
- [**使用示例**](/examples/basic) - 实际项目示例
- **最佳实践** - 推荐的使用模式

## 🤝 社区支持

- [GitHub Issues](https://github.com/ldesign/ldesign-config/issues) - 报告问题和建议
- [GitHub Discussions](https://github.com/ldesign/ldesign-config/discussions) - 社区讨论
- [NPM Package](https://www.npmjs.com/package/ldesign-config) - 包信息和版本历史

## 📄 许可证

[MIT License](https://github.com/ldesign/ldesign-config/blob/main/LICENSE) © 2024 LDesign Team