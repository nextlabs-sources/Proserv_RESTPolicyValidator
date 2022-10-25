var express = require('express');
var fs = require('fs');
var http = require('http')
var https = require('https');
var privateKey = fs.readFileSync('certs/ssl.key');
var certificate = fs.readFileSync('certs/ssl.crt');
var credentials = {key: privateKey, cert: certificate};
var app = express();
var morgan = require("morgan");
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var NextLabsRestPDPEngine = require("./lib/NextLabsRestPDPEngine");
var NextLabsConstants = require("./lib/NextLabsConstants");
var mkdirp = require("mkdirp");
var fs = require("fs");
var fsExtra = require("fs-extra");
var path = require("path");
var jsonfile = require("jsonfile");
var sr = require("./lib/ServerResponse");
var winston = require("winston");
var urlparse = require("url-parse");
var router = express.Router();
var session = require('express-session');
var passport = require('passport');
var OidcStrategy = require('passport-openidconnect').Strategy;

//Print out version for information
var contents = fs.readFileSync('./version.txt', 'utf8');
console.log(contents);

try {
	fs.accessSync(NextLabsConstants.LOG_DIR, fs.F_OK);
} catch (e) {
	console.log("Logging directory " + NextLabsConstants.LOG_DIR + " does not exist. Attempting to create...");
	try {
		fs.mkdirSync(NextLabsConstants.LOG_DIR);
	} catch (error) {
		console.error(error);
		startUpCheck = false;
	}
}

var logger = new(winston.Logger)({
	level: 'debug',
    transports: [
        new (winston.transports.Console)
        	({level:'debug',handleExceptions: true,prettyPrint: true,silent:false,timestamp: true,colorize: true,json: false}),
  		new (winston.transports.File)
  			({ filename: path.join(NextLabsConstants.LOG_DIR, "debug.log"),name:'file.all',level:'debug',maxsize: 1024000,maxFiles: 10, handleExceptions: true,json: false}),
  		new (winston.transports.File)
  			({ filename: path.join(NextLabsConstants.LOG_DIR, "error.log"),name:'file.error',level:'error',maxsize: 1024000,maxFiles: 10, handleExceptions: true,json: true})
    ]
});

function copyFileSync( source, target ) {

    var targetFile = target;

    //if target is a directory a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync( source, target ) {
    var files = [];

    //check if folder needs to be created or integrated
    var targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    //copy
    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}

const pathconfig = './data/config/config.json'

try {
  if (fs.existsSync(pathconfig)) {
    logger.info("Config folder containing file, skip copying");
  }
  else{
	copyFolderRecursiveSync("./backup/data/config/","./data");
	copyFolderRecursiveSync("./backup/data/working/","./data");
  }
} catch(err) {
  logger.error(err);
}

var ncp = require('ncp').ncp;

var startUpCheck = true;
var jpcOptions = require("./data/config/config.json");
var sAttribs = require("./data/config/sattrib.json");
var rAttribs = require("./data/config/rattrib.json");

