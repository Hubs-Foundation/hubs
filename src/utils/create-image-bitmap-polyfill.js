// https://dev.to/nektro/createimagebitmap-polyfill-for-safari-and-edge-228
// https://gist.github.com/MonsieurV/fb640c29084c171b4444184858a91bc7
if (!("createImageBitmap" in window)) {
  window.createImageBitmap = async function(data) {
    return new Promise(resolve => {
      let dataURL;

      if (data instanceof Blob) {
        dataURL = URL.createObjectURL(data);
      } else if (data instanceof ImageData) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = data.width;
        canvas.height = data.height;
        ctx.putImageData(data, 0, 0);
        dataURL = canvas.toDataURL();
      } else {
        throw new Error("createImageBitmap does not handle the provided image source type");
      }

      const img = document.createElement("img");

      img.addEventListener("load", function() {
        resolve(this);
      });

      img.src = dataURL;
    });
  };
}
