/** Copyright (c) Manuel Lõhmus (MIT License). */

"use strict";

(function () {

    exportModule('data-context-binding', ['data-context'], function factory(DC) {

        var globalScope = this,
            { createDataContext, parse, stringify } = DC,
            isDebug = document && Array.from(document.scripts).find(function (s) { return s.src.includes('data-context-binding'); })?.attributes.debug || false;


        //TODO [ x ] default bind ...
        //TODO [ x ] template binding
        //TODO [ x ] Event > : 'new', 'set', 'reposition', 'delete', '-change', 'bind', 'unbind'
        //TODO [ x ] DOM Attribute: 'path', 'bind', 'unbinded', 'template', 'templates', 'rebinding', 'onbind', 'link'
        //TODO [ x ] rootDataContext: '#' > document.documentElement.datacontext // bind to root data context

        var DataContextBinding = Object.defineProperties(bindDataContext, {

            bind: { value: false, writable: true, configurable: false, enumerable: false },

            bindAllElements: { value: bindAllElements, writable: false, configurable: false, enumerable: false },
            bindElement: { value: bindElement, writable: false, configurable: false, enumerable: false },
            bindingContext: { value: bindingContext, writable: false, configurable: false, enumerable: false },

            progess: { value: progessBind, writable: false, configurable: false, enumerable: false },
            context: { value: contextBind, writable: false, configurable: false, enumerable: false },
            change: { value: changeBind, writable: false, configurable: false, enumerable: false },
            innerHTML: { value: innerHTMLBind, writable: true, configurable: false, enumerable: false },
            value: { value: valueBind, writable: true, configurable: false, enumerable: false },
            getvalue: { value: getValueBind, writable: true, configurable: false, enumerable: false },
            setvalue: { value: setValueBind, writable: true, configurable: false, enumerable: false },
            check: { value: checkBind, writable: true, configurable: false, enumerable: false },
            visible: { value: visibleBind, writable: true, configurable: false, enumerable: false },
            hidden: { value: hiddenBind, writable: true, configurable: false, enumerable: false },
            enabled: { value: enabledBind, writable: true, configurable: false, enumerable: false },
            disabled: { value: disabledBind, writable: true, configurable: false, enumerable: false },
            class: { value: classToggleBind, writable: true, configurable: false, enumerable: false },
            attribute: { value: attributeBind, writable: true, configurable: false, enumerable: false },

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

            var htmlElement = document.documentElement;

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

            globalScope.datacontext = htmlElement?.datacontext;

            return htmlElement?.datacontext;
        }

        function waitForReadyState(state, cb) {

            if (document.readyState == state)
                setTimeout(cb, 50);
            else
                setTimeout(waitForReadyState, 0, state, cb);
        }

        function bindAllElements(rootElement, rebinding = false, isChildrenOnly = false) {

            if (!rootElement) { rootElement = document.documentElement; }

            if (!isChildrenOnly) { bindElement(rootElement, rebinding); }

            rootElement
                .querySelectorAll(`[bind],[onbind],[template],[templates],[rebinding],[link],[unbinded]`)
                .forEach(bind);

            if (rootElement !== document.documentElement) {

                document
                    .documentElement.querySelectorAll(`[unbinded]`)
                    .forEach(bind);
            }


            function bind(element) {

                if (isParentTemplateOrLink(element)) { return; }

                if (!element.contextValue || rebinding || element.attributes.unbinded) {

                    Promise.resolve(1).then((function (element, rebinding) {

                        bindElement(element, rebinding);
                    })(element, Boolean(rebinding || element.attributes.unbinded)));
                }
            }
            function isParentTemplateOrLink(element) {

                var parent = element.parentElement;

                while (parent && parent !== rootElement) {

                    if (parent.attributes.template || parent.attributes.link) { return true; }

                    parent = parent.parentElement;
                }
                return false;
            }
        }

        function bindElement(element, rebinding = false) {

            if (!element instanceof HTMLTemplateElement || !element?.isConnected || (
                !element?.attributes?.template &&
                !element?.attributes?.templates &&
                !element?.attributes?.onbind &&
                !element?.attributes?.bind &&
                !element?.attributes?.rebinding &&
                !element?.attributes?.link
            )) {

                return;
            }

            if (element.attributes?.rebinding) {

                element.removeAttribute("rebinding");
                rebinding = true;
            }

            if (element.contextValue && !rebinding) { return; }

            if (element.bindingContext?.isActive) { element.bindingContext.isActive(false); } // for rebinding

            if (element.attributes.link) {

                _link(element.attributes.link.value);

                return;
            }

            var _bindingContext = bindingContext(element, rebinding);

            if (element.attributes.template) {

                _template(element.attributes.template.value);

                return;
            }

            if (element.attributes.templates) {

                _template(element.attributes.templates.value, true);

                return;
            }

            _tryBind();

            return;


            function _link(path) {

                if (element.linked) {

                    if (rebinding) { bindAllElements(element, true, true); }

                    return;
                }

                var { CreateLink } = globalScope?.modules?.['ws-user'];

                if (CreateLink) {

                    element.linked = true;
                    element.wsLink = CreateLink(path, element);
                }
            }

            function _template(selectors, isMultiple = false) {

                if (!selectors) { _tryBind(); return; }

                var templateElement = null;

                try { templateElement = element.querySelector(selectors) || document.querySelector(selectors); }
                catch { templateElement = null; }

                if (!templateElement && element.attributes.template_fetching) { return; }

                element.removeAttribute('template_fetching');

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


                if (!templateElement) { return fetchContent(); }

                bindTemplate();

                return;

                function fetchContent() {

                    element.setAttribute('template_fetching', '');

                    fetch(selectors).then(function (res) {

                        res.text().then(function (textContent) {

                            templateElement = document.createElement("template");
                            selectors.endsWith('.html')
                                ? templateElement.innerHTML = textContent
                                : templateElement.innerHTML = '<div>' + encodeHTML(textContent) + '</div>';
                            bindTemplate();

                            element.removeAttribute('template_fetching');
                        });
                    });

                    function encodeHTML(str) {

                        return str.replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#39;')
                            .replace(/ /g, "&nbsp;")
                            .replace(/\r\n/g, '<br>') // Windows-style newlines
                            .replace(/\r/g, '<br>')   // Old Mac-style newlines
                            .replace(/\n/g, '<br>');  // Unix-style newlines
                    }
                }

                function bindTemplate() {

                    if (isMultiple) {

                        if (typeof _bindingContext.value !== 'object' || !_bindingContext.value) { return; }

                        let keys = Object.keys(_bindingContext.value);//.sort();

                        for (var i = 0; i < keys.length; i++) {

                            if (!appendTemplate(keys[i])) { break; }
                        }

                        setTimeout(function () {

                            if (_bindingContext?.value?._isDataContext) {

                                if (isFunctionNotAdded('addTemplate', element)) {

                                    _bindingContext.value.on(
                                        "-",
                                        function addTemplate(event) {

                                            if (event.eventName === "new" && (!isMultiple || isMultiple && event.propertyPath.length === 1)) {

                                                return appendTemplate(event.propertyPath.at(-1), event.target);
                                            }

                                            return true;
                                        },
                                        element
                                    );
                                }

                                if (isFunctionNotAdded('removeTemplate', element)) {

                                    _bindingContext.value.on(
                                        "-",
                                        function removeTemplate(event) {

                                            if (event.eventName === "delete" && (!isMultiple || isMultiple && event.propertyPath.length === 1)) {

                                                element.querySelectorAll(`:scope > [path="${event.propertyPath.at(-1)}"]`).forEach(function (e) {

                                                    e.remove();
                                                });
                                            }

                                            return true;
                                        },
                                        element
                                    );
                                }
                            }
                        });

                        return;
                    }

                    return appendTemplate();


                    function isFunctionNotAdded(fnName, element) {

                        return _bindingContext?.value?._events?.["-"]
                            ?.find(function (fn) {

                                return fn.name.includes(fnName)
                                    && fn.isActive === element;

                            }) === undefined;
                    }
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

                        var fnName = element.attributes.bind.value,
                            isValueInverted = false,
                            bindArgs = [];

                        if (fnName) {

                            //!fnName(bindArg1,bindArg2,...)
                            if (fnName.startsWith("!")) { isValueInverted = true; fnName = fnName.substring(1); }
                            bindArgs = fnName.split(/[\(\)]/);
                            fnName = bindArgs.shift().trim();
                            if (bindArgs[0]) { bindArgs = bindArgs[0].split(/,/); }
                            bindArgs = bindArgs.map(function (arg) { return arg.trim(); });
                        }

                        else {

                            fnName = element.tagName.toLowerCase();

                            if (element.attributes.type) { fnName += "_" + element.attributes.type.value.replace(/-/g, "_"); }
                        }

                        _bind(DataContextBinding[fnName] || DataContextBinding.innerHTML);

                    } catch (err) { return _error("[ bind ] ", err); }
                }

                if (element.attributes.onbind) {

                    try {

                        element.setAttribute('onblur', element.attributes.onbind.value);
                        _bind(element.onblur);
                        element.removeAttribute('onblur');

                    } catch (err) { return _error("[ onbind ] ", err); }
                }

                return;


                function _bind(fnBind) {

                    var _fnBind = function _fnBind(event) {

                        if (_bindingContext.value === undefined && element.isConnected) {

                            element.setAttribute("unbinded", "");
                            event.eventName = "unbind";
                        }

                        return fnBind.call(element, event);
                    };

                    _fnBind.element = element;
                    element.removeAttribute("unbinded");

                    if (_fnBind.call(element, {
                        eventName: "bind",
                        isValueInverted,
                        bindArgs,
                        target: _bindingContext.source,
                        propertyPath: [_bindingContext.property],
                        oldValue: _bindingContext.value,
                        newValue: _bindingContext.value
                    })) {

                        if (_bindingContext.source && typeof _bindingContext.source.on === "function") {

                            _bindingContext.source.on(
                                _bindingContext.property,
                                _fnBind,
                                element
                            );
                        }
                    }
                }
            }

            function _error(...args) {

                pDebug(args, element);
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
            },
                isMultiple = Boolean(elem.attributes.templates);

            _findPathAndSource();
            _selectSource();

            var _bindingContext = Object.create(null, {

                element: { value: d.rootElement, writable: false, configurable: false, enumerable: false },

                source: {
                    configurable: false, enumerable: false,

                    get: function () {

                        return d.arrPath.reduce(function (s, k) { return s[k]; }, d.rootSource);
                    }
                },

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

                removeParent: { value: _removeParent, writable: false, configurable: false, enumerable: false }
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

                    if (d.arrPath.at(-1) === '#') {

                        d.source = document.documentElement.datacontext;
                        d.arrPath.pop();
                    }

                    if (d.rootElement.datacontext !== undefined) {

                        d.source = d.rootElement.datacontext;
                    }

                } while (!d.source && d.rootElement.parentElement && (d.rootElement = d.rootElement.parentElement))

                d.rootSource = d.source || (d.source = {});

                if (d.rootSource?._events && (
                    !d.rootSource._events["-"] ||
                    !d.rootSource._events["-"].find(function (fn) { return fn.name.includes("bindHandler"); })
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

                _nextSource(d, d.property, isMultiple ? [] : "");
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

                if (isMultiple) {

                    d.source[property] = createDataContext(Array.isArray(d.source[property]) ? d.source[property] : []);

                    setTimeout(function () { bindElement(d.rootElement, true); });

                    return d.source[property];
                }

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

                    _bindingContext.source.splice(_bindingContext.property, 1);
                }
                else {

                    delete _bindingContext.source[_bindingContext.property];
                }
            }

            function _removeParent() {

                if (Array.isArray(_bindingContext.source._parent)) {

                    var index = _bindingContext.source._propertyName;

                    _bindingContext.source._parent.splice(index, 1);
                }
                else {

                    delete _bindingContext.source._parent[_bindingContext.source._propertyName];
                }
            }

            function _error(...args) {

                pDebug(args, d.rootElement);
            }
        }

        function bindHandler(event) {

            if (event.eventName === "delete") {

                var deletePropPath = event.propertyPath.join(".");

                if (event.target._events[deletePropPath]) {

                    var current_events = event.oldValue._events;
                    event.oldValue._events = event.target._events[deletePropPath];
                    emitProperties(event.newValue, event.oldValue, event.eventName);
                    delete event.target._events[deletePropPath];
                    event.oldValue._events = current_events;
                }

                else {

                    emitProperties(event.newValue, event.oldValue, event.eventName);
                }

                return true;
            }

            if (!event.newValue?._events) { return true; }

            if (event.eventName === "set") {

                if (event.oldValue?._isDataContext) {

                    event.newValue._events = event.oldValue._events;
                }

                emitProperties(event.newValue, event.oldValue, event.eventName);
            }

            else if (event.eventName === "reposition") {

                var currentPropPath = event.propertyPath.join(".");
                var newPropPath = event.target._propertyName + "." + event.newValue._propertyName;

                event.target._events[newPropPath] = event.newValue._events;

                if (event.target._events[currentPropPath]) {

                    event.newValue._events = event.target._events[currentPropPath];
                    delete event.target._events[currentPropPath];
                }
                else {

                    event.newValue._events = event.oldValue._events || {};
                }

                emitProperties(event.newValue, event.oldValue, event.eventName);
            }

            //else if (event.eventName === "new") { debugger; }


            return true;

            function emitProperties(newValue, oldValue, eventName) {

                var value = eventName === 'delete' ? oldValue : newValue; 

                if (value?.emit) {

                    Object.keys(value).forEach(function (k) {

                        value.emit(k, { eventName, target: value, propertyPath: [k], oldValue: oldValue?.[k], newValue: newValue?.[k] });
                        emitProperties(newValue?.[k], oldValue?.[k], eventName);
                    });
                }
            }
        }

        function getType(v) { return v === null ? "null" : Array.isArray(v) ? "array" : typeof v; }

        //#region *** Default bind ***

        function progessBind(event) {

            if (event.eventName === "unbind") {

                if (this.wsLink) {

                    this.wsLink.onreadystate = null;
                }
            }

            if (event.eventName === "bind") {

                this.isValueInverted = event.isValueInverted;
                this.attributeBindingName = event.bindArgs[0] || '';
                this.attributeBindingValue = event.bindArgs[1] || '';

                var parent = this.parentElement;

                while (!this.wsLink && parent) {

                    this.wsLink = parent.wsLink;
                    parent = parent.parentElement;
                }

                if (this.wsLink) {

                    this.wsLink.onreadystate = handleReadyState.bind(this);
                }

                handleReadyState.call(this, this.wsLink?.readyState);
            }

            // I am alive!
            return this.isConnected;

            function handleReadyState(wsState) {

                if (!this.isConnected) {

                    this.wsLink.onreadystate = null;
                    return;
                }

                wsState = wsState === 1;
                wsState = this.isValueInverted ? !wsState : wsState;

                updateAttributeBinding.call(this, wsState, this.attributeBindingName, this.attributeBindingValue);
            }
        }
        function contextBind(event) {

            return false;
        }
        function innerHTMLBind(event) {

            if (event?.eventName === "unbind") {

                this.innerHTML = '';
                // I am dead!
                return false;
            }

            var val = this.contextValue();
            this.innerHTML = val;

            // I am alive!
            return val === undefined ? false : true;
        }
        function valueBind(event) {

            if (event.eventName === "unbind") {

                this.removeEventListener("change", change);
                this.removeEventListener("keydown", keydown);

                this.value = '';

                // I am dead!
                return false;
            }

            this.value = this.contextValue();

            // Init
            if (event.eventName === "bind") {

                this.addEventListener("change", change);
                this.addEventListener("keydown", keydown);
            }

            // I am alive!
            return true;

            function change(ev) { if (this.contextValue !== undefined) { this.contextValue(this.value); } }
            function keydown(ev) { if (ev.keyCode === 27) { this.value = this.contextValue(); } }
        }
        function getValueBind(event) {

            if (event.eventName === "unbind") {

                this.value = '';

                // I am dead!
                return false;
            }

            this.value = this.contextValue();

            // I am alive!
            return true;
        }
        function setValueBind(event) {

            if (event.eventName === "unbind") {

                this.removeEventListener("change", change);
                this.removeEventListener("keydown", keydown);

                this.value = '';

                // I am dead!
                return false;
            }

            // Init
            if (event.eventName === "bind") {

                this.addEventListener("change", change);
                this.addEventListener("keydown", keydown);
            }

            // I am alive!
            return true;

            function change(ev) { if (this.contextValue !== undefined) { this.contextValue(this.value); } }
            function keydown(ev) { if (ev.keyCode === 27) { this.value = this.contextValue(); } }
        }
        function checkBind(event) {

            if (event.eventName === "unbind") {

                this.removeEventListener("change", change);

                // I am dead!
                return false;
            }

            this.checked = this.contextValue();
            this.checked ? this.setAttribute("checked", "") : this.removeAttribute("checked");

            // Init
            if (event.eventName === "bind") {

                this.addEventListener("change", change);
            }

            // I am alive!
            return this.contextValue() === undefined ? false : true;

            function change(ev) { if (this.contextValue() !== undefined) { this.contextValue(this.checked); } }
        }
        function visibleBind(event) {

            if (event.eventName === "unbind") {

                // I am dead!
                return false;
            }

            if (event.eventName === "bind") {

                this.isValueInverted = event.isValueInverted;
            }

            updateAttributeBinding.call(this,
                this.isValueInverted ? this.contextValue() : !this.contextValue(),
                'hidden',
                'hidden'
            );

            // I am alive!
            return this.contextValue() === undefined ? false : true;
        }
        function hiddenBind(event) {

            if (event.eventName === "unbind") {

                // I am dead!
                return false;
            }

            if (event.eventName === "bind") {

                this.isValueInverted = event.isValueInverted;
            }

            updateAttributeBinding.call(this,
                this.isValueInverted ? !this.contextValue() : this.contextValue(),
                'hidden',
                'hidden'
            );

            // I am alive!
            return this.contextValue() === undefined ? false : true;
        }
        function changeBind(event) {

            if (event.eventName === "unbind") {

                this.removeEventListener("change", change);
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

                    // I am dead!
                    return this.bindingContext?.isActive();
                },
                    // Set DOM element. 
                    // I am monitoring the attribute 'isConnected'.
                    // If it's true, it's alive.
                    this
                );

                this.addEventListener("change", change);
            }

            // I am alive!
            return true;

            function change(ev) {

                if (this.contextValue !== undefined) {
                    // Let's take the context of the data.
                    this.contextValue()
                        // We will overvalue the modified JSON string data.
                        .overwritingData(this.value);
                }
            }
        }
        function enabledBind(event) {

            if (event.eventName === "unbind") {

                this.setAttribute('disabled', 'disabled');

                // I am dead!
                return false;
            }

            if (event.eventName === "bind") {

                this.isValueInverted = event.isValueInverted;
            }

            updateAttributeBinding.call(this,
                this.isValueInverted ? this.contextValue() : !this.contextValue(),
                'disabled',
                'disabled'
            );
            if (this.contextValue()) { this.removeAttribute('disabled'); }
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

            if (event.eventName === "bind") {

                this.isValueInverted = event.isValueInverted;
            }

            updateAttributeBinding.call(this,
                this.isValueInverted ? !this.contextValue() : this.contextValue(),
                'disabled',
                'disabled'
            );

            // I am alive!
            return this.contextValue() === undefined ? false : true;
        };
        function classToggleBind(event) {

            if (event.eventName === "unbind") {

                toggle(this, false);

                // I am dead!
                return false;
            }

            if (event.eventName === "bind") {

                this.isValueInverted = event.isValueInverted;

                if (event.bindArgs.length > 1) {

                    this.primaryClasses = parseClassNames(event.bindArgs[0]);
                    this.secondaryClasses = parseClassNames(event.bindArgs[1]);
                }
                else {

                    this.primaryClasses = parseClassNames(event.bindArgs[0]);
                    this.secondaryClasses = [];
                }
            }

            toggle(this, this.isValueInverted ? !this.contextValue() : this.contextValue());

            // I am alive!
            return true;


            function parseClassNames(classNames) {

                return classNames
                    .split(/\s/)
                    .filter(function (c) { return c; });
            }
            function toggle(element, isPrimary) {

                if (isPrimary) {
                    element.primaryClasses?.forEach(function (c) { element.classList.add(c); });
                    element.secondaryClasses?.forEach(function (c) { element.classList.remove(c); });
                }
                else {
                    element.primaryClasses?.forEach(function (c) { element.classList.remove(c); });
                    element.secondaryClasses?.forEach(function (c) { element.classList.add(c); });
                }
            }
        }
        function attributeBind(event) {

            if (event.eventName === "unbind") {

                updateAttributeBinding.call(this, false, this.attributeBindingName, this.attributeBindingValue);

                // I am dead!
                return false;
            }

            if (event.eventName === "bind") {

                this.isValueInverted = event.isValueInverted;
                this.attributeBindingName = event.bindArgs[0] || '';
                this.attributeBindingValue = event.bindArgs[1] || '';
            }

            updateAttributeBinding.call(this,
                this.isValueInverted ? !this.contextValue() : this.contextValue(),
                this.attributeBindingName,
                this.attributeBindingValue
            );

            // I am alive!
            return this.contextValue() === undefined ? false : true;
        }


        function updateAttributeBinding(isEnabled, attributeName, attributeValue = '') {

            if (attributeName) {

                if (isEnabled) { this.setAttribute(attributeName, attributeValue); }

                else { this.removeAttribute(attributeName); }
            }
        }

        //#endregion

        // Debugging
        function pDebug(...args) { if (isDebug) { console.log(`[ DEBUG ] `, ...args); } }
        function pError(...args) { if (isDebug) { console.error(`[ ERROR ] `, ...args); } }
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