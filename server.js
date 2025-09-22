const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
// Remove this line: const config = require('./_config');

require('dotenv').config();

// Define routes
let index = require('./routes/index');
let image = require('./routes/image');

// Initializing the app
const app = express();

const env = process.env.NODE_ENV || 'development';
let MONGODB_URI;

if (env === 'test' && process.env.MONGODB_URI_TEST) {
    MONGODB_URI = process.env.MONGODB_URI_TEST;
} else if (env === 'production' && process.env.MONGODB_URI_PROD) {
    MONGODB_URI = process.env.MONGODB_URI_PROD;
} else if (process.env.MONGODB_URI) {
    MONGODB_URI = process.env.MONGODB_URI;
} else {
    // Only require config when needed for local development
    try {
        const config = require('./_config');
        MONGODB_URI = config.mongoURI[env] || 'mongodb://localhost:27017/gallery';
    } catch (err) {
        console.log('Config file not found, using default connection');
        MONGODB_URI = 'mongodb://localhost:27017/gallery';
    }
}

console.log(`Environment: ${env}`);
console.log(`Database configured: ${MONGODB_URI ? 'Yes' : 'No'}`);

// Rest of your code stays the same...
console.log(`Connecting to: ${MONGODB_URI ? 'Database configured' : 'No database URL'}`);

// connecting the database (modern syntax)
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log(`Connected to Database: ${MONGODB_URI}`);
})
.catch((err) => {
    console.error('Database connection failed:', err);
});

// test if the database has connected successfully
let db = mongoose.connection;
db.once('open', ()=>{
    console.log('Database connected successfully')
})




// View Engine
app.set('view engine', 'ejs');

// Set up the public folder;
app.use(express.static(path.join(__dirname, 'public')));

// body parser middleware
app.use(express.json())


app.use('/', index);
app.use('/image', image);



 
const PORT = process.env.PORT || 5000;
app.listen(PORT,() =>{
    console.log(`Server is listening at http://localhost:${PORT}`)
});


module.exports = app;
