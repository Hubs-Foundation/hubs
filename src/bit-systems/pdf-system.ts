import { defineQuery, entityExists } from "bitecs";
import * as pdfjs from "pdfjs-dist";
import { Mesh, MeshBasicMaterial } from "three";
import { HubsWorld } from "../app";
import { MediaPDF, NetworkedPDF } from "../bit-components";
import { PDFComponent } from "../inflators/pdf";
import { sleep } from "../utils/async-utils";
import { EntityID } from "../utils/networking-types";
import { scaleMeshToAspectRatio } from "../utils/scale-to-aspect-ratio";

/**
 * Warning! This require statement is fragile!
 *
 * How it works:
 * require -> require the file after all import statements have been called, particularly the configs.js import which modifies __webpack_public_path__
 * !! -> don't run any other loaders
 * file-loader -> make webpack move the file into the dist directory and return the file path
 * outputPath -> where to put the file
 * name -> how to name the file
 * Then the path to the worker script
 */
pdfjs.GlobalWorkerOptions.workerSrc =
  require("!!file-loader?outputPath=assets/js&name=[name]-[hash].js!pdfjs-dist/build/pdf.worker.min.js").default;

export type PDFComponentMap = Map<EntityID, PDFComponent>;

async function loadPage(world: HubsWorld, eid: EntityID, component: PDFComponent, pageNumber: number) {
  const page = await component.pdf.getPage(pageNumber);
  // Since loading is async, make sure the entity is still around.
  // TODO Convert this to cancelable coroutine, so that we can't get burned by entity id recycling
  if (!entityExists(world, eid)) return;

  const viewport = page.getViewport({ scale: 3 });
  const ratio = viewport.height / viewport.width;

  component.canvas.width = viewport.width;
  component.canvas.height = viewport.height;
  const renderTask = page.render({ canvasContext: component.canvasContext, viewport });
  await renderTask.promise;
  if (!entityExists(world, eid)) return;
  const mesh = world.eid2obj.get(eid)! as Mesh;
  const material = mesh.material as MeshBasicMaterial;
  material.map = component.texture;
  material.map!.needsUpdate = true;
  material.needsUpdate = true;
  scaleMeshToAspectRatio(mesh, ratio);
  component.isLoading = false;

  // The loading animation in media loader
  // might still be controlling this object's scale,
  // so set the size again.
  // TODO Fix
  await sleep(400);
  scaleMeshToAspectRatio(mesh, ratio);
}

const pdfQuery = defineQuery([MediaPDF, NetworkedPDF]);
export function pdfSystem(world: HubsWorld) {
  pdfQuery(world).forEach(eid => {
    const component = (MediaPDF.map as PDFComponentMap).get(eid)!;
    if (!component.isLoading && component.page !== NetworkedPDF.page[eid]) {
      component.isLoading = true;
      component.page = NetworkedPDF.page[eid];
      loadPage(world, eid, component, NetworkedPDF.page[eid]);
    }
  });
}
