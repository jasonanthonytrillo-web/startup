import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠', path: '/' },
    { id: 'menu', label: 'Menu', icon: '📋', path: '/menu' },
    { id: 'track', label: 'Track', icon: '🔍', path: '/track' },
    { id: 'cart', label: 'Cart', icon: '🛒', path: '/cart' },
  ];

  // Don't show on admin or login pages
  const isHidden = location.pathname.startsWith('/admin') || location.pathname === '/login';
  if (isHidden) return null;

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <div 
            key={item.id} 
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <div className="nav-item-content">
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
