// server.js - Enhanced with better logging

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3000;

const MONGO_URI = "mongodb://localhost:27017/";
const DB_NAME = "medicinal_plants_db";
const COLLECTION_NAME = "plants";

app.use(cors());
app.use(express.json());

let db;
let client; // Make client accessible for closing

async function connectToMongo() {
    try {
        console.log("Attempting to connect to MongoDB...");
        client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 }); // Add a timeout
        await client.connect();
        db = client.db(DB_NAME);
        console.log(`Successfully connected to MongoDB server.`);
        
        // Verify collection exists and has documents
        const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
        if (collections.length === 0) {
            console.error(`Error: Collection '${COLLECTION_NAME}' does not exist in database '${DB_NAME}'.`);
            console.error("Please make sure you have imported the data correctly.");
            process.exit(1);
        }
        const docCount = await db.collection(COLLECTION_NAME).countDocuments();
        console.log(`Connected to database '${DB_NAME}' and found collection '${COLLECTION_NAME}' with ${docCount} documents.`);

    } catch (err) {
        console.error("--- MONGODB CONNECTION FAILED ---");
        console.error(err);
        console.error("---------------------------------");
        console.error("Troubleshooting steps:");
        console.error("1. Is your MongoDB server running? (e.g., `brew services start mongodb-community` or `sudo systemctl start mongod`)");
        console.error("2. Is the connection string correct? (MONGO_URI)");
        process.exit(1);
    }
}

app.get('/api/plants', async (req, res) => {
    console.log(`Received request for /api/plants with search: '${req.query.search || ''}'`);
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query = {
                $or: [
                    { Plant_Name: searchRegex },
                    { Scientific_Name: searchRegex },
                    { Traditional_Name_Hindi: searchRegex }
                ]
            };
        }

        const plants = await db.collection(COLLECTION_NAME).find(query).toArray();
        console.log(`Found ${plants.length} plants. Sending response.`);
        res.json(plants);

    } catch (err) {
        console.error("Error during /api/plants request:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

connectToMongo().then(() => {
    app.listen(port, () => {
        console.log(`Backend server is ready and listening at http://localhost:${port}` );
    });
});