function getOptionsFromEnvironment() {
	if (process.env.NEXTLABS_PV_PORT) {
		jpcOptions.port = process.env.NEXTLABS_PV_PORT;
	} else if(process.env.SERVER_PORT) {
		jpcOptions.port = process.env.SERVER_PORT;
	}
	if (process.env.NEXTLABS_PV_PROTOCOL) {
    		jpcOptions.protocol = process.env.NEXTLABS_PV_PROTOCOL;
    }
	if (process.env.NEXTLABS_PV_URL) {
		jpcOptions.url = process.env.NEXTLABS_PV_URL;
	}
	if (process.env.NEXTLABS_PV_CC_URL) {
		jpcOptions.ccUrl = process.env.NEXTLABS_PV_CC_URL;
	}
	if (process.env.NEXTLABS_PV_OIDC_CLIENTSECRET) {
		if(!jpcOptions.oidc) {
			jpcOptions.oidc = {"clientId": "nextlabs-policy-validator", clientSecret: "", tokenUrl: ""};
		}
		jpcOptions.oidc.clientSecret = process.env.NEXTLABS_PV_OIDC_CLIENTSECRET;
	}
	if (process.env.NEXTLABS_PV_OIDC_TOKENURL) {
		if(!jpcOptions.oidc) {
			jpcOptions.oidc = {"clientId": "nextlabs-policy-validator", clientSecret: "", tokenUrl: ""};
		}
		jpcOptions.oidc.tokenUrl = process.env.NEXTLABS_PV_OIDC_TOKENURL;
	}
	if (process.env.NEXTLABS_PV_HEALTHCHECK_PORT){
		jpcOptions.healthCheckPort = process.env.NEXTLABS_PV_HEALTHCHECK_PORT;
	} else if(process.env.HEALTHCHECK_PORT) {
		jpcOptions.healthCheckPort = process.env.HEALTHCHECK_PORT;
	}
	if (process.env.NEXTLABS_PV_ALLOW_SELF_SIGNED_CERT = "true"){
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
	}
	if (process.env.NEXTLABS_PV_DEFAULTCONFIGURATION) {
		let defaultConfiguration = null;
		let defaultConfigurationIndex = 0;
		for (let i = 0; i < jpcOptions.configurations.length; i++) {
			if (jpcOptions.configurations[i].name === process.env.NEXTLABS_PV_DEFAULTCONFIGURATION) {
				defaultConfiguration = jpcOptions.configurations[i];
				defaultConfigurationIndex = i;
			}
		}
		jpcOptions.configurations[defaultConfigurationIndex] = jpcOptions.configurations[0];
		jpcOptions.configurations[0] = defaultConfiguration;
	}
}
getOptionsFromEnvironment();

var engine;

//try to initialize the PDP engine
try {
	engine = new NextLabsRestPDPEngine(jpcOptions.configurations[jpcOptions.active]);
} catch (error) {
	logger.error("Unable to initialize NextLabs PDP Engine: " + error.message);
	startUpCheck = false;
}

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(methodOverride());

app.use(session({
	secret: 'NextLabsPolicyValidatorSessionSecret123Next',
	resave: false,
	saveUninitialized: true,
	cookie: {
	    expires: 1200000
	}
}));
app.use(passport.initialize());
app.use(passport.session());
var oidcIssuer = `${jpcOptions.ccUrl}/cas/oidc`;
var tokenURL = `${oidcIssuer}/accessToken`;
if(jpcOptions.oidc.tokenUrl) {
	tokenURL = `${jpcOptions.oidc.tokenUrl}/cas/oidc/accessToken`;
}
passport.use('oidc', new OidcStrategy({
	issuer: oidcIssuer,
	authorizationURL: `${oidcIssuer}/authorize`,
	tokenURL: tokenURL,
	userInfoURL: `${oidcIssuer}/profile`,
	clientID: jpcOptions.oidc.clientId,
	clientSecret: jpcOptions.oidc.clientSecret,
	callbackURL: `${jpcOptions.url}/authorization-code/callback`,
	scope: 'openid profile'
}, (issuer, sub, profile, accessToken, refreshToken, done) => {
	return done(null, profile);
}));

passport.serializeUser((user, next) => {
	next(null, user);
});

passport.deserializeUser((obj, next) => {
	next(null, obj);
});

app.use(function(request, response, next) {
	if (request.url == '/policy-validator/login' || request.url.startsWith("/policy-validator/authorization-code/callback") || request.isAuthenticated()) {
		return next();
	}
	response.redirect(`${jpcOptions.url}/login`)
});
app.use('/policy-validator', express.static(__dirname + "/public"));

router.get('/logout', function(request, response){
	request.logout();
	response.redirect(`${jpcOptions.ccUrl}/cas/logout?service=${jpcOptions.url}`);
});
router.use('/login', passport.authenticate('oidc'));
router.use('/authorization-code/callback',
  passport.authenticate('oidc', { failureRedirect: '/error' }),
  (request, response) => {
    response.redirect(jpcOptions.url);
  }
);
router.get("/username", function(request, response) {
	response.send(sr.getSuccess("", request.user.id));
});

try {
	fs.accessSync(NextLabsConstants.WORKING_DIR, fs.F_OK);
} catch (e) {
	logger.info("Working directory " + NextLabsConstants.WORKING_DIR + " does not exist. Attempting to create...");
	try {
		fs.mkdirSync(NextLabsConstants.WORKING_DIR);
	} catch (error) {
		logger.error(error);
		startUpCheck = false;
	}
}

