import configs from "../utils/configs";
type AdminConfigs = {
  ITA_SERVER?: string;
  DISABLE_BRANDING?: string;
  TIER?: PaidTiers;
};
const cfg = configs as unknown as AdminConfigs;
import { PaidTiers } from "../../types";

// TODO: Remove this function once Orch sets DISABLE_BRANDING
export function hasPaidFeature(): boolean {
  // If the user is not a turkey user then no need to check.
  const itaServer = cfg.ITA_SERVER;
  if (itaServer && itaServer !== "turkey") return true;

  const authorizedTiers: PaidTiers[] = ["p1", "b1", "b0"];
  return authorizedTiers.includes(cfg.TIER || "p1");
}

export function isBrandingDisabled(): boolean {
  return cfg.DISABLE_BRANDING === "true";
}
