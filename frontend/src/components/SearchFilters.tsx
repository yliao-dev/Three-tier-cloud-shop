// src/components/SearchFilters.tsx
import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import CheckboxDropdown from "./CheckboxDropdown";

interface Props {
  onSearch: (params: {
    query: string;
    categories: string[];
    brands: string[];
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
  const [selectedCategories, setSelectedCategories] = useState(
    () => new Set<string>()
  );
  const [selectedBrands, setSelectedBrands] = useState(() => new Set<string>());

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

  const handleSearch = () => {
    onSearch({
      query: searchQuery,
      categories: Array.from(selectedCategories),
      brands: Array.from(selectedBrands),
    });
  };

  return (
    <section className="home__search-bar">
      <div className="home__filter-container">
        <CheckboxDropdown
          placeholder="Category"
          options={categoryOptions}
          selected={selectedCategories}
          onChange={setSelectedCategories}
          isLoading={isLoadingCategories}
        />
      </div>

      <div className="home__filter-container">
        <CheckboxDropdown
          placeholder="Brand"
          options={brandOptions}
          selected={selectedBrands}
          onChange={setSelectedBrands}
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
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="home__search-button" onClick={handleSearch}>
          <FiSearch size={20} />
        </button>
      </div>
    </section>
  );
};

export default SearchFilters;
