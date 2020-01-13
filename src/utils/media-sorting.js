export const SORT_ORDER_VIDEO = 0;
export const SORT_ORDER_AUDIO = 1;
export const SORT_ORDER_IMAGE = 2;
export const SORT_ORDER_PDF = 3;
export const SORT_ORDER_MODEL = 4;
export const SORT_ORDER_UNIDENTIFIED = 5;

export function mediaSortOrder(el) {
  if (el.components["media-video"] && el.components["media-video"].data.contentType.startsWith("audio/")) {
    return SORT_ORDER_AUDIO;
  }
  if (el.components["media-video"]) return SORT_ORDER_VIDEO;
  if (el.components["media-image"]) return SORT_ORDER_IMAGE;
  if (el.components["media-pdf"]) return SORT_ORDER_PDF;
  if (el.components["gltf-model-plus"]) return SORT_ORDER_MODEL;
  return SORT_ORDER_UNIDENTIFIED;
}

export function mediaSort(el1, el2) {
  return mediaSortOrder(el1) - mediaSortOrder(el2);
}
