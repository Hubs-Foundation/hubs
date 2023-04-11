import configs from "../utils/configs";
import { PaidTiers } from "../../types";

export function hasPaidFeature(): boolean {
  // If the user is not a turkey user then no need to check.
  if (configs.ITA_SERVER != "turkey") return true;

  const authorizedTiers: PaidTiers[] = ["p1", "b1"];
  return authorizedTiers.includes(configs.TIER);
}
