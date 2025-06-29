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

const fetchPaginatedProducts = async (
  page: number
): Promise<PaginatedProductsResponse> => {
  const response = await apiClient.get<PaginatedProductsResponse>(
    `/products?page=${page}&limit=${ITEMS_PER_PAGE}`
  );
  return response.data;
};

const ProductCatalogPage = () => {
  const navigate = useNavigate();
  const { pageNumber } = useParams();

  const currentPage = parseInt(pageNumber || "1", 10);

  const { data, isLoading, error } = useQuery<PaginatedProductsResponse>({
    queryKey: ["products", currentPage],
    queryFn: () => fetchPaginatedProducts(currentPage),
    placeholderData: keepPreviousData,
  });

  const products = data?.products;
  const totalPages = data?.totalPages || 1;

  const handlePageChange = (page: number) => {
    navigate(`/products/page/${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (params: any) => {
    console.log("Search params changed:", params);
    // In the future, this will refetch data with new query parameters
    // e.g., navigate('/products/page/1?query=...&brand=...')
    handlePageChange(1);
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
        {products &&
          products.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
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
