const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected successfully to database: ${conn.connection.name}`);
    } catch (error) {
        console.error(`Database connection error: ${error.message}`);
        process.exit(1); // Stop the application if database configuration fails
    }
};

module.exports = connectDB;