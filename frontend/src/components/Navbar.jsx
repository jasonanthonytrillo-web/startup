import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { getItemCount } = useCart();
  const location = useLocation();
  const itemCount = getItemCount();

  // Don't show navbar on landing page
  if (location.pathname === '/') return null;

  return (
    <>
      <nav className="navbar" id="main-navbar">
        <div className="container navbar-inner">
          <div className="navbar-header">
            <Link to="/" className="navbar-logo">
              MK<span>Food</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Floating Cart Button */}
      {location.pathname === '/menu' && (
        <Link 
          to="/cart" 
          className="floating-cart-btn" 
          id="floating-cart-btn"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          {itemCount > 0 && (
            <span className="floating-cart-badge">
              {itemCount}
            </span>
          )}
        </Link>
      )}
    </>
  );
}
