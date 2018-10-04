//#############################################
//~~~~~~~~~~~~~~~~~~ SETUP - REQUIRES ~~~~~~~~~~~~~~~~~~~~~
//#############################################

//load in express
let express = require('express');
let app = express();

var cookieParser = require('cookie-parser')

// set the view engine to ejs
app.set('view engine', 'ejs');

//#############################################
//~~~~~~~~~~~~~~~~~~ MIDDLEWARE ~~~~~~~~~~~~~~~~~~~~~
//#############################################

app.use(cookieParser());

//Add body parser to handle POST requests
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));


//#############################################
//~~~~~~~~~~~~~~~~~~ DB / HARDCODES ~~~~~~~~~~~~~~~~~~~~~
//#############################################
//Select port
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
};

//#############################################
//~~~~~~~~~~~~~~~~~~ UTILITY FUNCTIONS ~~~~~~~~~~~~~~~~~~~~~
//#############################################

//Returns a random string of random length under 10
function generateRandomString() {
  let length = 6; //Math.floor(Math.random()*6);
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split('');
  let str = "";
  for(var i = 0; i < length; i++) {
    str += possible[Math.floor(Math.random()*possible.length)];
  }
  return str;
}

// returns array of objects that contain certain attribute "attrib"
function filterByAttribute(filteredObj, attrib, value) {
  let fileredObjArray = [];
  for(let obj in filteredObj) {
    if(attrib in filteredObj[obj]){
      fileredObjArray.push(filteredObj[obj]);
    }
  }
  return fileredObjArray.filter((user) => { return user[attrib] == value});
}

// console.log(filterByAttribute(users, "email", "user@example.com"));

//#############################################
//~~~~~~~~~~~~~~~~~~ GET ROUTES ~~~~~~~~~~~~~~~~~~~~~
//#############################################

//DEFINE SERVER FUNCTIONALITY (ROUTES ETC)
//Home page
app.get("/", (req, res) => {
  res.render('pages/index',{user: users[req.cookies["user_id"]]});
});

//GET /register endpoint, which returns a page that includes a form with an email and password field.
//The email field should use type=email and have name=email. The password field should use type=password and have name=password.
// registration page
app.get('/register', function(req, res) {
    res.render('pages/register',{user: users[req.cookies["user_id"]]});
});

// login page
app.get('/login', function(req, res) {
    res.render('pages/login',{user: users[req.cookies["user_id"]]});
});

// about page
app.get('/about', function(req, res) {
    res.render('pages/about', {user: users[req.cookies["user_id"]]});
});

//URLs page
app.get("/urls", (req, res) => {
  res.render('pages/urls_index', {urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  });
});

//create new URL page
app.get("/urls/new", (req, res) => {
  res.render('pages/urls_new', {user: users[req.cookies["user_id"]]});
});

//Specific URL page
app.get("/urls/:id", (req, res) => {
  res.render('pages/urls_show', {
    shortUrl: req.params.id,
    longUrl: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]]
  });
});

//Redirect to actual long URL website
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


//#############################################
//~~~~~~~~~~~~~~~~~~ POST ROUTES ~~~~~~~~~~~~~~~~~~~~~
//#############################################

//Add URL to database
app.post('/urls', (req, res) => {
  let longUrl = req.body.longURL;
  let shortUrl = generateRandomString();
  urlDatabase[shortUrl] = longUrl;
  res.redirect('/urls/' + shortUrl);
});

//Add login cookie
app.post("/login", (req, res) => {
  let matchingUser = filterByAttribute(users, "email", req.body.email);

  if(!matchingUser.length){
    res.status(403).send({ error: "Invalid email" });
  }
  else if(matchingUser[0].password !== req.body.password) {
    res.status(403).send({ error: "Invalid password" });
  }
  else{
    res.cookie("user_id", matchingUser[0].id);
    res.redirect("/");
  }
});

//Add logout and clear cookie
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  if(!req.body.email || !req.body.password){
    res.status(400).send({ error: "Invalid username or password" });
  }

  let emailMatches = filterByAttribute(users, "email", req.body.email);

  if(emailMatches.length) {
    res.status(400).send({ error: "Email already registered." });
  } else {
    let id = generateRandomString();
    users[id] = {id: id, email: req.body.email, password: req.body.password};
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});

app.post("/urls/:shortUrl/delete", (req, res) => {
  delete urlDatabase[req.params.shortUrl];
  res.redirect("/urls", {user: users[req.cookies["user_id"]]});
});

app.post("/urls/:shortUrl", (req, res) => {
  urlDatabase[req.params.shortUrl] = req.body.longUrl;
  res.redirect("/urls", {user: users[req.cookies["user_id"]]});
});

//#############################################
//~~~~~~~~~~~~~~~~~~ LISTEN ~~~~~~~~~~~~~~~~~~~~~
//#############################################

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
