import jwt from "jsonwebtoken";
import User from "../models/User.js";

function jwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is required");
    }
    return secret;
}

export async function requireAuth(req, res, next) {
    const authorization = req.get("authorization") || "";
    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "A Bearer token is required" });
    }

    try {
        const payload = jwt.verify(token, jwtSecret());
        if (typeof payload !== "object" || typeof payload.sub !== "string") {
            return res.status(401).json({ error: "Invalid or expired token" });
        }
        const user = await User.findById(payload.sub);
        if (!user) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }
        req.user = user;
        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }
        return next(error);
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "You do not have permission to perform this action" });
        }
        return next();
    };
}

export function getJwtSecret() {
    return jwtSecret();
}
