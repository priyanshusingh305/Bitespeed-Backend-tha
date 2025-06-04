import app from "./app";
import config from "./config/config";
import http from "node:http";

// Create HTTP server
const server = http.createServer(app);

// Handle server errors
server.on("error", (error: NodeJS.ErrnoException) => {
	if (error.syscall !== "listen") {
		throw error;
	}

	const bind = typeof config.port === "string" ? `Pipe ${config.port}` : `Port ${config.port}`;

	// Handle specific listen errors with friendly messages
	switch (error.code) {
		case "EACCES":
			console.error(`${bind} requires elevated privileges`);
			process.exit(1);
			break;
		case "EADDRINUSE":
			console.error(`${bind} is already in use`);
			process.exit(1);
			break;
		default:
			throw error;
	}
});

// Start server
server.listen(config.port, () => {
	console.log(`Server running on port ${config.port}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
	console.log("SIGTERM signal received: closing HTTP server");
	server.close(() => {
		console.log("HTTP server closed");
		process.exit(0);
	});
});

process.on("SIGINT", () => {
	console.log("SIGINT signal received: closing HTTP server");
	server.close(() => {
		console.log("HTTP server closed");
		process.exit(0);
	});
});
