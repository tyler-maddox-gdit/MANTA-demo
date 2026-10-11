import React from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '../Shell.jsx';

const SERVICES = [
  { to: '/apply', title: 'Apply for assistance', text: 'Food, cash and child-care assistance in one application. About 20 minutes.' },
  { to: '/status', title: 'Check a case', text: 'See where an application is, what we still need and when a decision is due.' },
  { to: '/signin', title: 'Your account', text: 'Messages from your caseworker, documents and renewal dates.' },
];

const NEWS = [
  { date: 'Oct 1, 2026', title: 'Renewal reminders now sent by text message' },
  { date: 'Sep 12, 2026', title: 'Child-care assistance income limits raised for 2027' },
  { date: 'Aug 30, 2026', title: 'New office hours at the downtown service center' },
];

function Hero() {
  return (
    <section className="hero">
      <div>
        <h1>Help for families, when you need it</h1>
        <p>Apply for food, cash and child-care assistance, check a case, or talk to your caseworker — online, any time.</p>
        <Link className="btn btn-primary" to="/apply">Start an application</Link>
        <Link className="btn btn-link" to="/status">Check status</Link>
      </div>
      {/* DEBT image-alt: no alt on the hero image */}
      <img id="hero-image" src="/hero.svg" width="480" height="300" />
    </section>
  );
}

function Services() {
  return (
    <section className="services">
      {/* heading-order is a best-practice rule: fires only if the config adds that tag */}
      <h3>What you can do here</h3>
      <div className="cards">
        {SERVICES.map((s) => (
          <Link key={s.to} to={s.to} className="card">
            <strong>{s.title}</strong>
            <span>{s.text}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function News() {
  return (
    <section className="news" aria-labelledby="news-heading">
      <h2 id="news-heading">News</h2>
      <ul>
        {NEWS.map((n) => (
          <li key={n.title}><time>{n.date}</time> <a href="#news">{n.title}</a></li>
        ))}
      </ul>
    </section>
  );
}

/** Federal classic: banner, serif, hero over three cards. */
export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Services />
        <News />
      </main>
      {/* region is a best-practice rule: fires only if the config adds that tag */}
      <p className="stray" id="stray-notice">Service center closed Monday, October 12 for the holiday.</p>
      <Footer />
    </>
  );
}
