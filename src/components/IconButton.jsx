import React from 'react';

/** An icon-only button; `label` is its name for screen readers. */
export default function IconButton({ id, label, onClick, children }) {
  return <button type="button" className="icon-btn" id={id} aria-label={label} onClick={onClick}>{children}</button>;
}
