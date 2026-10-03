import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDatabase } from "./db.js";
import User from "./models/User.js";

async function createConfiguredLibrarian() {
    const { LIBRARIAN_EMAIL, LIBRARIAN_PASSWORD, LIBRARIAN_NAME = "Library Librarian" } = process.env;
    if (!LIBRARIAN_EMAIL && !LIBRARIAN_PASSWORD) {
        return;
    }
    if (!LIBRARIAN_EMAIL || !LIBRARIAN_PASSWORD || LIBRARIAN_PASSWORD.length < 8) {
        throw new Error("Set both LIBRARIAN_EMAIL and LIBRARIAN_PASSWORD (at least 8 characters) to configure the librarian account");
    }
    const email = LIBRARIAN_EMAIL.trim().toLowerCase();
    const existingUser = await User.findOne({ email });
    if (existingUser?.role === "librarian") {
        return;
    }
    if (existingUser) {
        throw new Error("LIBRARIAN_EMAIL belongs to a member account; configure a different email for the librarian");
    }
    await User.create({
        name: LIBRARIAN_NAME.trim(),
        email,
        passwordHash: await bcrypt.hash(LIBRARIAN_PASSWORD, 12),
        role: "librarian"
    });
    console.log(`Created librarian account for ${email}`);
}

async function start() {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error("JWT_SECRET must be set to a random value of at least 32 characters");
    }
    await connectDatabase();
    await createConfiguredLibrarian();

    const port = Number(process.env.PORT || 5000);
    app.listen(port, () => {
        console.log(`Library API is listening on port ${port}`);
    });
}

start().catch((error) => {
    console.error("Failed to start the Library API:", error);
    mongoose.disconnect().catch((disconnectError) => {
        console.error("Failed to disconnect MongoDB after startup failure:", disconnectError);
    }).finally(() => {
        process.exitCode = 1;
    });
});