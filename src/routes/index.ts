import express from "express";
import { identifyContact } from "./identify";

const router = express.Router();

router.post("/", identifyContact);

export default router;