router.get("/configuration", function(request, response) {
	response.send(sr.getSuccess("", jpcOptions));
})

router.get("/configuration/sattrib", function(request, response) {
	response.send(sr.getSuccess("", sAttribs));
});

router.get("/configuration/rattrib", function(request, response) {
	response.send(sr.getSuccess("", rAttribs));
});

router.put("/configuration/update", function(request, response) {
	var options = request.body.options;

	// Handle the modified url field
	var url = options["nextlabs.pdp.rest.pdp_url"];
		var urlparsed = urlparse(url, true);
		options["nextlabs.pdp.rest.host"] = urlparsed.hostname;
		options["nextlabs.pdp.rest.port"] = urlparsed.port ? urlparsed.port : (urlparsed.protocol === 'https:' ? 443 : 80);
		options["nextlabs.pdp.rest.https"] = urlparsed.protocol.slice(0, -1);
		options["nextlabs.pdp.rest.resource_path"] = urlparsed.pathname;

	if (!options) {
		response.send(sr.clientError(new Error("Update configuration: Input is undefined"), ("Undefined options")));
	}

	try {
		var engineTest = new NextLabsRestPDPEngine(options);
	} catch (error) {
		logger.error(error);
		sr.configFailed("Unable to initialize Policy Controller: " + error);
		return;
	}

	var optionsFile = "./data/config/config.json";

	jsonfile.readFile(optionsFile, function(error, obj) {
		if (error) {
			logger.error(error);
			response.send(sr.serverError(error,"Unable to save options"));
		} else {
			var index;
			if (options.name === "development") {
				index = 0;
			} else if (options.name === "qa") {
				index = 1;
			} else {
				index = 2;
			}

			obj.configurations[index] = options;

			jsonfile.writeFile(optionsFile, obj, {spaces: 4}, function(error) {
				if (error) {
					logger.error(error);
					response.send(sr.serverError(error,"Unable to update configuration file"));
				} else {
					response.send(sr.saveSuccess(""));
					jpcOptions = obj;
					getOptionsFromEnvironment();
					if (obj.active === index) {
						console.log("Updated configuration is the active profile. Reinitializing engine...")
						engine = new NextLabsRestPDPEngine(options);
					}
				}
			});
		}
	});
});

router.put("/configuration/sattrib/update", function(request, response) {
	var sattrib = request.body.options;

	if (!sattrib) {
		response.send(sr.clientError(new Error("Update configuration: Input is undefined"), ("Undefined options")));
	}

	var sattribFile = "./data/config/sattrib.json";

	jsonfile.writeFile(sattribFile, sattrib, {spaces: 4}, function(error) {
		if (error) {
			logger.error(error);
			response.send(sr.serverError(error,"Unable to update subject attribute file"));
		} else {
			response.send(sr.saveSuccess(""));
			sAttribs = sattrib;
		}
	});
});

router.put("/configuration/rattrib/update", function(request, response) {
	var rattrib = request.body.options;

	if (!rattrib) {
		response.send(sr.clientError(new Error("Update configuration: Input is undefined"), ("Undefined options")));
	}

	var rattribFile = "./data/config/rattrib.json";

	jsonfile.writeFile(rattribFile, rattrib, {spaces: 4}, function(error) {
		if (error) {
			logger.error(error);
			response.send(sr.serverError(error,"Unable to update resource attribute file"));
		} else {
			response.send(sr.saveSuccess(""));
			rAttribs = rattrib;
		}
	});
});

router.put("/configuration/test", function(request, response) {
	var options = request.body.options;

	// Handle the modified url field
	var url = options["nextlabs.pdp.rest.pdp_url"];
	var urlparsed = urlparse(url, true);
	options["nextlabs.pdp.rest.host"] = urlparsed.hostname;
	options["nextlabs.pdp.rest.port"] = urlparsed.port ? urlparsed.port : (urlparsed.protocol === 'https:' ? 443 : 80);
	options["nextlabs.pdp.rest.https"] = urlparsed.protocol.slice(0,-1);
	options["nextlabs.pdp.rest.resource_path"] = urlparsed.pathname;

	var dummyRequest = request.body.dummyRequest;

	if (!options || !dummyRequest) {
		response.send(sr.clientError(new Error("Test configuration: Some inputs are undefined"), "Invalid input"));
	}

	try {
		var engineTest = new NextLabsRestPDPEngine(options);
	} catch (error) {
		logger.error(error);
		sr.configFailed("Unable to initialize Policy Controller: " + error);
		return;
	}

	var promise = engineTest.evaluate(JSON.stringify(dummyRequest));

	promise.then(function(jsonResponse) {
		response.send(sr.evaluateSuccess("", jsonResponse));
	}, function(error) {
		logger.error(error);
		response.send(sr.evaluateError("Unable to evaluate dummy request: " + error.message, error));
	});

});

