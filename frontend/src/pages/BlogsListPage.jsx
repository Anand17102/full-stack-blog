import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBlogs, getMediaUrl } from "../api/blogApi";
import { formatDate } from "../utils/date";
import "./BlogsListPage.css";

const BlogsListPage = () => {
  const authenticated = Boolean(localStorage.getItem("accessToken"));
  const [blogs, setBlogs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getBlogs()
      .then((data) => setBlogs(Array.isArray(data) ? data : data.results || []))
      .catch(() => setError("We couldn't load the stories. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const filteredBlogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return blogs;
    return blogs.filter((blog) =>
      `${blog.title} ${blog.description} ${blog.author}`
        .toLowerCase()
        .includes(query),
    );
  }, [blogs, search]);

  return (
    <div className="home-page-enter">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">A home for good ideas</p>
          <h1 className="page-heading">
            Stories make us feel a little less alone.
          </h1>
          <p className="page-subtitle">
            Thoughtful notes, fresh perspectives, and the small things worth
            remembering — shared by people like you.
          </p>
          <Link
            className="button"
            to={authenticated ? "/blogs/new" : "/register"}
          >
            {authenticated ? "Write a story" : "Find your voice"}{" "}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="stories-heading">
        <div className="feed-heading">
          <div>
            <p className="eyebrow">The latest</p>
            <h2 id="stories-heading">Stories to settle into</h2>
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search stories or writers"
              aria-label="Search stories or writers"
            />
          </label>
        </div>

        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <div className="loading-state" role="status">
            Gathering stories…
          </div>
        ) : filteredBlogs.length ? (
          <div className="blog-grid">
            {filteredBlogs.map((blog) => (
              <article className="blog-card" key={blog.id}>
                <Link
                  className="card-image-link"
                  to={`/blogs/${blog.id}`}
                  tabIndex={-1}
                >
                  {blog.blog_pic ? (
                    <img
                      className="card-image"
                      src={getMediaUrl(blog.blog_pic)}
                      alt=""
                    />
                  ) : (
                    <span className="card-image-placeholder" aria-hidden="true">
                      {blog.title?.charAt(0) || "S"}
                    </span>
                  )}
                </Link>
                <div className="card-content">
                  <div className="card-meta">
                    <span>{formatDate(blog.created_at)}</span>
                    <span className="meta-dot" />
                    <span>Story</span>
                  </div>
                  <h3 className="card-title">
                    <Link to={`/blogs/${blog.id}`}>{blog.title}</Link>
                  </h3>
                  <p className="card-description">{blog.description}</p>
                  <div className="card-footer">
                    <span className="author-chip">
                      <span className="avatar">
                        {blog.author?.charAt(0) || "W"}
                      </span>
                      {blog.author || "A writer"}
                    </span>
                    <Link className="read-link" to={`/blogs/${blog.id}`}>
                      Read story <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>
              {search ? "No stories found" : "The first page is still blank."}
            </h3>
            <p>
              {search
                ? "Try another search, or explore all the stories."
                : "Be the first to share a thought with the community."}
            </p>
            {search ? (
              <button
                className="button secondary"
                onClick={() => setSearch("")}
                type="button"
              >
                Clear search
              </button>
            ) : (
              <Link
                className="button"
                to={authenticated ? "/blogs/new" : "/register"}
              >
                {authenticated ? "Write the first story" : "Start writing"}
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default BlogsListPage;
