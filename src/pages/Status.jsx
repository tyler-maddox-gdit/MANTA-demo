import React from 'react';
import IconButton from '../components/IconButton.jsx';

const CASES = [
  { id: 'BP-2026-10882', program: 'Food assistance', filed: 'Oct 2, 2026', status: 'Pending', needs: 'Proof of income' },
  { id: 'BP-2026-10431', program: 'Child-care assistance', filed: 'Sep 18, 2026', status: 'In review', needs: '—' },
  { id: 'BP-2026-09977', program: 'Cash assistance', filed: 'Sep 3, 2026', status: 'Approved', needs: '—' },
  { id: 'BP-2026-09120', program: 'Food assistance', filed: 'Aug 21, 2026', status: 'Denied', needs: '—' },
];

export default function Status() {
  return (
    <div className="page">
      <div className="title-row">
        <h1>Check a case</h1>
        <IconButton id="refresh" label="Refresh case list"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18"><path d="M3 9a6 6 0 1 1 2 4.5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M3 14v-4h4" fill="none" stroke="currentColor" strokeWidth="2"/></svg></IconButton>
      </div>
      <table className="cases">
        <thead><tr><th scope="col">Case</th><th scope="col">Program</th><th scope="col">Filed</th><th scope="col">Status</th><th scope="col">We still need</th></tr></thead>
        <tbody>
          {CASES.map((c) => (
            <tr key={c.id}>
              <td><a href={'#' + c.id}>{c.id}</a></td>
              <td>{c.program}</td>
              <td>{c.filed}</td>
              {/* DEBT color-contrast: the Pending badge (amber on white) */}
              <td><span className={'badge badge-' + c.status.toLowerCase().replace(' ', '-')}>{c.status}</span></td>
              <td>{c.needs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
