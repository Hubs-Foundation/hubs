import configs from "./configs";

export function isHmc() {
  // We use show_cloud as a proxy for whether we are running on HMC versus Hubs Cloud,
  // since show_cloud is an internal config that is typically only enabled on HMC.
  return configs.feature("show_cloud");
}
