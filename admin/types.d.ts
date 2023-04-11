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

export type PaidTiers = "p1" | "b1";

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
