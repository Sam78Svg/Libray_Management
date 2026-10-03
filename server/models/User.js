import mongoose from "mongoose";
import validator from "validator";

const { isEmail } = validator;

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: { validator: isEmail, message: "A valid email address is required" }
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["member", "librarian"], default: "member", required: true },
    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }]
}, { timestamps: true });

userSchema.virtual("borrowHistory", {
    ref: "BorrowRequest",
    localField: "_id",
    foreignField: "user"
});

export default mongoose.model("User", userSchema);
