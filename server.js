import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// 📨 Yeni Mail.tm e-posta oluştur
app.get("/api/create", async (req, res) => {
  try {
    const domainRes = await fetch("https://api.mail.tm/domains");
    const domainData = await domainRes.json();
    const domain = domainData["hydra:member"][0].domain;

    const random = Math.random().toString(36).substring(2, 10);
    const email = `${random}@${domain}`;
    const password = random;

    // Hesap oluştur
    await fetch("https://api.mail.tm/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: email, password }),
    });

    // Token al
    const tokenRes = await fetch("https://api.mail.tm/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: email, password }),
    });
    const tokenData = await tokenRes.json();

    res.json({
      provider: "Mail.tm",
      email,
      password,
      token: tokenData.token,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ error: "E-posta oluşturulamadı" });
  }
});

// 📥 Inbox getir
app.get("/api/inbox", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(400).json({ error: "Token eksik" });

  try {
    const inboxRes = await fetch("https://api.mail.tm/messages", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const inboxData = await inboxRes.json();

    res.json({
      count: inboxData["hydra:totalItems"],
      messages: inboxData["hydra:member"],
    });
  } catch (error) {
    console.error("Inbox error:", error);
    res.status(500).json({ error: "Inbox alınamadı" });
  }
});

// 📄 Ana sayfa (API açıklaması)
app.get("/", (req, res) => {
  res.send(`
    <h2>📧 10 Dakika Geçici Mail API</h2>
    <p>Provider: <strong>Mail.tm</strong></p>
    <ul>
      <li>GET /api/create → Yeni e-posta oluşturur</li>
      <li>GET /api/inbox → Inbox mesajlarını getirir (Authorization: Bearer token)</li>
    </ul>
    <p>💡 Made by <a href="https://gecici-mail.is-great.net" target="_blank">Geçici Mail</a></p>
  `);
});

app.listen(PORT, () => console.log(`✅ Server ${PORT} portunda çalışıyor`));
