export const fetchPropertyImages = async (propertyId) => {
  const res = await fetch(
    `http://localhost:5062/api/image/property/${propertyId}`
  );
  return await res.json();
};
