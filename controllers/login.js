const logingRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('express-async-errors');

// Models
const User = require('../models/User');

logingRouter.post('/', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(password, user.passwordHash);

  if (!(user && passwordCorrect)) {
    return res.status(401).json({ error: 'invalid username or password' });
  }

  const userForToken = {
    username,
    id: user._id,
  };

  const token = jwt.sign(userForToken, process.env.SECRET);
  res.status(200).json({ token, user: user.username, name: user.name });
});

module.exports = logingRouter;
