import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { FiMenu, FiShoppingCart } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";
import { RiMenu2Fill } from "react-icons/ri";

const TopBar = () => {
  const { cart } = useCart();
  const cartItemCount =
    cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <header className="top-bar">
      {/* Left Aligned Items */}
      <div className="top-bar-left">
        <button
          className="top-bar-icon-button menu-widget"
          aria-label="Menu Button"
        >
          <RiMenu2Fill size={30} />
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
        <Link
          to="/dashboard"
          className="top-bar-icon-button profile-widget"
          aria-label="Profile Icon"
        >
          <CgProfile size={30} />
        </Link>

        <Link
          to="/cart"
          className="top-bar-icon-button cart-widget"
          aria-label="Shopping Cart"
        >
          <FiShoppingCart size={30} />
          {cartItemCount > 0 && (
            <span className="cart-badge">{cartItemCount}</span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
