const app = require("express").Router();
const { requiresAuth } = require("express-openid-connect");

const USER_CACHE = require("../utils/user_cache");

app.get("/", (req, res) => {
  res.render("index", {
    isAuthenticated: req.oidc.isAuthenticated(),
    updatedStatus: req.query.updated || false,
  });
});

module.exports = app;
