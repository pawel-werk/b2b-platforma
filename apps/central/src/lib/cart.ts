"use client";
import { useState, useEffect } from 'react';

export function getCart(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  return JSON.parse(localStorage.getItem('b2b_cart') || '{}');
}

export function addToCart(id: string, qty: number) {
  const cart = getCart();
  cart[id] = (cart[id] || 0) + qty;
  localStorage.setItem('b2b_cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cart_update'));
}

export function useCartCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => {
      const cart = getCart();
      const total = Object.values(cart).reduce((a, b) => a + b, 0);
      setCount(total);
    };
    update();
    window.addEventListener('cart_update', update);
    return () => window.removeEventListener('cart_update', update);
  }, []);
  return count;
}
