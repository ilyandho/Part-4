const http = require("http");
// Logger util
const logger = require("./utils/logger");
const config = require("./utils/config");
// Routers
const app = require("./app");

const server = http.createServer(app);

const PORT = config.PORT;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
