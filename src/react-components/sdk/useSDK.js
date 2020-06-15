import { useContext } from "react";
import { SDKContext } from "./SDKContext";

export function useSDK() {
  return useContext(SDKContext);
}
