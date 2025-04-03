const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// User's data
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

//Load user data
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Registration
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  let users = loadUsers();
  if (users.find(user => user.username === username)) {
    return res.status(400).json({ error: 'Username already exists.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ username, password: hashedPassword });
  saveUsers(users);

  res.json({ message: 'Registration successful.' });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  let users = loadUsers();

  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ error: 'Invalid username or password.' });
  }

  res.json({ message: 'Login successful.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

