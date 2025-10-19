const http = require('http');
const url = require('url');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./database.js');
const Routes = require('./route'); 
const cors = require('cors');



const map_route = {
  'GET': ['/getUsers', '/api/users'],
  'POST': [
    '/signup',
    '/login',
    '/api/auth/register',
    '/api/auth/login',
    '/api/textbook/add',
    '/retrieveTextbook',
    '/api/textbook/retrieve'
  ],
  'PUT': [],
  'DELETE': [],
};


const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Or specify your frontend URL
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;
  const method = req.method;
  console.log(`Requested Path: ${pathname}, Method: ${method}`);

  // ---- alias modern API paths to your existing Routes paths (no deletions) ----
  const key = `${method} ${pathname}`;
  const aliasMap = {
    "POST /api/auth/register": "/signup",
    "POST /api/auth/login": "/login",
    "GET /api/users": "/getUsers",
  };

  // If there's an alias, rewrite req.url so your existing Routes can handle it
  if (aliasMap[key]) {
    // preserve querystring if any
    const queryString = parsedUrl.search || "";
    req.url = aliasMap[key] + queryString;
    console.log(`Aliased ${key} -> ${req.url}`);
  }


  if (pathname === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify("From backend side"));
      return;
  }

  const isMatch = (map_route[method] || []).some(route =>
    pathname.startsWith(route)
  );

  if (isMatch) {
    return Routes(req, res);
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Route Not Found" }));
});

// Port Configuration
const PORT = process.env.PORT || 5000;

// Start Server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

/*
//basically allows for uploaded files to be accessible via URL
const express = require('express');
const path = require('path');
const app = express();

// Serve uploads as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const songRoutes = require('./routes/songRoutes');
app.use('/api/songs', songRoutes);

*/

/*
const express = require('express');
const dotenv = require('dotenv');
const songRoutes = require('./routes/songRoutes');
const artistRoutes = require('./routes/artistRoutes');
const albumRoutes = require('./routes/albumRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize express
dotenv.config();
const app = express();
app.use(express.json());

// API Routes
app.use('/api/songs', songRoutes);
app.use('/api/artists', artistRoutes);
*/