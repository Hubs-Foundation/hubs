import { THREE } from "aframe";
import "three/examples/jsm/shaders/DigitalGlitch";
import "three/examples/js/shaders/FilmShader";
import "three/examples/js/shaders/SepiaShader";
import "three/examples/js/shaders/VignetteShader";

class GlitchMaterial extends THREE.ShaderMaterial {
  constructor(texture) {
    const shader = THREE.DigitalGlitch;

    super({
      uniforms: {
        ...THREE.UniformsUtils.clone(shader.uniforms),
        tDiffuse: { value: texture }
      },
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });

    this.goWild = false;
    this.curF = 0;
    this.generateTrigger();
    this.uniforms.tDisp.value = this.generateHeightmap(64);
  }

  update() {
    this.uniforms["seed"].value = Math.random(); //default seeding
    this.uniforms["byp"].value = 0;

    if (this.curF % this.randX == 0 || this.goWild == true) {
      this.uniforms["amount"].value = Math.random() / 30;
      this.uniforms["angle"].value = THREE.Math.randFloat(-Math.PI, Math.PI);
      this.uniforms["seed_x"].value = THREE.Math.randFloat(-1, 1);
      this.uniforms["seed_y"].value = THREE.Math.randFloat(-1, 1);
      this.uniforms["distortion_x"].value = THREE.Math.randFloat(0, 1);
      this.uniforms["distortion_y"].value = THREE.Math.randFloat(0, 1);
      this.curF = 0;
      this.generateTrigger();
    } else if (this.curF % this.randX < this.randX / 5) {
      this.uniforms["amount"].value = Math.random() / 90;
      this.uniforms["angle"].value = THREE.Math.randFloat(-Math.PI, Math.PI);
      this.uniforms["distortion_x"].value = THREE.Math.randFloat(0, 1);
      this.uniforms["distortion_y"].value = THREE.Math.randFloat(0, 1);
      this.uniforms["seed_x"].value = THREE.Math.randFloat(-0.3, 0.3);
      this.uniforms["seed_y"].value = THREE.Math.randFloat(-0.3, 0.3);
    } else if (this.goWild == false) {
      this.uniforms["byp"].value = 1;
    }

    this.curF++;
  }

  generateTrigger() {
    this.randX = THREE.Math.randInt(120, 240);
  }

  generateHeightmap(dt_size) {
    const data_arr = new Float32Array(dt_size * dt_size * 3);
    const length = dt_size * dt_size;

    for (let i = 0; i < length; i++) {
      const val = THREE.Math.randFloat(0, 1);
      data_arr[i * 3 + 0] = val;
      data_arr[i * 3 + 1] = val;
      data_arr[i * 3 + 2] = val;
    }

    return new THREE.DataTexture(data_arr, dt_size, dt_size, THREE.RGBFormat, THREE.FloatType);
  }
}

class FilmMaterial extends THREE.ShaderMaterial {
  constructor(texture, noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale) {
    const shader = THREE.FilmShader;

    super({
      uniforms: THREE.UniformsUtils.clone(shader.uniforms),
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });

    this.uniforms["tDiffuse"].value = texture;

    if (grayscale !== undefined) this.uniforms.grayscale.value = grayscale;
    if (noiseIntensity !== undefined) this.uniforms.nIntensity.value = noiseIntensity;
    if (scanlinesIntensity !== undefined) this.uniforms.sIntensity.value = scanlinesIntensity;
    if (scanlinesCount !== undefined) this.uniforms.sCount.value = scanlinesCount;
  }

  update(deltaTime) {
    this.uniforms["time"].value += deltaTime;
  }
}

class SepiaMaterial extends THREE.ShaderMaterial {
  constructor(texture, amount) {
    const shader = THREE.SepiaShader;

    super({
      uniforms: THREE.UniformsUtils.clone(shader.uniforms),
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });

    this.uniforms["tDiffuse"].value = texture;

    if (amount !== undefined) this.uniforms.amount.value = amount;
  }

  update() {}
}

