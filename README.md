# Darkroom Gallery Application

A Node.js web application for uploading and managing images with automated CI/CD deployment pipeline.

## Features

- **Image Upload**: Upload images through a web interface
- **Gallery View**: Browse uploaded images in a responsive grid layout
- **Individual Image View**: View individual images with details
- **Database Storage**: Image metadata stored in MongoDB Atlas
- **Automated Testing**: Comprehensive test suite with separate test database
- **CI/CD Pipeline**: Automated deployment via Jenkins with Slack notifications

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Frontend**: EJS templating, Materialize CSS
- **File Upload**: Multer middleware
- **Testing**: Mocha, Chai, Chai-HTTP
- **Deployment**: Heroku
- **CI/CD**: Jenkins
- **Notifications**: Slack integration

## Architecture

```
├── models/
│   └── images.js          # MongoDB schema for images
├── routes/
│   ├── index.js           # Main gallery routes
│   ├── image.js           # Individual image routes
│   └── upload.js          # File upload handling
├── views/
│   ├── index.ejs          # Gallery homepage
│   └── singleImage.ejs    # Individual image view
├── test/
│   └── serverTest.js      # Test suite
├── public/
│   ├── css/
│   └── images/            # Uploaded images (ephemeral on Heroku)
├── server.js              # Main application server
├── Jenkinsfile            # CI/CD pipeline configuration
└── package.json           # Dependencies and scripts
```

## Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Heroku account (for deployment)
- Jenkins (for CI/CD)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/kennedy-dev/gallery.git
   cd gallery
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file:
   ```
   MONGODB_URI=mongodb://localhost:27017/gallery
   NODE_ENV=development
   PORT=5000
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Access the application**
   Open http://localhost:5000

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development`, `test`, `production` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | Database connection string | `mongodb://localhost:27017/gallery` |
| `MONGODB_URI_PROD` | Production database | `mongodb+srv://...` |
| `MONGODB_URI_TEST` | Test database | `mongodb+srv://...` |

## Testing

The application includes comprehensive tests using Mocha and Chai.

### Run Tests Locally
```bash
npm test
```

### Test Environment
Tests use a separate MongoDB database (`darkroom-test`) to avoid affecting production data.

### CI/CD Testing
- Tests run automatically on every push via Jenkins
- Uses environment-specific database connections
- Deployment only occurs if all tests pass

## Deployment

### Heroku Deployment

1. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI_PROD="your-mongodb-connection-string"
   ```

3. **Deploy**
   ```bash
   git push heroku master
   ```

### Automated CI/CD Pipeline

The application uses Jenkins for automated deployment:

1. **Trigger**: GitHub webhook on push to master
2. **Build Process**:
   - Clone repository
   - Install Node.js dependencies
   - Run comprehensive test suite
   - Deploy to Heroku if tests pass
   - Send Slack notification on success/failure

3. **Pipeline Configuration**: See `Jenkinsfile` for complete pipeline setup

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Main gallery view |
| `POST` | `/upload` | Upload new image |
| `GET` | `/image/:id` | View individual image |
| `PUT` | `/image/:id` | Update image metadata |
| `DELETE` | `/image/:id` | Delete image |

## Database Schema

### Images Collection
```javascript
{
  _id: ObjectId,
  name: String,        // Original filename
  size: Number,        // File size in bytes
  path: String,        // Relative path to image file
  createdAt: Date,     // Upload timestamp
  updatedAt: Date      // Last modification
}
```

## Known Limitations

### File Storage
- **Heroku Ephemeral Filesystem**: Uploaded images are lost when dynos restart
- **Recommendation**: Implement cloud storage (AWS S3, Cloudinary) for production use
- **Current Behavior**: Only recently uploaded images remain visible after dyno restarts

### Scalability
- File upload is handled by single server instance
- No image optimization or resizing
- No user authentication or access control

## Development Workflow

1. **Feature Development**
   - Create feature branch
   - Implement changes with tests
   - Commit with descriptive messages

2. **Testing**
   - Run tests locally: `npm test`
   - Ensure all tests pass before pushing

3. **Deployment**
   - Push to master branch
   - Jenkins automatically runs tests
   - Automatic deployment to Heroku if tests pass
   - Slack notification sent on completion

## Troubleshooting

### Common Issues

**Images not displaying after deployment**
- Cause: Heroku's ephemeral filesystem deleted uploaded files
- Solution: Implement cloud storage or accept that only recent uploads persist

**Database connection errors**
- Check MongoDB Atlas whitelist settings
- Verify connection string format and credentials
- Ensure environment variables are properly set

**Test failures**
- Verify test database connection string
- Check for syntax errors in updated code
- Review Jenkins build logs for specific error details

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Live Application

**Production URL**: https://gallerykennedy-9228839fae9f.herokuapp.com/

**Repository**: https://github.com/kennedy-dev/gallery

---

*This application demonstrates modern DevOps practices including automated testing, continuous integration, and deployment automation with comprehensive monitoring and notifications.*
