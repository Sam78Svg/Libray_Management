import mongoose from "mongoose";

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    favouriteGenre: { type: String, required: true },
    password: { type: String, required: true, match: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/ },
    registeredAt: { type: Date, default: Date.now }
})

const User = mongoose.model("User", schema);
export default User;