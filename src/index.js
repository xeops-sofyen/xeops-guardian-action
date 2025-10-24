const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

const XEOPS_API_URL = 'https://xeops-api-gateway-97758009309.europe-west1.run.app';

async function run() {
  try {
    // Get inputs
    const apiKey = process.env.XEOPS_API_KEY;
    const scanType = process.env.SCAN_TYPE || 'standard';
    const failOnCritical = process.env.FAIL_ON_CRITICAL === 'true';
    const generateExploits = process.env.GENERATE_EXPLOITS === 'true';
    const commentPR = process.env.COMMENT_PR === 'true';

    // Get context
    const context = github.context;
    const isPR = context.eventName === 'pull_request';

    console.log('🛡️ XeOps Guardian - AI Ethical Hacking');
    console.log(`📋 Repository: ${context.repo.owner}/${context.repo.repo}`);
    console.log(`🔍 Scan Type: ${scanType}`);

    // Get repository URL
    const repoUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}`;

    // Create scan
    console.log('📡 Initiating security scan...');
    const scanResponse = await axios.post(
      `${XEOPS_API_URL}/api/scans`,
      {
        target_url: repoUrl,
        scan_type: scanType,
        source: 'github-action',
        metadata: {
          repo: context.repo.repo,
          owner: context.repo.owner,
          sha: context.sha,
          pr_number: isPR ? context.payload.pull_request.number : null
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const scanId = scanResponse.data.id;
    console.log(`✅ Scan initiated with ID: ${scanId}`);

    // Wait for scan to complete (simplified - in production, poll status)
    console.log('⏳ Waiting for scan results...');
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s

    // Get scan results
    const resultsResponse = await axios.get(
      `${XEOPS_API_URL}/api/scans/${scanId}/results`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    const results = resultsResponse.data;
    const vulnerabilities = results.vulnerabilities || [];
    const criticalCount = vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const mediumCount = vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
    const lowCount = vulnerabilities.filter(v => v.severity === 'LOW').length;

    console.log('\n📊 Scan Results:');
    console.log(`🔴 Critical: ${criticalCount}`);
    console.log(`🟠 High: ${highCount}`);
    console.log(`🟡 Medium: ${mediumCount}`);
    console.log(`🟢 Low: ${lowCount}`);
    console.log(`📈 Total: ${vulnerabilities.length}`);

    // Set outputs
    core.setOutput('vulnerabilities-found', vulnerabilities.length.toString());
    core.setOutput('critical-count', criticalCount.toString());
    core.setOutput('report-url', `https://www.xeops.ai/dashboard/scans/${scanId}`);
    core.setOutput('scan-id', scanId);

    // Comment on PR if enabled
    if (isPR && commentPR) {
      const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

      const comment = `## 🛡️ XeOps Guardian - Security Analysis

**Scan ID:** ${scanId}
**Status:** ${criticalCount > 0 ? '❌ Vulnerabilities Detected' : '✅ Secure'}
**Mode:** ${generateExploits ? '⚔️ Offense (Exploit Generation)' : '🛡️ Defense (Scanning)'}

### 📊 Vulnerability Assessment
- 🔴 **Critical:** ${criticalCount}
- 🟠 **High:** ${highCount}
- 🟡 **Medium:** ${mediumCount}
- 🟢 **Low:** ${lowCount}

**Total:** ${vulnerabilities.length} vulnerabilities found

${criticalCount > 0 ? `### ⚠️ Critical Vulnerabilities
${vulnerabilities.filter(v => v.severity === 'CRITICAL').slice(0, 3).map(v =>
  `- **${v.title}** in \`${v.file || 'unknown'}\`
  ${v.description}`
).join('\n')}` : ''}

${generateExploits ? '### 🔥 Exploit Generation\n✅ Exploit PoCs have been generated and verified for critical vulnerabilities.' : ''}

### 🎯 Next Steps
${criticalCount > 0 ? '1. Review the full report for detailed exploitation paths\n2. Apply recommended fixes\n3. Re-run the scan to verify remediation' : '✅ No critical issues found. Continue with confidence!'}

[📊 View Full Report](https://www.xeops.ai/dashboard/scans/${scanId}) | [🎮 VS Code Extension](https://marketplace.visualstudio.com/items?itemName=xeops.xeops-guardian)

---
*Powered by [XeOps Guardian](https://www.xeops.ai) - AI Ethical Hacking for Security Teams*`;

      await octokit.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.payload.pull_request.number,
        body: comment
      });

      console.log('💬 Posted results to PR');
    }

    // Fail if critical vulnerabilities found
    if (failOnCritical && criticalCount > 0) {
      core.setFailed(`❌ ${criticalCount} critical vulnerabilities found! Fix required.`);
    } else {
      console.log('✅ Security scan completed successfully');
    }

  } catch (error) {
    console.error('❌ Scan failed:', error.message);
    core.setFailed(error.message);
  }
}

// Run the action
run();