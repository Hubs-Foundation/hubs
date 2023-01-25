import { defineQuery, exitQuery } from "bitecs";
import { GlobalWorkerOptions, PDFPageProxy } from "pdfjs-dist";
import { Mesh, MeshBasicMaterial } from "three";
import { HubsWorld } from "../app";
import { MediaPDF, NetworkedPDF } from "../bit-components";
import { PDFComponent } from "../inflators/pdf";
import { coroutine, makeCancelable } from "../utils/coroutine";
import { cancelable, JobMap, startJob, stopJob, tickJobs } from "../utils/coroutine-utils";
import { EntityID } from "../utils/networking-types";
import { scaleMeshToAspectRatio } from "../utils/scale-to-aspect-ratio";
import { waitForMediaLoaded } from "./media-loading";

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
GlobalWorkerOptions.workerSrc =
  require("!!file-loader?outputPath=assets/js&name=[name]-[hash].js!pdfjs-dist/build/pdf.worker.min.js").default;

export type PDFComponentMap = Map<EntityID, PDFComponent>;

function cleanupPage(page: PDFPageProxy) {
  if (!page.cleanup()) {
    // Failure is unexpected, but the API suggests that it's possible.
    // TODO If this fails, we are probably supposed to try again somehow.
    // For now, just send an error message to the console.
    console.error("Failed to cleanup pdf page. Could leak resources...");
  }
}

function* renderPageCancelable(component: PDFComponent, pageNumber: number) {
  const pagePromise = component.pdf.getPage(pageNumber);
  yield makeCancelable(function () {
    pagePromise.then(page => {
      cleanupPage(page);
    });
  });
  const page: PDFPageProxy = yield pagePromise;
  const viewport = page!.getViewport({ scale: 3 });
  const ratio = viewport.height / viewport.width;
  (component.texture.image as HTMLCanvasElement).width = viewport.width;
  (component.texture.image as HTMLCanvasElement).height = viewport.height;
  const renderTask = page!.render({ canvasContext: component.canvasContext, viewport, intent: "print" });
  yield renderTask.promise;
  cleanupPage(page);
  return ratio;
}

function* loadPageJob(world: HubsWorld, eid: EntityID, component: PDFComponent, pageNumber: number) {
  const ratio = yield* cancelable(jobs.get(eid)!, renderPageCancelable(component, pageNumber));
  const mesh = world.eid2obj.get(eid)! as Mesh;
  const material = mesh.material as MeshBasicMaterial;
  material.map = component.texture;
  material.map!.needsUpdate = true;
  material.needsUpdate = true;
  yield* waitForMediaLoaded(world, mesh.parent!.eid!);
  scaleMeshToAspectRatio(mesh, ratio);
}

const jobs: JobMap = new Map();
const pdfQuery = defineQuery([MediaPDF, NetworkedPDF]);
const pdfExitQuery = exitQuery(pdfQuery);
export function pdfSystem(world: HubsWorld) {
  pdfQuery(world).forEach(function (eid) {
    const data = (MediaPDF.map as PDFComponentMap).get(eid)!;
    if (data.pageNumber !== NetworkedPDF.pageNumber[eid]) {
      data.pageNumber = NetworkedPDF.pageNumber[eid];
      stopJob(jobs, eid);
      startJob(jobs, eid, coroutine(loadPageJob(world, eid, data, NetworkedPDF.pageNumber[eid])));
    }
  });

  pdfExitQuery(world).forEach(function (eid) {
    stopJob(jobs, eid);
  });

  tickJobs(jobs);
}
