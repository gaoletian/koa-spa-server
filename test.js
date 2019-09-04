const SpaServer = require("./");
const path = require("path");
let server = new SpaServer({
  webRoot: {
    root: path.join(__dirname, "example")
  }
});
server.start();
