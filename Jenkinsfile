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
        sh 'rm -rf ./build ./tmp'
      }
    }

    stage('build') {
      steps {
        script {
          def baseAssetsPath = env.BASE_ASSETS_PATH
          def assetBundleServer = env.ASSET_BUNDLE_SERVER
          def targetS3Url = env.TARGET_S3_URL
          def smokeURL = env.SMOKE_URL
          def slackURL = env.SLACK_URL

          def habCommand = "sudo /usr/bin/hab-docker-studio -k mozillareality run /bin/bash scripts/hab-build-and-push.sh ${baseAssetsPath} ${assetBundleServer} ${targetS3Url} ${env.BUILD_NUMBER} ${env.GIT_COMMIT}"
          sh "/usr/bin/script --return -c ${shellString(habCommand)} /dev/null"

          def gitMessage = sh(returnStdout: true, script: "git log -n 1 --pretty=format:'[%an] %s'").trim()
          def gitSha = sh(returnStdout: true, script: "git log -n 1 --pretty=format:'%h'").trim()
          def text = (
            "*<http://localhost:8080/job/${env.JOB_NAME}/${env.BUILD_NUMBER}|#${env.BUILD_NUMBER}>* *${env.JOB_NAME}* " +
            "<https://github.com/mozilla/hubs/commit/$gitSha|$gitSha> " +
            "Hubs: ```${gitSha} ${gitMessage}```\n" +
            "<${smokeURL}?required_version=${env.BUILD_NUMBER}|Smoke Test> - to push:\n" +
            "`/mr hubs deploy ${targetS3Url}`"
          )
          def payload = 'payload=' + JsonOutput.toJson([
            text      : text,
            channel   : "#mr-builds",
            username  : "buildbot",
            icon_emoji: ":gift:"
          ])
          sh "curl -X POST --data-urlencode ${shellString(payload)} ${slackURL}"
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
