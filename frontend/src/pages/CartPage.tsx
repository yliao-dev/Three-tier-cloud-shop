import { useQuery } from "@tanstack/react-query";
import { useCart } from "../hooks/useCart"; // Import the custom hook

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
}

const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch("/api/products");
  if (!response.ok) throw new Error("Network response was not ok");
  return response.json();
};

const CartPage = () => {
  // Use our custom hook to get all cart data and functions
  const { cart, isLoading: isCartLoading, removeItem } = useCart();
  // We still need to fetch all products to display their details
  const { data: products, isLoading: areProductsLoading } = useQuery<Product[]>(
    {
      queryKey: ["products"],
      queryFn: fetchProducts,
    }
  );

  if (isCartLoading || areProductsLoading) return <div>Loading Cart...</div>;
  if (!cart || !products) return <div>Could not load cart data.</div>;

  const cartItems = Object.entries(cart);
  let grandTotal = 0;
  const detailedCartItems = cartItems.map(([sku, quantityStr]) => {
    const product = products.find((p) => p.sku === sku);
    const quantity = parseInt(quantityStr, 10);
    const price = product ? product.price : 0;
    const lineTotal = price * quantity;
    grandTotal += lineTotal;
    return {
      sku,
      name: product?.name || "Product not found",
      quantity,
      price,
      lineTotal,
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {detailedCartItems.map((item) => (
                <tr key={item.sku}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>${item.lineTotal.toFixed(2)}</td>
                  <td>
                    {/* The button now calls the 'removeItem' function from the hook */}
                    <button onClick={() => removeItem(item.sku)}>Remove</button>
                  </td>
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
