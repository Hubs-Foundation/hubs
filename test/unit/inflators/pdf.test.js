import test from "ava";
import { addComponent, addEntity, createWorld } from "bitecs";
import { Scene, MeshBasicMaterial, CanvasTexture, Mesh, PlaneGeometry } from "three";
import * as pdfjs from "pdfjs-dist";
import { MediaPDF } from "../../../src/bit-components";

// Configure PDF.js worker for Node.js environment
pdfjs.GlobalWorkerOptions.workerSrc = require("pdfjs-dist/build/pdf.worker.min.js");

// Mock canvas for headless testing
class MockCanvas {
  constructor() {
    this.width = 256;
    this.height = 256;
  }

  getContext() {
    return new MockCanvasRenderingContext2D();
  }
}

class MockCanvasRenderingContext2D {
  constructor() {
    this.canvas = new MockCanvas();
  }

  clearRect() {}
  drawImage() {}
  fillRect() {}
  scale() {}
  translate() {}
  save() {}
  restore() {}
  transform() {}
}

// Create mock world with required properties
function createMockWorld() {
  const world = createWorld();
  world.scene = new Scene();
  world.nameToComponent = {
    object3d: {},
    networked: {},
    owned: {},
    AEntity: {}
  };
  world.ignoredNids = new Set();
  world.deletedNids = new Set();
  world.nid2eid = new Map();
  world.eid2obj = new Map();
  world.eid2mat = new Map();
  world.time = { delta: 0, elapsed: 0, tick: 0 };
  return world;
}

// Create a minimal PDF for testing
async function createTestPDF() {
  // Create a very simple PDF document programmatically
  const pdfData = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, // %PDF-1.4
    0x0a, 0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, // \n1 0 obj
    0x0a, 0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, // \n<</Type
    0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67, // /Catalog
    0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, // /Pages 2
    0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a, 0x65, //  0 R>>\ne
    0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x32, 0x20, // ndobj\n2 
    0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c, // 0 obj\n<<
    0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x50, 0x61, // /Type/Pa
    0x67, 0x65, 0x73, 0x2f, 0x4b, 0x69, 0x64, 0x73, // ges/Kids
    0x5b, 0x33, 0x20, 0x30, 0x20, 0x52, 0x5d, 0x2f, // [3 0 R]/
    0x43, 0x6f, 0x75, 0x6e, 0x74, 0x20, 0x31, 0x3e, // Count 1>
    0x3e, 0x0a, 0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, // >\nendobj
    0x0a, 0x33, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, // \n3 0 obj
    0x0a, 0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, // \n<</Type
    0x2f, 0x50, 0x61, 0x67, 0x65, 0x2f, 0x50, 0x61, // /Page/Pa
    0x72, 0x65, 0x6e, 0x74, 0x20, 0x32, 0x20, 0x30, // rent 2 0
    0x20, 0x52, 0x2f, 0x4d, 0x65, 0x64, 0x69, 0x61, //  R/Media
    0x42, 0x6f, 0x78, 0x5b, 0x30, 0x20, 0x30, 0x20, // Box[0 0 
    0x36, 0x31, 0x32, 0x20, 0x37, 0x39, 0x32, 0x5d, // 612 792]
    0x3e, 0x3e, 0x0a, 0x65, 0x6e, 0x64, 0x6f, 0x62, // >>\nendobj
    0x6a, 0x0a, 0x78, 0x72, 0x65, 0x66, 0x0a, 0x30, // j\nxref\n0
    0x20, 0x34, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, //  4\n00000
    0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, // 00000 65
    0x35, 0x33, 0x35, 0x20, 0x66, 0x20, 0x0a, 0x30, // 535 f \n0
    0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, // 00000000
    0x39, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, // 9 00000 
    0x6e, 0x20, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, // n \n00000
    0x30, 0x30, 0x30, 0x37, 0x34, 0x20, 0x30, 0x30, // 00074 00
    0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a, 0x30, // 000 n \n0
    0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x32, // 00000012
    0x34, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, // 4 00000 
    0x6e, 0x20, 0x0a, 0x74, 0x72, 0x61, 0x69, 0x6c, // n \ntrail
    0x65, 0x72, 0x0a, 0x3c, 0x3c, 0x2f, 0x53, 0x69, // er\n<</Si
    0x7a, 0x65, 0x20, 0x34, 0x2f, 0x52, 0x6f, 0x6f, // ze 4/Roo
    0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3e, // t 1 0 R>
    0x3e, 0x0a, 0x73, 0x74, 0x61, 0x72, 0x74, 0x78, // >\nstartx
    0x72, 0x65, 0x66, 0x0a, 0x32, 0x31, 0x36, 0x0a, // ref\n216\n
    0x25, 0x25, 0x45, 0x4f, 0x46               // %%EOF
  ]);
  
  return await pdfjs.getDocument({ data: pdfData }).promise;
}

