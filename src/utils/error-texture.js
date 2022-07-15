import errorImageSrc from "!!url-loader!../assets/images/media-error.png";

const errorImage = new Image();
errorImage.src = errorImageSrc;
export const errorTexture = new THREE.Texture(errorImage);
errorImage.onload = () => {
  errorTexture.needsUpdate = true;
};
