import { Router } from "express";
import { identifyContact, getAllContacts } from "../controllers/contact";

const router = Router();

router.get("/getall", getAllContacts);
router.post("/identify", identifyContact);

export default router;
