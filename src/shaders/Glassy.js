// ripped from https://www.shadertoy.com/view/4ttGDH
import rocks from "../assets/textures/rocks.png";
import rough from "../assets/textures/rough.png";

var Glassy = {
	uniforms: {
    texture0: { value: THREE.ImageUtils.loadTexture( rocks ) },
    texture1: { value: THREE.ImageUtils.loadTexture( rough ) },
    time: { value: 1.0 },
    resolution: { value: new THREE.Vector2() }
  },

	vertexShader: `
	  varying vec2 fragCoord;
    void main() {
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition; 
      fragCoord = position.xz;
    }
  `,

  fragmentShader: `
    varying vec2 fragCoord;
    uniform vec2 resolution;
    uniform float time;
    uniform sampler2D texture0;
    uniform sampler2D texture1;

    float FAR = 50.0; // Far plane, or maximum distance.

    //float objID = 0.; // Object ID

    float accum; // Used to create the glow, by accumulating values in the raymarching function.

    // 2x2 matrix rotation. Note the absence of "cos." It's there, but in disguise, and comes courtesy
    // of Fabrice Neyret's "ouside the box" thinking. :)
    mat2 rot2( float a ){ vec2 v = sin(vec2(1.570796, 0) - a);  return mat2(v, -v.y, v.x); }

    // Tri-Planar blending function. Based on an old Nvidia writeup:
    // GPU Gems 3 - Ryan Geiss: https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch01.html
    vec3 tpl( sampler2D t, in vec3 p, in vec3 n ){
      n = max(abs(n) - .2, 0.001);
      n /= dot(n, vec3(1));
      vec3 tx = texture2D(t, p.zy).xyz;
      vec3 ty = texture2D(t, p.xz).xyz;
      vec3 tz = texture2D(t, p.xy).xyz;
      
      // Textures are stored in sRGB (I think), so you have to convert them to linear space 
      // (squaring is a rough approximation) prior to working with them... or something like that. :)
      // Once the final color value is gamma corrected, you should see correct looking colors.
      return (tx*tx*n.x + ty*ty*n.y + tz*tz*n.z);
    }


    // Camera path.
    vec3 camPath(float t){
      //return vec3(0, 0, t); // Straight path.
      //return vec3(-sin(t/2.), sin(t/2.)*.5 + 1.57, t); // Windy path.
      
      //float s = sin(t/24.)*cos(t/12.);
      //return vec3(s*12., 0., t);
      
      float a = sin(t * 0.11);
      float b = cos(t * 0.14);
      return vec3(a*4. -b*1.5, b*1.7 + a*1.5, t);
      
    }


    // A fake, noisy looking field - cheaply constructed from a spherized sinusoidal
    // combination. I came up with it when I was bored one day. :) Lousy to hone in
    // on, but it has the benefit of being able to guide a camera through it.
    float map(vec3 p){
      p.xy -= camPath(p.z).xy; // Perturb the object around the camera path.
      
       
      p = cos(p*.315*1.25 + sin(p.zxy*.875*1.25)); // 3D sinusoidal mutation.
      
      
      float n = length(p); // Spherize. The result is some mutated, spherical blob-like shapes.

      // It's an easy field to create, but not so great to hone in one. The "1.4" fudge factor
      // is there to get a little extra distance... Obtained by trial and error.
      return (n - 1.025)*1.33;
      
    }

    /*
    // Alternative, even more abstract, field.
    float map(vec3 p){
      p.xy -= camPath(p.z).xy; // Perturb the object around the camera path.
     
      p = cos(p*.1575 + sin(p.zxy*.4375)); // 3D sinusoidal mutation.
      
      // Spherize. The result is some mutated, spherical blob-like shapes.
      float n = dot(p, p); 
      
      p = sin(p*3.+cos(p.yzx*3.)); // Finer bumps. Subtle.
      
      return (n - p.x*p.y*p.z*.35 - .9)*1.33; // Combine, and we're done.
      
    }
    */


    // I keep a collection of occlusion routines... OK, that sounded really nerdy. :)
    // Anyway, I like this one. I'm assuming it's based on IQ's original.
    float cao(in vec3 p, in vec3 n)
    {
      float sca = 1., occ = 0.;
      for(float i=0.; i<5.; i++){
      
        float hr = .01 + i*.35/4.;        
        float dd = map(n * hr + p);
        occ += (hr - dd)*sca;
        sca *= 0.7;
      }
      return clamp(1.0 - occ, 0., 1.);    
    }


    // Standard normal function. It's not as fast as the tetrahedral calculation, but more symmetrical.
    vec3 nr(vec3 p){
      const vec2 e = vec2(0.002, 0);
      return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), 
                              map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
    }



    // Basic raymarcher.
    float trace(in vec3 ro, in vec3 rd){
      accum = 0.;
      float t = 0.0, h;
      for(int i = 0; i < 128; i++){
      
        h = map(ro+rd*t);
        // Note the "t*b + a" addition. Basically, we're putting less emphasis on accuracy, as
        // "t" increases. It's a cheap trick that works in most situations... Not all, though.
        if(abs(h)<0.001*(t*.25 + 1.) || t>FAR) break; // Alternative: 0.001*max(t*.25, 1.)
        t += h;
        
        // Simple distance-based accumulation to produce some glow.
        if(abs(h)<.35) accum += (.35-abs(h))/24.;
        
      }

      return min(t, FAR);
    }


    // Shadows.
    float sha(in vec3 ro, in vec3 rd, in float start, in float end, in float k){
      float shade = 1.0;
      const int maxIterationsShad = 24; 

      float dist = start;
      float stepDist = end/float(maxIterationsShad);

      for (int i=0; i<maxIterationsShad; i++){
        float h = map(ro + rd*dist);
        //shade = min(shade, k*h/dist);
        shade = min(shade, smoothstep(0.0, 1.0, k*h/dist));

        dist += clamp(h, 0.01, 0.2);
        
        // There's some accuracy loss involved, but early exits from accumulative distance function can help.
        if (abs(h)<0.001 || dist > end) break; 
      }
      
      return min(max(shade, 0.) + 0.4, 1.0); 
    }


    // Texture bump mapping. Four tri-planar lookups, or 12 texture lookups in total.
    vec3 db( sampler2D tx, in vec3 p, in vec3 n, float bf){ 
      const vec2 e = vec2(0.001, 0);
      
      // Three gradient vectors rolled into a matrix, constructed with offset greyscale texture values.    
      mat3 m = mat3( tpl(tx, p - e.xyy, n), tpl(tx, p - e.yxy, n), tpl(tx, p - e.yyx, n));
      
      vec3 g = vec3(0.299, 0.587, 0.114)*m; // Converting to greyscale.
      g = (g - dot(tpl(tx,  p , n), vec3(0.299, 0.587, 0.114)) )/e.x; g -= n*dot(n, g);
                        
      return normalize( n + g*bf ); // Bumped normal. "bf" - bump factor.
    
    }

    // Compact, self-contained version of IQ's 3D value noise function. I have a transparent noise
    // example that explains it, if you require it.
    float n3D(vec3 p){
        
      const vec3 s = vec3(7, 157, 113);
      vec3 ip = floor(p); p -= ip; 
      vec4 h = vec4(0., s.yz, s.y + s.z) + dot(ip, s);
      p = p*p*(3. - 2.*p); //p *= p*p*(p*(p * 6. - 15.) + 10.);
      h = mix(fract(sin(h)*43758.5453), fract(sin(h + s.x)*43758.5453), p.x);
      h.xy = mix(h.xz, h.yw, p.y);
      return mix(h.x, h.y, p.z); // Range: [0, 1].
    }



    // Simple environment mapping.
    vec3 envMap(vec3 rd, vec3 n){        
      vec3 col = tpl(texture1, rd*4., n);
      return smoothstep(0., 1., col);
    }


    void main(){
      // Screen coordinates.
      vec2 u = fragCoord; // (fragCoord - resolution.xy*.5)/resolution.y;
      
      float time2 = time*0.001;

      // Camera Setup.
      float speed = 4.;
      vec3 o = camPath(time2*speed); // Camera position, doubling as the ray origin.
      vec3 lk = camPath(time2*speed + .25);  // "Look At" position.
      vec3 l = camPath(time2*speed + 2.) + vec3(0, 1, 0); // Light position, somewhere near the moving camera.


      // Using the above to produce the unit ray-direction vector.
      float FOV = 3.14159/2.; ///3. FOV - Field of view.
      vec3 fwd = normalize(lk-o);
      vec3 rgt = normalize(vec3(fwd.z, 0, -fwd.x )); 
      vec3 up = cross(fwd, rgt);

      // Unit direction ray.
      //vec3 r = normalize(fwd + FOV*(u.x*rgt + u.y*up));
      // Lens distortion.
      vec3 r = fwd + FOV*(u.x*rgt + u.y*up);
      r = normalize(vec3(r.xy, (r.z - length(r.xy)*.125)));


      // Raymarch.
      float t = trace(o, r);
      
      // Save the object ID directly after the raymarching equation, since other equations that
      // use the "map" function will distort the results. I leaned that the hard way. :)
      //float sObjID = objID;

      // Initialize the scene color to the background.
      vec3 col = vec3(0);
      
      // If the surface is hit, light it up.
      if(t<FAR){
      
        // Position.
        vec3 p = o + r*t;
    
        // Normal.
        vec3 n = nr(p);
        
        // Sometimes, it's handy to keep a copy of the normal. In this case, I'd prefer the
        // bumps on the surface to not have as much influence on the reflrection and 
        // refraction vectors, so I tone down the bumped normal with this. See the reflection
        // and refraction lines.
        vec3 svn = n;
        
        // Texture bump the normal.
        float sz = 1./3.; 
        n = db(texture0, p*sz, n, .1/(1. + t*.25/FAR));

        l -= p; // Light to surface vector. Ie: Light direction vector.
        float d = max(length(l), 0.001); // Light to surface distance.
        l /= d; // Normalizing the light direction vector.

        
        float at = 1./(1. + d*.05 + d*d*.0125); // Light attenuation.
        
        // Ambient occlusion and shadowing.
        float ao =  cao(p, n);
        float sh = sha(p, l, 0.04, d, 16.);
        
        // Diffuse, specular, fresnel. Only the latter is being used here.
        float di = max(dot(l, n), 0.);
        float sp = pow(max( dot( reflect(r, n), l ), 0.), 64.); // Specular term.
        float fr = clamp(1.0 + dot(r, n), .0, 1.); // Fresnel reflection term.
 
         
        
        // Texturing - or coloring - the surface. The "color"' of glass is provide by the surrounds...
        // of it's contents, so just make it dark.
        vec3 tx = vec3(.05); // tpl(texture0, p*sz, n);
           

        // Very simple coloring.
        col = tx*(di*.1 + ao*.25) + vec3(.5, .7, 1)*sp*2. + vec3(1, .7, .4)*pow(fr, 8.)*.25;
 
        // Very cheap, and totally fake, reflection and refraction. Obtain the reflection and
        // refraction vectors at the surface, then pass them to the environment mapping function.
        // Note that glass and fluid have different refractive indices, so I've fudged them into 
        // one figure.
        vec3 refl = envMap(normalize(reflect(r, svn*.5 + n*.5)), svn*.5 + n*.5);
        vec3 refr = envMap(normalize(refract(r, svn*.5 + n*.5, 1./1.35)), svn*.5 + n*.5);
        
        /*
        // You can also index into a 3D texture, but I prefer the above.
        vec3 refl = texture2D(texture2, normalize(reflect(r, svn*.5 + n*.5))).xyz;
        vec3 refr = texture2D(texture2, normalize(refract(r, svn*.5 + n*.5, 1./1.31))).xyz;
        refl *= refl*.5;
        refr *= refr*.5;
        */
        
        // More fake physics that looks like real physics. :) Mixing the reflection and refraction 
        // colors according to a Fresnel variation.
        vec3 refCol = mix(refr, refl, pow(fr, 5.)); //(refr + refl)*.5; // Adding them, if preferred.
        
        // Obviously, the reflected + refracted colors will involve lit values from their respective
        // hit points, but this is fake, so we're just combining it with a portion of the surface 
        // diffuse value.
        col += refCol*((di*di*.25+.75) + ao*.25)*1.5; // Add the reflected color. You could combine it in other ways too.
        
        // Based on IQ's suggestion: Using the diffuse setting to vary the color slightly in the
        // hope that it adds a little more depth. It also gives the impression that Beer's Law is 
        // taking effect, even though it clearly isn't. I might try to vary with curvature - or some other
        // depth guage - later to see if it makes a difference.
        col = mix(col.xzy, col, di*.85 + .15); 
        
        // Glow.
        // Taking the accumulated color (see the raymarching function), tweaking it to look a little
        // hotter, then combining it with the object color.
        vec3 accCol = vec3(1, .3, .1)*accum;
        vec3 gc = pow(min(vec3(1.5, 1, 1)*accum, 1.), vec3(1, 2.5, 12.))*.5 + accCol*.5;
        col += col*gc*12.;
        
        
        // Purple electric charge.
        float hi = abs(mod(t/1. + time2/3., 8.) - 8./2.)*2.;
        vec3 cCol = vec3(.01, .05, 1)*col*1./(.001 + hi*hi*.2);
        col += mix(cCol.yxz, cCol, n3D(p*3.));
        // Similar effect.
        //vec3 cCol = vec3(.01, .05, 1)*col*abs(tan(t/1.5 + time2/3.));
        //col += cCol;
 
        
        // Apply some shading.
        col *= ao*sh*at;            
      }
           
      // Blend in a bit of light fog for atmospheric effect.
      vec3 fog = vec3(.125, .04, .05)*(r.y*.5 + .5);    
      col = mix(col, fog, smoothstep(0., .95, t/FAR)); // exp(-.002*t*t), etc. fog.zxy

      // Subtle vignette.
      u = fragCoord/resolution.xy;
      col = mix(vec3(0), col, pow( 16.0*u.x*u.y*(1.0-u.x)*(1.0-u.y) , .125)*.5 + .5);
      
      // Rough gamma correction, and we're done.
      gl_FragColor = vec4(sqrt(clamp(col, 0., 1.)), 1);
    }
  `
};

export { Glassy }