# LDesign Config

A powerful Node.js configuration loader plugin with multi-format support and hot reload capabilities.

## ✨ Features

- 🔧 **Multi-format Support**: TypeScript, JavaScript, JSON, JSON5, YAML, and .env files
- 🌍 **Environment-specific Configs**: Automatic environment detection and configuration merging
- 🔥 **Hot Reload**: Real-time configuration updates with file watching
- 📦 **Zero Dependencies**: Lightweight and fast
- 🛡️ **Type Safety**: Full TypeScript support with type inference
- 🎯 **Smart Resolution**: Intelligent file discovery and loading priority
- 🔍 **Debug Mode**: Comprehensive logging for troubleshooting
- 🔄 **Advanced Merging**: Flexible merge strategies with custom mergers and array handling
- ✅ **Configuration Validation**: Schema-based validation with default values
- 📋 **Configuration Templates**: Conditional template application
- 🔀 **Value Transformation**: Custom transformers for configuration values
- 🎛️ **Conditional Merging**: Environment-aware configuration merging

## Installation

```bash
npm install ldesign-config
# or
yarn add ldesign-config
# or
pnpm add ldesign-config
```

## Quick Start

### Basic Usage

```typescript
import { LDesignConfig, defineConfig } from 'ldesign-config';

// Create a configuration loader
const config = new LDesignConfig('myapp', {
  configDir: './config',
  watch: true, // Enable hot reload
  debug: true
});

// Load configuration
const appConfig = await config.getConfig();
console.log(appConfig);
```

## 🔥 Advanced Features

### Enhanced Configuration Merging

```typescript
import { LDesignConfig, type MergeOptions } from 'ldesign-config';

// Define merge options
const mergeOptions: MergeOptions = {
  arrayMergeStrategy: 'concat', // 'concat' | 'replace'
  customMergers: {
    // Custom merger for features array (remove duplicates)
    features: (target: string[], source: string[]) => {
      const combined = [...(target || []), ...(source || [])];
      return [...new Set(combined)];
    }
  },
  skipKeys: ['_internal'], // Skip internal configurations
  onlyKeys: ['database', 'server'] // Only merge specific keys
};

const configLoader = new LDesignConfig('app', {
  mergeOptions
});
```

### Configuration Validation

```typescript
import { type ValidationSchema } from 'ldesign-config';

// Define validation schema
const validationSchema: ValidationSchema = {
  database: {
    required: true,
    type: 'object',
    properties: {
      host: { required: true, type: 'string' },
      port: { required: true, type: 'number' },
      name: { required: true, type: 'string' }
    }
  },
  server: {
    required: true,
    type: 'object',
    properties: {
      port: { required: true, type: 'number' },
      host: { required: false, type: 'string', default: 'localhost' }
    }
  }
};

const configLoader = new LDesignConfig('app', {
  validationSchema
});
```

### Configuration Templates

```typescript
import { type ConfigTemplate } from 'ldesign-config';

// Define configuration templates
const templates: ConfigTemplate[] = [
  {
    name: 'database-template',
    condition: (config) => !config.database,
    template: {
      database: {
        host: 'localhost',
        port: 5432,
        name: 'defaultdb'
      }
    }
  },
  {
    name: 'server-template',
    condition: (config) => !config.server,
    template: {
      server: {
        port: 3000,
        host: 'localhost'
      }
    }
  }
];

const configLoader = new LDesignConfig('app', {
  templates
});
```

### Value Transformers

```typescript
// Define custom transformers
const transformers = {
  // Environment variable interpolation
  envInterpolation: (value: any) => {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const envVar = value.slice(2, -1);
      return process.env[envVar] || value;
    }
    return value;
  },
  // Port number normalization
  portNormalization: (value: any) => {
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    return value;
  }
};

const configLoader = new LDesignConfig('app', {
  transformers
});
```

### Complete Advanced Example

```typescript
import { LDesignConfig, defineConfig } from 'ldesign-config';
import type { MergeOptions, ValidationSchema, ConfigTemplate } from 'ldesign-config';

// app.config.ts - Base configuration
export default defineConfig({
  database: {
    host: '${DB_HOST}',
    port: '${DB_PORT}',
    name: '${DB_NAME}'
  },
  server: {
    port: '${SERVER_PORT}',
    host: '${SERVER_HOST}'
  },
  features: ['auth', 'logging']
});

// app.config.production.ts - Production overrides
export default defineConfig({
  database: {
    ssl: true,
    pool: { min: 10, max: 50 }
  },
  features: ['monitoring', 'security'],
  production: {
    cluster: true,
    workers: 4
  }
});

// Configuration loader with all advanced features
const configLoader = new LDesignConfig('app', {
  mergeOptions: {
    arrayMergeStrategy: 'concat',
    customMergers: {
      features: (target, source) => [...new Set([...target, ...source])]
    }
  },
  validationSchema: {
    database: {
      required: true,
      type: 'object',
      properties: {
        host: { required: true, type: 'string' },
        port: { required: true, type: 'number' }
      }
    }
  },
  templates: [
    {
      name: 'default-config',
      condition: (config) => !config.database,
      template: { database: { host: 'localhost', port: 5432 } }
    }
  ],
  transformers: {
    envInterpolation: (value) => {
      if (typeof value === 'string' && value.startsWith('${')) {
        const envVar = value.slice(2, -1);
        return process.env[envVar] || value;
      }
      return value;
    }
  }
});

const result = await configLoader.load();
console.log('Loaded configuration:', result.config);
```

