import configs from "../utils/configs";
import { PaidTiers } from "../../types";

// TODO: Remove this function once Orch sets DISABLE_BRANDING
export function hasPaidFeature(): boolean {
  // If the user is not a turkey user then no need to check.
  if (configs.ITA_SERVER != "turkey") return true;

  const authorizedTiers: PaidTiers[] = ["p1", "b1","b0"];
  return authorizedTiers.includes(configs.TIER);
}

export function isBrandingDisabled(): boolean {
  return configs.DISABLE_BRANDING === "true"
}
