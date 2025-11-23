# Fusion MCP Server

An MCP (Model Context Protocol) server for Autodesk Fusion 360, written in TypeScript and deployed on Cloudflare Workers using Hono.

## Features

This MCP server provides the following capabilities for interacting with Autodesk Fusion 360 designs:

### 🗂️ Data Management
- **List Hubs/Projects/Designs** - Browse Fusion Team content including hubs (teams), projects, and designs
- **Get Top Folders** - Access top-level folders in projects

### 📦 Export & Download
- **Export to STL/STEP/OBJ** - Convert designs to various formats for 3D printing and CAD interoperability
- **Download IPT/F3D/Fusion Archive** - Access raw source CAD files directly

### ⚙️ Design Automation
- **Read & Modify Parameters** - Change parametric values in designs (requires Design Automation workitems)
- **Run Fusion WorkItem** - Execute scripts server-side to automate CAD operations using Autodesk Design Automation

### 🔔 Webhooks
- **Create Webhooks** - Set up notifications when designs change
- **List Webhooks** - View all registered webhooks
- **Delete Webhooks** - Remove webhook subscriptions

## Prerequisites

- Autodesk Forge/APS account with API credentials
- Cloudflare Workers account (free tier available)
- Node.js 18+ for local development

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Autodesk Forge Credentials

You need to set up your Autodesk Forge (now Autodesk Platform Services) API credentials:

1. Go to [Forge Portal](https://forge.autodesk.com/)
2. Create an application
3. Note your Client ID and Client Secret

For local development, create a `.dev.vars` file:

```
FORGE_CLIENT_ID=your_client_id_here
FORGE_CLIENT_SECRET=your_client_secret_here
```

For production deployment, set secrets using Wrangler:

```bash
wrangler secret put FORGE_CLIENT_ID
wrangler secret put FORGE_CLIENT_SECRET
```

### 3. Development

Run the development server:

```bash
pnpm run dev
```

The server will be available at `http://localhost:8787`

### 4. Build

Compile TypeScript to JavaScript:

```bash
pnpm run build
```

### 5. Deploy to Cloudflare Workers

```bash
pnpm run deploy
```

## Usage

### MCP Protocol

The server implements the Model Context Protocol at the `/mcp` endpoint. Send POST requests with the following structure:

#### List Available Tools

```json
{
  "method": "tools/list"
}
```

#### Call a Tool

```json
{
  "method": "tools/call",
  "params": {
    "name": "list_hubs",
    "arguments": {}
  }
}
```

### Available Tools

#### 1. `list_hubs`
List all Fusion Team hubs available to the user.

**Arguments:** None

#### 2. `list_projects`
List all projects in a hub.

**Arguments:**
- `hubId` (string, required): The hub ID

#### 3. `list_designs`
List designs in a project folder.

**Arguments:**
- `projectId` (string, required): The project ID
- `folderId` (string, required): The folder ID

#### 4. `get_top_folders`
Get top-level folders in a project.

**Arguments:**
- `hubId` (string, required): The hub ID
- `projectId` (string, required): The project ID

#### 5. `export_design`
Export a design to STL, STEP, or OBJ format.

**Arguments:**
- `urn` (string, required): The design URN (base64 encoded)
- `format` (string, required): Export format - one of `stl`, `step`, `obj`

#### 6. `get_export_status`
Check the status of a design export/translation.

**Arguments:**
- `urn` (string, required): The design URN

#### 7. `download_derivative`
Download an exported file derivative.

**Arguments:**
- `urn` (string, required): The design URN
- `derivativeUrn` (string, required): The derivative URN from the manifest

#### 8. `create_workitem`
Create and run a Fusion WorkItem to execute scripts and modify parameters.

**Arguments:**
- `activityId` (string, required): The Design Automation activity ID
- `inputFileUrl` (string, required): URL to the input Fusion file
- `outputFileUrl` (string, required): Signed URL where output will be uploaded
- `parameters` (object, optional): Parameters to modify in the design

#### 9. `get_workitem_status`
Get the status of a running WorkItem.

**Arguments:**
- `workItemId` (string, required): The work item ID

#### 10. `create_webhook`
Create a webhook to receive notifications when designs change.

**Arguments:**
- `system` (string, optional): System name (default: "data")
- `event` (string, required): Event name (e.g., "dm.version.added")
- `callbackUrl` (string, required): URL to receive notifications
- `scope` (object, optional): Scope filter for the webhook

#### 11. `list_webhooks`
List all registered webhooks.

**Arguments:**
- `system` (string, optional): System name filter
- `event` (string, optional): Event name filter

#### 12. `delete_webhook`
Delete a webhook.

**Arguments:**
- `system` (string, required): System name
- `event` (string, required): Event name
- `hookId` (string, required): Webhook ID to delete

#### 13. `download_file`
Download a Fusion file (F3D, IPT, or archive).

**Arguments:**
- `projectId` (string, required): The project ID
- `itemId` (string, required): The item ID
- `versionId` (string, optional): Version ID (uses latest if not provided)

### Webhook Endpoint

The server provides a `/webhook` endpoint to receive webhook notifications from Autodesk Forge:

```
POST https://your-worker.workers.dev/webhook
```

Configure this URL when creating webhooks using the `create_webhook` tool.

## Architecture

- **Hono** - Fast, lightweight web framework for Cloudflare Workers
- **Autodesk Forge/APS API** - RESTful API for accessing Fusion 360 data
- **Model Context Protocol** - Standardized protocol for AI model interactions
- **Cloudflare Workers** - Serverless edge computing platform

## API Scopes Required

The server requires the following Forge API scopes:
- `data:read` - Read data from Data Management
- `data:write` - Write data to Data Management
- `data:create` - Create new data
- `bucket:read` - Read from OSS buckets
- `bucket:create` - Create OSS buckets

## Common Use Cases

### 1. Browse Team Content
```javascript
// List hubs
{ "method": "tools/call", "params": { "name": "list_hubs" } }

// List projects in a hub
{ "method": "tools/call", "params": { "name": "list_projects", "arguments": { "hubId": "b.xxx" } } }

// Get folders
{ "method": "tools/call", "params": { "name": "get_top_folders", "arguments": { "hubId": "b.xxx", "projectId": "b.xxx" } } }
```

### 2. Export a Design for 3D Printing
```javascript
// Start export to STL
{ 
  "method": "tools/call", 
  "params": { 
    "name": "export_design", 
    "arguments": { 
      "urn": "dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLnlvdXJfdXJuP3ZlcnNpb249MQ",
      "format": "stl"
    } 
  } 
}

// Check export status
{ "method": "tools/call", "params": { "name": "get_export_status", "arguments": { "urn": "..." } } }

// Download the STL file
{ "method": "tools/call", "params": { "name": "download_derivative", "arguments": { "urn": "...", "derivativeUrn": "..." } } }
```

### 3. Modify Design Parameters
```javascript
// Create a workitem to modify parameters
{ 
  "method": "tools/call", 
  "params": { 
    "name": "create_workitem", 
    "arguments": { 
      "activityId": "your.activity+prod",
      "inputFileUrl": "https://...",
      "outputFileUrl": "https://...",
      "parameters": {
        "Width": 100,
        "Height": 50,
        "Depth": 25
      }
    } 
  } 
}
```

## Development Notes

- OAuth token is cached and automatically refreshed
- All API calls require valid Forge credentials
- WorkItems require Design Automation setup in your Forge account
- Webhooks require a publicly accessible callback URL

## License

MIT
