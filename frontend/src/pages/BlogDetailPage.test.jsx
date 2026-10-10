import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BlogDetailPage from "./BlogDetailPage";
import {
  deleteBlog,
  getBlog,
  getBlogComments,
} from "../api/blogApi";

vi.mock("../api/blogApi", () => ({
  createBlogComment: vi.fn(),
  deleteBlog: vi.fn(),
  deleteBlogComment: vi.fn(),
  getBlog: vi.fn(),
  getBlogComments: vi.fn(),
  getAuthenticatedUserId: vi.fn(() => null),
  getMediaUrl: vi.fn(() => ""),
  likeBlog: vi.fn(),
  updateBlogComment: vi.fn(),
  unlikeBlog: vi.fn(),
}));

const blog = {
  id: 42,
  author: "writer",
  title: "A sample story",
  description: "Story body",
  created_at: "2026-01-01T00:00:00Z",
};

const renderBlogDetail = () =>
  render(
    <MemoryRouter initialEntries={["/blogs/42"]}>
      <Routes>
        <Route path="/blogs/:blogId" element={<BlogDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe("BlogDetailPage author controls", () => {
  beforeEach(() => {
    localStorage.clear();
    getBlog.mockResolvedValue(blog);
    getBlogComments.mockResolvedValue([]);
    deleteBlog.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows edit and delete controls to the authenticated author", async () => {
    localStorage.setItem("accessToken", "test-token");
    localStorage.setItem("username", blog.author);

    renderBlogDetail();

    expect(await screen.findByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/blogs/42/edit",
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("hides edit and delete controls from another authenticated user", async () => {
    localStorage.setItem("accessToken", "test-token");
    localStorage.setItem("username", "another-user");

    renderBlogDetail();

    await screen.findByRole("heading", { name: blog.title });
    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("hides edit and delete controls from anonymous visitors", async () => {
    renderBlogDetail();

    await screen.findByRole("heading", { name: blog.title });
    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("lets the author delete their story after confirmation", async () => {
    localStorage.setItem("accessToken", "test-token");
    localStorage.setItem("username", blog.author);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderBlogDetail();
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteBlog).toHaveBeenCalledWith("42"));
  });
});
