import { useQuery } from "@tanstack/react-query";

// Define the shape of a single product, matching the backend model
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
}

// This async function will be called by react-query to fetch the data
const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch("/api/products");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

const ProductCatalogPage = () => {
  // Use the useQuery hook to fetch, cache, and manage the data
  const { data, error, isLoading } = useQuery<Product[]>({
    queryKey: ["products"], // A unique key for this query
    queryFn: fetchProducts, // The function that will fetch the data
  });

  // 1. Render a loading state
  if (isLoading) {
    return <div>Loading products...</div>;
  }

  // 2. Render an error state
  if (error) {
    return <div>Error fetching products: {error.message}</div>;
  }

  // 3. Render the success state
  return (
    <div className="card">
      <h2>Product Catalog</h2>
      <div className="product-list">
        {data?.map((product) => (
          <div key={product.id} className="product-item">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>
              <strong>Price:</strong> ${product.price.toFixed(2)}
            </p>
            <p>
              <small>SKU: {product.sku}</small>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCatalogPage;
