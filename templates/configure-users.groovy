#!groovy
import hudson.security.*
import jenkins.model.*

def instance = Jenkins.getInstance()
def hudsonRealm = new HudsonPrivateSecurityRealm(false)
def users = hudsonRealm.getAllUsers()
users_s = users.collect { it.toString() }

// Create the admin user account if it doesn't already exist.
if ("{{ lookup('env', 'JENKINS_USERNAME') }}" in users_s) {
    println "{{ lookup('env', 'JENKINS_USERNAME') }} user already exists - updating password"

    def user = hudson.model.User.get("{{ lookup('env', 'JENKINS_USERNAME') }}")
    def password = hudson.security.HudsonPrivateSecurityRealm.Details.fromPlainPassword("{{ lookup('env', 'JENKINS_PASSWORD') }}")
    user.addProperty(password)
    user.save()
}
else {
    println "--> creating local {{ lookup('env', 'JENKINS_USERNAME') }} user"

    hudsonRealm.createAccount("{{ lookup('env', 'JENKINS_USERNAME') }}", "{{ lookup('env', 'JENKINS_PASSWORD') }}")
    instance.setSecurityRealm(hudsonRealm)

    def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
    instance.setAuthorizationStrategy(strategy)
    instance.save()
}