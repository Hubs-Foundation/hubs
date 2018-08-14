import JSZip from "jszip";

async function fetchZipAndGetBlobs(src) {
  const zip = await fetch(src)
    .then(r => r.blob())
    .then(JSZip.loadAsync);

  // Rewrite any url refferences in the GLTF to blob urls
  const fileMap = {};
  const files = Object.values(zip.files);
  const fileBlobs = await Promise.all(files.map(f => f.async("blob")));
  for (let i = 0; i < fileBlobs.length; i++) {
    fileMap[files[i].name] = URL.createObjectURL(fileBlobs[i]);
  }

  const gltfJson = JSON.parse(await zip.file("scene.gltf").async("text"));
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
    self.postMessage([false, e.message]);
  }
  delete self.onmessage;
};
