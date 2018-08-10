const urls = [
  "https://asset-bundles-prod.reticulum.io/interactables/Ducky/DuckyMesh-438ff8e022.gltf",
  "https://google.com",
  "https://foo.com"
];

const DUCK = "https://asset-bundles-prod.reticulum.io/interactables/Ducky/DuckyMesh-438ff8e022.gltf";

export default function getSurpriseMediaUrl() {
  if (Math.random() < 0.05) return DUCK; // Because ducks test well
  return urls[Math.floor(Math.random() * urls.length)];
}
