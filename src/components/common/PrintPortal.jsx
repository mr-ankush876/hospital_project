import React from 'react';
import { createPortal } from 'react-dom';

const PrintPortal = ({ children }) => {
  const printRoot = document.getElementById('print-root');
  if (!printRoot) return null;
  return createPortal(children, printRoot);
};

export default PrintPortal;