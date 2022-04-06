import * as THREE from './three/build/three.module.js'
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js'

import Stats  from './three/examples/jsm/libs/stats.module.js'

let mat

const cursor = {
    x: 0,
    y: 0
}

const param = {
    width: window.innerWidth,
    height: window.innerHeight,
}

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()


window.addEventListener('mousemove', (event) =>
{   
    cursor.x = ( event.clientX - param.width / 2 ) * 0.0004
    cursor.y = ( event.clientY - param.height / 2 ) * 0.0004
})

const camera = new THREE.PerspectiveCamera(45, param.width / param.height, 1 , 100)

camera.position.z = 3

scene.add(camera)
scene.background = new THREE.Color(0xffffff)

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    //alpha: true,
})

renderer.setSize(param.width, param.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.logarithmicDepthBuffer = true


/**
 * Orbit
 */
const control = new OrbitControls(camera, renderer.domElement)


/**
 * Event Lisitener
 */

 window.addEventListener('resize', () =>
 {
     // Update sizes
     param.width = window.innerWidth
     param.height = window.innerHeight
 
     // Update camera
     camera.aspect = param.width / param.height
     camera.updateProjectionMatrix()
 
     // Update renderer
     renderer.setSize(param.width, param.height)
     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
 })

 const textureLoader = new THREE.TextureLoader()
 textureLoader.load('./img/noise2.png', texture => {
    const geo = new THREE.SphereBufferGeometry(1,30,30)
     mat = new THREE.ShaderMaterial({
       vertexShader: `
           varying vec2 vUv;
           varying vec3 vPosition;
           varying vec3 vLayer0;
           varying vec3 vLayer1;
           varying vec3 vLayer2;
           uniform float time;

           mat2 rotate(float a) {
               float s = sin(a);
               float c = cos(a);
               return mat2(c, -s,s,c);
           }
           void main()
           {    
               float t = time * 0.5;
                
                mat2 rot = rotate(t);

                vec3 p0 = position;
                p0.yz = rot*p0.yz;
                vLayer0 = p0;

                vec3 p1 = position;
                p1.xz = rot*p1.xz;
                vLayer1 = p1;

                vec3 p2 = position;
                p2.xy = rot*p2.xy;
                vLayer2 = p2;

               vPosition = position;
               gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
               vUv = uv;
           }
       `,
       fragmentShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vLayer0;
            varying vec3 vLayer1;
            varying vec3 vLayer2;
            uniform sampler2D texture1;
            uniform float time;
            uniform float progress;
            uniform vec4 resolution;
            float PI = 3.1415926535897932384626433832795;

            //
            // Description : Array and textureless GLSL 2D/3D/4D simplex
            //               noise functions.
            //      Author : Ian McEwan, Ashima Arts.
            //  Maintainer : ijm
            //     Lastmod : 20110822 (ijm)
            //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
            //               Distributed under the MIT License. See LICENSE file.
            //               https://github.com/ashima/webgl-noise
            //

            vec4 mod289(vec4 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
            }

            float mod289(float x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
            }

            vec4 permute(vec4 x) {
            return mod289(((x*34.0)+1.0)*x);
            }

            float permute(float x) {
            return mod289(((x*34.0)+1.0)*x);
            }

            vec4 taylorInvSqrt(vec4 r)
            {
            return 1.79284291400159 - 0.85373472095314 * r;
            }

            float taylorInvSqrt(float r)
            {
            return 1.79284291400159 - 0.85373472095314 * r;
            }

            vec4 grad4(float j, vec4 ip)
            {
            const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
            vec4 p,s;

            p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
            p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
            s = vec4(lessThan(p, vec4(0.0)));
            p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;

            return p;
            }

            // (sqrt(5) - 1)/4 = F4, used once below
            #define F4 0.309016994374947451

            float snoise(vec4 v)
            {
            const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4
            0.276393202250021,  // 2 * G4
            0.414589803375032,  // 3 * G4
            -0.447213595499958); // -1 + 4 * G4

            // First corner
            vec4 i  = floor(v + dot(v, vec4(F4)) );
            vec4 x0 = v -   i + dot(i, C.xxxx);

            // Other corners

            // Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
            vec4 i0;
            vec3 isX = step( x0.yzw, x0.xxx );
            vec3 isYZ = step( x0.zww, x0.yyz );
            //  i0.x = dot( isX, vec3( 1.0 ) );
            i0.x = isX.x + isX.y + isX.z;
            i0.yzw = 1.0 - isX;
            //  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
            i0.y += isYZ.x + isYZ.y;
            i0.zw += 1.0 - isYZ.xy;
            i0.z += isYZ.z;
            i0.w += 1.0 - isYZ.z;

            // i0 now contains the unique values 0,1,2,3 in each channel
            vec4 i3 = clamp( i0, 0.0, 1.0 );
            vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
            vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

            //  x0 = x0 - 0.0 + 0.0 * C.xxxx
            //  x1 = x0 - i1  + 1.0 * C.xxxx
            //  x2 = x0 - i2  + 2.0 * C.xxxx
            //  x3 = x0 - i3  + 3.0 * C.xxxx
            //  x4 = x0 - 1.0 + 4.0 * C.xxxx
            vec4 x1 = x0 - i1 + C.xxxx;
            vec4 x2 = x0 - i2 + C.yyyy;
            vec4 x3 = x0 - i3 + C.zzzz;
            vec4 x4 = x0 + C.wwww;

            // Permutations
            i = mod289(i);
            float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
            vec4 j1 = permute( permute( permute( permute (
            i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
            + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
            + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
            + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));

            // Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope
            // 7*7*6 = 294, which is close to the ring size 17*17 = 289.
            vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

            vec4 p0 = grad4(j0,   ip);
            vec4 p1 = grad4(j1.x, ip);
            vec4 p2 = grad4(j1.y, ip);
            vec4 p3 = grad4(j1.z, ip);
            vec4 p4 = grad4(j1.w, ip);

            // Normalise gradients
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;
            p4 *= taylorInvSqrt(dot(p4,p4));

            // Mix contributions from the five corners
            vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
            vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
            m0 = m0 * m0;
            m1 = m1 * m1;
            return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
            + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;

            }

            float fbm(vec4 p){
                float sum=0.;
                float amp=1.;
                float scale=1.;
                for(int i=0; i<6; i++) {
                    sum += snoise(p*scale)*amp;
                    p.w += 100.;
                    amp *=0.9;
                    scale *=2.;
                }
                return sum;
            }
            
            vec3 brightnessToColor(float b) {
                b *=0.25;
                return (vec3(b,b*b,b*b*b*b)/0.25) * 0.6;
            }
            
            //float supersun(vec3 n) {

            //}
        
            void main(){
               vec4 p = vec4(vPosition * 3.,time * 0.037);
               float noisly = fbm(p);
               vec4 p1 = vec4(vPosition * 2.,time * 0.037);
               float spots = max(snoise(p1), 0.);
               gl_FragColor = vec4(noisly);
               gl_FragColor *= mix(1., spots, 0.7);

               //gl_FragColor = vec4(vLayer2, 1.);
             
        }


       
            
       `,
       uniforms:
       {
           time: { value: 0 },
           uTexture: { value: texture }
       }
   })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.x = Math.PI * 2
    scene.add(mesh)

 })




const clock = new THREE.Clock()

let stats = new Stats();
document.body.appendChild( stats.dom );


const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    if(mat!=undefined){
        mat.uniforms.time.value = elapsedTime
    }
    

    stats.update()
    control.update()
    camera.updateProjectionMatrix()
    renderer.render(scene, camera)
    requestAnimationFrame(tick)
}
tick()










