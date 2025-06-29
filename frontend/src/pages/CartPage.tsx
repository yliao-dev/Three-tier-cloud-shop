import { useCart } from "../hooks/useCart";
import CartItemCard from "../components/CartItemCard";

const CartPage = () => {
  const { cart, isLoading, clearCart, checkout, isCheckingOut } = useCart();

  if (isLoading) return <div>Loading Cart...</div>;

  if (!cart || cart.length === 0) {
    return (
      <div className="cart-page-empty">
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
      </div>
    );
  }

  const grandTotal = cart.reduce((total, item) => total + item.lineTotal, 0);

  return (
    <div className="cart-page">
      <div className="cart-items-column">
        <h1>Shopping Cart</h1>
        {cart.map((item) => (
          <CartItemCard key={item.sku} item={item} />
        ))}
        <div className="cart-footer-actions">
          <button onClick={() => clearCart()} className="clear-cart-button">
            Clear Cart
          </button>
        </div>
      </div>

      <div className="cart-summary-column">
        <div className="summary-card">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row total-row">
            <span>Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={() => checkout()}
            disabled={isCheckingOut}
            className="checkout-button"
          >
            {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
