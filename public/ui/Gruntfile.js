module.exports = function(grunt) {
	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
		uglify : {
			options : {
				banner : ''
			},
			build : {
				src : 'build/app.min.js',
				dest : 'build/deploy-app.js'
			}
		},
		html2js : {
			options : {
				base : '../'
			},
			main : {
				src : [ 'app/**/*.html' ],
				dest : 'build/templates.js'
			},
		},
		concat : {
			options : {
				process: function(src, filepath) {
					return src.replace(/[/*<%]{4}.*[%>*/]{4}/g, '"templates-main",');
				},
				separator : ';'

			},
			dist : {
				options: {
					process: function(src, filepath) {
						return src.replace(/[/*<%]{4}.*[%>*/]{4}/g, '"templates-main",');
					}
				},
				src : [ 'app/app.js','app/**/*.js' ],
				dest : 'build/app.min.js'
			}
		},
		copy : {
			main : {
				files : [

				// includes files within path and its sub-directories
				{
					expand : true,
					src : [ 'lib/**' ],
					dest : 'deploy/ui/'
				}, {
					expand : true,
					src : [ 'css/**' ],
					dest : 'deploy/ui/'
				}, {
					expand : true,
					src : [ 'config/**' ],
					dest : 'deploy/ui/'
				}, {
					flatten : true,
					src : [ 'app/i18n/*.json' ],
					dest : 'deploy/ui/'
				}, {
					flatten : true,
					src : [ 'build/deploy-app.js' ],
					dest : 'deploy/ui/app/app.js',
					filter : 'isFile'
				}, {
					flatten : true,
					src : [ 'build/templates.js' ],
					dest : 'deploy/ui/app/templates.js',
					filter : 'isFile'
				}, {
					flatten : true,
					src : [ '../index-build.html' ],
					dest : 'deploy/index.html',
					filter : 'isFile'
				} ]
			}
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-html2js');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');

	// Default task(s).
	grunt.registerTask('default', [ 'html2js', 'concat', 'uglify', 'copy' ]);

};