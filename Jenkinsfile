pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS-18'
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
                    npm install
                    npm audit fix || true
                '''
            }
        }
        
        stage('Tests') {
            steps {
                sh '''
                    # Set test environment and run actual tests
                    NODE_ENV=test MONGODB_URI_TEST="mongodb+srv://kennedymukuna_db_user:KAJ869Ko08%23%40@schoolwork.vxnsfoe.mongodb.net/darkroom-test?retryWrites=true&w=majority&appName=SchoolWork" npm test
                '''
            }
        }
        
        stage('Deploy to Heroku') {
            steps {
                withCredentials([string(credentialsId: 'heroku-api-key-gallery', variable: 'HEROKU_API_KEY')]) {
                    sh '''
                        git config user.email "jenkins@deployment.local"
                        git config user.name "Jenkins CI"
                        git push https://heroku:${HEROKU_API_KEY}@git.heroku.com/gallerykennedy.git HEAD:master --force
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful!'
            echo 'App live at: https://gallerykennedy-9228839fae9f.herokuapp.com/'
            
            // Send Slack notification on successful deployment
            slackSend(
                channel: '#kennedy-ip1',
                color: 'good',
                message: """
                :white_check_mark: *Deployment Successful!*
                
                *Build ID:* ${env.BUILD_NUMBER}
                *Project:* Gallery Application
                *Live Site:* https://gallerykennedy-9228839fae9f.herokuapp.com/
                *Build Details:* ${env.BUILD_URL}
                
                The gallery app has been successfully deployed and is now live!
                """,
                teamDomain: 'devopsworkglobal',
                token: '${env.SLACK_TOKEN}'
            )
        }
        
        failure {
            echo 'Deployment failed. Check console output.'
            emailext (
                subject: "Jenkins Build Failed - Gallery App",
                body: """
                    <h2>Build Failed</h2>
                    <p><strong>Project:</strong> Gallery Application</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p><strong>Console Output:</strong> <a href="${env.BUILD_URL}console">View Console Output</a></p>
                    
                    <p>The build failed during testing or deployment. Please check the console output for details.</p>
                """,
                mimeType: 'text/html',
                to: 'kennedy.mukuna@gmail.com'
            )
        }
    }
}