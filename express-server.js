//load in express
let express = require('express');
let app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

//Add body parser to handle POST requests
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));

//Select port
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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


//DEFINE SERVER FUNCTIONALITY (ROUTES ETC)
//Home page
app.get("/", (req, res) => {
  res.render('pages/index');
});

// about page
app.get('/about', function(req, res) {
    res.render('pages/about');
});

//URLs page
app.get("/urls", (req, res) => {
  res.render('pages/urls_index', {urls: urlDatabase});
});

//create new URL page
app.get("/urls/new", (req, res) => {
  res.render('pages/urls_new');
});

//Specific URL page
app.get("/urls/:id", (req, res) => {
  res.render('pages/urls_show', {
    shortUrl: req.params.id,
    longUrl: urlDatabase[req.params.id]
  });
});

//Redirect to actual long URL website
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//Add URL to database
app.post('/urls', (req, res) => {
  let longUrl = req.body.longURL;
  let shortUrl = generateRandomString();
  urlDatabase[shortUrl] = longUrl;
  res.redirect('/urls/' + shortUrl);
});

app.post("/urls/:shortUrl/delete", (req, res) => {
  delete urlDatabase[req.params.shortUrl];
  res.redirect("/urls");
});

app.post("/urls/:shortUrl", (req, res) => {
  urlDatabase[req.params.shortUrl] = req.body.longUrl;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
