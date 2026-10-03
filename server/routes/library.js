import { Router } from "express";
import mongoose from "mongoose";
import Book from "../models/Book.js";
import BorrowRequest from "../models/BorrowRequest.js";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const librarianOnly = [requireAuth, requireRole("librarian")];

router.get("/cart", requireAuth, requireRole("member"), async (req, res) => {
    await req.user.populate("cart");
    res.json({ data: req.user.cart });
});

router.post("/cart/items", requireAuth, requireRole("member"), async (req, res) => {
    const { bookId } = req.body;
    if (!mongoose.isValidObjectId(bookId)) {
        return res.status(400).json({ error: "A valid bookId is required" });
    }
    const book = await Book.findById(bookId);
    if (!book) {
        return res.status(404).json({ error: "Book not found" });
    }
    if (book.availableCopies < 1) {
        return res.status(409).json({ error: "This book is currently unavailable" });
    }
    if (req.user.cart.some((id) => id.equals(book._id))) {
        return res.status(409).json({ error: "This book is already in your cart" });
    }
    req.user.cart.push(book._id);
    await req.user.save();
    return res.status(201).json({ message: "Book added to cart", bookId: book.id });
});

router.delete("/cart/items/:bookId", requireAuth, requireRole("member"), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.bookId)) {
        return res.status(400).json({ error: "Invalid book ID" });
    }
    const previousLength = req.user.cart.length;
    req.user.cart = req.user.cart.filter((id) => !id.equals(req.params.bookId));
    if (req.user.cart.length === previousLength) {
        return res.status(404).json({ error: "Book not found in cart" });
    }
    await req.user.save();
    return res.status(204).end();
});

router.post("/borrow-requests", requireAuth, requireRole("member"), async (req, res) => {
    if (req.user.cart.length === 0) {
        return res.status(409).json({ error: "Your cart is empty" });
    }
    const books = await Book.find({ _id: { $in: req.user.cart } });
    if (books.length !== req.user.cart.length) {
        return res.status(409).json({ error: "One or more cart books no longer exist; remove them and try again" });
    }
    const unavailable = books.find((book) => book.availableCopies < 1);
    if (unavailable) {
        return res.status(409).json({ error: `No copies are currently available for "${unavailable.title}"` });
    }

    const requests = await BorrowRequest.insertMany(req.user.cart.map((book) => ({
        user: req.user._id,
        book
    })));
    await User.updateOne({ _id: req.user._id }, { $set: { cart: [] } });
    return res.status(201).json({
        message: "Borrow request sent to the librarian for approval",
        data: requests
    });
});

router.get("/borrow-requests", requireAuth, async (req, res) => {
    const filter = req.user.role === "librarian" ? {} : { user: req.user._id };
    const requests = await BorrowRequest.find(filter)
        .populate("user", "name email")
        .populate("book", "title author isbn")
        .sort({ requestedAt: -1 });
    return res.json({ data: requests });
});

router.patch("/borrow-requests/:id/decision", ...librarianOnly, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: "Invalid borrow request ID" });
    }
    const { decision } = req.body;
    if (decision !== "approve" && decision !== "reject") {
        return res.status(400).json({ error: "decision must be approve or reject" });
    }
    const request = await BorrowRequest.findById(req.params.id);
    if (!request) {
        return res.status(404).json({ error: "Borrow request not found" });
    }
    if (request.status !== "pending") {
        return res.status(409).json({ error: "Only pending requests can be decided" });
    }

    if (decision === "reject") {
        const rejectedRequest = await BorrowRequest.findOneAndUpdate(
            { _id: request._id, status: "pending" },
            { $set: { status: "rejected" } },
            { new: true }
        );
        if (!rejectedRequest) {
            return res.status(409).json({ error: "This request has already been decided" });
        }
        return res.json({ message: "Borrow request rejected", data: rejectedRequest });
    }

    const book = await Book.findOneAndUpdate(
        { _id: request.book, availableCopies: { $gt: 0 } },
        { $inc: { availableCopies: -1 } },
        { new: true }
    );
    if (!book) {
        return res.status(409).json({ error: "No copies are currently available to approve this request" });
    }
    const decidedRequest = await BorrowRequest.findOneAndUpdate(
        { _id: request._id, status: "pending" },
        { $set: { status: "approved", approvedAt: new Date(), dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) } },
        { new: true }
    );
    if (!decidedRequest) {
        await Book.updateOne({ _id: book._id }, { $inc: { availableCopies: 1 } });
        return res.status(409).json({ error: "This request has already been decided" });
    }
    return res.json({
        message: "Borrow request approved",
        data: { request: decidedRequest, book }
    });
});

router.patch("/borrow-requests/:id/return", ...librarianOnly, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: "Invalid borrow request ID" });
    }
    const request = await BorrowRequest.findOneAndUpdate(
        { _id: req.params.id, status: "approved" },
        { $set: { status: "returned", returnedAt: new Date() } },
        { new: true }
    );
    if (!request) {
        const exists = await BorrowRequest.exists({ _id: req.params.id });
        return exists
            ? res.status(409).json({ error: "Only approved loans can be marked returned" })
            : res.status(404).json({ error: "Borrow request not found" });
    }
    const book = await Book.findByIdAndUpdate(request.book, { $inc: { availableCopies: 1 } }, { new: true });
    if (!book) {
        return res.status(500).json({ error: "Loan marked returned, but its book record is missing" });
    }
    return res.json({ message: "Book marked as returned", data: { request, book } });
});

export default router;