router.put("/configuration/changeActiveConfiguration", function(request, response) {
	var index = request.body.index;

	try {
		engine = new NextLabsRestPDPEngine(jpcOptions.configurations[index]);
	} catch (error) {
		logger.error(error);
		sr.configFailed("Unable to initialize Policy Controller: " + error);
		return;
	}

	var optionsFile = "./data/config/config.json";

	jsonfile.readFile(optionsFile, function(error, obj) {
		if (error) {
			logger.error(error);
			response.send(sr.serverError(error,"Unable to change active configuration"));
		} else {
			obj.active = index;

			jsonfile.writeFile(optionsFile, obj, {spaces: 4}, function(error) {
				if (error) {
					logger.error(error);
					response.send(sr.serverError(error,"Unable to update configuration file"));
				} else {
					response.send(sr.saveSuccess(""));
					jpcOptions = obj;
					getOptionsFromEnvironment();
				}
			});
		}
	});
})


router.post('/evaluate', function(request, response) {
	var promise = engine.evaluate(JSON.stringify(request.body.request));

	promise.then(function(jsonResponse) {
		response.send(sr.evaluateSuccess("", jsonResponse));
	}, function(error) {
		logger.error(error);
		response.send(sr.evaluateError("Unable to evaluate: " + error.message, error));
	});
});

router.post('/evaluateTestCase', function(request, response) {
	var testSet = request.body.testSet;
	var testCaseName = request.body.id;
	var testCaseFile;

	try {
		testCaseFile = path.join(NextLabsConstants.WORKING_DIR, testSet, testCaseName + ".json");
	} catch (error) {
		logger.error(error);
		response.send(sr.serverError(error, "Invalid test case path"));
		return;
	}
	fs.access(testCaseFile, fs.F_OK, function (error) {
		if (error) {
			logger.error(error);
			response.send(sr.objectNotExists("Test case does not exist or cannot be accessed"));
		} else {
			jsonfile.readFile(testCaseFile, function(error, obj) {
				if (error) {
					logger.error(error);
					response.send(sr.serverError(error,"Unable to parse test case"));
				} else {
					var jsonPayload = {"Request": obj.Request};
					var promise = engine.evaluate(JSON.stringify(jsonPayload));

					promise.then(function(jsonResponse) {
						response.send(sr.evaluateSuccess("", jsonResponse));
					}, function(error) {
						logger.error(error);
						response.send(sr.evaluateError("Unable to evaluate: " + error.message, error));
					});
				}
			});
		}
	});
})

router.get('/error/server/list', function(request, response) {
	response.send(sr.listSuccess("", sr.recentServerErrors));
});

router.get('/error/client/list', function(request, response) {
	response.send(sr.listSuccess("", sr.recentClientErrors));
});

router.put('/testSet/create', function(request,response) {
	var testSetName = request.body.name;
	if (!testSetName) {
		response.send(sr.clientError(new Error("Create test set: Input is undefined"),("Invalid test set name")));
	}

	var testSetDir, requestDir, testCaseDir;
	try {
		testSetDir = path.join(NextLabsConstants.WORKING_DIR, testSetName);
	} catch (error) {
		response.send(sr.serverError(error, "Invalid test set path"));
	}

	mkdirp(testSetDir, function (error) {
		if (error) {
			logger.error(error);
			response.send(sr.serverError(error,"Unable to create test set"));
		} else {
			response.send(sr.createSuccess("Test Set created successfully"))
		}
	});
});

