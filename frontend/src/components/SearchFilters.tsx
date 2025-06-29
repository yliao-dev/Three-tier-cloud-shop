import { useMemo, useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import FilterSelect from "./FilterSelect";

interface Props {
  onSearch: (params: {
    query: string;
    category: string | null;
    brand: string | null;
  }) => void;
}

const fetchBrands = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>("/products/brands");
  return response.data.sort();
};

const fetchCategories = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>("/products/categories");
  return response.data.sort();
};

const formatOptions = (items: string[] | undefined) => {
  if (!items) return [];
  return items.map((item) => ({
    value: item.toLowerCase().replace(/ /g, "-"),
    label: item,
  }));
};

const SearchFilters = ({ onSearch }: Props) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const { data: brands, isLoading: isLoadingBrands } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const brandOptions = useMemo(() => formatOptions(brands), [brands]);
  const categoryOptions = useMemo(
    () => formatOptions(categories),
    [categories]
  );

  // This useEffect hook automatically triggers a search when a filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch({
        query: searchQuery,
        category: selectedCategory,
        brand: selectedBrand,
      });
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedBrand, onSearch]);

  return (
    <section className="home__search-bar">
      <div className="home__filter-container">
        <FilterSelect
          placeholder="Category"
          options={categoryOptions}
          value={selectedCategory}
          onChange={setSelectedCategory}
          isLoading={isLoadingCategories}
        />
      </div>

      <div className="home__filter-container">
        <FilterSelect
          placeholder="Brand"
          options={brandOptions}
          value={selectedBrand}
          onChange={setSelectedBrand}
          isLoading={isLoadingBrands}
        />
      </div>

      <div className="home__search-input-container">
        <input
          type="text"
          className="home__search-input"
          placeholder="Search for a product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          className="home__search-button"
          onClick={() =>
            onSearch({
              query: searchQuery,
              category: selectedCategory,
              brand: selectedBrand,
            })
          }
        >
          <FiSearch size="1.25rem" />
        </button>
      </div>
    </section>
  );
};

export default SearchFilters;
