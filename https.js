const fs = require("fs");

module.exports = {
	cert: fs.readFileSync("/home/ubuntu/fullchain.pem"),
	key: fs.readFileSync("/home/ubuntu/privkey.pem"),
};
