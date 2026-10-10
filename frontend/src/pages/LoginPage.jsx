import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../api/blogApi";
import "./AuthForms.css";
import "./LoginPage.css";

const LoginPage = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const registered = location.state?.registered;

  const handleChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginUser(form);
      navigate(location.state?.from || "/");
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Those details didn't match an account. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-wrap narrow auth-page login-page">
      <p className="eyebrow">Welcome back</p>
      <h1 className="page-heading">Pick up where you left off.</h1>
      <p className="page-subtitle">Your next favorite story is waiting.</p>
      <form className="form-card form-grid" onSubmit={handleSubmit}>
        {registered && (
          <div className="success-message" role="status">
            Your account is ready. Log in to start sharing stories.
          </div>
        )}
        {error && <div className="alert" role="alert">{error}</div>}
        <div className="form-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            value={form.username}
            onChange={handleChange}
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={handleChange}
          />
        </div>
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Log in"}
        </button>
        <p className="inline-note">
          New to Storyline? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </section>
  );
};

export default LoginPage;
