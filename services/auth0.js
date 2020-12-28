/* Create Auth0 Management Client (Token obtained automatically) */
const ManagementClient = require("auth0").ManagementClient;
const dotenv = require("dotenv");

dotenv.load();

const auth0 = new ManagementClient({
  domain: process.env.AUTH_DOMAIN,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.SECRET,
  scope: "read:users update:users",
});

module.exports = auth0;