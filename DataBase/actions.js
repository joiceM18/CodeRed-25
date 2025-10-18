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

            // Insert new user (password stored in password_hash)
            const [result] = await pool.promise().query(
                `INSERT INTO Users (username, password_hash, created_at) VALUES (?, ?, NOW())`,
                [username, password]
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
            const parsedBody = JSON.parse(body);
            const { username, password } = parsedBody;

            if (!username || !password) {
                throw new Error('Missing required fields');
            }

            // Check in 'user' table
            const [user_check] = await pool.promise().query(
                `SELECT userId, username, password_hash FROM users WHERE username = ? AND password_hash = ?`, [username, password]
            );
            console.log('User Check:', user_check);

            if (user_check.length > 0) {
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    success: true,
                    userId: user_check[0].uderId,
                    userName: user_check[0].username,
                    password: user_check[0].password,
                    message: "User Account"
                }));
                return;
            }

            // If the user is not found in any of the tables
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: false,
                message: "Account not found"
            }));
        }
        catch (err) {
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
