// require modules
const express = require('express');
const http = require('http');
const app = express();
const bodyParser = require('body-parser')

app.use(express.json());

app.get(`/`,(req, res) => {
  res.send("Hello World");

});

app.get('/users', (req,res) => {
  res.send(users);
});

app.get('/users/:id', (req, res) => {
  const users = users.find(c=> c.id ==== parseInt(req.params.id));
  if (!course) res.status(404).send('Der User mit der ID existiert nicht')
  res.send(users);
}

app.post('/users', (req,res) => {
  const users = {

    id: users.length +1,
    name: req.body.name
  };
  users.push(users);
  res.send(users);
});




const port = process.env.PORT || 3000;
app.listen(port,() => console.log("Listening on port ${port}..."));
