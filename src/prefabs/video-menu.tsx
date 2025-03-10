/** @jsx createElementEntity */
import { BoxBufferGeometry, FrontSide, Mesh, MeshBasicMaterial, PlaneBufferGeometry, ShaderChunk } from "three";
import { Label } from "../prefabs/camera-tool";
import { ArrayVec3, Attrs, createElementEntity, createRef } from "../utils/jsx-entity";
import playImageUrl from "../assets/images/sprites/notice/play.png";
import pauseImageUrl from "../assets/images/sprites/notice/pause.png";
import { BUTTON_TYPES, Button3D } from "./button3D";
import { loadTexture, loadTextureFromCache } from "../utils/load-texture";
import snapIconSrc from "../assets/spawn_message.png";

export async function loadVideoMenuButtonIcons() {
  return Promise.all([
    loadTexture(playImageUrl, 1, "image/png"),
    loadTexture(pauseImageUrl, 1, "image/png"),
    loadTexture(snapIconSrc, 1, "image/png")
  ]);
}

export const VolumeControlsMaterial = new THREE.ShaderMaterial({
  uniforms: {
    volume: { value: 0.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main()
    {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      vUv = uv;
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform float volume;
    varying vec2 vUv;
    
    void main() {
      float step = step(volume, vUv.x);
      gl_FragColor = mix(vec4(vec3(0.8), 1.0), vec4(vec3(0.2), 1.0), step);
    }
  `
});
VolumeControlsMaterial.side = FrontSide;

const uiZ = 0.001;
const BUTTON_HEIGHT = 0.2;
const BIG_BUTTON_SCALE: ArrayVec3 = [0.8, 0.8, 0.8];
const BUTTON_SCALE: ArrayVec3 = [0.6, 0.6, 0.6];
const SMALL_BUTTON_SCALE: ArrayVec3 = [0.4, 0.4, 0.4];
const BUTTON_WIDTH = 0.2;

function Slider({ trackRef, headRef, ...props }: any) {
  return (
    <entity {...props} name="Slider">
      <entity
        name="Slider:Track"
        videoMenuItem
        object3D={new Mesh(new PlaneBufferGeometry(1.0, 0.05), new MeshBasicMaterial({ color: 0x000000 }))}
        cursorRaycastable
        remoteHoverTarget
        holdable
        holdableButton
        ref={trackRef}
      >
        <entity
          name="Slider:Head"
          object3D={new Mesh(new BoxBufferGeometry(0.05, 0.05, 0.05), new MeshBasicMaterial({ color: 0xffffff }))}
          ref={headRef}
        />
      </entity>
    </entity>
  );
}

interface VolumeButtonProps extends Attrs {
  text: string;
}

function VolumeButton(props: VolumeButtonProps) {
  return (
    <Button3D
      name={props.name}
      scale={SMALL_BUTTON_SCALE}
      width={BUTTON_WIDTH}
      height={BUTTON_HEIGHT}
      type={BUTTON_TYPES.ACTION}
      {...props}
    />
  );
}

function VolumeControls({ volUpRef, volDownRef, ...props }: any) {
  return (
    <entity {...props} name="Volume Controls">
      <entity name="Volume Bar" object3D={new Mesh(new PlaneBufferGeometry(0.5, 0.05), VolumeControlsMaterial)} />
      <VolumeButton name="Decrease Volume button" text="-" ref={volDownRef} position={[-0.35, 0, 0]} />
      <VolumeButton name="Increase Volume Button" text="+" ref={volUpRef} position={[0.35, 0, 0]} />
    </entity>
  );
}

interface VideoButtonProps extends Attrs {
  buttonIcon: string;
}

function VideoActionButton({ buttonIcon, ...props }: VideoButtonProps) {
  const { texture, cacheKey } = loadTextureFromCache(buttonIcon, 1);
  return (
    <Button3D
      position={[0, 0, uiZ]}
      scale={BIG_BUTTON_SCALE}
      width={BUTTON_HEIGHT}
      height={BUTTON_WIDTH}
      type={BUTTON_TYPES.DEFAULT}
      icon={{ texture, cacheKey, scale: [0.165, 0.165, 0.165] }}
      {...props}
    />
  );
}

function SnapButton(props: Attrs) {
  const { texture, cacheKey } = loadTextureFromCache(snapIconSrc, 1);
  return (
    <Button3D
      name="Remove Button"
      scale={BUTTON_SCALE}
      width={BUTTON_HEIGHT}
      height={BUTTON_WIDTH}
      type={BUTTON_TYPES.ACTION}
      icon={{ texture, cacheKey, scale: [0.165, 0.165, 0.165] }}
      {...props}
    />
  );
}

export function VideoMenuPrefab() {
  const timeLabelRef = createRef();
  const sliderRef = createRef();
  const headRef = createRef();
  const trackRef = createRef();
  const playIndicatorRef = createRef();
  const pauseIndicatorRef = createRef();
  const snapRef = createRef();
  const volUpRef = createRef();
  const volDownRef = createRef();
  const halfHeight = 9 / 16 / 2;

  return (
    <entity
      name="Video Menu"
      objectMenuTransform={{ scale: true }}
      videoMenu={{
        sliderRef,
        timeLabelRef,
        headRef,
        trackRef,
        playIndicatorRef,
        pauseIndicatorRef,
        snapRef,
        volUpRef,
        volDownRef
      }}
    >
      <Label
        name="Time Label"
        text={{ anchorY: "top", anchorX: "right" }}
        ref={timeLabelRef}
        scale={[0.5, 0.5, 0.5]}
        position={[0.5 - 0.02, halfHeight - 0.02, uiZ]}
      />
      <SnapButton name="Snap Button" ref={snapRef} position={[0, 0.2, uiZ]} />
      <Slider ref={sliderRef} trackRef={trackRef} headRef={headRef} position={[0, -halfHeight + 0.025, uiZ]} />
      <VideoActionButton ref={playIndicatorRef} name={"Play Button"} buttonIcon={playImageUrl} />
      <VideoActionButton ref={pauseIndicatorRef} name={"Pause Button"} buttonIcon={pauseImageUrl} />
      <VolumeControls volUpRef={volUpRef} volDownRef={volDownRef} position={[0, -0.15, uiZ]} />
    </entity>
  );
}
