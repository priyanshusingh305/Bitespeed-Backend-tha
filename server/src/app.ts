import express from "express";
import identifyRoutes from "./routes/index";
import cors from "cors";
import helmet from "helmet";

// Initialize express app
const app = express();

app.use(
	helmet({
		contentSecurityPolicy: false,
	}),
);

// Configure CORS
app.use(
	cors({
		origin: "*", // Allow all origins
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

app.use(express.json());

app.use("/", identifyRoutes);
app.get("/", (req, res) => {
	res.status(200).json({ message: "Welcome to the Identify API" });
});

app.post("/test", (req, res) => {
	console.log("Test route hit", req.body);
	res.status(200).json({ message: "Test successful" });
});

export default app;
