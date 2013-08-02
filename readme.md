#Resourcer

This module attempts to ease the loading and parsing of resource files into the application. It'll load automatically any file of a known format into a hash. That hash will be structured accordingly to the folder structure.

So, for a JSON file stored on: resources/jsons/names.json with the following structure:
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

+ path: (Mandatory) It's the  path of the folder containing all the resources (can be relative or absolute).
+ extraFormats: (Optional) Hash containing the extra known formats and their respective parsers.
+ verbose: (Optional, defaulted to false) If true, errors and info messages will be printed on the console.
+ csvOpts: (Optional) Configuration options to be used when parsing a CSV file.
	+ fieldSplitter: The character (or characters) to be used as field splitters. By default it's ','
	+ firstRowFieldNames: Tells Resourcer to use the first row of the csv file for field naming, instead of treating it like data. By default it's true.

The optinal callback will be executed after all the resources are loaded.

##Known formats

By default, Resourcer is able to parse JSON, XML and CSV file formats, but it's easily extensible, allowing other file formats to be used.
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

###Working with CSV

In the case of CSV files, there are some considerations to take into account. 
Resourcer tries to follow the definition of CSV described on Wikipedia: http://en.wikipedia.org/wiki/Comma-separated_values

By default, Resourcer will assume that the first row on every CSV file contains the names of the columns, which will be turned into the names of the different fields.

i.e:
A CSV file called _people.csv_ inside resources/csv

```
"First Name", "Last Name"
Fernando, Doglio
John, Doe
```

Will turn into:

_resourcer.R.csv.people_
```javascript
[
{
	First_Name: "Fernando",
	Last_Name: "Doglio"
},
{
	First_Name: "John",
	Last_Name: "Doe"
}
]
```

If the CSV doens't have the columns information on the first row, then a configuration option can be set to make Resourcer auto-generate the field names (they will be _filed0_, _field1_, ..., _fieldN_). See above for details on that.


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

If you feel like contributing with bug-fixing, new features or just ideas, please follow these simple steps:

+ Create the issue 
+ Fork the project
+ Make your changes / Add your feature
+ Add or update the tests
+ Make the pull request 

That simple!


##License 

The MIT License (MIT)

Copyright (c) 2013 Fernando Doglio

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

