import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getOrder } from '../services/api';
import { useLocation } from 'react-router-dom';

// Generate a pleasant notification chime using Web Audio API
function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Create a pleasant 3-note ascending chime
    const notes = [
      { freq: 587.33, start: 0, duration: 0.18 },    // D5
      { freq: 739.99, start: 0.2, duration: 0.18 },   // F#5
      { freq: 880.00, start: 0.4, duration: 0.35 },   // A5
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.3, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    });

    // Play a second chime after a short pause for emphasis
    setTimeout(() => {
      try {
        const ctx2 = new AudioCtx();
        const now2 = ctx2.currentTime;

        const repeatNotes = [
          { freq: 587.33, start: 0, duration: 0.15 },
          { freq: 739.99, start: 0.18, duration: 0.15 },
          { freq: 880.00, start: 0.36, duration: 0.4 },
        ];

        repeatNotes.forEach(({ freq, start, duration }) => {
          const osc = ctx2.createOscillator();
          const gain = ctx2.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now2 + start);

          gain.gain.setValueAtTime(0, now2 + start);
          gain.gain.linearRampToValueAtTime(0.25, now2 + start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now2 + start + duration);

          osc.connect(gain);
          gain.connect(ctx2.destination);

          osc.start(now2 + start);
          osc.stop(now2 + start + duration + 0.05);
        });
      } catch (e) {}
    }, 900);
  } catch (e) {
    console.warn('Could not play notification sound:', e);
  }
}

// Attempt vibration with multiple patterns for reliability
function triggerVibration() {
  if ('vibrate' in navigator) {
    try {
      // Strong vibration pattern: buzz-pause-buzz-pause-long buzz
      navigator.vibrate([300, 150, 300, 150, 500]);
    } catch (e) {}
  }
}

export default function GlobalNotification() {
  const [showServingModal, setShowServingModal] = useState(false);
  const [currentOrderNum, setCurrentOrderNum] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const pollingRef = useRef(null);
  const pendingNotificationRef = useRef(false);
  const location = useLocation();

  // Track user interaction — needed for Audio API and Vibration on mobile
  useEffect(() => {
    const markInteracted = () => {
      setHasInteracted(true);
      // If there's a pending notification waiting for interaction, fire it now
      if (pendingNotificationRef.current) {
        pendingNotificationRef.current = false;
        fireNotificationEffects();
      }
    };

    const events = ['touchstart', 'click', 'keydown', 'scroll'];
    events.forEach(e => document.addEventListener(e, markInteracted, { once: false, passive: true }));

    return () => {
      events.forEach(e => document.removeEventListener(e, markInteracted));
    };
  }, []);

  useEffect(() => {
    const checkAndStartPolling = () => {
      const lastOrder = localStorage.getItem('last_order_number');
      
      // Don't poll if we are on the Admin page
      if (location.pathname.startsWith('/admin')) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        return;
      }

      if (lastOrder && !pollingRef.current) {
        setCurrentOrderNum(lastOrder);
        startPolling(lastOrder);
      } else if (!lastOrder && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    checkAndStartPolling();

    // Re-check on every location change
    return () => {
      // Don't clear interval here, let it run until app unmount or admin path
    };
  }, [location.pathname]);

  const fireNotificationEffects = useCallback(() => {
    playNotificationSound();
    triggerVibration();
    // Vibrate again after a second for emphasis
    setTimeout(() => triggerVibration(), 1200);
  }, []);

  const startPolling = (orderNum) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    pollingRef.current = setInterval(async () => {
      try {
        const response = await getOrder(orderNum);
        const order = response.data.data;
        
        const notificationKey = `notified_serving_${orderNum}`;
        const hasBeenNotified = sessionStorage.getItem(notificationKey);

        if (order.status === 'serving' && !hasBeenNotified) {
          triggerNotification();
          sessionStorage.setItem(notificationKey, 'true');
        }
        
        // If order is completed or cancelled, stop polling
        if (['completed', 'cancelled'].includes(order.status)) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } catch (e) {
        // If order not found or error, stop polling to avoid spam
        if (e.response?.status === 404) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }, 10000); // Poll every 10 seconds
  };

  const triggerNotification = () => {
    setShowServingModal(true);
    
    if (hasInteracted) {
      fireNotificationEffects();
    } else {
      // Queue it — will fire on next user interaction
      pendingNotificationRef.current = true;
    }
  };

  if (!showServingModal) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 99999, background: 'rgba(0,0,0,0.7)' }}>
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: 'var(--space-2xl) var(--space-xl)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)', animation: 'bounceIn 0.6s ease' }}>🍴</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: 'var(--space-sm)' }}>Order is Ready!</h2>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', marginBottom: 'var(--space-xl)' }}>
          Your order is now serving. 
          Please show your order number at the counter to receive your order.
        </p>
        <button 
          className="btn btn-primary btn-lg btn-block" 
          onClick={() => setShowServingModal(false)}
          style={{ padding: 'var(--space-md)' }}
        >
          I'm going now!
        </button>
      </div>
    </div>
  );
}
