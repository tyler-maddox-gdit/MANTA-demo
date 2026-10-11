import React, { useState } from 'react';

export default function Apply() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="page narrow">
      <h1>Apply for assistance</h1>
      <ol className="progress" aria-label="Progress">
        <li aria-current="step">1. About you</li><li>2. Household</li><li>3. Review</li>
      </ol>
      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} noValidate>
        <fieldset>
          <legend>1. About you</legend>
          <div className="field"><label htmlFor="first-name">First name</label><input id="first-name" name="firstName" autoComplete="given-name" /></div>
          <div className="field"><label htmlFor="last-name">Last name</label><input id="last-name" name="lastName" autoComplete="family-name" /></div>
          {/* DEBT form-field-multiple-labels (moderate): two labels on one field */}
          <div className="field"><label htmlFor="dob">Date of birth</label><label htmlFor="dob" className="hint-label">Format MM/DD/YYYY</label><input id="dob" name="dob" autoComplete="bday" /></div>
          {/* DEBT label (critical): the visible text is not associated with the field */}
          <div className="field"><span className="label-ish">Social Security number</span><input id="ssn" name="ssn" /></div>
        </fieldset>
        <fieldset>
          <legend>2. Household</legend>
          {/* DEBT select-name: no label on the select */}
          <div className="field"><span className="label-ish">People in your household</span>
            <select id="household-size" name="householdSize"><option>1</option><option>2</option><option>3</option><option>4 or more</option></select>
          </div>
          <div className="field"><label htmlFor="income">Monthly household income (before taxes)</label><input id="income" name="income" inputMode="decimal" /></div>
          <div className="field checks">
            <label><input type="checkbox" name="programs" value="food" /> Food assistance</label>
            <label><input type="checkbox" name="programs" value="cash" /> Cash assistance</label>
            <label><input type="checkbox" name="programs" value="childcare" /> Child-care assistance</label>
          </div>
        </fieldset>
        <fieldset>
          <legend>3. Review and submit</legend>
          <p>By submitting you confirm the information is true to the best of your knowledge.</p>
          <button type="submit" className="btn btn-primary">Submit application</button>
        </fieldset>
        {/* DEBT status-messages (MANTA extended): the confirmation appears with no live region */}
        {submitted && <p className="notice" id="submit-notice">Application received. Your case number is BP-2026-10882.</p>}
      </form>
    </div>
  );
}
