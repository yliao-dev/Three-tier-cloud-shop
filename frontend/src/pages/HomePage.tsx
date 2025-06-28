import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import CheckboxDropdown from "../components/CheckboxDropdown"; // Import the new component

// --- API Fetching Functions (unchanged) ---
const fetchBrands = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>("/products/brands");
  return response.data.sort();
};

const fetchCategories = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>("/products/categories");
  return response.data.sort();
};

// --- Helper function (unchanged) ---
const formatOptions = (items: string[] | undefined) => {
  if (!items) return [];
  return items.map((item) => ({
    value: item.toLowerCase().replace(/ /g, "-"),
    label: item,
  }));
};

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  // State to hold the selected filter values (now using a Set)
  const [selectedCategories, setSelectedCategories] = useState(
    () => new Set<string>()
  );
  const [selectedBrands, setSelectedBrands] = useState(() => new Set<string>());

  // --- Fetch dynamic data (unchanged) ---
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
    console.log("Searching for:", {
      query: searchQuery,
      categories: Array.from(selectedCategories), // Convert Set to Array for logging/API call
      brands: Array.from(selectedBrands),
    });
  };

  return (
    <div className="home__page">
      <div className="home__intro">
        <h1>Find Your Perfect Gear</h1>
        <p>High-quality cameras, lenses, and accessories for every creator.</p>
      </div>

      <div className="home__search-bar">
        {/* Category Select */}
        <div className="home__filter-container">
          <CheckboxDropdown
            placeholder="Category"
            options={categoryOptions}
            selected={selectedCategories}
            onChange={setSelectedCategories}
            isLoading={isLoadingCategories}
          />
        </div>

        {/* Brand Select */}
        <div className="home__filter-container">
          <CheckboxDropdown
            placeholder="Brand"
            options={brandOptions}
            selected={selectedBrands}
            onChange={setSelectedBrands}
            isLoading={isLoadingBrands}
          />
        </div>

        {/* Text Search Input */}
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
      </div>

      <div className="home__content">{/* Product grid will go here */}</div>
    </div>
  );
};

export default HomePage;
