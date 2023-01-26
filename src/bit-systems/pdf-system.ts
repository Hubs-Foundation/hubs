import { defineQuery, exitQuery } from "bitecs";
import { GlobalWorkerOptions, PDFPageProxy } from "pdfjs-dist";
import { Mesh, MeshBasicMaterial } from "three";
import { HubsWorld } from "../app";
import { MediaPDF, NetworkedPDF } from "../bit-components";
import { PDFComponent } from "../inflators/pdf";
import { JobRunner } from "../utils/coroutine-utils";
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

function* loadPageJob(world: HubsWorld, eid: EntityID, component: PDFComponent, pageNumber: number) {
  const page: PDFPageProxy = yield component.pdf.getPage(pageNumber);
  const viewport = page!.getViewport({ scale: 3 });
  const ratio = viewport.height / viewport.width;
  (component.texture.image as HTMLCanvasElement).width = viewport.width;
  (component.texture.image as HTMLCanvasElement).height = viewport.height;
  const renderTask = page!.render({ canvasContext: component.canvasContext, viewport, intent: "print" });
  yield renderTask.promise;
  const mesh = world.eid2obj.get(eid)! as Mesh;
  const material = mesh.material as MeshBasicMaterial;
  material.map = component.texture;
  material.map!.needsUpdate = true;
  material.needsUpdate = true;
  yield* waitForMediaLoaded(world, mesh.parent!.eid!);
  scaleMeshToAspectRatio(mesh, ratio);
}

const jobs = new JobRunner();
const pdfQuery = defineQuery([MediaPDF, NetworkedPDF]);
const pdfExitQuery = exitQuery(pdfQuery);
export function pdfSystem(world: HubsWorld) {
  pdfQuery(world).forEach(function (eid) {
    const data = (MediaPDF.map as PDFComponentMap).get(eid)!;
    if (data.pageNumber !== NetworkedPDF.pageNumber[eid]) {
      data.pageNumber = NetworkedPDF.pageNumber[eid];

      jobs.stop(eid);
      jobs.add(eid, () => loadPageJob(world, eid, data, NetworkedPDF.pageNumber[eid]));
    }
  });

  pdfExitQuery(world).forEach(function (eid) {
    const data = (MediaPDF.map as PDFComponentMap).get(eid)!;
    data.pdf.cleanup();
    (MediaPDF.map as PDFComponentMap).delete(eid);
    jobs.stop(eid);
  });

  jobs.tick();
}
