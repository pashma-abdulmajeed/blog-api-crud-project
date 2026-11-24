import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

const emptyForm = {
  title: "",
  excerpt: "",
  content: "",
};

async function request(path, options = {}, token = "") {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("blog_token") || ""
  );
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const logout = useCallback(() => {
    localStorage.removeItem("blog_token");
    setToken("");
    setUser(null);
    setBlogs([]);
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
    setError("");
  }, []);

  const loadBlogs = useCallback(async (currentToken) => {
    setLoading(true);
    try {
      const data = await request("/api/blogs", {}, currentToken);
      setBlogs(data.blogs || []);
    } catch (err) {
      if (
        err.message.toLowerCase().includes("token") ||
        err.message.toLowerCase().includes("authentication")
      ) {
        logout();
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    let cancelled = false;

    async function restoreSession() {
      try {
        const data = await request("/api/auth/me", {}, token);
        if (!cancelled) {
          setUser(data.user);
          await loadBlogs(token);
        }
      } catch {
        if (!cancelled) logout();
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [token, loadBlogs, logout]);

  async function handleAuth(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setAuthLoading(true);

    try {
      const endpoint = mode === "register" ? "register" : "login";
      const payload =
        mode === "register"
          ? authForm
          : { email: authForm.email, password: authForm.password };

      const data = await request(`/api/auth/${endpoint}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("blog_token", data.token);
      setUser(data.user);
      setToken(data.token);
      setAuthForm({ name: "", email: "", password: "" });
      setMessage(mode === "register" ? "Account created!" : "Welcome back!");
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function updateAuthForm(event) {
    setAuthForm((old) => ({
      ...old,
      [event.target.name]: event.target.value,
    }));
  }

  function updateBlogForm(event) {
    setForm((old) => ({
      ...old,
      [event.target.name]: event.target.value,
    }));
  }

  function startEditing(blog) {
    setEditingId(blog._id);
    setForm({
      title: blog.title || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
    });
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveBlog(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const editing = Boolean(editingId);
    const path = editing ? `/api/blogs/${editingId}` : "/api/blogs";

    try {
      const data = await request(
        path,
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(form),
        },
        token
      );

      setMessage(data.message || "Blog saved successfully.");
      cancelEditing();
      await loadBlogs(token);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteBlog(id) {
    if (!window.confirm("Are you sure you want to delete this blog?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const data = await request(
        `/api/blogs/${id}`,
        { method: "DELETE" },
        token
      );

      setMessage(data.message || "Blog deleted.");
      if (editingId === id) cancelEditing();
      await loadBlogs(token);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!token || !user) {
    return (
      <main className="auth-page">
        <section className="auth-visual">
          <span className="brand-mark">B.</span>
          <div>
            <span className="eyebrow">YOUR SPACE TO WRITE</span>
            <h1>Every great idea deserves a story.</h1>
            <p>Create your own blog space, share your thoughts, and keep every post organized.</p>
          </div>
          <p className="visual-footer">Write freely. Share thoughtfully.</p>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <span className="mobile-brand">BLOGSPACE</span>
            <p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</p>
            <h2>{mode === "login" ? "Sign in to Blogspace" : "Create your account"}</h2>
            <p className="muted">
              {mode === "login"
                ? "Continue writing and managing your posts."
                : "Your next great story starts here."}
            </p>

            <div className="auth-tabs">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setError("");
                  setMessage("");
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={mode === "register" ? "active" : ""}
                onClick={() => {
                  setMode("register");
                  setError("");
                  setMessage("");
                }}
              >
                Sign up
              </button>
            </div>

            {error && <div className="notice error">{error}</div>}
            {message && <div className="notice success">{message}</div>}

            <form onSubmit={handleAuth} className="form-stack">
              {mode === "register" && (
                <label>
                  Full name
                  <input
                    name="name"
                    value={authForm.name}
                    onChange={updateAuthForm}
                    placeholder="Your name"
                    maxLength={80}
                    autoComplete="name"
                    required
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  value={authForm.email}
                  onChange={updateAuthForm}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={authForm.password}
                  onChange={updateAuthForm}
                  placeholder="At least 8 characters"
                  minLength={8}
                  maxLength={128}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                />
              </label>

              <button className="primary-button" disabled={authLoading}>
                {authLoading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign in →"
                    : "Create account →"}
              </button>
            </form>

            <p className="auth-switch">
              {mode === "login" ? "New to Blogspace?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                  setMessage("");
                }}
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => {
          cancelEditing();
          setError("");
          setMessage("");
        }}>
          <span className="brand-mark small">B.</span>
          <span>Blogspace</span>
        </a>

        <div className="topbar-user">
          <div className="avatar">
            {(user.name || "U").charAt(0).toUpperCase()}
          </div>
          <span className="user-name">{user.name}</span>
          <button className="secondary-button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard" id="home">
        <section className="welcome-section">
          <div>
            <p className="eyebrow">YOUR PERSONAL BLOG</p>
            <h1>Good to see you, {user.name}.</h1>
            <p className="muted">Capture your ideas and turn them into stories.</p>
          </div>
          <div className="post-count">
            <strong>{blogs.length}</strong>
            <span>{blogs.length === 1 ? "Your post" : "Your posts"}</span>
          </div>
        </section>

        {(error || message) && (
          <div className={`notice ${error ? "error" : "success"}`}>
            {error || message}
          </div>
        )}

        <section className="workspace">
          <div className="editor-card">
            <div className="section-title">
              <div>
                <p className="eyebrow">{editingId ? "UPDATE STORY" : "NEW STORY"}</p>
                <h2>{editingId ? "Edit your post" : "Create a post"}</h2>
              </div>
              <span className="edit-icon">✎</span>
            </div>

            <form className="form-stack" onSubmit={saveBlog}>
              <label>
                Blog title
                <input
                  name="title"
                  value={form.title}
                  onChange={updateBlogForm}
                  placeholder="Give your story a title"
                  maxLength={150}
                  required
                />
              </label>

              <label>
                Short excerpt <span className="optional">(optional)</span>
                <textarea
                  name="excerpt"
                  value={form.excerpt}
                  onChange={updateBlogForm}
                  placeholder="A quick introduction to your post..."
                  maxLength={300}
                  rows={2}
                />
                <span className="field-hint">{form.excerpt.length}/300</span>
              </label>

              <label>
                Blog content
                <textarea
                  name="content"
                  value={form.content}
                  onChange={updateBlogForm}
                  placeholder="Start writing your story here..."
                  maxLength={20000}
                  rows={7}
                  required
                />
                <span className="field-hint">{form.content.length}/20000</span>
              </label>

              <button className="primary-button" type="submit">
                {editingId ? "Save changes →" : "Publish post →"}
              </button>

              {editingId && (
                <button
                  className="secondary-button full-button"
                  type="button"
                  onClick={cancelEditing}
                >
                  Cancel editing
                </button>
              )}
            </form>
          </div>

          <section className="posts-section">
            <div className="section-title posts-heading">
              <div>
                <p className="eyebrow">YOUR COLLECTION</p>
                <h2>Your stories</h2>
              </div>
              <button
                className="refresh-button"
                onClick={() => loadBlogs(token)}
                disabled={loading}
                title="Refresh posts"
              >
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <div className="empty-state">Loading your posts...</div>
            ) : blogs.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">✎</span>
                <h3>Your first story awaits</h3>
                <p>Write your first post using the form and it will appear here.</p>
              </div>
            ) : (
              <div className="blog-grid">
                {blogs.map((blog) => (
                  <article className="blog-card" key={blog._id}>
                    <div className="card-topline">
                      <span className="post-label">BLOG POST</span>
                      <span className="date">
                        {blog.createdAt
                          ? new Date(blog.createdAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>

                    <h3>{blog.title}</h3>
                    <p className="blog-excerpt">
                      {blog.excerpt || blog.content.slice(0, 180)}
                    </p>

                    <div className="card-footer">
                      <span className="read-time">
                        {Math.max(1, Math.ceil((blog.content || "").split(/\s+/).length / 200))} min read
                      </span>
                      <div className="card-actions">
                        <button
                          className="text-button"
                          onClick={() => startEditing(blog)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-button delete-text"
                          onClick={() => deleteBlog(blog._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>

        <footer className="site-footer">
          <span>Blogspace</span>
          <span>Built with React, Express & MongoDB</span>
        </footer>
      </main>
    </div>
  );
}
