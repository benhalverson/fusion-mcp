import { Hono } from 'hono';
import { ForgeClient } from './forge-client.js';
import { Env } from './types.js';

/**
 * MCP Server for Autodesk Fusion
 * Implements the Model Context Protocol for interacting with Fusion 360 designs
 */

const app = new Hono<{ Bindings: Env }>();

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Fusion MCP Server',
    version: '1.0.0',
    description: 'MCP server for Autodesk Fusion 360',
    capabilities: [
      'list_hubs',
      'list_projects',
      'list_designs',
      'export_design',
      'read_parameters',
      'modify_parameters',
      'run_workitem',
      'create_webhook',
      'list_webhooks',
      'delete_webhook',
      'download_file',
    ],
  });
});

// MCP endpoint - implements Model Context Protocol
app.post('/mcp', async (c) => {
  try {
    const request = await c.req.json();
    const client = new ForgeClient(c.env);

    // Handle different MCP methods
    switch (request.method) {
      case 'tools/list':
        return c.json({
          tools: [
            {
              name: 'list_hubs',
              description: 'List all Fusion Team hubs (teams) available to the user',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'list_projects',
              description: 'List all projects in a hub',
              inputSchema: {
                type: 'object',
                properties: {
                  hubId: {
                    type: 'string',
                    description: 'The hub ID',
                  },
                },
                required: ['hubId'],
              },
            },
            {
              name: 'list_designs',
              description: 'List designs (files) in a project folder',
              inputSchema: {
                type: 'object',
                properties: {
                  projectId: {
                    type: 'string',
                    description: 'The project ID',
                  },
                  folderId: {
                    type: 'string',
                    description: 'The folder ID',
                  },
                },
                required: ['projectId', 'folderId'],
              },
            },
            {
              name: 'get_top_folders',
              description: 'Get top-level folders in a project',
              inputSchema: {
                type: 'object',
                properties: {
                  hubId: {
                    type: 'string',
                    description: 'The hub ID',
                  },
                  projectId: {
                    type: 'string',
                    description: 'The project ID',
                  },
                },
                required: ['hubId', 'projectId'],
              },
            },
            {
              name: 'export_design',
              description: 'Export a design to STL, STEP, or OBJ format',
              inputSchema: {
                type: 'object',
                properties: {
                  urn: {
                    type: 'string',
                    description: 'The design URN (base64 encoded)',
                  },
                  format: {
                    type: 'string',
                    enum: ['stl', 'step', 'obj'],
                    description: 'Export format',
                  },
                },
                required: ['urn', 'format'],
              },
            },
            {
              name: 'get_export_status',
              description: 'Get the status of a design export/translation',
              inputSchema: {
                type: 'object',
                properties: {
                  urn: {
                    type: 'string',
                    description: 'The design URN',
                  },
                },
                required: ['urn'],
              },
            },
            {
              name: 'download_derivative',
              description: 'Download an exported file derivative',
              inputSchema: {
                type: 'object',
                properties: {
                  urn: {
                    type: 'string',
                    description: 'The design URN',
                  },
                  derivativeUrn: {
                    type: 'string',
                    description: 'The derivative URN from the manifest',
                  },
                },
                required: ['urn', 'derivativeUrn'],
              },
            },
            {
              name: 'create_workitem',
              description: 'Create and run a Fusion WorkItem to execute scripts and modify parameters',
              inputSchema: {
                type: 'object',
                properties: {
                  activityId: {
                    type: 'string',
                    description: 'The Design Automation activity ID',
                  },
                  inputFileUrl: {
                    type: 'string',
                    description: 'URL to the input Fusion file',
                  },
                  outputFileUrl: {
                    type: 'string',
                    description: 'Signed URL where output file will be uploaded',
                  },
                  parameters: {
                    type: 'object',
                    description: 'Optional parameters to modify in the design',
                  },
                },
                required: ['activityId', 'inputFileUrl', 'outputFileUrl'],
              },
            },
            {
              name: 'get_workitem_status',
              description: 'Get the status of a running WorkItem',
              inputSchema: {
                type: 'object',
                properties: {
                  workItemId: {
                    type: 'string',
                    description: 'The work item ID',
                  },
                },
                required: ['workItemId'],
              },
            },
            {
              name: 'create_webhook',
              description: 'Create a webhook to receive notifications when designs change',
              inputSchema: {
                type: 'object',
                properties: {
                  system: {
                    type: 'string',
                    description: 'System name (e.g., "data" for Data Management)',
                    default: 'data',
                  },
                  event: {
                    type: 'string',
                    description: 'Event name (e.g., "dm.version.added")',
                  },
                  callbackUrl: {
                    type: 'string',
                    description: 'URL to receive webhook notifications',
                  },
                  scope: {
                    type: 'object',
                    description: 'Optional scope filter for the webhook',
                  },
                },
                required: ['event', 'callbackUrl'],
              },
            },
            {
              name: 'list_webhooks',
              description: 'List all registered webhooks',
              inputSchema: {
                type: 'object',
                properties: {
                  system: {
                    type: 'string',
                    description: 'System name (default: "data")',
                  },
                  event: {
                    type: 'string',
                    description: 'Optional event name filter',
                  },
                },
              },
            },
            {
              name: 'delete_webhook',
              description: 'Delete a webhook',
              inputSchema: {
                type: 'object',
                properties: {
                  system: {
                    type: 'string',
                    description: 'System name',
                  },
                  event: {
                    type: 'string',
                    description: 'Event name',
                  },
                  hookId: {
                    type: 'string',
                    description: 'Webhook ID to delete',
                  },
                },
                required: ['system', 'event', 'hookId'],
              },
            },
            {
              name: 'download_file',
              description: 'Download a Fusion file (F3D, IPT, or archive)',
              inputSchema: {
                type: 'object',
                properties: {
                  projectId: {
                    type: 'string',
                    description: 'The project ID',
                  },
                  itemId: {
                    type: 'string',
                    description: 'The item ID',
                  },
                  versionId: {
                    type: 'string',
                    description: 'Optional version ID (uses latest if not provided)',
                  },
                },
                required: ['projectId', 'itemId'],
              },
            },
          ],
        });

      case 'tools/call':
        const toolName = request.params?.name;
        const toolArgs = request.params?.arguments || {};

        switch (toolName) {
          case 'list_hubs':
            const hubs = await client.listHubs();
            return c.json({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(hubs, null, 2),
                },
              ],
            });

          case 'list_projects':
            const projects = await client.listProjects(toolArgs.hubId);
            return c.json({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(projects, null, 2),
                },
              ],
            });

          case 'list_designs':
            const designs = await client.listFolderContents(toolArgs.projectId, toolArgs.folderId);
            return c.json({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(designs, null, 2),
                },
              ],
            });

          case 'get_top_folders':
            const folders = await client.getProjectTopFolders(toolArgs.hubId, toolArgs.projectId);
            return c.json({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(folders, null, 2),
                },
              ],
            });

          case 'export_design':
            const exportResult = await client.exportDesign(toolArgs.urn, toolArgs.format);
            return c.json({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(exportResult, null, 2),
                },
              ],
            });

          case 'get_export_status':
            const manifest = await client.getManifest(toolArgs.urn);
            return c.json({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(manifest, null, 2),
                },
              ],
            });

          case 'download_derivative':
            const derivative = await client.downloadDerivative(toolArgs.urn, toolArgs.derivativeUrn);
            const arrayBuffer = await derivative.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            return c.json({
              content: [
                {
                  type: 'text',
                  text: `File downloaded successfully. Size: ${arrayBuffer.byteLength} bytes. Base64: ${base64.substring(0, 100)}...`,
                },
              ],
            });

          case 'create_workitem':
            const workItem = await client.createWorkItem(
              toolArgs.activityId,
              toolArgs.inputFileUrl,
              toolArgs.outputFileUrl,
              toolArgs.parameters
            );
            return c.json({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(workItem, null, 2),
                },
              ],
            });

          case 'get_workitem_status':
            const workItemStatus = await client.getWorkItemStatus(toolArgs.workItemId);
            return c.json({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(workItemStatus, null, 2),
                },
              ],
            });

          case 'create_webhook':
            const webhook = await client.createWebhook(
              toolArgs.system || 'data',
              toolArgs.event,
              toolArgs.callbackUrl,
              toolArgs.scope
            );
            return c.json({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(webhook, null, 2),
                },
              ],
            });

          case 'list_webhooks':
            const webhooks = await client.listWebhooks(toolArgs.system, toolArgs.event);
            return c.json({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(webhooks, null, 2),
                },
              ],
            });

          case 'delete_webhook':
            const deleted = await client.deleteWebhook(toolArgs.system, toolArgs.event, toolArgs.hookId);
            return c.json({
              content: [
                {
                  type: 'text',
                  text: deleted ? 'Webhook deleted successfully' : 'Failed to delete webhook',
                },
              ],
            });

          case 'download_file':
            const file = await client.downloadFile(
              toolArgs.projectId,
              toolArgs.itemId,
              toolArgs.versionId
            );
            const fileBuffer = await file.arrayBuffer();
            const fileBase64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
            return c.json({
              content: [
                {
                  type: 'text',
                  text: `File downloaded successfully. Size: ${fileBuffer.byteLength} bytes. Use the base64 data to save the file.`,
                },
                {
                  type: 'text',
                  text: `Base64 preview: ${fileBase64.substring(0, 100)}...`,
                },
              ],
            });

          default:
            return c.json(
              {
                error: {
                  code: 'method_not_found',
                  message: `Unknown tool: ${toolName}`,
                },
              },
              404
            );
        }

      case 'resources/list':
        return c.json({
          resources: [],
        });

      case 'prompts/list':
        return c.json({
          prompts: [],
        });

      default:
        return c.json(
          {
            error: {
              code: 'method_not_found',
              message: `Unknown method: ${request.method}`,
            },
          },
          404
        );
    }
  } catch (error: any) {
    console.error('Error handling MCP request:', error);
    return c.json(
      {
        error: {
          code: 'internal_error',
          message: error.message || 'Internal server error',
        },
      },
      500
    );
  }
});

// Webhook receiver endpoint
app.post('/webhook', async (c) => {
  try {
    const payload = await c.req.json();
    console.log('Webhook received:', JSON.stringify(payload, null, 2));
    
    // Process webhook payload
    // In a real implementation, you would:
    // 1. Verify the webhook signature
    // 2. Process the event
    // 3. Trigger appropriate actions
    
    return c.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
