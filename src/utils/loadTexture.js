export default function loadTexture(src) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(src, resolve, null, reject);
  });
}
