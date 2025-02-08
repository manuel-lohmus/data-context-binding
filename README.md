
<div class="row w-100">
<div class="col-3 d-none d-lg-inline">
<div class="sticky-top overflow-auto vh-100">
<div id="list-headers" class="list-group mt-5">

- [**data-context-binding**](#data-context-binding)
  - [**Introduction**](#introduction)
  - [**Features**](#features)
  - [**Testing**](#testing)
  - [**Usage**](#usage)
  - [**References**](#references)
  - [**License**](#license)
    
</div>
</div>
</div>
 
<div class="col">
<div class="p-2 markdown-body" data-bs-spy="scroll" data-bs-target="#list-headers" data-bs-offset="0" tabindex="0">

# data-context-binding

Simple and lightweight solution for binding data to DOM elements.<br>
This manual is also available in [HTML5](https://manuel-lohmus.github.io/data-context-binding/README.html).<br>
[![npm-version](https://badgen.net/npm/v/data-context-binding)](https://www.npmjs.com/package/data-context-binding)

## Introduction

Data context binding library for browser.<br>
This library is a simple and lightweight solution for binding data to DOM elements.<br>
Used when building a **single-page application** (**SPA**), this library offers a modern approach.<br>

**frontend workflow**: data > 
['data-context'](https://www.npmjs.com/package/data-context) > 
['data-context-binding'](https://www.npmjs.com/package/data-context-binding) > 
DOM elements
<br>
**backend to frontend workflow**: file > 
['fs-broker'](https://www.npmjs.com/package/fs-broker) > 
['data-context'](https://www.npmjs.com/package/data-context) > 
['ws-user'](https://www.npmjs.com/package/ws-user) > 
['tiny-https-server'](https://www.npmjs.com/package/tiny-https-server) >
['ws13'](https://www.npmjs.com/package/ws13) >
browser > 
['ws-user'](https://www.npmjs.com/package/ws-user) > 
['data-context'](https://www.npmjs.com/package/data-context) > 
['data-context-binding'](https://www.npmjs.com/package/data-context-binding) > 
DOM elements

> Please note, this version is not backward compatible with version 1.x<br>
> Requires ['data-context'](https://www.npmjs.com/package/data-context) module version 2.x<br>
> Note the restrictive requirements of the 'data-context' module.

## Features

- Bind data to the DOM elements.
- template engine for rendering HTML.
- Watch for changes in the data and update the DOM elements.

## Testing

To test, open the '[index.test.html](https://manuel-lohmus.github.io/data-context-binding/index.test.html)' file. The tests will run and the results will be displayed.

or on the command line in the project directory 'data-context-binding':

`npm test`

## Usage

This example demonstrates a simple and effective way to bind data to DOM elements using the data-context-binding library.

**Summary**
 - **Import Modules**: Load the required JavaScript libraries.
 - **Add Data**: Define the data in a script tag with type application/json.
 - **Bind Data**: Use path and bind attributes to bind data to DOM elements.
 - **Editable Fields**: Allow users to edit data and reflect changes in real-time.
 - **Live Changes**: Listen for data changes and update the DOM dynamically.

[hello-world.html](https://manuel-lohmus.github.io/data-context-binding/examples/hello-world.html):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>data-context-binding</title>
    <!-- STEP 1. Import the modules 'data-context' and 'data-context-binding'.
        Import for an HTML page hosted on the server. -->
    <!--<script src="../datacontext.js"></script>-->
    <!--<script src="../index.js"></script>-->
    <!-- STEP 1. Import the modules 'data-context' and 'data-context-binding'.
        Import for a standalone HTML page. -->
    <script async src="https://cdn.jsdelivr.net/npm/data-context@2.0.0-beta.3/index.min.js"></script>
    <script async src="https://cdn.jsdelivr.net/npm/data-context-binding@2.0.0-beta.1/index.min.js"></script>
    <!-- STEP 2. Add the data to a container with the ID 'data'. Its contents will be read automatically. -->
    <script id="data" type="application/json">
        {
            "doc": {
                /* 1: The metadata-title context object */
                /* 2: The metadata-title context object */
                "title": "Hello World", // The title comment
                /* The metadata-description context object */
                "description": "This is a simple example of data context binding.", // The description comment
                /* { "hidden": "This is a must be hidden value." } */
                "debug": false
            }
        }
    </script>
</head>
<body>
    <!-- STEP 3. Bind data to the DOM elements.
        In this container we use the 'doc' object.
        The 'path' attribute is part of property path. -->
    <div path="doc">
        <div>
            <!-- STEP 3. Bind data to the DOM elements.
            The `path` attribute  is property path in the data object.
            The `bind` attribute is performed data binding. -->
            <h1 path="title" bind>Title</h1>
            <!-- STEP 3. Bind data to the DOM elements.
            The `path` attribute  is property path in the data object.
            The `bind` attribute is performed data binding. -->
            <p path="description" bind>Description</p>
        </div>
    </div>
    <hr />
    <h3>Edit the values:</h3>
    <label for="title">Title:</label>
    <br />
    <!-- STEP 3. Bind data to the DOM elements.
    The `path` attribute  is property path in the data object.
    The `bind` attribute is performed data binding. -->
    <input type="text" path="doc.title" bind style="width:380px" />
    <br />
    <br />
    <label>Description:</label>
    <br />
    <!-- STEP 3. Bind data to the DOM elements.
    The `path` attribute  is property path in the data object.
    The `bind` attribute is performed data binding. -->
    <input type="text" path="doc.description" bind style="width:380px" />
    <hr />
    <label>Live changes:</label>
    <br />
    <!-- STEP 3. Bind data to the DOM elements.
    The `bind` attribute is performed data binding. 
    Listens for data context changes -->
    <textarea cols="50" rows="10" bind="change"></textarea>
</body>
</html>
```

Here is also a [DEMO](https://manuel-lohmus.github.io/data-context-binding/demo.html)

## References

## License

This project is licensed under the MIT License.

Copyright &copy; 2024 Manuel Lõhmus

[![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/donate?hosted_button_id=4ZHDGZVF64YZQ)

Donations are welcome and will go towards further development of this project.

<br>
<br>
<br>
</div>
</div>
</div>

