import { Link } from "react-router-dom";

type ErrorPageProps = {
  code?: number;
  message?: string;
};

export const renderError = (code: number, message: string) => (
  <ErrorPage code={code} message={message} />
);

const ErrorPage = ({ code = 404, message }: ErrorPageProps) => {
  const defaultMessage = {
    404: "This page does not exist.",
    500: "Something went wrong on our end.",
  };

  return (
    <section className="text-center py-10">
      <button className="text-yellow-400 text-6xl mb-4 mx-auto" />
      <h1 className="text-3xl font-bold mb-2">{code} Error</h1>
      <p className="mb-4 text-lg">
        {message ||
          defaultMessage[code as keyof typeof defaultMessage] ||
          "An unexpected error occurred."}
      </p>
      <Link
        to="/"
        className="text-blue-600 hover:underline underline-offset-2 text-base"
      >
        Go Back Home
      </Link>
    </section>
  );
};

export default ErrorPage;
