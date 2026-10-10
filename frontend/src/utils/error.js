export const getErrorMessage = (error) => {
  const data = error.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  return Object.values(data).flat().join(" ");
};
