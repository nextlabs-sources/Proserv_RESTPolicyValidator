module.exports = Object.freeze({
	PDP_REST_HOST: "nextlabs.pdp.rest.host",
	PDP_REST_PORT: "nextlabs.pdp.rest.port",
	PDP_REST_RESOURCE_PATH: "nextlabs.pdp.rest.resource_path",
	PDP_REST_HTTPS: "nextlabs.pdp.rest.https",
	PDP_REST_HTTPS_2WAY: "nextlabs.pdp.https.client_authentication",
	PDP_REST_HTTPS_PRIVATE_KEY: "nextlabs.client.authentication.privatekey",
	PDP_REST_HTTPS_PUBLIC_KEY: "nextlabs.client.authentication.publickey",
	PDP_REST_HTTPS_CA_KEY: "nextlabs.client.authentication.cakey",
	PDP_REST_IGNORE_HTTPS_CERTIFICATE: "nextlabs.pdp.rest.ignore_https_certificate",
	PDP_REST_AUTH_TYPE: "nextlabs.pdp.rest.auth_type",
	
	PDP_REST_OAUTH2_SERVER: "nextlabs.pdp.oauth2.ccip",
	PDP_REST_OAUTH2_PORT: "nextlabs.pdp.oauth2.ccport",
	PDP_REST_OAUTH2_HTTPS: "nextlabs.pdp.oauth2.https",
	PDP_REST_OAUTH2_TOKEN_ENDPOINT_PATH: "nextlabs.pdp.oauth2.token_endpoint_path",
	PDP_REST_OAUTH2_TOKEN_GRANT_TYPE: "nextlabs.pdp.oauth2.grant_type",
	PDP_REST_OAUTH2_TOKEN_EXPIRES_IN: "nextlabs.pdp.oauth2.token_expires_in",
	// for grant_type:= password
	PDP_REST_OAUTH2_USERNAME: "nextlabs.pdp.oauth2.username",
	PDP_REST_OAUTH2_PASSWORD: "nextlabs.pdp.oauth2.password",
	// for grant_type:= client_credentials
	PDP_REST_OAUTH2_CLIENT_ID: "nextlabs.pdp.oauth2.client_id",
	PDP_REST_OAUTH2_CLIENT_SECRET: "nextlabs.pdp.oauth2.client_secret",

	DEFAULT_HOST:"localhost",
	DEFAULT_HTTP_PORT: 58080,
	DEFAULT_HTTPS_PORT: 443,
	DEFAULT_RES_PATH:"dpc/authorization/pdp",
	
	NONE_AUTH_TYPE:"NONE",
	
	OAUTH2_AUTH_TYPE:"OAUTH2",
	OAUTH2_GRANT_TYPE_CLIENT_CREDENTIALS: "client_credentials",
	OAUTH2_GRANT_TYPE_PASSWORD: "password",
	DEFAULT_PDP_REST_OAUTH2_HTTPS: "https",
	DEFAULT_PDP_REST_OAUTH2_PORT: 443,
	DEFAULT_PDP_REST_OAUTH2_TOKEN_ENDPOINT_PATH: "/cas/token",
	DEFAULT_PDP_REST_OAUTH2_TOKEN_EXPIRES_IN: 3600,
	DEFAULT_PDP_REST_OAUTH2_GRANT_TYPE: "client_credentials",

	JSON_REQUEST:"json",
	XML_REQUEST:"xml",
	LOCAL_HOST:"localhost",
	API_VERSION: "1.0",
	API_DATA_TYPE_JSON: "json",
	API_SERVICE: "EVAL",
	DEFAULT_INET_ADDRESS: "2130706433",
	WORKING_DIR: "./data/working",
	REQUEST_DIR: "request",
	TEST_CASE_DIR: "test cases",
	LOG_DIR:"./logs",
	SERVER_PORT: 8443
});