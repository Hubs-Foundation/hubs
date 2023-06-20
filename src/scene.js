import jwtDecode from "jwt-decode";
import React from "react";
import { createRoot } from "react-dom/client";
import "./assets/stylesheets/scene.scss";
import SceneUI from "./react-components/scene-ui";
import "./react-components/styles/global.scss";
import { ThemeProvider } from "./react-components/styles/theme";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import registerTelemetry from "./telemetry";
import { disableiOSZoom } from "./utils/disable-ios-zoom";
import { connectToReticulum, fetchReticulumAuthenticatedWithToken } from "./utils/phoenix-utils";
import "./utils/theme";
import { store } from "./utils/store-instance";

function mountUI(props = {}) {
  const container = document.getElementById("ui-root");

  const root = createRoot(container);
  root.render(
    <WrappedIntlProvider>
      <ThemeProvider store={props.store}>
        <SceneUI {...props} />
      </ThemeProvider>
    </WrappedIntlProvider>
  );
}

const remountUI = (function () {
  let props;
  return function remountUI(newProps) {
    props = { ...props, ...newProps };
    mountUI(props);
  };
})();

async function shouldShowCreateRoom(joinToken) {
  const socket = await connectToReticulum();

  const joinParams = {
    hub_id: "scene"
  };
  if (joinToken) {
    // Reticulum rejects a join with { token: null }, so don't add it to joinParams if we don't have it.
    // TODO: (In reticulum) Treat { token: null } the same as not sending a token
    joinParams.token = joinToken;
  }
  const retPhxChannel = socket.channel("ret", joinParams);

  try {
    await new Promise((resolve, reject) => {
      retPhxChannel.join().receive("ok", resolve).receive("error", reject).receive("timeout", reject);
    });

    const token = await new Promise((resolve, reject) => {
      retPhxChannel
        .push("refresh_perms_token")
        .receive("ok", ({ perms_token }) => {
          resolve(perms_token);
        })
        .receive("error", reject)
        .receive("timeout", reject);
    });

    const perms = jwtDecode(token);
    retPhxChannel.leave();
    socket.disconnect();

    return !!perms.create_hub;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function fetchSceneInfo(token, sceneId) {
  const response = await fetchReticulumAuthenticatedWithToken(token, `/api/v1/scenes/${sceneId}`);
  return response.scenes[0];
}

function parseSceneId() {
  return (
    new URLSearchParams(document.location.search).get("scene_id") ||
    document.location.pathname.substring(1).split("/")[1]
  );
}

function onReady() {
  console.log(`Hubs version: ${process.env.BUILD_VERSION || "?"}`);

  disableiOSZoom();

  const sceneId = parseSceneId(document.location);
  console.log(`Scene ID: ${sceneId}`);
  remountUI({ sceneId, store });

  shouldShowCreateRoom(store.state.credentials.token).then(showCreateRoom => {
    remountUI({ showCreateRoom });
  });

  fetchSceneInfo(store.state.credentials.token, sceneId).then(async sceneInfo => {
    console.log(`Scene Info:`, sceneInfo);
    if (!sceneInfo) {
      // Scene is delisted or removed
      remountUI({ unavailable: true });
    } else {
      if (sceneInfo.allow_promotion) {
        registerTelemetry(`/scene/${sceneId}`, `Hubs Scene: ${sceneInfo.title}`);
      } else {
        registerTelemetry("/scene", "Hubs Non-Promotable Scene Page");
      }
      remountUI({
        sceneName: sceneInfo.name,
        sceneDescription: sceneInfo.description,
        sceneAttributions: sceneInfo.attributions,
        sceneScreenshotURL: sceneInfo.screenshot_url,
        sceneId: sceneInfo.scene_id,
        sceneProjectId: sceneInfo.project_id,
        sceneAllowRemixing: sceneInfo.allow_remixing,
        isOwner: sceneInfo.account_id && sceneInfo.account_id === store.credentialsAccountId,
        parentScene:
          sceneInfo.parent_scene_id && (await fetchSceneInfo(store.state.credentials.token, sceneInfo.parent_scene_id))
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", onReady);
