import { addComponent, removeComponent } from "bitecs";
import {
  RemoteRight,
  RemoteLeft,
  HandRight,
  HandLeft,
  RemoteHoverTarget,
  NotRemoteHoverTarget,
  RemoveNetworkedEntityButton,
  DestroyAtExtremeDistance,
  Billboard
} from "./bit-components";

[
  ["remote-right", RemoteRight],
  ["remote-left", RemoteLeft],
  ["hand-right", HandRight],
  ["hand-left", HandLeft],
  ["is-remote-hover-target", RemoteHoverTarget],
  ["is-not-remote-hover-target", NotRemoteHoverTarget],
  ["remove-networked-object-button", RemoveNetworkedEntityButton],
  ["destroy-at-extreme-distances", DestroyAtExtremeDistance],
  ["billboard", Billboard]
].forEach(([aframeComponentName, bitecsComponent]) => {
  AFRAME.registerComponent(aframeComponentName, {
    init: function () {
      addComponent(APP.world, bitecsComponent, this.el.object3D.eid);
    },
    remove: function () {
      removeComponent(APP.world, bitecsComponent, this.el.object3D.eid);
    }
  });
});
