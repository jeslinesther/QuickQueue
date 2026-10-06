const mongoose = require('mongoose');

/**
 * Connects the Express application to MongoDB Atlas via Mongoose.
 * Reads connection string securely from the MONGO_URI environment variable.
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  // 1. Check for missing or placeholder URI
  if (!mongoURI || mongoURI.trim() === '') {
    console.error('❌ MongoDB Connection Error: MONGO_URI is missing from server/.env');
    return null;
  }

  if (mongoURI.includes('<username>') || mongoURI.includes('<password>') || mongoURI.includes('<cluster-url>')) {
    console.warn('⚠️ MongoDB Atlas Notice: MONGO_URI in server/.env still contains placeholder values (<username>, <password>, or <cluster-url>).');
    console.warn('👉 Please update server/.env with your actual MongoDB Atlas connection string to connect.');
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout fast after 5s for clean diagnostics
    });

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Atlas Connection Failed.');

    // 2. Diagnose specific failure reasons
    if (error.name === 'MongoServerSelectionError' || error.message.includes('server selection')) {
      console.error('🔍 Root Cause: IP Whitelist / Network Access Issue in MongoDB Atlas.');
      console.error('👉 Action Required: Open MongoDB Atlas -> "Network Access" -> "Add IP Address" -> Add your current public IP address.');
    } else if (error.message.includes('Authentication failed') || error.message.includes('bad auth')) {
      console.error('🔍 Root Cause: Invalid Database Credentials.');
      console.error('👉 Action Required: Verify your database username and password in MongoDB Atlas -> "Database Access".');
    } else if (error.message.includes('querySrv') || error.message.includes('ENOTFOUND') || error.message.includes('EBADNAME')) {
      console.error('🔍 Root Cause: Invalid Cluster URL or DNS/SRV Lookup Failure.');
      console.error('👉 Action Required: Check that the cluster host in MONGO_URI matches your actual Atlas cluster name.');
    } else {
      console.error(`🔍 Diagnostic Error: ${error.message}`);
    }

    return null;
  }
};

module.exports = connectDB;
