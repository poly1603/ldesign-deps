import { execa } from 'execa'
import fs from 'fs-extra'
import type {
  DependencyTree,
  DependencyNode,
  CircularDependency,
  DependencyGraphOptions,
  GraphExportFormat
} from '../types'
import { DependencyError } from '../types'
import { DependencyManager } from './dependency-manager'

/**
 * 依赖可视化器 - 生成依赖树、检测循环依赖、导出多种格式
 */
export class DependencyVisualizer {
  private manager: DependencyManager

  constructor(private projectDir: string = process.cwd()) {
    this.manager = new DependencyManager(projectDir)
  }

  /**
   * 生成完整的依赖树
   */
  async generateTree(maxDepth: number = Infinity): Promise<DependencyTree> {
    try {
      const pkg = await this.manager.loadPackageJson()
      const dependencies = await this.buildDependencyTree(
        pkg.name || 'root',
        pkg.version || '0.0.0',
        0,
        maxDepth,
        new Set()
      )

      const circularDependencies = this.detectCircularDependencies(dependencies)

      return {
        name: pkg.name || 'root',
        version: pkg.version || '0.0.0',
        dependencies,
        depth: this.calculateMaxDepth(dependencies),
        circularDependencies,
        totalSize: await this.calculateTotalSize(dependencies)
      }
    } catch (error) {
      throw new DependencyError(
        '生成依赖树失败',
        'TREE_GENERATION_FAILED',
        error
      )
    }
  }

