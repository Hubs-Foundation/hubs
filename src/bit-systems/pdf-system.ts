import { defineQuery, exitQuery } from "bitecs";
import { GlobalWorkerOptions, PDFPageProxy } from "pdfjs-dist";
import { Mesh, MeshBasicMaterial } from "three";
import { HubsWorld } from "../app";
import { MediaPDF, NetworkedPDF } from "../bit-components";
import { PDFComponent } from "../inflators/pdf";
import { cancelable, coroutine, makeCancelable } from "../utils/coroutine";
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

// TODO type for coroutine
type Coroutine = () => IteratorResult<undefined, any>;
const jobs = new Set<Coroutine>();
const abortControllers = new Map<EntityID, AbortController>();

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
  const ac = new AbortController();
  abortControllers.set(eid, ac);
  const { value: ratio, canceled }: { value?: number; canceled: boolean } = yield* cancelable(
    renderPageCancelable(component, pageNumber),
    ac.signal
  );
  if (canceled) {
    // It is not safe to delete from the abortControllers map here!
    return;
  }
  abortControllers.delete(eid);
  const mesh = world.eid2obj.get(eid)! as Mesh;
  const material = mesh.material as MeshBasicMaterial;
  material.map = component.texture;
  material.map!.needsUpdate = true;
  material.needsUpdate = true;
  yield* waitForMediaLoaded(world, mesh.parent!.eid!);
  scaleMeshToAspectRatio(mesh, ratio);
}

function abortPageLoad(eid: EntityID) {
  const ac = abortControllers.get(eid);
  if (!ac) return;
  ac.abort();
  abortControllers.delete(eid);
}

const pdfQuery = defineQuery([MediaPDF, NetworkedPDF]);
const pdfExitQuery = exitQuery(pdfQuery);
export function pdfSystem(world: HubsWorld) {
  pdfQuery(world).forEach(function (eid) {
    const data = (MediaPDF.map as PDFComponentMap).get(eid)!;
    if (data.pageNumber !== NetworkedPDF.pageNumber[eid]) {
      data.pageNumber = NetworkedPDF.pageNumber[eid];
      abortPageLoad(eid);
      jobs.add(
        coroutine(loadPageJob(world, eid, (MediaPDF.map as PDFComponentMap).get(eid)!, NetworkedPDF.pageNumber[eid]))
      );
    }
  });

  pdfExitQuery(world).forEach(function (eid) {
    abortPageLoad(eid);
  });

  jobs.forEach((job: Coroutine) => {
    if (job().done) {
      jobs.delete(job);
    }
  });
}
