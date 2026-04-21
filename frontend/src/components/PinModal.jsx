import React, { useState, useRef, useEffect } from 'react';

export default function PinModal({ isOpen, onClose, onSuccess, title, subtitle, error }) {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '', '', '']);
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (error) {
      setPin(['', '', '', '', '', '']);
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    }
  }, [error]);

  const handleChange = (index, value) => {
    if (value && isNaN(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.substring(value.length - 1);
    setPin(newPin);

    // Auto-focus next
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }

    // Auto-submit if full
    if (value && newPin.every(digit => digit !== '')) {
      onSuccess(newPin.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={onClose}>
      <div className="modal-content pin-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{title || 'Manager Authorization'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        <div className="modal-body">
          <p className="pin-hint">{subtitle || 'Please enter the 6-digit Manager PIN to authorize this action.'}</p>
          <div className="pin-grid">
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                type="password"
                inputMode="numeric"
                className={`pin-input ${error ? 'error' : ''}`}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                maxLength={1}
                autoComplete="new-password"
              />
            ))}
          </div>
          {error && (
            <p style={{ color: 'var(--color-danger)', textAlign: 'center', fontSize: '0.85rem', fontWeight: '700' }}>
              Invalid PIN. Access Denied.
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