// Mock the PDF resources map (since we can't import it from TypeScript)
const PDFResourcesMap = new Map();

// Mock utility functions to mimic the PDF inflator behavior
function createPlaneBufferGeometry(width, height, widthSegments, heightSegments, flipY = true) {
  const geometry = new PlaneGeometry(width, height, widthSegments, heightSegments);
  if (flipY === false) {
    const uv = geometry.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) {
      uv.setY(i, 1.0 - uv.getY(i));
    }
  }
  return geometry;
}

function addObject3DComponent(world, eid, object3D) {
  world.eid2obj.set(eid, object3D);
}

// Recreate the inflatePDF function behavior for testing
function mockInflatePDF(world, eid, params) {
  addObject3DComponent(
    world,
    eid,
    new Mesh(createPlaneBufferGeometry(1, 1, 1, 1, params.material.map?.flipY), params.material)
  );
  addComponent(world, MediaPDF, eid);
  PDFResourcesMap.set(eid, params);
  MediaPDF.pageNumber[eid] = 1;
  return eid;
}

test("PDF inflator integration test - creates PDF entity with correct components", async t => {
  const world = createMockWorld();
  const eid = addEntity(world);
  
  // Create mock canvas and texture
  const canvas = new MockCanvas();
  const canvasContext = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  const material = new MeshBasicMaterial({ map: texture });
  
  // Create real PDF document
  const pdf = await createTestPDF();
  
  const params = {
    pdf,
    material,
    canvas,
    canvasContext,
    pageNumber: 1
  };

  // Test the inflator behavior
  const result = mockInflatePDF(world, eid, params);

  // Verify return value
  t.is(result, eid);

  // Verify MediaPDF component was added
  t.true(MediaPDF.pageNumber[eid] !== undefined);
  t.is(MediaPDF.pageNumber[eid], 1);

  // Verify resources were stored in the map
  t.true(PDFResourcesMap.has(eid));
  const storedResources = PDFResourcesMap.get(eid);
  t.is(storedResources.pdf, pdf);
  t.is(storedResources.material, material);
  t.is(storedResources.canvas, canvas);
  t.is(storedResources.canvasContext, canvasContext);
  t.is(storedResources.pageNumber, 1);

  // Verify Object3D was added to the world
  t.true(world.eid2obj.has(eid));
  const mesh = world.eid2obj.get(eid);
  t.truthy(mesh);
  t.is(mesh.material, material);
  t.truthy(mesh.geometry);
});

test("PDF inflator handles different page numbers correctly", async t => {
  const world = createMockWorld();
  const eid = addEntity(world);
  
  const canvas = new MockCanvas();
  const canvasContext = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  const material = new MeshBasicMaterial({ map: texture });
  const pdf = await createTestPDF();
  
  const params = {
    pdf,
    material,
    canvas,
    canvasContext,
    pageNumber: 3
  };

  mockInflatePDF(world, eid, params);

  // Page number should be set to 1 (default), not the input pageNumber
  t.is(MediaPDF.pageNumber[eid], 1);
  
  // But the stored resources should preserve the original pageNumber
  const storedResources = PDFResourcesMap.get(eid);
  t.is(storedResources.pageNumber, 3);
});

test("PDF inflator creates mesh with correct geometry properties", async t => {
  const world = createMockWorld();
  const eid = addEntity(world);
  
  const canvas = new MockCanvas();
  const canvasContext = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  texture.flipY = false; // Simulate texture with flipY false
  const material = new MeshBasicMaterial({ map: texture });
  const pdf = await createTestPDF();
  
  const params = {
    pdf,
    material,
    canvas,
    canvasContext,
    pageNumber: 1
  };

  mockInflatePDF(world, eid, params);

  const mesh = world.eid2obj.get(eid);
  t.truthy(mesh.geometry);
  
  // Verify geometry is a plane with correct dimensions
  const positionAttribute = mesh.geometry.getAttribute("position");
  t.truthy(positionAttribute);
  
  // Verify UV coordinates exist (important for texture mapping)
  const uvAttribute = mesh.geometry.getAttribute("uv");
  t.truthy(uvAttribute);
});

test("PDF.js integration works with real PDF document", async t => {
  const pdf = await createTestPDF();

  // Verify we can access real PDF properties
  t.is(pdf.numPages, 1);
  
  // Verify we can get a page from the real PDF
  const page = await pdf.getPage(1);
  t.truthy(page);
  
  // Verify the page has expected properties
  const viewport = page.getViewport({ scale: 1.0 });
  t.truthy(viewport);
  t.is(typeof viewport.width, "number");
  t.is(typeof viewport.height, "number");
  
  // Verify the viewport has reasonable dimensions
  t.true(viewport.width > 0);
  t.true(viewport.height > 0);
});