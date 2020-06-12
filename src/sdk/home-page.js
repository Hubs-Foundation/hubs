import "./react";
import * as Common from "./react/common";
import * as Media from "./react/media";
import * as HomePage from "./react/home-page";
import { SDK } from "./SDK";

export function initSDKContext(store) {
  const sdk = new SDK(store);

  Object.assign(sdk, {
    React: {
      Common,
      Media,
      HomePage
    }
  });

  window.Hubs = sdk;
}
