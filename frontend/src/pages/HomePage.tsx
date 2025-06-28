import { useMemo, useState } from "react";
import Select from "react-select";
import { FiSearch } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";

// --- API Fetching Functions ---
const fetchBrands = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>("/products/brands");
  return response.data.sort(); // Sort alphabetically
};

const fetchCategories = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>("/products/categories");
  return response.data.sort(); // Sort alphabetically
};

// --- Helper function to format data for react-select ---
const formatOptions = (items: string[] | undefined) => {
  if (!items) return [];
  return items.map((item) => ({
    value: item.toLowerCase().replace(/ /g, "-"),
    label: item,
  }));
};

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // --- Fetch dynamic data using React Query ---
  const { data: brands, isLoading: isLoadingBrands } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // --- Transform the data for the Select components ---
  // useMemo prevents re-calculating this on every render unless the source data changes.
  const brandOptions = useMemo(() => formatOptions(brands), [brands]);
  const categoryOptions = useMemo(
    () => formatOptions(categories),
    [categories]
  );

  const handleSearch = () => {
    // This is where you would trigger the search logic
    console.log("Searching for:", {
      query: searchQuery,
      // You would also get selected categories and brands from state here
    });
  };

  return (
    <div className="home__page">
      <div className="home__intro">
        <h1>Find Your Perfect Gear</h1>
        <p>High-quality cameras, lenses, and accessories for every creator.</p>
      </div>

      {/* --- New Search & Filter Bar --- */}
      <div className="search-filter-bar">
        <div className="filter-select category-select">
          <Select
            isMulti
            options={categoryOptions}
            placeholder="Select Category..."
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={isLoadingCategories}
          />
        </div>
        <div className="filter-select brand-select">
          <Select
            isMulti
            options={brandOptions}
            placeholder="Select Brand..."
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={isLoadingBrands}
          />
        </div>
        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search for a product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="search-button" onClick={handleSearch}>
            <FiSearch size={20} />
          </button>
        </div>
      </div>

      <div className="home__content">{/* Product grid will go here */}</div>
    </div>
  );
};

export default HomePage;
