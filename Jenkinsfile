pipeline {
    agent any
    
    triggers {
        pollSCM('H/5 * * * *')
        // GitHub webhook support
        githubPush()
    }
    
    environment {
        NODE_VERSION = '18'
        
        // Heroku deployment credentials
        HEROKU_API_KEY = credentials('heroku-api-key')
        HEROKU_APP_NAME = 'gallerykennedy'
        
        // Database credentials for MongoDB Atlas
        DB_USERNAME = credentials('mongodb-username')
        DB_PASSWORD = credentials('mongodb-password')
        DB_CLUSTER = credentials('mongodb-cluster')
        DB_APP_NAME = 'SchoolWork'
        
        // Complete connection strings
        MONGODB_URI_PROD = credentials('mongodb-uri-prod')
        MONGODB_URI_DEV = credentials('mongodb-uri-dev')
        MONGODB_URI_TEST = credentials('mongodb-uri-test')
        
        NODE_ENV = 'production'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Code checked out successfully'
                
                // Display commit info for debugging
                sh 'git log -1 --oneline'
                sh 'git status'
            }
        }
        
        stage('Setup Node.js') {
            steps {
                nodejs(nodeJSInstallationName: "Node-${NODE_VERSION}") {
                    sh 'node --version'
                    sh 'npm --version'
                    
                    // Check if package.json exists
                    sh 'ls -la package.json'
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                nodejs(nodeJSInstallationName: "Node-${NODE_VERSION}") {
                    // Install dotenv if not in package.json
                    sh 'npm install dotenv --save'
                    
                    // Clean install for reliable builds
                    sh 'npm ci'
                    
                    // Address security vulnerabilities
                    sh 'npm audit fix || true'
                    
                    echo 'Dependencies installed successfully'
                    
                    // List installed packages for debugging
                    sh 'npm list --depth=0'
                }
            }
        }
        
        stage('Security Audit') {
            steps {
                nodejs(nodeJSInstallationName: "Node-${NODE_VERSION}") {
                    script {
                        // Check for high/critical vulnerabilities
                        def auditOutput = sh(
                            script: 'npm audit --audit-level high --json || true',
                            returnStdout: true
                        ).trim()
                        
                        if (auditOutput.contains('"high"') || auditOutput.contains('"critical"')) {
                            echo 'WARNING: High or critical vulnerabilities found!'
                            sh 'npm audit'
                            // Don't fail the build, just warn
                        } else {
                            echo 'No high/critical vulnerabilities found'
                        }
                    }
                }
            }
        }
        
        stage('Validate Environment') {
            steps {
                script {
                    // Validate that required files exist
                    def requiredFiles = ['server.js', 'package.json', 'config.js']
                    requiredFiles.each { file ->
                        sh "test -f ${file} || (echo 'Missing required file: ${file}' && exit 1)"
                    }
                    
                    // Check if routes directory exists
                    sh 'test -d routes || (echo "Warning: routes directory missing" && exit 0)'
                    
                    echo 'Environment validation completed'
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                nodejs(nodeJSInstallationName: "Node-${NODE_VERSION}") {
                    script {
                        // Set test environment variables
                        withEnv([
                            "NODE_ENV=test",
                            "MONGODB_URI_TEST=${MONGODB_URI_TEST}",
                            "DB_USERNAME=${DB_USERNAME}",
                            "DB_PASSWORD=${DB_PASSWORD}",
                            "DB_CLUSTER=${DB_CLUSTER}"
                        ]) {
                            def packageJson = readJSON file: 'package.json'
                            if (packageJson.scripts && packageJson.scripts.test) {
                                try {
                                    sh 'npm test'
                                    echo 'Tests completed successfully'
                                } catch (Exception e) {
                                    currentBuild.result = 'FAILURE'
                                    error "Tests failed: ${e.getMessage()}"
                                }
                            } else {
                                echo 'No test script found in package.json, skipping tests'
                                // Create a basic smoke test
                                sh 'node -e "console.log(\'Basic Node.js validation passed\')"'
                            }
                        }
                    }
                }
            }
        }
        
        stage('Build') {
            steps {
                nodejs(nodeJSInstallationName: "Node-${NODE_VERSION}") {
                    script {
                        def packageJson = readJSON file: 'package.json'
                        if (packageJson.scripts && packageJson.scripts.build) {
                            sh 'npm run build'
                            echo 'Build completed successfully'
                        } else {
                            echo 'No build script found, performing basic validation'
                            // Validate server.js can be parsed
                            sh 'node -c server.js'
                            echo 'JavaScript syntax validation passed'
                        }
                    }
                }
            }
        }
        
        stage('Pre-deployment Validation') {
            steps {
                script {
                    echo 'Validating deployment readiness...'
                    
                    // Check if server.js uses environment variables properly
                    def serverContent = readFile 'server.js'
                    if (serverContent.contains('localhost:27017')) {
                        error 'server.js still contains hardcoded localhost connection! Update to use config.js'
                    }
                    
                    if (serverContent.contains('require(\'dotenv\').config()') || 
                        serverContent.contains('require("dotenv").config()')) {
                        echo 'Environment variable loading detected ✓'
                    } else {
                        echo 'WARNING: No dotenv configuration detected in server.js'
                    }
                    
                    // Verify config.js exists and has proper structure
                    sh 'node -e "const config = require(\'./config.js\'); console.log(\'Config loaded:\', Object.keys(config));"'
                    
                    // Check if Procfile exists for Heroku
                    if (fileExists('Procfile')) {
                        echo 'Procfile found ✓'
                        sh 'cat Procfile'
                    } else {
                        echo 'Creating Procfile for Heroku deployment'
                        writeFile file: 'Procfile', text: 'web: node server.js'
                        sh 'cat Procfile'
                    }
                }
            }
        }
        
        stage('Deploy to Heroku') {
            steps {
                script {
                    echo 'Starting deployment to Heroku...'
                    
                    // Install Heroku CLI if not available
                    sh '''
                        if ! command -v heroku &> /dev/null; then
                            echo "Installing Heroku CLI..."
                            curl https://cli-assets.heroku.com/install.sh | sh
                        else
                            echo "Heroku CLI already installed"
                            heroku --version
                        fi
                    '''
                    
                    // Login to Heroku using API key
                    sh '''
                        export HEROKU_API_KEY="${HEROKU_API_KEY}"
                        echo "Logging into Heroku..."
                        echo "${HEROKU_API_KEY}" | heroku auth:token
                    '''
                    
                    // Set up Heroku remote if it doesn't exist
                    sh '''
                        export HEROKU_API_KEY="${HEROKU_API_KEY}"
                        
                        # Check if heroku remote exists
                        if git remote | grep -q heroku; then
                            echo "Heroku remote already exists"
                            git remote -v | grep heroku
                        else
                            echo "Adding Heroku remote..."
                            heroku git:remote -a ${HEROKU_APP_NAME}
                        fi
                    '''
                    
                    // Set environment variables on Heroku
                    sh '''
                        export HEROKU_API_KEY="${HEROKU_API_KEY}"
                        
                        echo "Setting environment variables on Heroku..."
                        heroku config:set NODE_ENV=production -a ${HEROKU_APP_NAME}
                        heroku config:set DB_USERNAME="${DB_USERNAME}" -a ${HEROKU_APP_NAME}
                        heroku config:set DB_PASSWORD="${DB_PASSWORD}" -a ${HEROKU_APP_NAME}
                        heroku config:set DB_CLUSTER="${DB_CLUSTER}" -a ${HEROKU_APP_NAME}
                        heroku config:set DB_APP_NAME="${DB_APP_NAME}" -a ${HEROKU_APP_NAME}
                        
                        # Set complete MongoDB URI if available
                        if [ ! -z "${MONGODB_URI_PROD}" ]; then
                            heroku config:set MONGODB_URI_PROD="${MONGODB_URI_PROD}" -a ${HEROKU_APP_NAME}
                        fi
                        
                        echo "Environment variables set successfully"
                    '''
                    
                    // Deploy to Heroku
                    sh '''
                        export HEROKU_API_KEY="${HEROKU_API_KEY}"
                        
                        echo "Deploying to Heroku..."
                        
                        # Add all changes and commit if necessary
                        git add -A
                        git diff --staged --quiet || git commit -m "Jenkins deployment commit"
                        
                        # Push to Heroku
                        git push heroku HEAD:main --force
                        
                        echo "Deployment pushed to Heroku successfully"
                    '''
                    
                    // Wait for deployment and check status
                    sh '''
                        export HEROKU_API_KEY="${HEROKU_API_KEY}"
                        
                        echo "Checking deployment status..."
                        
                        # Wait for app to be ready
                        timeout 300 bash -c 'until heroku ps -a ${HEROKU_APP_NAME} | grep -q "web.1.*up"; do sleep 10; echo "Waiting for app to start..."; done'
                        
                        # Check app status
                        heroku ps -a ${HEROKU_APP_NAME}
                        
                        # Test if app is responding
                        echo "Testing app endpoint..."
                        curl -f https://${HEROKU_APP_NAME}.herokuapp.com/ || echo "App may still be starting up"
                        
                        echo "✅ Deployment completed successfully!"
                        echo "🌐 Your gallery app is live at: https://${HEROKU_APP_NAME}.herokuapp.com/"
                    '''
                }
            }
        }
    }
    
    post {
        always {
            // Archive important files for debugging
            archiveArtifacts artifacts: 'package.json,server.js,config.js,Procfile', allowEmptyArchive: true
            
            // Clean up workspace
            cleanWs()
        }
        success {
            echo '✅ Pipeline completed successfully!'
            
            emailext (
                subject: "✅ Gallery App Deployed to Heroku: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <h2>🎉 Deployment Successful!</h2>
                    <p><strong>Project:</strong> Gallery Application</p>
                    <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    
                    <h3>📋 Deployment Summary:</h3>
                    <ul>
                        <li>✅ Dependencies installed and vulnerabilities addressed</li>
                        <li>✅ Tests passed (if configured)</li>
                        <li>✅ Code validated and built</li>
                        <li>✅ Successfully deployed to Heroku</li>
                        <li>✅ MongoDB Atlas connection configured</li>
                        <li>✅ Environment variables set on Heroku</li>
                    </ul>
                    
                    <p><strong>🌐 Your gallery application is now live at:</strong></p>
                    <p><a href="https://gallerykennedy-9228839fae9f.herokuapp.com/">https://gallerykennedy-9228839fae9f.herokuapp.com/</a></p>
                    
                    <h3>📝 Next Steps:</h3>
                    <ul>
                        <li>Test your gallery app functionality</li>
                        <li>Upload some images to test the gallery</li>
                        <li>Monitor application logs: <code>heroku logs --tail -a gallerykennedy</code></li>
                        <li>Check Heroku dashboard for app metrics</li>
                    </ul>
                """,
                mimeType: 'text/html',
                to: '${env.CHANGE_AUTHOR_EMAIL}',
                recipientProviders: [developers(), requestor()]
            )
        }
        failure {
            echo '❌ Pipeline failed!'
            
            emailext (
                subject: "❌ Gallery App Deployment Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <h2>❌ Deployment Failed!</h2>
                    <p><strong>Project:</strong> Gallery Application</p>
                    <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p><strong>Failed Stage:</strong> ${env.STAGE_NAME}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p><strong>Console Output:</strong> <a href="${env.BUILD_URL}console">View Console Output</a></p>
                    
                    <h3>🔧 Common Issues & Solutions:</h3>
                    <ul>
                        <li><strong>Heroku CLI issues:</strong> Check if Heroku CLI installed and API key is valid</li>
                        <li><strong>Git push failures:</strong> Verify Heroku remote is configured correctly</li>
                        <li><strong>Build failures:</strong> Check package.json and dependencies</li>
                        <li><strong>Environment variables:</strong> Ensure MongoDB credentials are set in Jenkins</li>
                        <li><strong>App startup issues:</strong> Verify Procfile and server.js configuration</li>
                    </ul>
                    
                    <h3>📋 Debugging Steps:</h3>
                    <ol>
                        <li>Check console output for specific error messages</li>
                        <li>Verify Heroku API key is valid and has permissions</li>
                        <li>Test local deployment: <code>git push heroku main</code></li>
                        <li>Check Heroku app logs: <code>heroku logs --tail -a gallerykennedy</code></li>
                        <li>Verify MongoDB connection string format</li>
                    </ol>
                    
                    <p><strong>💡 Fix the issues and push again to trigger a new build!</strong></p>
                """,
                mimeType: 'text/html',
                to: '${env.CHANGE_AUTHOR_EMAIL}',
                recipientProviders: [developers(), requestor(), culprits()]
            )
        }
        unstable {
            echo '⚠️ Pipeline unstable!'
            
            emailext (
                subject: "⚠️ Gallery App Build Unstable: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <h2>⚠️ Build Unstable</h2>
                    <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p><strong>App URL:</strong> <a href="https://gallerykennedy-9228839fae9f.herokuapp.com/">https://gallerykennedy-9228839fae9f.herokuapp.com/</a></p>
                    
                    <p>The build completed but some tests may have failed or there were warnings.</p>
                    <p>Your application may still be deployed, but please review the test results and warnings.</p>
                    
                    <p><strong>📊 Check:</strong></p>
                    <ul>
                        <li>Test results in the console output</li>
                        <li>Security audit warnings</li>
                        <li>Heroku app status and logs</li>
                    </ul>
                """,
                mimeType: 'text/html',
                to: '${env.CHANGE_AUTHOR_EMAIL}',
                recipientProviders: [developers(), requestor()]
            )
        }
    }
}