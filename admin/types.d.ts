export type ReticulumMetaT = {
  phx_host: string;
  phx_port: string;
  pool: string;
  version: string;
  repo: ReticulumRepoT;
};

/**
 * p0 : FREE TIER
 * p1 : STANDARD TIER
 * b1: BUSINESS TIER
 */
export type TiersT = "p0" | "p1" | "b1";

export type PaidTiers = "p1" | "b1" | "b0";

// Minimal shims for asset imports used in admin

declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.frag" {
  const src: string;
  export default src;
}
declare module "*.vert" {
  const src: string;
  export default src;
}

// Global from networked-aframe; we don't consume its shape here
declare const NAF: unknown;

// Strong typing for admin runtime configs module imports
declare module "../utils/configs" {
  export type AdminConfigs = {
    ITA_SERVER?: string;
    DISABLE_BRANDING?: string;
    TIER?: "p0" | "p1" | "b1" | "b0";
    IS_LOCAL_OR_CUSTOM_CLIENT?: boolean;
  } & Record<string, string | boolean | undefined>;
  const configs: AdminConfigs;
  export default configs;
}
declare module "../../utils/configs" {
  export type AdminConfigs = {
    ITA_SERVER?: string;
    DISABLE_BRANDING?: string;
    TIER?: "p0" | "p1" | "b1" | "b0";
    IS_LOCAL_OR_CUSTOM_CLIENT?: boolean;
  } & Record<string, string | boolean | undefined>;
  const configs: AdminConfigs;
  export default configs;
}

// Typed surface for specific cross-package imports used by admin TSX
declare module "hubs/src/utils/phoenix-utils" {
  export function fetchReticulumAuthenticated<T = unknown>(
    url: string,
    method?: "GET" | "POST" | "PUT" | "DELETE",
    payload?: unknown
  ): Promise<T>;
  export function getReticulumFetchUrl(path: string, absolute?: boolean, host?: string | null, port?: string | null): string;
}

export type ReticulumRepoT = {
  accounts: {
    any: boolean;
    admin: boolean;
  };
  storage: {
    in_quota: boolean;
  };
  scene_listings: {
    any: boolean;
    default: boolean;
    featured: boolean;
  };
  avatar_listings: {
    any: boolean;
    base: boolean;
    default: boolean;
    featured: boolean;
  };
};

export type AdminInfoT = {
  using_ses: any;
  ses_max_24_hour_send: number;
  provider: string;
  worker_domain: string;
  code: number;
};

export type RetConfigT = {
  phx: {
    cors_proxy_url_host: string;
  };
  code: number;
};

export type ErrorT = {
  error: boolean;
  code: number;
};
/**
 * Admin Type Declarations
 *
 * This file contains source-owned type declarations used by the admin app.
 * It is not generated and should be versioned in git. Generated declarations
 * (e.g., generated .d.ts under the src tree or in dist-types/) are ignored
 * via .gitignore and should not be committed.
 */
