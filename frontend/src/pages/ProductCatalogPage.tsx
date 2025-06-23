import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext"; // 1. Import useAuth

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
}

const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch("/api/products");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

const ProductCatalogPage = () => {
  const { data, error, isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // 2. Get the token from the authentication context
  const { token } = useAuth();

  const handleAddToCart = async (productId: string) => {
    // 3. Check if the user is logged in before making the request
    if (!token) {
      alert("You must be logged in to add items to your cart.");
      // In a real app, you might redirect to login: navigate("/login");
      return;
    }

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 4. Include the JWT in the Authorization header
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: productId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add item to cart.");
      }

      alert(`Product ${productId} added to cart!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "An unknown error occurred.");
    }
  };

  if (isLoading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error fetching products: {error.message}</div>;
  }

  return (
    <div className="card">
      <h2>Product Catalog</h2>
      <div className="product-list">
        {data?.map((product) => (
          <div
            key={product.id}
            className="product-item"
            style={{
              borderBottom: "1px solid #ccc",
              marginBottom: "1rem",
              paddingBottom: "1rem",
            }}
          >
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>
              <strong>Price:</strong> ${product.price.toFixed(2)}
            </p>
            <p>
              <small>SKU: {product.sku}</small>
            </p>
            <button onClick={() => handleAddToCart(product.sku)}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCatalogPage;
