import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Queue from './pages/Queue';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Track from './pages/Track';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalNotification from './components/GlobalNotification';
import StockLimitToast from './components/StockLimitToast';

function App() {
  return (
    <CartProvider>
      <Router>
        <Navbar />
        <GlobalNotification />
        <StockLimitToast />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track" element={<Track />} />
            <Route path="/order/:orderNumber" element={<OrderConfirmation />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Routes>
        </main>
      </Router>
    </CartProvider>
  );
}

export default App;
