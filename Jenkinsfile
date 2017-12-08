pipeline {
  agent any

  options {
    ansiColor('xterm')
  }

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
