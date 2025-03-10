import { hasComponent } from "bitecs";
import { GLTFModel, MediaImage, MediaInfo, MediaPDF, MediaVideo } from "../bit-components";

export const SORT_ORDER_VIDEO = 0;
export const SORT_ORDER_AUDIO = 1;
export const SORT_ORDER_IMAGE = 2;
export const SORT_ORDER_PDF = 3;
export const SORT_ORDER_MODEL = 4;
export const SORT_ORDER_UNIDENTIFIED = 5;

function mediaSortOrder(eid) {
  if (hasComponent(APP.world, MediaVideo, eid)) {
    if (hasComponent(APP.world, MediaInfo, eid)) {
      const contentTypeSid = MediaInfo.contentType[eid];
      const contentType = APP.getString(contentTypeSid);
      if (contentType.startsWith("audio/")) {
        return SORT_ORDER_AUDIO;
      }
    }
    return SORT_ORDER_VIDEO;
  }
  if (hasComponent(APP.world, MediaImage, eid)) return SORT_ORDER_IMAGE;
  if (hasComponent(APP.world, MediaPDF, eid)) return SORT_ORDER_PDF;
  if (hasComponent(APP.world, GLTFModel, eid)) return SORT_ORDER_MODEL;
  return SORT_ORDER_UNIDENTIFIED;
}

function mediaSortOrderAframe(el) {
  if (el.components["media-video"] && el.components["media-video"].data.contentType.startsWith("audio/")) {
    return SORT_ORDER_AUDIO;
  }
  if (el.components["media-video"]) return SORT_ORDER_VIDEO;
  if (el.components["media-image"]) return SORT_ORDER_IMAGE;
  if (el.components["media-pdf"]) return SORT_ORDER_PDF;
  if (el.components["gltf-model-plus"]) return SORT_ORDER_MODEL;
  return SORT_ORDER_UNIDENTIFIED;
}

export function mediaSort(eid1, eid2) {
  return mediaSortOrder(eid1) - mediaSortOrder(eid2);
}

export function mediaSortAframe(el1, el2) {
  return mediaSortOrderAframe(el1) - mediaSortOrderAframe(el2);
}

const SORT_ORDER_TO_TYPE = {
  [SORT_ORDER_VIDEO]: "video",
  [SORT_ORDER_AUDIO]: "audio",
  [SORT_ORDER_IMAGE]: "image",
  [SORT_ORDER_PDF]: "pdf",
  [SORT_ORDER_MODEL]: "model"
};

export function getMediaType(eid) {
  const order = mediaSortOrder(eid);
  return SORT_ORDER_TO_TYPE[order];
}

export function getMediaTypeAframe(el) {
  const order = mediaSortOrderAframe(el);
  return SORT_ORDER_TO_TYPE[order];
}
