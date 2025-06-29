import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import ProductCard from "../components/ProductCard";
import type { Product } from "../types/product";
import SearchFilters from "../components/SearchFilters";
import Pagination from "../components/Pagination";

const ITEMS_PER_PAGE = 20;

interface PaginatedProductsResponse {
  products: Product[];
  totalPages: number;
  currentPage: number;
}

interface SearchState {
  query: string;
  category: string | null;
  brand: string | null;
}

const fetchProducts = async (
  page: number,
  params: SearchState
): Promise<PaginatedProductsResponse> => {
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(ITEMS_PER_PAGE),
  });

  if (params.query) {
    queryParams.append("search", params.query);
  }
  if (params.brand) {
    queryParams.append("brand", params.brand);
  }
  if (params.category) {
    queryParams.append("category", params.category);
  }

  const requestUrl = `/products?${queryParams.toString()}`;

  // --- LOG THE API REQUEST URL ---
  console.log("Making API request to:", requestUrl);
  // ---

  const response = await apiClient.get<PaginatedProductsResponse>(requestUrl);
  return response.data;
};

const ProductCatalogPage = () => {
  const navigate = useNavigate();
  const { pageNumber } = useParams();

  const [searchState, setSearchState] = useState<SearchState>({
    query: "",
    category: null,
    brand: null,
  });

  const currentPage = parseInt(pageNumber || "1", 10);

  // --- LOG THE REACT QUERY KEY ---
  const queryKey = ["products", currentPage, searchState];
  console.log("React Query Key:", queryKey);
  // ---

  const { data, isLoading, error } = useQuery<PaginatedProductsResponse>({
    queryKey: queryKey, // Use the key we just logged
    queryFn: () => fetchProducts(currentPage, searchState),
    placeholderData: keepPreviousData,
  });

  const products = data?.products;
  const totalPages = data?.totalPages || 1;

  const handlePageChange = (page: number) => {
    navigate(`/products/page/${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (params: SearchState) => {
    setSearchState(params);
    if (currentPage !== 1) {
      navigate("/products/page/1");
    }
  };

  return (
    <div className="catalog__page">
      <header className="catalog__header">
        <h1>All Products</h1>
        <p>Browse our curated selection of professional cameras and lenses.</p>
      </header>

      <SearchFilters onSearch={handleSearch} />

      <section className="catalog__product-grid">
        {isLoading && <p>Loading...</p>}
        {error && <p>Error fetching products.</p>}

        {products && products.length > 0
          ? products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          : !isLoading && <p>No products found matching your criteria.</p>}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default ProductCatalogPage;
