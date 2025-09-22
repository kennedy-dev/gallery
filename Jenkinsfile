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
                sh 'node -c server.js'  // Basic syntax check
            }
        }
        
        stage('Deploy to Heroku') {
            steps {
                withCredentials([
                    string(credentialsId: 'heroku-api-key-gallery', variable: 'HEROKU_API_KEY')
                ]) {
                    sh '''
                        # Configure git
                        git config user.email "jenkins@deployment.local"
                        git config user.name "Jenkins CI"
                        
                        # Install Heroku CLI
                        curl https://cli-assets.heroku.com/install-ubuntu.sh | sh
                        
                        # Set Heroku API key
                        export HEROKU_API_KEY=${HEROKU_API_KEY}
                        
                        # Add heroku remote
                        heroku git:remote -a gallerykennedy
                        
                        # Deploy
                        git add .
                        git commit -m "Jenkins deployment" || echo "Nothing to commit"
                        git push heroku HEAD:master --force
                        
                        # Check status
                        heroku ps -a gallerykennedy
                        heroku logs --tail --num=10 -a gallerykennedy
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful!'
            echo 'App live at: https://gallerykennedy-9228839fae9f.herokuapp.com/'
        }
        
        failure {
            echo 'Deployment failed. Check console output.'
        }
    }
}