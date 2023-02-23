export type ReticulumStorageT = {
  in_quota: boolean;
};

export type ReticulumSceneListingT = {
  any: boolean;
  default: boolean;
  featured: boolean;
};

export type ReticulumAvatarListingT = {
  any: boolean;
  base: boolean;
  default: boolean;
  featured: boolean;
};

export type ReticulumRepoT = {
  storage: ReticulumStorageT;
  scene_listings: ReticulumSceneListingT;
  avatar_listings: ReticulumAvatarListingT;
};

export type ReticulumMetaT = {
  phx_host: string;
  phx_port: string;
  pool: string | null;
  version: string;
  repo: ReticulumRepoT;
};

export type AdminInfoT = {
  using_ses: any;
  ses_max_24_hour_send: number;
  provider: string;
  worker_domain: string;
};

export type RetConfigT = {
  phx: {
    cors_proxy_url_host: string;
  };
};
