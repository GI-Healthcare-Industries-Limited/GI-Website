import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, Environment, Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { destinations, getDestination, inCategory } from "./destinations";
import { Icon } from "./Icons";
import { assetPath } from "./site-paths";

const OVERVIEW = [38, 30, 43, 0, 4, 0];
// Bundle the current decoder locally: no CDN or third-party runtime requests.
const configureLoader = (loader) => loader.setMeshoptDecoder(MeshoptDecoder);
const CATEGORY_VIEWS = {
  everyday: [25, 20, 29, -2, 2.8, 0],
  transport: [39, 27, 43, -2, 3, 2],
  extreme: [38, 29, 42, 2, 2.5, 0],
  space: [29, 25, 26, 1, 13, -12],
};

function CameraRig({
  selected,
  category,
  inside,
  reducedMotion,
  control,
  resetKey,
  zoomAction,
  onTravel,
  onArrive,
}) {
  const { size, camera, invalidate } = useThree();
  const generation = useRef(0);
  const moving = useRef(false);
  useEffect(() => {
    const cc = control.current;
    if (!cc) return;
    const token = ++generation.current;
    const small = size.width < 760;
    const item = getDestination(selected);
    let view = OVERVIEW;
    if (inside)
      view = small ? [18, 14, 24, 0, 0.8, 0] : [10, 7.5, 12, 0, 1.05, 0];
    else if (item) {
      const [x, y, z] = item.position;
      const d = item.distance * (small ? 1.5 : 1);
      view = [x + d * 0.7, y + d * 0.65, z + d, x, y - 0.5, z];
    } else if (category !== "all") view = CATEGORY_VIEWS[category];
    else if (small) view = [58, 44, 65, 0, 5, 0];
    // Fit the overview on tall tablet screens as well as wide monitors.
    if (!item && !inside) {
      const aspect = size.width / size.height;
      const fit = small
        ? category === "all"
          ? 1.12
          : Math.max(1.3, 1 / aspect)
        : Math.max(1, 1.12 / aspect);
      view = [
        view[3] + (view[0] - view[3]) * fit,
        view[4] + (view[1] - view[4]) * fit,
        view[5] + (view[2] - view[5]) * fit,
        ...view.slice(3),
      ];
    }
    // Leave space for the native HTML detail sheet without moving the object.
    if (item && !small)
      camera.setViewOffset(
        size.width,
        size.height,
        size.width * 0.17,
        0,
        size.width,
        size.height,
      );
    else if (item && small)
      camera.setViewOffset(
        size.width,
        size.height,
        0,
        size.height * 0.2,
        size.width,
        size.height,
      );
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    cc.smoothTime = reducedMotion ? 0.01 : 1.05;
    moving.current = true;
    if (!reducedMotion && (item || inside)) onTravel(true);
    cc.setLookAt(...view, !reducedMotion).then(() => {
      if (generation.current !== token) return;
      moving.current = false;
      onTravel(false);
      onArrive();
    });
    invalidate();
    return () => {
      generation.current++;
    };
  }, [
    selected,
    category,
    inside,
    resetKey,
    size.width,
    size.height,
    reducedMotion,
    camera,
    invalidate,
    control,
    onTravel,
    onArrive,
  ]);
  useEffect(() => {
    if (zoomAction.serial)
      control.current?.dolly(zoomAction.delta, !reducedMotion);
  }, [zoomAction, reducedMotion, control]);
  return (
    <CameraControls
      ref={control}
      makeDefault
      minDistance={inside ? 6 : 5}
      maxDistance={160}
      minPolarAngle={0.3}
      maxPolarAngle={Math.PI * 0.48}
      dollySpeed={0.5}
      truckSpeed={0.6}
      mouseButtons={{ left: 1, middle: 0, right: 0, wheel: 0 }}
      touches={{ one: 32, two: 512, three: 0 }}
    />
  );
}

