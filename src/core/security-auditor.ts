import { execa } from 'execa'
import pacote from 'pacote'
import type {
  SecurityAuditResult,
  VulnerabilityInfo,
  LicenseInfo,
  SecurityScore,
  SecuritySummary,
  SecurityConfig,
  PackageJson
} from '../types'
import { DependencyError } from '../types'
import { DependencyManager } from './dependency-manager'
import { DepsErrorCode } from '../constants'
import { logger } from './logger'

/**
 * 安全审计器 - 扫描漏洞、检查许可证、评估依赖安全性
 * 
 * 功能特性：
 * - 漏洞扫描（基于 npm audit）
 * - 许可证检查
 * - 安全评分计算
 * - 可配置的审计级别和白/黑名单
 * 
 * @example
 * ```ts
 * const auditor = new SecurityAuditor(process.cwd(), {
 *   auditLevel: 'high',
 *   checkLicenses: true,
 *   allowedLicenses: ['MIT', 'Apache-2.0'],
 *   blockedLicenses: ['GPL-3.0']
 * })
 * 
 * const result = await auditor.audit()
 * console.log(`安全评分: ${result.securityScore.overall}/100`)
 * ```
 */
export class SecurityAuditor {
  private config: SecurityConfig
  private manager: DependencyManager

  constructor(
    private projectDir: string = process.cwd(),
    config?: Partial<SecurityConfig>
  ) {
    this.config = {
      auditLevel: 'moderate',
      checkLicenses: true,
      allowedLicenses: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'],
      blockedLicenses: ['AGPL-3.0', 'GPL-3.0'],
      ignoreVulnerabilities: [],
      ...config
    }
    this.manager = new DependencyManager(projectDir)
  }

  /**
   * 执行完整的安全审计
   */
  async audit(): Promise<SecurityAuditResult> {
    try {
      const [vulnerabilities, licenses] = await Promise.all([
        this.scanVulnerabilities(),
        this.config.checkLicenses ? this.checkLicenses() : Promise.resolve([])
      ])

      const summary = this.generateSummary(vulnerabilities)
      const securityScore = await this.calculateSecurityScore(vulnerabilities, licenses)

      return {
        vulnerabilities,
        licenses,
        securityScore,
        summary,
        timestamp: Date.now()
      }
    } catch (error) {
      logger.error('安全审计失败', error)
      throw new DependencyError(
        `安全审计失败: ${error instanceof Error ? error.message : String(error)}`,
        DepsErrorCode.AUDIT_FAILED,
        error
      )
    }
  }

  /**
   * 扫描漏洞
   */
  async scanVulnerabilities(): Promise<VulnerabilityInfo[]> {
    const vulnerabilities: VulnerabilityInfo[] = []

    try {
      // 使用 npm audit
      const npmVulns = await this.runNpmAudit()
      vulnerabilities.push(...npmVulns)
    } catch (error) {
      logger.warn('npm audit 执行失败', error)
    }

    // 过滤忽略的漏洞
    return vulnerabilities.filter(
      vuln => !this.config.ignoreVulnerabilities.includes(vuln.id)
    )
  }

  /**
   * 运行 npm audit
   */
  private async runNpmAudit(): Promise<VulnerabilityInfo[]> {
    try {
      const { stdout } = await execa('npm', ['audit', '--json'], {
        cwd: this.projectDir,
        reject: false
      })

      const auditResult = JSON.parse(stdout)
      const vulnerabilities: VulnerabilityInfo[] = []

      if (auditResult.vulnerabilities) {
        for (const [pkgName, vuln] of Object.entries(auditResult.vulnerabilities) as [string, any][]) {
          const severity = this.mapSeverity(vuln.severity)

          // 根据配置的审计级别过滤
          if (this.shouldIncludeVulnerability(severity)) {
            vulnerabilities.push({
              id: vuln.via?.[0]?.source?.toString() || `vuln-${pkgName}`,
              packageName: pkgName,
              version: vuln.range || 'unknown',
              severity,
              title: vuln.via?.[0]?.title || `漏洞: ${pkgName}`,
              description: vuln.via?.[0]?.description || '暂无描述',
              cve: vuln.via?.filter((v: any) => v.source).map((v: any) => v.source),
              cvss: vuln.via?.[0]?.cvss?.score,
              recommendation: vuln.fixAvailable ? '可以更新到安全版本' : '暂无修复版本',
              fixedIn: vuln.fixAvailable?.version,
              patchAvailable: !!vuln.fixAvailable,
              url: vuln.via?.[0]?.url
            })
          }
        }
      }

      return vulnerabilities
    } catch (error) {
      logger.error('npm audit 执行失败', error)
      throw new DependencyError(
        'npm audit 执行失败',
        DepsErrorCode.NPM_AUDIT_FAILED,
        error
      )
    }
  }

