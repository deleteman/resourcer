var resourcer = require("../../lib/resourcer")();


exports.main_interface = {
	init_method: function(test) {
		test.expect(1);
		test.ok(resourcer.init);
		test.done();
	},
	sanitizeString: function(test) {
		test.expect(3);
		var str = resourcer.sanitizeString("Str in-g");
		var str2 = resourcer.sanitizeString("String!<>");
		var str3 = resourcer.sanitizeString("String...");
		test.equal(str, "Str_in_g", "STR should be equal to Str_in_g");
		test.equal(str2, "String", "STR2 should be equal to String");
		test.equal(str3, "String", "STR2 should be equal to String");
		test.done();
	}
}

exports.resources = {
	json: function(test) {
		test.expect(1);
		resourcer.init({
			path: "/test/samples/"
		}, function() {
			//console.log(resourcer.R.json);
			test.ok(resourcer.R.json.sample1.test != null);
			test.done();
		});
	},
	invalid_json: function(test) {
		test.expect(1);
		resourcer.init({
			path: "/test/samples/",
			verbose: true
		}, function() {
			//console.log(resourcer.R.json);
			test.equal(resourcer.R.json.invalid, undefined);
			test.done();
		});
	},
	non_json: function(test) {
		test.expect(1);
		resourcer.init({
			path: "/test/samples/"
		}, function() {
			test.ok(resourcer.R.xml.sample2.test != null);
			test.done();
		});
	},
	original: function(test) {
		test.expect(1);
		resourcer.init({
			path: "/test/samples/"
		}, function() {
			var original_content = resourcer.R.xml.sample2.original();
			test.equal(original_content , "<test id=\"xml-test\">true</test>");
			test.done();
		});
	},
	list: function(test) {
		test.expect(2);
		resourcer.init( {
			path: "/test/samples/"
		}, function() {
			var resources = resourcer.R.json.listResources();
			///console.log(resources);
			test.ok(resources instanceof Array, "It should be an array");
			test.ok(resources.length == 2, "It should contain 2 elements");
			test.done();
		});
	},
	custom_loader: function(test) {
		test.expect(1);
		resourcer.init( {
			path: "/test/samples/",
			extraFormats: { "txt": function(content, cb) {
				cb(null, { text: content});
			}}
		}, function() {
			test.equal(resourcer.R.more_content.file1.text, "hello world");
			test.done();
		});
	},
	data_kept: function(test) {
		test.expect(1);
		resourcer.init( {
			path: "/test/samples/"
		}, function() {
			var otherR = require("../extra").R;
			test.ok(otherR.json);
			test.done();
		});
	}
}
