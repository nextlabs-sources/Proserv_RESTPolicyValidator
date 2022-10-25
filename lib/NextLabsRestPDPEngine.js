"use strict";

var request = require("request");
var querystring = require('querystring');
var fs = require('fs');

var NextLabsConstants = require("./NextLabsConstants");
var Utils = require("./Utils");
var Promise = require("bluebird");

function NextLabsRestPDPEngine(options) {
	if (options[NextLabsConstants.PDP_REST_HTTPS] === 'https') {

		this._protocol = 'https';
		this._ClientAuthentication = options[NextLabsConstants.PDP_REST_HTTPS_2WAY];
		this._PrivateKey = options[NextLabsConstants.PDP_REST_HTTPS_PRIVATE_KEY];
		this._PublicKey = options[NextLabsConstants.PDP_REST_HTTPS_PUBLIC_KEY];
		this._CAKey = options[NextLabsConstants.PDP_REST_HTTPS_CA_KEY];
	} else {
		this._protocol = 'http';
	}

	if (!Utils.validateString(options[NextLabsConstants.PDP_REST_HOST])) {
		throw Error("Host is null or undefined");
	} else {
		this._host = options[NextLabsConstants.PDP_REST_HOST].trim();
	}

	if (!Utils.validateNumber(options[NextLabsConstants.PDP_REST_PORT])) {
		if (this._protocol === "http") {
			this._port = NextLabsConstants.DEFAULT_HTTP_PORT;
		} else {
			this._port = NextLabsConstants.DEFAULT_HTTPS_PORT;
		}
	} else {
		this._port = parseInt(options[NextLabsConstants.PDP_REST_PORT]);
	}

	if (!Utils.validateString(options[NextLabsConstants.PDP_REST_RESOURCE_PATH])) {
		this._resourcePath = NextLabsConstants.DEFAULT_RES_PATH;
	} else {
		this._resourcePath = options[NextLabsConstants.PDP_REST_RESOURCE_PATH].trim();
	}
	// hide the default port for http and https (otherwise will case cas authentication problem)
	if( (this._protocol === 'http' && this._port === 80) ||
		(this._protocol === 'https' && this._port === 443) ||
	  (isNaN(this._port)) ) {
		this._endpoint = this._protocol + "://" + this._host + this._resourcePath;
	} else {
		this._endpoint = this._protocol + "://" + this._host + ":" + this._port  + this._resourcePath;
	}

	console.log("Endpoint is " + this._endpoint);

	if (!Utils.validateString(options[NextLabsConstants.PDP_REST_AUTH_TYPE])) {
		this._authenticationType = NextLabsConstants.NONE_AUTH_TYPE;
	} else {
		this._authenticationType = options[NextLabsConstants.PDP_REST_AUTH_TYPE].trim();
	}

	switch(this._authenticationType) {

		case NextLabsConstants.OAUTH2_AUTH_TYPE:
			if(!Utils.validateString(options[NextLabsConstants.PDP_REST_OAUTH2_TOKEN_GRANT_TYPE])) {
				this._oauth2GrantType = NextLabsConstants.DEFAULT_PDP_REST_OAUTH2_GRANT_TYPE;
			} else {
				this._oauth2GrantType = options[NextLabsConstants.PDP_REST_OAUTH2_TOKEN_GRANT_TYPE];
			}

			// if oauth2 server is not specified explicitly, use pdp host
			if(Utils.validateString(options[NextLabsConstants.PDP_REST_OAUTH2_SERVER])) {
				this._oauth2Host = options[NextLabsConstants.PDP_REST_OAUTH2_SERVER].trim();
			} else {
				this._oauth2Host = this._host;
			}
			// oauth protocol should be always https
			this._oauth2Protocol = NextLabsConstants.DEFAULT_PDP_REST_OAUTH2_HTTPS ;

			// if oauth2 server port is not specified explicitly, use default
			if (Utils.validateNumber(options[NextLabsConstants.PDP_REST_OAUTH2_PORT])) {
				this._oauth2Port = parseInt(options[NextLabsConstants.PDP_REST_OAUTH2_PORT]);
			} else {
				this._oauth2Port = NextLabsConstants.DEFAULT_PDP_REST_OAUTH2_PORT;
			}
			// if oauth2 server token endpoint is not specified explicitly, use default
			if (!Utils.validateString(options[NextLabsConstants.PDP_REST_OAUTH2_TOKEN_ENDPOINT_PATH])) {
				this._oauth2TokenEndpoint = NextLabsConstants.DEFAULT_PDP_REST_OAUTH2_TOKEN_ENDPOINT_PATH;
			} else {
				this._oauth2TokenEndpoint = options[NextLabsConstants.PDP_REST_OAUTH2_TOKEN_ENDPOINT_PATH].trim();
			}

			this._oauth2AuthEndpoint = this._oauth2Protocol + "://" + this._oauth2Host + ":" + this._oauth2Port + this._oauth2TokenEndpoint;

			this._oauth2TokenExpiresIn = parseInt(options[NextLabsConstants.PDP_REST_OAUTH2_TOKEN_EXPIRES_IN]);
			if(isNaN(this._oauth2TokenExpiresIn) || this._oauth2TokenExpiresIn < 0)
				this._oauth2TokenExpiresIn = NextLabsConstants.DEFAULT_PDP_REST_OAUTH2_TOKEN_EXPIRES_IN;

			switch(this._oauth2GrantType) {
				case NextLabsConstants.OAUTH2_GRANT_TYPE_CLIENT_CREDENTIALS:
					if(!Utils.validateString(options[NextLabsConstants.PDP_REST_OAUTH2_CLIENT_ID]) || !Utils.validateString(options[NextLabsConstants.PDP_REST_OAUTH2_CLIENT_SECRET])) {
						throw new Error(NextLabsConstants.PDP_REST_OAUTH2_CLIENT_ID + " or " + NextLabsConstants.PDP_REST_OAUTH2_CLIENT_SECRET + " is null or undefined");
					} else {
						this._oauth2ClientId = options[NextLabsConstants.PDP_REST_OAUTH2_CLIENT_ID].trim();
						this._oauth2ClientSecret = options[NextLabsConstants.PDP_REST_OAUTH2_CLIENT_SECRET].trim();
					}
					break;
				case NextLabsConstants.OAUTH2_GRANT_TYPE_PASSWORD:
					if(!Utils.validateString(options[NextLabsConstants.PDP_REST_OAUTH2_USERNAME]) || !Utils.validateString(options[NextLabsConstants.PDP_REST_OAUTH2_PASSWORD])) {
						throw new Error(NextLabsConstants.PDP_REST_OAUTH2_USERNAME + " or " + NextLabsConstants.PDP_REST_OAUTH2_PASSWORD + " is null or undefined");
					} else {
						this._oauth2Username = options[NextLabsConstants.PDP_REST_OAUTH2_USERNAME].trim();
						this._oauth2Password = options[NextLabsConstants.PDP_REST_OAUTH2_PASSWORD].trim();
					}
					break;
				default:
					throw new Error("Unsupported grant type:" + this._oauth2GrantType);
			}
			this._oauth2Header = {}
			break;
		case NextLabsConstants.NONE_AUTH_TYPE:
			console.log("PDP engine will be initialized without any authentication");
			break;
		default:
			throw new Error("Unsupported auth type:" + this._authenticationType);

	}

	this._passedConfiguration = true;
	this._cookieJar = request.jar();
	this._request = request.defaults({
		jar : this._cookieJar,
		strictSSL: false,
  		rejectUnauthorized: false
	});
	this._authPromise = null;
}


