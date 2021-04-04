const dotenv = require("dotenv");

const forum = require("../services/forum");
const auth0 = require("../services/auth0");
const USER_CACHE = require("./user_cache");

dotenv.load();

// Middleware request user data from Auth0 or cache
const userCache = (req, res, next) => {
  if (req.oidc.user) {
    if (USER_CACHE[req.oidc.user.sub]) {
      // pull user info from cache
      res.locals.user = USER_CACHE[req.oidc.user.sub];
      console.log(res.locals.user);
      next();
    } else {
      // pull full user data from auth0
      auth0.getUser({ id: req.oidc.user.sub }, (err, user) => {
        USER_CACHE[req.oidc.user.sub] = user;
        res.locals.user = user;
        console.log(res.locals.user);
        next();
      });
    }

  } else {
    next();
  }
};

// Middleware to request user's forum data and load into cache
const forumCache = (req, res, next) => {
  if (req.oidc.user) {
    if (!USER_CACHE[req.oidc.user.sub].forum) {
      forum
        .getUser(req.oidc.user.sub)
        .then((data) => {
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
};

// Middleware to make the `user` object available for all views
const userLocals = (req, res, next) => {
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
};

const domainEnforcement = (req, res, next) => {
  if (req.hostname !== process.env.DOMAIN) {
    return res.redirect('https://' + process.env.DOMAIN + req.originalUrl);
  }
  next();
}

module.exports = { userCache, forumCache, userLocals, domainEnforcement };
