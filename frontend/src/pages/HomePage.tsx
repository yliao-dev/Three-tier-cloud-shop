import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to the Cloud Shop</h1>
      <p>Please register to continue.</p>
      <nav>
        <Link to="/register">Go to Registration</Link>
      </nav>
    </div>
  );
};

export default HomePage;
