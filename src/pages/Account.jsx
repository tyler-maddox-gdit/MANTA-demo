import React from 'react';
import { Navigate } from 'react-router-dom';

export default function Account() {
  if (localStorage.getItem('bp-signed-in') !== '1') return <Navigate to="/signin" replace />;
  return (
    <div className="page">
      <div className="title-row">
        {/* DEBT image-alt: avatar */}
        <img id="avatar" src="/avatar.svg" width="48" height="48" className="avatar" />
        <h1>Welcome back, Jordan</h1>
      </div>
      <section aria-labelledby="case-heading">
        <h2 id="case-heading">Your case</h2>
        <dl className="kv">
          <dt>Case</dt><dd>BP-2026-10882</dd>
          <dt>Program</dt><dd>Food assistance</dd>
          {/* DEBT color-contrast: amber badge */}
          <dt>Status</dt><dd><span className="badge badge-pending">Pending</span></dd>
          <dt>Renewal due</dt><dd>Oct 31, 2026</dd>
        </dl>
      </section>
      <section aria-labelledby="msg-heading">
        <h2 id="msg-heading">Messages</h2>
        <ul className="messages">
          <li><strong>Oct 6</strong> Your caseworker asked for proof of income. <a href="#m1">Read</a></li>
          <li><strong>Oct 2</strong> We received your application. <a href="#m2">Read</a></li>
        </ul>
      </section>
    </div>
  );
}
