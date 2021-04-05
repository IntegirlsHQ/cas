const app = require("express").Router();

app.get('/discord', (req, res) => {
    res.render('link/discord')
})

module.exports = app;