router.get('/testSet/list', function(request, response) {
	var srcpath = NextLabsConstants.WORKING_DIR;

	try {
		var allTestSets = fs.readdirSync(srcpath).filter(function(file) {
			console.log("List test set " + file);
			return fs.statSync(path.resolve(path.join(srcpath, file))).isDirectory();
		});

		if (allTestSets) {
			response.send(sr.listSuccess("There are " + allTestSets.length + " test sets", allTestSets));
		} else {
			response.send(sr.listSuccess("There are no test set", []));
		}
	} catch (error) {
		logger.error(error);
		response.send(sr.serverError(error,"Unable to retrieve test set list"));
	}
});

router.put('/testSet/cloneSingle', function(request, response) {
	var oldName =  request.body.oldName;
	var newName = request.body.newName;

	if (!oldName || !newName) {
		response.send(sr.clientError(new Error("Clone single test set: Some inputs are undefined"), ("Some inputs are undefined")));
		return;
	}

	var sourceDir;
	var destDir;

	try {
		sourceDir = path.join(NextLabsConstants.WORKING_DIR, oldName);
		destDir = path.join(NextLabsConstants.WORKING_DIR, newName);
	} catch (error) {
		logger.error(error);
		response.send(sr.serverError(error, "Invalid paths"));
		return;
	}

	fs.access(destDir, fs.F_OK, function(error) {
		if (error) {
			ncp(sourceDir, destDir, function(error) {
				if (error) {
					logger.error(error);
					response.send(sr.serverError(error, "Unable to clone the test set"));
				} else {
					response.send(sr.cloneSuccess(""));
				}
			});
		} else {
			response.send(sr.objectExists("A test set with the same name exists"));
			return;
		}
	});
});

router.put('/testSet/renameTestSet', function(request, response) {
	var oldName =  request.body.oldName;
	var newName = request.body.newName;

	if (!oldName || !newName) {
		response.send(sr.clientError(new Error("Rename test set: Some inputs are undefined"), ("Some inputs are undefined")));
		return;
	}

	var sourceDir;
	var destDir;

	try {
		sourceDir = path.join(NextLabsConstants.WORKING_DIR, oldName);
		destDir = path.join(NextLabsConstants.WORKING_DIR, newName);
		console.log("Source is--->" + sourceDir)
		console.log("Destination is -->" + destDir)
	} catch (error) {
		logger.error(error);
		response.send(sr.serverError(error, "Invalid paths"));
		return;
	}

	fs.access(destDir, fs.F_OK, function(error) {
		if (error) {
			ncp(sourceDir, destDir, function(error) {
				if (error) {
					logger.error(error);
					response.send(sr.serverError(error, "Unable to rename the test set"));
				} else {
					try {
						deleteDirectory(sourceDir);
					} catch (error) {
						logger.error(error);
					}
					response.send(sr.renameSuccess(""));
				}
			});
		} else {
			response.send(sr.objectExists("A test set with the same name exists"));
			return;
		}
	});
});

router.put('/testSet/cloneMany', function(request, response) {

});

router.delete('/testSet/delete', function(request, response) {
	var testSets = request.body.testSets;

	if (!testSets) {
		response.send(sr.clientError(new Error("Delete test set: Test set list is undefined"), "Test Set list is undefined"));
		return;
	}

	var promises = [];

	for (var i = 0; i < testSets.length; i ++) {

		promises.push(new Promise(function(resolve, reject) {
			var testSet = testSets[i];
			var testSetFolder;
			try {
				testSetFolder = path.join(NextLabsConstants.WORKING_DIR, testSet);
			} catch (error) {
				logger.error(error);
				reject(error);
			}
			fs.access(testSetFolder, fs.F_OK, function (error) {
				console.log("Deleting " + testSetFolder);
				if (error) {
					logger.error(error);
					reject(error);
				} else {
					try {
						deleteDirectory(testSetFolder);
						resolve(true);
					} catch (error) {
						logger.error(error);
						reject(error);
					}
				}
			});
		}));
	}

	Promise.all(promises).then(values => {
		response.send(sr.deleteSuccess());
	}).catch(error => {
		response.send(sr.serverError(error,"Unable to delete one of the test set"));
	})
});

var deleteDirectory = function(directory) {
	fs.readdirSync(directory).forEach(function (file, index) {
		var currentPath = path.join(directory, file);
		if (fs.lstatSync(currentPath).isDirectory()) {
			deleteDirectory(currentPath);
		} else {
			fs.unlinkSync(currentPath);
		}
	});
	fs.rmdirSync(directory);
}

