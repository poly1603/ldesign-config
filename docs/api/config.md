# LDesignConfig API

`LDesignConfig` 是配置加载器的核心类，提供了配置文件的加载、监听和管理功能。

## 构造函数

### `new LDesignConfig(name, options?)`

创建一个新的配置加载器实例。

**参数：**

- `name` (`string`) - 配置文件名称前缀
- `options` (`ConfigOptions`, 可选) - 配置选项

**示例：**

```typescript
import { LDesignConfig } from 'ldesign-config';

// 基础用法
const config = new LDesignConfig('myapp');

// 带选项
const config = new LDesignConfig('myapp', {
  configDir: './config',
  watch: true,
  cache: true
});
```

## 配置选项 (ConfigOptions)

```typescript
interface ConfigOptions {
  /** 配置文件目录，默认为 process.cwd() */
  configDir?: string;
  
  /** 是否启用文件监听，默认为 false */
  watch?: boolean;
  
  /** 是否启用配置缓存，默认为 true */
  cache?: boolean;
  
  /** 自定义文件扩展名优先级 */
  extensions?: string[];
  
  /** 监听选项 */
  watchOptions?: {
    /** 防抖延迟时间（毫秒），默认为 100 */
    debounce?: number;
    
    /** 是否监听子目录，默认为 false */
    recursive?: boolean;
    
    /** 忽略的文件模式 */
    ignored?: string | RegExp | (string | RegExp)[];
  };
}
```

## 实例方法

### `getConfig(env?)`

加载指定环境的配置。

**参数：**

- `env` (`string`, 可选) - 环境名称，如 'dev', 'prod', 'test'

**返回值：**

- `Promise<any>` - 解析后的配置对象

**示例：**

```typescript
// 加载基础配置
const baseConfig = await config.getConfig();

// 加载开发环境配置
const devConfig = await config.getConfig('dev');

// 加载生产环境配置
const prodConfig = await config.getConfig('prod');
```

**配置合并规则：**

1. 首先加载基础配置文件 (`{name}.config.{ext}`)
2. 然后加载环境特定配置文件 (`{name}.config.{env}.{ext}`)
3. 使用深度合并策略合并两个配置对象
4. 环境配置会覆盖基础配置的同名属性

### `watch(callback, env?)`

启用配置文件监听，当文件发生变更时触发回调。

**参数：**

- `callback` (`WatchCallback`) - 变更回调函数
- `env` (`string`, 可选) - 要监听的环境，默认监听所有相关文件

**回调函数签名：**

```typescript
type WatchCallback = (
  newConfig: any,
  changedFile: string,
  eventType: 'add' | 'change' | 'unlink'
) => void;
```

**示例：**

```typescript
// 监听所有配置文件
config.watch((newConfig, changedFile, eventType) => {
  console.log('配置已更新:', newConfig);
  console.log('变更文件:', changedFile);
  console.log('事件类型:', eventType);
  
  // 重新初始化应用
  app.updateConfig(newConfig);
});

// 只监听开发环境配置
config.watch((newConfig, changedFile) => {
  console.log('开发配置已更新:', newConfig);
}, 'dev');
```

### `unwatch()`

停止文件监听。

**示例：**

```typescript
// 停止监听
config.unwatch();
```

### `clearCache()`

清除配置缓存。

**示例：**

```typescript
// 清除缓存
config.clearCache();

// 重新加载配置
const freshConfig = await config.getConfig();
```

### `getConfigFiles(env?)`

获取指定环境的所有配置文件路径。

**参数：**

- `env` (`string`, 可选) - 环境名称

**返回值：**

- `ConfigFile[]` - 配置文件信息数组

**ConfigFile 接口：**

```typescript
interface ConfigFile {
  /** 文件完整路径 */
  path: string;
  
  /** 文件扩展名 */
  ext: string;
  
  /** 环境名称（如果是环境特定配置） */
  env?: string;
  
  /** 是否存在 */
  exists: boolean;
}
```

**示例：**

```typescript
// 获取基础配置文件
const baseFiles = config.getConfigFiles();

// 获取开发环境配置文件
const devFiles = config.getConfigFiles('dev');

console.log('配置文件:', baseFiles.map(f => f.path));
```

## 静态方法

### `LDesignConfig.create(name, options?)`

