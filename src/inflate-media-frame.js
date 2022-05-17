import { addObject3DComponent, Rigidbody, PhysicsShape } from "./utils/jsx-entity";
import { NetworkedMediaFrame, MediaFrame } from "./bit-components";
import { addComponent } from "bitecs";
import { ACTIVATION_STATE, FIT, SHAPE } from "three-ammo/constants";
import { MediaType } from "./utils/media-utils";

export function inflateMediaFrame(world, eid, componentProps) {
  const guide = new THREE.Mesh(
    new THREE.BoxGeometry(componentProps.bounds.x, componentProps.bounds.y, componentProps.bounds.z),
    new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x2f80ed) }
      },
      vertexShader: `
            varying vec2 vUv;
            void main()
            {
              gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
              vUv = uv;
            }
          `,
      fragmentShader: `
            // adapted from https://www.shadertoy.com/view/Mlt3z8
            float bayerDither2x2( vec2 v ) {
              return mod( 3.0 * v.y + 2.0 * v.x, 4.0 );
            }
            float bayerDither4x4( vec2 v ) {
              vec2 P1 = mod( v, 2.0 );
              vec2 P2 = mod( floor( 0.5  * v ), 2.0 );
              return 4.0 * bayerDither2x2( P1 ) + bayerDither2x2( P2 );
            }

            varying vec2 vUv;
            uniform vec3 color;
            void main() {
              float alpha = max(step(0.45, abs(vUv.x - 0.5)), step(0.45, abs(vUv.y - 0.5))) - 0.5;
              if( ( bayerDither4x4( floor( mod( gl_FragCoord.xy, 4.0 ) ) ) ) / 16.0 >= alpha ) discard;
              gl_FragColor = vec4(color, 1.0);
            }
          `,
      side: THREE.DoubleSide
    })
  );
  // TODO: This is a hack around the physics system addBody call requiring its body to have parent
  guide.parent = new THREE.Group();
  addObject3DComponent(world, eid, guide);
  addComponent(world, MediaFrame, eid, true);
  addComponent(world, NetworkedMediaFrame, eid, true);

  MediaFrame.mediaType[eid] = {
    all: MediaType.ALL,
    "all-2d": MediaType.ALL_2D,
    model: MediaType.MODEL,
    image: MediaType.IMAGE,
    video: MediaType.VIDEO,
    pdf: MediaType.PDF
  }[componentProps.mediaType];
  MediaFrame.bounds[eid].set([componentProps.bounds.x, componentProps.bounds.y, componentProps.bounds.z]);

  addComponent(world, Rigidbody, eid);
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;

  addComponent(world, PhysicsShape, eid);
  PhysicsShape.halfExtents[eid].set([
    componentProps.bounds.x / 2,
    componentProps.bounds.y / 2,
    componentProps.bounds.z / 2
  ]);
}
