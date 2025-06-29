import { Link } from "react-router-dom";
type ErrorPageProps = {
  code?: number;
  message?: string;
};

const ErrorPage = ({ code = 404, message }: ErrorPageProps) => {
  const defaultMessages: { [key: number]: string } = {
    404: "The page you are looking for does not exist.",
    500: "Something went wrong on our end. Please try again later.",
    401: "You are not authorized to view this page.",
    403: "You do not have permission to access this resource.",
  };

  const displayMessage =
    message || defaultMessages[code] || "An unexpected error occurred.";

  return (
    <div className="error-page">
      <div className="error-container">
        <h1 className="error-code">{code}</h1>
        <p>{displayMessage}</p>
        <Link to="/" className="error-home-link">
          Go to Homepage
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;
