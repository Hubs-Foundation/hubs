import groovy.json.JsonOutput

pipeline {
  agent any

  options {
    ansiColor('xterm')
  }

  stages {
    stage('pre-build') {
      steps {
        sh 'rm -rf ./dist ./tmp'
      }
    }

    stage('build') {
      steps {
        script {
          def baseAssetsPath = env.BASE_ASSETS_PATH
          def shortlinkDomain = env.SHORTLINK_DOMAIN
          def targetS3Bucket = env.TARGET_S3_BUCKET
          def sentryDsn = env.SENTRY_DSN
          def gaTrackingId = env.GA_TRACKING_ID
          def smokeURL = env.SMOKE_URL
          def reticulumServer = env.RETICULUM_SERVER
          def thumbnailServer = env.THUMBNAIL_SERVER
          def corsProxyServer = env.CORS_PROXY_SERVER
          def nonCorsProxyDomains = env.NON_CORS_PROXY_DOMAINS
          def slackURL = env.SLACK_URL
          def buildNumber = env.BUILD_NUMBER
          def jobName = env.JOB_NAME
          def gitCommit = env.GIT_COMMIT
          def disableDeploy = env.DISABLE_DEPLOY
          def promoteToChannel = env.PROMOTE_TO_CHANNEL

          def habCommand = (
            "/bin/bash scripts/hab-build-and-push.sh "
            + "\\\"${baseAssetsPath}\\\" "
            + "\\\"${shortlinkDomain}\\\" "
            + "\\\"${reticulumServer}\\\" "
            + "\\\"${thumbnailServer}\\\" "
            + "\\\"${corsProxyServer}\\\" "
            + "\\\"${nonCorsProxyDomains}\\\" "
            + "\\\"${targetS3Bucket}\\\" "
            + "\\\"${sentryDsn}\\\" "
            + "\\\"${gaTrackingId}\\\" "
            + "\\\"${buildNumber}\\\" "
            + "\\\"${gitCommit}\\\" "
            + "\\\"${disableDeploy}\\\" "
          )
          runCommand(habCommand)

          def s = $/eval 'ls -t results/*.hart | head -n 1'/$
          def hart = sh(returnStdout: true, script: "${s}").trim()

          s = $/eval 'tail -n +6 ${hart} | xzcat | tar tf - | grep IDENT'/$
          def identPath = sh(returnStdout: true, script: "${s}").trim()

          s = $/eval 'tail -n +6 ${hart} | xzcat | tar xf - "${identPath}" -O'/$
          def packageIdent = sh(returnStdout: true, script: "${s}").trim()
          def packageTimeVersion = packageIdent.tokenize('/')[3]
          def (major, minor, version) = packageIdent.tokenize('/')[2].tokenize('.')
          def hubsVersion = "${major}.${minor}.${version}.${packageTimeVersion}"

          def gitMessage = sh(returnStdout: true, script: "git log -n 1 --pretty=format:'[%an] %s'").trim()
          def gitSha = sh(returnStdout: true, script: "git log -n 1 --pretty=format:'%h'").trim()

          if (promoteToChannel != null && promoteToChannel != "") {
            runCommand("sudo /usr/bin/hab-ret-pkg-promote ${packageIdent} ${promoteToChannel}")

            def text = (
              "*<http://localhost:8080/job/${jobName}/${buildNumber}|#${buildNumber}>* *${jobName}* " +
              "<https://bldr.reticulum.io/#/pkgs/${packageIdent}|${packageIdent}>\n" +
              "<https://github.com/mozilla/hubs/commit/$gitSha|$gitSha> " +
              "Promoted ${hubsVersion} to ${promoteToChannel}: ```${gitSha} ${gitMessage}```\n"
            )
            sendSlackMessage(text, "#mr-builds", ":gift:", slackURL)
          } else {
            def text = (
              "*<http://localhost:8080/job/${jobName}/${buildNumber}|#${buildNumber}>* *${jobName}* " +
              "<https://github.com/mozilla/hubs/commit/$gitSha|$gitSha> ${hubsVersion} " +
              "Hubs: ```${gitSha} ${gitMessage}```\n" +
              "<${smokeURL}?required_version=${hubsVersion}|Smoke Test> - to push:\n" +
              "`/mr hubs deploy ${hubsVersion} s3://${targetS3Bucket}`"
            )
            sendSlackMessage(text, "#mr-builds", ":gift:", slackURL)
          }
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

def runCommand(command) {
  sh "/usr/bin/script --return -c ${shellString(command)} /dev/null"
}

def sendSlackMessage(text, channel, icon, slackURL) {
  def payload = 'payload=' + JsonOutput.toJson([
    text      : text,
    channel   : channel,
    username  : "buildbot",
    icon_emoji: icon
  ])
  sh "curl -X POST --data-urlencode ${shellString(payload)} ${slackURL}"
}

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
