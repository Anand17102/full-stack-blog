import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const publicApi = axios.create({ baseURL });
const authenticatedApi = axios.create({ baseURL });

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

const notifyAuthChange = () => {
  window.dispatchEvent(new Event("authchange"));
};

// Add access token to authenticated requests
authenticatedApi.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Save tokens
const saveTokens = (tokens) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);

  if (tokens.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }

  notifyAuthChange();
  return tokens;
};

// Clear tokens
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("username");
  notifyAuthChange();
};

// Get authenticated user ID
export const getAuthenticatedUserId = () => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!accessToken) return null;

  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    return payload.user_id ?? null;
  } catch {
    return null;
  }
};

// Get media URL
export const getMediaUrl = (path) => {
  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const mediaBaseURL =
    import.meta.env.VITE_MEDIA_BASE_URL || new URL(baseURL).origin;

  const mediaPath = path.startsWith("/media/")
    ? path
    : `/media/${path.replace(/^\/+/, "")}`;

  return `${mediaBaseURL.replace(/\/+$/, "")}${mediaPath}`;
};

// Authentication
export const registerUser = (userData) =>
  publicApi.post("/register/", userData).then(({ data }) => data);

export const loginUser = (credentials) =>
  publicApi.post("/login/", credentials).then(({ data }) => {
    saveTokens(data);
    localStorage.setItem("username", credentials.username);
    return data;
  });

export const refreshAccessToken = () => {
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refresh) {
    return Promise.reject(new Error("No refresh token is available."));
  }

  return publicApi
    .post("/token/refresh/", { refresh })
    .then(({ data }) => saveTokens(data));
};

export const logoutUser = async () => {
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);

  try {
    if (refresh) {
      await publicApi.post("/logout/", { refresh });
    }
  } finally {
    clearTokens();
  }
};

// Blogs
export const getBlogs = () => publicApi.get("/blogs/").then(({ data }) => data);

export const createBlog = (blogData) =>
  authenticatedApi.post("/blogs/create/", blogData).then(({ data }) => data);

export const getBlog = (blogId) =>
  publicApi.get(`/blogs/${blogId}/`).then(({ data }) => data);

export const updateBlog = (blogId, blogData) =>
  authenticatedApi.put(`/blogs/${blogId}/`, blogData).then(({ data }) => data);

export const deleteBlog = (blogId) =>
  authenticatedApi.delete(`/blogs/${blogId}/`);

export const getBlogComments = (blogId) =>
  publicApi.get(`/blogs/${blogId}/comments/`).then(({ data }) => data);

export const createBlogComment = (blogId, content) =>
  authenticatedApi
    .post(`/blogs/${blogId}/comments/`, { content })
    .then(({ data }) => data);

export const updateBlogComment = (blogId, commentId, content) =>
  authenticatedApi
    .patch(`/blogs/${blogId}/comments/${commentId}/`, { content })
    .then(({ data }) => data);

export const deleteBlogComment = (blogId, commentId) =>
  authenticatedApi.delete(`/blogs/${blogId}/comments/${commentId}/`);

export const likeBlog = (blogId) =>
  authenticatedApi.post(`/blogs/${blogId}/like/`).then(({ data }) => data);

export const unlikeBlog = (blogId) =>
  authenticatedApi.delete(`/blogs/${blogId}/like/`);
