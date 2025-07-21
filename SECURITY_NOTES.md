# Security Notes

## Known Vulnerabilities

### CopilotKit Runtime - IP Package SSRF Vulnerability
- **Status**: Unresolved (dependency limitation)
- **Package**: @copilotkit/runtime -> ip package
- **Severity**: High
- **Issue**: SSRF improper categorization in isPublic
- **CVE**: GHSA-2p57-rm9w-gvfp
- **Resolution**: Waiting for CopilotKit team to update their bundled dependencies
- **Mitigation**: Monitor for updates to @copilotkit/runtime package

### Recommendations
1. Monitor CopilotKit releases for security updates
2. Consider alternative chat runtime if security is critical
3. Implement server-side IP validation if using IP-related features
4. Regular security audits with `npm audit`

### Security Configurations Applied
- Enabled npm audit in .npmrc
- Added security overrides for known vulnerabilities
- Configured dependency resolution for type safety