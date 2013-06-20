#Resourcer

This module attempts to ease the loading and parsing of resource files into the application. It'll load automatically any file of a known format into a hash. That hash will be structured accordingly to the folder structure.

So, a JSON file stored on: resources/jsons/names.json with the following structure:
```javascript
{ 
	firstNames : ["Alicia", "Michel", "Penelope"]
}
```

You can use Resourcer like this:

```javascript
var resourcer = require("resourcer")();

resourcer.init({
	path: "/resources/"
});

//.... later on
console.log(resourcer.R.jsons.names.firstNames);
//This will print: ["Alicia", "Michel", "Penelope"]

```

##Install

To install the app, just use npm:

```
$ npm install node-resourcer
```

##Init method

The init method takes two arguments: options and an optional callback.

The options supported are:

+ path: (Mandatory) It's the relative path of the folder containing all the resources.
+ extraFormats: (Optional) Hash containing the extra known formats and their respective parsers.
+ verbose: (Optional, defaulted to false) If true, errors and info messages will be printed on the console.

The optinal callback will be executed after all the resources are loaded.

##Known formats

By default, Resourcer is able to parse JSON and XML file formats, but it's easily extensible, allowing other file formats to be used.
In order to add support for other formats, just specify the extension and it's parser on the `init`method:

```javascript
resourcer.init({
	path: "/resources/",
	extraFormats: {
		txt: parserFunction
	}
});
```

The parser function will receive the content of the file, and a callback. The callback function receives two parameters, an error (if any) and the json structure that the resource was turned into.


##Original content

Even though all resources are turned into a JSON structure, it's original form is kept, in case it's required by the developer. In order to access the original content, just call the `original` method from the resource.

Going back to the first example, doing:

```javascript
resourcer.R.jsons.names.original();
```
Will return the string content of the file `names.json` 
This can be specially useful for non-json resources.

##Resource list

The nodes of the resource tree that don't represent the content of a specific file, are called _PathNodes_ and they are able to list their child resources, using the method  `listResources`.

i.e:

```javascript
console.log(resourcer.R.jsons.listResources());
//Will print: ['names']

```

##Contributing

If you feel like contributing with bug-fixing, new features or just ideas, please create the issue and (if required) the pull-request.


