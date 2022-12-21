import { HubsWorld } from "../app";
import { addComponent } from "bitecs";
import { Portal } from "../bit-components";
import { addObject3DComponent, renderAsEntity } from "../utils/jsx-entity";
import { Button3D, BUTTON_TYPES } from "../prefabs/button3D";
import { degToRad } from "three/src/math/MathUtils";

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
uniform sampler2D iChannel1;
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

    // Warp the render target texture
    //uvOrig.x += sin(uvOrig.y*20.0+iTime)/100.0;
    //uvOrig.y += cos(uvOrig.x*1.0+iTime)/100.0;
    

    // polar
    float d = length(uv); 
    //float alpha = atan(uv.y, uv.x) / (2.*PI) + 0.5; // normalize -pi,pi to 0, 1 for display
    float alpha = atan(uv.y, uv.x); //-pi to pi
    vec2 pc = vec2(d, alpha); // polar coords
    
    //fancy calc or irregular shape
    float sinVal = sin(0.5+pc.y*3.+t*5.)*sin(pc.y*18.+t*2.)*0.02;
    float thk = 0.08;
    float res;
    float r = 0.5;
    float targetVal = r + sinVal;
    
    res = 1. - smoothstep(targetVal-thk, targetVal+thk, d);
    
    vec3 col;
    
    vec3 portalColor = texture(iChannel1,uvOrig).xyz;//vec3(1.0,1.0,1.0);
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

void mainImage2( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

    vec4 col = texture(iChannel1,uv);
    vec4 color1 = vec4(0.251,0.921,0.930,1.000);
    vec4 color2 = vec4(0.214,0.708,0.900,1.000);
	vec4 colorp = mix(color2,color1,uv.y + 0.5 *sin(iTime));
	
	vec4 BG_color = vec4(0);
	
	//position portal vec2(0.5) is middel of the screen
	vec2 posPortal = vec2(0.5) * iResolution.xy;
	vec2 position = (fragCoord.xy-posPortal.xy)/ iResolution.y;
	//altering y position to make the circle oval form
	position.y *= 0.55;
	//making the inner circle and outer circle
	float win = smoothstep(0.0, 0.03, 0.27-distance(position , vec2(0.0))); 
	float wex = smoothstep(0.0, 0.05, 0.25-distance(position , vec2(0.0))); 
	//combining the background color with the blue color 
	vec4 portalcolor = mix(BG_color, colorp, win);
	//projecting the import image in the inside of the portal
    if (wex < 0.01) discard;
	fragColor= mix(portalcolor,col, wex);
}
 
void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
//   vec4 texColor = texture2D(iChannel0, vUv);
//   gl_FragColor = texColor;
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
    if (image) image.flipY = true;

    const mat = new THREE.ShaderMaterial();
    var plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(2, 2), 
        new THREE.ShaderMaterial({
            uniforms: { 
                iChannel0: { value: null },
                iChannel1: { value: image },
                iTime: { value: 0.0 },
                iResolution: { value: new THREE.Vector3()},
                iPortalColor: { value: local ? new THREE.Vector3(0, 0.2, 1) : new THREE.Vector3(1, 0.2, 0) }
            },
            vertexShader,
            fragmentShader,
            side: THREE.DoubleSide,
        }));

    addObject3DComponent(world, eid, plane);

    const nameTagEid = renderAsEntity(world, Button3D({
        text: name,
        position: [0, 1.1, -0.01],
        width: 0.4,
        height: 0.3,
        type: BUTTON_TYPES.ACTION
    }));
    const nameTagObj = world.eid2obj.get(nameTagEid)!;
    nameTagObj.rotation.y = degToRad(180);
    const rootObj = world.eid2obj.get(eid)!;
    rootObj.add(nameTagObj);
}
