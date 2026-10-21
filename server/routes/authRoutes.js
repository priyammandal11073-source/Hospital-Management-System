import express from "express";
import { login, register } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/authValidators.js";

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);

export default router;