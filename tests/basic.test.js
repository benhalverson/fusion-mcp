/**
 * Basic smoke tests for the Fusion MCP Server
 * These tests verify the structure and basic functionality without making actual API calls
 */
import app from '../src/index';
// Mock environment for testing
const mockEnv = {
    FORGE_CLIENT_ID: 'test_client_id',
    FORGE_CLIENT_SECRET: 'test_client_secret',
    FORGE_API_BASE: 'https://developer.api.autodesk.com',
};
async function testHealthCheck() {
    console.log('Testing health check endpoint...');
    const req = new Request('http://localhost/');
    const res = await app.fetch(req, mockEnv);
    const data = await res.json();
    if (res.status !== 200) {
        throw new Error(`Health check failed with status ${res.status}`);
    }
    if (!data.name || !data.capabilities) {
        throw new Error('Health check response missing required fields');
    }
    console.log('✓ Health check passed');
    console.log(`  Server: ${data.name} v${data.version}`);
    console.log(`  Capabilities: ${data.capabilities.length} tools`);
}
async function testToolsList() {
    console.log('\nTesting tools/list endpoint...');
    const req = new Request('http://localhost/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'tools/list' }),
    });
    const res = await app.fetch(req, mockEnv);
    const data = await res.json();
    if (res.status !== 200) {
        throw new Error(`tools/list failed with status ${res.status}`);
    }
    if (!data.tools || !Array.isArray(data.tools)) {
        throw new Error('tools/list response missing tools array');
    }
    console.log('✓ Tools list passed');
    console.log(`  Total tools: ${data.tools.length}`);
    // Verify all expected tools are present
    const expectedTools = [
        'list_hubs',
        'list_projects',
        'list_designs',
        'get_top_folders',
        'export_design',
        'get_export_status',
        'download_derivative',
        'create_workitem',
        'get_workitem_status',
        'create_webhook',
        'list_webhooks',
        'delete_webhook',
        'download_file',
    ];
    const toolNames = data.tools.map((t) => t.name);
    for (const expectedTool of expectedTools) {
        if (!toolNames.includes(expectedTool)) {
            throw new Error(`Missing expected tool: ${expectedTool}`);
        }
    }
    console.log('✓ All expected tools are present');
}
async function testResourcesList() {
    console.log('\nTesting resources/list endpoint...');
    const req = new Request('http://localhost/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'resources/list' }),
    });
    const res = await app.fetch(req, mockEnv);
    const data = await res.json();
    if (res.status !== 200) {
        throw new Error(`resources/list failed with status ${res.status}`);
    }
    console.log('✓ Resources list passed');
}
async function testUnknownMethod() {
    console.log('\nTesting unknown method handling...');
    const req = new Request('http://localhost/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'unknown/method' }),
    });
    const res = await app.fetch(req, mockEnv);
    const data = await res.json();
    if (res.status !== 404) {
        throw new Error(`Expected 404 for unknown method, got ${res.status}`);
    }
    if (!data.error || data.error.code !== 'method_not_found') {
        throw new Error('Unknown method did not return proper error');
    }
    console.log('✓ Unknown method handling passed');
}
async function runTests() {
    console.log('=== Fusion MCP Server Tests ===\n');
    try {
        await testHealthCheck();
        await testToolsList();
        await testResourcesList();
        await testUnknownMethod();
        console.log('\n=== All Tests Passed ✓ ===');
        process.exit(0);
    }
    catch (error) {
        console.error('\n✗ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}
runTests();
//# sourceMappingURL=basic.test.js.map