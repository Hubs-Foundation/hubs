import room1Preview from "../../assets/textures/room1_1.png";

var Liquifier = {
  "id": 4508,
  "name": "Fork of Fork of Liquifier",
  "fragment": `
    /**
    * Example Fragment Shader
    * Sets the color and alpha of the pixel by setting gl_FragColor
    */

    // Set the precision for data types used in this shader
    precision highp float;
    precision highp int;

    // Default THREE.js uniforms available to both fragment and vertex shader
    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat4 viewMatrix;
    uniform mat3 normalMatrix;

    // Default uniforms provided by ShaderFrog.
    uniform vec3 cameraPosition;
    uniform float time;

    // A uniform unique to this shader. You can modify it to the using the form
    // below the shader preview. Any uniform you add is automatically given a form
    uniform sampler2D tex;

    // Example varyings passed from the vertex shader
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec2 vUv2;

    void main() {
        float waveAmp = 0.01;
        float wavelength = 0.02;
        vec2 vuv = vec2(vUv.x, 1.0 - vUv.y);
        vec3 color = vec3(texture2D(tex, vuv));
        vec3 outcolor=color;
        vec3 color1 = color;
        float t = time * 0.2;
        float v = t; // + (vuv.x + vuv.y);

        vec2 uv0 = vec2(vUv.x + sin(t*5.0+vuv.y/wavelength)*waveAmp, vuv.y);
        vec3 color0 = vec3(texture2D(tex, uv0));
        vec2 Uv2 = vec2(color0.b+v, color0.g+v)*0.9;
        Uv2 = mod(Uv2, vec2(1.0, 1.0));
        color1 = vec3(texture2D(tex, Uv2));

        // rainbow ParticleSystemShapeType.SingleSidedEdge
        // float v2 = t*200.0 + (vuv.x*128.0 + vuv.y*128.0);
        // v2 = v2-floor(v2/255.0)*255.0;
        // vec3 val = vec3(min(1.0,max(0.0,(abs(v2-128.0)-85.0/2.0)/85.0)),max(0.0,(1.0-abs(v2-85.0)/85.0)),max(0.0,(1.0-abs(v2-170.0)/85.0)));
        // outcolor.r = (val.x*color1.r)+(val.y*color1.g)+(val.z*color1.b);
        // outcolor.g = (val.x*color1.g)+(val.y*color1.b)+(val.z*color1.r);
        // outcolor.b = (val.x*color1.b)+(val.y*color1.r)+(val.z*color1.g);

        float p = 0.5;
        gl_FragColor = vec4( p*color1 + (1.0-p)*color0, 1.0 );
        // gl_FragColor = vec4( color0, 1.0 );
    }
`,
  "vertex": `
    /**
    * Example Vertex Shader
    * Sets the position of the vertex by setting gl_Position
    */

    // Set the precision for data types used in this shader
    precision highp float;
    precision highp int;

    // Default THREE.js uniforms available to both fragment and vertex shader
    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat4 viewMatrix;
    uniform mat3 normalMatrix;

    // Default uniforms provided by ShaderFrog.
    uniform vec3 cameraPosition;
    uniform float time;

    // Default attributes provided by THREE.js. Attributes are only available in the
    // vertex shader. You can pass them to the fragment shader using varyings
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;
    attribute vec2 uv2;

    // Examples of variables passed from vertex to fragment shader
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec2 vUv2;

    void main() {

        // To pass variables to the fragment shader, you assign them here in the
        // main function. Traditionally you name the varying with vAttributeName
        vNormal = normal;
        vUv = uv;
        vUv2 = uv2;
        vPosition = position;

        // This sets the position of the vertex in 3d space. The correct math is
        // provided below to take into account camera and object data.
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`,
  "uniforms": {
    "cameraPosition": {
      "name": "cameraPosition",
      "displayName": null,
      "type": "v3",
      "glslType": "vec3",
      "useGridHelper": false,
      "useRange": false,
      "range": null,
      "isRandom": false,
      "randomRange": null,
      "useToggle": false,
      "toggle": null,
      "description": ""
    },
    "time": {
      "name": "time",
      "displayName": null,
      "type": "f",
      "glslType": "float",
      "useGridHelper": false,
      "useRange": false,
      "range": null,
      "isRandom": false,
      "randomRange": null,
      "useToggle": false,
      "toggle": null,
      "description": ""
    },
    "tex": {
      "name": "tex",
      "displayName": null,
      "type": "t",
      "glslType": "sampler2D",
      "useGridHelper": false,
      "useRange": false,
      "range": null,
      "isRandom": false,
      "randomRange": null,
      "useToggle": false,
      "toggle": null,
      //"value": room1Preview,
      "description": ""
    }
  },
  "url": "http://shaderfrog.com/app/view/4508",
  "user": {
    "username": "swyrl",
    "url": "http://shaderfrog.com/app/profile/andrewray"
  }
}

export { Liquifier }