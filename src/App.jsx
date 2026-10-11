import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Shell from './Shell.jsx';
import Home from './pages/Home.jsx';
import Apply from './pages/Apply.jsx';
import Status from './pages/Status.jsx';
import SignIn from './pages/SignIn.jsx';
import Account from './pages/Account.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/apply" element={<Shell><Apply /></Shell>} />
      <Route path="/status" element={<Shell><Status /></Shell>} />
      <Route path="/signin" element={<Shell><SignIn /></Shell>} />
      <Route path="/account" element={<Shell><Account /></Shell>} />
    </Routes>
  );
}
