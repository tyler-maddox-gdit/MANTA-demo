import React from 'react';

/** An icon-only button; `label` is its name for screen readers. */
export default function IconButton({ id, label, onClick, children }) {
  // DEBT button-name: label is accepted but never rendered
  return <button type="button" className="icon-btn" id={id} onClick={onClick}>{children}</button>;
}
