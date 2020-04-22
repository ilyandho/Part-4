const supertest = require('supertest');
const mongoose = require('mongoose');
require('express-async-errors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const helper = require('./test_helper');
const app = require('../app');
const api = supertest(app);

const Blog = require('../models/Blog');
const User = require('../models/User');

let globalToken = '';

beforeEach(async () => {
  await Blog.deleteMany({});
  await User.deleteMany({});
  console.log('cleared Dbs');

  const passwordHash = await bcrypt.hash('sekret', 10);
  const user = new User({ username: 'root', name: 'Root User', passwordHash });
  await user.save();

  const loginDetails = {
    username: 'root',
    password: 'sekret',
  };
  const userDetails = await api.post('/api/login/').send(loginDetails);
  const { token, username, name } = userDetails.body;
  globalToken = token;

  console.log('Innitialising Blog Dbs ...');

  const promiseArray = helper.initialBlogs.map((blog) => {
    return api
      .post('/api/blogs/')
      .set('Authorization', `Bearer ${token}`)
      .send(blog);
  });
  await Promise.all(promiseArray);

  console.log('Dbs is innitialised');
});

describe('When there is innititially some blogs in the database, ', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('unique identifier property of the blog posts is named id', async () => {
    const blog = await Blog.findOne();
    console.log('uniques id', blog);
    const props = [];
    for (const prop in blog) {
      props.push(prop);
    }
    expect(props).toContain('id');
  });

  describe('addition of a new blog, ', () => {
    test('successfully creates a new blog post', async () => {
      const newBlog = {
        title: 'Fourth Blog',
        url: 'http://localhost:3003/api/blogs',
        likes: 23,
      };

      await api
        .post('/api/blogs/')
        .set('Authorization', `Bearer ${globalToken}`)
        .send(newBlog)

        .expect(201)
        .expect('Content-Type', /application\/json/);

      const response = await api.get('/api/blogs');

      const blogs = response.body.map((blog) => blog.title);

      expect(response.body).toHaveLength(helper.initialBlogs.length + 1);
      expect(blogs).toContain('Fourth Blog');
    });

    test('fails with status code  401 if the user is not logged in', async () => {
      const newBlog = {
        title: 'Fourth Blog',
        url: 'http://localhost:3003/api/blogs',
        likes: 23,
      };

      await api.post('/api/blogs/').send(newBlog).expect(401);
    });
    test('if the likes property is missing from the request, it will default to the value 0', async () => {
      const newBlog = {
        title: 'Fifth Blog',
        url: 'http://localhost:3003/api/blogs',
      };

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${globalToken}`)
        .send(newBlog);

      const response = await Blog.findOne({ title: 'Fifth Blog' });

      const { likes } = response;

      expect(likes).toBe(0);
    });

    test('if the "title" and "url" properties are missing from the request data, the backend responds to the request with the status code 400 Bad Request', async () => {
      const newBlog = {
        author: 'Test',
      };

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${globalToken}`)
        .send(newBlog)
        .expect(400);
    });
  });

  describe('Updating a blog', () => {
    test('successfully updates a blog post if id is valid and user is logged in', async () => {
      const newBlog = {
        title: 'Fourth Blog',
        url: 'http://localhost:3003/api/blogs',
      };

      await api
        .post('/api/blogs/')
        .set('Authorization', `Bearer ${globalToken}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/);

      const blog = await Blog.findOne({ title: 'Fourth Blog' });

      const id = blog['id'];

      console.log(id);

      const response = await api
        .put(`/api/blogs/${id}`)
        .set('Authorization', `Bearer ${globalToken}`)
        .send({ likes: 1 })
        .expect(201);

      const likes = response.body.likes;

      expect(likes).toBe(1);
    });
    test('fails with status code 401 if the user is not logged in', async () => {
      const newBlog = {
        title: 'Fourth Blog',
        url: 'http://localhost:3003/api/blogs',
      };

      await api.post('/api/blogs/').send(newBlog).expect(401);
    });
    test('fails with a status code 400 if the id is invalid', async () => {
      const invalidId = '5ea04b736ef98c3074c42806';

      const response = await api
        .put(`/api/blogs/${invalidId}`)
        .set('Authorization', `Bearer ${globalToken}`)
        .send({ likes: 1 })
        .expect(400);
    });
  });

  describe('Deletion of a blog,', () => {
    test('succeeds with status code 204 if id is valid and user is logged in', async () => {
      const newBlog = {
        title: 'Fourth Blog',
        url: 'http://localhost:3003/api/blogs',
        likes: 23,
      };

      await api
        .post('/api/blogs/')
        .set('Authorization', `Bearer ${globalToken}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/);

      const blog = await Blog.findOne({ title: 'Fourth Blog' });

      const id = blog['id'];

      console.log(id);

      // await api.get('/api/blogs');

      await api
        .delete(`/api/blogs/${id}`)
        .set('Authorization', `Bearer ${globalToken}`)
        .expect(204);
    });

    test('fails with status code 401 if the user is not logged in', async () => {
      const newBlog = {
        title: 'Fourth Blog',
        url: 'http://localhost:3003/api/blogs',
        likes: 23,
      };

      await api.post('/api/blogs/').send(newBlog).expect(401);
    });
  });
});

afterAll(() => {
  mongoose.connection.close();
});
