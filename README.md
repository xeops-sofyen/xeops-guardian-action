# 🛡️ XeOps Guardian - AI Ethical Hacking for Developers

> **Secure Your Code. Exploit Theirs.**

[![XeOps](https://img.shields.io/badge/Powered%20by-XeOps.ai-red)](https://www.xeops.ai)
[![Marketplace](https://img.shields.io/badge/GitHub-Marketplace-blue)](https://github.com/marketplace/actions/xeops-guardian)
[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue)](https://marketplace.visualstudio.com/items?itemName=xeops.xeops-guardian)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

AI-powered vulnerability scanning with verified exploit generation for ethical hackers and security teams. OWASP Top 10 coverage, proof-of-concept generation, and compliance reporting capabilities.

## 🚀 Features

- **🤖 AI-Powered Analysis**: Advanced vulnerability detection using LLM technology
- **🔍 Multi-Layer Scanning**: SAST, dependency checks, and configuration analysis
- **💥 Exploit Generation**: Automatic PoC creation for critical vulnerabilities
- **📊 PR Integration**: Detailed security reports directly in your pull requests
- **🎯 Zero False Positives**: AI validation reduces noise and alert fatigue
- **⚡ Fast Execution**: Results in under 60 seconds for most repositories

## 📦 Quick Start

### Basic Usage

```yaml
name: Security Scan

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: XeOps Guardian Scan
        uses: xeops-ai/xeops-guardian@v1
        with:
          api-key: ${{ secrets.XEOPS_API_KEY }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Advanced Configuration

```yaml
name: Deep Security Analysis

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  xeops-scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      security-events: write

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for better analysis

      - name: XeOps Security Scan
        id: xeops
        uses: xeops-ai/security-scan@v1
        with:
          api-key: ${{ secrets.XEOPS_API_KEY }}
          scan-type: 'deep'
          fail-on-critical: 'true'
          generate-exploits: 'true'
          comment-pr: 'true'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload SARIF results
        if: always()
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: xeops-results.sarif
```

## ⚙️ Configuration Options

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `api-key` | Your XeOps API Key ([Get one here](https://www.xeops.ai/dashboard/settings)) | ✅ Yes | - |
| `scan-type` | Scan intensity: `quick`, `standard`, or `deep` | No | `standard` |
| `fail-on-critical` | Fail the workflow if critical vulnerabilities are found | No | `true` |
| `generate-exploits` | Generate exploit PoCs for found vulnerabilities | No | `false` |
| `comment-pr` | Post scan results as a PR comment | No | `true` |

## 📊 Outputs

| Output | Description |
|--------|-------------|
| `vulnerabilities-found` | Total number of vulnerabilities detected |
| `critical-count` | Number of critical severity vulnerabilities |
| `report-url` | Link to full report on XeOps dashboard |
| `scan-id` | Unique identifier for this scan |

## 🎯 Scan Types Explained

### Quick Scan (⚡ ~30s)
- Basic SAST analysis
- Known vulnerability patterns
- Dependency security checks
- Best for: Frequent commits, feature branches

### Standard Scan (🔍 ~60s)
- Complete SAST analysis
- Configuration security review
- Secret detection
- AI-powered validation
- Best for: Pull requests, pre-merge checks

### Deep Scan (🔬 ~2-3min)
- Everything in Standard
- Exploit generation
- Supply chain analysis
- Historical vulnerability correlation
- Best for: Release branches, production deployments

## 💬 PR Comment Example

When `comment-pr` is enabled, XeOps will post a detailed security report:

> ## 🛡️ XeOps Security Scan Results
>
> **Scan ID:** scan_abc123xyz
> **Status:** ❌ Issues Found
>
> ### 📊 Vulnerabilities Summary
> - 🔴 **Critical:** 2
> - 🟠 **High:** 5
> - 🟡 **Medium:** 8
> - 🟢 **Low:** 12
>
> **Total:** 27 vulnerabilities found
>
> ### ⚠️ Critical Issues
> - **SQL Injection** in `api/users.js:45`
>   Unsanitized user input in database query
> - **Remote Code Execution** in `utils/exec.js:12`
>   Unsafe command execution with user input
>
> ### 🔥 Exploit Generation
> Exploit PoCs have been generated for critical vulnerabilities.
>
> [View Full Report →](https://www.xeops.ai/dashboard/scans/scan_abc123xyz)

## 🔐 Security & Privacy

- **No Code Storage**: We never store your source code
- **Encrypted Transmission**: All data is encrypted in transit
- **SOC 2 Compliant**: Enterprise-grade security standards
- **GDPR Compliant**: Full data privacy protection
- **API Key Security**: Keys are never exposed in logs

## 🚦 Exit Codes

| Code | Status | Description |
|------|--------|-------------|
| 0 | ✅ Success | Scan completed, no critical issues |
| 1 | ❌ Failed | Critical vulnerabilities found (when `fail-on-critical: true`) |
| 2 | ⚠️ Error | Configuration or API error |

## 🔗 Ecosystem Integration

### VS Code Extension
Use XeOps Guardian directly in your IDE for real-time security analysis:
- 🎮 [Install VS Code Extension](https://marketplace.visualstudio.com/items?itemName=xeops.xeops-guardian)
- Switch between Defense and Offense modes
- Generate exploits directly from code
- AI-powered security chat

### Bug Bounty Platforms
Automatically submit findings to:
- HackerOne
- YesWeHack
- Bugcrowd
- Intigriti

## 🔄 Integration with Other Tools

### GitHub Advanced Security
```yaml
- name: Upload to GitHub Security
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: xeops-results.sarif
```

### Slack Notifications
```yaml
- name: Notify Slack
  if: steps.xeops.outputs.critical-count > 0
  uses: slackapi/slack-github-action@v1
  with:
    channel-id: 'security-alerts'
    slack-message: "⚠️ Critical vulnerabilities found! ${{ steps.xeops.outputs.report-url }}"
```

## 🏢 Enterprise Features

For enterprise customers, additional features are available:
- **Custom Rules**: Define organization-specific security policies
- **Private Scanning**: On-premise scanning options
- **SLA Support**: Guaranteed response times
- **Compliance Reports**: SOC2, HIPAA, PCI-DSS reporting
- **API Access**: Direct API integration for custom workflows

[Contact Sales →](https://www.xeops.ai/enterprise)

## 🤝 Support

- **Documentation**: [docs.xeops.ai](https://docs.xeops.ai)
- **Issues**: [GitHub Issues](https://github.com/xeops-ai/security-scan/issues)
- **Email**: support@xeops.ai
- **Discord**: [Join our community](https://discord.gg/xeops)

## 📈 Roadmap

- [ ] SAST for 15+ languages
- [ ] Container scanning
- [ ] Infrastructure as Code analysis
- [ ] License compliance checking
- [ ] Auto-fix suggestions with AI
- [ ] Integration with more CI/CD platforms

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by <a href="https://www.xeops.ai">XeOps.ai</a><br>
  <a href="https://www.xeops.ai">Website</a> •
  <a href="https://marketplace.visualstudio.com/items?itemName=xeops.xeops-guardian">VS Code Extension</a> •
  <a href="https://github.com/xeops-ai">GitHub</a>
</p>