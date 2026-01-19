require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { Pool } = require('pg');

let db;
let isPostgres = false;

// Check if we are in production (Render) using DATABASE_URL
if (process.env.DATABASE_URL) {
    isPostgres = true;
    db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    console.log("🐘 Connected to PostgreSQL Database");
} else {
    // Fallback to SQLite (Local)
    const dbPath = path.resolve(__dirname, 'cafeteria.db');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('Error opening SQLite DB:', err.message);
        else console.log('🗄️  Connected to SQLite Database (Local)');
    });
}

// Unified Interface
const database = {
    isPostgres,

    // Initialize Tables
    init: function () {
        const productsQuery = isPostgres
            ? `CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category TEXT,
                image TEXT
              )`
            : `CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category TEXT,
                image TEXT
              )`;

        const adminsQuery = isPostgres
            ? `CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT
               )`
            : `CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT
               )`;

        const ordersQuery = isPostgres
            ? `CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                address TEXT NOT NULL,
                total REAL NOT NULL,
                date TEXT NOT NULL,
                items TEXT NOT NULL
               )`
            : `CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                address TEXT NOT NULL,
                total REAL NOT NULL,
                date TEXT NOT NULL,
                items TEXT NOT NULL
               )`;

        this.query(productsQuery, []).then(() => this.seed());
        this.query(adminsQuery, []).then(() => {
            this.query("INSERT INTO admins (username, password) VALUES ('admin', 'admin123') ON CONFLICT DO NOTHING", [])
                .catch(err => console.log("Admin seed skipped/error", err.message));
        });
        this.query(ordersQuery, []);
    },

    seed: function () {
        this.query("SELECT count(*) as count FROM products", []).then(rows => {
            const count = isPostgres ? parseInt(rows[0].count) : rows[0].count;
            if (count === 0) {
                const seedData = [
                    ["Ethiopian Yirgacheffe", "Floral and citrus notes with a tea-like body.", 4.50, "coffee", "coffee-1.jpg"],
                    ["Colombia Huila", "Balanced acidity with caramel and fruity undertones.", 4.00, "coffee", "coffee-2.jpg"],
                    ["Espresso Doppio", "Rich, intense double shot with a golden crema.", 3.50, "coffee", "espresso.jpg"],
                    ["Cappuccino Velvet", "Espresso with perfectly micro-foamed milk.", 4.50, "coffee", "cappuccino.jpg"],
                    ["Cold Brew Gold", "Steeped for 24 hours for a smooth, sweet finish.", 5.00, "coffee", "coldbrew.jpg"],
                    ["Almond Croissant", "Flaky nuance with a rich almond cream filling.", 3.75, "pastry", "croissant.jpg"],
                    ["Matcha Scone", "Delicate green tea flavor with white chocolate chunks.", 3.25, "pastry", "scone.jpg"],
                    ["Artisan Bagel", "Hand-rolled bagel with house-made cream cheese.", 3.50, "pastry", "bagel.jpg"]
                ];

                seedData.forEach(p => {
                    this.run("INSERT INTO products (name, description, price, category, image) VALUES (?, ?, ?, ?, ?)", p);
                });
                console.log("🌱 Database seeded.");
            }
        });
    },

    // Wrapper for generic queries (SELECT)
    // Returns Promise<rows>
    query: function (sql, params = []) {
        return new Promise((resolve, reject) => {
            if (isPostgres) {
                // Convert ? to $1, $2...
                let i = 1;
                const pgSql = sql.replace(/\?/g, () => `$${i++}`);
                db.query(pgSql, params, (err, res) => {
                    if (err) return reject(err);
                    resolve(res.rows);
                });
            } else {
                // SQLite: db.all for Selects, but we might want generic. 
                // However, for this project 'query' is mostly used for selects or schema execs that don't need lastID.
                // We use db.all which returns rows. 
                // For logic that ignores rows (like CREATE TABLE), it returns empty array.
                db.all(sql, params, (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows);
                });
            }
        });
    },

    // Wrapper for executing commands (INSERT, UPDATE, DELETE)
    // Returns Promise<{ id: number|null, changes: number }>
    run: function (sql, params = []) {
        return new Promise((resolve, reject) => {
            if (isPostgres) {
                let i = 1;
                let pgSql = sql.replace(/\?/g, () => `$${i++}`);

                // If it's an INSERT, we want the ID. 
                // PG requires 'RETURNING id' to get the generated ID.
                if (pgSql.trim().toUpperCase().startsWith("INSERT")) {
                    pgSql += " RETURNING id";
                }

                db.query(pgSql, params, (err, res) => {
                    if (err) return reject(err);
                    const id = (res.rows[0] && res.rows[0].id) ? res.rows[0].id : null;
                    resolve({ id: id, changes: res.rowCount });
                });
            } else {
                db.run(sql, params, function (err) {
                    if (err) return reject(err);
                    resolve({ id: this.lastID, changes: this.changes });
                });
            }
        });
    },

    // Wrapper for single row (SELECT ONE)
    get: function (sql, params = []) {
        return new Promise((resolve, reject) => {
            this.query(sql, params).then(rows => {
                resolve(rows[0]);
            }).catch(reject);
        });
    }
};

// Auto-initialize
database.init();

module.exports = database;
