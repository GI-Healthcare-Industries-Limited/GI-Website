import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CLOUDS, advanceCloudTime, cloudOffset } from './cloud-motion';

const ignoreRaycast = () => null;
const vertexShader = `
  varying vec2 vUv;
  varying float vDistance;
  void main() {
    vUv = uv;
    vec4 center = modelViewMatrix * vec4(0., 0., 0., 1.);
    vDistance = length(center.xyz);
    // Camera-facing wisps retain their soft silhouette when the world rotates.
    center.xy += position.xy * vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
    gl_Position = projectionMatrix * center;
  }
`;
const fragmentShader = `
  uniform vec3 tint;
  uniform float time;
  uniform float softness;
  varying vec2 vUv;
  varying float vDistance;
  float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p) {
    vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }
  float lobe(vec2 p, vec2 center, vec2 radius) {
    vec2 q=(p-center)/radius; return exp(-dot(q,q)*2.8);
  }
  void main() {
    vec2 p=vUv;
    float n=noise(p*7.+vec2(time*.006,0.))*.65+noise(p*17.)*.25+noise(p*35.)*.1;
    float shape=lobe(p,vec2(.28,.43),vec2(.26,.27))
      +lobe(p,vec2(.49,.56),vec2(.29,.36))
      +lobe(p,vec2(.72,.44),vec2(.27,.25));
    float edge=smoothstep(0.,.15,p.x)*smoothstep(0.,.15,1.-p.x)
      *smoothstep(0.,.18,p.y)*smoothstep(0.,.18,1.-p.y);
    float alpha=min(shape,1.)*mix(.45,1.,n)*edge*.34*softness;
    // Never fill the view with a cloud when zooming close to a destination.
    alpha*=smoothstep(8.,22.,vDistance);
    gl_FragColor=vec4(tint,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function CloudBank({ paused, selected }) {
  const group = useRef();
  const elapsed = useRef(0);
  const narrow = useThree(s => s.size.width < 760);
  const invalidate = useThree(s => s.invalidate);
  const uniforms = useMemo(() => ({
    tint: { value: new THREE.Color('#e2e7e5') },
    time: { value: 0 },
    softness: { value: 1 },
  }), []);
  useFrame((_, delta) => {
    elapsed.current = advanceCloudTime(elapsed.current, delta, paused);
    uniforms.time.value = elapsed.current;
    uniforms.softness.value = selected ? 0.35 : 1;
    group.current?.children.forEach((mesh, i) => {
      const [x,y,z,,,phase] = CLOUDS[i];
      const offset = cloudOffset(elapsed.current, phase);
      mesh.position.set(x+offset[0],y+offset[1],z+offset[2]);
    });
    if (!paused) invalidate();
  });
  return <group ref={group}>
    {CLOUDS.slice(0, narrow ? 4 : 6).map(([x,y,z,w,h], i) =>
      <mesh key={i} position={[x,y,z]} scale={[w,h,1]} raycast={ignoreRaycast} frustumCulled={false} renderOrder={3}>
        <planeGeometry args={[1,1]} />
        <shaderMaterial transparent depthWrite={false} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
      </mesh>)}
  </group>;
}
