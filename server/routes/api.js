const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists (for Render ephemeral filesystem safety)
const uploadDir = path.join(__dirname, '../../public/uploads/');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for Image Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- Products API ---

// GET All Products
router.get('/products', async (req, res) => {
    try {
        const rows = await db.query("SELECT * FROM products");
        res.json({
            "message": "success",
            "data": rows
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// POST Create Product
router.post('/products', upload.single('image'), async (req, res) => {
    // Basic Auth Check
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const { name, description, price, category } = req.body;
    const image = req.file ? req.file.filename : 'placeholder.jpg';

    const sql = 'INSERT INTO products (name, description, price, category, image) VALUES (?,?,?,?,?)';
    const params = [name, description, price, category, image];

    try {
        const result = await db.run(sql, params);
        res.json({
            "message": "success",
            "data": { id: result.id },
            "id": result.id
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// DELETE Product
router.delete('/products/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const sql = 'DELETE FROM products WHERE id = ?';
    try {
        const result = await db.run(sql, [req.params.id]);
        res.json({ message: "deleted", changes: result.changes });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// --- Admin API ---

// POST Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM admins WHERE username = ? AND password = ?";

    try {
        const row = await db.get(sql, [username, password]);
        if (row) {
            res.json({
                "message": "success",
                "token": "admin-secret-token-123"
            });
        } else {
            res.status(401).json({ "message": "Invalid credentials" });
        }
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

module.exports = router;
