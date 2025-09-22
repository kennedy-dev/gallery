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
        }
        
        failure {
            echo 'Deployment failed. Check console output.'
        }
    }
}