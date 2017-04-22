/* global module, require */
module.exports = function (grunt) {
	var sTarget = grunt.option("target") || "target",
		sWorkspace = grunt.option("workspace"),
		sSaveFile = grunt.option("file"),
		sSaveFirstFolder,
		aBabelSrc = [],
		oPackage = grunt.file.readJSON('package.json');

	if (sSaveFile) {
		sSaveFile = sSaveFile.replace(/\\/g, "/").substring(sWorkspace.length + 1);
		sSaveFirstFolder = sSaveFile.substring(0, sSaveFile.indexOf("/"));
		if (sSaveFirstFolder === "src" || sSaveFirstFolder === "sample") {
			if (sSaveFirstFolder === "src" && /^.*\.js$/.test(sSaveFile)) {
				aBabelSrc = [sSaveFile.substring(sSaveFile.indexOf("/") + 1)];
			}
		} else {
			sSaveFile = "";
		}
	}

	grunt.initConfig({
		pkg: oPackage,
		clean: {
			target: [sTarget, "pages"],
			dist: ["dist"]
		},
		"openui5_preload": {
			json: {
				options: {
					resources: 'target/src',
					dest: 'dist',
					compatVersion: '1.38'
				},
				libraries: 'spet/data/explorer'
			},
			js: {
				options: {
					resources: 'target/src',
					dest: 'dist'
				},
				libraries: 'spet/data/explorer'
			}
		},
		uglify: {
			dist: {
				files: [{
					expand: true,
					cwd: 'target/src',
					src: '**/*.js',
					dest: 'dist'
				}]
			}
		},
		copy: {
			dist: {
				files: [{
					expand: true,
					dot: true,
					cwd: 'target/src',
					src: ['**/*.js', '**/*.js.map'],
					dest: 'dist/',
					rename: function(dest, src) {
						return dest + src.replace('.js','-dbg.js');
					}
				}, {
					src: "target/src/spet/data/explorer/.library",
					dest: "dist/spet/data/explorer/.library"
				}]
			},
			target: {
				files: [{
					expand: true,
					dot: true,
					src: ["src/**", "sample/**", "!**/*.js"],
					dest: sTarget
				}]
			},
			pages: {
				files: [{
					expand: true,
					dot: true,
					cwd: "target",
					src: ["src/**", "sample/**"],
					dest: "pages"
				}]
			},
			save: {
				files: [{
					src: sSaveFile ? sSaveFile : [],
					dest: sTarget + "/" + sSaveFile
				}]
			}
		},
		connect: {
			server: {
				options: {
					port: 8000,
					keepalive: true,
					middleware: function (connect, options, defaultMiddleware) {
						return [require('grunt-middleware-proxy/lib/Utils').getProxyMiddleware()].concat(defaultMiddleware);
					}
				},
				proxies: [{
                    context: '/V2/Northwind',
                    host: 'services.odata.org'
				}]
			}
		},
		babel: {
			target: {
				options: {
					"sourceMap": true,
					"presets": ["ui5"],
					"babelrc": false,
					"sourceRoot": "src"
				},
				files: [{
					cwd: "src",
					expand: true,
					dot: true,
					src: ["**/*.js"],
					dest: sTarget + "/src"
				}]
			},
			save: {
				options: {
					"sourceMap": true,
					"presets": ["ui5"],
					"babelrc": false,
					"sourceRoot": sSaveFirstFolder
				},
				files: [{
					cwd: sSaveFirstFolder,
					expand: true,
					dot: true,
					src: aBabelSrc,
					dest: sTarget + "/" + sSaveFirstFolder
				}]
			}
		},
		jsdoc : {
			src : {
				src: ['src/**/*.js', 'README.md'],
				options: {
					destination : "pages/jsdoc",
					template : "node_modules/ink-docstrap/template",
					configure : ".jsdoc.json"
				}
			}
		},
		compress: {
			dist: {
				options: {
					archive: 'pages/latest.zip'
				},
				files: [{
					expand: true,
					dot: true,
					cwd: 'dist/',
					src: '**/*',
					dest: '.'
				}]
			}
		},
		replace: {
			target: {
				options: {
					patterns: [{
						match: 'version',
						replacement: oPackage.version
					}]
				},
				files: [{
					expand: true,
					dot: true,
					src: "target/src/spet/data/explorer/*",
					dest: "./"
				}]
			},
			pages: {
				options: {
					patterns: [{
						match: 'version',
						replacement: oPackage.version
					}]
				},
				files: [{
					expand: true,
					dot: true,
					src: "pages/jsdoc/*",
					dest: "./"
				}]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-middleware-proxy');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-babel');
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-openui5');
	grunt.loadNpmTasks('grunt-replace');

	grunt.registerTask('start', ['setupProxies:server', 'connect:server']);
	grunt.registerTask('build', ['clean:target', 'babel:target', 'copy:target', 'replace:target']);
	grunt.registerTask('default', ['build', 'start']);
	grunt.registerTask('save', ['copy:save', 'babel:save']);
	grunt.registerTask('dist', ['build', 'clean:dist', 'openui5_preload', 'uglify', 'copy:dist', 'compress',
		'jsdoc', 'replace:pages', 'copy:pages']);
};