import ZipLoader from "zip-loader";

async function fetchZipAndGetBlobs(src) {
  const zip = new ZipLoader(src);
  return zip.load().then(() => {
    // Rewrite any url references in the GLTF to blob urls
    const fileMap = {};
    for (const fileName in zip.files) {
      fileMap[fileName] = zip.extractAsBlobUrl(fileName);
    }

    const gltfJson = JSON.parse(zip.extractAsText("scene.gltf"));
    gltfJson.buffers && gltfJson.buffers.forEach(b => (b.uri = fileMap[b.uri]));
    gltfJson.images && gltfJson.images.forEach(i => (i.uri = fileMap[i.uri]));
    fileMap["scene.gtlf"] = URL.createObjectURL(new Blob([JSON.stringify(gltfJson, null, 2)], { type: "text/plain" }));

    return fileMap;
  });
}

self.onmessage = async msg => {
  try {
    const result = await fetchZipAndGetBlobs(msg.data.payload);
    self.postMessage({ id: msg.data.id, result });
  } catch (e) {
    self.postMessage({ id: msg.data.id, err: e.message });
  }
};
