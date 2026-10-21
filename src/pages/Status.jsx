import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const CASES = [
  { id: 'BP-2026-10882', program: 'Food assistance', filed: 'Oct 2, 2026', status: 'Pending', needs: 'Proof of income' },
  { id: 'BP-2026-10431', program: 'Child-care assistance', filed: 'Sep 18, 2026', status: 'In review', needs: '—' },
  { id: 'BP-2026-09977', program: 'Cash assistance', filed: 'Sep 3, 2026', status: 'Approved', needs: '—' },
  { id: 'BP-2026-09120', program: 'Food assistance', filed: 'Aug 21, 2026', status: 'Denied', needs: '—' },
];

/** The upload dialog for one case. */
function UploadModal({ caseId, onClose }) {
  return (
    <div className="backdrop">
      <div className="modal" role="dialog" aria-labelledby="upload-title" id="upload-dialog">
        <div className="title-row">
          <h2 id="upload-title">Upload documents</h2>
          <button type="button" className="icon-btn" id="upload-close" aria-label="Close upload dialog" onClick={onClose}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2"/></svg></button>
        </div>
        <p>Case {caseId}. We accept PDF, JPG and PNG.</p>
        <div className="field">
          <label htmlFor="upload-file">Choose files to upload</label>
          <input type="file" id="upload-file" aria-describedby="upload-hint" />
        </div>
        <p className="hint muted" id="upload-hint">Max 10 MB per file. Up to 5 files.</p>
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>Upload</button>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/** `?upload=<case>` opens the upload dialog for that case when the page loads. */
export default function Status() {
  const [params] = useSearchParams();
  const [open, setOpen] = useState(params.get('upload'));
  return (
    <div className="page">
      <div className="title-row">
        <h1>Check a case</h1>
        {/* DEBT button-name: icon-only refresh button */}
        <button type="button" className="icon-btn" id="refresh"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18"><path d="M3 9a6 6 0 1 1 2 4.5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M3 14v-4h4" fill="none" stroke="currentColor" strokeWidth="2"/></svg></button>
      </div>
      <table className="cases">
        <thead><tr><th scope="col">Case</th><th scope="col">Program</th><th scope="col">Filed</th><th scope="col">Status</th><th scope="col">We still need</th><th scope="col">Documents</th></tr></thead>
        <tbody>
          {CASES.map((c) => (
            <tr key={c.id}>
              <td><a href={'#' + c.id}>{c.id}</a></td>
              <td>{c.program}</td>
              <td>{c.filed}</td>
              {/* DEBT color-contrast: the Pending badge (amber on white) */}
              <td><span className={'badge badge-' + c.status.toLowerCase().replace(' ', '-')}>{c.status}</span></td>
              <td>{c.needs}</td>
              <td><button type="button" className="btn btn-small" onClick={() => setOpen(c.id)}>Upload documents</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {open && <UploadModal caseId={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
