const express = require('express');
const router = express.Router();
const db = require('../database');
const nodemailer = require('nodemailer');

// Initialize Transporter with Real SMTP Credentials
let transporter;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    console.log(`📧 SMTP Service Configured: ${process.env.SMTP_HOST}`);
} else {
    console.warn("⚠️  SMTP settings not found in .env. Email sending will be disabled or simulated.");
}

// POST Order
router.post('/orders', async (req, res) => {
    console.log("📝 Received Order Request");
    const { name, email, address, items, total } = req.body;

    // 1. Validation
    if (!name || !email || !address || !items || items.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // 2. Save to Database
    const date = new Date().toISOString();
    const itemsString = JSON.stringify(items);

    const sql = `INSERT INTO orders (name, email, address, total, date, items) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [name, email, address, total, date, itemsString];

    try {
        console.log("💾 Saving order to Database...");
        const result = await db.run(sql, params);
        console.log("✅ Order saved. ID:", result.id);
        const orderId = result.id;

        // 3. Send Response IMMEDIATELY to prevent hang
        // The user gets success, we handle email in background.
        res.json({ message: "success", orderId: orderId });

        // 4. Send Email (Background Process)
        if (transporter) {
            console.log("📧 Attempting to send email in background...");
            const htmlContent = generateOrderEmail(name, orderId, items, total, address);

            // Fire and forget (catch error to log it, don't await)
            transporter.sendMail({
                from: '"Velvet Bean" <' + process.env.SMTP_USER + '>',
                to: email,
                subject: `Order Confirmation #${orderId} - Velvet Bean`,
                html: htmlContent,
            })
                .then(info => {
                    console.log("✅ Email sent successfully: %s", info.messageId);
                })
                .catch(emailErr => {
                    console.error("❌ Email failed to send:", emailErr.message);
                    console.error("Check Render Environment Variables (SMTP_USER, SMTP_PASS).");
                });
        } else {
            console.log("⚠️ No transporter configured. Skipping email.");
        }

    } catch (err) {
        console.error("❌ DB Error:", err.message);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Database error: " + err.message });
        }
    }
});

function generateOrderEmail(name, orderId, items, total, address) {
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #333; color: #ddd;">
                <div style="font-weight: bold; color: #fff;">${item.name}</div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #333; color: #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #333; color: #D4AF37; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .email-container { font-family: 'Lato', sans-serif; max-width: 600px; margin: 0 auto; background-color: #121212; color: #e0e0e0; border-radius: 8px; overflow: hidden; }
            .header { background-color: #1a1a1a; padding: 40px 20px; text-align: center; border-bottom: 3px solid #D4AF37; }
            .header h1 { margin: 0; color: #D4AF37; font-family: 'Playfair Display', serif; font-size: 28px; }
            .header p { margin: 10px 0 0; color: #888; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; }
            .content { padding: 40px 30px; }
            .order-info { background-color: #1E1E1E; padding: 20px; border-radius: 4px; margin-bottom: 30px; border-left: 4px solid #D4AF37; }
            .order-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .order-table th { text-align: left; padding: 10px; color: #888; border-bottom: 1px solid #444; font-size: 12px; text-transform: uppercase; }
            .footer { background-color: #000; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .btn { display: inline-block; padding: 10px 20px; background-color: #D4AF37; color: #121212; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td style="padding: 20px 0;">
                    <div class="email-container">
                        <div class="header">
                            <h1>Velvet Bean</h1>
                            <p>Coffee Roasters</p>
                        </div>
                        <div class="content">
                            <h2 style="color: #fff; margin-top: 0;">Order Confirmed</h2>
                            <p style="color: #ccc; line-height: 1.6;">Hello <strong>${name}</strong>,<br>Thank you for choosing Velvet Bean. We're roasting your beans and preparing your pastry with care.</p>
                            
                            <div class="order-info">
                                <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderId}</p>
                                <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
                                <p style="margin: 5px 0;"><strong>Shipping To:</strong> ${address}</p>
                            </div>

                            <table class="order-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th style="text-align: center;">Qty</th>
                                        <th style="text-align: right;">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="2" style="padding: 20px 0; text-align: right; font-weight: bold; color: #fff;">TOTAL</td>
                                        <td style="padding: 20px 0; text-align: right; font-weight: bold; color: #D4AF37; font-size: 18px;">$${total.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} Velvet Bean Coffee Roasters. All rights reserved.</p>
                            <p>123 Coffee Lane, Brew City</p>
                        </div>
                    </div>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

module.exports = router;
