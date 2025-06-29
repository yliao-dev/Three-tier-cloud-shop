import type { Product } from "../types/product";
import { useCart } from "../hooks/useCart";
import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem, isAddingItem } = useCart();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    if (user) {
      addItem(product.sku);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="product-card">
      <div className="product-card__image-container">
        <img
          src="/images/placeholder.webp"
          alt={product.name}
          className="product-card__image"
        />
      </div>

      <div className="product-card__info">
        <div>
          <p className="product-card__category">{product.category}</p>
          <h3 className="product-card__name">{product.name}</h3>
          <p className="product-card__description">{product.description}</p>
        </div>
        <div className="product-card__actions">
          <p className="product-card__price">${product.price.toFixed(2)}</p>
          <button
            className="product-card__add-button"
            onClick={handleAddToCart}
            disabled={isAddingItem}
            aria-label="Add to Cart"
          >
            <FiPlus />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
