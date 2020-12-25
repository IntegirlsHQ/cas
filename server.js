const dotenv = require("dotenv");
const express = require("express");
const http = require("http");
const logger = require("morgan");
const path = require("path");
const minifyHTML = require("express-minify-html-2");
const compression = require("compression");
const { auth, requiresAuth } = require("express-openid-connect");

dotenv.load();

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(
  minifyHTML({
    override: true,
    exception_url: false,
    htmlMinifier: {
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeEmptyAttributes: true,
      minifyJS: true,
      minifyCSS: true,
    },
  })
);
app.use(compression());

const config = {
  authRequired: false,
  auth0Logout: true,
};

const port = process.env.PORT || 3000;
if (
  !config.baseURL &&
  !process.env.BASE_URL &&
  process.env.PORT &&
  process.env.NODE_ENV !== "production"
) {
  config.baseURL = `http://localhost:${port}`;
}

app.use(auth(config));

// Middleware to make the `user` object available for all views
app.use(function (req, res, next) {
  res.locals.user = req.oidc.user;
  next();
});

app.get("/", (req, res) => {
  res.render(__dirname + "/views/index.ejs", {
    isAuthenticated: req.oidc.isAuthenticated(),
  });
});

app.get("/loggedout", (req, res) => {
  res.render(__dirname + "/views/loggedout.ejs");
})

app.use("/static", express.static(path.join(__dirname, "static")));

http.createServer(app).listen(port, () => {
  console.log(`Listening on ${config.baseURL}`);
});
