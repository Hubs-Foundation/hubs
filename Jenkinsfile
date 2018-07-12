import groovy.json.JsonOutput

// From https://issues.jenkins-ci.org/browse/JENKINS-44231

// Given arbitrary string returns a strongly escaped shell string literal.
// I.e. it will be in single quotes which turns off interpolation of $(...), etc.
// E.g.: 1'2\3\'4 5"6 (groovy string) -> '1'\''2\3\'\''4 5"6' (groovy string which can be safely pasted into shell command).
def shellString(s) {
  // Replace ' with '\'' (https://unix.stackexchange.com/a/187654/260156). Then enclose with '...'.
  // 1) Why not replace \ with \\? Because '...' does not treat backslashes in a special way.
  // 2) And why not use ANSI-C quoting? I.e. we could replace ' with \'
  // and enclose using $'...' (https://stackoverflow.com/a/8254156/4839573).
  // Because ANSI-C quoting is not yet supported by Dash (default shell in Ubuntu & Debian) (https://unix.stackexchange.com/a/371873).
  '\'' + s.replace('\'', '\'\\\'\'') + '\''
}

pipeline {
  agent any

  options {
    ansiColor('xterm')
  }

  stages {
    stage('pre-build') {
      steps {
        checkout scm: [$class: 'GitSCM', clean: false, clearWorkspace: false]

        sh 'rm -rf ./build ./tmp'
      }
    }

    stage('build') {
      steps {
        script {
          def baseAssetsPath = "https://assets-dev.reticium.io/"
          def s3Destination = "s3://assets.reticulum-dev-7f8d39c45878ee2e/hubs"

          sh 'ls'
          sh '''
            /usr/bin/script --return -c \\\\"sudo /usr/bin/hab-docker-studio -k mozillareality run /bin/bash scripts/hab-build-and-push.sh\\\\" /dev/null
          '''
        }
      }
    }
  }

  post {
     always {
       deleteDir()
     }
   }
}
