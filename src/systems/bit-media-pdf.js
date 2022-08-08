import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { MediaPdf } from "../bit-components";
import { addAndArrangeMedia } from "../utils/media-utils";
import { SOUND_CAMERA_TOOL_TOOK_SNAPSHOT } from "../systems/sound-effects-system";
import * as pdfjs from "pdfjs-dist";
import { errorTexture } from "../utils/error-texture";
import { createPlaneBufferGeometry } from "../utils/three-utils";
import { scaleToAspectRatio } from "../utils/scale-to-aspect-ratio";

const ONCE_TRUE = { once: true };
const TYPE_IMG_PNG = { type: "image/png" };

const canvases = new Map();
const textures = new Map();
const meshes = new Map();
const pdfs = new Map();
const snapCounts = new Map();
const snapping = new Map();
const prevPages = new Map();
const prevSrcs = new Map();
const isRendering = new Map();

const onSnapImageLoaded = (eid) => {
  snapping.set(eid, false);
};

const snap = async ({ detail: { eid } }) => {
  if (snapping.get(eid)) return;
  snapping.set(eid, true);

  APP.scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_TOOK_SNAPSHOT);

  const blob = await new Promise(resolve => {
    const canvas = canvases.get(eid);
    canvas.toBlob(resolve);
  });
  const file = new File([blob], "snap.png", TYPE_IMG_PNG);

  const spanCount = snapCounts.get(eid);
  snapCounts.set(eid, spanCount + 1);

  const obj = APP.world.eid2obj.get(eid);
  const { entity } = addAndArrangeMedia(obj.el, file, "photo-snapshot", snapCounts.get(eid), false, 1);
  entity.addEventListener("image-loaded", onSnapImageLoaded, ONCE_TRUE);
};

const loadPage = async (eid) => {
  const pdf = pdfs.get(eid);
  const canvas = canvases.get(eid);
  const obj = APP.world.eid2obj.get(eid);
  const index = MediaPdf.index[eid];

  if (isRendering[eid]) return;

  let ratio;
  let texture;
  try {
    isRendering.set(eid, true);
    prevPages.set(eid, index);

    const page = await pdf.getPage(index + 1);

    const viewport = page.getViewport({ scale: 3 });
    const pw = viewport.width;
    const ph = viewport.height;

    ratio = ph / pw;

    canvas.width = pw;
    canvas.height = ph;

    const canvasContext = canvas.getContext("2d");
    let renderTask = page.render({ canvasContext, viewport });

    await renderTask.promise;

    pdf.lola[6] = 2;

    texture = textures.get(eid);
    renderTask = null;

    if (obj.el.components["media-pager"] && obj.el.components["media-pager"].data.index !== index) {
      obj.el.setAttribute("media-pager", { index });
    }
  
  } catch (e) {
    console.error("Error loading PDF", e);
    texture = errorTexture;
    ratio = 1;
    textures.set(eid, texture);
  }

  let mesh = meshes.get(eid);
  if (!mesh) {
    const material = new THREE.MeshBasicMaterial();
    const geometry = createPlaneBufferGeometry(1, 1, 1, 1, texture.flipY);
    material.side = THREE.DoubleSide;

    mesh = new THREE.Mesh(geometry, material);
    obj.el.setObject3D("mesh", mesh);
    meshes.set(eid, mesh);
  }

  mesh.material.transparent = texture == errorTexture;
  mesh.material.map = texture;
  mesh.material.map.needsUpdate = true;
  mesh.material.needsUpdate = true;

  isRendering.set(eid, false);

  scaleToAspectRatio(obj.el, ratio);

  console.log("XXX - PAGE RENDERED")
  return ratio;
};

const loadPdf = async (eid) => {
  const obj = APP.world.eid2obj.get(eid);
  const src = APP.getString(MediaPdf.src[eid]);

  let texture;
  try {
    prevSrcs.set(eid, src);

    const canvas = document.createElement("canvas");
    canvases.set(eid, canvas);

    snapCounts.set(eid, 0)
    snapping.set(eid, false);

    texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.minFilter = THREE.LinearFilter;

    obj.el.addEventListener("pager-snap-clicked", snap);

    const pdf = await pdfjs.getDocument(src).promise;
    pdfs.set(eid, pdf);
    obj.el.setAttribute("media-pager", { maxIndex: pdf.numPages - 1 });

  } catch(e) {
    texture = errorTexture;
  }

  textures.set(eid, texture);
  await loadPage(eid);

  obj.el.emit("pdf-loaded", { src });
};

const pdfsQuery = defineQuery([MediaPdf]);
const pdfsQueryEnterQuery = enterQuery(pdfsQuery);
const pdfsQueryExitQuery = exitQuery(pdfsQuery);

export function mediaPdfSystem(world) {
  pdfsQueryExitQuery(world).forEach(eid => {
    canvases.delete(eid);
    textures.delete(eid);
    meshes.delete(eid);
    pdfs.delete(eid);
    snapCounts.delete(eid);
    snapping.delete(eid);
    prevPages.delete(eid);
    prevSrcs.delete(eid);
    isRendering.delete(eid);
    console.log("XXX - REMOVED")
  });
  pdfsQueryEnterQuery(world).forEach(async eid => {
    await loadPdf(eid);
    const obj = APP.world.eid2obj.get(eid);
    obj.el.components["listed-media"] && obj.el.sceneEl.emit("listed_media_changed");
  });
  pdfsQuery(world).forEach(async eid => {
    const prevPage = prevPages.get(eid);
    const prevSrc = prevSrcs.get(eid);
    const page = MediaPdf.index[eid];
    const src = APP.getString(MediaPdf.src[eid]);
    const hasPageChanged = prevPage !== undefined && prevPage !== page;
    const hasSrcChanged = src !== undefined && src !== prevSrc;
    if (hasSrcChanged) {
      await loadPdf(eid);
    } else if (hasPageChanged) {
      await loadPage(eid);
    }
  });
}