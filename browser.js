
/** Copyright (c) 2024, Manuel Lõhmus (MIT License). */

"use strict";

(function () {

    exportModule("data-context-binding", ["data-context"], function factory(DC) {

        var { createDataContext, parse, stringify } = DC;


        //TODO [ x ] default bind ...
        //TODO [ x ] template binding
        //TODO [ x ] Event > : 'new', 'set', 'reposition', 'delete', '-change', 'bind', 'unbind'
        //TODO [ x ] DOM Attribute: 'path', 'bind', 'unbinded'

        var DataContextBinding = Object.defineProperties(bindDataContext, {

            bind: { value: false, writable: true, configurable: false, enumerable: false },

            bindAllElements: { value: bindAllElements, writable: false, configurable: false, enumerable: false },
            bindElement: { value: bindElement, writable: false, configurable: false, enumerable: false },
            bindingContext: { value: bindingContext, writable: false, configurable: false, enumerable: false },
            change: { value: changeBind, writable: false, configurable: false, enumerable: false },

            innerHTML: { value: innerHTMLBind, writable: true, configurable: false, enumerable: false },
            value: { value: valueBind, writable: true, configurable: false, enumerable: false },
            check: { value: checkBind, writable: true, configurable: false, enumerable: false },
            hidden: { value: hiddenBind, writable: true, configurable: false, enumerable: false },
            enabled: { value: enabledBind, writable: true, configurable: false, enumerable: false },
            disabled: { value: disabledBind, writable: true, configurable: false, enumerable: false },

            input: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_checkbox: { value: checkBind, writable: true, configurable: false, enumerable: false },
            input_color: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_date: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_datetime_local: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_email: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_file: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_hidden: { value: hiddenBind, writable: true, configurable: false, enumerable: false },
            input_month: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_number: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_password: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_radio: { value: checkBind, writable: true, configurable: false, enumerable: false },
            input_range: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_search: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_tel: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_text: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_time: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_url: { value: valueBind, writable: true, configurable: false, enumerable: false },
            input_week: { value: valueBind, writable: true, configurable: false, enumerable: false },
            select: { value: valueBind, writable: true, configurable: false, enumerable: false },
            textarea: { value: valueBind, writable: true, configurable: false, enumerable: false }
        });

        waitForReadyState("complete", bindDataContext);

        return DataContextBinding;

        /**
         * Get-Set DOM html root data context
         * @param {any} value
         * @returns
         */
        function bindDataContext(value) {

            var htmlElement = document.querySelector("html");

            if (htmlElement) {

                if (value !== undefined) {

                    htmlElement.datacontext = value._isDataContext ? value : createDataContext(value);
                    waitForReadyState("complete", bindAllElements.bind(this, htmlElement, true));
                }

                if (!htmlElement.datacontext) {

                    value = document.querySelector("script#data")?.innerText;

                    htmlElement.datacontext = createDataContext(value && parse(value) || {});
                    waitForReadyState("complete", bindAllElements.bind(this, htmlElement));
                }
            }

            return htmlElement?.datacontext;
        }

        function waitForReadyState(state, cb) {

            if (document.readyState == state)
                setTimeout(cb, 50);
            else
                setTimeout(waitForReadyState, 0, state, cb);
        }

        function bindAllElements(rootElement, rebinding = false) {

            if (!rootElement) { rootElement = document.querySelector("html"); }

            bindElement(rootElement, rebinding);

            rootElement.querySelectorAll("[bind]:not(template>*),[onbind]:not(template>*),[onunbind]:not(template>*),[template]:not(template>*),[templates]:not(template>*),[rebinding]:not(template>*)")
                .forEach(function (element) {

                    if (!element.contextValue || rebinding) {

                        Promise.resolve(1).then((function (element, rebinding) {

                            bindElement(element, rebinding);
                        })(element, rebinding));
                    }
                });
        }

        function rebindAllElements(rootElement) {

            if (!rootElement) { rootElement = document.body; }

            bindElement(rootElement);

            rootElement.querySelectorAll("[rebinding]")
                .forEach(function (element) { bindElement(element); });
            // TODO [   ] test
            document.head.querySelectorAll("[rebinding]")
                .forEach(function (element) { bindElement(element); });
        }

        function bindElement(element, rebinding = false) {

            if (!element instanceof HTMLTemplateElement || !element?.isConnected || (
                !element?.attributes?.template &&
                !element?.attributes?.templates &&
                !element?.attributes?.onbind &&
                !element?.attributes?.onunbind &&
                !element?.attributes?.bind &&
                !element?.attributes?.rebinding
            )) {

                return;
            }

            if (element.attributes?.rebinding) {

                element.removeAttribute("rebinding");
                rebinding = true;
            }

            if (element.contextValue && !rebinding) { return; }

            if (element.bindingContext?.isActive) { element.bindingContext.isActive(false); } // for rebinding

            var _bindingContext = bindingContext(element, rebinding);

            if (!rebinding && element.attributes.template) {

                _template(element.attributes.template.value);

                return;
            }

            if (!rebinding && element.attributes.templates) {

                _template(element.attributes.templates.value, true);

                return;
            }

            _tryBind();

            return;


            function _template(selectors, isMultiple = false) {

                if (!selectors) { _tryBind(); return; }

                //remove element children
                var i = 0;
                while (i < element.childElementCount) {

                    if (!(element.children[i] instanceof HTMLTemplateElement
                        || element.children[i] instanceof HTMLHtmlElement
                        || element.children[i] instanceof HTMLBodyElement)
                        && element.children[i].isTemplate) {

                        element.children[i].remove();
                    }
                    else { i++; }
                }

                var templateElement = null;

                try { templateElement = element.querySelector(selectors) || document.querySelector(selectors); }
                catch {

                    fetch(selectors).then(function (res) {

                        res.text().then(function (strHTML) {

                            templateElement = document.createElement("template");
                            templateElement.innerHTML = strHTML;
                            bindTemplate();
                        });
                    });
                }

                if (!templateElement) { return; }

                bindTemplate();

                return;

                function bindTemplate() {

                    if (isMultiple) {

                        let keys = Object.keys(_bindingContext.value);//.sort();

                        for (var i = 0; i < keys.length; i++) {

                            if (!appendTemplate(keys[i])) { break; }
                        }

                        if (i !== 0) {

                            setTimeout(function () {

                                if (_bindingContext.source && typeof _bindingContext.source.on === "function") {

                                    _bindingContext.source.on(
                                        "-",
                                        function addTemplate(event) {

                                            if (event.eventName === "new") {

                                                return appendTemplate(event.propertyPath.at(-1), event.target);
                                            }

                                            return true;
                                        },
                                        element
                                    );

                                    _bindingContext.source.on(
                                        "-",
                                        function removeTemplate(event) {

                                            if (event.eventName === "delete") {

                                                element.querySelectorAll(`:scope > [path="${event.propertyPath.at(-1)}"]`).forEach(function (e) {

                                                    e.remove();
                                                });
                                            }

                                            return true;
                                        },
                                        element
                                    );
                                }
                            });

                            return;
                        }
                    }
                    else {

                        return appendTemplate();
                    }

                    return;

                    function appendTemplate(key, target) {

                        var ret = false;

                        for (var i = 0; i < templateElement.content.childElementCount; i++) {

                            ret = true;
                            var child = templateElement.content.children[i].cloneNode(true);
                            child.isTemplate = true;

                            if (target && typeof target === "object" && !Array.isArray(target)) {

                                var keys = Object.keys(target);//.sort();
                                var index = keys.indexOf(key);

                                if (index < 0 || index === keys.length - 1) {

                                    element.append(child);
                                }
                                else {

                                    var referenceKey = keys[index + 1];

                                    for (const referenceChild of element.children) {

                                        if (referenceChild.attributes.path?.value.startsWith(referenceKey)) {

                                            element.insertBefore(child, referenceChild);
                                            break;
                                        }
                                    }
                                }
                            }
                            else {

                                element.append(child);
                            }

                            if (key) {

                                if (child.attributes.path?.value) {

                                    child.setAttribute("path", key + "." + child.attributes.path.value);
                                }
                                else {

                                    child.setAttribute("path", key);
                                }
                            }

                            bindAllElements(child);
                        }

                        return ret;
                    }
                }
            }

            function _tryBind() {

                if (element.attributes.bind) {

                    try {

                        var fnName = element.attributes.bind.value;

                        if (!fnName) {

                            fnName = element.tagName.toLowerCase();

                            if (element.attributes.type) { fnName += "_" + element.attributes.type.value.replace(/-/g, "_"); }
                        }

                        _bind(DataContextBinding[fnName] || DataContextBinding.innerHTML);

                    } catch (err) { return _error("[ bind ] ", err); }
                }

                if (element.attributes.onbind && DataContextBinding.bind) {

                    try {

                        _bind(DataContextBinding.bind("event", element.attributes.onbind.value));

                    } catch (err) { return _error("[ onbind ] ", err); }
                }

                return;

                function _bind(fnBind) {

                    if (_bindingContext.source === undefined) {

                        var event = { eventName: "unbind", target: undefined, propertyPath: [_bindingContext.property], oldValue: undefined, newValue: undefined };

                        element.setAttribute("unbinded", "");

                        fnBind.call(element, event);

                        if (element.attributes.onunbind && DataContextBinding.bind) {

                            try {

                                (DataContextBinding.bind("event", element.attributes.onunbind.value)).call(element, event);

                            } catch (err) { return _error("[ onunbind ] ", err); }
                        }
                    }
                    else if (fnBind.call(element, { eventName: "bind", target: _bindingContext.source, propertyPath: [_bindingContext.property], oldValue: _bindingContext.value, newValue: _bindingContext.value })) {

                        if (_bindingContext.source && typeof _bindingContext.source.on === "function") {

                            element.removeAttribute("unbinded");

                            _bindingContext.source.on(
                                _bindingContext.property,
                                function (event) { return fnBind.call(element, event); },
                                element
                            );
                        }
                    }
                }
            }

            function _error(...args) {

                console.log(args, element);
            }
        }

        /** Get-Set binding context */
        function bindingContext(elem, rebinding) {

            if (!elem instanceof Node) {

                _error("[ bind context ] ", new Error("Invalid HTML element."));

                return null;
            }

            var d = {
                rootElement: elem,
                rootSource: null,
                source: null,
                property: null,
                arrPath: []
            };

            _findPathAndSource();
            _selectSource();

            var _bindingContext = Object.create(null, {

                element: { value: d.rootElement, writable: false, configurable: false, enumerable: false },

                source: { value: d.source, writable: false, configurable: false, enumerable: false },
                //source: {
                //    configurable: false, enumerable: false,

                //    get: function () {

                //        return d.arrPath.reduce(function (s, k) { return s[k]; }, d.rootSource);
                //    }
                //},

                property: { value: d.property || "-change", writable: false, configurable: false, enumerable: false },

                path: { value: d.arrPath.reverse(), writable: false, configurable: false, enumerable: false },

                value: {
                    configurable: false, enumerable: false,

                    get: function () {

                        var s = this.source;

                        if (s && s[d.property] !== undefined) { return s[this.property]; }
                        //root
                        if (s && s._parent === null) { return s; }

                        return;
                    },
                    set: function (val) {

                        var s = this.source;

                        s && d.property !== undefined && (s[d.property] = val);
                    }
                },

                contextValue: { value: _contextValue, writable: false, configurable: false, enumerable: false },

                isActive: { value: _isActive, writable: false, configurable: false, enumerable: false },

                remove: { value: _remove, writable: false, configurable: false, enumerable: false },
            });

            elem.contextValue = _bindingContext.contextValue;
            elem.bindingContext = _bindingContext;

            return _bindingContext;

            function _findPathAndSource() {

                do {
                    if (d.rootElement?.attributes?.path?.value) {

                        d.arrPath = d.arrPath.concat(
                            d.rootElement.attributes.path.value
                                .split(/[.\[\]]/)
                                .filter(function (s) { return s; })
                                .reverse()
                        );
                    }

                    if (d.rootElement.datacontext !== undefined) {

                        d.source = d.rootElement.datacontext;
                    }

                } while (!d.source && d.rootElement.parentElement && (d.rootElement = d.rootElement.parentElement))

                d.rootSource = d.source || (d.source = {});

                if (d.rootSource?._events && (
                    !d.rootSource._events["-"] ||
                    !d.rootSource._events["-"].find(function (fn) { return fn.name.includes("_bindHandler"); })
                )) {

                    d.rootSource.on("-", bindHandler.bind(d.rootElement), d.rootElement);
                }
            }

            function _selectSource() {

                d.property = d.arrPath.shift();

                var arrPath = Object.values(d.arrPath);

                d.source = d.source?._isDataContext ? d.source : createDataContext(d.source || {});

                if (!d.rootElement.datacontext) { d.rootElement.datacontext = d.source; }

                while (arrPath.length && d.source) {

                    d.source = _nextSource(d, arrPath.pop(), {});
                }

                _nextSource(d, d.property, "");
            }

            function _nextSource(d, property, defValue) {

                if (rebinding) { defValue = undefined; }

                if (property === undefined) { return d.source; }

                if (_isNumber(property) && d.source[property] === undefined && !rebinding) {

                    if (getType(d.source) !== "array") {

                        if (d.rootSource === d.source) {

                            d.rootSource = d.source = _sourceToArray(d.source);
                        }
                        else {

                            d.source = _sourceToArray(d.source);
                        }
                    }

                    if (d.source[property] === undefined && !rebinding) {

                        d.source.push(createDataContext({}));
                    }

                    if (d.source[property] === undefined
                        && getType(d.source[property]) !== getType(defValue)
                        && defValue !== undefined) {

                        d.source[property] = createDataContext(defValue);
                    }

                    return d.source[property];
                }

                if (!d.source || !d.source._isDataContext) { return; }

                if (d.source[property]?._isDataContext) { return d.source[property]; }

                if (d.source[property] !== undefined) {

                    d.source[property] = createDataContext(d.source[property]);

                    return d.source[property];
                }

                if (!rebinding) {

                    d.source[property] = createDataContext(defValue);
                }

                return d.source[property];

                function _isNumber(str) { return !isNaN(str); }

                function _sourceToArray(source) {

                    var arr = createDataContext([]);
                    var parent = source?._parent;
                    var property = source?._propertyName;

                    if (parent instanceof Object && property !== undefined) {

                        parent[property] = arr;
                    }
                    else if (d.rootElement?.datacontext) {

                        d.rootElement.datacontext = arr;
                    }

                    if (source) {

                        Object.keys(source).forEach(function (k) {

                            arr[k] = source[k];

                            if (source?._events && source._events[k])
                                arr._events[k] = source._events[k];
                        });
                    }

                    return arr;
                }
            }

            /**
             * Set-Get data-context value.
             * @param {any} value
             * @returns {any}
             */
            function _contextValue(value) {

                if (value !== undefined) {

                    _bindingContext.value = value;

                    return value;
                }

                return _bindingContext.value;
            }

            /**
             * Set-Get isActive value.
             * @param {boolean} activate Default: true
             * @returns {boolean}
             */
            function _isActive(activate = true) {

                if (!activate) {

                    if (_bindingContext.source?._events) {

                        Object.entries(_bindingContext.source._events)
                            .forEach(function ([k, arr]) {

                                var index = 0;

                                while (index < arr.length) {

                                    if (arr[index].isActive === elem && !arr[index].name.includes("Template")) {

                                        arr.splice(index, 1);
                                    }
                                    else { index++; }
                                }
                            });
                    }

                    delete elem.contextValue;
                    delete elem.bindingContext;
                }

                return elem.bindingContext === _bindingContext;
            }

            function _remove() {

                if (Array.isArray(_bindingContext.source)) {

                    var index = _bindingContext.source.indexOf(_bindingContext.value);

                    if (index > -1) {

                        _bindingContext.source.splice(index, 1);
                    }
                }
                else {

                    delete _bindingContext.source[_bindingContext.property]
                }
            }

            function _error(...args) {

                console.log(args, d.rootElement);
            }
        }

        function bindHandler(event) {

            if (event.eventName === "delete") {

                //debugger;
                rebinding(event.oldValue);

                return true;
            }

            if (!event.newValue?._events) { return true; }

            if (event.eventName === "set") {

                //debugger;
                event.newValue._events = event.oldValue._events || {};
                event.oldValue._events = {};

                emitProperties(event.newValue, event.oldValue, event.eventName);
            }

            else if (event.eventName === "reposition") {

                //debugger;
                rebinding(event.newValue);
                rebinding(event.oldValue);
            }

            //else if (event.eventName === "new") { debugger; }


            return true;

            function emitProperties(newValue, oldValue, eventName) {

                if (newValue?.emit) {

                    Object.keys(newValue).forEach(function (k) {

                        newValue.emit(k, { eventName, target: newValue, propertyPath: [k], oldValue: oldValue[k], newValue: newValue[k] });
                        emitProperties(newValue[k], oldValue[k], eventName);
                    });
                }
            }

            function rebinding(val) {

                if (val?._events) {

                    Object.keys(val._events).forEach(function (k) {

                        val._events[k].forEach(function (l) {

                            if (l.isActive instanceof Node) {

                                l.isActive.setAttribute("rebinding", "");
                                l.isActive = false;
                            }
                        });
                    });
                    val._events = {};
                }

                clearTimeout(rebindAllElements.timeout);
                rebindAllElements.timeout = setTimeout(function () {
                    //console.log("RebindingAll");
                    rebindAllElements();
                });
            }
        }

        function getType(v) { return v === null ? "null" : Array.isArray(v) ? "array" : typeof v; }

        //#region *** Default bind ***

        function innerHTMLBind(event) {

            if (event.eventName === "unbind") {

                this.innerHTML = '';
                // I am dead!
                return false;
            }

            this.innerHTML = event.newValue;

            // I am alive!
            return event.newValue === undefined ? false : true;
        }
        function valueBind(event) {

            if (event.eventName === "unbind") {

                this.onchange = null;
                this.onkeydown = null;

                this.value = '';

                // I am dead!
                return false;
            }

            this.value = event.newValue;

            // Init
            if (event.eventName === "bind") {

                this.onchange = function () { this.contextValue(this.value); };
                this.onkeydown = function (ev) { if (ev.keyCode === 27) { this.value = his.contextValue(); } };
            }

            // I am alive!
            return true;
        }
        function checkBind(event) {

            if (event.eventName === "unbind") {

                this.onchange = null;

                // I am dead!
                return false;
            }

            this.checked = event.newValue;
            event.newValue ? this.setAttribute("checked", "") : this.removeAttribute("checked");

            // Init
            if (event.eventName === "bind") {

                this.onchange = function () { this.contextValue(this.checked); };
            }

            // I am alive!
            return event.newValue === undefined ? false : true;
        }
        function hiddenBind(event) {

            if (event.eventName === "unbind") {

                // I am dead!
                return false;
            }

            event.newValue ? this.setAttribute("hidden", "") : this.removeAttribute("hidden");

            // I am alive!
            return event.newValue === undefined ? false : true;
        }
        function changeBind(event) {

            if (event.eventName === "unbind") {

                // I am dead!
                return false;
            }

            // Initial setup
            if (event.eventName === "bind") {
                // Set listener
                this.contextValue().on('-change', function () {
                    // Let's wait a bit and let the operations finish.
                    setTimeout(function (_this) {
                        // Get context data
                        var dc = _this.contextValue();
                        // Read the changes
                        var str = dc.stringifyChanges(null, 2);
                        // Put the value on the screen
                        _this.value = str;
                    }, 50, this);

                    //TODO [ x ] I am dead!
                    return this.bindingContext?.isActive();
                },
                    // Set DOM element. 
                    // I am monitoring the attribute 'isConnected'.
                    // If it's true, it's alive.
                    this
                );

                this.onchange = function () {
                    // Let's take the context of the data.
                    this.contextValue()
                        // We will overvalue the modified JSON string data.
                        .overwritingData(this.value);
                };
            }

            // I am alive!
            return true;
        }
        function enabledBind(event) {

            if (event.eventName === "unbind") {

                this.setAttribute('disabled', 'disabled');

                // I am dead!
                return false;
            }

            if (event.newValue) { this.removeAttribute('disabled'); }
            else { this.setAttribute('disabled', 'disabled'); }

            // I am alive!
            return true;
        }
        function disabledBind(event) {

            if (event.eventName === "unbind") {

                this.setAttribute('disabled', 'disabled');

                // I am dead!
                return false;
            }

            if (event.newValue) { this.setAttribute('disabled', 'disabled'); }
            else { this.removeAttribute('disabled'); }

            // I am alive!
            return true;
        };


        //#endregion
    });


    /**
     * Exporting the library as a module.
     * @param {string} exportIdentifier Export identifier
     * @param {string[]} importIdentifierArray Import identifier array
     * @param {any} factory Factory function
     * @returns {void}
     */
    function exportModule(exportIdentifier, importIdentifierArray, factory) {

        var thisScope = "undefined" != typeof globalThis
            ? globalThis
            : "undefined" != typeof window
                ? window
                : "undefined" != typeof global
                    ? global : "undefined" != typeof self
                        ? self
                        : {};

        if (!thisScope.modules) { thisScope.modules = {}; }

        // Browser
        waitModules();


        function waitModules() {

            if (importIdentifierArray.length) {

                for (let i = 0; i < importIdentifierArray.length; i++) {

                    if (!thisScope.modules[importIdentifierArray[i]]) { return setTimeout(waitModules, 10); }
                }
            }

            thisScope.modules[exportIdentifier] = factory.call(thisScope, ...importIdentifierArray.map(function (id) { return thisScope.modules[id]; }));
        }
    }
})();