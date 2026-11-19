import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound({ home = '/login' }) {
  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center p-4">
      <section className="card text-center p-4 p-md-5" style={{ maxWidth: 520 }}>
        <div className="display-1 fw-bold text-purple">404</div>
        <h1 className="h3 fw-bold">Page not found</h1>
        <p className="text-muted mb-4">The page you're looking for doesn't exist or may have moved.</p>
        <Link className="btn btn-purple align-self-center" to={home}>Go back</Link>
      </section>
    </main>
  );
}
