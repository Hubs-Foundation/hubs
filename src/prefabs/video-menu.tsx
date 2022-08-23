/** @jsx createElementEntity */
import { BoxBufferGeometry, Mesh, MeshBasicMaterial, PlaneBufferGeometry, Texture } from "three";
import { Label } from "../prefabs/camera-tool";
import { AlphaMode } from "../utils/create-image-mesh";
import { createElementEntity, createRef } from "../utils/jsx-entity";

import { textureLoader } from "../utils/media-utils";
declare function require(s: string): string;
const playImageUrl = require("../assets/images/sprites/notice/play.png");
const pauseImageUrl = require("../assets/images/sprites/notice/pause.png");

const playTexture = textureLoader.load(playImageUrl) as unknown as Texture;
const pauseTexture = textureLoader.load(pauseImageUrl) as unknown as Texture;

function Slider({ trackRef, headRef, ...props }: any) {
  return (
    <entity {...props} name="Slider">
      <entity
        name="Slider:Track"
        video-menu-item
        object3D={
          new Mesh(
            new PlaneBufferGeometry(1.0, 0.05),
            new MeshBasicMaterial({ opacity: 0.5, color: 0x000000, transparent: true })
          )
        }
        cursor-raycastable
        remote-hover-target
        holdable
        holdable-button
        ref={trackRef}
      >
        <entity
          is-not-remote-hover-target
          name="Slider:Head"
          object3D={new Mesh(new BoxBufferGeometry(0.05, 0.05, 0.05), new MeshBasicMaterial())}
          ref={headRef}
        />
      </entity>
    </entity>
  );
}

export function VideoMenuPrefab() {
  const uiZ = 0.001;
  const timeLabelRef = createRef();
  const headRef = createRef();
  const trackRef = createRef();
  const playIndicatorRef = createRef();
  const pauseIndicatorRef = createRef();
  const halfHeight = 9 / 16 / 2;

  return (
    <entity name="Video Menu" video-menu={{ timeLabelRef, headRef, trackRef, playIndicatorRef, pauseIndicatorRef }}>
      <Label
        name="Time Label"
        text={{ anchorY: "top", anchorX: "right" }}
        ref={timeLabelRef}
        scale={[0.5, 0.5, 0.5]}
        position={[0.5 - 0.02, halfHeight - 0.02, uiZ]}
      />
      <Slider trackRef={trackRef} headRef={headRef} position={[0, -halfHeight + 0.025, uiZ]} />
      <entity
        ref={playIndicatorRef}
        position={[0, 0, uiZ]}
        scale={[0.25, 0.25, 0.25]}
        image={{
          texture: playTexture,
          textureSrc: playImageUrl,
          textureVersion: 1,
          ratio: 1,
          projection: "flat",
          alphaMode: AlphaMode.Blend
        }}
        visible={false}
      />
      <entity
        ref={pauseIndicatorRef}
        position={[0, 0, uiZ]}
        scale={[0.25, 0.25, 0.25]}
        image={{
          texture: pauseTexture,
          textureSrc: pauseImageUrl,
          textureVersion: 1,
          ratio: 1,
          projection: "flat",
          alphaMode: AlphaMode.Blend
        }}
        visible={false}
      />
    </entity>
  );
}
