import axios from "axios";

const baseUrl = process.env.FASTAPI_URL || "http://localhost:5000";

const fastApiClient = axios.create({
  baseURL: baseUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Optional: attach interceptors for logging or auth
fastApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("FastAPI error:", error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default fastApiClient;
