// config.js - Secure version using environment variables
require('dotenv').config();

var config = {};

// Use environment variables for sensitive data
config.mongoURI = {
    production: process.env.MONGODB_URI_PROD || `mongodb+srv://${process.env.DB_USERNAME}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_CLUSTER}/?retryWrites=true&w=majority&appName=${process.env.DB_APP_NAME}`,
    development: process.env.MONGODB_URI_DEV || `mongodb+srv://${process.env.DB_USERNAME}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_CLUSTER}/?retryWrites=true&w=majority&appName=${process.env.DB_APP_NAME}`,
    test: process.env.MONGODB_URI_TEST || `mongodb+srv://${process.env.DB_USERNAME}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_CLUSTER}/?retryWrites=true&w=majority&appName=${process.env.DB_APP_NAME}`,
};

// Add validation to ensure required environment variables are set
const requiredEnvVars = ['DB_USERNAME', 'DB_PASSWORD', 'DB_CLUSTER'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

module.exports = config;