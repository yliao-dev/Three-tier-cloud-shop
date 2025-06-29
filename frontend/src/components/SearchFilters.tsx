import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import FilterSelect from "./FilterSelect";

interface SearchParams {
  query: string;
  category: string | null;
  brand: string | null;
}

interface Props {
  onSearch: (params: SearchParams) => void;
  initialState?: Partial<SearchParams>;
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
    value: item,
    label: item,
  }));
};

const SearchFilters = ({ onSearch, initialState = {} }: Props) => {
  const [searchQuery, setSearchQuery] = useState(initialState.query || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialState.category || null
  );
  const [selectedBrand, setSelectedBrand] = useState<string | null>(
    initialState.brand || null
  );

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

  // This function is now only called by user actions.
  const handleTriggerSearch = () => {
    onSearch({
      query: searchQuery,
      category: selectedCategory,
      brand: selectedBrand,
    });
  };

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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleTriggerSearch();
            }
          }}
        />
        <button className="home__search-button" onClick={handleTriggerSearch}>
          <FiSearch size="1.25rem" />
        </button>
      </div>
    </section>
  );
};

export default SearchFilters;