/**
 * Authenticate to server with OAuth authentication
 *
 * @return a promise object
 */
NextLabsRestPDPEngine.prototype._oauth2TokenAuth = function() {
	var _this = this;
	if(_this._authenticationType !==  NextLabsConstants.OAUTH2_AUTH_TYPE) {
		throw new Error('The authenticationType is not ' + NextLabsConstants.OAUTH2_AUTH_TYPE);
	}

	if(!_this._authPromise || !_this._authPromise.isPending()) {
		_this._authPromise = new Promise(function (resolve, reject) {
			if (!_this._passedConfiguration) {
				throw new Error("NextLabs Rest PDP engine wasn't configured properly");
			}
			var formObj = {
				grant_type: _this._oauth2GrantType,
				expires_in: _this._oauth2TokenExpiresIn
			}
			if (_this._oauth2GrantType == NextLabsConstants.OAUTH2_GRANT_TYPE_CLIENT_CREDENTIALS) {
				formObj.client_id = _this._oauth2ClientId;
				formObj.client_secret = _this._oauth2ClientSecret;
			} else if (_this._oauth2GrantType == NextLabsConstants.OAUTH2_GRANT_TYPE_PASSWORD) {
				formObj.username = _this._oauth2Username;
				formObj.password = _this._oauth2Password;
			}
			var formData = querystring.stringify(formObj);
			console.log("Grant type is "+ formObj.grant_type);
			console.log("Username is "+ formObj.client_id);
			console.log("Control Center endpoint is " + _this._oauth2AuthEndpoint);

			var options = Object.assign({
				url: _this._oauth2AuthEndpoint,
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': formData.length
				},
				body: formData,
				timeout: 10000
			}, _this._requestOptions);
			_this._request(options, function(err, httpResponse, body) {
					console.log(body);
					if(err) {
						reject(err);
					} else if(httpResponse.statusCode != 200) {
						reject(new Error("Error while generating token with status code " + httpResponse.statusCode));
					} else {
						var tokenData = JSON.parse(body)
						var tokenType = tokenData['token_type']
						var token = tokenData['access_token']
						if(!Utils.validateString(tokenType) || !Utils.validateString(token)) {
							reject(new Error("got non wel formed token response while generating token"));
						}
						_this._oauth2Header.Authorization = tokenType + ' ' + token
						resolve(true);
					}
				}
			);
		});
	}
	return _this._authPromise;
};


