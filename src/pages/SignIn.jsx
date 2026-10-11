import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignIn() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get('password') === 'benefits-demo') {
      sessionStorage.setItem('bp-signed-in', '1');
      navigate('/account');
    } else setError('That email and password did not match.');
  }
  return (
    <div className="page narrow">
      <h1>Sign in</h1>
      <form onSubmit={submit}>
        <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" /></div>
        <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" /></div>
        {error && <p role="alert" className="error">{error}</p>}
        <button type="submit" className="btn btn-primary">Sign in</button>
      </form>
    </div>
  );
}
