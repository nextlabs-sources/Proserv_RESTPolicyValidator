var os = require('os');
if(os.platform() == 'win32') {
    var Service = require('node-windows').Service;
} else {
    var Service = require('node-linux').Service;
}

// Create a new service object
var svc = new Service({
  name:'Control Center Policy Validator',
  description: 'NextLabs Control Center Policy Validator',
  script: 'server.js',
  user: "nextlabs",
  group: "nextlabs",
  env: {
    name: "NODE_EXTRA_CA_CERTS",
    value: process.env["CC_HOME"] + "/tools/policy-validator/certs/web.cer"
  }
});

svc.install();