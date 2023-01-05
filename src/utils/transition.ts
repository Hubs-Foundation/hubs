import { Camera, Mesh, PlaneGeometry, Scene, ShaderMaterial, WebGLRenderer, WebGLRenderTarget } from "three";

const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = vec2( uv.x, uv.y );
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

const fragmentShader = `
  #include <common>
  
  uniform float mixRatio;

  uniform sampler2D tDiffuse1;
  uniform sampler2D tDiffuse2;
  uniform vec3 iResolution;
  uniform float iTime;
  uniform vec2 iPos;
  uniform bool iMixEllipse;

  uniform int useTexture;
  uniform float threshold;

  varying vec2 vUv;

  vec3 rgb(float r, float g, float b) {
    return vec3(r / 255.0, g / 255.0, b / 255.0);
  }

  float dis_e(vec2 center, float a, float b, vec2 coord){
    //Signed Distance Field Function;
    //Ellipse equation: x2/a2 + y2/b2 = 1; (a>b>0);  ("x2" ==> "x*x");
    float x2 = (coord.x-center.x)*(coord.x-center.x);
    float y2 = (coord.y-center.y)*(coord.y-center.y);
    float a2 = a*a;
    float b2 = b*b;
    float d = 1.0;
    d = x2/a2+y2/b2-1.0;
    return d;
}

  void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec4 texel1 = texture2D( tDiffuse1, vUv );
    vec4 texel2 = texture2D( tDiffuse2, vUv );

    vec2 uv = fragCoord.xy / iResolution.x;
    vec2 center = vec2(iPos.x / iResolution.x, (iPos.y / iResolution.y) - 0.1);
    float radius = mixRatio;
    
    if (iMixEllipse) {
      // Circle
      vec3 red = rgb(225.0, 95.0, 60.0);
      float de1 = dis_e(center,radius*0.5,radius,uv);
      vec4 layer2 = vec4(vec3(1.0,0.3,0.6),1.0 - smoothstep(-0.02,0.02,de1));
      
      // Blend the two
      fragColor = mix(texel2, texel1, mixRatio);
    }
  }

  void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
    //mainOrig();
  }
`;

export enum SceneId {
  CURRENT = 0,
  LOADING = 1
}

export interface TransitionParams {
  useTexture: Boolean;
  transition: number;
  cycle: Boolean;
  animate: Boolean;
  threshold: number;
}

class FXScene {
  fbo: WebGLRenderTarget;
  renderer: WebGLRenderer;
  scene: Scene;
  camera: Camera;

  constructor(renderer: WebGLRenderer, scene: Scene, camera: Camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.fbo = new WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      encoding: THREE.sRGBEncoding,
      depthBuffer: true,
      stencilBuffer: true
    });
  }

  render(delta: number, rtt: Boolean) {
    if (rtt) {
      this.renderer.setRenderTarget(this.fbo);
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
    } else {
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
    }
  }

  getScene() {
    return this.scene;
  }
}

export class Transition {
  scene: Scene;
  fxSceneA: FXScene;
  fxSceneB: FXScene;
  needsTextureChange: Boolean;
  transitionParams: TransitionParams;
  material: ShaderMaterial;
  renderer: WebGLRenderer;
  camera: Camera;
  transitionCamera: Camera;
  to: number;
  tmpVector: THREE.Vector3;
  tmpQuat: THREE.Quaternion;

  constructor(
    renderer: WebGLRenderer,
    camera: Camera,
    sceneA: Scene,
    sceneB: Scene,
    transitionParams: TransitionParams
  ) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = new Scene();
    this.fxSceneA = new FXScene(renderer, sceneA, camera);
    this.fxSceneB = new FXScene(renderer, sceneB, camera);
    this.transitionParams = transitionParams;

    const loader = new THREE.TextureLoader();

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse1: {
          value: null
        },
        tDiffuse2: {
          value: null
        },
        mixRatio: {
          value: 0.0
        },
        threshold: {
          value: 0.3
        },
        useTexture: {
          value: 0
        },
        iResolution: { value: new THREE.Vector3() },
        iTime: { value: 0.0 },
        iPos: { value: new THREE.Vector2() },
        iMixEllipse: { value: true }
      },
      vertexShader,
      fragmentShader
    });

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.transitionCamera = new THREE.OrthographicCamera(
      -1, // left
      1, // right
      1, // top
      -1, // bottom
      -1, // near,
      1 // far
    );
    const mesh = new Mesh(new PlaneGeometry(2, 2), this.material);
    this.scene.add(mesh);

    this.material.uniforms.tDiffuse1.value = this.fxSceneA.fbo.texture;
    this.material.uniforms.tDiffuse2.value = this.fxSceneB.fbo.texture;
    this.material.uniforms.iResolution.value.set(width, height, 1);

    this.needsTextureChange = false;
    this.to = 0;
    this.tmpVector = new THREE.Vector3();
    this.tmpQuat = new THREE.Quaternion();
  }

  public start(to: SceneId) {
    this.to = to;
    this.transitionParams.transition = to === SceneId.CURRENT ? SceneId.LOADING : this.transitionParams.transition;
    this.transitionParams.animate = true;
  }

  public setTransitionStep(value: number) {
    if (!this.transitionParams.animate) {
      this.transitionParams.transition = value;
    }
  }

  public setPos(x: number, y: number) {
    this.material.uniforms.iPos.value.set(x, y);
  }

  public render(delta: number) {
    // Transition animation
    if (this.transitionParams.animate) {
      if (this.to === SceneId.CURRENT && this.transitionParams.transition > 0) {
        this.transitionParams.transition -= delta * 2;
      } else if (this.to === SceneId.LOADING && this.transitionParams.transition < 1) {
        this.transitionParams.transition += delta * 2;
      } else {
        this.transitionParams.animate = false;
        this.transitionParams.transition = this.to === 1 ? 1 : 0;
      }
    }

    this.material.uniforms.mixRatio.value = this.transitionParams.transition;
    this.material.uniforms.iTime.value = delta;

    if (this.transitionParams.transition <= SceneId.CURRENT) {
      this.fxSceneB.render(delta, false);
      this.fxSceneA.getScene().matrixAutoUpdate = false;
    } else if (this.transitionParams.transition >= SceneId.LOADING) {
      this.fxSceneA.render(delta, false);
      APP.scene?.systems["hubs-systems"].characterController.avatarRig.object3D.getWorldPosition(this.tmpVector);
      this.fxSceneA.getScene().position.copy(this.tmpVector);
      this.fxSceneA.getScene().updateMatrixWorld(true);
    } else {
      this.fxSceneB.render(delta, true);
      this.fxSceneA.render(delta, true);

      this.renderer.setRenderTarget(null);
      this.renderer.clear();
      this.renderer.render(this.scene, this.transitionCamera);
    }
  }
}
