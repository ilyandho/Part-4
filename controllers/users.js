require('express-async-errors');
const usersRouter = require('express').Router();
const bcrypt = require('bcrypt');

const Blog = require('../models/Blog');
const User = require('../models/User');

usersRouter.get('/', async (req, res) => {
  const response = await User.find({}).populate('blogs', {
    title: 1,
    url: 1,
    author: 1,
    id: 1,
  });
  const users = response.map((user) => user.toJSON());
  res.status(200).json(users);
});

usersRouter.post('/', async (req, res) => {
  //   let { username, name, password } = req.body;
  const username = req.body.username.trim();
  const name = req.body.name.trim();
  const password = req.body.password.trim();

  if (username.length < 3 && password.length < 3) {
    return res.status(400).json({
      error: "'username' and 'password' must of length greater than 3",
    });
  } else if (username.length < 3) {
    return res
      .status(400)
      .json({ error: "'username' must of length greater than 3" });
  } else if (password.length < 3) {
    return res
      .status(400)
      .json({ error: "'password' must of length greater than 3" });
  }

  const salt = 10;

  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = new User({
    username,
    name,
    passwordHash,
  });

  const user = await newUser.save();
  res.status(201).json(user.toJSON());
});

usersRouter.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id).populate('blogs', {
    title: 1,
    url: 1,
    author: 1,
    id: 1,
  });

  if (user) {
    return res.status(200).json(user);
  } else {
    return res.status(400).json({ message: "user doesn't exist" });
  }
});
module.exports = usersRouter;
