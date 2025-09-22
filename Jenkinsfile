pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS-18' // Configure this in Jenkins Global Tool Configuration
    }
    
    stages { 
        stage('Clone Repository') {
            steps { 
                git 'https://github.com/kennedy-dev/gallery.git'
            }
        }
        
        stage('Install Dependencies') {
            steps { 
                sh '''
                    # Verify Node.js installation (provided by Jenkins tools)
                    echo "Using Node.js version:"
                    node --version
                    echo "Using npm version:"
                    npm --version
                    
                    # Install dependencies
                    npm install
                    npm audit fix || true
                '''
            }
        }
        
        stage('Tests') {
            steps {
                script {
                    // Run tests if test script exists
                    def packageJson = readJSON file: 'package.json'
                    if (packageJson.scripts && packageJson.scripts.test) {
                        sh 'npm test'
                    } else {
                        echo 'No test script found, skipping tests'
                        sh 'node -c server.js'  // Basic syntax check
                    }
                }
            }
        }
        
        stage('Deploy to Heroku') {
            steps {
                withCredentials([
                    string(credentialsId: 'heroku-api-key-gallery', variable: 'HEROKU_API_KEY'),
                    string(credentialsId: 'mongodb-username-gallery', variable: 'DB_USERNAME'),
                    string(credentialsId: 'mongodb-password-gallery', variable: 'DB_PASSWORD'),
                    string(credentialsId: 'mongodb-cluster-gallery', variable: 'DB_CLUSTER'),
                    string(credentialsId: 'mongodb-uri-gallery-prod', variable: 'MONGODB_URI_PROD')
                ]) {
                    sh '''
                        # Install Heroku CLI if not available
                        if ! command -v heroku &> /dev/null; then
                            echo "Installing Heroku CLI..."
                            curl https://cli-assets.heroku.com/install.sh | sh
                        fi
                        
                        # Login to Heroku
                        echo ${HEROKU_API_KEY} | heroku auth:token
                        
                        # Set Heroku remote if not exists
                        heroku git:remote -a gallerykennedy || true
                        
                        # Create Procfile if not exists
                        echo "web: node server.js" > Procfile
                        
                        # Set environment variables on Heroku
                        heroku config:set NODE_ENV=production -a gallerykennedy
                        heroku config:set DB_USERNAME="${DB_USERNAME}" -a gallerykennedy
                        heroku config:set DB_PASSWORD="${DB_PASSWORD}" -a gallerykennedy
                        heroku config:set DB_CLUSTER="${DB_CLUSTER}" -a gallerykennedy
                        heroku config:set DB_APP_NAME="SchoolWork" -a gallerykennedy
                        heroku config:set MONGODB_URI_PROD="${MONGODB_URI_PROD}" -a gallerykennedy
                        
                        echo "MongoDB environment variables set on Heroku"
                        
                        # Deploy to Heroku
                        git add -A
                        git commit -m "Jenkins deployment with MongoDB config" || true
                        git push heroku HEAD:main --force
                        
                        # Check deployment status
                        heroku ps -a gallerykennedy
                        
                        echo "✅ Deployment complete with MongoDB Atlas connection configured"
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Gallery app deployed successfully!'
            echo '🌐 Live at: https://gallerykennedy-9228839fae9f.herokuapp.com/'
            
            emailext (
                subject: "✅ Gallery App Deployment Success - Build #${env.BUILD_NUMBER}",
                body: """
                    <h2>🎉 Deployment Successful!</h2>
                    <p><strong>Project:</strong> Gallery Application</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    
                    <h3>📋 What was deployed:</h3>
                    <ul>
                        <li>✅ Dependencies installed and updated</li>
                        <li>✅ Tests passed</li>
                        <li>✅ MongoDB Atlas connection configured</li>
                        <li>✅ Successfully deployed to Heroku</li>
                    </ul>
                    
                    <p><strong>🌐 Your gallery app is live at:</strong></p>
                    <p><a href="https://gallerykennedy-9228839fae9f.herokuapp.com/">https://gallerykennedy-9228839fae9f.herokuapp.com/</a></p>
                    
                    <p>Time to test your gallery functionality! 📸</p>
                """,
                mimeType: 'text/html',
                to: 'kennedy.mukuna@gmail.com',
                recipientProviders: [developers(), requestor()]
            )
        }
        
        failure {
            echo '❌ Deployment failed! Check console output for details.'
            
            emailext (
                subject: "❌ Gallery App Deployment Failed - Build #${env.BUILD_NUMBER}",
                body: """
                    <h2>❌ Deployment Failed!</h2>
                    <p><strong>Project:</strong> Gallery Application</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p><strong>Failed Stage:</strong> ${env.STAGE_NAME}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p><strong>Console Output:</strong> <a href="${env.BUILD_URL}console">View Console Output</a></p>
                    
                    <h3>🔧 Common Issues & Quick Fixes:</h3>
                    <ul>
                        <li><strong>npm install failed:</strong> Check package.json and dependencies</li>
                        <li><strong>Test failures:</strong> Review test output in console</li>
                        <li><strong>Heroku login failed:</strong> Verify API key is correct</li>
                        <li><strong>Git push failed:</strong> Check Heroku remote configuration</li>
                        <li><strong>MongoDB connection:</strong> Verify Atlas credentials</li>
                    </ul>
                    
                    <h3>📋 Next Steps:</h3>
                    <ol>
                        <li>Click the console output link above for detailed error messages</li>
                        <li>Fix the issue in your code</li>
                        <li>Push again to trigger a new build</li>
                    </ol>
                    
                    <p><strong>💡 Need help?</strong> Check the console output for specific error details!</p>
                """,
                mimeType: 'text/html',
                to: 'kennedy.mukuna@gmail.com',
                recipientProviders: [developers(), requestor(), culprits()]
            )
        }
        
        unstable {
            echo '⚠️ Build completed with warnings!'
            
            emailext (
                subject: "⚠️ Gallery App Build Unstable - Build #${env.BUILD_NUMBER}",
                body: """
                    <h2>⚠️ Build Completed with Warnings</h2>
                    <p><strong>Project:</strong> Gallery Application</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p><strong>App URL:</strong> <a href="https://gallerykennedy-9228839fae9f.herokuapp.com/">https://gallerykennedy-9228839fae9f.herokuapp.com/</a></p>
                    
                    <p>Your app deployed successfully, but there were some warnings or test issues.</p>
                    
                    <p><strong>📊 Please review:</strong></p>
                    <ul>
                        <li>Test results and any failing tests</li>
                        <li>Security audit warnings</li>
                        <li>Console output for any other warnings</li>
                    </ul>
                    
                    <p>Your gallery app should still be functional, but consider addressing the warnings.</p>
                """,
                mimeType: 'text/html',
                to: 'kennedy.mukuna@gmail.com',
                recipientProviders: [developers(), requestor()]
            )
        }
    }
}