import cubeMapPosX from "../assets/images/cubemap/posx.jpg";
import cubeMapNegX from "../assets/images/cubemap/negx.jpg";
import cubeMapPosY from "../assets/images/cubemap/posy.jpg";
import cubeMapNegY from "../assets/images/cubemap/negy.jpg";
import cubeMapPosZ from "../assets/images/cubemap/posz.jpg";
import cubeMapNegZ from "../assets/images/cubemap/negz.jpg";

export async function createDefaultEnvironmentMap() {
  const urls = [cubeMapPosX, cubeMapNegX, cubeMapPosY, cubeMapNegY, cubeMapPosZ, cubeMapNegZ];
  const texture = await new Promise((resolve, reject) =>
    new THREE.CubeTextureLoader().load(urls, resolve, undefined, reject)
  );
  texture.format = THREE.RGBFormat;
  return texture;
}
