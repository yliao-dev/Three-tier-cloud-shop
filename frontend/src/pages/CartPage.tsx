import { useQuery } from "@tanstack/react-query";
import { useCart } from "../hooks/useCart"; // We will use more functions from this hook
import apiClient from "../api/client"; // Use our central API client
import type { Product } from "../types/product";

// Updated fetch function using our apiClient
const fetchProducts = async (): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>("/products");
  return response.data;
};

const CartPage = () => {
  // Destructure all the functions and state we now need from our custom hook
  const {
    cart,
    isLoading: isCartLoading,
    removeItem,
    updateItem,
    clearCart,
    checkout,
    isCheckingOut,
    isUpdatingItem,
  } = useCart();

  // Fetch all products to display their details (name, price)
  const { data: products, isLoading: areProductsLoading } = useQuery<Product[]>(
    {
      queryKey: ["products"],
      queryFn: fetchProducts,
    }
  );

  if (isCartLoading || areProductsLoading) return <div>Loading Cart...</div>;

  // The cart is now an array, so we check its length
  if (!cart || cart.length === 0) {
    return (
      <div className="card">
        <h2>Your Shopping Cart</h2>
        <p>Your cart is empty.</p>
      </div>
    );
  }

  // --- NEW: Refactored Data Transformation Logic ---
  // This logic now correctly joins the cart array with the products array.
  let grandTotal = 0;
  const detailedCartItems = cart.map((cartItem) => {
    const product = products?.find((p) => p.id === cartItem.productId);
    const price = product ? product.price : 0;
    const lineTotal = price * cartItem.quantity;
    grandTotal += lineTotal;
    return {
      productId: cartItem.productId,
      sku: cartItem.sku,
      name: product?.name || "Product not found",
      quantity: cartItem.quantity,
      price: price,
      lineTotal: lineTotal,
    };
  });
  // detailedCartItems.forEach((item, index) => {
  //   console.log(`Item ${index}:`, item.sku);
  // });
  // ---

  return (
    <div className="card">
      <h2>Your Shopping Cart</h2>
      <>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {detailedCartItems.map((item) => (
              <tr key={item.sku}>
                <td>{item.name}</td>
                <td>
                  <button
                    onClick={() =>
                      updateItem({
                        productSku: item.sku,
                        quantity: item.quantity - 1,
                      })
                    }
                    disabled={isUpdatingItem}
                  >
                    -
                  </button>
                  {item.quantity}
                  <button
                    onClick={() =>
                      updateItem({
                        productSku: item.sku,
                        quantity: item.quantity + 1,
                      })
                    }
                    disabled={isUpdatingItem}
                  >
                    +
                  </button>
                </td>
                <td>${item.price.toFixed(2)}</td>
                <td>${item.lineTotal.toFixed(2)}</td>
                <td>
                  <button onClick={() => removeItem(item.sku)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>Grand Total: ${grandTotal.toFixed(2)}</h3>
        <div className="cart-actions">
          <button onClick={() => clearCart()} className="secondary">
            Clear Cart
          </button>
          <button onClick={() => checkout()} disabled={isCheckingOut}>
            {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
          </button>
        </div>
      </>
    </div>
  );
};

export default CartPage;
