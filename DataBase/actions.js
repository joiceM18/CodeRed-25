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
                `SELECT userID, username, password_hash FROM Users WHERE username = ? LIMIT 1`,
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
                userId: user.userID,
                userName: user.username,
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



module.exports = {
    getUsers,
    handleSignup,
    handleLogin
};
