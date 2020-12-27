const dotenv = require("dotenv");
const express = require("express");
const http = require("http");
const axios = require("axios").default;
const logger = require("morgan");
const path = require("path");
const minifyHTML = require("express-minify-html-2");
const compression = require("compression");
const bodyParser = require("body-parser");
const { auth, requiresAuth } = require("express-openid-connect");

const forum = require("./services/forum");

dotenv.load();

/* Create Auth0 Management Client (Token obtained automatically) */
const ManagementClient = require("auth0").ManagementClient;
const auth0 = new ManagementClient({
  domain: process.env.AUTH_DOMAIN,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.SECRET,
  scope: "read:users update:users",
});

const app = express();

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

const USER_CACHE = {};

// Middleware to make the `user` object available for all views
app.use((req, res, next) => {
  if (req.oidc.user) {
    if (USER_CACHE[req.oidc.user.sub]) {
      // pull user info from cache
      res.locals.user = USER_CACHE[req.oidc.user.sub];
      next();
    } else {
      // pull full user data from auth0
      auth0.getUser({ id: req.oidc.user.sub }, (err, user) => {
        USER_CACHE[req.oidc.user.sub] = user;
        res.locals.user = user;
        next();
      });
    }
  } else {
    next();
  }
});

app.use((req, res, next) => {
  if (req.oidc.user) {
    if (!USER_CACHE[req.oidc.user.sub].forum) {
      forum
        .getUser(req.oidc.user.sub)
        .then((data) => {
          delete data["user_auth_tokens"];
          delete data["groups"];
          delete data["group_users"];
          delete data["user_option"];
          USER_CACHE[req.oidc.user.sub].forum = data;

          if (data.username !== res.locals.user.nickname) {
            // force sync username
            auth0.updateUser(
              { id: req.oidc.user.sub },
              { nickname: data.username },
              (err, user) => {
                if (err) {
                  throw new Error(err);
                } else {
                  delete USER_CACHE[req.oidc.user.sub];
                  res.redirect(req.url);
                }
              }
            );
          } else {
            next();
          }
        })
        .catch((err) => {
          next();
        });
    } else {
      next();
    }
  } else {
    next();
  }
});

// Middleware to make the `user` object available for all views
app.use((req, res, next) => {
  if (req.oidc.user) {
    if (USER_CACHE[req.oidc.user.sub]) {
      // pull user info from cache
      res.locals.user = USER_CACHE[req.oidc.user.sub];
      next();
    } else {
      // pull full user data from auth0
      auth0.getUser({ id: req.oidc.user.sub }, (err, user) => {
        USER_CACHE[req.oidc.user.sub] = user;
        res.locals.user = user;
        next();
      });
    }
  } else {
    next();
  }
});

app.get("/", (req, res) => {
  res.render("index", {
    isAuthenticated: req.oidc.isAuthenticated(),
    updatedStatus: req.query.updated || false,
  });
});

app.get("/picture", requiresAuth(), (req, res) => {
  res.render("gravatar", {
    title: "Profile Picture",
  });
});

app.get("/refresh", requiresAuth(), (req, res) => {
  delete USER_CACHE[req.oidc.user.sub];
  res.redirect("/?updated=success");
});

app.use("/static", express.static(path.join(__dirname, "static")));

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
