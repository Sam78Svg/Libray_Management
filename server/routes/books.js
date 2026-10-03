import { Router } from "express";
import mongoose from "mongoose";
import Book from "../models/Book.js";
import BorrowRequest from "../models/BorrowRequest.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const bookFields = ["title", "author", "isbn", "publisher", "publishedYear", "genre", "description", "totalCopies"];

function validId(id) {
    return mongoose.isValidObjectId(id);
}

router.get("/", async (req, res) => {
    const { search, genre, page = "1", limit = "20" } = req.query;
    const pageNumber = Number(page);
    const pageSize = Number(limit);
    if (!Number.isInteger(pageNumber) || pageNumber < 1
        || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
        return res.status(400).json({ error: "page must be positive and limit must be between 1 and 100" });
    }

    const filter = {};
    if (typeof search === "string" && search.trim()) {
        const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = [
            { title: { $regex: escapedSearch, $options: "i" } },
            { author: { $regex: escapedSearch, $options: "i" } },
            { isbn: { $regex: escapedSearch, $options: "i" } }
        ];
    }
    if (typeof genre === "string" && genre.trim()) {
        filter.genre = genre.trim();
    }

    const [books, total] = await Promise.all([
        Book.find(filter).sort({ title: 1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
        Book.countDocuments(filter)
    ]);
    return res.json({ data: books, pagination: { page: pageNumber, limit: pageSize, total } });
});

router.get("/:id", async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ error: "Invalid book ID" });
    }
    const book = await Book.findById(req.params.id);
    if (!book) {
        return res.status(404).json({ error: "Book not found" });
    }
    return res.json(book);
});

router.post("/", requireAuth, requireRole("librarian"), async (req, res) => {
    const input = {};
    for (const field of bookFields) {
        if (req.body[field] !== undefined) {
            input[field] = req.body[field];
        }
    }
    if (typeof input.title !== "string" || !input.title.trim()
        || typeof input.author !== "string" || !input.author.trim()
        || !Number.isInteger(input.totalCopies) || input.totalCopies < 0) {
        return res.status(400).json({ error: "title, author, and a non-negative integer totalCopies are required" });
    }
    if (typeof input.isbn === "string" && !input.isbn.trim()) {
        delete input.isbn;
    }
    input.availableCopies = input.totalCopies;
    return res.status(201).json(await Book.create(input));
});

router.patch("/:id", requireAuth, requireRole("librarian"), async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ error: "Invalid book ID" });
    }
    const updates = {};
    for (const field of bookFields) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "Provide at least one supported book field to update" });
    }
    const book = await Book.findById(req.params.id);
    if (!book) {
        return res.status(404).json({ error: "Book not found" });
    }
    if (updates.totalCopies !== undefined) {
        if (!Number.isInteger(updates.totalCopies) || updates.totalCopies < 0) {
            return res.status(400).json({ error: "totalCopies must be a non-negative integer" });
        }
        if (typeof updates.isbn === "string" && !updates.isbn.trim()) {
            updates.isbn = undefined;
        }
        const checkedOutCopies = book.totalCopies - book.availableCopies;
        if (updates.totalCopies < checkedOutCopies) {
            return res.status(409).json({ error: "totalCopies cannot be less than the number of checked-out books" });
        }
        updates.availableCopies = updates.totalCopies - checkedOutCopies;
    }
    Object.assign(book, updates);
    await book.save();
    return res.json(book);
});

router.delete("/:id", requireAuth, requireRole("librarian"), async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ error: "Invalid book ID" });
    }
    const book = await Book.findById(req.params.id);
    if (!book) {
        return res.status(404).json({ error: "Book not found" });
    }
    const activeRequests = await BorrowRequest.exists({
        book: book.id,
        status: { $in: ["pending", "approved"] }
    });
    if (activeRequests) {
        return res.status(409).json({ error: "Cannot delete a book with pending requests or active loans" });
    }
    await book.deleteOne();
    return res.status(204).end();
});

export default router;
