# Deployment Guide

This guide will walk you through deploying the Fusion MCP Server to Cloudflare Workers.

## Prerequisites

1. A Cloudflare account (free tier is sufficient)
2. Wrangler CLI installed (comes with the project's pnpm dependencies)
3. Autodesk Forge/APS account with API credentials

## Step 1: Get Autodesk Forge Credentials

1. Visit [Autodesk Forge Portal](https://forge.autodesk.com/)
2. Sign in or create an account
3. Click "Create App"
4. Fill in the application details:
   - App Name: `Fusion MCP Server` (or your choice)
   - App Type: `Server`
   - Description: `MCP server for Fusion 360`
5. Select the following API access:
   - Data Management API
   - Model Derivative API
   - Design Automation API (if you plan to use WorkItems)
   - Webhooks API
6. Save the app and note your:
   - **Client ID**
   - **Client Secret**

## Step 2: Install Dependencies

```bash
pnpm install
```

## Step 3: Authenticate with Cloudflare

```bash
npx wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

## Step 4: Configure Secrets

Set your Forge credentials as Cloudflare Worker secrets:

```bash
npx wrangler secret put FORGE_CLIENT_ID
# Enter your Client ID when prompted

npx wrangler secret put FORGE_CLIENT_SECRET
# Enter your Client Secret when prompted
```

## Step 5: Deploy

```bash
pnpm run deploy
```

This will build and deploy your worker to Cloudflare. The output will show your worker's URL, something like:

```
Published fusion-mcp (0.01 sec)
  https://fusion-mcp.<your-subdomain>.workers.dev
```

## Step 6: Test Your Deployment

Test the health endpoint:

```bash
curl https://fusion-mcp.<your-subdomain>.workers.dev/
```

You should see a JSON response with the server information.

Test the MCP endpoint:

```bash
curl -X POST https://fusion-mcp.<your-subdomain>.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

## Step 7: Configure Custom Domain (Optional)

If you want to use a custom domain:

1. Add your domain to Cloudflare
2. In the Cloudflare Workers dashboard, go to your worker
3. Click "Triggers" tab
4. Add a custom domain under "Routes"

## Local Development

For local development, create a `.dev.vars` file:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and add your credentials:

```
FORGE_CLIENT_ID=your_client_id_here
FORGE_CLIENT_SECRET=your_client_secret_here
```

Run the development server:

```bash
pnpm run dev
```

The server will be available at `http://localhost:8787`

## Environment Variables

The following environment variables are used:

| Variable | Required | Description |
|----------|----------|-------------|
| `FORGE_CLIENT_ID` | Yes | Your Autodesk Forge Client ID |
| `FORGE_CLIENT_SECRET` | Yes | Your Autodesk Forge Client Secret |
| `FORGE_API_BASE` | No | Forge API base URL (defaults to `https://developer.api.autodesk.com`) |
| `FORGE_CALLBACK_URL` | No | OAuth callback URL for three-legged authentication |

## Updating the Deployment

To update your deployment after making changes:

1. Make your code changes
2. Test locally with `pnpm run dev`
3. Run tests with `pnpm test`
4. Deploy with `pnpm run deploy`

## Monitoring

You can monitor your worker in the Cloudflare dashboard:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select "Workers & Pages"
3. Click on your worker name
4. View metrics, logs, and errors

## Troubleshooting

### Authentication Errors

If you get authentication errors:
- Verify your Client ID and Secret are correct
- Check that the secrets are properly set in Cloudflare
- Ensure your Forge app has the necessary API scopes enabled

### Module Not Found Errors

If you get module resolution errors:
- Run `pnpm install` to ensure all dependencies are installed
- Delete `node_modules` and `pnpm-lock.yaml`, then reinstall

### CORS Issues

If you're accessing the API from a browser and encounter CORS errors, you may need to add CORS headers to the worker responses.

## Security Considerations

1. **Never commit** `.dev.vars` or any file containing your credentials
2. Always use Cloudflare secrets for production credentials
3. Consider implementing rate limiting for production use
4. Validate webhook signatures to ensure they come from Autodesk
5. Implement authentication if exposing this service to external clients

## Cost Considerations

Cloudflare Workers free tier includes:
- 100,000 requests per day
- Up to 10ms CPU time per request

Autodesk Forge has usage-based pricing. Check the [Forge Pricing](https://forge.autodesk.com/pricing) for details.

## Next Steps

1. Set up webhooks to receive notifications when designs change
2. Create Design Automation activities for parameter modification
3. Integrate with your AI/LLM application using the MCP protocol
4. Add custom authentication if needed
