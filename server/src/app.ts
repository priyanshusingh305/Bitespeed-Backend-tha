import express from "express";
import identifyRoutes from "./routes/index";

const app = express();

app.use(express.json());

app.use("/", identifyRoutes);

app.post("/test", (req, res) => {
	console.log("Test route hit", req.body);
	res.status(200).json({ message: "Test successful" });
});

export default app;
