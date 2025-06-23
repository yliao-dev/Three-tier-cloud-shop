import { useQuery } from "@tanstack/react-query";

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

  // This new function handles the "Add to Cart" button click
  const handleAddToCart = async (productId: string) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: productId,
          quantity: 1, // Add one item at a time
        }),
      });

      if (!response.ok) {
        // If the server returns an error, throw an error to be caught below
        throw new Error("Failed to add item to cart.");
      }

      // On success, show a confirmation message
      alert(`Product ${productId} added to cart!`);
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("An unknown error occurred.");
      }
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

            {/* Add the button here, calling the handler with the product's SKU */}
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
