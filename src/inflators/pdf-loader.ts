import { HubsWorld } from "../app";
import { inflateMediaLoader } from "./media-loader";
export interface PDFLoaderParams {
  src: string;
}
export function inflatePDFLoader(world: HubsWorld, eid: number, params: PDFLoaderParams) {
  inflateMediaLoader(world, eid, {
    src: params.src,
    recenter: false,
    resize: false,
    animateLoad: false,
    isObjectMenuTarget: false
  });

  // TODO Should the PDF be controlled by users? (Should it be a PDFMenuTarget?)
}
