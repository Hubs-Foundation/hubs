// Enumeration of spawned object content origins. URL means the content is
// fetched from a URL, FILE means it was an uploaded/dropped file, and
// CLIPBOARD means it was raw data pasted in from the clipboard, SPAWNER means
// it was copied over from a spawner.
export const ObjectContentOrigins = {
  URL: 1,
  FILE: 2,
  CLIPBOARD: 3,
  SPAWNER: 4
};

// Enumeration of spawnable object types, used for telemetry, which encapsulates
// both the origin of the content for the object and also the type of content
// contained in the object.
export const ObjectTypes = {
  URL_IMAGE: 0,
  URL_VIDEO: 1,
  URL_MODEL: 2,
  URL_PDF: 3,
  URL_AUDIO: 4,
  //URL_TEXT: 5,
  //URL_TELEPORTER: 6,
  FILE_IMAGE: 8,
  FILE_VIDEO: 9,
  FILE_MODEL: 10,
  FILE_PDF: 11,
  FILE_AUDIO: 12,
  //FILE_TEXT: 13,
  CLIPBOARD_IMAGE: 16,
  CLIPBOARD_VIDEO: 17,
  CLIPBOARD_MODEL: 18,
  CLIPBOARD_PDF: 19,
  CLIPBOARD_AUDIO: 20,
  //CLIPBOARD_TEXT: 21,
  SPAWNER_IMAGE: 24,
  SPAWNER_VIDEO: 25,
  SPAWNER_MODEL: 26,
  SPAWNER_PDF: 27,
  SPAWNER_AUDIO: 28,
  //SPAWNER_TEXT: 29,
  CAMERA: 30,
  UNKNOWN: 31
};

// Given an origin and three object type values for URL, FILE, and CLIPBOARD
// origins respectively, return the appropriate one
function objectTypeForOrigin(contentOrigin, urlType, fileType, clipboardType, spawnerType) {
  if (contentOrigin === ObjectContentOrigins.URL) {
    return urlType;
  } else if (contentOrigin === ObjectContentOrigins.FILE) {
    return fileType;
  } else if (contentOrigin === ObjectContentOrigins.CLIPBOARD) {
    return clipboardType;
  } else {
    return spawnerType;
  }
}

// Lookup table of mime-type prefixes to the set of object types that we should use
// for objects spawned matching their underlying Content-Type.
const objectTypeMimePrefixLookupMap = {
  "image/": [ObjectTypes.URL_IMAGE, ObjectTypes.FILE_IMAGE, ObjectTypes.CLIPBOARD_IMAGE, ObjectTypes.SPAWNER_IMAGE],
  "model/": [ObjectTypes.URL_MODEL, ObjectTypes.FILE_MODEL, ObjectTypes.CLIPBOARD_MODEL, ObjectTypes.SPAWNER_MODEL],
  "application/x-zip-compressed": [
    ObjectTypes.URL_MODEL,
    ObjectTypes.FILE_MODEL,
    ObjectTypes.CLIPBOARD_MODEL,
    ObjectTypes.SPAWNER_MODEL
  ],
  "video/": [ObjectTypes.URL_VIDEO, ObjectTypes.FILE_VIDEO, ObjectTypes.CLIPBOARD_VIDEO, ObjectTypes.SPAWNER_VIDEO],
  "application/vnd.apple.mpegurl": [
    ObjectTypes.URL_VIDEO,
    ObjectTypes.FILE_VIDEO,
    ObjectTypes.CLIPBOARD_VIDEO,
    ObjectTypes.SPAWNER_VIDEO
  ],
  "application/x-mpegurl": [
    ObjectTypes.URL_VIDEO,
    ObjectTypes.FILE_VIDEO,
    ObjectTypes.CLIPBOARD_VIDEO,
    ObjectTypes.SPAWNER_VIDEO
  ],
  "audio/": [ObjectTypes.URL_AUDIO, ObjectTypes.FILE_AUDIO, ObjectTypes.CLIPBOARD_AUDIO, ObjectTypes.SPAWNER_AUDIO],
  "application/pdf": [ObjectTypes.URL_PDF, ObjectTypes.FILE_PDF, ObjectTypes.CLIPBOARD_PDF, ObjectTypes.SPAWNER_PDF]
};

const srcSuffixLookupMap = {
  ".m3u8": [ObjectTypes.URL_VIDEO, ObjectTypes.FILE_VIDEO, ObjectTypes.CLIPBOARD_VIDEO, ObjectTypes.SPAWNER_VIDEO]
};

// Given an content origin and the resolved mime type of a piece of content, return
// the ObjectType, if any, for that content.
export function objectTypeForOriginAndContentType(contentOrigin, contentType, src) {
  for (const prefix in objectTypeMimePrefixLookupMap) {
    if (contentType.toLowerCase().startsWith(prefix)) {
      const types = objectTypeMimePrefixLookupMap[prefix];
      return objectTypeForOrigin(contentOrigin, ...types);
    }
  }

  if (src) {
    for (const suffix in srcSuffixLookupMap) {
      if (src.toLowerCase().endsWith(suffix)) {
        const types = srcSuffixLookupMap[suffix];
        return objectTypeForOrigin(contentOrigin, ...types);
      }
    }
  }

  return ObjectTypes.UNKNOWN;
}
