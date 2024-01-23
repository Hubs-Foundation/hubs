import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent } from "bitecs";
import { GlobalWorkerOptions, PDFPageProxy } from "pdfjs-dist";
import { Object3D } from "three";
import { HubsWorld } from "../app";
import { MediaPDF, MediaPDFUpdated, NetworkedPDF, Owned } from "../bit-components";
import { PDFResources } from "../inflators/pdf";
import { JobRunner } from "../utils/coroutine-utils";
import { EntityID } from "../utils/networking-types";
import { disposeMaterial } from "../utils/three-utils";
import { waitForMediaLoaded } from "./media-loading";

// TODO This can go away if we make bit-components a typescript file
export const PDFResourcesMap = (MediaPDF as any).map as Map<EntityID, PDFResources>;

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

type Aspect = { width: number; height: number };

export function* loadPageJob(
  { pdf, canvasContext, material }: PDFResources,
  pageNumber: number
): Generator<any, Aspect, any> {
  const page: PDFPageProxy = yield pdf.getPage(pageNumber);
  const viewport = page!.getViewport({ scale: 3 });
  (material.map!.image as HTMLCanvasElement).width = viewport.width;
  (material.map!.image as HTMLCanvasElement).height = viewport.height;
  const renderTask = page!.render({ canvasContext, viewport, intent: "print" });
  yield renderTask.promise;
  material.map!.needsUpdate = true;
  material.needsUpdate = true;
  return { width: viewport.width, height: viewport.height };
}

export function fitToAspect(o: Object3D, { width, height }: Aspect) {
  // Define a constant c to preserve the original area (scale.x * scale*y)
  const c = Math.sqrt((o.scale.x * o.scale.y) / (width * height));
  o.scale.x = width * c;
  o.scale.y = height * c;
  o.matrixNeedsUpdate = true;
}

export function* loadPageAndSetScale(world: HubsWorld, eid: EntityID, pageNumber: number) {
  const aspect = yield* loadPageJob(PDFResourcesMap.get(eid)!, pageNumber);
  const mesh = world.eid2obj.get(eid)!;
  // HACK The loading animation may still be controlling the pdf scale,
  // so wait until it is finished. This is rarely necessary.
  yield* waitForMediaLoaded(world, mesh.parent!.eid!);
  fitToAspect(mesh, aspect);
  MediaPDF.pageNumber[eid] = pageNumber;
  removeComponent(world, MediaPDFUpdated, eid);
}

const jobs = new JobRunner();
const pdfQuery = defineQuery([MediaPDF]);
const pdfEnterQuery = enterQuery(pdfQuery);
const pdfUpdatedQuery = defineQuery([MediaPDF, MediaPDFUpdated]);
const pdfUpdatedEnterQuery = enterQuery(pdfUpdatedQuery);
const networkedPdfQuery = defineQuery([MediaPDF, NetworkedPDF]);
const pdfExitQuery = exitQuery(pdfQuery);
export function pdfSystem(world: HubsWorld) {
  pdfEnterQuery(world).forEach(eid => {
    jobs.add(eid, () => loadPageAndSetScale(world, eid, MediaPDF.pageNumber[eid]));
  });
  pdfUpdatedEnterQuery(world).forEach(eid => {
    jobs.stop(eid);
    jobs.add(eid, () => loadPageAndSetScale(world, eid, MediaPDFUpdated.pageNumber[eid]));
  });
  networkedPdfQuery(world).forEach(function (eid) {
    if (hasComponent(world, Owned, eid)) {
      NetworkedPDF.pageNumber[eid] = MediaPDF.pageNumber[eid];
    } else {
      if (MediaPDF.pageNumber[eid] !== NetworkedPDF.pageNumber[eid] && !hasComponent(world, MediaPDFUpdated, eid)) {
        addComponent(world, MediaPDFUpdated, eid);
        MediaPDFUpdated.pageNumber[eid] = NetworkedPDF.pageNumber[eid];
      }
    }
  });

  pdfExitQuery(world).forEach(function (eid) {
    const resources = PDFResourcesMap.get(eid)!;
    resources.pdf.cleanup();
    disposeMaterial(resources.material);
    PDFResourcesMap.delete(eid);
    jobs.stop(eid);
  });

  jobs.tick();
}
