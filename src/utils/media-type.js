import { MediaType } from "../utils/media-utils";

function isVideo(contentType, canonicalUrl) {
  return (
    contentType.startsWith("video/") ||
    contentType.startsWith("application/dash") ||
    AFRAME.utils.material.isHLS(canonicalUrl, contentType)
  );
}

function isAudio(contentType) {
  return contentType.startsWith("audio/");
}

function isImage(contentType) {
  return contentType.startsWith("image/");
}

function isPDF(contentType) {
  return contentType.startsWith("application/pdf");
}

function isModel(contentType) {
  return (
    contentType.includes("application/octet-stream") ||
    contentType.includes("x-zip-compressed") ||
    contentType.startsWith("model/gltf")
  );
}

function isHTML(contentType) {
  return contentType.startsWith("text/html");
}

export function mediaTypeFor(contentType, canonicalUrl) {
  if (isVideo(contentType, canonicalUrl)) return MediaType.VIDEO;
  if (isAudio(contentType)) return MediaType.AUDIO;
  if (isImage(contentType)) return MediaType.IMAGE;
  if (isPDF(contentType)) return MediaType.PDF;
  if (isModel(contentType)) return MediaType.MODEL;
  if (isHTML(contentType)) return MediaType.HTML;
  return null;
}
