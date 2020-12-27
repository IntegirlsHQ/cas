const dotenv = require("dotenv");
const axios = require("axios").default;

dotenv.load();

// pulls the user's forum information based on universal ID
const getUser = (uid) => {
  axios
    .get(`https://forum.integirls.org/u/by-external/oauth2_basic/${uid}.json`, {
      headers: {
        "Api-Key": process.env.DISCOURSE_KEY,
        "Api-Username": "system",
      },
    })
    .then((response) => {
      console.log(response.data.user.username);
    })
    .catch((err) => {});
};

module.exports = { getUser };
