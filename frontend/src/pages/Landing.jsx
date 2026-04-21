import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Landing() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  return (
    <div className="landing" id="landing-page">
      <div className="landing-content" style={{ animation: 'fadeIn 0.8s ease-out' }}>
        <div 
          className="landing-badge"
          onClick={() => navigate('/login')}
          style={{ cursor: 'pointer' }}
          title="Go to Admin Login"
        >
          ✨ MK FOOD CORNER WEB APP
        </div>

        <h1 className="landing-title">
          Everything<br />
          <span className="highlight">Flippin' Fresh</span>
        </h1>

        <p className="landing-subtitle">
          From Kiosk to your Phone. Order your favorites from anywhere and track your meal in real-time.
        </p>

        <div className="landing-cta" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', alignItems: 'center', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
          <Link to="/menu" className="btn btn-primary btn-block" id="start-order-btn">
            Start Your Order
          </Link>

          <Link to="/queue" className="btn btn-outline btn-block" id="view-queue-btn" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-glass)' }}>
            View Order Queue
          </Link>

          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="btn btn-outline btn-block"
              style={{ marginTop: 'var(--space-md)', borderColor: 'var(--color-primary)', color: 'var(--color-primary)', fontWeight: '700' }}
            >
              📥 Install App to Home Screen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
