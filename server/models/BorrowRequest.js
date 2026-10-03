import mongoose from "mongoose";

const borrowRequestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true, index: true },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "returned"],
        default: "pending",
        required: true,
        index: true
    },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    dueAt: Date,
    returnedAt: Date
}, { timestamps: true });

export default mongoose.model("BorrowRequest", borrowRequestSchema);
