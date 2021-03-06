const express = require("express");
const cors = require("cors");

const { v4: uuidV4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  if (!username) {
    return response.status(400).json({
      error: "You must provide a valid username",
    });
  }

  const user = users.find((user) => user.username === username);
  if (!user) {
    return response.status(404).json({
      error: "Username not found",
    });
  }

  request.user = user;
  next();
}

function validateTodoData(request, response, next) {
  const { title, deadline } = request.body;

  if (!title || !deadline) {
    return response.status(400).json({
      error: "You must provide a valid title and deadline for a todo item",
    });
  }
  const testDate = Date.parse(deadline);
  if (isNaN(testDate)) {
    return response.status(400).json({
      error: "You must provide a valid date as deadline",
    });
  }

  next();
}

function checksExistsUserTodoItem(request, response, next) {
  const { user } = request;
  const { id } = request.params;
  if (!id) {
    return response.status(400).json({
      error: "You must provide a valid Todo's id",
    });
  }

  const todo = user.todos.find((todo) => todo.id === id);
  if (!todo) {
    return response.status(404).json({
      error: "Todo item not found",
    });
  }

  request.todo = todo;
  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  if (!name || !username) {
    return response
      .status(400)
      .json({ error: "You must provide a valid name and username" });
  }

  const usernameAlreadyExists = users.some(
    (user) => user.username === username
  );

  if (usernameAlreadyExists) {
    return response.status(400).json({
      error: "Username already exists",
    });
  }

  const newUser = {
    id: uuidV4(),
    name,
    username,
    todos: [],
  };
  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  response.status(200).json(user.todos);
});

app.post(
  "/todos",
  checksExistsUserAccount,
  validateTodoData,
  (request, response) => {
    const { user } = request;
    const { title, deadline } = request.body;

    const newTodo = {
      id: uuidV4(),
      title,
      done: false,
      deadline: new Date(deadline),
      created_at: new Date(),
    };

    user.todos.push(newTodo);
    return response.status(201).json(newTodo);
  }
);

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  validateTodoData,
  checksExistsUserTodoItem,
  (request, response) => {
    const { todo } = request;
    const { title, deadline } = request.body;

    Object.assign(todo, {
      title,
      deadline: new Date(deadline),
    });
    return response.status(200).send(todo);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksExistsUserTodoItem,
  (request, response) => {
    const { todo } = request;
    todo.done = true;

    return response.status(200).json(todo);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsUserTodoItem,
  (request, response) => {
    const { user, todo } = request;

    user.todos.splice(user.todos.indexOf(todo), 1);
    return response.status(204).send();
  }
);

module.exports = app;
