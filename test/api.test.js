import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import app from "../server/app.js";
import Book from "../server/models/Book.js";
import BorrowRequest from "../server/models/BorrowRequest.js";
import User from "../server/models/User.js";

test("borrow history is relationally linked to its member and book", () => {
    assert.equal(BorrowRequest.schema.path("user").options.ref, "User");
    assert.equal(BorrowRequest.schema.path("book").options.ref, "Book");
    assert.equal(User.schema.virtuals.borrowHistory.options.foreignField, "user");
    assert.equal(Book.schema.virtuals.borrowHistory.options.foreignField, "book");
});

test("API guide is public and catalog reads do not require a token", async (t) => {
    const server = app.listen(0);
    await once(server, "listening");
    t.after(() => {
        const closed = new Promise((resolve) => server.close(resolve));
        server.closeAllConnections();
        return closed;
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const docsResponse = await fetch(`${baseUrl}/docs`);
    assert.equal(docsResponse.status, 200);
    assert.match(await docsResponse.text(), /Member borrowing/);

    const catalogResponse = await fetch(`${baseUrl}/books?page=0`);
    assert.equal(catalogResponse.status, 400);
    assert.deepEqual(await catalogResponse.json(), {
        error: "page must be positive and limit must be between 1 and 100"
    });
});

test("book writes and member routes require authentication", async (t) => {
    const server = app.listen(0);
    await once(server, "listening");
    t.after(() => {
        const closed = new Promise((resolve) => server.close(resolve));
        server.closeAllConnections();
        return closed;
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const bookWrite = await fetch(`${baseUrl}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Example", author: "Writer", totalCopies: 1 })
    });
    assert.equal(bookWrite.status, 401);

    const cartRead = await fetch(`${baseUrl}/api/cart`);
    assert.equal(cartRead.status, 401);

    const requestList = await fetch(`${baseUrl}/api/borrow-requests`);
    assert.equal(requestList.status, 401);
});

test("JSON bodies must be objects", async (t) => {
    const server = app.listen(0);
    await once(server, "listening");
    t.after(() => {
        const closed = new Promise((resolve) => server.close(resolve));
        server.closeAllConnections();
        return closed;
    });

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "null"
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Request body must be a JSON object" });
});
