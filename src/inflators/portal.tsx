import { HubsWorld } from "../app";
import { addComponent } from "bitecs";
import { Portal } from "../bit-components";
import { addObject3DComponent, renderAsEntity } from "../utils/jsx-entity";
import { Button3D, BUTTON_TYPES } from "../prefabs/button3D";
import { degToRad } from "three/src/math/MathUtils";
import { createPlaneBufferGeometry } from "../utils/three-utils";

export interface PortalParams {
    uuid: String,
    bounds: Object,
    offset: Object,
    wasInside: Boolean,
    isInside: Boolean,
    name: String,
    target: String,
    local: Boolean,
    image?: THREE.Texture
}

const DEFAULTS = {
    uuid: "",
    name: "Unnamed portal",
    bounds: { x: 1, y: 1, z: 2},
    offset: { x: 0, y: 0.5, z: 0},
    isInside: false,
    target: "",
    local: false
};

const vertexShader = `
varying vec2 vUv;
void main()
{
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vUv = uv;
    vUv.x = 1.0 - vUv.x;
}
`;

const fragmentShader = `
varying vec2 vUv;

uniform sampler2D iChannel0;
uniform vec3 iResolution;
uniform vec3 iPortalColor;
uniform float iTime;
 
#include <common>

vec3 greyscale(vec3 color, float str) {
    float g = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(color, vec3(g), str);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float t = iTime;
    // Normalized pixel coordinates (from -1 to 1)
    vec2 uvOrig = fragCoord/iResolution.xy;
    vec2 uv = 2.0*(fragCoord-.5*iResolution.xy)/iResolution.xy;
    uv.y *= 0.6;

    // polar
    float d = length(uv); 
    //float alpha = atan(uv.y, uv.x) / (2.*PI) + 0.5; // normalize -pi,pi to 0, 1 for display
    float alpha = atan(uv.y, uv.x); //-pi to pi
    vec2 pc = vec2(d, alpha); // polar coords
    
    //fancy calc or irregular shape
    float sinVal = sin(0.5+pc.y*3.+t*2.)*sin(pc.y*8.+t*2.)*0.02;
    float thk = 0.04;
    float res;
    float r = 0.5;
    float targetVal = r + sinVal;
    
    res = 1. - smoothstep(targetVal-thk, targetVal+thk, d);
    
    vec3 col;
    
    vec3 portalColor = texture(iChannel0,uvOrig).xyz;//vec3(1.0,1.0,1.0);
    //portalColor = greyscale(portalColor, 1.0);
    vec3 bgColor = vec3(0);
    
    col = mix(bgColor, portalColor, res);
    vec3 edgeColor = iPortalColor;  // add edge tint
    float edgeDist = smoothstep(targetVal-thk,targetVal+thk, d);
    if(d < targetVal+thk){
        col += edgeColor*edgeDist; // could be smoother
    }
    if (res < 0.01) discard;
    // Output to screen
    fragColor = vec4(col, 1.0);
}
 
void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
}
`;

export function inflatePortal(world: HubsWorld, eid: number, params: PortalParams) {
    const portalPros = Object.assign({}, DEFAULTS, params);

    addComponent(world, Portal, eid);

    const { uuid, bounds, offset, name, target, local, image } = portalPros;
    Portal.uuid[eid] = APP.getSid(uuid);
    Portal.bounds[eid].set([bounds.x, bounds.y, bounds.z]);
    Portal.offset[eid].set([offset.x, offset.y, offset.z]);
    Portal.name[eid] = APP.getSid(name);
    Portal.target[eid] = APP.getSid(target);
    Portal.local[eid] = local ? 1 : 0;

    var plane = new THREE.Mesh(
        createPlaneBufferGeometry(2, 2, 2, 2, image ? image.flipY : true), 
        new THREE.ShaderMaterial({
            uniforms: { 
                iChannel0: { value: image },
                iTime: { value: 0.0 },
                iResolution: { value: new THREE.Vector3()},
                iPortalColor: { value: local ? new THREE.Vector3(0, 0.2, 1) : new THREE.Vector3(1, 0.2, 0) }
            },
            vertexShader,
            fragmentShader,
            side: THREE.DoubleSide,
            transparent: true
        }));

    addObject3DComponent(world, eid, plane);

    const nameTagEid = renderAsEntity(world, Button3D({
        text: name,
        position: [0, 1.1, -0.01],
        width: name.length / 14,
        height: 0.3,
        type: BUTTON_TYPES.ACTION
    }));
    const nameTagObj = world.eid2obj.get(nameTagEid)!;
    nameTagObj.rotation.y = degToRad(180);
    const rootObj = world.eid2obj.get(eid)!;
    rootObj.add(nameTagObj);
}
