export const createImageBitmap =
  window.createImageBitmap ||
  async function(data) {
    return new Promise(resolve => {
      // https://dev.to/nektro/createimagebitmap-polyfill-for-safari-and-edge-228
      // https://gist.github.com/MonsieurV/fb640c29084c171b4444184858a91bc7

      let srcUrl;
      if (data instanceof Blob) {
        srcUrl = URL.createObjectURL(data);
      } else {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = data.width;
        canvas.height = data.height;
        ctx.putImageData(data, 0, 0);
        srcUrl = canvas.toDataURL();
      }
      const img = document.createElement("img");

      img.addEventListener("load", () => resolve(img));

      img.src = srcUrl;
    });
  };

export function disposeImageBitmap(imageBitmap) {
  if (imageBitmap instanceof HTMLImageElement && imageBitmap.src.startsWith("blob:")) {
    URL.revokeObjectURL(imageBitmap.src);
  } else {
    imageBitmap.close && imageBitmap.close();
  }
}