/**
 * Evaluate the json request
 *
 * @param jsonPayLoad
 *            the request object in json format
 * @return a promise object
 */
NextLabsRestPDPEngine.prototype.evaluate = function(jsonPayload) {
	var _this = this;

	if(typeof jsonPayload !== 'string') {
		throw new Error("Illegal argument: " + jsonPayload);
	}

	return new Promise(function(resolve, reject) {
		if (!_this._passedConfiguration) {
			throw new Error("NextLabs Rest PDP engine wasn't configured properly");
		}

		_this._sendRequest(jsonPayload).then(function(response) {
			resolve(response);
		}, function(error) {
			// check whether it's caused by unauthorized
			if(error instanceof PDPAuthenticationError) {
				// try to authenticate and try again
				console.log("Trying to authenticate...");

				var authPromise = null;
				switch(_this._authenticationType) {
					case NextLabsConstants.OAUTH2_AUTH_TYPE:
						authPromise = _this._oauth2TokenAuth()
						break;
					default:
						reject(new Error("Unsupported auth type return by PDP:" + _this._authenticationType))
				}

				authPromise && authPromise.then(function() {
					_this._sendRequest(jsonPayload).then(function(response) {
						resolve(response);
					}, function(error) {
						reject(error);
					});
				}, function(error) {
					reject(error);
				});
			} else {
				reject(error);
			}
		});
	});
}

/**
 * Internal method to send post request to NextLabs Rest API
 *
 * @param jsonPayLoad
 *            the request object in json format
 * @return a promise object, with resolve to json object of the reposne body
 */
NextLabsRestPDPEngine.prototype._sendRequest = function(jsonPayLoad) {
	var _this = this;

	var formData = querystring.stringify({
		"Version" : NextLabsConstants.API_VERSION,
		"DataType" : NextLabsConstants.API_DATA_TYPE_JSON,
		"Service" : NextLabsConstants.API_SERVICE,
		"data" : jsonPayLoad
	});

	var headers = {
			'Accept' : 'application/json',
			'Content-Type' : 'application/x-www-form-urlencoded',
			'Content-Length' : formData.length
		};

	for (var k in _this._oauth2Header) {
		headers[k] = _this._oauth2Header[k]
	}
	var pKey;
	var pCert;
	var caPem;

	return new Promise(function sendRequestPromise(resolve, reject) {

		if (_this._ClientAuthentication == "yes") {
			//For CA Cert handing
			fs.access(_this._CAKey, fs.F_OK, function(error) {
				if (error) {
					caPem=null;
				}
				else{
					if(fs.lstatSync(_this._CAKey).isFile()){
						caPem = fs.readFileSync(_this._CAKey);
					}else {
						reject(new Error("Invalid CA Key File Location"));
					}
				}
			});

			if(fs.lstatSync(_this._PrivateKey).isFile()){
				pKey = fs.readFileSync(_this._PrivateKey);
			}else {
				reject(new Error("Invalid Private Key File Location"));
			}


			if(fs.lstatSync(_this._PublicKey).isFile()){
				pCert = fs.readFileSync(_this._PublicKey);
			}else {
				reject(new Error("Invalid Public Key File Location"));
			}
		}

		var options = {
			followAllRedirects : true,
			url : _this._endpoint,
			key: pKey,
			cert: pCert,
			ca: caPem,
			method : 'POST',
			headers : headers,
			body : formData,
			timeout : 10000
		}


		_this._request(options, function(error, response, body) {
			if (error) {
				reject(error);
			} else if (response.statusCode == 404) {
				reject(new Error("404: Unable to find the specified Policy Controller"));
			} else if (response.statusCode == 401) {
				reject(new PDPAuthenticationError("401: Unable to authenticate with the specified Policy Controller"));
			} else if (response.statusCode == 200) {
				try {
					resolve(JSON.parse(body));
				} catch (err) {
					reject(new Error("Unable to parse the response of the Policy Controller. Please check the resource path."))
				}
			} else {
				reject(new Error("Unable to call the Rest API" + body));
			}
		});
	});

}

function PDPAuthenticationError(message, extra) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.extra = extra;
};

module.exports = NextLabsRestPDPEngine;