function Ocean({ paused, inside = false }) {
  const time = useMemo(() => ({ value: 0 }), []);
  const material = useMemo(
    () => {
      const water = new THREE.MeshPhysicalMaterial({
        color: "#659ca9", roughness: 0.27, metalness: 0.12,
        clearcoat: 1, clearcoatRoughness: 0.18, envMapIntensity: 1.1,
        transparent: true, opacity: 0.91, depthWrite: false,
      });
      // PBR reflections and multi-scale ripples, not painted white dots.
      water.onBeforeCompile = (shader) => {
        shader.uniforms.oceanTime = time;
        shader.vertexShader = `varying vec2 vOcean; uniform float oceanTime;\n` + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
          #include <begin_vertex>
          vOcean = position.xy;
          transformed.z += sin(position.x*.7+oceanTime*.3)*.025 + cos(position.y*.6+oceanTime*.25)*.025;
        `);
        shader.fragmentShader = `varying vec2 vOcean; uniform float oceanTime; uniform mat3 normalMatrix;\n` + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_begin>", `
          #include <normal_fragment_begin>
          vec2 p=vOcean; float t=oceanTime;
          float u=sin(p.x*3.1+p.y*1.2+t*.6)*.045 + sin(p.x*7.3-p.y*4.1+t*.9)*.022 + sin(p.x*19.+p.y*8.-t)*.012;
          float v=cos(p.y*3.6+p.x*.8+t*.45)*.05 + cos(p.y*8.3-p.x*3.2+t*.8)*.025 + cos(p.y*17.-p.x*9.+t)*.012;
          normal=normalize(normal + normalMatrix*vec3(u,v,0.));
        `);
      };
      return water;
    },
    [time],
  );
  const invalidate = useThree((s) => s.invalidate);
  useFrame((_, delta) => {
    if (!paused) {
      time.value += delta;
      invalidate();
    }
  });
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, inside ? -3.55 : -0.08, 0]}
      material={material}
      renderOrder={2}
    >
      <planeGeometry args={[600, 600, 128, 128]} />
    </mesh>
  );
}

function CloudBank({ paused, visible = true }) {
  const ref = useRef();
  const invalidate = useThree((s) => s.invalidate);
  const clouds = useMemo(
    () => [
      [-19, 8, -17, 2.2],
      [16, 10, -21, 2],
      [-20, 4, 6, 1.5],
      [22, 6, 11, 1.7],
      [4, 9, 21, 1.6],
      [-3, 7, -21, 1.4],
    ],
    [],
  );
  useFrame((state) => {
    if (ref.current && !paused && visible) {
      ref.current.position.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.7;
      invalidate();
    }
  });
  return (
    <group ref={ref} visible={visible}>
      {clouds.map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} scale={[s*2.7,s*.55,s*1.5]}>
          <sphereGeometry args={[1, 32, 20]} />
          <shaderMaterial transparent depthWrite={false}
            uniforms={{ tint: {value: new THREE.Color('#f4f8f7')} }}
            vertexShader={`varying vec3 vP; varying vec3 vN; varying vec3 vV;
              void main(){vP=position;vec4 view=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-view.xyz);gl_Position=projectionMatrix*view;}`}
            fragmentShader={`varying vec3 vP; varying vec3 vN; varying vec3 vV; uniform vec3 tint;
              void main(){float edge=pow(max(0.,dot(normalize(vN),normalize(vV))),3.);
              float wisps=.5+.5*sin(vP.x*15.+sin(vP.z*13.)*2.)*cos(vP.y*18.+vP.x*8.);
              gl_FragColor=vec4(tint,edge*mix(.035,.18,wisps));
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
              }`}
          />
        </mesh>
      ))}
    </group>
  );
}

function finishMaterials(object) {
  if (!object.isMesh) return;
  object.castShadow = true;
  object.receiveShadow = true;
  const material = object.material;
  for (const texture of [material.map, material.normalMap]) {
    if (texture) texture.anisotropy = 4;
  }
  // Foliage uses a clipped alpha silhouette, avoiding depth-sorting artefacts.
  if (material.name === 'leaves') {
    material.transparent = false;
    material.alphaTest = 0.45;
    material.depthWrite = true;
    material.side = THREE.DoubleSide;
    material.shadowSide = THREE.DoubleSide;
    object.receiveShadow = false;
    material.emissive.set('#93aa5b');
    material.emissiveMap = material.map;
    material.emissiveIntensity = 0.45;
    material.color.setRGB(1.6, 2.1, 1.1);
  }
  if (material.name === 'grass') material.color.setRGB(1.05, 1.8, 1.05);
}

function Diorama({ selected, category, paused, onSelect, onHover, onReady }) {
  const gltf = useGLTF(assetPath("assets/vision-world.glb"), false, false, configureLoader);
  const scene = useMemo(() => {
    const copy = gltf.scene.clone(true);
    copy.traverse(finishMaterials);
    return copy;
  }, [gltf.scene]);
  const moving = useMemo(
    () =>
      scene.children.filter((o) =>
        ["plane", "station", "container", "navy"].includes(
          o.userData.destination,
        ),
      ),
    [scene],
  );
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    onReady();
  }, [onReady]);
  useFrame((state) => {
    if (paused || selected) return;
    for (const node of moving) {
      const id = node.userData.destination;
      node.position.y =
        Math.sin(state.clock.elapsedTime * 0.4 + (id === "plane" ? 1 : 0)) *
        (id === "plane" ? 0.17 : 0.045);
    }
    invalidate();
  });
  const hits = (e) => getDestination(e.object.userData.destination);
  const pins = selected
    ? []
    : category === "all"
      ? destinations.filter(
          (d) =>
            d.featured ||
            ["hospital", "container", "antarctic", "moon"].includes(d.id),
        )
      : inCategory(category);
  return (
    <>
      <primitive
        object={scene}
        onClick={(e) => {
          const item = hits(e);
          if (item && e.delta < 7) {
            e.stopPropagation();
            onSelect(item.id);
          }
        }}
        onPointerOver={(e) => {
          const item = hits(e);
          if (item) {
            e.stopPropagation();
            onHover(item.name);
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          onHover("");
          document.body.style.cursor = "";
        }}
      />
      {pins.map((item) => (
        <Html
          key={item.id}
          center
          position={[
            item.position[0],
            item.position[1] + 0.85,
            item.position[2],
          ]}
          zIndexRange={[12, 1]}
        >
          <button
            className={`world-pin ${item.featured ? "featured" : ""}`}
            aria-label={`Explore ${item.name}`}
            onClick={() => onSelect(item.id)}
          >
            <span className="pin-symbol">
              <Icon name={item.icon} size={15} />
            </span>
            <span>{item.name}</span>
            <Icon name="arrowUpRight" size={12} />
          </button>
        </Html>
      ))}
    </>
  );
}

function Interior({ id, onReady }) {
  const { scene } = useGLTF(assetPath(`assets/interior-${id}.glb`), false, false, configureLoader);
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse(finishMaterials);
    return copy;
  }, [scene]);
  useEffect(() => {
    onReady();
  }, [id, onReady]);
  return <primitive object={model} />;
}

function Scene({
  selected,
  category,
  inside,
  paused,
  control,
  resetKey,
  zoomAction,
  reducedMotion,
  onTravel,
  onArrive,
  onSelect,
  onHover,
  onReady,
}) {
  const narrow = useThree((state) => state.size.width < 760);
  const isSpace =
    (category === "space" || getDestination(selected)?.category === "space") &&
    inside;
  const background = isSpace ? "#182d42" : "#d5e9ea";
  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 80, 160]} />
      <ambientLight intensity={0.18} />
      <hemisphereLight args={["#dcecf4", "#8b9274", 0.38]} />
      <Suspense fallback={null}>
        <Environment files={assetPath("assets/materials/daylight.hdr")} environmentIntensity={0.7} environmentRotation={[0, 1.1, 0]} />
      </Suspense>
      <directionalLight
        position={[-18, 35, 16]}
        intensity={2.7}
        color="#fff0dc"
        castShadow
        shadow-mapSize={narrow ? [1024, 1024] : [4096, 4096]}
        shadow-radius={2}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0005}
        shadow-normalBias={0.012}
      />
      <CameraRig
        {...{
          selected,
          category,
          inside,
          reducedMotion,
          control,
          resetKey,
          zoomAction,
          onTravel,
          onArrive,
        }}
      />
      <Suspense fallback={null}>
        {inside ? (
          <Interior id={selected} onReady={onReady} />
        ) : (
          <Diorama
            {...{ selected, category, paused, onSelect, onHover, onReady }}
          />
        )}
      </Suspense>
      {!isSpace && <Ocean paused={paused} inside={inside} />}
      {!inside && <CloudBank paused={paused} />}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, inside ? -3.8 : -1.8, 0]}
        receiveShadow
      >
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial
          color={isSpace ? "#182d42" : "#b2d7d9"}
          roughness={1}
        />
      </mesh>
    </>
  );
}

function WebGLFallback({ onFailure }) {
  useEffect(() => {
    onFailure();
  }, [onFailure]);
  return null;
}

export default function World(props) {
  const control = useRef();
  const [supported] = useState(() => {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2");
      if (!context) return false;
      context.getExtension("WEBGL_lose_context")?.loseContext();
      return true;
    } catch {
      return false;
    }
  });
  if (!supported) return <WebGLFallback onFailure={props.onFailure} />;
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.6]}
      shadows="percentage"
      camera={{ position: OVERVIEW.slice(0, 3), fov: 37, near: 0.1, far: 300 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
      }}
      fallback={null}
    >
      <Scene {...props} control={control} />
    </Canvas>
  );
}
