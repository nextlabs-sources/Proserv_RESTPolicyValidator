var MainAppConfig = {
	"isOnline" : true,
	"logLevel" : 1,
	"baseUrl" : '',
	"url" : {
		"online" : {
			"projectName" : "policy-validator",
			"map" : {
				"evaluate" : "evaluate",
				"evaluateTestCase":"evaluateTestCase",
				"testSet.create": "testSet/create",
				"testSet.delete": "testSet/delete",
				"testSet.get": "testSet/get/",
				"testSet.cloneSingle":"testSet/cloneSingle",
				"testSet.renameTestSet":"testSet/renameTestSet",
				"testSet.cloneMany":"testSet/cloneMany",
				"testCase.create":"testCase/create",
				"testCase.save":"testCase/save",
				"testCase.delete":"testCase/delete/",
				"testCase.get":"testCase/get/",
				"testSet.list":"testSet/list",
				"testCase.list":"testCase/list/",
				"testCase.cloneSingle":"testCase/cloneSingle",
				"testCase.cloneMany":"testCase/cloneMany",
				"testCase.renameTestCase":"testCase/renameTestCase",
				"configuration.get":"configuration",
				"configuration.update":"configuration/update",
				"configuration.rattrib.update":"configuration/rattrib/update",
				"configuration.sattrib.update":"configuration/sattrib/update",
				"configuration.rattrib.get":"configuration/rattrib",
				"configuration.sattrib.get":"configuration/sattrib",
				"configuration.test":"configuration/test",
				"configuration.changeActiveConfiguration":"configuration/changeActiveConfiguration",
				"error.server.list":"error/server/list",
				"error.client.list":"error/client/list",
				"username.get":"username"
			}
		}
	}
}
