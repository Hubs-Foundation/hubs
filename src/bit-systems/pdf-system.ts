import { defineQuery, entityExists, exitQuery } from "bitecs";
import * as pdfjs from "pdfjs-dist";
import { Mesh, MeshBasicMaterial } from "three";
import { HubsWorld } from "../app";
import { MediaPDF, NetworkedPDF } from "../bit-components";
import { PDFComponent } from "../inflators/pdf";
import { sleep } from "../utils/async-utils";
import { EntityID } from "../utils/networking-types";
import { scaleMeshToAspectRatio } from "../utils/scale-to-aspect-ratio";
import { coroutine } from "../utils/coroutine";
import { mediaScaleAnimationDurationMS } from "./media-loading";

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

function* loadPageJob(world: HubsWorld, eid: EntityID, component: PDFComponent, pageNumber: number) {
  const page: pdfjs.PDFPageProxy = yield component.pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 3 });
  const ratio = viewport.height / viewport.width;
  component.canvas.width = viewport.width;
  component.canvas.height = viewport.height;
  const renderTask = page.render({ canvasContext: component.canvasContext, viewport });
  yield renderTask.promise;
  const mesh = world.eid2obj.get(eid)! as Mesh;
  const material = mesh.material as MeshBasicMaterial;
  material.map = component.texture;
  material.map!.needsUpdate = true;
  material.needsUpdate = true;
  scaleMeshToAspectRatio(mesh, ratio);

  // HACK The loading animation in media loader
  // might still be controlling this object's scale,
  // so wait for that long and then set the scale again.
  yield sleep(mediaScaleAnimationDurationMS);
  scaleMeshToAspectRatio(mesh, ratio);
}

// TODO type for coroutine
type Coroutine = () => IteratorResult<undefined, any>;
const jobs = new Map<EntityID, Coroutine>();

const pdfQuery = defineQuery([MediaPDF, NetworkedPDF]);
const pdfExitQuery = exitQuery(pdfQuery);
export function pdfSystem(world: HubsWorld) {
  pdfQuery(world).forEach(function (eid) {
    const component = (MediaPDF.map as PDFComponentMap).get(eid)!;
    if (component.page !== NetworkedPDF.page[eid]) {
      if (jobs.has(eid)) {
        jobs.delete(eid); // interrupt the page load in progress
      }
      component.page = NetworkedPDF.page[eid];
      jobs.set(eid, coroutine(loadPageJob(world, eid, component, NetworkedPDF.page[eid])));
    }
  });

  pdfExitQuery(world).forEach(function (eid) {
    jobs.delete(eid);
  });

  jobs.forEach((job, pdf) => {
    if (job().done) jobs.delete(pdf);
  });
}