创建配置加载器实例的静态工厂方法。

**参数：**

- `name` (`string`) - 配置文件名称前缀
- `options` (`ConfigOptions`, 可选) - 配置选项

**返回值：**

- `LDesignConfig` - 配置加载器实例

**示例：**

```typescript
// 等价于 new LDesignConfig('myapp')
const config = LDesignConfig.create('myapp');
```

### `LDesignConfig.loadConfig(filePath)`

直接加载指定路径的配置文件。

**参数：**

- `filePath` (`string`) - 配置文件路径

**返回值：**

- `Promise<any>` - 解析后的配置对象

**示例：**

```typescript
// 直接加载配置文件
const config = await LDesignConfig.loadConfig('./config/app.config.ts');
```

## 事件

`LDesignConfig` 继承自 `EventEmitter`，支持以下事件：

### `config:loaded`

配置加载完成时触发。

```typescript
config.on('config:loaded', (configData, env) => {
  console.log('配置加载完成:', configData);
  console.log('环境:', env);
});
```

### `config:changed`

配置文件变更时触发（需要启用监听）。

```typescript
config.on('config:changed', (newConfig, changedFile) => {
  console.log('配置已变更:', newConfig);
  console.log('变更文件:', changedFile);
});
```

### `error`

发生错误时触发。

```typescript
config.on('error', (error) => {
  console.error('配置加载错误:', error);
});
```

## 完整示例

```typescript
import { LDesignConfig } from 'ldesign-config';

// 创建配置加载器
const config = new LDesignConfig('myapp', {
  configDir: './config',
  watch: true,
  cache: true,
  watchOptions: {
    debounce: 200,
    ignored: /node_modules/
  }
});

// 监听事件
config.on('config:loaded', (data, env) => {
  console.log(`✅ 配置加载完成 [${env || 'base'}]:`, data);
});

config.on('config:changed', (newConfig, file) => {
  console.log(`🔄 配置已更新 [${file}]:`, newConfig);
});

config.on('error', (error) => {
  console.error('❌ 配置错误:', error.message);
});

// 加载配置
try {
  const appConfig = await config.getConfig();
  console.log('应用配置:', appConfig);
  
  const devConfig = await config.getConfig('dev');
  console.log('开发配置:', devConfig);
  
  // 启用热重载
  config.watch((newConfig, changedFile) => {
    console.log('配置热重载:', { newConfig, changedFile });
    // 更新应用配置...
  });
  
} catch (error) {
  console.error('配置加载失败:', error);
}

// 应用退出时清理
process.on('SIGINT', () => {
  config.unwatch();
  process.exit(0);
});
```

## 错误处理

### 常见错误类型

```typescript
// 配置文件不存在
try {
  const config = await configLoader.getConfig('nonexistent');
} catch (error) {
  if (error.code === 'CONFIG_NOT_FOUND') {
    console.log('配置文件不存在，使用默认配置');
  }
}

// 配置文件格式错误
try {
  const config = await configLoader.getConfig();
} catch (error) {
  if (error.code === 'PARSE_ERROR') {
    console.error('配置文件格式错误:', error.message);
  }
}

// 文件监听错误
config.on('error', (error) => {
  if (error.code === 'WATCH_ERROR') {
    console.error('文件监听错误:', error.message);
  }
});
```

### 错误代码

- `CONFIG_NOT_FOUND` - 配置文件不存在
- `PARSE_ERROR` - 配置文件解析错误
- `WATCH_ERROR` - 文件监听错误
- `INVALID_CONFIG` - 无效的配置内容
- `PERMISSION_ERROR` - 文件权限错误

## 性能优化

### 缓存策略

```typescript
// 启用缓存（默认）
const config = new LDesignConfig('myapp', {
  cache: true
});

// 手动清除缓存
config.clearCache();

// 禁用缓存（每次都重新读取文件）
const config = new LDesignConfig('myapp', {
  cache: false
});
```

### 监听优化

```typescript
// 配置防抖以减少频繁触发
const config = new LDesignConfig('myapp', {
  watch: true,
  watchOptions: {
    debounce: 300, // 300ms 防抖
    ignored: [
      /node_modules/,
      /\.git/,
      /dist/
    ]
  }
});
```

## 类型定义

完整的 TypeScript 类型定义请参考 [类型定义文档](/api/types)。