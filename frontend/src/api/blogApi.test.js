import { beforeEach, describe, expect, it, vi } from "vitest";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("axios", () => ({
  default: {
    create: () => ({
      interceptors: { request: { use: vi.fn() } },
      post,
    }),
  },
}));

import { clearTokens, loginUser } from "./blogApi";

describe("blog API authentication storage", () => {
  beforeEach(() => {
    localStorage.clear();
    post.mockReset();
  });

  it("stores the logged-in username for blog ownership controls", async () => {
    const credentials = { username: "writer", password: "password" };
    const tokens = { access: "access-token", refresh: "refresh-token" };
    post.mockResolvedValue({ data: tokens });

    await loginUser(credentials);

    expect(localStorage.getItem("accessToken")).toBe(tokens.access);
    expect(localStorage.getItem("refreshToken")).toBe(tokens.refresh);
    expect(localStorage.getItem("username")).toBe(credentials.username);
  });

  it("clears the username when authentication is cleared", () => {
    localStorage.setItem("username", "writer");

    clearTokens();

    expect(localStorage.getItem("username")).toBeNull();
  });
});
