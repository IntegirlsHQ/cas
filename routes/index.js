const app = require("express").Router();

const { requiresAuth } = require("express-openid-connect");

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

module.exports = app;
