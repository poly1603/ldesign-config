import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'LDesign Config',
  description: '强大的 Node.js 配置加载插件，支持多种格式和热重载',
  
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API 参考', link: '/api/config' },
      { text: '示例', link: '/examples/basic' }
    ],
    
    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
            { text: '基础用法', link: '/guide/basic-usage' }
          ]
        }
      ],
      
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: 'LDesignConfig', link: '/api/config' }
          ]
        }
      ],
      
      '/examples/': [
        {
          text: '使用示例',
          items: [
            { text: '基础示例', link: '/examples/basic' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ldesign/ldesign-config' }
    ]
  }
});