import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useAuthContext } from "../context/AuthContext";
import { FiLogOut, FiSettings, FiShoppingCart } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";
import { RiMenu2Fill, RiCloseFill, RiHistoryFill } from "react-icons/ri";

const TopBar = () => {
  const { cart } = useCart();
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const cartItemCount =
    cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate("/");
  };

  // Close profile dropdown if clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileRef]);

  return (
    <>
      {/* Overlay for side panel */}
      <div
        className={`overlay ${isPanelOpen ? "show" : ""}`}
        onClick={() => setIsPanelOpen(false)}
      ></div>

      {/* Side Panel */}
      <div className={`side-panel ${isPanelOpen ? "open" : ""}`}>
        <button
          onClick={() => setIsPanelOpen(false)}
          className="close-panel-button"
        >
          <RiCloseFill size={28} />
        </button>
        <nav className="panel-nav">
          <Link to="/dashboard" onClick={() => setIsPanelOpen(false)}>
            Dashboard
          </Link>
          <Link to="/products" onClick={() => setIsPanelOpen(false)}>
            Products
          </Link>

          <Link to="/products" onClick={() => setIsPanelOpen(false)}>
            Products
          </Link>
        </nav>
      </div>

      {/* Main Top Bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <button
            className="top-bar-icon-button menu-widget"
            aria-label="Menu Button"
            onClick={() => setIsPanelOpen(true)}
          >
            <RiMenu2Fill size={30} />
          </button>
        </div>

        <div className="top-bar-center">
          <Link to="/" className="shop-name">
            AuraLens
          </Link>
        </div>

        <div className="top-bar-right">
          {user ? (
            <div className="profile-widget" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="top-bar-icon-button"
                aria-label="Profile"
              >
                <CgProfile size={30} />
              </button>
              <div
                className={`profile-dropdown ${isProfileOpen ? "open" : ""}`}
              >
                <div className="profile-dropdown-header">
                  {/* The new icon replaces the img tag */}
                  <img
                    src={`https://i.pravatar.cc/1?u=${user.email}`}
                    alt="User Avatar"
                    className="profile-avatar"
                  />
                  <div className="user-info">
                    <span className="name">
                      {user.username || "Valued Customer"}
                    </span>
                    <span className="title">{user.email}</span>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  className="dropdown-item"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <CgProfile className="item-icon" />
                  View Profile
                </Link>

                <Link
                  to="/orders"
                  className="dropdown-item"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <RiHistoryFill className="item-icon" />
                  Order History
                </Link>

                <Link
                  to="/settings"
                  className="dropdown-item"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <FiSettings className="item-icon" />
                  Account Settings
                </Link>
                <div className="dropdown-separator"></div>
                <button onClick={handleLogout} className="dropdown-item">
                  <FiLogOut className="item-icon" />
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <Link to="/register" className="top-bar-link">
              Sign Up
            </Link>
          )}

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
    </>
  );
};

export default TopBar;
