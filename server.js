import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI Ethics Chatbot Backend is running!");
});

app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage =
      req.body.message ||
      (Array.isArray(req.body.messages)
        ? req.body.messages[req.body.messages.length - 1].content
        : "");

    if (!userMessage) {
      return res.status(400).json({ error: "No message provided." });
    }

    const systemPrompt =
      process.env.SYSTEM_PROMPT ||
      "You are a concise AI tutor who explains AI ethics clearly and factually.";

    const model =
      process.env.OPENROUTER_MODEL; //
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("❌ Missing OPENROUTER_API_KEY");
      return res.status(500).json({ error: "Server not configured with API key." });
    }

    console.log("➡️ Sending to OpenRouter:", { model, userMessage });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.5,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ OpenRouter API error:", data);
      return res.status(500).json({
        error:
          data?.error?.message ||
          `OpenRouter returned HTTP ${response.status}`,
      });
    }

    const reply = data?.choices?.[0]?.message?.content || "No AI response.";
    res.json({ reply });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for Prisoner's Dilemma move requests.
app.post("/pd-move", async (req, res) => {
  try {
    const history = Array.isArray(req.body.history) ? req.body.history : [];

    const systemPrompt =
      process.env.PD_SYSTEM_PROMPT ||
      "You are a chatbot playing repeated Prisoner's Dilemma. Each turn you MUST reply with exactly one character: 'C' (cooperate) or 'D' (defect) and nothing else. Base your choice only on the provided history. If unsure, choose 'C'.";

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL;

    if (!apiKey) {
      console.error("❌ Missing OPENROUTER_API_KEY for /pd-move");
      return res.status(500).json({ error: "Server not configured with API key." });
    }

    const messageText = `History:\n${history.map((h, i) => `${i + 1}. ${h.role}: ${h.move}`).join("\n")}\n\nPlease reply with a single character: C or D.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: messageText },
        ],
        temperature: 0.2,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ OpenRouter PD API error:", data);
      return res.status(500).json({ error: data?.error?.message || `OpenRouter returned HTTP ${response.status}` });
    }

    const raw = (data?.choices?.[0]?.message?.content || "").toUpperCase();
    const match = raw.match(/[CD]/);
    const move = match ? match[0] : "C";

    res.json({ move, raw });
  } catch (err) {
    console.error("❌ PD move error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});