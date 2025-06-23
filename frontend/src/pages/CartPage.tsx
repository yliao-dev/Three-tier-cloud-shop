import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

// The data returned from our Redis HGETALL is a map of strings
type CartData = {
  [productId: string]: string;
};

const CartPage = () => {
  // Get the token from our auth context to make an authenticated request
  const { token } = useAuth();

  // This async function will be called by react-query
  const fetchCart = async (): Promise<CartData> => {
    // If there's no token, we can't fetch a user-specific cart
    if (!token) {
      throw new Error("Authentication token not found.");
    }

    const response = await fetch("/api/cart", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch cart data.");
    }
    return response.json();
  };

  const { data, error, isLoading } = useQuery<CartData>({
    queryKey: ["cart"], // Unique key for this query
    queryFn: fetchCart,
    enabled: !!token, // The query will only run if a token exists
  });

  if (isLoading) return <div>Loading Cart...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const cartItems = data ? Object.entries(data) : [];

  return (
    <div className="card">
      <h2>Your Shopping Cart</h2>
      {cartItems.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Product SKU</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map(([productId, quantity]) => (
              <tr key={productId}>
                <td>{productId}</td>
                <td>{quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Your cart is empty.</p>
      )}
    </div>
  );
};

export default CartPage;
