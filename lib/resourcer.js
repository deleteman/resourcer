var fs = require("fs"),
	dir = require("node-dir"),
	path = require("path"),
	os = require("os"),
	deepExtend = require("node.extend"),
	xml2JS = require("xml2js").parseString,
	_ = require("underscore");


module.exports = function() {
	return new Resourcer();
};


var __gR = null; //Global resources, so they're kept

var Resourcer = function() {
	this.load_path = "";
	this.knownFormats = {"json": "loadJsonResource", 
						 "xml": "loadXMLResource",
						 "csv": "loadCSVResource"};
	this.R = __gR || {};
	//Default options
	this.csvOpts = {
		fieldSplitter: ",",
		firstRowFieldNames: true
	};
};



Resourcer.prototype.init = function(opts, cb) {
	var dirname = process.cwd() + path.sep;

	if(opts.path[0] == path.sep) { //Absolute path
		this.load_path = this.normalizePath(opts.path);
	} else {
		this.load_path = opts.path = (dirname + this.normalizePath(opts.path));
	}

	var regExp = ".*\\" + path.sep + "$"
	var endsInSlashExp = new RegExp(regExp, "g");


	if(!this.load_path.match(endsInSlashExp)) 	{
		this.load_path += path.sep;
	}
	this.R = {};
	this.knownFormats = _.extend(this.knownFormats, opts.extraFormats);
	this.verbose = opts.verbose || false;

	if(opts.csvOpts) {
		if(opts.csvOpts.fieldSplitter != null) {
			this.csvOpts.fieldSplitter = opts.csvOpts.fieldSplitter;
		}
		if(opts.csvOpts.firstRowFieldNames != null) {
			this.csvOpts.firstRowFieldNames = opts.csvOpts.firstRowFieldNames;	
		}
	}

	var self = this;

	dir.paths(this.load_path, function(err, paths) {
		if(err) {
			console.log("Error reading load path: " + err);
			return;
		}

		var delayedCB = null;
		if(typeof cb == "function") {
			delayedCB = _.after(paths.files.length, function() {
				__gR = self.R; //All resources have been loaded, so updating the global object
				cb();
			});
		}

		var rootPath = self.load_path;
		_.each(paths.files, function(file) {
			self.loadResource(rootPath, file);
			if(delayedCB) {
				delayedCB();
			}
		});
		
	});
	
};

//JSON
Resourcer.prototype.loadJsonResource = function(content, cb) {
	try {
		var json = JSON.parse(content);
		cb(null, json);
	} catch(e) {
		cb(e, null);
	}
};

//XML
Resourcer.prototype.loadXMLResource = function(content, cb) {
	xml2JS(content, cb);
};

//CSV
Resourcer.prototype.splitFields = function(text) {
	text = text.replace(/""/g, "[||]"); //We change the double quotes into something different

	//Keep empty fields empty
	var emptyFieldPatt = new RegExp(this.csvOpts.fieldSplitter + "[\\s]*" + this.csvOpts.fieldSplitter,"g");
	text = text.replace(emptyFieldPatt, "[--]");

	//Keep empty fields empty
	var startEmptyFieldsPatt = new RegExp("^" + this.csvOpts.fieldSplitter,"g");
	text = text.replace(startEmptyFieldsPatt, "[--]" + this.csvOpts.fieldSplitter);

	//Keep empty fields empty
	var endEmptyFieldPatt = new RegExp(this.csvOpts.fieldSplitter + "$","g");
	text = text.replace(endEmptyFieldPatt, this.csvOpts.fieldSplitter + "[--]");


	//RegExp that'll split the fields accordingly
	var patt = new RegExp('"([^"]*)"|([^"' + this.csvOpts.fieldSplitter + ']*)', "g");
	var matches = text.match(patt);
	var self = this;
	var parts = _.filter(matches,function(m) {
		return (m.trim().length > 0 && m.trim() != self.csvOpts.fieldSplitter);
	}).map(function(m) {
		m = m.replace(/"/g, "").replace(/\[\|\|\]/g, '"').replace(/\[--\]/, ""); //Remove single quotes and add the required single quotes
		return m.trim();
	});

	return parts;
};

Resourcer.prototype.loadCSVResource = function(content, cb) {
	var rows = content.split(os.EOL);
	var self = this;
	var startingRow = 0;
	var fieldNames = this.splitFields(rows[0]);
		results = [];

	if(this.csvOpts.firstRowFieldNames) {
		startingRow = 1;
	} else {
		var rowCount = fieldNames.length;
		fieldNames = [];
		for(var i = 0; i < rowCount; i++) {
			fieldNames.push("field" + i);
		}
	}
	for(var i = startingRow; i < rows.length; i++) {
		var cols = this.splitFields(rows[i]);
		var tmpDummy = {};
		_.each(fieldNames, function(name, idx) {
			var fieldName = self.sanitizeString(name).trim();
			tmpDummy[fieldName] = (cols[idx]) ? cols[idx].trim() : "";
		});
		results.push(tmpDummy);
	}
	cb(null, results);
};


Resourcer.prototype.normalizePath = function(p) {
	p = p.replace(/\//g, path.sep);
	p = p.replace(/\\/g, path.sep);
	return p;
};

Resourcer.prototype.loadResource = function(rootPath, filePath) {
	var ext = path.extname(filePath).replace(".","");
	var self = this;

	function processLoadedResource(err, json) {
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
	}
	if(this.knownFormats[ext]) {
		var resourceContent = fs.readFileSync(filePath, {encoding: "utf-8"});

		if(typeof this.knownFormats[ext] == "string") {
			this[this.knownFormats[ext]](resourceContent, processLoadedResource);
		} else {
			this.knownFormats[ext](resourceContent, processLoadedResource);
		}
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
