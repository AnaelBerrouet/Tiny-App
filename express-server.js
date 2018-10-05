//#############################################
//~~~~~~~~~~~~~~~~~~ SETUP & REQUIRES ~~~~~~~~~~~~~~~~~~~~~
//#############################################

//load in express
let express = require('express');
let app = express();

//Other requires
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

// set the view engine to ejs
app.set('view engine', 'ejs');

//#############################################
//~~~~~~~~~~~~~~~~~~ MIDDLEWARE ~~~~~~~~~~~~~~~~~~~~~
//#############################################

// override with POST having ?_method=DELETE
app.use(methodOverride('_method'));

// app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ["fasdfasdfSecretsPrecious"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//Add body parser to handle POST requests
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));


//#############################################
//~~~~~~~~~~~~~~~~~~ DB / HARDCODES ~~~~~~~~~~~~~~~~~~~~~
//#############################################
//Select port
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": {
    shortUrl: "b2xVn2",
    longUrl: "http://www.lighthouselabs.ca",
    user_id: "userRandomID",
    visits: 100000000000,
    "unique-visits": 1000
  },
  "9sm5xK": {
    shortUrl: "9sm5xK",
    longUrl: "http://www.google.com",
    user_id: "user2RandomID",
    visits: 10000000,
    "unique-visits": 10
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk",10)
  },
};

const visitors = {
  "9sm5xk" : {
    "userRandomID": [Date()]
  }
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


//#############################################
//~~~~~~~~~~~~~~~~~~ GET - ROUTES ~~~~~~~~~~~~~~~~~~~~~
//#############################################

//DEFINE SERVER FUNCTIONALITY (ROUTES ETC)
//Home page
app.get("/", (req, res) => {
  console.log
  res.render('pages/index',{user: users[req.session.user_id]});
});

//GET /register endpoint, which returns a page that includes a form with an email and password field.
//The email field should use type=email and have name=email. The password field should use type=password and have name=password.
// registration page
app.get('/register', function(req, res) {
    res.render('pages/register',{user: users[req.session.user_id]});
});

// login page
app.get('/login', function(req, res) {
    res.render('pages/login',{user: users[req.session.user_id]});
});

// about page
app.get('/about', function(req, res) {
    res.render('pages/about', {user: users[req.session.user_id]});
});

//URLs page
app.get("/urls", (req, res) => {
  let urls = filterByAttribute(urlDatabase, "user_id", req.session.user_id);
  res.render('pages/urls_index', {urls: urls,
    user: users[req.session.user_id]
  });
});

//create new URL page
app.get("/urls/new", (req, res) => {
  if(req.session.user_id){
    res.render('pages/urls_new', {user: users[req.session.user_id]});
  } else {
    res.redirect("/login");
  }

});

//Specific URL page
app.get("/urls/:shortUrl", (req, res) => {

  if(req.session.user_id == urlDatabase[req.params.shortUrl].user_id) {
    res.render('pages/urls_show', {
      url: urlDatabase[req.params.shortUrl],
      user: users[req.session.user_id],
      visits: visitors[req.params.shortUrl]
    });
  } else {
    res.redirect('/urls');
  }
});

//Redirect to actual long URL website
app.get("/u/:shortURL", (req, res) => {

  //add to the number of visits + 1
  urlDatabase[req.params.shortURL].visits += 1;

  //if url has never been used create the enttry in the database
  if(!visitors[req.params.shortURL]) {
    visitors[req.params.shortURL] = {};
  }

  //check if you have an id
  let id = generateRandomString();
  if(!req.session.visitor_id) {
    req.session.visitor_id = id;
    urlDatabase[req.params.shortURL]["unique-visits"] += 1;

  }

  //check if the you have ever visited the url
  if(!visitors[req.params.shortURL][req.session.visitor_id]) {
    visitors[req.params.shortURL][req.session.visitor_id] = [];
  }

  visitors[req.params.shortURL][req.session.visitor_id].push(Date());


  let longURL = urlDatabase[req.params.shortURL].longUrl;
  res.redirect(longURL);
});


//#############################################
//~~~~~~~~~~~~~~~~~~ POST - ROUTES ~~~~~~~~~~~~~~~~~~~~~
//#############################################

//Add URL to database
app.post('/urls', (req, res) => {
  let longUrl = req.body.longURL;
  let shortUrl = generateRandomString();
  let user_id = req.session.user_id;

  urlDatabase[shortUrl] = {
    shortUrl: shortUrl,
    longUrl: longUrl,
    user_id: user_id,
    visits: 0,
    "unique-visits": 0
  };
  res.redirect('/urls/' + shortUrl);
});

//Add login cookie
app.post("/login", (req, res) => {
  let matchingUser = filterByAttribute(users, "email", req.body.email);
  console.log(matchingUser);
  if(!matchingUser.length){
    res.status(403).send({ error: "Invalid email" });
  }
  else if(!bcrypt.compareSync(req.body.password, matchingUser[0].password)) {
    res.status(403).send({ error: "Invalid password" });
  }
  else{
    req.session.user_id = matchingUser[0].id;
    res.redirect("/");
  }
});

//handle user registration
app.post("/register", (req, res) => {

  //check for empty registration fields
  if(!req.body.email || !req.body.password){
    console.log(`status: 400-1`);
    res.status(400).send({ error: "Invalid username or password" });
  }

  //check if email matches any user in database
  let emailMatches = filterByAttribute(users, "email", req.body.email);
  if(emailMatches.length) {
    console.log(`status: 400-2`);
    res.status(400).send({ error: "Email already registered." });
  } else {
    let id = generateRandomString();
    let hashedPassword = bcrypt.hashSync(req.body.password, 10);
    users[id] = {id: id, email: req.body.email, password: hashedPassword};
    req.session.user_id = id;
    res.redirect("/urls");
  }
});

//Add logout and clear cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//#############################################
//~~~~~~~~~~~~~~~~~~ DELETE - ROUTES ~~~~~~~~~~~~~~~~~~~~~
//#############################################

//DELETE - remove url
app.delete("/urls/:shortUrl", (req, res) => {
  if(req.session.user_id == urlDatabase[req.params.shortUrl].user_id) {
    delete urlDatabase[req.params.shortUrl];
  }
  res.redirect("/urls");//, {user: users[req.session.user_id]});
});


//#############################################
//~~~~~~~~~~~~~~~~~~ PUT - ROUTES ~~~~~~~~~~~~~~~~~~~~~
//#############################################

//UPDATE - Edit url
app.put("/urls/:shortUrl", (req, res) => {
  if(req.session.user_id == urlDatabase[req.params.shortUrl].user_id) {
    urlDatabase[req.params.shortUrl] = {
    shortUrl: req.params.shortUrl,
    longUrl: req.body.longUrl,
    user_id: req.session.user_id
    };
  }
  res.redirect("/urls");//, {user: users[req.session.user_id]});
});

//#############################################
//~~~~~~~~~~~~~~~~~~ LISTEN ~~~~~~~~~~~~~~~~~~~~~
//#############################################

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
