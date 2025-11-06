/**
 * Types for Autodesk Forge/APS API
 */

export interface ForgeToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Hub {
  type: string;
  id: string;
  attributes: {
    name: string;
    region?: string;
  };
}

export interface Project {
  type: string;
  id: string;
  attributes: {
    name: string;
  };
}

export interface Item {
  type: string;
  id: string;
  attributes: {
    displayName: string;
    extension?: {
      type: string;
    };
  };
}

export interface WorkItemStatus {
  status: string;
  reportUrl?: string;
  stats?: {
    timeQueued: string;
    timeDownloadStarted?: string;
    timeInstructionsStarted?: string;
    timeInstructionsEnded?: string;
    timeUploadEnded?: string;
  };
}

export interface DesignParameter {
  name: string;
  value: string | number;
  unit?: string;
  expression?: string;
}

export interface Env {
  FORGE_CLIENT_ID: string;
  FORGE_CLIENT_SECRET: string;
  FORGE_API_BASE: string;
  FORGE_CALLBACK_URL?: string;
}
