import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { FiMenu, FiShoppingCart } from "react-icons/fi";

const TopBar = () => {
  const { cart } = useCart();
  const cartItemCount =
    cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <header className="top-bar">
      {/* Left Aligned Items */}
      <div className="top-bar-left">
        <button className="top-bar-icon-button" aria-label="Menu">
          <FiMenu size={24} />
        </button>
      </div>

      {/* Center Aligned Items */}
      <div className="top-bar-center">
        <Link to="/" className="shop-name">
          AuraLens
        </Link>
      </div>

      {/* Right Aligned Items */}
      <div className="top-bar-right">
        <Link to="/about" className="top-bar-link">
          About
        </Link>
        <Link
          to="/cart"
          className="top-bar-icon-button cart-widget"
          aria-label="Shopping Cart"
        >
          <FiShoppingCart size={24} />
          {cartItemCount > 0 && (
            <span className="cart-badge">{cartItemCount}</span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
