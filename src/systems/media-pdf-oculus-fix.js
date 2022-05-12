/*
  PDFjs which is used to render pdfs depends on the window.requestAnimationFrame function.
  This is not called when in mobileVR.
  This system replaces the function with the requestAnimationFrame of the xrSession.
  It also adds a listener to ensure it is reset and call not called callbacks after the user leaves xr.
*/
export class MediaPDFOculusFix {
  constructor() {
    this.requestAnimationFramePrev = this.requestAnimationFramePrev || window.requestAnimationFrame;
    this.cbList = new Set();
  }

  tick(sceneEl, exit) {
    const isMobileVR = AFRAME.utils.device.isMobileVR();
    let isVR = !exit && sceneEl.is("vr-mode") && isMobileVR;
    if (isVR != this.wasVR) {
      if (isVR) {
        this.onEnterVR(sceneEl);
      } else if (this.wasVR) {
        this.onExitVR();
      }
    }
    this.wasVR = isVR;
  }

  onEnterVR(sceneEl) {
    const { xrSession } = sceneEl;
    window.requestAnimationFrame = cb => {
      let myCb = () => {
        this.cbList.delete(myCb);
        cb();
      };
      this.cbList.add(myCb);
      return xrSession.requestAnimationFrame.call(xrSession, myCb);
    };
    //Make sure tick is called
    if (!this.interval)
      this.interval = setInterval(() => {
        this.tick(sceneEl);
      }, 500);
  }

  async onExitVR() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    window.requestAnimationFrame = cb => this.requestAnimationFramePrev.call(window, cb);
    this.cbList.forEach(cb => {
      window.requestAnimationFrame(cb);
    });
  }
}
