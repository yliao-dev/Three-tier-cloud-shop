import { useEffect, useState } from "react";

// Define a type for our API response for type safety
type HealthCheckResponse = {
  status: string;
  service: string;
};

function App() {
  const [backendMessage, setBackendMessage] =
    useState<HealthCheckResponse | null>(null);

  useEffect(() => {
    fetch("/api/users/health")
      .then((response) => {
        // If the server responds with an error status (like 500), this is not OK.
        if (!response.ok) {
          // Throw an error to be caught by the .catch block.
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Only attempt to parse JSON if the response was successful.
        return response.json();
      })
      .then((data) => setBackendMessage(data))
      .catch((error) => {
        // This will now log "Error fetching data: Error: HTTP error! status: 500"
        console.error("Error fetching data:", error);
      });
  }, []);
  return (
    <>
      <h1>Hellow world</h1>
      <div>
        <h2>Message from Backend:</h2>
        {/* Display the data once it's fetched */}
        {backendMessage ? (
          <pre>{JSON.stringify(backendMessage, null, 2)}</pre>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </>
  );
}

export default App;
