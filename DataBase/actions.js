const { stringify } = require('qs');
const pool = require('./database.js');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { get } = require('http');


const getUsers = async (req, res) => {
    try {
        // Return users but exclude password_hash for safety
        const [users] = await pool.promise().query(`SELECT userID, username, created_at FROM Users`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, users }));
    } catch (err) {
        console.error('Error fetching users:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Failed to fetch users' }));
    }
};


const handleSignup = async (req, res) => {
    let body = '';

    req.on('data', (chunk) => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const parsedBody = JSON.parse(body || '{}');
            const { username, password } = parsedBody;

            if (!username || !password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Missing required fields: username and password' }));
                return;
            }

            // Check if username already exists in Users
            const [existing] = await pool.promise().query(
                `SELECT userID FROM Users WHERE username = ? LIMIT 1`,
                [username]
            );

            if (existing.length > 0) {
                res.writeHead(409, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Username already taken' }));
                return;
            }

            // ✅ FIX: hash password before storing
            const hash = await bcrypt.hash(password, 10);

            // Insert new user
            const [result] = await pool.promise().query(
                `INSERT INTO Users (username, password_hash, created_at) VALUES (?, ?, NOW())`,
                [username, hash]
            );

            const userId = result.insertId;

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, userId, message: 'Signup Success' }));
            return;

        } catch (err) {
            console.error('Error during signup:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: err.message || 'Signup Failed' }));
        }
    });
};


const handleLogin = async (req, res) => {
    let body = "";

    req.on("data", (chunk) => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const parsedBody = JSON.parse(body || '{}');
            const { username, password } = parsedBody;

            if (!username || !password) {
                throw new Error('Missing required fields');
            }

            // ✅ FIX: look up by username only
            const [rows] = await pool.promise().query(
                `SELECT userID, username, password_hash FROM users WHERE username = ? LIMIT 1`,
                [username]
            );

            if (!rows.length) {
                // user not found
                res.writeHead(401, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, message: "Invalid credentials" }));
                return;
            }

            const user = rows[0];

            // ✅ FIX: compare bcrypt hash
            const ok = await bcrypt.compare(password, user.password_hash);
            if (!ok) {
                res.writeHead(401, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, message: "Invalid credentials" }));
                return;
            }

            // ✅ FIX: return clean user object (no password)
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({
                                success: true,
                                user: {
                                    userId: user.userID,
                                    username: user.username
                                },
                                message: "User Account"
                        }));
                        return;

        } catch (err) {
            console.error('Error during login:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: err.message || 'Login Failed' }));
        }
    });
};

const getTextbooksByUser = async (userID) => {
    const sql = `SELECT * FROM textbooks WHERE userID = ?`;
    const [rows] = await pool.promise().query(sql, [userID]);
    return rows;
};

const handleRetrieveTextbook = async (req, res) => {
    let body = '';
    req.on("data", (chunk) => {
        body += chunk.toString();
    });

    req.on("end", async () => {
        try {
            const parsed = JSON.parse(body || '{}');
            const { userID } = parsed;
            if (!userID) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, message: "Missing userID" }));
                return;
            }
            const textbooks = await getTextbooksByUser(userID);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, textbooks }));
        } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, message: err.message || "Failed to retrieve textbooks" }));
        }
    });
};

/**
 * Add a textbook record to the database.
 * @param {Object} params
 * @param {string} params.textbook_input - base64 or URL string of input image
 * @param {string} params.textbook_output - base64 or URL string of output image
 * @param {string} params.subject
 * @param {number} params.userID
 * @param {boolean} [params.is_public=true]
 * @returns {Promise<number>} inserted textbookID
 */
const { uploadToAzureBlobFromServer } = require("./azure");
const { Buffer } = require("buffer");

async function addTextbook({ textbook_input, textbook_output, subject, userID, is_public = true }) {
    // If input/output are base64, upload to Azure and use the returned URLs
    let inputUrl = textbook_input;
    let outputUrl = textbook_output;

    // Helper: check if string is base64 (simple check)
    function isBase64(str) {
        return typeof str === "string" && /^data:.*;base64,/.test(str);
    }

    if (isBase64(textbook_input)) {
        // Extract mime and data
        const matches = textbook_input.match(/^data:(.*);base64,(.*)$/);
        const mimeType = matches[1];
        const base64Data = matches[2];
        const ext = mimeType.split("/")[1] || "bin";
        const fileName = `input_${Date.now()}_${Math.floor(Math.random()*10000)}.${ext}`;
        const buffer = Buffer.from(base64Data, "base64");
        inputUrl = await uploadToAzureBlobFromServer(buffer, fileName, mimeType);
    }
    if (isBase64(textbook_output)) {
        const matches = textbook_output.match(/^data:(.*);base64,(.*)$/);
        const mimeType = matches[1];
        const base64Data = matches[2];
        const ext = mimeType.split("/")[1] || "bin";
        const fileName = `output_${Date.now()}_${Math.floor(Math.random()*10000)}.${ext}`;
        const buffer = Buffer.from(base64Data, "base64");
        outputUrl = await uploadToAzureBlobFromServer(buffer, fileName, mimeType);
    }

    const sql = `INSERT INTO textbooks (textbook_input, textbook_output, subject, is_public, userID) VALUES (?, ?, ?, ?, ?)`;
    const values = [inputUrl, outputUrl, subject, is_public, userID];
    const [result] = await pool.promise().query(sql, values);
    return result.insertId;
}

module.exports = {
    getUsers,
    handleSignup,
    handleLogin,
    addTextbook,
    getTextbooksByUser,
    handleRetrieveTextbook
};
