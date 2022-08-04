// TODO: Consolidate with MediaType in media-utils!!
export const MEDIA_TYPE = {
  VIDEO: 1,
  AUDIO: 2,
  IMAGE: 3,
  PDF: 4,
  MODEL: 5,
  HTML: 6
};

function isVideo({ canonicalUrl, contentType }) {
  return (
    contentType.startsWith("video/") ||
    contentType.startsWith("application/dash") ||
    AFRAME.utils.material.isHLS(canonicalUrl, contentType)
  );
}

function isAudio({ contentType }) {
  return contentType.startsWith("audio/");
}

function isImage({ contentType }) {
  return contentType.startsWith("image/");
}

function isPDF({ contentType }) {
  return contentType.startsWith("application/pdf");
}

function isModel({ contentType }) {
  return (
    contentType.includes("application/octet-stream") ||
    contentType.includes("x-zip-compressed") ||
    contentType.startsWith("model/gltf")
  );
}

function isHTML({ contentType }) {
  return contentType.startsWith("text/html");
}

export function mediaTypeFor(options) {
  if (isVideo(options)) return MEDIA_TYPE.VIDEO;
  if (isAudio(options)) return MEDIA_TYPE.AUDIO;
  if (isImage(options)) return MEDIA_TYPE.IMAGE;
  if (isPDF(options)) return MEDIA_TYPE.PDF;
  if (isModel(options)) return MEDIA_TYPE.MODEL;
  if (isHTML(options)) return MEDIA_TYPE.HTML;
  return null;
}
