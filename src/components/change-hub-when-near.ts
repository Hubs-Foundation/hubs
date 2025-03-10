import { AElement } from "aframe";
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
      this.state = State.notReady;

      tryGetHubId(this.el).then(hubId => {
        if (!hubId) {
          console.error("Failed to find target hub id for portal.");
          return;
        }

        this.targetHubId = hubId;
        this.avatarPov = (document.getElementById("avatar-pov-node") as AElement)?.object3D;
        this.timer = 0;
        this.state = State.idle;
      });
    },

    tick(now) {
      if (this.state === State.notReady || this.state === State.traveling) return;

      if (this.state === State.idle) {
        if (isNearby(this.el.object3D, this.avatarPov)) {
          this.state = State.nearby;
          this.timer = now + DELAY_MS;
        }
      } else if (this.state === State.nearby) {
        if (now > this.timer) {
          if (isNearby(this.el.object3D, this.avatarPov)) {
            this.state = State.traveling;
            changeHub(this.targetHubId).finally(() => {
              this.state = State.idle;
            });
          } else {
            this.state = State.idle;
          }
        }
      }
    }
  });
}

export {};