router.put('/testCase/create', function(request, response) {
	var requestObject = request.body.request;
	var expectedResult = request.body.expectedResult;
	var testSet = request.body.testSet;
	var testCaseName = request.body.testCaseName;

	if (!requestObject) {
		response.send(sr.clientError(new Error("Create test case: Request object is undefined"),"Request object is undefined"));
	}

	if (!expectedResult) {
		response.send(sr.clientError(new Error("Create test case: Expected result is undefined"),"Expected result is undefined"));
	}

	if (!testSet) {
		response.send(sr.clientError(new Error("Create test case: Test set is undefined"),"Test set is undefined"));
	}

	if (!testCaseName) {
		response.send(sr.clientError(new Error("Create test case: Test case name is undefined"),"Test case name is undefined"));
	}

	// creating two files, one containing only request objects, the other
	// containing other test case information
	var parent;
	var requestFile;
	var testCaseFile;
	try {
		parent = path.join(NextLabsConstants.WORKING_DIR, testSet);
		requestFile = path.join(parent, NextLabsConstants.REQUEST_DIR, testCaseName + "_REQUEST.json");
		testCaseFile = path.join(parent, testCaseName + ".json");
	} catch (error) {
		logger.error(error);
		response.send(sr.serverError(error, "Invalid test case path"));
		return;
	}

	var testCaseObject = JSON.parse(JSON.stringify(requestObject));
	testCaseObject.expectedResult = expectedResult;
	testCaseObject.description = "";
	testCaseObject.version = 1;

	fs.access(testCaseFile, fs.F_OK, function (error) {
		if (error) {
			// test case doesn't exist - attemp to create
			jsonfile.writeFile(testCaseFile, testCaseObject, {spaces: 4}, function(err) {
				if (err) {
					logger.error(error);
					response.send(sr.serverError(error,"Unable to write to test case file"));
				} else {
					response.send(sr.createSuccess("Test Case created successfully"));
				}
			});
		} else {
			// test case already exists - returning error with the test case
			// object
			jsonfile.readFile(testCaseFile, function(error, obj) {
				if (error) {
					logger.error(error);
					response.send(sr.serverError(error, "Test case existed but couldn't be retrieved"));
				} else {
					response.send(sr.objectExists("Test case existed before created", obj));
				}
			});
		}
	});
});

router.put('/testCase/save', function(request, response) {
	var requestObject = request.body.request;
	var expectedResult = request.body.expectedResult;
	var testSet = request.body.testSet;
	var description = request.body.description;
	var testCaseName = request.body.testCaseName;

	if (!requestObject) {
		response.send(sr.clientError(new Error("Create test case: Request object is undefined"),"Request object is undefined"));
	}

	if (!expectedResult) {
		response.send(sr.clientError(new Error("Create test case: Expected result is undefined"),"Expected result is undefined"));
	}

	if (!testSet) {
		response.send(sr.clientError(new Error("Create test case: Test set is undefined"),"Test set is undefined"));
	}

	if (!testCaseName) {
		response.send(sr.clientError(new Error("Create test case: Test case name is undefined"),"Test case name is undefined"));
	}

	var parent;
	var requestFile;
	var testCaseFile;
	try {
		parent = path.join(NextLabsConstants.WORKING_DIR, testSet);
		requestFile = path.join(parent, NextLabsConstants.REQUEST_DIR, testCaseName + "_REQUEST.json");
		testCaseFile = path.join(parent, testCaseName + ".json");
	} catch (error) {
		logger.error(error);
		response.send(sr.serverError(error, "Invalid test case path"));
		return;
	}

	var testCaseObject = JSON.parse(JSON.stringify(requestObject));
	testCaseObject.expectedResult = expectedResult;
	testCaseObject.description = description;

	jsonfile.readFile(testCaseFile, function(error, obj) {
		if (error) {
			logger.error(error);
			response.send(sr.serverError(error,"Unable to read test case"));
		} else {
			// version mismatch - returning error with the current test case
			// details
			if (obj.version != testCaseObject.version) {
				logger.info("Current version is " + obj.version + ", while request version is " + testCaseObject.version);
				response.send(sr.versionMismatch("Version mismatches", obj));
			} else {
				// write to test case file
				// in crease the version by 1
				testCaseObject.version = testCaseObject.version + 1;
				jsonfile.writeFile(testCaseFile, testCaseObject, {spaces: 4}, function(error) {
					if (error) {
						logger.error(error);
						response.send(sr.serverError(error,"Unable to save test case"));
					} else {
						response.send(sr.saveSuccess("Test Case saved successfully"));
					}
				});
			}
		}
	});
});

