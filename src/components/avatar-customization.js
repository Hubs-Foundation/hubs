import Please from "pleasejs";

// @TODO this whole thing is a bit of a hack. This should probably just be setting some uniforms on a sharder.
// @TODO the palate should be indexed by alpha channel instead of the red channel.
// @TODO color should be multiplied with the texture value to allow for texture to provide surface detail.
// @TODO texture should be regenerated whenever headColor/LidColor values change to allow for networking, though arguably these will eventually be fetched from a users "profile" anywya, so might not be worth trying to network through NAF.
AFRAME.registerComponent("avatar-customization", {
  schema: {
    headColor: { type: "color", default: null },
    lidColor: { type: "color", default: null }
  },

  init: function() {
    const colors = Please.make_color({
      format: "rgb-string",
      colors_returned: 2
    });

    this.colorMap = new Map();
    this.colorMap.set(128, this.data.headColor || new THREE.Color(colors[0]));
    this.colorMap.set(115, this.data.lidColor || new THREE.Color(colors[1]));

    this.el.addEventListener("model-loaded", () => {
      const map = this.el.object3D.getObjectByName("DodecAvatar_Head_0")
        .material.map;
      const img = map.image;

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const pixelData = imageData.data;

      for (let i = 0; i < pixelData.length; i += 4) {
        // @TODO check alpha channel and multiply colors to preserver surface detail
        if (this.colorMap.has(pixelData[i])) {
          const color = this.colorMap.get(pixelData[i]);
          pixelData[i] = color.r * 255;
          pixelData[i + 1] = color.g * 255;
          pixelData[i + 2] = color.b * 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      map.image = canvas;
    });
  }
});
