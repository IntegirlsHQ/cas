const app = require("express").Router();
const auth0 = require("../services/auth0");
const USER_CACHE = require("../utils/user_cache");

app.get("/email", (req, res) => {
  res.render("./update/email");
});

app.post("/email", (req, res) => {
  if (!res.locals.user.email_verified) {
    throw new Error("Current email is not verified.");
  } else {
    const email = req.body.email;

    const validator = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    if (!validator(email)) {
      res.status(400);
      return res.render("error", {
        title: "Error",
        statusCode: 400,
        message: "Invalid email address.",
        error: { message: "Invalid email address." },
      });
    } else {
      auth0.updateUser(
        {
          id: req.oidc.user.sub,
        },
        {
          email: email,
        },
        (err, user) => {
          if (err) {
            throw new Error(err);
          } else {
            auth0.sendEmailVerification(
              { user_id: req.oidc.user.sub },
              (err, user) => {
                if (err) {
                  throw new Error(err);
                } else {
                  delete USER_CACHE[req.oidc.user.sub];
                  res.redirect("/?updated=success");
                }
              }
            );
          }
        }
      );
    }
  }
});

app.get("/resend", (req, res) => {
  if (res.locals.user.email_verified) {
    throw new Error("Email already verified.");
  } else {
    auth0.sendEmailVerification({ user_id: req.oidc.user.sub }, (err, user) => {
      if (err) {
        throw new Error(err);
      } else {
        delete USER_CACHE[req.oidc.user.sub];
        res.redirect("/?updated=success");
      }
    });
  }
});

module.exports = app;
