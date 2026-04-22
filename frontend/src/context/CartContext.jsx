import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';

const CartContext = createContext();

const STORAGE_KEY = 'mk_food_cart';

const initialState = {
  items: [],
};

function cartReducer(state, action) {
  let newState;

  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) => item.id === action.payload.id
      );

      if (existingIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + 1,
        };
        newState = { ...state, items: updatedItems };
      } else {
        newState = {
          ...state,
          items: [...state.items, { ...action.payload, quantity: 1 }],
        };
      }
      break;
    }

    case 'REMOVE_ITEM':
      newState = {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
      break;

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        newState = {
          ...state,
          items: state.items.filter((item) => item.id !== id),
        };
      } else {
        newState = {
          ...state,
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        };
      }
      break;
    }

    case 'CLEAR_CART':
      newState = { ...state, items: [] };
      break;

    case 'SYNC_STOCK': {
      const stockMap = {};
      action.payload.forEach(p => { stockMap[p.id] = p.stock; });
      newState = {
        ...state,
        items: state.items.map(item => {
          const latestStock = stockMap[item.id];
          if (latestStock !== undefined) {
            return { ...item, stock: latestStock };
          }
          return item;
        }),
      };
      break;
    }

    default:
      return state;
  }

  return newState;
}

function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load cart from storage:', e);
  }
  return initialState;
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, null, loadCartFromStorage);
  const [stockWarning, setStockWarning] = useState(null);
  const warningTimerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const showStockWarning = useCallback((productName, stock) => {
    // Clear any existing timer
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    setStockWarning({ productName, stock, key: Date.now() });
    warningTimerRef.current = setTimeout(() => {
      setStockWarning(null);
      warningTimerRef.current = null;
    }, 3500);
  }, []);

  const dismissStockWarning = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    setStockWarning(null);
  }, []);

  const addToCart = (product) => {
    const existingItem = state.items.find(item => item.id === product.id);
    const currentQty = existingItem ? existingItem.quantity : 0;

    if (currentQty + 1 > product.stock) {
      showStockWarning(product.name, product.stock);
      return;
    }
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId, quantity) => {
    const item = state.items.find(i => i.id === productId);
    if (item && quantity > item.stock) {
      showStockWarning(item.name, item.stock);
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const syncStock = (products) => {
    dispatch({ type: 'SYNC_STOCK', payload: products });
  };

  const getItemCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotal = () => {
    return state.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        syncStock,
        getItemCount,
        getTotal,
        stockWarning,
        dismissStockWarning,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
