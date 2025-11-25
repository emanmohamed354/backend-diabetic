import mongoose from "mongoose";

let isConnected = false; // Track connection status

export const DbConnection = async () => {
    if (isConnected) {
        console.log("Using existing database connection");
        return;
    }

     const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://eman23121:Health263Care.com@cluster0.pefdf.mongodb.net/HealthCare';
    console.log('Connecting to MongoDB with URI:', mongoUri);

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 50000, // Timeout after 50s
        });
        isConnected = true;
        console.log('Database Connected Successfully');
    } catch (error) {
        console.error('Error connecting to the database:', error.message);
    }
};