  /**
   * 递归构建依赖树
   */
  private async buildDependencyTree(
    name: string,
    version: string,
    currentDepth: number,
    maxDepth: number,
    visited: Set<string>
  ): Promise<DependencyNode[]> {
    if (currentDepth >= maxDepth) {
      return []
    }

    const nodeId = `${name}@${version}`
    if (visited.has(nodeId)) {
      return []
    }

    visited.add(nodeId)

    try {
      const pkg = await this.manager.loadPackageJson()
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      }

      const nodes: DependencyNode[] = []

      for (const [depName, depVersion] of Object.entries(allDeps || {})) {
        const children = await this.buildDependencyTree(
          depName,
          depVersion,
          currentDepth + 1,
          maxDepth,
          new Set(visited)
        )

        nodes.push({
          name: depName,
          version: depVersion,
          children,
          depth: currentDepth + 1,
          devDependency: !!pkg.devDependencies?.[depName],
          circular: false
        })
      }

      return nodes
    } catch (error) {
      // 无法解析某个依赖时，返回空数组
      return []
    }
  }

  /**
   * 检测循环依赖
   */
  detectCircularDependencies(nodes: DependencyNode[]): CircularDependency[] {
    const circular: CircularDependency[] = []
    const stack: string[] = []
    const visited = new Set<string>()

    const dfs = (node: DependencyNode, path: string[]) => {
      const nodeId = `${node.name}@${node.version}`

      if (path.includes(nodeId)) {
        // 发现循环
        const cycleStart = path.indexOf(nodeId)
        const cyclePath = [...path.slice(cycleStart), nodeId]

        circular.push({
          path: cyclePath,
          severity: 'warning'
        })

        node.circular = true
        return
      }

      if (visited.has(nodeId)) {
        return
      }

      visited.add(nodeId)
      const newPath = [...path, nodeId]

      for (const child of node.children) {
        dfs(child, newPath)
      }
    }

    for (const node of nodes) {
      dfs(node, [])
    }

    return circular
  }

  /**
   * 计算树的最大深度
   */
  private calculateMaxDepth(nodes: DependencyNode[]): number {
    if (nodes.length === 0) {
      return 0
    }

    let maxDepth = 0
    for (const node of nodes) {
      const childDepth = this.calculateMaxDepth(node.children)
      maxDepth = Math.max(maxDepth, node.depth, childDepth)
    }

    return maxDepth
  }

  /**
   * 计算总体积（估算）
   */
  private async calculateTotalSize(nodes: DependencyNode[]): Promise<number> {
    let totalSize = 0

    const calculateNodeSize = async (node: DependencyNode): Promise<number> => {
      let size = node.size || 0

      for (const child of node.children) {
        size += await calculateNodeSize(child)
      }

      return size
    }

    for (const node of nodes) {
      totalSize += await calculateNodeSize(node)
    }

    return totalSize
  }

  /**
   * 导出依赖图
   */
  async exportGraph(options: DependencyGraphOptions): Promise<string> {
    const tree = await this.generateTree(options.depth)

    let output: string

    switch (options.format) {
      case 'json':
        output = this.exportJSON(tree)
        break
      case 'dot':
        output = this.exportDOT(tree)
        break
      case 'mermaid':
        output = this.exportMermaid(tree)
        break
      case 'ascii':
        output = this.exportASCII(tree)
        break
      default:
        throw new DependencyError(
          `不支持的导出格式: ${options.format}`,
          'UNSUPPORTED_FORMAT'
        )
    }

    if (options.output) {
      await fs.writeFile(options.output, output, 'utf-8')
    }

    return output
  }

  /**
   * 导出为 JSON 格式
   */
  private exportJSON(tree: DependencyTree): string {
    return JSON.stringify(tree, null, 2)
  }

  /**
   * 导出为 DOT 格式 (Graphviz)
   */
  private exportDOT(tree: DependencyTree): string {
    const lines: string[] = []
    lines.push('digraph Dependencies {')
    lines.push('  rankdir=LR;')
    lines.push('  node [shape=box];')
    lines.push('')

    const addNode = (node: DependencyNode, parent?: string) => {
      const nodeId = `"${node.name}@${node.version}"`

      if (parent) {
        lines.push(`  ${parent} -> ${nodeId};`)
      }

      for (const child of node.children) {
        addNode(child, nodeId)
      }
    }

    const rootId = `"${tree.name}@${tree.version}"`
    for (const dep of tree.dependencies) {
      addNode(dep, rootId)
    }

    lines.push('}')
    return lines.join('\n')
  }

  /**
   * 导出为 Mermaid 格式
   */
  private exportMermaid(tree: DependencyTree): string {
    const lines: string[] = []
    lines.push('graph LR')

    let nodeCounter = 0
    const nodeIds = new Map<string, string>()

    const getNodeId = (name: string, version: string): string => {
      const key = `${name}@${version}`
      if (!nodeIds.has(key)) {
        nodeIds.set(key, `N${nodeCounter++}`)
      }
      return nodeIds.get(key)!
    }

    const addNode = (node: DependencyNode, parentId?: string) => {
      const nodeId = getNodeId(node.name, node.version)
      const label = `${node.name}<br/>${node.version}`

      lines.push(`  ${nodeId}["${label}"]`)

      if (parentId) {
        lines.push(`  ${parentId} --> ${nodeId}`)
      }

      for (const child of node.children) {
        addNode(child, nodeId)
      }
    }

    const rootId = getNodeId(tree.name, tree.version)
    lines.push(`  ${rootId}["${tree.name}<br/>${tree.version}"]`)

    for (const dep of tree.dependencies) {
      addNode(dep, rootId)
    }

    return lines.join('\n')
  }

  /**
   * 导出为 ASCII 树状图
   */
  private exportASCII(tree: DependencyTree): string {
    const lines: string[] = []
    lines.push(`${tree.name}@${tree.version}`)

    const renderNode = (node: DependencyNode, prefix: string, isLast: boolean) => {
      const connector = isLast ? '└── ' : '├── '
      const line = prefix + connector + `${node.name}@${node.version}`

      if (node.circular) {
        lines.push(line + ' (circular)')
      } else {
        lines.push(line)
      }

      const newPrefix = prefix + (isLast ? '    ' : '│   ')

      node.children.forEach((child, index) => {
        const childIsLast = index === node.children.length - 1
        renderNode(child, newPrefix, childIsLast)
      })
    }

    tree.dependencies.forEach((dep, index) => {
      const isLast = index === tree.dependencies.length - 1
      renderNode(dep, '', isLast)
    })

    return lines.join('\n')
  }

  /**
   * 查找依赖路径 - 解释为何安装某个包
   */
  async findDependencyPath(targetPackage: string): Promise<string[][]> {
    const tree = await this.generateTree()
    const paths: string[][] = []

    const searchNode = (node: DependencyNode, currentPath: string[]) => {
      const nodeName = `${node.name}@${node.version}`
      const newPath = [...currentPath, nodeName]

      if (node.name === targetPackage) {
        paths.push(newPath)
        return
      }

      for (const child of node.children) {
        searchNode(child, newPath)
      }
    }

    const rootPath = [`${tree.name}@${tree.version}`]
    for (const dep of tree.dependencies) {
      searchNode(dep, rootPath)
    }

    return paths
  }

  /**
   * 分析依赖大小
   */
  async analyzeSizes(): Promise<Map<string, number>> {
    const sizes = new Map<string, number>()

    try {
      // 使用 npm list 获取依赖信息
      const { stdout } = await execa('npm', ['list', '--json', '--all'], {
        cwd: this.projectDir,
        reject: false
      })

      const listResult = JSON.parse(stdout)

      const extractSizes = (deps: any) => {
        if (!deps) return

        for (const [name, info] of Object.entries<any>(deps)) {
          // 这里简化处理，实际应该计算实际安装体积
          sizes.set(name, info.version?.length || 0)

          if (info.dependencies) {
            extractSizes(info.dependencies)
          }
        }
      }

      extractSizes(listResult.dependencies)
    } catch (error) {
      console.warn('无法分析依赖大小:', error)
    }

    return sizes
  }
}

