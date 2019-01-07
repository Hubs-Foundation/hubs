import cubeMapPosX from "../assets/images/cubemap/posx.jpg";
import cubeMapNegX from "../assets/images/cubemap/negx.jpg";
import cubeMapPosY from "../assets/images/cubemap/posy.jpg";
import cubeMapNegY from "../assets/images/cubemap/negy.jpg";
import cubeMapPosZ from "../assets/images/cubemap/posz.jpg";
import cubeMapNegZ from "../assets/images/cubemap/negz.jpg";

async function loadEnvMap() {
  const urls = [cubeMapPosX, cubeMapNegX, cubeMapPosY, cubeMapNegY, cubeMapPosZ, cubeMapNegZ];
  const texture = await new THREE.CubeTextureLoader().load(urls);
  texture.format = THREE.RGBFormat;
  return texture;
}

AFRAME.registerComponent("environment-map", {
  schema: {
    source: { default: "skybox", type: "string" }
  },

  init() {
    this.environmentMap = null;
  },

  update(oldData) {
    if (oldData.source !== this.data.source && this.data.source === "defaultCubemap") {
      // Used in the avatar selector scene because there is no skybox.
      loadEnvMap().then(texture => {
        this.updateEnvironmentMap(texture);
      });
    }
  },

  updateEnvironmentMap(environmentMap) {
    this.environmentMap = environmentMap;

    this.el.object3D.traverse(object => {
      if (object.material && object.material.isMeshStandardMaterial) {
        object.material.envMap = environmentMap;
        object.material.needsUpdate = true;
      }
    });
  }
});
