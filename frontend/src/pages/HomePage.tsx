import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="home__page">
      <section className="home__content">
        <section className="hero-container">
          {/* The background image */}
          <img
            src="/images/001.webp"
            alt="Featured camera product"
            className="hero-image"
          />

          {/* A div to hold all the content that goes on top */}
          <div className="hero-content">
            <h1>Find Your Perfect Gear</h1>
            <p>
              High-quality cameras, lenses, and accessories for every creator.
            </p>
            <Link to="/products" className="hero-link">
              Start Shopping →
            </Link>
          </div>
        </section>
      </section>
    </div>
  );
};

export default HomePage;
