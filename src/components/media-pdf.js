import * as pdfjs from "pdfjs-dist";
import { addComponent, removeComponent } from "bitecs";
import { MediaPdf } from "../bit-components";

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

AFRAME.registerComponent("media-pdf", {
  schema: {
    src: { type: "string" },
    projection: { type: "string", default: "flat" },
    contentType: { type: "string" },
    index: { default: 0 }
  },

  init() {
    addComponent(APP.world, MediaPdf, this.el.eid);
  },

  remove() {
    removeComponent(APP.world, MediaPdf, this.el.eid);
  },

  async update() {
    MediaPdf.src[this.el.eid] = APP.getSid(this.data.src);
    MediaPdf.projection[this.el.eid] = APP.getSid(this.data.projection);
    MediaPdf.contentType[this.el.eid] = APP.getSid(this.data.contentType);
    MediaPdf.index[this.el.eid] = this.data.index;
  }
});
