import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, trim: true, sparse: true, unique: true },
    publisher: { type: String, trim: true },
    publishedYear: { type: Number, min: 0 },
    genre: [{ type: String, trim: true }],
    description: { type: String, trim: true },
    totalCopies: { type: Number, required: true, min: 0 },
    availableCopies: { type: Number, required: true, min: 0 }
}, { timestamps: true });

bookSchema.path("availableCopies").validate(function (availableCopies) {
    return availableCopies <= this.totalCopies;
}, "Available copies cannot exceed total copies");

bookSchema.virtual("borrowHistory", {
    ref: "BorrowRequest",
    localField: "_id",
    foreignField: "book"
});

export default mongoose.model("Book", bookSchema);
