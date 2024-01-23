import { addComponent, defineQuery, enterQuery, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { MirroredMedia, LinkedMedia, MediaPDF, NetworkedPDF, MediaPDFUpdated } from "../bit-components";
import { findAncestorWithComponent, findChildWithComponent } from "../utils/bit-utils";
import { takeOwnership } from "../utils/take-ownership";
import { linkMedia } from "./linked-media-system";

const mediaPDFQuery = defineQuery([MediaPDF]);
const mediaPDFEnterQuery = enterQuery(mediaPDFQuery);
const updatedPDFQuery = defineQuery([MediaPDFUpdated]);
const updatedPDFEnterQuery = enterQuery(updatedPDFQuery);
export function linkedPDFSystem(world: HubsWorld) {
  mediaPDFEnterQuery(world).forEach(eid => {
    const mirroredMediaEid = findAncestorWithComponent(world, MirroredMedia, eid);
    if (mirroredMediaEid) {
      const mediaMirroredEid = MirroredMedia.linkedRef[mirroredMediaEid];
      const sourceMediaEid = findChildWithComponent(world, MediaPDF, mediaMirroredEid)!;
      if (sourceMediaEid) {
        linkMedia(world, eid, sourceMediaEid);
        addComponent(world, MediaPDFUpdated, eid);
        MediaPDFUpdated.pageNumber[eid] = MediaPDF.pageNumber[sourceMediaEid];
      }
    }
  });
  updatedPDFEnterQuery(world).forEach(eid => {
    if (!hasComponent(world, LinkedMedia, eid)) return;
    const linked = LinkedMedia.linkedRef[eid];
    if (MediaPDFUpdated.pageNumber[eid] !== MediaPDF.pageNumber[linked]) {
      if (!hasComponent(world, NetworkedPDF, eid)) {
        takeOwnership(world, linked);
      }
      addComponent(world, MediaPDFUpdated, linked);
      MediaPDFUpdated.pageNumber[linked] = MediaPDFUpdated.pageNumber[eid];
    }
  });
}
