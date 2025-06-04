import express from "express";
import identifyContact from "./contact";

const router = express.Router();

router.post("/", identifyContact);

export default router;
