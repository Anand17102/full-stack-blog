import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/blogApi";
import "./AuthForms.css";
import "./RegisterPage.css";

const getErrorMessage = (error) => {
  const data = error.response?.data;
  if (!data) return "We couldn't create your account. Please try again.";
  return Object.values(data).flat().join(" ");
};

const RegisterPage = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await registerUser(form);
      navigate("/login", { state: { registered: true } });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-wrap narrow auth-page register-page">
      <p className="eyebrow">Make yourself at home</p>
      <h1 className="page-heading">Your story belongs here.</h1>
      <p className="page-subtitle">Join the community and share what matters to you.</p>
      <form className="form-card form-grid" onSubmit={handleSubmit}>
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
          <label htmlFor="email">Email <span className="muted">(optional)</span></label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
            value={form.password}
            onChange={handleChange}
          />
        </div>
        <div className="form-field">
          <label htmlFor="password2">Confirm password</label>
          <input
            id="password2"
            name="password2"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
            value={form.password2}
            onChange={handleChange}
          />
        </div>
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
        <p className="inline-note">
          Already a member? <Link to="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
};

export default RegisterPage;