### Configuration Files

Create configuration files in your config directory:

**config/myapp.config.ts**
```typescript
import { defineConfig } from 'ldesign-config';

export default defineConfig({
  app: {
    name: 'My Application',
    version: '1.0.0',
    port: 3000
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: 'myapp'
  }
});
```

**config/myapp.config.development.ts**
```typescript
import { defineConfig } from 'ldesign-config';

export default defineConfig({
  app: {
    port: 3001
  },
  database: {
    host: 'localhost',
    name: 'myapp_dev'
  }
});
```

**config/myapp.config.production.ts**
```typescript
import { defineConfig } from 'ldesign-config';

export default defineConfig({
  app: {
    port: process.env.PORT || 8080
  },
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME
  }
});
```

### Environment-specific Loading

```typescript
// Load development configuration
const devConfig = await config.getConfig('development');

// Load production configuration
const prodConfig = await config.getConfig('production');

// Load configuration based on NODE_ENV
const envConfig = await config.getConfig(); // Uses NODE_ENV
```

## Configuration Helpers

### defineConfig

Provides TypeScript intellisense and type checking:

```typescript
import { defineConfig } from 'ldesign-config';

export default defineConfig({
  // Your configuration with full TypeScript support
});
```

### defineEnvironmentConfig

Define configurations for multiple environments:

```typescript
import { defineEnvironmentConfig } from 'ldesign-config';

export default defineEnvironmentConfig({
  base: {
    app: {
      name: 'My App'
    }
  },
  development: {
    app: {
      debug: true
    }
  },
  production: {
    app: {
      debug: false
    }
  }
});
```

### mergeConfigs

Merge multiple configuration objects:

```typescript
import { mergeConfigs, defineConfig } from 'ldesign-config';

const baseConfig = defineConfig({ app: { name: 'App' } });
const envConfig = defineConfig({ app: { debug: true } });

export default mergeConfigs(baseConfig, envConfig);
```

## File Watching and Hot Reload

```typescript
const config = new LDesignConfig('myapp', {
  watch: true // Enable file watching
});

// Listen for configuration changes
config.on('change', (eventType, filePath, newConfig) => {
  console.log(`Config file ${filePath} was ${eventType}`);
  console.log('New configuration:', newConfig);
});

// Listen for errors
config.on('error', (error) => {
  console.error('Configuration error:', error);
});
```

## Supported File Formats

### TypeScript (.ts)
```typescript
import { defineConfig } from 'ldesign-config';

export default defineConfig({
  app: {
    name: 'My App'
  }
});
```

### JavaScript (.js)
```javascript
const { defineConfig } = require('ldesign-config');

module.exports = defineConfig({
  app: {
    name: 'My App'
  }
});
```

### JSON (.json)
```json
{
  "app": {
    "name": "My App"
  }
}
```

### JSON5 (.json5)
```json5
{
  app: {
    name: 'My App',
    // Comments are supported!
  }
}
```

### YAML (.yaml, .yml)
```yaml
app:
  name: My App
  version: 1.0.0
```

### Environment Variables (.env)
```env
APP_NAME=My App
APP_VERSION=1.0.0
DB_HOST=localhost
DB_PORT=5432
```

## API Reference

### LDesignConfig

#### Constructor
```typescript
new LDesignConfig(configName: string, options?: LDesignConfigOptions)
```

#### Options
```typescript
interface LDesignConfigOptions {
  configDir?: string;        // Configuration directory (default: process.cwd())
  watch?: boolean;           // Enable file watching (default: false)
  extensions?: ConfigFormat[]; // File extensions to search (default: all supported)
  envKey?: string;           // Environment variable name (default: 'NODE_ENV')
  debug?: boolean;           // Enable debug logging (default: false)
}
```

#### Methods

- `getConfig<T>(env?: string): Promise<ConfigResult<T>>` - Load configuration
- `reloadConfig<T>(env?: string): Promise<ConfigResult<T>>` - Reload configuration
- `enableWatch(callback?: WatchCallback): void` - Enable file watching
- `disableWatch(): Promise<void>` - Disable file watching
- `clearCache(): void` - Clear configuration cache
- `destroy(): Promise<void>` - Cleanup resources

### Helper Functions

- `defineConfig<T>(config: T): T` - Define configuration with type support
- `defineEnvironmentConfig<T>(config: EnvironmentConfig<T>): ConfigDefinition<T>` - Define environment-specific configuration
- `mergeConfigs<T>(...configs: ConfigDefinition<T>[]): ConfigDefinition<T>` - Merge multiple configurations
- `createConfig(configName: string, options?: LDesignConfigOptions): LDesignConfig` - Factory function

## Examples

### Basic Express.js App

```typescript
import express from 'express';
import { LDesignConfig } from 'ldesign-config';

const config = new LDesignConfig('server');
const appConfig = await config.getConfig();

const app = express();
app.listen(appConfig.port, () => {
  console.log(`Server running on port ${appConfig.port}`);
});
```

### With Validation

```typescript
import { defineConfigWithValidation, createConfigSchema } from 'ldesign-config';

const schema = createConfigSchema({
  port: { type: 'number', required: true },
  host: { type: 'string', default: 'localhost' }
});

export default defineConfigWithValidation({
  port: 3000,
  host: 'localhost'
}, schema.validate);
```

## License

MIT © LDesign Team

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## Support

If you have any questions or need help, please open an issue on our GitHub repository.