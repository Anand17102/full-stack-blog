import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import BlogDetailPage from "./pages/BlogDetailPage";
import BlogFormPage from "./pages/BlogFormPage";
import BlogsListPage from "./pages/BlogsListPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import "./App.css";

const App = () => (
  <BrowserRouter>
    <div className="site-shell">
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<BlogsListPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/blogs/new" element={<BlogFormPage />} />
          <Route path="/blogs/:blogId" element={<BlogDetailPage />} />
          <Route path="/blogs/:blogId/edit" element={<BlogFormPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span className="footer-brand">
          <span className="brand-mark">S</span>
          <span>Stories worth sharing.</span>
        </span>
        <span>© {new Date().getFullYear()} Storyline</span>
      </footer>
    </div>
  </BrowserRouter>
);

export default App;
