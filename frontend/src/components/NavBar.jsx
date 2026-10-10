import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearTokens, logoutUser } from "../api/blogApi";
import "./NavBar.css";

const NavBar = () => {
  const [authenticated, setAuthenticated] = useState(
    () => Boolean(localStorage.getItem("accessToken")),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const updateAuth = () =>
      setAuthenticated(Boolean(localStorage.getItem("accessToken")));
    window.addEventListener("authchange", updateAuth);
    window.addEventListener("storage", updateAuth);
    return () => {
      window.removeEventListener("authchange", updateAuth);
      window.removeEventListener("storage", updateAuth);
    };
  }, []);

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await logoutUser();
    } catch (error) {
      clearTokens();
      setLogoutError(
        error.response?.data?.detail ||
          "Your session ended locally, but the server couldn't confirm token revocation.",
      );
    }
    setMenuOpen(false);
    navigate("/");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="topbar">
      <div className="nav-inner">
        <Link className="brand" to="/" onClick={closeMenu} aria-label="Storyline home">
          <span className="brand-mark">S</span>
          <span>storyline</span>
        </Link>

        <nav className={`nav-links${menuOpen ? " open" : ""}`} aria-label="Main navigation">
          <NavLink className="nav-link" to="/" onClick={closeMenu}>
            Explore
          </NavLink>
          {authenticated && (
            <NavLink className="nav-link" to="/blogs/new" onClick={closeMenu}>
              Write a story
            </NavLink>
          )}
          {!authenticated && (
            <NavLink className="nav-link nav-mobile-only" to="/login" onClick={closeMenu}>
              Log in
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          {authenticated ? (
            <button className="button secondary" type="button" onClick={handleLogout}>
              Log out
            </button>
          ) : (
            <>
              <Link className="button secondary nav-login-button" to="/login" onClick={closeMenu}>
                Log in
              </Link>
              <Link className="button" to="/register" onClick={closeMenu}>
                Join free
              </Link>
            </>
          )}
          <button
            className="nav-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "×" : "☰"}
          </button>
        </div>
      </div>
      {logoutError && <span className="nav-error" role="status">{logoutError}</span>}
    </header>
  );
};

export default NavBar;
