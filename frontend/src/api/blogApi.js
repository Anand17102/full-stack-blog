import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://full-stack-blog-19zm.onrender.com/api";

const publicApi = axios.create({ baseURL });
const authenticatedApi = axios.create({ baseURL });

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

const notifyAuthChange = () => {
  window.dispatchEvent(new Event("authchange"));
};

// Save tokens
const saveTokens = (tokens) => {
  if (tokens.access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  }

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
    notifyAuthChange();
    return data;
  });

// Refresh token with duplicate-request protection
let refreshPromise = null;

export const refreshAccessToken = () => {
  if (refreshPromise) return refreshPromise;

  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refresh) {
    clearTokens();
    return Promise.reject(new Error("No refresh token is available."));
  }

  refreshPromise = publicApi
    .post("/token/refresh/", { refresh })
    .then(({ data }) => {
      if (!data.access) {
        throw new Error("Refresh response did not contain an access token.");
      }

      return saveTokens(data);
    })
    .catch((error) => {
      // An invalid refresh token cannot recover this session.
      clearTokens();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

// Automatically attach access tokens
authenticatedApi.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Automatically refresh once after an unauthorized response
authenticatedApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/token/refresh/") ||
      originalRequest.url?.includes("/login/") ||
      originalRequest.url?.includes("/logout/")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const tokens = await refreshAccessToken();

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${tokens.access}`;

      return authenticatedApi(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

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
