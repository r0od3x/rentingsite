// Base URL of the ASP.NET Core API. Override with REACT_APP_API_URL in a .env file.
export const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:5062").replace(/\/$/, "");
