
// const API_BASE_URL = "http://localhost:5000";
const API_BASE_URL = "https://sortars.com";

export const resolveApiUrl = (path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
};

export default API_BASE_URL;
