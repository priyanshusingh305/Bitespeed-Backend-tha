import express from "express";
// import itemRoutes from './routes/itemRoutes';
import identifyRoutes from "./routes/index";
// import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());

app.use("/identify", identifyRoutes);

app.post("/test", (req, res) => {
	console.log("Test route hit", req.body);
	res.status(200).json({ message: "Test successful" });
});

export default app;
