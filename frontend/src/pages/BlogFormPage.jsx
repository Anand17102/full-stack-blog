import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createBlog, getBlog, getMediaUrl, updateBlog } from "../api/blogApi";
import { formatDate } from "../utils/date";
import { getErrorMessage } from "../utils/error";
import "./BlogFormPage.css";

const BlogFormPage = () => {
  const { blogId } = useParams();
  const isEditing = Boolean(blogId);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const imagePreviewUrlRef = useRef("");
  const [form, setForm] = useState({ title: "", description: "" });
  const [currentImage, setCurrentImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [activePanel, setActivePanel] = useState("editor");

  const wordCount = useMemo(
    () => form.description.trim().split(/\s+/).filter(Boolean).length,
    [form.description],
  );
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const coverUrl =
    imagePreview ||
    (currentImage && !removeCurrentImage ? getMediaUrl(currentImage) : "");

  useEffect(
    () => () => {
      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      navigate("/login", {
        state: {
          from: isEditing ? `/blogs/${blogId}/edit` : "/blogs/new",
        },
        replace: true,
      });
      return;
    }
    if (!isEditing) return;

    getBlog(blogId)
      .then((blog) => {
        setForm({ title: blog.title, description: blog.description });
        setCurrentImage(blog.blog_pic || "");
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [blogId, isEditing, navigate]);

  const handleChange = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const handleImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file to use as your cover.");
      return;
    }
    setError("");
    setRemoveCurrentImage(false);
    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
    }
    imagePreviewUrlRef.current = URL.createObjectURL(file);
    setImagePreview(imagePreviewUrlRef.current);
    setImageFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleImage(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const data = new FormData();
    data.append("title", form.title.trim());
    data.append("description", form.description.trim());
    if (imageFile) data.append("blog_pic", imageFile);
    else if (removeCurrentImage) data.append("blog_pic", "");

    try {
      const blog = isEditing
        ? await updateBlog(blogId, data)
        : await createBlog(data);
      navigate(`/blogs/${blog.id}`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state" role="status">
        Opening your draft…
      </div>
    );
  }

  return (
    <section className="page-wrap story-editor">
      <div className="editor-heading">
        <Link className="back-link" to={isEditing ? `/blogs/${blogId}` : "/"}>
          <span aria-hidden="true">←</span> Back to stories
        </Link>
        <div className="editor-heading-row">
          <div>
            <p className="eyebrow">
              {isEditing
                ? "Your workspace"
                : "A blank page is full of possibility"}
            </p>
            <h1 className="page-heading">
              {isEditing ? "Refine your story." : "Write a story."}
            </h1>
            <p className="page-subtitle">
              Take your time. The best stories sound like you.
            </p>
          </div>
          <span className="editor-date">
            <span className="editor-status-dot" />
            {isEditing ? "Editing story" : "New story"} ·{" "}
            {formatDate(new Date())}
          </span>
        </div>
      </div>

      <div
        className="editor-tabs"
        role="tablist"
        aria-label="Story editor panels"
      >
        <button
          className={activePanel === "editor" ? "active" : ""}
          type="button"
          role="tab"
          aria-selected={activePanel === "editor"}
          onClick={() => setActivePanel("editor")}
        >
          <span aria-hidden="true">✎</span> Editor
        </button>
        <button
          className={activePanel === "preview" ? "active" : ""}
          type="button"
          role="tab"
          aria-selected={activePanel === "preview"}
          onClick={() => setActivePanel("preview")}
        >
          <span aria-hidden="true">◉</span> Preview
        </button>
      </div>

      {error && (
        <div className="alert editor-alert" role="alert">
          {error}
        </div>
      )}

      <div className={`editor-layout active-${activePanel}`}>
        <form className="editor-card" onSubmit={handleSubmit}>
          <div className="editor-card-top">
            <span className="editor-section-number">01</span>
            <div>
              <h2>Your story</h2>
              <p>Start with a title, then let the words find their way.</p>
            </div>
          </div>

          <div className="editor-fields">
            <div className="editor-field title-field">
              <label htmlFor="title">Story title</label>
              <input
                id="title"
                name="title"
                maxLength={255}
                placeholder="A title that stays with you"
                required
                value={form.title}
                onChange={handleChange}
              />
              <span className="field-counter">{form.title.length}/255</span>
            </div>

            <div className="editor-field">
              <div className="writing-label-row">
                <label htmlFor="description">The story</label>
                <span>Plain text · line breaks are preserved</span>
              </div>
              <textarea
                id="description"
                name="description"
                placeholder="Begin anywhere. A moment, a question, a feeling you can't quite shake…"
                required
                value={form.description}
                onChange={handleChange}
              />
              <div className="writing-stats" aria-live="polite">
                <span>
                  <strong>{wordCount}</strong>{" "}
                  {wordCount === 1 ? "word" : "words"}
                </span>
                <span className="meta-dot" />
                <span>
                  <strong>{readingMinutes}</strong> min read
                </span>
              </div>
            </div>
          </div>

          <div className="editor-divider" />

          <div className="editor-card-top cover-section-heading">
            <span className="editor-section-number">02</span>
            <div>
              <h2>Set the scene</h2>
              <p>Add an image that gives readers a first glimpse.</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            className="visually-hidden"
            id="blog_pic"
            name="blog_pic"
            type="file"
            accept="image/*"
            onChange={(event) => handleImage(event.target.files?.[0])}
          />

          {coverUrl ? (
            <div className="cover-editor-preview">
              <img src={coverUrl} alt="Story cover preview" />
              <div className="cover-preview-overlay">
                <span>{imageFile?.name || "Current cover image"}</span>
                <div>
                  <button
                    className="cover-control"
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      fileInputRef.current?.click();
                    }}
                  >
                    Replace
                  </button>
                  <button
                    className="cover-control remove"
                    type="button"
                    onClick={() => {
                      if (imagePreviewUrlRef.current) {
                        URL.revokeObjectURL(imagePreviewUrlRef.current);
                        imagePreviewUrlRef.current = "";
                      }
                      setImageFile(null);
                      setImagePreview("");
                      setRemoveCurrentImage(Boolean(currentImage));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              className={`cover-dropzone${isDragging ? " dragging" : ""}`}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <span className="upload-icon" aria-hidden="true">
                ↑
              </span>
              <strong>Drop an image here, or browse</strong>
              <span>Choose a cover image from your device</span>
            </button>
          )}

          <div className="editor-submit-row">
            <span className="editor-submit-note">
              <span className="editor-status-dot" />
              {submitting ? "Publishing your story…" : "Ready when you are"}
            </span>
            <div className="form-actions">
              <Link
                className="button secondary"
                to={isEditing ? `/blogs/${blogId}` : "/"}
              >
                Cancel
              </Link>
              <button className="button" type="submit" disabled={submitting}>
                {submitting
                  ? "Publishing…"
                  : isEditing
                    ? "Save changes"
                    : "Publish story"}
                {!submitting && <span aria-hidden="true">↗</span>}
              </button>
            </div>
          </div>
        </form>

        <aside
          className="preview-column"
          aria-label="Story preview and writing tips"
        >
          <section className="story-preview-card">
            <div className="preview-card-top">
              <span className="preview-live-dot" />
              <span>LIVE PREVIEW</span>
            </div>
            <div className="preview-cover">
              {coverUrl ? (
                <img src={coverUrl} alt="" />
              ) : (
                <div className="preview-cover-placeholder">
                  <span aria-hidden="true">✦</span>
                  <small>Your cover image</small>
                </div>
              )}
            </div>
            <div className="preview-copy">
              <div className="preview-meta">
                <span>{formatDate(new Date())}</span>
                <span className="meta-dot" />
                <span>{readingMinutes} min read</span>
              </div>
              <h2>{form.title.trim() || "Your story title"}</h2>
              <p className={form.description ? "" : "preview-placeholder"}>
                {form.description.trim() ||
                  "A little preview of your story will appear here as you write…"}
              </p>
              <div className="preview-author">
                <span className="avatar">Y</span>
                <span>Your story</span>
              </div>
            </div>
          </section>

          <section className="writing-tip">
            <span className="tip-sparkle" aria-hidden="true">
              ✳
            </span>
            <div>
              <p className="eyebrow">A gentle reminder</p>
              <p>
                Start small. A specific moment often says more than a perfect
                opening.
              </p>
            </div>
          </section>
          <button
            className="button preview-return-button"
            type="button"
            onClick={() => setActivePanel("editor")}
          >
            Back to editor
          </button>
        </aside>
      </div>
    </section>
  );
};

export default BlogFormPage;
