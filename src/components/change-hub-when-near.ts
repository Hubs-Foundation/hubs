import type { AComponent, AElement } from "aframe";
import { Object3D, Vector3 } from "three";
import { changeHub } from "../change-hub";
import configs from "../utils/configs";
import { isHubsRoomUrl } from "../utils/media-url-utils";

function getSrcFromMediaLoader(el: AElement): string | null {
  if (!el.parentNode) return null;
  const src = el.components["media-loader"]?.data?.src as string;
  if (src) return src;
  const href = el.components["media-loader"]?.data?.mediaOptions?.href as string;
  if (href) return href;
  return null;
}

async function tryGetSrc(el: AElement): Promise<string | null> {
  const networkedEl = await NAF.utils.getNetworkedEntity(el);
  const url = getSrcFromMediaLoader(networkedEl);
  if (url) return url;

  return new Promise(resolve => {
    const onMediaResolved = () => {
      resolve(getSrcFromMediaLoader(networkedEl));
    };
    networkedEl.addEventListener("media_resolved", onMediaResolved, { once: true });
  });
}

async function tryGetHubId(el: AElement): Promise<string | null> {
  const src = await tryGetSrc(el);
  return (src && (await isHubsRoomUrl(src))) || null;
}

const isNearby = (() => {
  const NEAR = 1.5;
  const NEAR_SQUARED = NEAR * NEAR;
  const positionA = new Vector3();
  const positionB = new Vector3();
  return function isNearby(a: Object3D, b: Object3D) {
    a.updateMatrices();
    b.updateMatrices();
    positionA.setFromMatrixPosition(a.matrixWorld);
    positionB.setFromMatrixPosition(b.matrixWorld);

    return positionA.distanceToSquared(positionB) < NEAR_SQUARED;
  };
})();

const DELAY_MS = 2000;

enum State {
  notReady,
  idle,
  nearby,
  traveling
}

// change-hub-when-near
//
// Add this component to a child of media loader.
// If the media loader's src points to a room link,
// This component acts as a portal that will call
// changeHub when the player is nearby.
//
// This was requested for an upcoming event.
// We expect to remove it it soon.
//
if (configs.feature("change_hub_near_room_links")) {
  console.log("Enabling automatic fast room switching when near room links.");
  AFRAME.registerComponent("change-hub-when-near", {
    init() {
      const self = this as unknown as Partial<AComponent> & {
        state: State;
        targetHubId: string;
        avatarPov?: Object3D;
        timer: number;
      };
      self.state = State.notReady;

      tryGetHubId((this as any).el).then(hubId => {
        if (!hubId) {
          console.error("Failed to find target hub id for portal.");
          return;
        }

        self.targetHubId = hubId;
        self.avatarPov = (document.getElementById("avatar-pov-node") as AElement)?.object3D;
        self.timer = 0;
        self.state = State.idle;
      });
    },

    tick(now) {
      const self = this as unknown as { state: State; avatarPov?: Object3D; timer: number; targetHubId: string; el: AElement };
      if (self.state === State.notReady || self.state === State.traveling) return;

      if (self.state === State.idle) {
        if (self.avatarPov && isNearby(self.el.object3D, self.avatarPov)) {
          self.state = State.nearby;
          self.timer = now + DELAY_MS;
        }
      } else if (self.state === State.nearby) {
        if (now > self.timer) {
          if (self.avatarPov && isNearby(self.el.object3D, self.avatarPov)) {
            self.state = State.traveling;
            changeHub(self.targetHubId).finally(() => {
              self.state = State.idle;
            });
          } else {
            self.state = State.idle;
          }
        }
      }
    }
  });
}

export {};
