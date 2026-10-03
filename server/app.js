import cors from "cors";
import express from "express";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/auth.js";
import bookRoutes from "./routes/books.js";
import libraryRoutes from "./routes/library.js";

const app = express();
const docsPage = fileURLToPath(new URL("../public/index.html", import.meta.url));

app.use(cors());
app.use(express.json({ limit: "1mb", strict: false }));
app.use((req, res, next) => {
    if (req.body === undefined) {
        req.body = {};
    }
    if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be a JSON object" });
    }
    return next();
});

app.get(["/", "/docs"], (req, res) => res.sendFile(docsPage));
app.use("/books", bookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", libraryRoutes);

app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }
    if (error?.code === 11000) {
        return res.status(409).json({ error: "A record with that unique value already exists" });
    }
    if (error?.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Request body must contain valid JSON" });
    }
    if (error?.name === "ValidationError" || error?.name === "CastError") {
        return res.status(400).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: "An unexpected server error occurred" });
});

export default app;