class VignetteMaterial extends THREE.ShaderMaterial {
  constructor(texture, offset, darkness) {
    const shader = THREE.VignetteShader;

    super({
      uniforms: THREE.UniformsUtils.clone(shader.uniforms),
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });

    this.uniforms["tDiffuse"].value = texture;

    if (offset !== undefined) this.uniforms.offset.value = offset;
    if (darkness !== undefined) this.uniforms.darkness.value = darkness;
  }

  update() {}
}

const RGBAToCC = color => {
  const y = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
  return new THREE.Vector2((color.b - y) * 0.565, (color.r - y) * 0.713);
};

class ChromaKeyMaterial extends THREE.ShaderMaterial {
  constructor(texture, chromaKeyColor) {
    super({
      uniforms: {
        tDiffuse: {
          value: texture
        },
        chromaKeyColor: {
          value: chromaKeyColor
        },
        keyCC: {
          value: RGBAToCC(chromaKeyColor)
        },
        range: {
          value: new THREE.Vector2(0.15, 0.35)
        },
        color: {
          value: new THREE.Color().setRGB(0.3, 0.9, 1)
        },
        alpha: {
          value: 0.7
        }
      },
      vertexShader: `
      varying vec2 vUv;

      void main() {
  
      	vUv = uv;
      	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  
      }
      `,
      // https://stackoverflow.com/questions/60767805/chromakey-glsl-shader-with-transparent-background
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec3 chromaKeyColor;    // key color as rgba
        uniform vec2 keyCC;      // the CC part of YCC color model of key color 
        uniform vec2 range;      // the smoothstep range
        uniform vec3 color;
        uniform float alpha;

        varying vec2 vUv;

        vec2 RGBToCC(vec4 rgba) {
          float Y = 0.299 * rgba.r + 0.587 * rgba.g + 0.114 * rgba.b;
          return vec2((rgba.b - Y) * 0.565, (rgba.r - Y) * 0.713);
        }

        void main() {
          vec4 src1Color = texture2D(tDiffuse,  vUv);
          vec2 CC = RGBToCC(src1Color);
          float mask = sqrt(pow(keyCC.x - CC.x, 2.0) + pow(keyCC.y - CC.y, 2.0));
          mask = smoothstep(range.x, range.y, mask);
          if (mask == 0.0) { discard; }
          else if (mask == 1.0) { gl_FragColor = src1Color * vec4(color, alpha); }
          else { gl_FragColor = max(src1Color - (1.0 - mask) * vec4(chromaKeyColor, 1.0), 0.0) * vec4(color, alpha); }
        }
      `,
      transparent: true
    });
  }

  update() {}
}

AFRAME.registerComponent("webcam-texture-target", {
  schema: {
    src: { type: "string" }
  },

  init() {
    this.effectMaterials = [];
  },

  update() {
    const src = this.data.src;

    if (src.startsWith("hubs://")) {
      const streamClientId = src.substring(7).split("/")[1]; // /clients/<client id>/video is only URL for now

      NAF.connection.adapter.getMediaStream(streamClientId, "video").then(stream => {
        const video = document.createElement("video");
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");
        // iOS Safari requires the autoplay attribute, or it won't play the video at all.
        video.autoplay = true;
        // iOS Safari will not play videos without user interaction. We mute the video so that it can autoplay and then
        // allow the user to unmute it with an interaction in the unmute-video-button component.
        video.muted = AFRAME.utils.device.isIOS();
        video.preload = "auto";
        video.crossOrigin = "anonymous";

        video.srcObject = new MediaStream(stream.getVideoTracks());

        const texture = new THREE.VideoTexture(video);
        texture.flipY = false;
        texture.minFilter = THREE.LinearFilter;
        texture.encoding = THREE.sRGBEncoding;

        this.el.object3D.traverse(obj => {
          const textureTargetComponent =
            obj.material?.userData.gltfExtensions?.MOZ_hubs_components?.["webcam-texture-target"];

          if (textureTargetComponent) {
            const color = new THREE.Color().setHex(0xff7800);
            obj.material = new ChromaKeyMaterial(texture, color);
            window.material = obj.material;
            this.effectMaterials.push(obj.material);
          }
        });
      });
    }
  },

  tick(t, dt) {
    for (let i = 0; i < this.effectMaterials.length; i++) {
      this.effectMaterials[i].update(dt);
    }
  }
});
