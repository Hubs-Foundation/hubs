/* eslint-disable @calm/react-intl/missing-formatted-message */
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import * as pdfjs from "pdfjs-dist";

// Configure PDF.js worker (same as in media-pdf.js)
pdfjs.GlobalWorkerOptions.workerSrc =
  require("!!file-loader?outputPath=assets/js&name=[name]-[hash].js!pdfjs-dist/build/pdf.worker.min.js").default;

export default {
  title: "PDF/PDFViewer",
  parameters: {
    layout: "fullscreen"
  }
};

// Simple PDF Viewer Component for Storybook
const PDFViewer = ({ src, pageNumber = 1, scale = 1.5, width = 600, height = 800 }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    if (!src) return;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadingTask = pdfjs.getDocument(src);
        const pdfDocument = await loadingTask.promise;

        setPdf(pdfDocument);
        setNumPages(pdfDocument.numPages);
        setLoading(false);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadPDF();
  }, [src]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error("Error rendering page:", err);
        setError(err.message);
      }
    };

    renderPage();
  }, [pdf, currentPage, scale]);

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: `${height}px`,
          width: `${width}px`,
          border: "1px solid #ccc",
          backgroundColor: "#f5f5f5"
        }}
      >
        <div>Loading PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: `${height}px`,
          width: `${width}px`,
          border: "1px solid #ccc",
          backgroundColor: "#fee",
          color: "#c00"
        }}
      >
        <div>Error: {error}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        backgroundColor: "#f9f9f9"
      }}
    >
      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}
      >
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          style={{
            padding: "8px 16px",
            backgroundColor: currentPage <= 1 ? "#ddd" : "#007cba",
            color: currentPage <= 1 ? "#999" : "white",
            border: "none",
            borderRadius: "4px",
            cursor: currentPage <= 1 ? "not-allowed" : "pointer"
          }}
        >
          Previous
        </button>

        <span
          style={{
            padding: "8px 16px",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
            fontFamily: "monospace"
          }}
        >
          Page {currentPage} of {numPages}
        </span>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= numPages}
          style={{
            padding: "8px 16px",
            backgroundColor: currentPage >= numPages ? "#ddd" : "#007cba",
            color: currentPage >= numPages ? "#999" : "white",
            border: "none",
            borderRadius: "4px",
            cursor: currentPage >= numPages ? "not-allowed" : "pointer"
          }}
        >
          Next
        </button>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid #ccc",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          backgroundColor: "white"
        }}
      />

      <div
        style={{
          marginTop: "10px",
          fontSize: "12px",
          color: "#666",
          textAlign: "center"
        }}
      >
        PDF.js version: {pdfjs.version} | Build: {pdfjs.build}
      </div>
    </div>
  );
};

// Sample PDF URL - using a publicly available PDF for demonstration
const SAMPLE_PDF_URL = "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";

export const BasicPDFViewer = () => <PDFViewer src={SAMPLE_PDF_URL} pageNumber={1} scale={1.2} />;

export const LargePDFViewer = () => <PDFViewer src={SAMPLE_PDF_URL} pageNumber={1} scale={1.8} />;

export const ErrorState = () => <PDFViewer src="https://invalid-url.pdf" pageNumber={1} scale={1.2} />;

export const LoadingState = () => {
  // Create a component that shows loading state
  const [showPDF, setShowPDF] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowPDF(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return showPDF ? <PDFViewer src={SAMPLE_PDF_URL} pageNumber={1} scale={1.2} /> : <PDFViewer src={null} />;
};

PDFViewer.propTypes = {
  src: PropTypes.string,
  pageNumber: PropTypes.number,
  scale: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number
};
