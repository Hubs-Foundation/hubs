// Wrapper for pdfjs-dist to handle initialization properly
let pdfjsLib;

// Use dynamic import to ensure proper module loading
export async function getPDFLib() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist");

    // Set up worker if not already configured
    if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        require("!!file-loader?outputPath=assets/js&name=[name]-[hash].js!pdfjs-dist/build/pdf.worker.min.js").default;
    }
  }

  return pdfjsLib;
}

// For synchronous access after initialization
export function getPDFLibSync() {
  if (!pdfjsLib) {
    throw new Error("PDF.js not initialized. Call getPDFLib() first.");
  }
  return pdfjsLib;
}
