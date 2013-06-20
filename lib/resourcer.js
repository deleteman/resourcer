var fs = require("fs"),
	dir = require("node-dir"),
	path = require("path"),
	deepExtend = require("node.extend"),
	xml2JS = require("xml2js").parseString,
	_ = require("underscore");


module.exports = function() {
	return new Resourcer();
};


var __gR = null; //Global resources, so they're kept

var Resourcer = function() {
	this.load_path = "";
	this.knownFormats = {"json": this.loadJsonResource, 
						 "xml": this.loadXMLResource};
	this.R = __gR || {};
};

Resourcer.prototype.init = function(opts, cb) {
	var dirname = process.cwd();
	this.load_path = opts.path = (dirname + opts.path);
	this.R = {};
	this.knownFormats = _.extend(this.knownFormats, opts.extraFormats);
	this.verbose = opts.verbose || false;

	var self = this;

	dir.paths(this.load_path, function(err, paths) {

		var delayedCB = null;
		if(typeof cb == "function") {
			delayedCB = _.after(paths.files.length, function() {
				__gR = self.R; //All resources have been loaded, so updating the global object
				cb();
			});
		}

		var rootPath = self.normalizePath(self.load_path);
		_.each(paths.files, function(file) {
			self.loadResource(rootPath, file);
			if(delayedCB) {
				delayedCB();
			}
		});
		
	});
	
};

Resourcer.prototype.loadJsonResource = function(content, cb) {
	try {
		var json = JSON.parse(content);
		cb(null, json);
	} catch(e) {
		cb(e, null);
	}
};

Resourcer.prototype.loadXMLResource = function(content, cb) {
	xml2JS(content, cb);
};

Resourcer.prototype.normalizePath = function(p) {
	p = p.replace(/\//g, path.sep);
	p = p.replace(/\\/g, path.sep);
	return p;
};

Resourcer.prototype.loadResource = function(rootPath, filePath) {
	var ext = path.extname(filePath).replace(".","");
	var self = this;
	if(this.knownFormats[ext]) {
		var resourceContent = fs.readFileSync(filePath);
		this.knownFormats[ext](resourceContent, function(err, json) {
			if(!err) {
				var relativePath = filePath.replace(rootPath, "");
				var relPathParts = relativePath.split(path.sep);
				var focus = {};
				var jsonParent = focus;

				_.each(relPathParts, function(part) {
					if(part.indexOf(".") != -1) {
						part = path.basename(part, ext);
					}
					part = self.sanitizeString(part);
					if(!focus[part]) {
						focus[part] = self.makePathNode(); 
					}
					focus = focus[part];
				});
				var resource = self.makeResource(json, resourceContent);
				focus = _.extend(focus, resource);
				self.R = deepExtend(true, self.R, jsonParent);
			} else {
				if(self.verbose) {
					console.log("Invalid format for resource: " + filePath);
				}
			}
		});
	} else {
		if(self.verbose) {
			console.log("Unkown format, so ignoring resource: " + filePath);
		}
	}
};

Resourcer.prototype.makePathNode = function() {
	return {
		listResources: function() {
			var list = [];
			for(prop in this) {
				if(typeof this[prop] != "function") {
					list.push(prop);
				}
			}
			return list;
		}
	}
};

Resourcer.prototype.makeResource = function(json, original) {
	var methods = {
		original_content: original,
		original: function() {
			return this.original_content;
		}
	}	
	return _.extend(json, methods);
};

Resourcer.prototype.sanitizeString = function(str) {
	return str.replace(/[ -]+/g, "_").replace(/[\/><\\:*\|\"!\.]+/g, "");
};
