import { LDesignConfig, type MergeOptions, type ValidationSchema, type ConfigTemplate } from '../src';

// 示例：使用增强的配置加载功能
async function demonstrateAdvancedFeatures() {
  console.log('🚀 LDesign Config - 增强功能演示\n');

  // 1. 定义配置验证模式
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
        port: { required: true, type: 'number' }
      }
    }
  };

  // 2. 定义配置模板
  const templates: ConfigTemplate[] = [
    {
      name: 'default-database',
      condition: (config) => !config.database,
      template: {
        database: {
          host: 'localhost',
          port: 5432,
          name: 'defaultdb'
        }
      }
    }
  ];

  // 3. 定义合并选项
  const mergeOptions: MergeOptions = {
    arrayMergeStrategy: 'concat',
    customMergers: {
      features: (target: string[], source: string[]) => {
        // 数组去重合并
        const combined = [...(target || []), ...(source || [])];
        return [...new Set(combined)];
      }
    }
  };

  // 4. 定义配置转换器
  const transformers = {
    envInterpolation: (value: any) => {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const envVar = value.slice(2, -1);
        return process.env[envVar] || value;
      }
      return value;
    }
  };

  // 5. 创建配置加载器实例
  const configLoader = new LDesignConfig('advanced-config', {
    configDir: './examples',
    debug: true,
    mergeOptions,
    validationSchema,
    templates,
    transformers
  });

  try {
    // 6. 加载配置
    console.log('📁 加载配置文件...');
    const result = await configLoader.load();
    
    console.log('✅ 配置加载成功!');
    console.log('📄 加载的文件:', result.files.map(f => f.path));
    console.log('🌍 当前环境:', result.env || 'default');
    console.log('⚙️  合并后的配置:', JSON.stringify(result.config, null, 2));

    // 7. 演示配置验证
    console.log('\n🔍 配置验证演示:');
    const validation = configLoader.validateConfiguration(result.config);
    console.log('验证结果:', validation.isValid ? '✅ 通过' : '❌ 失败');
    if (!validation.isValid) {
      console.log('验证错误:', validation.errors);
    }

    // 8. 演示自定义合并
    console.log('\n🔄 自定义合并演示:');
    const baseConfig = {
      features: ['auth', 'logging'],
      database: { host: 'localhost' }
    };
    const envConfig = {
      features: ['monitoring', 'auth'], // 包含重复项
      database: { port: 5432 }
    };
    
    const merged = configLoader.mergeConfigurations(baseConfig, envConfig);
    console.log('合并结果:', JSON.stringify(merged, null, 2));

    // 9. 演示模板应用
    console.log('\n📋 模板应用演示:');
    const incompleteConfig = { server: { port: 3000 } };
    const withTemplates = await configLoader.applyTemplates(incompleteConfig);
    console.log('应用模板后:', JSON.stringify(withTemplates, null, 2));

  } catch (error) {
    console.error('❌ 配置加载失败:', error);
  } finally {
    // 10. 清理资源
    configLoader.destroy();
  }
}

// 示例：条件合并演示
function demonstrateConditionalMerge() {
  console.log('\n🎯 条件合并演示:');
  
  const { conditionalMerge } = require('../src');
  
  const target = {
    database: { host: 'localhost', port: 5432 },
    features: ['auth']
  };
  
  const source = {
    database: { host: 'production-db', ssl: true },
    features: ['monitoring'],
    newFeature: 'value'
  };
  
  // 只在生产环境合并数据库配置
  const result = conditionalMerge(
    target,
    source,
    (key, targetVal, sourceVal) => {
      if (key === 'database') {
        return process.env.NODE_ENV === 'production';
      }
      return true; // 其他配置总是合并
    }
  );
  
  console.log('条件合并结果:', JSON.stringify(result, null, 2));
}

// 示例：转换合并演示
function demonstrateTransformMerge() {
  console.log('\n🔄 转换合并演示:');
  
  const { transformMerge } = require('../src');
  
  const target = {
    server: { port: '3000' }, // 字符串端口
    database: { timeout: '30000' } // 字符串超时
  };
  
  const source = {
    server: { host: 'localhost' },
    database: { pool: '10' }
  };
  
  const transformers = {
    portNormalizer: (value: any) => {
      if (typeof value === 'string' && /^\d+$/.test(value)) {
        return parseInt(value, 10);
      }
      return value;
    }
  };
  
  const result = transformMerge(target, source, transformers);
  console.log('转换合并结果:', JSON.stringify(result, null, 2));
}

// 运行演示
if (require.main === module) {
  demonstrateAdvancedFeatures()
    .then(() => {
      demonstrateConditionalMerge();
      demonstrateTransformMerge();
      console.log('\n🎉 所有演示完成!');
    })
    .catch(console.error);
}

export {
  demonstrateAdvancedFeatures,
  demonstrateConditionalMerge,
  demonstrateTransformMerge
};