import { MediaVideo } from "../bit-components";
import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent } from "bitecs";

const mediaVideoQuery = defineQuery([MediaVideo]);
const mediaVideoEnterQuery = enterQuery(mediaVideoQuery);
const mediaVideoExitQuery = exitQuery(mediaVideoQuery);
export function mediaVideoSystem(world) {
  mediaVideoEnterQuery(world).forEach(function (eid) {
    console.log("Hello world");
    if (MediaVideo.autoPlay[eid]) {
      const video = world.eid2obj.get(eid).material.map.image;
      console.log("New video!... Autoplaying...", video);

      // Need to deal with the fact play() may fail if user has not interacted with browser yet.
      video.play().catch(() => {
        console.error("Not allowed! You did a bad thing.");
      });
    }
  });

  mediaVideoExitQuery(world).forEach(function (eid) {
    //
  });

  mediaVideoQuery(world).forEach(function (eid) {
    //
  });
}