  /**
   * 检查许可证
   */
  async checkLicenses(): Promise<LicenseInfo[]> {
    try {
      const deps = await this.manager.getAllDependencies()
      const licenses: LicenseInfo[] = []

      for (const [name, info] of Object.entries(deps)) {
        try {
          const manifest = await pacote.manifest(name, {
            fullMetadata: true
          })

          const licenseStr = manifest.license || 'UNKNOWN'
          const licenseType = this.getLicenseType(licenseStr)
          const compatible = this.isLicenseCompatible(licenseStr)

          licenses.push({
            packageName: name,
            version: info.version,
            license: licenseStr,
            licenseType,
            compatible,
            url: manifest.homepage,
            warning: compatible ? undefined : `许可证 ${licenseStr} 可能不兼容`
          })
        } catch (error) {
          // 无法获取许可证信息时跳过并记录
          logger.warn(`无法获取 ${name} 的许可证信息`, error)
        }
      }

      return licenses
    } catch (error) {
      logger.error('许可证检查失败', error)
      throw new DependencyError(
        '许可证检查失败',
        DepsErrorCode.LICENSE_CHECK_FAILED,
        error
      )
    }
  }

  /**
   * 计算安全评分
   */
  private async calculateSecurityScore(
    vulnerabilities: VulnerabilityInfo[],
    licenses: LicenseInfo[]
  ): Promise<SecurityScore> {
    const deps = await this.manager.getAllDependencies()
    const totalPackages = Object.keys(deps).length

    // 漏洞评分 (0-100)
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length
    const moderateCount = vulnerabilities.filter(v => v.severity === 'moderate').length
    const lowCount = vulnerabilities.filter(v => v.severity === 'low').length

    const vulnerabilityScore = Math.max(
      0,
      100 - (criticalCount * 20 + highCount * 10 + moderateCount * 5 + lowCount * 2)
    )

    // 许可证评分 (0-100)
    const incompatibleCount = licenses.filter(l => !l.compatible).length
    const licenseScore = Math.max(0, 100 - (incompatibleCount * 10))

    // 维护评分 (基于依赖的维护状态，这里简化处理)
    const maintenanceScore = 75 // 默认值，实际应该检查更新频率、最后发布时间等

    // 流行度评分 (基于下载量，这里简化处理)
    const popularityScore = 70 // 默认值，实际应该从 npm registry 获取

    // 综合评分
    const overall = Math.round(
      vulnerabilityScore * 0.4 +
      licenseScore * 0.2 +
      maintenanceScore * 0.2 +
      popularityScore * 0.2
    )

    return {
      overall,
      vulnerabilityScore,
      licenseScore,
      maintenanceScore,
      popularityScore
    }
  }

  /**
   * 生成安全摘要
   */
  private generateSummary(vulnerabilities: VulnerabilityInfo[]): SecuritySummary {
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length
    const moderateCount = vulnerabilities.filter(v => v.severity === 'moderate').length
    const lowCount = vulnerabilities.filter(v => v.severity === 'low').length

    const vulnerablePackages = new Set(vulnerabilities.map(v => v.packageName)).size

    return {
      totalPackages: 0, // 将在 audit() 中填充
      vulnerablePackages,
      criticalCount,
      highCount,
      moderateCount,
      lowCount,
      incompatibleLicenses: 0 // 将在 audit() 中填充
    }
  }

