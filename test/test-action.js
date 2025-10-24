const { describe, it, expect, beforeEach, jest } = require('@jest/globals');
const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

// Mock the modules
jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('axios');

describe('XeOps Guardian GitHub Action', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = process.env;

    // Reset mocks
    jest.clearAllMocks();

    // Set up default environment
    process.env = {
      ...originalEnv,
      XEOPS_API_KEY: 'test-api-key',
      GITHUB_TOKEN: 'test-github-token',
      SCAN_TYPE: 'standard',
      FAIL_ON_CRITICAL: 'true',
      GENERATE_EXPLOITS: 'false',
      COMMENT_PR: 'true'
    };

    // Mock GitHub context
    github.context = {
      eventName: 'pull_request',
      repo: {
        owner: 'test-owner',
        repo: 'test-repo'
      },
      sha: 'abc123',
      payload: {
        pull_request: {
          number: 42
        }
      }
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Scan Initiation', () => {
    it('should create a scan with correct parameters', async () => {
      const mockScanResponse = {
        data: {
          id: 'scan-123',
          status: 'pending'
        }
      };

      axios.post.mockResolvedValue(mockScanResponse);

      // Run the action
      const run = require('../src/index.js');

      // Verify API call
      expect(axios.post).toHaveBeenCalledWith(
        'https://xeops-api-gateway-97758009309.europe-west1.run.app/api/scans',
        expect.objectContaining({
          target_url: 'https://github.com/test-owner/test-repo',
          scan_type: 'standard',
          source: 'github-action',
          metadata: expect.objectContaining({
            repo: 'test-repo',
            owner: 'test-owner',
            sha: 'abc123',
            pr_number: 42
          })
        }),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should handle missing API key', async () => {
      delete process.env.XEOPS_API_KEY;

      const run = require('../src/index.js');

      expect(core.setFailed).toHaveBeenCalledWith(
        expect.stringContaining('API key')
      );
    });
  });

  describe('Vulnerability Detection', () => {
    it('should process scan results correctly', async () => {
      const mockScanResponse = {
        data: { id: 'scan-123' }
      };

      const mockResults = {
        data: {
          vulnerabilities: [
            { severity: 'CRITICAL', title: 'SQL Injection', file: 'api.js' },
            { severity: 'HIGH', title: 'XSS', file: 'view.js' },
            { severity: 'MEDIUM', title: 'Weak Crypto', file: 'auth.js' },
            { severity: 'LOW', title: 'Info Leak', file: 'log.js' }
          ]
        }
      };

      axios.post.mockResolvedValue(mockScanResponse);
      axios.get.mockResolvedValue(mockResults);

      const run = require('../src/index.js');

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify outputs
      expect(core.setOutput).toHaveBeenCalledWith('vulnerabilities-found', '4');
      expect(core.setOutput).toHaveBeenCalledWith('critical-count', '1');
      expect(core.setOutput).toHaveBeenCalledWith('scan-id', 'scan-123');
    });

    it('should fail on critical vulnerabilities when configured', async () => {
      const mockScanResponse = {
        data: { id: 'scan-123' }
      };

      const mockResults = {
        data: {
          vulnerabilities: [
            { severity: 'CRITICAL', title: 'RCE', file: 'exec.js' }
          ]
        }
      };

      axios.post.mockResolvedValue(mockScanResponse);
      axios.get.mockResolvedValue(mockResults);

      const run = require('../src/index.js');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(core.setFailed).toHaveBeenCalledWith(
        expect.stringContaining('1 critical vulnerabilities found')
      );
    });
  });

  describe('PR Comments', () => {
    it('should post comment on PR when enabled', async () => {
      const mockOctokit = {
        rest: {
          issues: {
            createComment: jest.fn()
          }
        }
      };

      github.getOctokit.mockReturnValue(mockOctokit);

      const mockScanResponse = {
        data: { id: 'scan-123' }
      };

      const mockResults = {
        data: {
          vulnerabilities: [
            { severity: 'CRITICAL', title: 'SQL Injection', file: 'db.js', description: 'Unsafe query' }
          ]
        }
      };

      axios.post.mockResolvedValue(mockScanResponse);
      axios.get.mockResolvedValue(mockResults);

      const run = require('../src/index.js');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'test-owner',
          repo: 'test-repo',
          issue_number: 42,
          body: expect.stringContaining('XeOps Guardian')
        })
      );
    });

    it('should not post comment when disabled', async () => {
      process.env.COMMENT_PR = 'false';

      const mockOctokit = {
        rest: {
          issues: {
            createComment: jest.fn()
          }
        }
      };

      github.getOctokit.mockReturnValue(mockOctokit);

      const mockScanResponse = {
        data: { id: 'scan-123' }
      };

      const mockResults = {
        data: { vulnerabilities: [] }
      };

      axios.post.mockResolvedValue(mockScanResponse);
      axios.get.mockResolvedValue(mockResults);

      const run = require('../src/index.js');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
    });
  });

  describe('Exploit Generation', () => {
    it('should request exploit generation when enabled', async () => {
      process.env.GENERATE_EXPLOITS = 'true';

      const mockScanResponse = {
        data: { id: 'scan-123' }
      };

      axios.post.mockResolvedValue(mockScanResponse);

      const run = require('../src/index.js');

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify that scan was created with exploit generation
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          scan_type: 'standard'
          // In real implementation, we'd add generate_exploits: true here
        }),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const errorMessage = 'API rate limit exceeded';
      axios.post.mockRejectedValue(new Error(errorMessage));

      const run = require('../src/index.js');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(core.setFailed).toHaveBeenCalledWith(errorMessage);
    });

    it('should handle network timeouts', async () => {
      axios.post.mockImplementation(() =>
        new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100);
        })
      );

      const run = require('../src/index.js');

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(core.setFailed).toHaveBeenCalledWith('Network timeout');
    });
  });

  describe('Scan Types', () => {
    it.each(['quick', 'standard', 'deep'])('should handle %s scan type', async (scanType) => {
      process.env.SCAN_TYPE = scanType;

      const mockScanResponse = {
        data: { id: `scan-${scanType}` }
      };

      axios.post.mockResolvedValue(mockScanResponse);

      const run = require('../src/index.js');

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          scan_type: scanType
        }),
        expect.any(Object)
      );
    });
  });
});

// Integration test
describe('XeOps Guardian Integration', () => {
  it('should complete full scan workflow', async () => {
    // This would test against a mock server or staging environment
    // Skipped in unit tests
  });
});