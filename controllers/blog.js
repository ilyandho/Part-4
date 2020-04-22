require('express-async-errors');
const blogsRouter = require('express').Router();
const jwt = require('jsonwebtoken');

// Models
const Blog = require('../models/Blog');
const User = require('../models/User');

// Helper function for extracting the token from the POST req

blogsRouter.get('/', async (req, res) => {
  const blogs = await Blog.find({}).populate('user', {
    username: 1,
    name: 1,
    id: 1,
  });
  res.json(blogs.map((blog) => blog.toJSON()));
});

blogsRouter.post('/', async (req, res) => {
  if (!req.token) {
    return res
      .status(401)
      .json({ error: "You have not provided the token/you're no tauthorized" });
  }
  if (!req.body.title && !req.body.url) {
    return res.status(400).send(`Please provide 'title' and 'url`);
  } else if (!req.body.title) {
    return res.status(400).send(`Please provide 'title' `);
  } else if (!req.body.url) {
    return res.status(400).send(`Please provide  'url`);
  }

  // Decode token and verify the info
  const decodedToken = jwt.verify(req.token, process.env.SECRET);

  if (!req.token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' });
  }

  // Check for the existance of user in dbs
  const user = await User.findById(decodedToken.id);
  if (!user) {
    return res.status(401).send({ error: 'user does not exist' });
  }

  const { title, url, likes } = req.body;

  const blog = new Blog({
    title,
    author: user.name,
    url,
    likes,
    user: user._id,
  });

  const result = await blog.save();

  user.blogs = user.blogs.concat(result._id);
  await user.save();
  res.status(201).json(result.populate('user'));
});

blogsRouter.delete('/:id', async (req, res) => {
  if (!req.token) {
    return res
      .status(401)
      .json({ error: "You have not provided the token/you're no tauthorized" });
  }
  // Decode the token
  const decodedToken = jwt.verify(req.token, process.env.SECRET);
  if (!req.token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' });
  }

  const blog = await Blog.findById({ _id: req.params.id });

  if (!blog) {
    return res
      .status(400)
      .json({ error: 'Blog not found or it is already deleted' });
  }

  if (blog.user.toString() === decodedToken.id.toString()) {
    const id = req.params.id;
    await Blog.findByIdAndDelete({ _id: id });
    return res.status(204).end();
  } else {
    return res
      .status(401)
      .json({ error: 'You are not authorized to delete this' });
  }
});

blogsRouter.put('/:id', async (req, res) => {
  if (!req.token) {
    return res
      .status(401)
      .json({ error: "You have not provided the token/you're no tauthorized" });
  }

  // Decode token and verify the info
  const decodedToken = jwt.verify(req.token, process.env.SECRET);

  if (!req.token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' });
  }

  console.log(decodedToken.id);
  const blog = await Blog.findById(req.params.id).populate('user');

  // Check if the 'id' is associated with any blog
  if (!blog) {
    return res.status(400).end();
  }

  // Check if the userId in the token is the same as that for the user in the blog dbs
  if (!(blog.user.id === decodedToken.id)) {
    return res
      .status(401)
      .json({ error: "You're not authorised to updated this blog" });
  }
  const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.status(201).json(updatedBlog);
});

module.exports = blogsRouter;