  /**
   * 映射严重程度
   */
  private mapSeverity(severity: string): 'critical' | 'high' | 'moderate' | 'low' | 'info' {
    const normalizedSeverity = severity?.toLowerCase() || 'info'

    if (['critical', 'high', 'moderate', 'low', 'info'].includes(normalizedSeverity)) {
      return normalizedSeverity as any
    }

    return 'info'
  }

  /**
   * 判断是否应该包含该漏洞
   */
  private shouldIncludeVulnerability(severity: string): boolean {
    const levels = ['info', 'low', 'moderate', 'high', 'critical']
    const configLevel = levels.indexOf(this.config.auditLevel)
    const vulnLevel = levels.indexOf(severity)

    return vulnLevel >= configLevel
  }

  /**
   * 获取许可证类型
   */
  private getLicenseType(license: string): 'permissive' | 'copyleft' | 'proprietary' | 'unknown' {
    const licenseUpper = license.toUpperCase()

    const permissive = ['MIT', 'APACHE', 'BSD', 'ISC', 'UNLICENSE', '0BSD']
    const copyleft = ['GPL', 'AGPL', 'LGPL', 'MPL', 'EPL']

    if (permissive.some(p => licenseUpper.includes(p))) {
      return 'permissive'
    }

    if (copyleft.some(c => licenseUpper.includes(c))) {
      return 'copyleft'
    }

    if (licenseUpper.includes('PROPRIETARY') || licenseUpper.includes('UNLICENSED')) {
      return 'proprietary'
    }

    return 'unknown'
  }

  /**
   * 判断许可证是否兼容
   */
  private isLicenseCompatible(license: string): boolean {
    const licenseUpper = license.toUpperCase()

    // 检查是否在黑名单中
    if (this.config.blockedLicenses.some(blocked => licenseUpper.includes(blocked.toUpperCase()))) {
      return false
    }

    // 如果设置了白名单，检查是否在白名单中
    if (this.config.allowedLicenses.length > 0) {
      return this.config.allowedLicenses.some(allowed => licenseUpper.includes(allowed.toUpperCase()))
    }

    // 默认允许
    return true
  }

  /**
   * 生成漏洞报告（格式化输出）
   */
  generateReport(result: SecurityAuditResult): string {
    const lines: string[] = []

    lines.push('='.repeat(60))
    lines.push('安全审计报告')
    lines.push('='.repeat(60))
    lines.push('')

    // 摘要
    lines.push('摘要:')
    lines.push(`  总包数: ${result.summary.totalPackages}`)
    lines.push(`  存在漏洞的包: ${result.summary.vulnerablePackages}`)
    lines.push(`  严重: ${result.summary.criticalCount}`)
    lines.push(`  高危: ${result.summary.highCount}`)
    lines.push(`  中危: ${result.summary.moderateCount}`)
    lines.push(`  低危: ${result.summary.lowCount}`)
    lines.push('')

    // 安全评分
    lines.push(`安全评分: ${result.securityScore.overall}/100`)
    lines.push(`  漏洞评分: ${result.securityScore.vulnerabilityScore}`)
    lines.push(`  许可证评分: ${result.securityScore.licenseScore}`)
    lines.push(`  维护评分: ${result.securityScore.maintenanceScore}`)
    lines.push(`  流行度评分: ${result.securityScore.popularityScore}`)
    lines.push('')

    // 漏洞详情
    if (result.vulnerabilities.length > 0) {
      lines.push('漏洞详情:')
      result.vulnerabilities.forEach((vuln, index) => {
        lines.push(`  ${index + 1}. [${vuln.severity.toUpperCase()}] ${vuln.packageName}`)
        lines.push(`     ${vuln.title}`)
        if (vuln.fixedIn) {
          lines.push(`     修复版本: ${vuln.fixedIn}`)
        }
      })
      lines.push('')
    }

    // 许可证问题
    const incompatibleLicenses = result.licenses.filter(l => !l.compatible)
    if (incompatibleLicenses.length > 0) {
      lines.push('许可证问题:')
      incompatibleLicenses.forEach((lic, index) => {
        lines.push(`  ${index + 1}. ${lic.packageName}: ${lic.license}`)
        if (lic.warning) {
          lines.push(`     ${lic.warning}`)
        }
      })
    }

    lines.push('='.repeat(60))

    return lines.join('\n')
  }
}

