const dotenv = require("dotenv");
const express = require("express");
const http = require("http");
const logger = require("morgan");
const path = require("path");
const minifyHTML = require("express-minify-html-2");
const compression = require("compression");
const bodyParser = require("body-parser");
const { auth } = require("express-openid-connect");

const middlewares = require("./utils/middlewares");
const app = express();

dotenv.load();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
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
app.use("/static", express.static(path.join(__dirname, "static")));

app.use(middlewares.userCache);
app.use(middlewares.forumCache);
app.use(middlewares.userLocals);

app.use("/", require("./routes/index"));

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Error handlers
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render("error", {
    title: "Error",
    statusCode: err.status || 500,
    message: err.message,
    error: process.env.NODE_ENV !== "production" ? err : {},
  });
});

http.createServer(app).listen(port, () => {
  console.log(`Listening on ${config.baseURL}`);
});
