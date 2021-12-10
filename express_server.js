const express = require("express");
const app = express();
const morgan = require("morgan");
const cookieParser = require('cookie-parser');
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const PORT = 8080; // default port 8080
const TINYURLSIZE = 6;
const USERIDSIZE = 6;
const salt = bcrypt.genSaltSync(10);


const urlDatabase = {
  b2xVn2: {
    longURL: "https://www.tsn.ca",
    userID: "ccSn0c"
  },
  s9m5xK: {
    longURL: "https://www.google.ca",
    userID: "ccSn0c"
  }
};

const users = {
  ccSn0c: {
    id: 'ccSn0c',
    email: 'q@q.ca',
    password: '$2a$10$pYJC3fy69878K7wk2PIW0uIAfXEARYNhj7stIucgbUYbpatbyLEJ6'
  },
  WUwmyn: {
    id: 'WUwmyn',
    email: 'w@w.ca',
    password: '$2a$10$xFb5xRKwYgRHVrM1K/3oHOESjfXZoNqDj7Th5cC42wDeW8GDeJE/G'
  }
}

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // serve up static files in the public directory
app.use(morgan("dev"));
app.use(cookieParser());
app.use(
  cookieSession({
    name: "session",
    keys: [
      "I like potatoes and gravy and cheese",
      "I prefer filtered coffee over espresso, sometimes",
    ],
  })
);

//Implement the function generateRandomString() here
const rndStr = function generateRandomString(num) {
  let tiny = "";
  const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  for (let i = 0; i < num; i++) {
    tiny += pool[Math.floor(Math.random() * pool.length)]
  }
  return tiny;
}

//Find user by ID
const findUserByUserID = (userId) => {
  for (const id in users) {
    const user = users[id];
    if (user.id === userId) {
      return user;
    }
  }
  return null;
}

//Find user by email
const findUserByUserEmail = (email) => {
  for (const id in users) {
    const user = users[id];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

//Find shortURL by longURL
const findLongURLByShortURL = (shortURL) => {
  for (const id in urlDatabase[shortURL]) {
    if (id === "longURL")
      return urlDatabase[shortURL][id];
  };
}

//handles authentication and conveniently returns the id if successfull
const authenticateUser = (email, password) => {

  if (!email || !password) {
    return { err: "Email or Password cannot be empty!", id: null };
  }

  const userExists = findUserByUserEmail(email);
  console.log('user', userExists);

  if (!userExists) {
    return { err: "User not found", id: null };
  }
  const passwordMatch = bcrypt.compareSync(password, userExists.password);
  if (!passwordMatch) {
    return { err: 'Your password doesnt match', id: null };
  }
  return { err: null, id: userExists.id };
}

//returns new urlDatabase with urls that belong to the user only
const urlsForUser = (user) => {
  const userURLs = {}
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === user.id) {
      userURLs[shortURL] = { longURL: urlDatabase[shortURL].longURL, userID: user.id }
    }
  }
  return userURLs;
}


app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  const id = req.session.id;
  if (!users[id]) {
    return res.redirect('/login');
  }
  const tempDatabase = urlsForUser(users[id]);
  const templateVars = {
    urls: tempDatabase,
    user: users[id]
  };
  console.log(tempDatabase);
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const id = req.session.id;
  const longURL = req.body.longURL;
  console.log(users[id]);
  if (!users[id]) {
    return res.redirect('/login');
  }
  const shortURL = rndStr(TINYURLSIZE);//reference value to use in redirect
  urlDatabase[shortURL] = { longURL: longURL, userID: users.id };// persist data
  console.log(urlDatabase);
  //const templateVars = { urls: urlDatabase, user: user };
  res.redirect(`/urls/${shortURL}`);

  // to url details page
});

app.get("/urls/new", (req, res) => {
  const id = req.session.id;
  const templateVars = { urls: urlDatabase, user: users[id] };
  console.log(urlDatabase, users[id]);
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  // const longURL = ...
  const shortURL = req.params.shortURL;
  const link = findLongURLByShortURL(shortURL);
  res.redirect(link);
});
//edit
app.get("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  const id = req.session.id;
  const longURL = urlDatabase[shortURL].longURL;

  const templateVars = {
    urls: urlDatabase,
    user: users[id],
    shortURL: shortURL,
    longURL: longURL
  };
  res.render("urls_show_edit", templateVars);
});

//read
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const id = req.session.id;
  const urls = urlDatabase;
  const templateVars = { urls, shortURL, user: users[id] };
  res.render("urls_show", templateVars);
});

// EDIT
//


app.post('/urls/:shortURL/edit', (req, res) => {
  const id = req.session.id;
  const shortURL = req.params.shortURL;
  if (!users[id] || id !== urlDatabase[shortURL].userID)
    return res.send("Only the URL's owner can make changes!");
  const longURL = req.body.newLongUrl;
  urlDatabase[shortURL] = { longURL: longURL, userID: user.id };
  res.redirect('/urls');
});


//delete
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  const id = req.session.id;
  if (!users[id] || id !== urlDatabase[shortURL].userID)
    return res.send("Only the URL's owner can make changes!");
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

//logout
app.post('/logout', (req, res) => {
  delete req.session.id;
  console.log(user);
  res.redirect('/urls');
});

//register
app.get('/register', (req, res) => {
  const user = null;
  const templateVars = { user };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("email and password cannot be blank")
  }

  const userExists = findUserByUserEmail(email);

  if (userExists) {
    return res.status(400).send('a user with that email already exists');
  }

  const id = rndStr(USERIDSIZE);

  users[id] = {
    id: id,
    email: email,
    password: bcrypt.hashSync(password, salt)
  };
  console.log(users);
  req.session.id = id;
  return res.redirect('/urls');
})

//login
app.get('/login', (req, res) => {
  const templateVars = { user: null };
  res.render('urls_login', templateVars);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const result = authenticateUser(email, password);
  if (result.err) {
    return res.status(400).send(result.err);
  }
  req.session.id = result.id;
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
