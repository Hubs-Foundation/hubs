import * as bitecs from "bitecs";
import * as bitComponents from "./bit-components";
import * as bitUtils from "./utils/bit-utils";

declare global {
  interface Window {
    $B: typeof bitecs;
    $C: typeof bitComponents;
    $BitUtils: typeof bitUtils;
  }
}

export function exposeBitECSDebugHelpers() {
  window.$B = bitecs;
  window.$C = bitComponents;
  window.$BitUtils = bitUtils;
}
