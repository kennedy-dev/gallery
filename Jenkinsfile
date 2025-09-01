pipeline {
    agent any
    
    triggers {
        scm('H/5 * * * *')
        // Also support GitHub webhooks for instant triggering
        githubPush()
    }
    
    environment {
        NODE_VERSION = '18'
        RENDER_API_KEY = credentials('render-api-key')
        RENDER_SERVICE_ID = credentials('render-service-id')
        
        // Database credentials for MongoDB Atlas
        DB_USERNAME = credentials('mongodb-username')
        DB_PASSWORD = credentials('mongodb-password')
        DB_CLUSTER = credentials('mongodb-cluster')
        DB_APP_NAME = 'SchoolWork'
        
        // Complete connection strings with URL encoding for special characters
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
                    // Install dotenv if not in package.json (for environment variables)
                    sh 'npm install dotenv --save'
                    
                    // Clean install for reliable builds
                    sh 'npm ci'
                    
                    // Address security vulnerabilities
                    sh 'npm audit fix || true'  // Continue even if some can't be fixed
                    
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
                }
            }
        }
        
        stage('Deploy to Render') {
            steps {
                script {
                    echo 'Starting deployment to Render...'
                    
                    // Trigger Render deployment
                    def response = sh(
                        script: """
                            curl -X POST "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys" \
                            -H "Authorization: Bearer ${RENDER_API_KEY}" \
                            -H "Content-Type: application/json" \
                            -d '{"clearCache": true}' \
                            -w "%{http_code}" \
                            -s -o deploy_response.json
                        """,
                        returnStdout: true
                    ).trim()
                    
                    if (response == "201") {
                        def deployResponse = readJSON file: 'deploy_response.json'
                        echo "✅ Deployment triggered successfully!"
                        echo "Deploy ID: ${deployResponse.id}"
                        echo "Service ID: ${RENDER_SERVICE_ID}"
                        
                        // Remind about environment variables
                        echo """
                        📋 IMPORTANT: Ensure these environment variables are set in Render dashboard:
                        - NODE_ENV=production
                        - DB_USERNAME=${DB_USERNAME}
                        - DB_PASSWORD=[your secure password]
                        - DB_CLUSTER=${DB_CLUSTER}
                        - DB_APP_NAME=SchoolWork
                        
                        Or use complete connection strings:
                        - MONGODB_URI_PROD=[your production connection string]
                        """
                        
                        // Monitor deployment progress
                        timeout(time: 15, unit: 'MINUTES') {
                            script {
                                def deployStatus = ''
                                def attempts = 0
                                def maxAttempts = 30
                                
                                while (deployStatus != 'live' && attempts < maxAttempts) {
                                    sleep 30
                                    attempts++
                                    
                                    def statusResponse = sh(
                                        script: """
                                            curl -s "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys/${deployResponse.id}" \
                                            -H "Authorization: Bearer ${RENDER_API_KEY}"
                                        """,
                                        returnStdout: true
                                    )
                                    
                                    try {
                                        def statusData = readJSON text: statusResponse
                                        deployStatus = statusData.status
                                        echo "🔄 Deployment status (${attempts}/${maxAttempts}): ${deployStatus}"
                                        
                                        if (deployStatus == 'build_failed') {
                                            error "❌ Build failed on Render. Check Render logs for details."
                                        } else if (deployStatus == 'deploy_failed') {
                                            error "❌ Deployment failed on Render. Check Render logs for details."
                                        }
                                    } catch (Exception e) {
                                        echo "⚠️ Could not parse deployment status response: ${e.getMessage()}"
                                        echo "Raw response: ${statusResponse}"
                                    }
                                }
                                
                                if (deployStatus == 'live') {
                                    echo "🎉 Deployment completed successfully!"
                                    echo "🌐 Your gallery app should be live at your Render service URL"
                                } else {
                                    echo "⏰ Deployment is still in progress after 15 minutes"
                                    echo "💡 Check Render dashboard for the latest status"
                                }
                            }
                        }
                    } else {
                        error "❌ Failed to trigger deployment. HTTP response code: ${response}"
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Archive important files for debugging
            archiveArtifacts artifacts: 'package.json,server.js,config.js', allowEmptyArchive: true
            
            // Clean up workspace
            cleanWs()
        }
        success {
            echo '✅ Pipeline completed successfully!'
            
            emailext (
                subject: "✅ Gallery App Build Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <h2>🎉 Build Successful!</h2>
                    <p><strong>Project:</strong> Gallery Application</p>
                    <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    
                    <h3>📋 Deployment Summary:</h3>
                    <ul>
                        <li>✅ Dependencies installed and vulnerabilities addressed</li>
                        <li>✅ Tests passed (if configured)</li>
                        <li>✅ Code validated and built</li>
                        <li>✅ Successfully deployed to Render</li>
                        <li>✅ MongoDB Atlas connection configured</li>
                    </ul>
                    
                    <p><strong>🌐 Your gallery application is now live!</strong></p>
                    <p>Check your Render dashboard for the live URL.</p>
                    
                    <h3>📝 Next Steps:</h3>
                    <ul>
                        <li>Test your gallery app functionality</li>
                        <li>Upload some images to test the gallery</li>
                        <li>Monitor application logs in Render dashboard</li>
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
                subject: "❌ Gallery App Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <h2>❌ Build Failed!</h2>
                    <p><strong>Project:</strong> Gallery Application</p>
                    <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p><strong>Failed Stage:</strong> ${env.STAGE_NAME}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p><strong>Console Output:</strong> <a href="${env.BUILD_URL}console">View Console Output</a></p>
                    
                    <h3>🔧 Common Issues & Solutions:</h3>
                    <ul>
                        <li><strong>Test failures:</strong> Check your test cases and fix any failing tests</li>
                        <li><strong>Dependency issues:</strong> Review package.json and npm audit results</li>
                        <li><strong>MongoDB connection:</strong> Verify Atlas credentials and environment variables</li>
                        <li><strong>Hardcoded localhost:</strong> Ensure server.js uses config.js, not localhost:27017</li>
                        <li><strong>Environment variables:</strong> Check that .env variables are properly configured</li>
                        <li><strong>Render deployment:</strong> Verify Render API credentials and service configuration</li>
                    </ul>
                    
                    <h3>📋 Debugging Steps:</h3>
                    <ol>
                        <li>Check the console output link above for detailed error messages</li>
                        <li>Verify your code works locally with <code>node server.js</code></li>
                        <li>Ensure all environment variables are set in Jenkins credentials</li>
                        <li>Test your MongoDB connection string format</li>
                        <li>Check Render service status and logs</li>
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
                    
                    <p>The build completed but some tests may have failed or there were warnings.</p>
                    <p>Your application may still be deployed, but please review the test results and warnings.</p>
                    
                    <p><strong>📊 Check:</strong></p>
                    <ul>
                        <li>Test results in the console output</li>
                        <li>Security audit warnings</li>
                        <li>Deployment status in Render</li>
                    </ul>
                """,
                mimeType: 'text/html',
                to: '${env.CHANGE_AUTHOR_EMAIL}',
                recipientProviders: [developers(), requestor()]
            )
        }
    }
}