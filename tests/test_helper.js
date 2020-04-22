const Blog = require('../models/Blog');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const initialBlogs = [
  {
    title: 'First Blog ',
    url: 'http://localhost:3003/api/blogs',
    likes: 23,
  },
  {
    title: 'Second Blog ',
    url: 'http://localhost:3003/api/blogs',
    likes: 23,
  },
  {
    title: 'Third Blog ',
    url: 'http://localhost:3003/api/blogs',
    likes: 23,
  },
];

const inntialUSers = [
  {
    username: 'first user  ',
    name: 'First User',
    password: 'password',
  },
  {
    username: 'second user ',
    name: 'Second User',
    password: 'password',
  },
  {
    username: 'third user ',
    name: 'Third User',
    password: 'password',
  },
];

const nonExistingId = async () => {
  const blog = new Blog({ content: 'willremovethissoon' });
  await blog.save();
  await blog.remove();

  return blog._id.toString();
};

const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map((blog) => blog.toJSON());
};
const usersInDb = async () => {
  const users = await User.find({});
  return users.map((user) => user.toJSON());
};

module.exports = {
  initialBlogs,
  inntialUSers,
  nonExistingId,
  blogsInDb,
  usersInDb,
};
