import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@ldesign/deps',
  description: '企业级依赖管理工具 - 依赖分析、安全审计、版本管理、历史追踪、健康度评分、性能监控、成本分析、替代方案',
  
  lang: 'zh-CN',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: '指南', link: '/guide/introduction' },
      { text: 'CLI', link: '/cli/commands' },
      { text: 'API', link: '/api/core' },
      { text: '配置', link: '/config/overview' },
      { 
        text: '链接',
        items: [
          { text: 'GitHub', link: 'https://github.com/ldesign/ldesign' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@ldesign/deps' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '简介', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' }
          ]
        },
        {
          text: '核心功能',
          items: [
            { text: '依赖管理', link: '/guide/dependency-management' },
            { text: '版本检查', link: '/guide/version-checking' },
            { text: '依赖分析', link: '/guide/dependency-analysis' },
            { text: '安全审计', link: '/guide/security-audit' }
          ]
        },
        {
          text: '高级功能',
          items: [
            { text: '健康度评分', link: '/guide/health-scoring' },
            { text: '性能监控', link: '/guide/performance-monitoring' },
            { text: '成本分析', link: '/guide/cost-analysis' },
            { text: '替代方案', link: '/guide/alternatives' },
            { text: '通知告警', link: '/guide/notifications' }
          ]
        },
        {
          text: 'Monorepo',
          items: [
            { text: 'Monorepo 支持', link: '/guide/monorepo' },
            { text: '工作区管理', link: '/guide/workspace' }
          ]
        },
        {
          text: '其他',
          items: [
            { text: '依赖可视化', link: '/guide/visualization' },
            { text: '历史追踪', link: '/guide/history-tracking' },
            { text: '依赖锁定', link: '/guide/dependency-locking' }
          ]
        }
      ],
      '/cli/': [
        {
          text: 'CLI 命令',
          items: [
            { text: '命令概览', link: '/cli/commands' },
            { text: '基础命令', link: '/cli/basic-commands' },
            { text: '高级命令', link: '/cli/advanced-commands' },
            { text: '新功能命令', link: '/cli/new-commands' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '核心模块', link: '/api/core' },
            { text: 'DependencyManager', link: '/api/dependency-manager' },
            { text: 'VersionChecker', link: '/api/version-checker' },
            { text: 'DependencyAnalyzer', link: '/api/dependency-analyzer' },
            { text: 'SecurityAuditor', link: '/api/security-auditor' }
          ]
        },
        {
          text: '高级 API',
          items: [
            { text: 'DependencyHealthScorer', link: '/api/health-scorer' },
            { text: 'PerformanceMonitor', link: '/api/performance-monitor' },
            { text: 'DependencyCostAnalyzer', link: '/api/cost-analyzer' },
            { text: 'DependencyAlternativesFinder', link: '/api/alternatives-finder' },
            { text: 'NotificationManager', link: '/api/notification-manager' }
          ]
        },
        {
          text: '其他 API',
          items: [
            { text: 'DependencyVisualizer', link: '/api/visualizer' },
            { text: 'WorkspaceManager', link: '/api/workspace-manager' },
            { text: 'DependencyLockManager', link: '/api/lock-manager' },
            { text: 'DependencyHistoryTracker', link: '/api/history-tracker' }
          ]
        }
      ],
      '/config/': [
        {
          text: '配置',
          items: [
            { text: '配置概览', link: '/config/overview' },
            { text: '配置文件', link: '/config/config-file' },
            { text: '环境变量', link: '/config/environment' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ldesign/ldesign' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 LDesign Team'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/ldesign/ldesign/edit/main/tools/deps/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    }
  },

  markdown: {
    lineNumbers: true
  }
})
