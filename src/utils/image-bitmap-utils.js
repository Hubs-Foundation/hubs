export const createImageBitmap =
  window.createImageBitmap ||
  async function(data) {
    return new Promise(resolve => {
      // https://dev.to/nektro/createimagebitmap-polyfill-for-safari-and-edge-228
      // https://gist.github.com/MonsieurV/fb640c29084c171b4444184858a91bc7

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = data.width;
      canvas.height = data.height;
      ctx.putImageData(data, 0, 0);
      const dataURL = canvas.toDataURL();
      const img = document.createElement("img");

      img.addEventListener("load", function() {
        resolve(this);
      });

      img.src = dataURL;
    });
  };
