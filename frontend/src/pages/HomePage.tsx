import { Link } from "react-router-dom";
import SearchFilters from "../components/SearchFilters";

const HomePage = () => {
  const handleSearch = (params: {
    query: string;
    categories: string[];
    brands: string[];
  }) => {
    console.log("Searching for:", params);
  };

  return (
    <div className="home__page">
      <SearchFilters onSearch={handleSearch} />
      <section className="home__content">
        <section className="home__intro">
          <h1>Find Your Perfect Gear</h1>
          <p>
            High-quality cameras, lenses, and accessories for every creator.
          </p>
        </section>

        <img
          src="/images/001.webp"
          alt="Featured camera product"
          className="home__hero-image"
        />
        <Link to="/products" className="home__hero-link">
          Start Shopping →
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
