import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

// Type for the product data from the catalog-service
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
}

// Type for the cart data from the cart-service (a map of SKU -> quantity)
type CartData = {
  [sku: string]: string;
};

// Fetch function for the product catalog
const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch("/api/products");
  if (!response.ok) throw new Error("Network response was not ok");
  return response.json();
};

const CartPage = () => {
  const { token } = useAuth();

  // Fetch function for the user's cart
  const fetchCart = async (): Promise<CartData> => {
    if (!token) throw new Error("Authentication token not found.");
    const response = await fetch("/api/cart", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch cart data.");
    return response.json();
  };

  // 1. First query: fetch the user's cart (SKUs and quantities)
  const { data: cartData, isLoading: isCartLoading } = useQuery<CartData>({
    queryKey: ["cart"],
    queryFn: fetchCart,
    enabled: !!token,
  });

  // 2. Second query: fetch all product details
  const { data: products, isLoading: areProductsLoading } = useQuery<Product[]>(
    {
      queryKey: ["products"],
      queryFn: fetchProducts,
    }
  );

  // 3. Handle combined loading state
  if (isCartLoading || areProductsLoading) return <div>Loading Cart...</div>;

  // Combine the two data sources to create a detailed cart view
  const cartItems = cartData ? Object.entries(cartData) : [];
  let grandTotal = 0;

  const detailedCartItems = cartItems.map(([sku, quantityStr]) => {
    const product = products?.find((p) => p.sku === sku);
    const quantity = parseInt(quantityStr, 10);
    const price = product ? product.price : 0;
    const lineTotal = price * quantity;
    grandTotal += lineTotal;

    return {
      sku: sku,
      name: product ? product.name : "Product not found",
      quantity: quantity,
      price: price,
      lineTotal: lineTotal,
    };
  });

  return (
    <div className="card">
      <h2>Your Shopping Cart</h2>
      {detailedCartItems.length > 0 ? (
        <>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {detailedCartItems.map((item) => (
                <tr key={item.sku}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>${item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Grand Total: ${grandTotal.toFixed(2)}</h3>
        </>
      ) : (
        <p>Your cart is empty.</p>
      )}
    </div>
  );
};

export default CartPage;
