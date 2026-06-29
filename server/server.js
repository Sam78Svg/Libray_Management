import express from "express";
import mongoose from "mongoose";
import User from "./db.js";

const app = express();
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/library");

app.get("/", (req, res) => {
    res.send("Hello, World!");
});







// the server will listen on port 5000
app.listen(5000, () => {
    console.log("Server is running on port 5000");
});