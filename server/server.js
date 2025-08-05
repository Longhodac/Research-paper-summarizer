// server/server.js

require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Use the correct model name
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Connect to MongoDB with proper error handling
const connectDB = async () => {
    try {
        // Remove deprecated options and add proper error handling
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        console.log('Continuing without MongoDB - summaries will not be saved');
    }
};

connectDB();

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Define a schema for summaries
const summarySchema = new mongoose.Schema({
    text: String,
    summarizedText: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Define a model for the schema
const Summary = mongoose.model("Summary", summarySchema);

app.post("/api/summarize", async (req, res) => {
    console.log('Received summarize request');
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "Text is required" });
    }

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key not configured" });
    }

    const prompt = `Summarize this paper in ≤150 words for a technical reader. Include: problem, method, main result, and one limitation: ${text}`;

    try {
        console.log('Making request to Gemini API...');
        
        // Use the correct API format with key in URL
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            }
        );

        console.log('Gemini API response received');

        const summarizedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!summarizedText) {
            console.error('No summary text found in response:', response.data);
            throw new Error("No summary generated");
        }

        console.log('Summary generated successfully');

        // Try to save to MongoDB, but don't fail if it doesn't work
        try {
            if (mongoose.connection.readyState === 1) {
                const newSummary = new Summary({ text, summarizedText });
                await newSummary.save();
                console.log('Summary saved to MongoDB');
            } else {
                console.log('MongoDB not connected - skipping save');
            }
        } catch (dbError) {
            console.error('Failed to save to MongoDB:', dbError.message);
            // Don't fail the request due to database issues
        }

        res.json({ summary: summarizedText });
    } catch (error) {
        console.error("Error calling Gemini API:", error.response?.data || error.message);
        
        // Provide more specific error information
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        
        res.status(500).json({
            error: "Failed to summarize text",
            details: error.response?.data?.error?.message || error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        gemini_api: GEMINI_API_KEY ? 'Configured' : 'Not configured'
    });
});

// Simple test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
});