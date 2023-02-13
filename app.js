const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

function hasPriorityAndStatus(queryRequest) {
  return (
    queryRequest.priority !== undefined && queryRequest.status !== undefined
  );
}

function hasPriority(queryRequest) {
  return queryRequest.priority !== undefined;
}
function hasStatus(queryRequest) {
  return queryRequest.status !== undefined;
}

function putHasStatus(requestBody) {
  return requestBody.status !== undefined;
}

function putHasPriority(requestBody) {
  return requestBody.priority !== undefined;
}

function putHasTodo(requestBody) {
  return requestBody.todo !== undefined;
}
//listWithStatusTodo
app.get("/todos/", async (request, response) => {
  let todoQuery = "";
  let listResponse = null;
  const { search_q = "", status, priority } = request.query;
  console.log(search_q, status, priority);
  switch (true) {
    case hasPriorityAndStatus(request.query):
      todoQuery = `SELECT * FROM todo WHERE status='${status}' AND priority='${priority}'
            AND todo LIKE '%${search_q}%';`;
      break;
    case hasPriority(request.query):
      todoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}';`;
      break;
    case hasStatus(request.query):
      todoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}';`;
      break;
    default:
      todoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
  }
  console.log(todoQuery);
  listResponse = await db.all(todoQuery);
  response.send(listResponse);
});

//todoBasedOnId
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const listQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const list = await db.get(listQuery);
  response.send(list);
});

//todoPOST
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const postQuery = `INSERT INTO todo(id,todo,priority,status)
    VALUES(${id},'${todo}','${priority}','${status}');`;
  await db.run(postQuery);
  response.send("Todo Successfully Added");
  console.log(todoDetails);
});

//todoPut
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  const { status, priority, todo } = todoDetails;
  let todoQuery = "";
  let listResponse = null;
  console.log(status, priority, todo);
  switch (true) {
    case putHasStatus(request.body):
      todoQuery = `UPDATE todo SET status='${status}' WHERE id=${todoId};`;
      listResponse = await db.all(todoQuery);
      response.send("Status Updated");
      break;
    case putHasPriority(request.body):
      todoQuery = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`;
      listResponse = await db.all(todoQuery);
      response.send("Priority Updated");
      break;
    case putHasTodo(request.body):
      todoQuery = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`;
      listResponse = await db.all(todoQuery);
      response.send("Todo Updated");
      break;
  }
});

//deleteTodo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
        todo
    WHERE
        id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
