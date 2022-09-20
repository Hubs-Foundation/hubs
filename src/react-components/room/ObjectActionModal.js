import React, { useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { BigModal } from "../modal/BigModal";
import { CloseButton } from "../input/CloseButton";

export function ObjectActionModal({ isMobile, srcUrl, onClose }) {
  const productSrc = localStorage.getItem('product-script-src');
  const modalName = localStorage.getItem('modal-name');

  useEffect(() => {
    // 1. create iframe to load a library
    var iframe = document.createElement('iframe');
    var productDialogBase = document.querySelectorAll('[class*=BigModal__content]')[0];
    iframe.style.width = String(productDialogBase.clientWidth) + 'px';
    if (isMobile) {
      iframe.style.height = String(document.documentElement.clientHeight) + 'px';
    }
    else {
      iframe.style.height = String(document.documentElement.clientHeight * 0.7) + 'px';
    }

    iframe.style.backgroundColor = "#FFFFFF";
    iframe.src = productSrc;
    // try {
    //   // iframe.is = "x-frame-bypass"
    //   console.log("iframe setAttribute");
    //   iframe.setAttribute('is', 'x-frame-bypass');
    // } catch (e) {
    //   console.log("iframe error", e);
    // }
    productDialogBase.appendChild(iframe);

    // 2. some functions after loading a library 
    iframe.onload = function () {
    }

    // 3. write sctipt tag in iframe
    // var html = '<body><script src="' + productSrc + '"><\/script><\/body>';
    // var html2 = ''
    // var iframeDocument = iframe.contentWindow.document;
    // iframeDocument.open();
    // iframeDocument.write(html2);
    // iframeDocument.close();
  });

  return (
    <BigModal
      title={modalName}
      beforeTitle={<CloseButton onClick={onClose} />}
    >
    </BigModal>
  );
}

ObjectActionModal.propTypes = {
  isMobile: PropTypes.bool,
  srcUrl: PropTypes.string,
  onClose: PropTypes.func
};
