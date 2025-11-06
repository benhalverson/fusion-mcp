# Fusion MCP Server Examples

This directory contains example scripts and configurations for using the Fusion MCP Server.

## Quick Start

1. Set up your Forge credentials in `.dev.vars`
2. Run the development server: `pnpm run dev`
3. Test the endpoints using the examples below

## Example MCP Requests

### List Available Tools

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

### List Hubs

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "list_hubs",
      "arguments": {}
    }
  }'
```

### List Projects in a Hub

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "list_projects",
      "arguments": {
        "hubId": "b.YOUR_HUB_ID"
      }
    }
  }'
```

### Get Top Folders

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_top_folders",
      "arguments": {
        "hubId": "b.YOUR_HUB_ID",
        "projectId": "b.YOUR_PROJECT_ID"
      }
    }
  }'
```

### Export Design to STL

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "export_design",
      "arguments": {
        "urn": "YOUR_BASE64_ENCODED_URN",
        "format": "stl"
      }
    }
  }'
```

### Create a Webhook

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "create_webhook",
      "arguments": {
        "system": "data",
        "event": "dm.version.added",
        "callbackUrl": "https://your-worker.workers.dev/webhook",
        "scope": {
          "folder": "urn:adsk.wipprod:fs.folder:YOUR_FOLDER_ID"
        }
      }
    }
  }'
```

## Python Client Example

```python
import requests
import json

MCP_URL = "http://localhost:8787/mcp"

# List all hubs
response = requests.post(MCP_URL, json={
    "method": "tools/call",
    "params": {
        "name": "list_hubs",
        "arguments": {}
    }
})

print(json.dumps(response.json(), indent=2))
```

## Node.js Client Example

```javascript
const MCP_URL = 'http://localhost:8787/mcp';

async function listHubs() {
  const response = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'tools/call',
      params: {
        name: 'list_hubs',
        arguments: {},
      },
    }),
  });
  
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

listHubs();
```

## Common Workflows

### 1. Browse and Download a Design

1. List hubs to find your team
2. List projects in the hub
3. Get top folders in the project
4. List designs in a folder
5. Download the design file

### 2. Export for 3D Printing

1. Get the design URN
2. Export to STL format
3. Check export status
4. Download the STL file

### 3. Parametric Design Automation

1. Create a Design Automation activity (one-time setup in Forge portal)
2. Upload your design file
3. Create a workitem with parameter changes
4. Monitor workitem status
5. Download the modified design

### 4. Monitor Design Changes

1. Create a webhook for `dm.version.added` event
2. Receive notifications when designs are updated
3. Automatically trigger exports or other actions
