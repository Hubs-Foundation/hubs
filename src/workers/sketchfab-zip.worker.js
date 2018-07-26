import JSZip from "jszip";

async function fetchZipAndGetBlobs(src) {
  const zip = await fetch(src)
    .then(r => r.blob())
    .then(JSZip.loadAsync);

  // Rewrite any url refferences in the GLTF to blob urls
  const gltfJson = JSON.parse(await zip.file("scene.gltf").async("text"));
  const fileMap = await Object.values(zip.files).reduce(async (prev, file) => {
    if (file.name === "scene.gltf") return prev;
    const out = await prev;
    out[file.name] = URL.createObjectURL(await file.async("blob"));
    return out;
  }, Promise.resolve({}));
  gltfJson.buffers && gltfJson.buffers.forEach(b => (b.uri = fileMap[b.uri]));
  gltfJson.images && gltfJson.images.forEach(i => (i.uri = fileMap[i.uri]));

  fileMap["scene.gtlf"] = URL.createObjectURL(new Blob([JSON.stringify(gltfJson, null, 2)], { type: "text/plain" }));

  return fileMap;
}

self.onmessage = async e => {
  try {
    const fileMap = await fetchZipAndGetBlobs(e.data);
    self.postMessage([true, fileMap]);
  } catch (e) {
    self.postMessage([false, e]);
  }
};
