const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const { MongoClient, ServerApiVersion } = require("mongodb");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.dgti16b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const collection = client.db("portfolio").collection("contact");

    // POST /contact
    app.post("/contact", async (req, res) => {
      const { name, email, subject, message } = req.body;

      // Save to MongoDB
      const result = await collection.insertOne({
        name,
        email,
        subject,
        message,
        date: new Date().toISOString(),
      });

      // Nodemailer setup
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"Portfolio Contact" <${process.env.MAIL_USER}>`,
        to: process.env.MAIL_TO || process.env.MAIL_USER,
        subject: `New Message from ${name}`,
        html: `
          <h2>New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong><br/>${message}</p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        res.json({ acknowledged: result.acknowledged, insertedId: result.insertedId });
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
        res.status(500).json({ error: "Message stored, but email failed to send." });
      }
    });

    app.get("/", (req, res) => {
      res.send("📨 Portfolio Server Running with Email Support");
    });

    // Ping MongoDB to confirm connection
    await client.db("admin").command({ ping: 1 });
    console.log(" Connected to MongoDB!");
  } 
}

run().catch(console.dir);

// Start Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
