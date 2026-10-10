import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createBlogComment,
  deleteBlog,
  deleteBlogComment,
  getBlog,
  getBlogComments,
  getAuthenticatedUserId,
  getMediaUrl,
  likeBlog,
  updateBlogComment,
  unlikeBlog,
} from "../api/blogApi";
import { formatDate } from "../utils/date";
import { getErrorMessage } from "../utils/error";
import "./BlogDetailPage.css";

const BlogDetailPage = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();

  const currUser = localStorage.getItem("username");
  const authenticated = Boolean(localStorage.getItem("accessToken"));
  const currentUserId = getAuthenticatedUserId();

  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [savingCommentId, setSavingCommentId] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [error, setError] = useState("");

  // Load blog and comments
  useEffect(() => {
    let active = true;

    const loadBlog = async () => {
      try {
        const [blogData, commentData] = await Promise.all([
          getBlog(blogId),
          getBlogComments(blogId),
        ]);

        if (!active) return;

        setBlog(blogData);
        setComments(
          Array.isArray(commentData) ? commentData : commentData.results || [],
        );
        setLikeCount(blogData.likes_count || 0);
      } catch (error) {
        if (active) setError(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadBlog();

    return () => {
      active = false;
    };
  }, [blogId]);

  // Redirect to login
  const requireLogin = () => {
    navigate("/login", {
      state: { from: `/blogs/${blogId}` },
    });
  };

  // Like or unlike blog
  const handleLike = async () => {
    if (!localStorage.getItem("accessToken")) {
      requireLogin();
      return;
    }

    setError("");

    try {
      if (liked) {
        await unlikeBlog(blogId);
        setLiked(false);
        setLikeCount((count) => Math.max(0, count - 1));
      } else {
        const result = await likeBlog(blogId);
        setLiked(true);
        setLikeCount(result.like_count ?? likeCount + 1);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  // Create comment
  const handleComment = async (event) => {
    event.preventDefault();

    if (!localStorage.getItem("accessToken")) {
      requireLogin();
      return;
    }

    const content = comment.trim();
    if (!content) return;

    setError("");
    setSubmittingComment(true);

    try {
      const newComment = await createBlogComment(blogId, content);

      setComments((current) => [...current, newComment]);
      setComment("");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSubmittingComment(false);
    }
  };

  // Update comment
  const handleUpdateComment = async (event, item) => {
    event.preventDefault();

    const content = editingContent.trim();
    if (!content) return;

    setError("");
    setSavingCommentId(item.id);

    try {
      const updatedComment = await updateBlogComment(blogId, item.id, content);

      setComments((current) =>
        current.map((comment) =>
          comment.id === item.id ? updatedComment : comment,
        ),
      );

      setEditingCommentId(null);
      setEditingContent("");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSavingCommentId(null);
    }
  };

  // Delete comment
  const handleDeleteComment = async (item) => {
    if (!window.confirm("Delete this comment? This action cannot be undone.")) {
      return;
    }

    setError("");
    setDeletingCommentId(item.id);

    try {
      await deleteBlogComment(blogId, item.id);

      setComments((current) =>
        current.filter((comment) => comment.id !== item.id),
      );

      if (editingCommentId === item.id) {
        setEditingCommentId(null);
        setEditingContent("");
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Delete blog
  const handleDelete = async () => {
    if (!window.confirm("Delete this story? This action cannot be undone.")) {
      return;
    }

    setError("");

    try {
      await deleteBlog(blogId);
      navigate("/");
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <div className="loading-state" role="status">
        Opening the story…
      </div>
    );
  }

  if (!blog) {
    return (
      <section className="detail-state">
        <h2>We couldn't find that story.</h2>

        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}

        <Link className="button" to="/">
          Back to stories
        </Link>
      </section>
    );
  }

  return (
    <article className="detail-wrap">
      <Link className="back-link" to="/">
        ← All stories
      </Link>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      <p className="eyebrow">A story from the community</p>

      <h1 className="detail-heading">{blog.title}</h1>

      <div className="detail-byline">
        <span className="avatar">{blog.author?.charAt(0) || "W"}</span>
        <strong>{blog.author || "A writer"}</strong>
        <span className="meta-dot" />
        <time dateTime={blog.created_at}>{formatDate(blog.created_at)}</time>
      </div>

      <div className="detail-cover">
        {blog.blog_pic ? (
          <img src={getMediaUrl(blog.blog_pic)} alt="" />
        ) : (
          <div className="detail-image-placeholder" aria-hidden="true">
            {blog.title?.charAt(0) || "S"}
          </div>
        )}
      </div>

      <div className="detail-body">{blog.description}</div>

      <div className="detail-toolbar">
        <button
          className="button secondary like-button"
          type="button"
          onClick={handleLike}
        >
          <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
          {liked ? "Liked" : "Like story"}
          {likeCount > 0 ? ` · ${likeCount}` : ""}
        </button>

        {authenticated && currUser === blog.author && (
          <div className="detail-actions">
            <Link className="button secondary" to={`/blogs/${blogId}/edit`}>
              Edit
            </Link>

            <button
              className="button danger"
              type="button"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <section className="comments-section" aria-labelledby="comments-heading">
        <div className="comments-header">
          <h2 className="section-title" id="comments-heading">
            The conversation
          </h2>

          <span className="comments-count">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </span>
        </div>

        <form className="comment-form" onSubmit={handleComment}>
          <textarea
            aria-label="Write a comment"
            placeholder="Add a thoughtful note…"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            required
          />

          <button className="button" type="submit" disabled={submittingComment}>
            {submittingComment ? "Posting…" : "Comment"}
          </button>
        </form>

        {comments.length > 0 ? (
          <div className="comment-list">
            {comments.map((item) => (
              <article className="comment-card" key={item.id}>
                <span className="avatar">{item.user?.charAt(0) || "W"}</span>

                <div className="comment-content">
                  <div className="comment-author">
                    {item.user || "A reader"}

                    <time className="comment-date" dateTime={item.created_at}>
                      {formatDate(item.created_at)}
                    </time>
                  </div>

                  {editingCommentId === item.id ? (
                    <form
                      className="comment-edit-form"
                      onSubmit={(event) => handleUpdateComment(event, item)}
                    >
                      <textarea
                        aria-label="Edit your comment"
                        value={editingContent}
                        onChange={(event) =>
                          setEditingContent(event.target.value)
                        }
                        required
                        autoFocus
                      />

                      <div className="comment-actions">
                        <button
                          className="button secondary"
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingContent("");
                          }}
                        >
                          Cancel
                        </button>

                        <button
                          className="button"
                          type="submit"
                          disabled={savingCommentId === item.id}
                        >
                          {savingCommentId === item.id ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="comment-text">{item.content}</p>
                  )}

                  {currentUserId !== null &&
                    Number(item.user_id) === Number(currentUserId) &&
                    editingCommentId !== item.id && (
                      <div className="comment-actions">
                        <button
                          className="comment-action"
                          type="button"
                          onClick={() => {
                            setEditingCommentId(item.id);
                            setEditingContent(item.content);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="comment-action delete"
                          type="button"
                          onClick={() => handleDeleteComment(item)}
                          disabled={deletingCommentId === item.id}
                        >
                          {deletingCommentId === item.id
                            ? "Deleting…"
                            : "Delete"}
                        </button>
                      </div>
                    )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">
            No comments yet. Be the first to join the conversation.
          </p>
        )}
      </section>
    </article>
  );
};

export default BlogDetailPage;
