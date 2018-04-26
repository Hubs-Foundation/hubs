// From THREE.GLTFLoader https://github.com/mrdoob/three.js/blob/dev/examples/js/loaders/GLTFLoader.js#L1117
export function resolveURL(url, path) {
  // Invalid URL
  if (typeof url !== "string" || url === "") return "";

  // Absolute URL http://,https://,//
  if (/^(https?:)?\/\//i.test(url)) return url;

  // Data URI
  if (/^data:.*,.*$/i.test(url)) return url;

  // Blob URL
  if (/^blob:.*$/i.test(url)) return url;

  // Relative URL
  return path + url;
}

export function resolveGLTFSrc(url, gltfPath) {
  // Let AFrame parse the URL
  if (url.match(/\url\((.+)\)/) || url.charAt(0) === "#") {
    return url;
  }

  return resolveURL(gltfPath);
}

export function extractUrlBase(url) {
  const index = url.lastIndexOf("/");

  if (index === -1) return "./";

  return url.substr(0, index + 1);
}
