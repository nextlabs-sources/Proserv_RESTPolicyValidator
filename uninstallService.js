var os = require('os');
if(os.platform() == 'win32') {
    var Service = require('node-windows').Service;
} else {
    var Service = require('node-linux').Service;
}

var svc = new Service({
  name:'Control Center Policy Validator',
  script: 'server.js'
});

svc.on('uninstall',function(){
  console.log('Uninstall complete.');
});

svc.uninstall();