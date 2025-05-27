/**
 * Test for PDF Storybook integration
 * Verifies that PDF.js functionality is available for Storybook stories
 */

import test from "ava";
import { readFileSync } from "fs";
import { join } from "path";

test("PDF Storybook story file exists and has correct structure", t => {
  // Test that the PDF story file exists and has the expected content
  const storyPath = join(process.cwd(), "src/react-components/pdf/PDFViewer.stories.js");
  const storyContent = readFileSync(storyPath, "utf8");
  
  t.truthy(storyContent.includes("PDF/PDFViewer"), "Story should have correct title");
  t.truthy(storyContent.includes("BasicPDFViewer"), "Should include BasicPDFViewer story");
  t.truthy(storyContent.includes("LargePDFViewer"), "Should include LargePDFViewer story");
  t.truthy(storyContent.includes("ErrorState"), "Should include ErrorState story");
  t.truthy(storyContent.includes("LoadingState"), "Should include LoadingState story");
  t.truthy(storyContent.includes("import * as pdfjs"), "Should import PDF.js");
  t.truthy(storyContent.includes("PropTypes"), "Should include prop validation");
});

test("PDF.js is available for Storybook integration", async t => {
  // Test that PDF.js can be imported and has the required functionality
  const pdfjs = await import("pdfjs-dist");
  
  t.truthy(pdfjs.version, "PDF.js version should be available");
  t.truthy(pdfjs.getDocument, "getDocument function should be available");
  t.truthy(pdfjs.GlobalWorkerOptions, "GlobalWorkerOptions should be available");
  
  // Verify version is the expected one we upgraded to
  t.truthy(pdfjs.version.startsWith("3."), "Should be using PDF.js version 3.x");
});