router.get("/testCase/list/:testSet", function(request, response) {
	var testSet = decodeURIComponent(request.params.testSet);

	logger.info("Listing test cases of test set " + testSet);

	var testCaseDir;
	try {
		testCaseDir = path.join(NextLabsConstants.WORKING_DIR, testSet);
	} catch (error) {
		logger.error(error);
		response.send(sr.serverError(error, "Invalid test set path"));
		return;
	}

	fs.readdir(testCaseDir, function(error, files) {

		if (error) {
			logger.error(error);
			response.send(sr.serverError(error,"Unable to read test set: " + testSet));
			return;
		}

		var jsonFiles = [];

		for (var i = 0; i < files.length; i ++ ) {
			if (files[i].endsWith('.json')) {
				jsonFiles.push(files[i]);
			}
		}

		if (jsonFiles.length == 0) {
			response.send(sr.listSuccess("There are no test cases", []));
			return;
		}

		var promises = [];

		for (var i = 0; i < jsonFiles.length; i ++) {

			promises.push(new Promise(function(resolve, reject) {
				var filePath;
				var file = jsonFiles[i];

				try {
					filePath = path.join(testCaseDir, file);
				} catch (error) {
					logger.error(error);
					resolve(error);
				}

				fs.stat(filePath, function(error, stats) {
					// if it is a file
					if (!stats.isDirectory()) {
						jsonfile.readFile(filePath, function(error, obj) {
							if (error) {
								logger.error(error);
								sr.serverError(error, "Unable to read one or more test cases");
								resolve({name: file.substring(0, file.length - 5), error: error.message, status: "invalid"});
							} else {
								var testCase = {expectedResult: obj.expectedResult, version: obj.version, name: file.substring(0, file.length - 5)};
								resolve(testCase);
							}
						});
					}
				});
			}));
		}

		Promise.all(promises).then(values => {
			response.send(sr.listSuccess("There are " + values.length + " test cases", values));
		}).catch (error => {
			response.send(sr.serverError(error,"Unable to list test set"));
		});
	});
});

router.get("/testCase/get/:testSet/:testCaseName", function(request, response) {
	var testSet = decodeURIComponent(request.params.testSet);
	var testCaseName = decodeURIComponent(request.params.testCaseName);
	var testCaseFile;

	try {
		testCaseFile = path.join(NextLabsConstants.WORKING_DIR, testSet, testCaseName + ".json");
	} catch (error) {
		logger.error(error);
		response.send(sr.serverError(error, "Invalid test case path"));
		return;
	}
	fs.access(testCaseFile, fs.F_OK, function (error) {
		if (error) {
			logger.error(error);
			response.send(sr.objectNotExists("Test case does not exist or cannot be accessed"));
		} else {
			jsonfile.readFile(testCaseFile, function(error, obj) {
				if (error) {
					logger.error(error);
					response.send(sr.serverError(error,"Unable to parse test case"));
				} else {
					response.send(sr.getSuccess("", obj));
				}
			});
		}
	});

});

router.delete("/testCase/delete/:testSet", function(request, response) {
	var testSet = decodeURIComponent(request.params.testSet);
	var testCases = request.body.testCases;

	if (!testCases) {
		response.send(sr.clientError(new Error("Delete test cases: Test case list is undefined"), "Test Case list is undefined"))
	}

	var promises = [];

	for (var i = 0; i < testCases.length; i ++) {

		promises.push(new Promise(function(resolve, reject) {
			var testCaseName = testCases[i];
			var testCaseFile;

			try {
				testCaseFile = path.join(NextLabsConstants.WORKING_DIR, testSet, testCaseName + ".json");
			} catch (error) {
				logger.error(error);
				reject(error);
			}

			fs.access(testCaseFile, fs.F_OK, function (error) {
				if (error) {
					logger.error(error);
					reject(error);
				} else {
					fs.unlink(testCaseFile, function(error) {
						if (error) {
							logger.error(error);
							reject(error);
						} else {
							resolve(true);
						}
					});
				}
			});
		}));
	}

	Promise.all(promises).then(values => {
		response.send(sr.deleteSuccess(""));
	}).catch (error => {
		response.send(sr.serverError(error,"Unable to delete test case"));
	});
});

