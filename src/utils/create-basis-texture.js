import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import { BasisTextureLoader } from "three/examples/jsm/loaders/BasisTextureLoader";
import { rewriteBasisTranscoderUrls } from "./media-url-utils";
const loadingManager = new THREE.LoadingManager();
loadingManager.setURLModifier(rewriteBasisTranscoderUrls);
let ktxLoader;
let basisLoader;
export function createBasisTexture(url) {
  if (!basisLoader) {
    basisLoader = new BasisTextureLoader(loadingManager).detectSupport(AFRAME.scenes[0].renderer);
  }
  return new Promise((resolve, reject) => {
    basisLoader.load(
      url,
      function(texture) {
        texture.encoding = THREE.sRGBEncoding;
        texture.onUpdate = function() {
          // Delete texture data once it has been uploaded to the GPU
          texture.mipmaps.length = 0;
        };
        // texture.anisotropy = 4;
        resolve(texture);
      },
      undefined,
      function(error) {
        console.error(error);
        reject(new Error(`'${url}' could not be fetched (Error: ${error}`));
      }
    );
  });
}

export function createKTX2Texture(url) {
  if (!ktxLoader) {
    ktxLoader = new KTX2Loader(loadingManager).detectSupport(AFRAME.scenes[0].renderer);
  }
  return new Promise((resolve, reject) => {
    ktxLoader.load(
      url,
      function(texture) {
        texture.encoding = THREE.sRGBEncoding;
        texture.onUpdate = function() {
          // Delete texture data once it has been uploaded to the GPU
          texture.mipmaps.length = 0;
        };
        texture.anisotropy = 4;
        resolve(texture);
      },
      undefined,
      function(error) {
        console.error(error);
        reject(new Error(`'${url}' could not be fetched (Error: ${error}`));
      }
    );
  });
}
