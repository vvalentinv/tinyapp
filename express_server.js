const express = require("express");
const app = express();
const morgan = require("morgan");
const cookieParser = require('cookie-parser');
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const { rndStr, urlsForUser, authenticateUser, findLongURLByShortURL, findUserByUserEmail } = require('./helpers');
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

//home
app.get("/", (req, res) => {
  res.redirect('/urls');
});

//the urls list
app.get("/urls", (req, res) => {
  const id = req.session.id;
  if (!users[id]) {
    return res.redirect('/login');
  }
  const tempDatabase = urlsForUser(users[id], urlDatabase);
  const templateVars = {
    urls: tempDatabase,
    user: users[id]
  };
  console.log(tempDatabase);
  res.render("urls_index", templateVars);
});

//add new urls
app.post("/urls", (req, res) => {
  const id = req.session.id;
  const longURL = req.body.longURL;
  console.log(users[id]);
  if (!users[id]) {
    return res.redirect('/login');
  }
  const shortURL = rndStr(TINYURLSIZE);//reference value to use in redirect
  urlDatabase[shortURL] = { longURL: longURL, userID: users[id].id };// persist data
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
  const link = findLongURLByShortURL(shortURL, urlDatabase);
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

// save edited urls 
app.post('/urls/:shortURL/edit', (req, res) => {
  const id = req.session.id;
  const shortURL = req.params.shortURL;
  if (!users[id] || id !== urlDatabase[shortURL].userID)
    return res.send("Only the URL's owner can make changes!");
  const longURL = req.body.newLongUrl;
  urlDatabase[shortURL] = { longURL: longURL, userID: users[id].id };
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
  res.redirect('/urls');
});

//load register
app.get('/register', (req, res) => {
  const user = null;
  const templateVars = { user };
  res.render('urls_register', templateVars);
});

//persist user
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("email and password cannot be blank")
  }

  const userExists = findUserByUserEmail(email, users);

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

//load login form
app.get('/login', (req, res) => {
  const templateVars = { user: null };
  res.render('urls_login', templateVars);
});

//authenticate user
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const result = authenticateUser(email, password, users);
  if (result.err) {
    return res.status(400).send(result.err);
  }
  req.session.id = result.id;
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
