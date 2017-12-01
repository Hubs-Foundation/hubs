pipeline {
  agent any

  stages {
    stage('build') {
      steps {
        build 'reticulum'
      }
    }
  }

  post {
     always {
       deleteDir()
     }
   }
}
