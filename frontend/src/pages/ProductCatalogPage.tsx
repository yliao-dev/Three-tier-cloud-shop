import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import ProductCard from "../components/ProductCard";
import type { Product } from "../types/product";
import SearchFilters from "../components/SearchFilters";

const handleSearch = (params: {
  query: string;
  categories: string[];
  brands: string[];
}) => {
  console.log("Searching for:", params);
};

const fetchAllProducts = async (): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>("/products");
  return response.data;
};

const fetchBrands = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>("/products/brands");
  return response.data.sort();
};

const fetchCategories = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>("/products/categories");
  return response.data.sort();
};

const ProductCatalogPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(
    () => new Set<string>()
  );
  const [selectedBrands, setSelectedBrands] = useState(() => new Set<string>());

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: fetchAllProducts,
  });
  useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });
  useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    const categoryLabels = Array.from(selectedCategories).map((val) =>
      val.replace(/-/g, " ").toLowerCase()
    );
    const brandLabels = Array.from(selectedBrands).map((val) =>
      val.replace(/-/g, " ").toLowerCase()
    );

    return products.filter((product) => {
      const searchMatch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const categoryMatch =
        categoryLabels.length === 0 ||
        categoryLabels.includes(product.category.toLowerCase());
      const brandMatch =
        brandLabels.length === 0 ||
        brandLabels.includes(product.brand.toLowerCase());
      return searchMatch && categoryMatch && brandMatch;
    });
  }, [products, searchQuery, selectedCategories, selectedBrands]);

  return (
    <div className="catalog__page">
      <header className="catalog__header">
        <h1>All Products</h1>
        <p>Browse our curated selection of professional cameras and lenses.</p>
      </header>
      <SearchFilters onSearch={handleSearch} />
      <section className="catalog__product-grid">
        {isLoadingProducts ? (
          <p>Loading...</p>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </section>
    </div>
  );
};

export default ProductCatalogPage;
