/** Data Binding functions for Browser. @preserve Copyright (c) 2020 Manuel Lõhmus.*/
"use strict";
(function (global, factory) {
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self,
        global.DB = factory(global.DB = {}, global.DC));
}(this, (function (DB, DC) {


    if (DB && DB.name === "DB") return DB;
    else DB.name = "DB";
    if (!DC) { throw new Error("Data Binding depends npm 'data-context'"); }

    //#region function for IE

    /** String */
    String.prototype.startsWith || Object.defineProperty(String.prototype, 'startsWith', {
        value: function (search, position) {
            var pos = position > 0 ? position | 0 : 0;
            return typeof search === "string" && this.substring(pos, pos + search.length) === search;
        }
    });
    String.prototype.endsWith || Object.defineProperty(String.prototype, 'endsWith', {
        value: function (search, length) {
            length = (length === undefined || length > this.length) ? this.length : length;
            return typeof search === "string" && this.substring(length - search.length, length) === search;
        }
    });
    String.prototype.trimStart || Object.defineProperty(String.prototype, 'trimStart', {
        value: function (str) {
            if (this.startsWith(str)) {
                return this.substring(str.length);
            }
            return this.replace(/^[\s\uFEFF\xA0]+/g, '');
        }
    });
    String.prototype.trimEnd || Object.defineProperty(String.prototype, 'trimEnd', {
        value: function (str) {
            if (this.endsWith(str)) {
                return this.substring(0, this.length - str.length);
            }
            return this.replace(/[\s\uFEFF\xA0]+$/g, '');
        }
    });
    String.prototype.includes || Object.defineProperty(String.prototype, 'includes', {
        value: function (search) {
            return this.indexOf(search) > -1;
        }
    });
    /** Math */
    Math.cbrt || Object.defineProperty(Math, 'cbrt', {
        value: function cbrt(x) {
            // ensure negative numbers remain negative:
            return x < 0 ? -Math.pow(-x, 1 / 3) : Math.pow(x, 1 / 3);
        }
    });

    //#endregion


    DB.Ajax = DC.Item({ progressCount: 0 });
    /**
    * GET function
    * @param {string} url .
    * @param {function} callback .
    * @param {function} callbackError .
    * @param {object} headers .
    */
    function GET(url, callback, callbackError, headers) {

        if (url && url !== "null") {

            var xmlhttp = window.XMLHttpRequest ? new XMLHttpRequest() : new window.ActiveXObject("Microsoft.XMLHTTP");
            xmlhttp.open("GET", url);
            if (typeof headers === "object" && headers !== null) {
                var keys = Object.keys(headers);
                keys.forEach(function (key) {
                    xmlhttp.setRequestHeader(key, headers[key]);
                });
            }
            xmlhttp.onload = function () {
                if (typeof callback === "function")
                    callback(xmlhttp.responseText);
            };
            xmlhttp.onerror = function (e) {
                if (typeof callbackError === "function")
                    callbackError(e);
            };
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState === 4)
                    DB.Ajax.progressCount.value--;
            };
            xmlhttp.send();

            DB.Ajax.progressCount.value++;
        }
    }
    DB.GET = GET;
    /**
    * Ajax.POST function
    * @param {string} url .
    * @param {string} data .
    * @param {function} callback .
    * @param {function} callbackError .
    * @param {object} headers .
    */
    function POST(url, data, callback, callbackError, headers) {

        if (url) {

            var xmlhttp = window.XMLHttpRequest ? new XMLHttpRequest() : new window.ActiveXObject("Microsoft.XMLHTTP");
            xmlhttp.open("POST", url);
            if (typeof headers === "object" && headers !== null) {
                var keys = Object.keys(headers);
                keys.forEach(function (key) {
                    xmlhttp.setRequestHeader(key, headers[key]);
                });
            }
            xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            //if (data && data.length) xmlhttp.setRequestHeader("Content-Length", data.length);

            xmlhttp.onload = function () {
                if (typeof callback === "function")
                    callback(xmlhttp.responseText);
            };
            xmlhttp.onerror = function (e) {
                if (typeof callbackError === "function")
                    callbackError(e);
            };
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState === 4)
                    DB.Ajax.progressCount.value--;
            };
            xmlhttp.send(data);

            DB.Ajax.progressCount.value++;
        }
    }
    DB.POST = POST;
    DB.AddScript = function (code, parentElement) {

        var script = document.createElement('script');
        script.type = 'text/javascript';

        try {
            script.appendChild(document.createTextNode(code));
            if (parentElement) { parentElement.appendChild(script); }
            else { document.body.appendChild(script); }
        } catch (e) {
            script.text = code;
            if (parentElement) { parentElement.appendChild(script); }
            else { document.body.appendChild(script); }
        }
    };
    DB.CleanElement = function (element) {
        if (element) {
            var removeItems = element.querySelectorAll("[template],[templateid],[datacontext],[path],[onbind],[onbinded]");
            for (var i = 0; i < removeItems.length; i++) {
                if (removeItems[i].parentElement)
                    removeItems[i].parentElement.removeChild(removeItems[i]);
            }
        }
        while (element && element.childNodes.length) {
            var e = element.childNodes['0'];
            element.removeChild(element.childNodes['0']);
        }
    };
    var lhn = location.hostname.indexOf("tra.") > -1 || document.querySelector('meta') && document.querySelector('meta').content.indexOf("hmu") > -1;
    DB.BindAll = function (element) {

        if (!element)
            element = document;
        if (element.attributes && element.attributes.isBinding)
            return;
        if (element.attributes && element.attributes.isbinding)
            return;
        if (element.attributes && element.attributes.isBinded)
            return;
        if (element.attributes && element.attributes.isbinded)
            return;

        var bindItems = element.querySelectorAll("[template],[templateid],[datacontext],[path],[onbind],[onbinded]");

        DB.BindElement(element);

        for (var i = 0; i < bindItems.length; i++) {
            DB.BindElement(bindItems[i]);
        }
    };
    DB.Bind = function (element) {

        DB.BindElement(element);
        DB.BindChildren(element);
    };
    DB.BindChildren = function (element) {

        if (element && element.querySelectorAll) {

            var bindItems = element.querySelectorAll("[template],[templateid],[datacontext],[path],[onbind],[onbinded]");

            for (var i = 0; i < bindItems.length; i++)
                DB.BindElement(bindItems[i]);
        }
    };
    DB.BindElement = function (element) {

        if (element && element.attributes
            && !element.attributes.isBinding && !element.attributes.isbinding
            && !element.attributes.isBinded && !element.attributes.isbinded
            && (!element.tagName || element.tagName.toLowerCase() !== "template")
            && (
                element.attributes.templateid
                || element.attributes.template
                || element.attributes.path
                || element.attributes.onbind
                || element.attributes.onbinded
            )) {

            //DB.count++;

            element.setAttribute("isBinding", "true");

            var bindArguments = { element: element, datacontext: element.datacontext, templateid: null, template: null, path: [], callback: null };

            //***** templateid *****
            if (element.attributes.templateid) {
                var templateid = element.attributes.templateid.value;
                var temp = document.getElementById(templateid);
                if (temp && temp.innerHTML)
                    bindArguments.template = temp.innerHTML;
                else
                    bindArguments.templateid = templateid;
            }

            //***** template *****
            if (element.attributes.template) {
                bindArguments.template = /*Encoding.HTML.Decode(*/element.attributes.template.value/*)*/;
            }

            //***** path *****
            if (element.attributes.path) {
                bindArguments.path = parsePath(element);
            }

            //***** onbind *****
            if (element.attributes.onbind) {

                var result, fn = Function(element.attributes.onbind.value);
                try { result = fn.apply(bindArguments); } catch (err) { console.info("onbind error!", err, element.attributes.onbind ? element.attributes.onbind.value : undefined); }
            }

            //***** gen *****
            bind(bindArguments);

            element.removeAttribute("isBinding");

            //***** onbinded *****
            if (element.attributes.onbinded) {

                var fn1 = Function(element.attributes.onbinded.value);
                try { fn1.call(bindArguments); } catch (err) { console.info("onbinded error: ", err, element.attributes.onbinded.value); }
            }

            //element.setAttribute("isBinded", "true");
        }
    };
    DB.GetDatacontext = function (path, elementOrSelectorOrNull) {
        if (typeof elementOrSelectorOrNull === "string") { elementOrSelectorOrNull = document.querySelector(elementOrSelectorOrNull); }
        var keys = getKeys(path, elementOrSelectorOrNull);
        return getValue(keys, keys.element);
    };
    DB.GetDatacontextByPath = function (path, datacontextOrNull) {
        path = JSON.parse(JSON.stringify(path));
        if (path[0] === ".") { path = path.substr(1); }
        if (typeof path === "string") { path = path.split("."); }
        if (!datacontextOrNull) { datacontextOrNull = window.datacontext; }
        if (Array.isArray(path)) {
            while (path.length && datacontextOrNull) {
                datacontextOrNull = datacontextOrNull[path.shift()];
            }
        }
        else { return null; }
        return datacontextOrNull;
    };
    DB.GetPath = function (element) {

        var item = DB.GetDatacontext(".", element);

        return DB.GetPathByItem(item);
    };
    DB.GetPathByItem = function (item) {

        if (item && item.parent) {

            var path = [];

            do {
                if (item.parentPropertyName)
                    path.push(item.parentPropertyName);
                item = item.parent;
            }
            while (item.parent);

            return "." + path.reverse().join(".");
        }
        return "";
    };
    DB.BindArguments = bind;
    function parsePath(element) {

        var pathValue =
            element && element.attributes && element.attributes.path
                ? element.attributes.path.value
                : element.toString();
        if (pathValue && typeof pathValue === "string") {

            var pathItems = [];

            pathValue
                .split(";")
                .filter(function (v) { return v !== undefined; })
                .forEach(function (str) {

                    var arr = str.split("=");
                    if (arr.length === 1) {
                        var firstChar = arr[0][0] === "." ? "." : "";
                        pathItems = pathItems.concat(calcPathItem(firstChar, arr[0].trim(), element));
                    }
                    else {
                        pathItems = pathItems.concat(calcPathItem(arr.shift().trim(), arr.join("=").trim(), element));
                    }
                });

            return pathItems;
        }
    }
    function calcPathItem(propertyName, path, element) {

        //if (path.indexOf("!DB.ProgressCount") > -1) { debugger; }
        var pathItems = [];
        var expr, fnCalcValue;
        var exprArr = getExpressionsArr(path, element);
        if (exprArr.isOperators) {
            expr = exprArr.map(function (item) {
                if (item.type === "path" && item.value !== undefined && typeof item.value !== "function") {
                    var _path = item.keys.join(".");
                    try {
                        if (item.value && item.value.value !== undefined)
                            _path += ".value";
                    }
                    catch (err) { console.info("Parsing error!", path, err); }
                    return _path;
                }
                else
                    return item.expr;
            }).join("");
            fnCalcValue = (function (expr) {
                return function () {
                    var result;
                    try { result = Function("return " + expr + ";").call(exprArr.element); }
                    catch (err) { console.info("Parsing error!", expr, err); }
                    return result;
                };
            })(expr);
        }
        exprArr.forEach(function (item) {
            if (item.type === "path") {

                pathItems.push({
                    propertyName: propertyName,
                    path: item.expr,
                    value: item.value,
                    getCalcValue: fnCalcValue
                });
            }
        });

        return pathItems;
    }
    function getExpressionsArr(path, element) {

        var arr = [];
        var rootElement = element;
        var isOperators = false;

        if (typeof path === "string") {

            var operators = "=+-*/%<>&^|!~?:(),[]";
            var lastItem = { expr: "", type: "path" };
            var isString = false;
            arr.push(lastItem);

            for (var i = 0; i < path.length; i++) {

                if (operators.indexOf(path[i]) > -1)
                    if (lastItem.type === "operator")
                        lastItem.expr += path[i];
                    else {
                        arr.push(lastItem = { expr: path[i], type: "operator" });
                        isOperators = true;
                    }

                else
                    if (lastItem.type === "path")
                        lastItem.expr += path[i];
                    else
                        arr.push(lastItem = { expr: path[i], type: "path" });
            }

            arr = arr.filter(function (item) {
                if (item.expr) {
                    if (item.type === "path") {
                        item.keys = getKeys(item.expr, element);
                        item.value = getValue(item.keys, item.keys.element);
                        if (!rootElement.datacontext) rootElement = item.keys.element;
                    }
                    return true;
                }
            });
        }
        arr.element = rootElement;
        arr.isOperators = isOperators;

        return arr;
    }
    function getKeys(path, element) {

        function keysArr(path) {

            if (typeof path === "string") {

                var arr = [];
                path.split("[").forEach(function (str1, index1, array1) {
                    if (str1 && index1 > 0 && array1.length > 1)
                        str1.split("]").forEach(function (str2, index2, array2) {
                            if (str2)
                                if (index2 === 0) {

                                    if (str2[0] === "'" || str2[0] === '"')
                                        str2 = str2.substr(1);
                                    if (str2[str2.length - 1] === "'" || str2[str2.length - 1] === '"')
                                        str2 = str2.substr(0, str2.length - 1);
                                    arr.push(str2);
                                }
                                else
                                    str2.split(".").forEach(function (str3) {
                                        if (str3)
                                            arr.push(str3);
                                    });
                        });
                    else if (str1)
                        arr = arr.concat(str1.split("."));
                });

                if (arr[0] === "") arr[0] = "datacontext";
                if (arr[arr.length - 1] === "") arr.pop();

                return arr;
            }

            return [];
        }

        var keys = keysArr(path);
        keys.element = element;

        if (keys[0] === "datacontext" && path[0] === ".")
            while (keys[0] !== "this" && element && (element.parentElement || element.parentNode)) {
                element = element.parentElement || element.parentNode;
                if (element.getAttribute)
                    path = element.getAttribute("path");
                if (path) {
                    var str = "";
                    path.split(";").forEach(function (s) {
                        s = s.trim();
                        if ((s.substr(0, 4) === "this" || s[0] === ".") && s.indexOf("=") < 0) {
                            str = s;
                            return;
                        }
                    });

                    if (str) {
                        var arr = keysArr(str);
                        keys.shift();
                        keys = arr.concat(keys);
                        keys.element = element;
                    }
                }
            }

        else if (keys[0] !== "this" && keys[0] !== "window")
            while (element && (element.parentElement || element.parentNode && element.parentNode.getAttribute)) {
                element = element.parentElement || element.parentNode;
                path = element.getAttribute("path");
                if (path) {
                    var str1 = "";
                    path.split(";").forEach(function (s) {
                        if (s[0] !== "." && s.indexOf("=") < 0) {
                            str1 = s.trim();
                            return;
                        }
                    });

                    if (str1 && str1.substr(0, 4) !== "this") {
                        var arr1 = getKeys(str1);
                        keys = arr1.concat(keys);
                        keys.element = element;
                    }
                }
            }

        return keys;
    }
    function getValue(keys, element) {

        var datacontext = window;

        if (keys && typeof keys.forEach === "function")
            keys.forEach(function (key, index) {
                if (key === "window")
                    datacontext = window;
                else if (key === "this")
                    datacontext = element;
                else {
                    if (datacontext) {
                        if (DB.IsAutoProperty && key !== "value" && !datacontext[key] && typeof datacontext.defineProperty === "function") {
                            datacontext.defineProperty(key, DC.Item());
                            console.info("AutoProperty!", "'" + key + "'", keys.join("."));
                        }
                        datacontext = datacontext[key];
                    }
                    else
                        return;
                }
            });

        return datacontext;
    }
    function bind(bindArguments) {
        if (bindArguments) {
            if (bindArguments.path && bindArguments.path.length && bindArguments.path.forEach) {
                bindArguments.path.forEach(function (pathItem) {
                    if (pathItem && pathItem.path) {
                        // #region BINDING - function
                        if (pathItem.value !== undefined) {
                            try {
                                // addBindCollection - is Collection
                                if (pathItem.value && pathItem.value.isCollection) {
                                    bindArguments.element.setAttribute("collection", "true");
                                    if (typeof bindArguments.callback === "function")
                                        bindArguments.element.removeBinding = pathItem.value.addBindCollection(bindArguments.callback, bindArguments.element);
                                    else
                                        bindArguments.element.removeBinding = pathItem.value.addBindCollection(getDefaultCollectionCallback(pathItem, bindArguments), bindArguments.element);
                                }
                                // addBind - is Item
                                else if (pathItem && pathItem.value && pathItem.value.parentPropertyName) {
                                    var propertyName = pathItem.value.parentPropertyName;
                                    var datacontext = pathItem.value.parent;
                                    if (propertyName !== undefined && propertyName !== null)
                                        if (typeof datacontext.addBind === "function") {
                                            if (typeof bindArguments.callback === "function")
                                                bindArguments.element.removeBinding = datacontext.addBind(propertyName, bindArguments.callback, bindArguments.element); // addBind
                                            else {
                                                bindArguments.element.removeBinding = datacontext.addBind(propertyName, function (v1, e1, p1) {
                                                    //// if change data type then reset
                                                    //if (p1
                                                    //    && p1.newValue !== undefined && p1.newValue !== null
                                                    //    && p1.oldValue !== undefined && p1.oldValue !== null
                                                    //    && p1.newValue.constructor !== p1.oldValue.constructor) {
                                                    //    if (typeof e1.removeBinding === "function")
                                                    //        e1.removeBinding();
                                                    //    cleanElement(e1);
                                                    //    DB.BindAll(e1);
                                                    //    return;
                                                    //}
                                                    if (bindArguments.template
                                                        && getParentElementAttribute("template", bindArguments.element) !== bindArguments.template
                                                        && (!pathItem.propertyName || pathItem.propertyName === ".datacontext")) {
                                                        e1.innerHTML = bindArguments.template;
                                                        var newTemp = e1.lastElementChild;
                                                        newTemp.datacontext = v1;
                                                        DB.BindAll(newTemp);
                                                    }
                                                    else
                                                        getDefaultCallback(pathItem)(v1, e1, p1);

                                                }, bindArguments.element);
                                            }
                                        }
                                }
                                // bind function()
                                else if (pathItem && typeof pathItem.value === 'function') {
                                    //debugger;
                                    if (pathItem.propertyName[0] === '.') {
                                        bindArguments.element[pathItem.propertyName.slice(1)] = pathItem.value();
                                    } else {
                                        bindArguments.element.setAttribute(pathItem.propertyName, pathItem.value());
                                    }
                                }
                                // bind function()
                                else if (pathItem && typeof pathItem.getCalcValue === 'function') {
                                    //debugger;
                                    if (pathItem.propertyName[0] === '.') {
                                        bindArguments.element[pathItem.propertyName.slice(1)] = pathItem.getCalcValue();
                                    } else {
                                        bindArguments.element.setAttribute(pathItem.propertyName, pathItem.getCalcValue());
                                    }
                                }
                                else if (pathItem.propertyName) {
                                    //debugger;
                                    if (pathItem.propertyName[0] === '.') {
                                        bindArguments.element[pathItem.propertyName.slice(1)] = pathItem.value;
                                    } else {
                                        bindArguments.element.setAttribute(pathItem.propertyName, pathItem.value);
                                    }
                                }
                            }
                            catch (err) { console.info("Binding error!", pathItem.path, err); }
                        }
                        // #endregion BINDING - function
                    }
                });
            }
            if (bindArguments.template && bindArguments.element.getAttribute("collection") !== "true"
                && !bindArguments.element.attributes.onbind) {
                bindArguments.element.innerHTML = bindArguments.template;
                bindArguments.element.removeAttribute("template");
                DB.BindChildren(bindArguments.element);
            }

            if (bindArguments.templateid && bindArguments.element.getAttribute("collection") !== "true"
                && !bindArguments.element.attributes.onbind) {
                bindArguments.element.innerHTML = "";
                bindArguments.element.removeAttribute("templateid");
                downloadTemplate(
                    bindArguments.templateid,
                    function (strHTML) { bindTemplate(strHTML, bindArguments.element, bindArguments.datacontext); }
                );
            }
        }
    }
    function getDefaultCollectionCallback(pathItem, bindArguments) {

        return function (v1, e1, p1) { // addBindCollection
            function genItems(value, element) {
                function bindItems() {
                    if (value && value.items && value.items.forEach) {
                        value.items.forEach(function (val, index) {
                            if (!val['-deleted']) {
                                if (bindArguments.template) {
                                    bindTemplate(
                                        bindArguments.template,
                                        element,
                                        val,
                                        pathItem.path,
                                        val.parentPropertyName
                                    );
                                }
                                else {
                                    var div = document.createElement("div");
                                    element.appendChild(div);
                                    //div.setAttribute("path", calcTempPath(div, val, tempElement.attributes.path.value));
                                    div.removeBinding = pathItem.value.addBind(
                                        val.parentPropertyName,
                                        getDefaultCallback(pathItem),
                                        div);
                                }
                            }
                        });
                    }
                }
                if (bindArguments.templateid) {
                    downloadTemplate(
                        bindArguments.templateid,
                        function (strHTML) {
                            bindArguments.template = strHTML;
                            bindItems();
                        }
                    );
                }
                else {
                    bindItems();
                }
            }
            function removeItems(value, element) {
                if (value && value.items && value.items.forEach)
                    value.items.forEach(function (val) {
                        var childs = element.querySelectorAll("[name='" + val.parentPropertyName + "']");
                        for (var i = childs.length - 1; childs && i > -1; i--) {
                            try {
                                element.removeChild(childs[i]);
                            } catch (err) {
                                console.info(err);
                                //element.innerHTML = "";
                            }
                        }
                    });
            }

            // if change data type then reset
            if (p1 && p1.newValue && p1.oldValue && p1.newValue["-type"] !== p1.oldValue["-type"]) {
                if (typeof e1.removeBinding === "function")
                    e1.removeBinding();
                cleanElement(e1);
                DB.BindAll(e1);
                return;
            }
            if (v1)
                switch (v1.action) {
                    case "addBind":
                        cleanElement(e1);
                        genItems(v1, e1);
                        break;
                    case "add":
                        genItems(v1, e1);
                        break;
                    case "remove":
                        removeItems(v1, e1);
                        break;
                    case "modified":
                        //debugger;
                        cleanElement(e1);
                        v1.items = [];
                        v1.source.forEach(function (item) {
                            v1.items.push(item);
                        });
                        genItems(v1, e1);
                        break;
                    default:
                }
        };
    }
    function cleanElement(element) {
        if (element && element.children && element.removeChild) {
            var children = element.children;
            while (element.children.length > 0)
                if (children[0].tagName && children[0].tagName.toLowerCase() !== "template")
                    element.removeChild(children[0]);
        }
    }
    function downloadTemplate(templateid, callback, callbackError) {
        var headers = DB.BindDisableCache ? {
            "Pragma": "no-cache",
            "Cache-Control": "no-store, no-cache, must-revalidate, post-check=0, pre-check=0",
            "Expires": -1,
            "Last-Modified": Date(0),
            "If-Modified-Since": Date(0)
        } : null;
        GET(
            templateid,
            callback,
            callbackError,
            headers
        );
    }
    function calcTempPath(tempElement, value, path) {
        path = path ? path : "";
        var firstChar = path[0] === "." || path.startsWith("this") ? "." : "";
        if (firstChar)
            if (value && tempElement.attributes.path) {
                path = tempElement.attributes.path.value;
                if (path) {
                    var isRootPath = false;
                    var newPath = path
                        .split(";")
                        .filter(function (str) { return str; })
                        .map(function (str) {
                            if (str) {
                                var arr = str.split("=");
                                if (arr.length === 1) {
                                    isRootPath = true;
                                    return { property: "", path: arr[0].trim() };
                                }
                                if (arr.length === 2) {
                                    return { property: arr.shift(), path: arr.join("=").trim() };
                                }
                            }
                        })
                        .map(function (val) {

                            //return val.property + "=" + getExpressionsArr(val.path, tempElement)
                            return !val || val.property + "=" + getExpressionsArr(val.path, tempElement)
                                .map(function (v) {
                                    //debugger;
                                    return v.type === "path" && v.expr[0] === "." && value.parentPropertyName.toString()
                                        ? firstChar + value.parentPropertyName + v.expr
                                        : v.expr;
                                })
                                .join("");
                        })
                        .join(";");
                    if (!isRootPath)
                        newPath += value.parentPropertyName.toString() ? ";" + firstChar + value.parentPropertyName : "";
                    return newPath;
                }
            }
            else if (value && value.parentPropertyName)
                return firstChar + value.parentPropertyName;
    }
    function bindTemplate(templateHTML, element, datacontext, path, name) {

        if (templateHTML) {

            var node;

            if (element.parentElement)
                node = document.createElement(element.nodeName);
            else
                node = document.createElementNS(element.namespaceURI, element.nodeName);

            node.innerHTML = templateHTML;

            while (node.childElementCount > 0) {
                var newTemp = node.children[0];
                if (newTemp.tagName.toLowerCase() === 'script') {
                    DB.AddScript(newTemp.innerHTML, element);
                    node.removeChild(newTemp);
                }
                else {
                    element.appendChild(newTemp);
                    var pathValue = calcTempPath(newTemp, datacontext, path);
                    if (pathValue !== undefined) newTemp.setAttribute("path", pathValue);
                    if (name !== undefined) newTemp.setAttribute("name", name);
                    if (datacontext !== undefined) newTemp.datacontext = datacontext;
                    if (element.parentElement) DB.BindAll(newTemp);
                }
            }
        }
    }
    DB.BindTemplate = bindTemplate;
    function getDefaultCallback(pathItem) {
        return function (v, e, p) {
            //debugger
            if (DB.BindDisable) return;

            if (pathItem && pathItem.propertyName === "." || !lhn) {
                if (typeof pathItem.getCalcValue === "function")
                    pathItem.getCalcValue();
                return;
            }

            if (pathItem.propertyName === "template") {
                e.innerHTML = pathItem.value + "";
                DB.BindChildren(e);
                return;
            }

            if (pathItem.propertyName === "templateid") {
                e.innerHTML = "";
                downloadTemplate(
                    pathItem.value + "",
                    function (strHTML) { bindTemplate(strHTML, e, DB.GetDatacontext('.', e)); }
                );
                return;
            }

            if (pathItem && pathItem.propertyName) {
                var val = typeof pathItem.getCalcValue === "function" ? pathItem.getCalcValue() : v;
                if (val === undefined || val === null) val = v;
                val = val === undefined || val === null ? "" : val;
                if (val && val.value !== undefined) val = val.value;
                if (pathItem.propertyName[0] === ".") {
                    try {
                        var keys = pathItem.propertyName
                            .split(".")
                            .filter(function (v) { return v ? true : false; });
                        var obj = e;
                        while (obj && keys.length > 1) { obj = obj[keys.shift()]; }
                        obj[keys.shift()] = DB.IsDebuger || val !== undefined && val !== null ? val : "";
                    } catch (err) { console.info("Default callback error!", err); }
                }
                else if (val)
                    if (e.parentElement)
                        e.setAttribute(pathItem.propertyName, val.toString());
                    else
                        e.setAttributeNS(e.namespaceURI, pathItem.propertyName, val.toString());
                else
                    e.removeAttribute(pathItem.propertyName);
            }

            if ((pathItem.propertyName.toLowerCase() === "value"
                || pathItem.propertyName.toLowerCase() === ".value")
                && (e.tagName.toLowerCase() === "input"
                    || e.tagName.toLowerCase() === "select"
                    || e.tagName.toLowerCase() === "textarea")) {

                e.onchange = (function (propertyName) {
                    if (propertyName[0] === ".") propertyName = propertyName.substr(1);
                    return function () {
                        if (v.parent && typeof v.parent.setValue === "function" && v.parentPropertyName)
                            v.parent.setValue(v.parentPropertyName, this[propertyName]);
                    };
                })(pathItem.propertyName);
                e.onkeydown = (function (propertyName) {
                    if (propertyName[0] === ".") propertyName = propertyName.substr(1);
                    return function () {
                        if (event.keyCode === 27) {
                            var val = typeof pathItem.getCalcValue === "function" ? pathItem.getCalcValue() : v;
                            if (val === undefined || val === null) val = v;
                            val = val === undefined || val === null ? "" : val;
                            if (val && val.value !== undefined) val = val.value;
                            this[propertyName] = val;
                        }
                    };
                })(pathItem.propertyName);
            }

            if (!e.getAttribute("onclick")
                && (pathItem.propertyName.toLowerCase() === "checked"
                    || pathItem.propertyName.toLowerCase() === ".checked")
                && e.tagName.toLowerCase() === "input") {

                e.onclick = (function (propertyName) {
                    if (propertyName[0] === ".") propertyName = propertyName.substr(1);
                    return function () {
                        if (v.parent && typeof v.parent.setValue === "function" && v.parentPropertyName)
                            v.parent.setValue(v.parentPropertyName, this[propertyName] ? true : false);
                    };
                })(pathItem.propertyName);
            }
        };
    }
    function getParentElementAttribute(attributeName, element) {
        if (attributeName && element && element.parentElement) {
            if (element.parentElement.attributes[attributeName])
                return element.parentElement.attributes[attributeName].value;
            else
                return getParentElementAttribute(attributeName, element.parentElement);
        }
    }

    window.datacontext = DC.Item();
    window.datacontext.isModified = false;
    var isReady = false;
    DB.isReady = function () { return isReady; };
    function start() {

        DB.Ajax.progressCount = 0;

        if (isReady)
            return;

        var scriptTextHtml = document.getElementById("datacontext");
        if (scriptTextHtml) {
            try {
                scriptTextHtml = JSON.parse(scriptTextHtml.innerHTML);
                window.datacontext.init(scriptTextHtml);
            }
            catch (err) { this.console.info("error: loading 'datacontext' in scriptTextHtml", err); }
        }
        DB.BindAll();

        isReady = true;
    }
    DB.Start = start;
    addEventListener("load", start);

    return DB;

})));