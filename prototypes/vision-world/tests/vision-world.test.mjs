import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import {
  categories,
  destinations,
  featured,
  getDestination,
  inCategory,
  validCategory,
} from "../src/destinations.js";

const assets = new URL("../public/assets/", import.meta.url);
await MeshoptDecoder.ready;
function glb(name) {
  const bytes = readFileSync(new URL(name + ".glb", assets));
  assert.equal(bytes.toString("ascii", 0, 4), "glTF");
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const jsonSize = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.toString("utf8", 20, 20 + jsonSize));
  const bin=bytes.subarray(28 + jsonSize);
  const decoded=new Map();
  const viewBytes=(id)=>{
    if(decoded.has(id))return decoded.get(id);
    const view=json.bufferViews[id];
    const compression=view.extensions?.EXT_meshopt_compression;
    let result;
    if(compression){
      assert.equal(compression.buffer,0);
      result=Buffer.alloc(view.byteLength);
      const start=compression.byteOffset||0;
      MeshoptDecoder.decodeGltfBuffer(result,compression.count,compression.byteStride,bin.subarray(start,start+compression.byteLength),compression.mode,compression.filter);
    }else{
      assert.equal(view.buffer,0);
      result=bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
    }
    decoded.set(id,result);return result;
  };
  return { json, bin, viewBytes, size: bytes.length };
}

test("all 21 destinations have unique identifiers, valid categories, and usable content", () => {
  assert.equal(destinations.length, 21);
  assert.equal(new Set(destinations.map((d) => d.id)).size, 21);
  for (const d of destinations) {
    assert.ok(categories.some((c) => c.id === d.category));
    assert.ok(d.name && d.description && d.title && d.subtitle && d.icon);
    assert.equal(d.position.length, 3);
    assert.ok(d.position.every(Number.isFinite));
    assert.ok(d.distance > 0);
    assert.equal(getDestination(d.id), d);
  }
  assert.equal(getDestination("missing"), null);
  assert.equal(validCategory("missing"), "all");
});
test("every destination is discoverable through a category", () => {
  assert.deepEqual(
    ["everyday", "transport", "extreme", "space"].map(
      (id) => inCategory(id).length,
    ),
    [6, 5, 7, 3],
  );
  assert.equal(inCategory("all").length, 21);
  assert.deepEqual(
    featured.map((d) => d.id),
    ["school", "oil-rig", "station"],
  );
});
test("the world contains selectable geometry for all 21 destinations, within the size budget", () => {
  const { json, size } = glb("vision-world");
  // Realistic, textured models replace the untextured 3 MB blockout. Keep a
  // measured delivery ceiling; compression halves the raw 22 MB geometry.
  assert.ok(size < 11 * 1024 * 1024);
  assert.ok(json.extensionsRequired.includes('EXT_meshopt_compression'));
  const modeled = new Set(json.nodes.map((n) => n.extras?.destination));
  for (const d of destinations)
    assert.ok(modeled.has(d.id), d.id + " must have real geometry");
  assert.ok(
    json.meshes.length < 200,
    "geometry is batched, not one draw call per object",
  );
});
for (const name of [
  "vision-world",
  ...featured.map((d) => "interior-" + d.id),
]) {
  test(
    name + " has valid triangles, finite positions, and embedded materials",
    () => {
      const { json, viewBytes } = glb(name);
      assert.ok(json.buffers.every(b=>b.uri===undefined), "no external asset fetches");
      assert.ok(json.materials.length > 0);
      const readers = {
        5121: ["readUInt8", 1],
        5123: ["readUInt16LE", 2],
        5125: ["readUInt32LE", 4],
      };
      for (const mesh of json.meshes) {
        for (const primitive of mesh.primitives) {
          const positions = json.accessors[primitive.attributes.POSITION];
          assert.equal(positions.componentType, 5126);
          assert.equal(positions.type, "VEC3");
          const view = json.bufferViews[positions.bufferView];
          const start = positions.byteOffset || 0;
          const bin = viewBytes(positions.bufferView);
          for (let i = 0; i < positions.count; i++)
            for (let axis = 0; axis < 3; axis++) {
              assert.ok(
                Number.isFinite(
                  bin.readFloatLE(
                    start + i * (view.byteStride || 12) + axis * 4,
                  ),
                ),
              );
            }
          const indices = json.accessors[primitive.indices];
          const indexData=viewBytes(indices.bufferView);
          const offset = indices.byteOffset || 0;
          const [read, width] = readers[indices.componentType];
          assert.equal(indices.count % 3, 0);
          for (let i = 0; i < indices.count; i++)
            assert.ok(indexData[read](offset + i * width) < positions.count);
          assert.ok(primitive.attributes.TEXCOORD_0!==undefined,'UVs required for material detail');
        }
      }
    },
  );
}
test("three cutaway assets remain small and the editable Blender source exists", () => {
  for (const item of featured)
    assert.ok(glb("interior-" + item.id).size < 1.6 * 1024 * 1024);
  assert.ok(
    statSync(new URL("../models/gi-vision-world.blend", import.meta.url)).size >
      0,
  );
});
test('world uses photographic surface detail and a masked foliage material',()=>{
  const {json}=glb('vision-world');
  assert.ok(json.images.length>=8);
  assert.ok(json.materials.some(m=>m.name==='leaves'&&m.pbrMetallicRoughness.baseColorTexture));
  assert.ok(json.materials.filter(m=>m.normalTexture).length>=5);
  assert.ok(statSync(new URL('materials/daylight.hdr',assets)).size>100000);
});
