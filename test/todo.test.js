// tests/todo.test.js
require('dotenv').config({ path: '.env.testing' }); // Ensure environment variables are loaded
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../config/index');


let token;
let userId;
let todoId;
// console.log(process.env.JWT_SECRET)
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Register and log in to get a token
  await request(app).post('/register').send({ username: 'testuser', password: 'password' });
  const res = await request(app).post('/login').send({ username: 'testuser', password: 'password' });
  token = res.body.token;
  const decoded = jwt.decode(token);
  userId = decoded.id;
});

afterAll(async () => {
    const collections = mongoose.connection.collections;

    for (const collection in collections) {
      await collections[collection].deleteMany({});
    }
  
    await mongoose.connection.close();
  
});

describe('Todo CRUD Operations', () => {
  test('Create a new todo', async () => {
    const res = await request(app).post('/todos').set('Authorization', `Bearer ${token}`).send({ text: 'Test Todo' });
    expect(res.statusCode).toBe(201);
    expect(res.body.text).toBe('Test Todo');
    todoId = res.body._id;
  });

  test('Read todos', async () => {
    const res = await request(app).get('/todos').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].text).toBe('Test Todo');
  });

  test('Update a todo', async () => {
    const res = await request(app).put(`/todos/${todoId}`).set('Authorization', `Bearer ${token}`).send({ text: 'Updated Todo', completed: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.text).toBe('Updated Todo');
    expect(res.body.completed).toBe(true);
  });

  test('Delete a todo', async () => {
    const res = await request(app).delete(`/todos/${todoId}`).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Todo deleted successfully');
  });

  test('Protected route without token', async () => {
    const res = await request(app).get('/todos');
    expect(res.statusCode).toBe(401);
  });
});
