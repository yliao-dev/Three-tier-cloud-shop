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

const ProductCatalogPage = () => {
  // Fetching products remains the same
  const { data, error, isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // Use our new custom hook to get the addItem function
  const { addItem } = useCart();

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div>Error fetching products: {error.message}</div>;

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
            {/* The button now calls the 'addItem' function from the hook */}
            <button onClick={() => addItem(product.sku)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCatalogPage;
