# 安装

## 系统要求

- Node.js 16.0 或更高版本
- npm、yarn 或 pnpm 包管理器

## 使用 npm 安装

```bash
npm install ldesign-config
```

## 使用 yarn 安装

```bash
yarn add ldesign-config
```

## 使用 pnpm 安装

```bash
pnpm add ldesign-config
```

## 开发依赖安装

如果你只在开发环境中使用配置加载功能：

```bash
npm install --save-dev ldesign-config
```

## 验证安装

安装完成后，你可以通过以下方式验证安装是否成功：

```javascript
const { LDesignConfig } = require('ldesign-config');

console.log('LDesign Config 安装成功！');
```

或者使用 ES6 模块语法：

```javascript
import { LDesignConfig } from 'ldesign-config';

console.log('LDesign Config 安装成功！');
```

## 下一步

安装完成后，请查看 [快速开始](./getting-started.md) 了解如何使用 LDesign Config。