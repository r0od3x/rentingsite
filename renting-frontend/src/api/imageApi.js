import { API_URL } from "../config";

export const fetchPropertyImages = async (propertyId) => {
  const res = await fetch(
    `${API_URL}/api/image/property/${propertyId}`
  );
  return await res.json();
};
