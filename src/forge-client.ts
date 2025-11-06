import { Env, ForgeToken, WorkItem, ItemData } from './types.js';

/**
 * Autodesk Forge API client
 */
export class ForgeClient {
  private env: Env;
  private token?: ForgeToken;
  private tokenExpiry?: number;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Get OAuth2 token for Forge API
   */
  async getToken(): Promise<string> {
    const now = Date.now();
    
    // Return cached token if still valid (with 5 min buffer)
    if (this.token && this.tokenExpiry && this.tokenExpiry > now + 300000) {
      return this.token.access_token;
    }

    const response = await fetch(`${this.env.FORGE_API_BASE}/authentication/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.env.FORGE_CLIENT_ID,
        client_secret: this.env.FORGE_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'data:read data:write data:create bucket:read bucket:create',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get Forge token: ${response.statusText}`);
    }

    this.token = await response.json();
    this.tokenExpiry = now + (this.token!.expires_in * 1000);
    
    return this.token!.access_token;
  }

  /**
   * List hubs (teams) available to the user
   */
  async listHubs() {
    const token = await this.getToken();
    const response = await fetch(`${this.env.FORGE_API_BASE}/project/v1/hubs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list hubs: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List projects in a hub
   */
  async listProjects(hubId: string) {
    const token = await this.getToken();
    const response = await fetch(`${this.env.FORGE_API_BASE}/project/v1/hubs/${hubId}/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list projects: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List folder contents (designs) in a project
   */
  async listFolderContents(projectId: string, folderId: string) {
    const token = await this.getToken();
    const response = await fetch(
      `${this.env.FORGE_API_BASE}/data/v1/projects/${projectId}/folders/${folderId}/contents`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list folder contents: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get top folders in a project
   */
  async getProjectTopFolders(hubId: string, projectId: string) {
    const token = await this.getToken();
    const response = await fetch(
      `${this.env.FORGE_API_BASE}/project/v1/hubs/${hubId}/projects/${projectId}/topFolders`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get top folders: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Export a design to a specific format (STL, STEP, OBJ)
   */
  async exportDesign(urn: string, format: 'stl' | 'step' | 'obj') {
    const token = await this.getToken();
    
    // Start translation job
    const response = await fetch(`${this.env.FORGE_API_BASE}/modelderivative/v2/designdata/job`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          urn: urn,
        },
        output: {
          formats: [
            {
              type: format,
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start export job: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get manifest of a translated design
   */
  async getManifest(urn: string) {
    const token = await this.getToken();
    const response = await fetch(
      `${this.env.FORGE_API_BASE}/modelderivative/v2/designdata/${urn}/manifest`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get manifest: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Download derivative (exported file)
   */
  async downloadDerivative(urn: string, derivativeUrn: string) {
    const token = await this.getToken();
    const response = await fetch(
      `${this.env.FORGE_API_BASE}/modelderivative/v2/designdata/${urn}/manifest/${derivativeUrn}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download derivative: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Create a work item to run Fusion script
   */
  async createWorkItem(activityId: string, inputFileUrl: string, outputFileUrl: string, parameters?: Record<string, unknown>) {
    const token = await this.getToken();
    
    const workItem: WorkItem = {
      activityId: activityId,
      arguments: {
        inputFile: {
          url: inputFileUrl,
        },
        outputFile: {
          verb: 'put',
          url: outputFileUrl,
        },
      },
    };

    if (parameters) {
      workItem.arguments.parameters = {
        verb: 'put',
        localName: 'parameters.json',
        url: 'data:application/json,' + encodeURIComponent(JSON.stringify(parameters)),
      };
    }

    const response = await fetch(`${this.env.FORGE_API_BASE}/da/us-east/v3/workitems`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workItem),
    });

    if (!response.ok) {
      throw new Error(`Failed to create work item: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get work item status
   */
  async getWorkItemStatus(workItemId: string) {
    const token = await this.getToken();
    const response = await fetch(`${this.env.FORGE_API_BASE}/da/us-east/v3/workitems/${workItemId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get work item status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Download file from Data Management API
   */
  async downloadFile(projectId: string, itemId: string, versionId?: string) {
    const token = await this.getToken();
    
    let url = `${this.env.FORGE_API_BASE}/data/v1/projects/${projectId}/items/${itemId}`;
    
    if (versionId) {
      url = `${this.env.FORGE_API_BASE}/data/v1/projects/${projectId}/versions/${versionId}`;
    }

    const itemResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!itemResponse.ok) {
      throw new Error(`Failed to get item/version details: ${itemResponse.statusText}`);
    }

    const itemData = await itemResponse.json() as ItemData;
    const storageId = itemData.data.relationships?.storage?.data?.id || 
                      itemData.data.relationships?.derivatives?.data?.id;

    if (!storageId) {
      throw new Error('No storage location found for file');
    }

    // Download from storage
    const downloadResponse = await fetch(`${this.env.FORGE_API_BASE}/oss/v2/signedresources/${encodeURIComponent(storageId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!downloadResponse.ok) {
      throw new Error(`Failed to download file: ${downloadResponse.statusText}`);
    }

    return downloadResponse.blob();
  }

  /**
   * Create webhook
   */
  async createWebhook(system: string, event: string, callbackUrl: string, scope?: any) {
    const token = await this.getToken();
    
    const webhook = {
      callbackUrl: callbackUrl,
      scope: scope || {},
    };

    const response = await fetch(
      `${this.env.FORGE_API_BASE}/webhooks/v1/systems/${system}/events/${event}/hooks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhook),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create webhook: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List webhooks
   */
  async listWebhooks(system?: string, event?: string) {
    const token = await this.getToken();
    
    let url = `${this.env.FORGE_API_BASE}/webhooks/v1/systems/${system || 'data'}/hooks`;
    if (event) {
      url = `${this.env.FORGE_API_BASE}/webhooks/v1/systems/${system || 'data'}/events/${event}/hooks`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list webhooks: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(system: string, event: string, hookId: string) {
    const token = await this.getToken();
    
    const response = await fetch(
      `${this.env.FORGE_API_BASE}/webhooks/v1/systems/${system}/events/${event}/hooks/${hookId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete webhook: ${response.statusText}`);
    }

    return response.status === 204;
  }
}
