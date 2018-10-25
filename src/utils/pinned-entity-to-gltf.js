export default function pinnedEntityToGltf(el) {
  if (!NAF.utils.isMine(el)) return;

  // Construct a GLTF node from this entity
  const object3D = el.object3D;
  const components = el.components;
  const networkId = components.networked.data.networkId;

  const gltfComponents = {};
  const gltfNode = { name: networkId, extensions: { HUBS_components: gltfComponents } };

  // Adapted from three.js GLTFExporter
  const equalArray = (x, y) => x.length === y.length && x.every((v, i) => v === y[i]);
  const rotation = object3D.quaternion.toArray();
  const position = object3D.position.toArray();
  const scale = object3D.scale.toArray();

  if (!equalArray(rotation, [0, 0, 0, 1])) gltfNode.rotation = rotation;
  if (!equalArray(position, [0, 0, 0])) gltfNode.translation = position;
  if (!equalArray(scale, [1, 1, 1])) gltfNode.scale = scale;

  if (components["media-loader"]) {
    gltfComponents.media = { src: components["media-loader"].data.src, networkId };

    if (components["media-pager"]) {
      gltfComponents.media.pageIndex = components["media-pager"].data.index;
    }
  }

  gltfComponents.pinnable = { pinned: true };

  return gltfNode;
}
