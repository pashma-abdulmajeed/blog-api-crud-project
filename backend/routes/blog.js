import express from "express";
import mongoose from "mongoose";
import Blog from "../models/blog.js";
import authenticateToken from "../middleware/auth.js";

const router = express.Router();

// Every blog endpoint requires login
router.use(authenticateToken);

function validateBlogInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "A valid JSON object is required.";
  }

  if (
    typeof body.title !== "string" ||
    !body.title.trim() ||
    body.title.trim().length > 150
  ) {
    return "Title is required and must be at most 150 characters.";
  }

  if (
    typeof body.content !== "string" ||
    !body.content.trim() ||
    body.content.trim().length > 20000
  ) {
    return "Content is required and must be at most 20000 characters.";
  }

  if (
    body.excerpt !== undefined &&
    (typeof body.excerpt !== "string" ||
      body.excerpt.trim().length > 300)
  ) {
    return "Excerpt must be a string of at most 300 characters.";
  }

  return null;
}

function prepareBlog(body) {
  const title = body.title.trim();
  const content = body.content.trim();
  const excerpt =
    typeof body.excerpt === "string" && body.excerpt.trim()
      ? body.excerpt.trim()
      : content.slice(0, 180);

  return { title, content, excerpt };
}

// CREATE a blog
router.post("/", async (req, res) => {
  try {
    const validationError = validateBlogInput(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const blog = await Blog.create({
      ...prepareBlog(req.body),
      author: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Blog created successfully.",
      blog,
    });
  } catch (error) {
    console.error("Create blog error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create blog.",
    });
  }
});

// READ all blogs belonging to the logged-in user
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find({
      author: req.user.userId,
    })
      .sort({ createdAt: -1 })
      .populate("author", "name email");

    return res.json({
      success: true,
      count: blogs.length,
      blogs,
    });
  } catch (error) {
    console.error("Fetch blogs error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch blogs.",
    });
  }
});

// READ one blog
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID.",
      });
    }

    const blog = await Blog.findOne({
      _id: req.params.id,
      author: req.user.userId,
    }).populate("author", "name email");

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }

    return res.json({ success: true, blog });
  } catch (error) {
    console.error("Fetch blog error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch blog.",
    });
  }
});

// UPDATE a blog
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID.",
      });
    }

    const validationError = validateBlogInput(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const blog = await Blog.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user.userId,
      },
      { $set: prepareBlog(req.body) },
      { new: true, runValidators: true }
    ).populate("author", "name email");

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }

    return res.json({
      success: true,
      message: "Blog updated successfully.",
      blog,
    });
  } catch (error) {
    console.error("Update blog error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update blog.",
    });
  }
});

// DELETE a blog
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID.",
      });
    }

    const blog = await Blog.findOneAndDelete({
      _id: req.params.id,
      author: req.user.userId,
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }

    return res.json({
      success: true,
      message: "Blog deleted successfully.",
    });
  } catch (error) {
    console.error("Delete blog error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete blog.",
    });
  }
});

export default router;
