import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import type { CartItemDetail } from "../types/cart";
import { useCart } from "../hooks/useCart";

type CartItemCardProps = {
  item: CartItemDetail;
};

const CartItemCard = ({ item }: CartItemCardProps) => {
  const { updateItem, removeItem, isUpdatingItem, isRemovingItem } = useCart();

  return (
    <div className="cart-item-card">
      <div className="cart-item__image">
        <img src="/images/placeholder.webp" alt={item.name} />
      </div>
      <div className="cart-item__details">
        <div className="cart-item__info">
          <p className="cart-item__brand">{item.sku}</p>
          <h3 className="cart-item__name">{item.name}</h3>
        </div>
        <div className="cart-item__quantity-controls">
          <button
            onClick={() =>
              updateItem({ productSku: item.sku, quantity: item.quantity - 1 })
            }
            disabled={isUpdatingItem}
          >
            <FiMinus />
          </button>
          <span>{item.quantity}</span>
          <button
            onClick={() =>
              updateItem({ productSku: item.sku, quantity: item.quantity + 1 })
            }
            disabled={isUpdatingItem}
          >
            <FiPlus />
          </button>
        </div>
      </div>
      <div className="cart-item__actions">
        <p className="cart-item__price">${item.lineTotal.toFixed(2)}</p>
        <button
          className="cart-item__remove-button"
          onClick={() => removeItem(item.sku)}
          disabled={isRemovingItem}
          aria-label="Remove item"
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
};

export default CartItemCard;
