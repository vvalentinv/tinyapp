const express = require("express");
const app = express();
const morgan = require("morgan");
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080
const TINYURLSIZE = 6;
const USERIDSIZE = 6;

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
const findShortURLByLongURL = (longURL) => {
  for (const shortURL in urlDatabase) {
    const url = urlDatabase[shortURL];
    if (url.longURL === longURL) {
      return url;
    }
  }
  return null;
}

app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  s9m5xK: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "q@q.ca",
    password: "123"
  },
  "fG4d34": {
    id: "fG4d34",
    email: "w@w.ca",
    password: "123"
  }
}

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // serve up static files in the public directory
app.use(morgan("dev"));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  const user = findUserByUserID(req.cookies.user_id);

  const templateVars = {
    urls: urlDatabase,
    user: user
  };

  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  const longURL = req.body.longURL;
  console.log(users[userId], longURL);
  if (users[userId]) {
    const shortURL = rndStr(TINYURLSIZE);//reference value to use in redirect
    urlDatabase[shortURL] = { longURL: longURL, userID: userId };// persist data
    console.log(urlDatabase[shortURL]);
    const templateVars = { shortURL: shortURL, longURL: longURL, user: users[userId] };
    res.redirect(`/urls/${shortURL}`, templateVars);
  } else {
    res.redirect(400, '/login');
  }
  // to url details page
});

app.get("/urls/new", (req, res) => {
  const user = findUserByUserID(req.cookies.user_id);
  const templateVars = { urls: urlDatabase, user: user };
  console.log(urlDatabase, user);
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  // const longURL = ...
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  console.log(longURL);
  res.redirect(longURL);
});
//edit
app.get("/urls/:shortURL/edit", (req, res) => {
  const user = findUserByUserID(req.cookies.user_id);
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = {
    urls: urlDatabase,
    user: user,
    shortURL: shortURL,
    longURL: longURL
  };
  res.render("urls_show_edit", templateVars);
});

//read
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const user = findUserByUserID(req.cookies.user_id);
  const templateVars = { shortURL, longURL, user };
  res.render("urls_show", templateVars);
});

// EDIT
//


app.post('/urls/:shortURL/edit', (req, res) => {
  const user = findUserByUserID(req.cookies.user_id);
  const shortURL = req.params.shortURL;
  console.log('POST req.body.newLongUrl', req.body.newLongUrl);
  const longURL = req.body.newLongUrl;
  urlDatabase[shortURL] = { longURL: longURL, userID: user.id };
  res.redirect('/urls');
});


//delete
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});



//logout
app.post('/logout', (req, res) => {
  const user = findUserByUserID(req.cookies.user_id);
  const templateVars = { user };
  res.clearCookie("user_id");
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
    password: password
  };

  res.cookie('user_id', id)
  console.log('users', users);
  res.redirect('/urls');
})

//login
app.get('/login', (req, res) => {
  const templateVars = { user: null };
  res.render('urls_login', templateVars);
});

app.post('/login', (req, res) => {
  console.log('req.body', req.body)
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("email and password cannot be blank")
  }

  const userExists = findUserByUserEmail(email);
  console.log('user', userExists);

  if (!userExists) {
    return res.status(400).send("a user with that email doesn't exist")
  }

  if (userExists.password !== password) {
    return res.status(403).send('your password doesnt match');
  }

  // happy path
  res.cookie('user_id', userExists.id);
  res.redirect('/urls');


  //  res.send('you posted to login')

})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
