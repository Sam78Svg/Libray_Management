import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import User from "../models/User.js";
import { getJwtSecret, requireAuth } from "../middleware/auth.js";

const router = Router();
const { isEmail } = validator;

function createToken(user) {
    return jwt.sign({}, getJwtSecret(), {
        subject: user.id,
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
    });
}

router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (typeof name !== "string" || !name.trim()
        || typeof email !== "string" || !isEmail(email.trim())
        || typeof password !== "string" || password.length < 8) {
        return res.status(400).json({ error: "name, a valid email, and a password of at least 8 characters are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
        return res.status(409).json({ error: "An account with this email already exists" });
    }
    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 12),
        role: "member"
    });
    return res.status(201).json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token: createToken(user)
    });
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (typeof email !== "string" || !isEmail(email.trim()) || typeof password !== "string") {
        return res.status(400).json({ error: "A valid email and password are required" });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid email or password" });
    }
    return res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token: createToken(user)
    });
});

router.get("/me", requireAuth, (req, res) => {
    res.json({ id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role });
});

export default router;