router.put("/testCase/cloneSingle", function(request, response) {
	var oldName =  request.body.oldName;
	var newName = request.body.newName;
	var testSet = request.body.testSet;

	if (!oldName || !newName || !testSet) {
		response.send(sr.clientError(new Error("Clone single test case: Some inputs are undefined"), ("Some inputs are undefined")));
		return;
	}

	var sourceFile;
	var destFile;

	try {
		sourceFile = path.join(NextLabsConstants.WORKING_DIR, testSet, oldName + ".json");
		destFile = path.join(NextLabsConstants.WORKING_DIR, testSet, newName + ".json");
	} catch (error) {
		logger.error(error);
		response.send(sr.serverError(error, "Invalid paths"));
		return;
	}

	fs.access(destFile, fs.F_OK, function(error) {
		if (error) {
			fsExtra.copy(sourceFile, destFile, function(error) {
				if (error) {
					logger.error(error);
					response.send(sr.serverError(error, "Unable to clone the test case"));
				} else {
					response.send(sr.cloneSuccess(""));
				}
			});
		} else {
			response.send(sr.objectExists("A test case with the same name exists"));
			return;
		}
	});
});

router.put("/testCase/renameTestCase", function(request, response) {
	var oldName =  request.body.oldName;
	var newName = request.body.newName;
	var testSet = request.body.testSet;

	if (!oldName || !newName || !testSet) {
		response.send(sr.clientError(new Error("Rename single test case: Some inputs are undefined"), ("Some inputs are undefined")));
		return;
	}

	var sourceFile;
	var destFile;

	try {
		sourceFile = path.join(NextLabsConstants.WORKING_DIR, testSet, oldName + ".json");
		destFile = path.join(NextLabsConstants.WORKING_DIR, testSet, newName + ".json");
	} catch (error) {
		logger.error(error);
		response.send(sr.serverError(error, "Invalid paths"));
		return;
	}

	fs.access(destFile, fs.F_OK, function(error) {
		if (error) {
			fsExtra.copy(sourceFile, destFile, function(error) {
				if (error) {
					logger.error(error);
					response.send(sr.serverError(error, "Unable to rename the test case"));
				} else {
					fs.unlink(sourceFile, function(err) {
						if(err && err.code == 'ENOENT') {
							// file doens't exist
							console.info("File doesn't exist, won't remove it.");
						} else if (err) {
							// other errors, e.g. maybe we don't have enough permission
							console.error("Error occurred while trying to remove file");
						} else {
							console.info(`removed`);
						}
					});
					response.send(sr.renameSuccess(""));
				}
			});
		} else {
			response.send(sr.objectExists("A test case with the same name exists"));
			return;
		}
	});
});

app.use("/policy-validator", router);
app.use(function(req, res) {
    res.redirect('/policy-validator');
});

if (startUpCheck) {
	if (jpcOptions.protocol == 'HTTP'){
    	http.createServer(app).listen(jpcOptions.port);
    	logger.info(`NextLabs Policy Validator is listening at HTTP port ${jpcOptions.port}`);
    } else{
    	 https.createServer(credentials, app).listen(jpcOptions.port);
    	logger.info(`NextLabs Policy Validator is listening at HTTPS port ${jpcOptions.port}`);
    }

	fs.readFile('./index.html', function (err, html) {
		if (err) {
			throw err;
		}
		http.createServer(function (request, response) {
			response.writeHeader(200, { "Content-Type": "text/html" });
			response.write(html);
			response.end();
		}).listen(jpcOptions.healthCheckPort);
		logger.info(`NextLabs Policy Validator health check is listening at HTTP port ${jpcOptions.healthCheckPort}`);
	});
} else {
	logger.error("Start up failed due to previous error");
}
