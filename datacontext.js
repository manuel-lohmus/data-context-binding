/**  Copyright (c) Manuel Lõhmus (MIT License). */

"use strict";

(function () {

    exportModule("data-context", function factory() {

        var isDebug = this.document && Array.from(document.scripts).find(function (s) { return s.src.includes('data-context-binding'); })?.attributes.debug || false,
            ignoreMetadata = false;

        /**
         * Create a new proxy object with the same structure as the original object. 
         * With the ability to listen to changes in the object 
         * and the ability to restore the original object.
         * @param {any} value Value.
         * @param {string} propertyName Property name. Default is null. 
         * @param {any} parent Parent. Default is null. 
         * @returns {Proxy} Returns a proxy object. 
         */
        function createDataContext(value, propertyName = null, parent = null) {

            if (createDataContext === this?.constructor) { throw new Error('This function must be used without the `new` keyword.'); }

            var type = _typeof(value);

            if (value?._isDataContext || type !== "object" && type !== "array") { return value; }

            var proxy = null;

            Object.defineProperties(value, {

                _isDataContext: { value: true, writable: false, configurable: false, enumerable: false },

                _isModified: { value: false, writable: true, configurable: false, enumerable: false },

                _modified: { value: [], writable: false, configurable: false, enumerable: false },

                _propertyName: {
                    configurable: false, enumerable: false,

                    get: function () { return propertyName; },

                    set: function (v) { propertyName = v; }
                },

                _parent: {
                    configurable: false, enumerable: false,

                    get: function () {

                        if (parent === null) { return null; }

                        if (_isMyParent()) { return parent; }

                        return null;
                    },

                    set: function (v) { parent = v; }
                },

                toString: {
                    writable: true, configurable: false, enumerable: false,

                    value: function toString(createModifiedData = false) {

                        if (type === "array") { return _stringifyArray(this); }
                        if (type === "object") { return _stringifyObject(this); }

                        return _stringifyValue(this);

                        function _stringifyValue(val) {

                            if (val?._isDataContext) { return val.toString(createModifiedData); }

                            var t = typeof val;

                            if (t === "string") { return '"' + val + '"'; }
                            if (t === "boolean") { return Boolean.prototype.toString.call(val); }
                            if (t === "number") { return Number.prototype.toString.call(val); }
                            if (val === null) { return "null"; }
                            if (Array.isArray(val)) { return _stringifyArray(val); }
                            if (t === "object") { return _stringifyObject(val); }

                            return "undefined";
                        }
                        function _stringifyArray(val) {

                            return "[".concat(
                                createModifiedData ? "\r\r" : "",
                                val.map(function (v, i) {
                                    return "".concat(
                                        createModifiedData ? _stringifyValue(i) : "",
                                        createModifiedData ? ":" : "",
                                        _stringifyValue(v));
                                }).join(","),
                                "]"
                            );
                        }
                        function _stringifyObject(val) {

                            return "{".concat(
                                createModifiedData ? "\r\r" : "",
                                Object.keys(val).map(function (k) {
                                    return _stringifyValue(k).concat(":", _stringifyValue(val[k]));
                                }).join(","),
                                "}"
                            );
                        }
                    }
                },

                overwritingData: {
                    writable: true, configurable: false, enumerable: false,

                    value: function _overwritingData(text, reviver) { parse.call(this, text, reviver); }
                },

                stringifyChanges: {
                    writable: true, configurable: false, enumerable: false,

                    value: function _stringifyChanges(replacer, space, modifiedData = true, setUnmodified = true) {

                        return stringify(this, replacer, space, { modifiedData, setUnmodified });
                    }
                },

                isChanged: {
                    configurable: false, enumerable: false,

                    get: function () { return Boolean(this._isModified || this._modified.length); }
                },

                resetChanges: {
                    writable: true, configurable: false, enumerable: false,

                    value: function _resetChanges() {

                        for (var k of this._modified) {

                            if (this[k] && "undefined" !== typeof this[k].resetChanges) {

                                this[k].resetChanges();
                            }
                        }

                        if ("undefined" !== typeof this._isModified) { this._isModified = false; }
                        if ("undefined" !== typeof this._modified) { this._modified.length = 0; }
                    }
                },

                // EventEmitter
                _events: { value: {}, writable: true, configurable: false, enumerable: false },

                once: {
                    writable: false, configurable: false, enumerable: false,
                    /**
                    * @param {string} eventName
                    * @param {(...params:any)=>void} listener
                    * @returns {DataContext}
                    */
                    value: function once(eventName, listener) {

                        return this.on(eventName, listener, false);
                    }
                },

                on: {
                    writable: false, configurable: false, enumerable: false,

                    /**
                    * @param {string} eventName
                    * @param {(...params:any)=>void} listener
                    * @param {boolean|()=>boolean|Node} isActive if false then adds a one-time listener function for the event named eventName. The next time eventName is triggered, this listener is removed and then invoked.
                    * @returns {DataContext}
                    */
                    value: function on(eventName, listener, isActive = true) {

                        if (!this._events[eventName]) { this._events[eventName] = []; }

                        this._events[eventName].push(listener);
                        isActive && (listener.isActive = isActive);

                        return this;
                    }
                },

                emitToParent: {
                    writable: false, configurable: false, enumerable: false,

                    /**
                     * @param {string} eventName
                     * @param {...any} params
                     * @returns {boolean} Returns true if the event had listeners, false otherwise.
                     */
                    value: function emitToParent(eventName, ...params) {

                        var ret = false;

                        if (eventName !== '-change') {

                            ret = this.emit(eventName, ...params) || ret;
                        }

                        else if (this._events['-change']?.length) {

                            clearTimeout(emitToParent.timeout);
                            emitToParent.timeout = setTimeout(function (_this) {

                                delete emitToParent.timeout;

                                _this.emit("-change", { eventName: "-change", target: _this });
                            }, 10, this);
                        }

                        if ((eventName === '-' || eventName === '-change') &&
                            parent && typeof parent.emitToParent === "function") {

                            //_modified
                            if (params[0] && params[0].propertyPath) {

                                params[0].propertyPath.unshift(propertyName);
                            }

                            ret = parent.emitToParent(eventName, ...params) || ret;
                        }

                        return ret;
                    }
                },

                emit: {
                    writable: false, configurable: false, enumerable: false,

                    value: function emit(eventName, ...params) {

                        var ret = false;
                        var arr = this._events[eventName] || [];
                        var index = 0;

                        while (index < arr.length) {

                            var listener = arr[index];

                            if (arr[index] === listener &&
                                (typeof listener.isActive === "function" && !listener.isActive()
                                    || listener.isActive?.isConnected === false
                                    || listener.isActive === undefined
                                    || !listener.isActive === true)) {

                                arr.splice(index, 1);
                            }

                            if (typeof listener.isActive === "function" && listener.isActive()
                                || listener.isActive?.isConnected === true
                                || listener.isActive === undefined
                                || listener.isActive === true) {

                                ret = true;
                                if (!listener.call("undefined" != typeof window && listener.isActive instanceof window.Node && listener.isActive, ...params)) {

                                    arr.splice(index, 1);
                                }
                            }

                            if (arr[index] === listener) { index++; }
                        }

                        if (this._events[eventName] && !this._events[eventName].length) {

                            delete this._events[eventName];
                        }

                        return ret;
                    }
                }
            });

            proxy = new Proxy(value, handler);

            Object.keys(value).forEach(function (key) {

                if (key.startsWith('-metadata')) {

                    Object.defineProperty(value, key, {
                        value: Array.isArray(value[key]) ? value[key] : [value[key]],
                        enumerable: false
                    });

                    return;
                }

                if (value[key] && !value[key]._isDataContext) {

                    value[key] = createDataContext(value[key]);
                }

                if (value[key] && value[key]._isDataContext) {

                    value[key]._propertyName = key;
                    value[key]._parent = proxy;
                }
            });

            return proxy;

            function _isMyParent() { return !parent || parent && parent[propertyName] === proxy; }
        }

        /**
         * Stringify type.
         * @param {any} v Value.
         * @returns {string} Returns the type of the value.
         */
        function _typeof(v) { return v === null ? "null" : Array.isArray(v) ? "array" : typeof v; }

        /**
         * Is global object in the browser and Node.js.
         * @param {any} g Check object.
         * @returns {boolean} Returns true if the object is global.
         */
        function isGlobal(g) { return g === (typeof globalThis !== 'undefined' ? globalThis : global || self); }

        /**
         * Sync data objects
         * @param {any} target
         * @param {any} source
         * @returns {any}
         */
        function syncData(target, source, removeUnusedKeys = true) {

            if (!target && typeof target !== "object") { target = {}; }
            if (Array.isArray(source) && !Array.isArray(target) && target !== null) { target = []; }

            if (source && typeof source === "object") {

                var keys = Object.keys(source);
                Object.keys(source).forEach(function (k) { keys.push('-metadata-' + k); });
                keys.push('-metadata');

                for (var k of keys) {

                    if (!source.hasOwnProperty(k)) continue;

                    if (typeof source[k] === "function" || k === "__proto__" || k === "constructor") { continue; }

                    if (!source[k] || typeof source[k] !== "object") {

                        target[k] = source[k];
                    }
                    else {

                        target[k] = syncData(target[k], source[k], removeUnusedKeys);

                        if (k.startsWith('-metadata')) {
                            Object.defineProperty(target, k, { enumerable: false });
                        }

                    }
                }

                if (removeUnusedKeys && (_typeof(target) === 'object' || _typeof(target) === 'array')) {

                    Object.keys(target).forEach(function (k) {

                        if (!keys.includes(k)) { delete target[k]; }
                    });

                    if (Array.isArray(target)) { target.length = source.length; }
                }
            }

            return target;
        }

        //#region *** Handler ***

        var handler = { deleteProperty, set };

        function deleteProperty(target, property) {

            if (target.propertyIsEnumerable(property)) {

                var oldValue = target[property],
                    newValue = undefined;

                var ret = Reflect.deleteProperty(target, property);

                target.emitToParent("-", { eventName: "delete", target, propertyPath: [property], oldValue, newValue });

                if (Array.isArray(target)) {

                    target._isModified = true;
                }
                else if (!target._modified.includes(property)) {

                    target._modified.push(property);
                }

                setModified(target._parent, target._propertyName);

                if (Array.isArray(target)) {

                    var index = target._modified.indexOf(property);

                    if (index > -1) {
                        target._modified.splice(index, 1);
                    }
                }

                target.emit(property, { eventName: "delete", target, propertyPath: [property], oldValue, newValue });
                target.emitToParent("-change", { eventName: "-change", target });

                return ret;
            }

            return Reflect.deleteProperty(target, property);
        }

        function set(target, property, newValue, proxy) {

            if (target.propertyIsEnumerable(property)
                || target[property] === undefined) {

                var oldValue = target[property],
                    newValue = newValue && newValue._isDataContext ? newValue : createDataContext(newValue);


                if (oldValue !== newValue) {

                    var eventName = "";

                    var ret = Reflect.set(target, property, newValue, proxy);

                    var isDC = newValue?._isDataContext;
                    var isNew = oldValue === undefined;

                    if (isNew) {
                        //console.log("'-new' set: oldValue is undefined", property, event);
                        eventName = "new";
                    }
                    else if (isDC && newValue._propertyName !== null && newValue._propertyName !== property) {
                        //console.log("'-reposition' set: newValue propertyName is change ", newValue + "", ">", property, event);
                        eventName = "reposition";
                    }
                    else {
                        //console.log("'-set' set: newValue parent is change", property, event);
                        eventName = "set";
                    }

                    target.emitToParent("-", { eventName, target, propertyPath: [property], oldValue, newValue });
                    target.emit(property, { eventName, target, propertyPath: [property], oldValue, newValue });

                    if (isDC) {
                        newValue._isModified = true;
                        newValue._parent = proxy;
                        newValue._propertyName = property;
                    }

                    setModified(target, property);

                    target.emitToParent("-change", { eventName: "-change", target });

                    return ret;
                }
            }

            if (property === 'length' && _typeof(target) === 'array' && newValue < target.length && target[newValue] !== undefined) {

                for (var i = target.length - 1; newValue <= i; i--) {

                    var oldValue = target[i];

                    delete target[i + ''];

                    target.emitToParent("-", { eventName: "delete", target, propertyPath: [i + ''], oldValue, newValue: undefined });
                    target._isModified = true;

                    setModified(target._parent, target._propertyName);

                    if (Array.isArray(target)) {

                        var index = target._modified.indexOf(property);

                        if (index > -1) {
                            target._modified.splice(index, 1);
                        }
                    }

                    Reflect.set(target, 'length', i, proxy);

                    target.emitToParent(i + '', { eventName: "delete", target, propertyPath: [i + ''], oldValue, newValue: undefined });
                }

                target.emitToParent("-change", { eventName: "-change", target });

                return true;
            }

            return Reflect.set(target, property, newValue, proxy);
        }

        function setModified(target, property) {

            if (target?._isDataContext) {

                if (!target._modified.includes(property)) {

                    target._modified.push(property);
                }

                setModified(target._parent, target._propertyName);
            }
        }

        //#endregion

        //#region *** parse / stringify ***

        /**
         * Parse a string to an object.
         * @param {string|number} text Input value.  
         * @param {any} reviver Reviver. 
         * @returns {any} Returns an object.
         */
        function parse(text, reviver) {

            if (text !== null
                && typeof text !== "string"
                && text && typeof text !== "number") {

                return;
            }

            var it = new _it(text);
            var _this = isGlobal(this) || this === createDataContext ? undefined : this;
            var isOverwriting = Boolean(_this);

            if (typeof reviver === "object") {

                _this = reviver;
                if (_this?._isDataContext) {
                    reviver = createDataContext;
                }
            }

            if (reviver === createDataContext) {

                reviver = function _set(k, v) {

                    if (v?._isDataContext) {

                        return v;
                    }

                    return createDataContext(v, k, this);
                };
            }

            try {
                var meta = _whitespace();
                var value = _value(_this);
            }
            catch (e) {

                throw ": In parsing position: " + it.position + " '" + it.current + "' => "
                + it.text.substring(it.position < 10 ? 0 : it.position - 10, it.position + 10)
                    .replace(/\r/g, "\\r")
                    .replace(/\n/g, "\\n")
                + "\n" + e.message + e.stack;
            }

            _setMetadata(value, meta);

            if (reviver && reviver.name === "_set") {

                value = reviver.call(
                    undefined,
                    undefined,
                    value
                );

                return value;
            }

            if (reviver) {

                value = reviver.call(
                    { "": value },
                    "",
                    value
                );
            }

            return value;


            function _it(text) {

                var currentPosition = 0;
                this.text = removeBOM(text + '');
                this.position = 1;
                this.current = this.text.charAt(0);
                this.following = this.text.charAt(1);
                this.is = _is;
                this.next = _next;
                this.isInfiniteLoop = _isInfiniteLoop;
                this.setPosition = _setPosition;

                function _isInfiniteLoop() {

                    if (currentPosition !== this.position) {

                        currentPosition = this.position;

                        return false;
                    }

                    throw "Incorrect entry.";
                }

                function _next() {

                    this.position++;
                    this.current = this.following;
                    this.following = this.text.charAt(this.position);
                }

                function _is(str) {

                    if (this.text.substring(this.position - 1, this.position - 1 + str.length) === str) {

                        this.position = this.position + str.length;
                        this.current = this.text.charAt(this.position - 1);
                        this.following = this.text.charAt(this.position);

                        return true;
                    }
                    return false;
                }

                function _setPosition(pos) {

                    this.position = pos;
                    this.current = this.text.charAt(pos - 1);
                    this.following = this.text.charAt(pos);
                }

                function removeBOM(str) {

                    if (str.charCodeAt(0) === 65279) {

                        return str.slice(1);
                    }
                    return str;
                }
            }

            function _get(val, def) {

                if (_typeof(val) !== _typeof(def)) {

                    if (val?._isDataContext) {

                        def = createDataContext(def);
                        def._events = val._events;

                        if (val?._propertyName && val._parent) { val._parent[val._propertyName] = def; }
                    }

                    return def;
                }

                return val;
            }

            function _whitespace() {

                var meta = [], metadata;
                __whitespace();

                while (metadata = _metadata()) {

                    if (metadata.trim()) { meta.push(metadata); }
                    __whitespace();
                }

                __whitespace();

                return meta;


                function __whitespace() {

                    while (it.current === '\n'
                        || it.current === '\r'
                        || it.current === '\t'
                        || it.current === '\u0020') {

                        it.next();
                    }
                }
            }

            function _metadata() {

                if (it.current === '/' && (it.following === '*' || it.following === '/')) {

                    var metadata = '',
                        isMetadata = it.current === '/' && it.following === '*';

                    it.next();
                    it.next();

                    while (isMetadata && !(it.current === '*' && it.following === '/')
                        || !isMetadata && !(it.current === '\r' || it.current === '\n')) {

                        metadata += it.current;
                        it.next();
                    }

                    if (it.current === '\r' || it.current === '\n') {

                        return ' ';
                    }

                    it.next();
                    it.next();

                    return metadata;
                }
            }

            function _setMetadata(obj, metadata, key = '') {

                if (ignoreMetadata) { return; }

                if (metadata && metadata.length && obj && typeof obj === 'object') {

                    key = key + "";

                    Object.defineProperty(
                        obj,
                        '-metadata' + (key ? '-' + key : ''),
                        {
                            value: metadata,
                            writable: true,
                            configurable: true,
                            enumerable: false
                        }
                    );
                }
            }

            function _value(val) {

                var _val = _object(val);
                if (_val !== undefined) { return _val; }

                _val = _array(val);
                if (_val !== undefined) { return _val; }

                _val = _string();
                if (_val !== undefined) { return _val; }

                _val = _true();
                if (_val !== undefined) { return _val; }

                _val = _false();
                if (_val !== undefined) { return _val; }

                _val = _null();
                if (_val !== undefined) { return _val; }

                _val = _number(val);
                return _val;
            }

            function _string() {

                _whitespace();

                if (it.current === '"') {

                    var str = '';
                    it.next();

                    if (!it.current) { return; }

                    while (it.current && it.current !== '"') {

                        str += it.current;
                        it.next();
                    }

                    if (it.current === '"') {

                        it.next();
                    }

                    return str;
                }
            }

            function _number() {

                _whitespace();
                var str = _negative();

                if (it.current === "0") {

                    str += it.current;
                    it.next();
                }
                else {
                    str += _digit();
                }

                if (it.current === ".") {

                    str += it.current;
                    it.next();
                    str += _digit();
                }

                if (it.current && "eE".includes(it.current)) {

                    str += it.current;
                    it.next();

                    if (it.current && "-+".includes(it.current)) {

                        str += it.current;
                        it.next();
                    }

                    str += _digit();
                }

                if (!str) { return undefined; }

                str = JSON.parse(str);

                return str;
            }

            function _negative() {

                if (it.current === '-') {

                    it.next();

                    return '-';
                }

                return '';
            }

            function _digit() {

                var str = '';

                while (it.current && "0123456789".includes(it.current)) {

                    str += it.current;
                    it.next();
                }

                return str;
            }

            function _object(val) {

                var meta = _whitespace();

                if (it.current === '{') {

                    it.next();

                    var isNewObject = it.current === '\r' && it.following === '\r',
                        keys = [];

                    if (isNewObject) {

                        it.next();
                        it.next();
                    }

                    var obj = _get(val, {});

                    _setMetadata(obj, meta);

                    while (it.current !== '}' && !it.isInfiniteLoop()) {

                        meta = _whitespace();

                        if (it.current === '}') {

                            if (isOverwriting && _typeof(_this) === 'object') {

                                Object.keys(_this).forEach(function (k) {

                                    delete _this[k];
                                });
                            }

                            break;
                        }

                        var k = _key();

                        keys.push(k);

                        _whitespace();

                        var v = _value(obj[k] || val?.[k]);

                        _whitespace();

                        if (it.current !== ',' && it.current !== '}') {

                            throw "Incorrect object separator.";
                        }

                        if (it.current === ',') {

                            it.next();
                        }

                        if (typeof k === 'string' && v !== undefined) {

                            if (reviver) {

                                Reflect.set(
                                    obj,
                                    k,
                                    reviver.call(obj, k, v)
                                );
                            }
                            else {

                                obj[k] = v;
                            }

                            if (typeof obj[k] === 'object') {

                                _setMetadata(obj[k], meta);
                            }
                            else {

                                _setMetadata(obj, meta, k);
                            }
                        }

                        else {

                            delete obj[k];
                        }
                    }

                    if (it.current === '}') {

                        it.next();
                    }

                    if (isNewObject) {

                        for (var k of Object.keys(obj)) {

                            if (!keys.includes(k)) {

                                delete obj[k];
                                obj._isModified = true;
                            }
                        }
                    }

                    return obj;
                }
            }

            function _key() {

                _whitespace();

                if (it.current === ":") {

                    throw "Invalid object key.";
                }

                var key = _string();

                _whitespace();

                if (typeof key !== "string" || it.current !== ":") {

                    throw "Invalid object key.";
                }
                else {

                    it.next();
                }

                return key;
            }

            function _array(val) {

                var meta = _whitespace();

                if (it.current === '[') {

                    it.next();

                    var isNewArray = it.current === '\r' && it.following === '\r';

                    if (isNewArray) {

                        it.next();
                        it.next();
                    }

                    var arr = _get(val, []);

                    _setMetadata(arr, meta);

                    var i = 0;

                    while (it.current !== ']' && !it.isInfiniteLoop()) {

                        meta = _whitespace();

                        if (it.current === ']') {

                            if (isOverwriting && _typeof(_this) === 'array') {

                                _this.length = 0;
                            }

                            break;
                        }

                        // for update
                        var index = _index();

                        if (isOverwriting && index === undefined) {

                            pWarn("Overwriting data -> array index must be.");
                            index = i;
                        }

                        _whitespace();

                        var v = _value(
                            arr[typeof index === "number" && index || i] ||
                            val?.[typeof index === "number" && index || i]
                        );

                        _whitespace();

                        if (it.current !== ',' && it.current !== ']') {

                            throw "Incorrect array separator.";
                        }

                        if (it.current === ',') {

                            it.next();
                        }

                        if (reviver) {

                            v = reviver.call(arr, String(typeof index === "number" && index || i), v);
                        }

                        if (v === undefined && typeof index === "number" && index > -1) {

                            arr.splice(index, 1);
                        }
                        else if (typeof index === "number" && arr[index] !== undefined) {

                            arr[index] = v;
                        }
                        else {

                            arr.push(v);
                        }

                        if (typeof arr[typeof index === "number" && index || i] === 'object') {

                            _setMetadata(arr[typeof index === "number" && index || i], meta);
                        }
                        else {

                            _setMetadata(arr, meta, typeof index === "number" && index || i);
                        }

                        i++;
                    }

                    if (it.current === ']') {

                        it.next();
                    }

                    if (isNewArray && val?.length > i) {

                        val.length = i;
                        arr._isModified = true;
                    }

                    return arr;
                }
            }

            function _index() {

                _whitespace();

                if (it.current === ":") {

                    throw "Invalid array index.";
                }

                var pos = it.position;
                var nr = _number();

                _whitespace();

                if (typeof nr !== "number" && it.current === ":") {

                    throw "Invalid array index.";
                }

                if (typeof nr === "number" && it.current === ":") {

                    it.next();

                    return nr;
                }

                it.setPosition(pos);

                return;
            }

            function _true() {

                _whitespace();

                if (it.is('true')) {

                    return true;
                }
            }

            function _false() {

                _whitespace();

                if (it.is('false')) {

                    return false;
                }
            }

            function _null() {

                _whitespace();

                if (it.is('null')) {

                    return null;
                }
            }
        }

        /**
         * Stringify an object.
         * @param {any} value Input value.
         * @param {any} replacer Replacer. Optional. 
         * @param {any} space Space. Optional. 
         * @param {Options} options Options. Optional. 
         * @returns {string} Returns a string.
         * 
         * @typedef {Object} Options
         * @property {boolean} modifiedData Select modified data. Optional.
         * @property {boolean} setUnmodified Set unmodified. Optional.
         * @property {boolean} includeBOM Add the BOM to the beginning of the string. Optional.
         */
        function stringify(value, replacer, space, { modifiedData = false, setUnmodified = false, includeBOM = false } = {}) {

            // Define the BOM character
            var BOM = String.fromCharCode(65279),
                strJSON = '',
                isModified = false;

            replacer = _replacer(replacer);
            space = _space(space);

            if (typeof replacer === "function") {

                value = replacer.call(
                    { "": value },
                    "",
                    value
                );
            }

            _value(value, 0);

            return includeBOM && strJSON ? BOM + strJSON : strJSON || undefined;

            function _replacer(replacer) {

                if (Array.isArray(replacer)) {

                    replacer = fn(replacer);

                    function fn(arr) {

                        var isInitial = true;

                        return function (k, v) {

                            if (isInitial) {

                                isInitial = false;
                                return v;
                            }

                            return arr?.includes(k) ? v : undefined;
                        };
                    }
                }

                return function (k, v) {

                    if (typeof replacer === "function") {

                        v = replacer.call(this, k, v);
                    }

                    if (typeof v?.toJSON === "function"
                        && v.toJSON.name !== "_toJSON") {

                        v = v.toJSON(k);
                    }

                    return v;
                };
            }

            function _space(space) {


                if (typeof space === "number") {

                    var l = space < 1 ? 1 : space > 10 ? 10 : space;
                    space = "";

                    for (var i = 0; i < l; i++) {

                        space += " ";
                    }
                }

                if (typeof space === "string") {

                    space = space.substring(0, 10);
                }
                else { space = undefined; }

                return space;
            }

            function _value(value, level) {


                var type = _typeof(value);

                _meta();

                if (modifiedData) {

                    //root
                    if (!value?._parent) {

                        _getValue();
                    }
                    //selec all
                    else if (isModified) {

                        _setUnmodified();
                        _getValue();
                    }

                    else if (value?._isModified === true) {

                        var isMod = isModified;
                        isModified = true;
                        _getValue();
                        isModified = isMod;
                        _setUnmodified();
                    }
                    //selec modified
                    else {

                        _setUnmodified();

                        _getValue();
                    }
                }

                else { _getValue(); }

                return;


                function _meta() {

                    if (level === 0 || modifiedData && value?._parent && !isModified && value?._isModified === true) {

                        return _metadata(value, level, '');
                    }
                }

                function _setUnmodified() {

                    if (modifiedData && setUnmodified
                        && value?._isDataContext) {

                        //set _isModified false
                        if (value._isModified === true) { value._isModified = false; }

                        //removing propertyName
                        if (Array.isArray(value._parent?._modified)) {

                            var index = value._parent._modified.indexOf(value._propertyName);

                            if (index > -1) {
                                value._parent._modified.splice(index, 1);
                            }
                        }
                    }
                }

                function _getValue() {

                    if (_object()) { return; }

                    if (_string()) { return; }

                    if (_bool()) { return; }

                    if (_null()) { return; }

                    if (_number()) { return; }
                }

                function _object(cb) {

                    var startChar, isKeyVal, endChar;

                    if (type === "object") { startChar = '{'; isKeyVal = true; endChar = "}"; }
                    else if (type === "array") { startChar = '['; endChar = "]"; }

                    if (startChar && endChar) {

                        // signal of updating the entire object
                        if (modifiedData && value._isModified) {

                            startChar += '\r\r';
                        }

                        var keys = modifiedData && !value._isModified && !isModified
                            ? Object.values(value._modified).sort()
                            : Object.keys(value);

                        if (type === "array") { keys = keys.filter(function (k) { return Number.isInteger(Number(k)) }); }

                        // write emty object
                        if (!keys.length) {

                            if (modifiedData && !value._parent) { return true; }

                            strJSON += startChar + endChar;

                            return true;
                        }

                        // write startChar
                        if (space) { startChar += startChar.includes("\r\r") ? "" : _newline(); }

                        strJSON += startChar;

                        var isMod = isModified;
                        isModified = value._isModified;

                        // write keyVal
                        while (keys.length) {

                            _writeMetaKeyVal(keys.shift());
                        }

                        strJSON += _newline();

                        isModified = isMod;

                        if (modifiedData) { value._isModified = false; }

                        // write endChar
                        strJSON += _lineSpace(endChar, level);

                        return true;
                    }

                    return;


                    function _writeMetaKeyVal(k) {

                        var val = value[k];

                        if (typeof replacer === "function") {

                            val = replacer.call(
                                value,
                                k,
                                val
                            );
                        }

                        if (val?._isDataContext) {

                            _metadata(val, level + 1, "");
                        }
                        else {

                            _metadata(value, level + 1, k);
                        }

                        _writeKeyVal();

                        return;


                        function _writeKeyVal() {

                            // minified array and modified data
                            if (!space && !isKeyVal && modifiedData) { _writeKey(k + ':', true); }
                            // minified array
                            else if (!space && !isKeyVal) { _writeKey(''); }
                            // minified object
                            else if (!space && isKeyVal) { _writeKey('"' + k + '":'); }
                            // array and modified data
                            else if (!isKeyVal && modifiedData) { _writeKey(_lineSpace(k + ': ', level + 1), true); }
                            // array
                            else if (!isKeyVal) { _writeKey(_lineSpace('', level + 1)); }
                            // object
                            else { _writeKey(_lineSpace('"' + k + '": ', level + 1)); }

                            return;


                            function _writeKey(strKey, isStartTrim) {

                                // write key
                                strJSON += strKey;

                                // write value
                                _value(val, level + 1);

                                // write separator
                                strJSON += keys.length ? ',' + _newline() : '';

                                setUnmodified();

                                return;


                                function setUnmodified() {

                                    //set unmodified private val
                                    if (modifiedData && setUnmodified) {

                                        //removing propertyName
                                        var index = value._modified.indexOf(k);

                                        if (index > -1) {
                                            value._modified.splice(index, 1);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                function _string() {

                    if (type === "string") {

                        strJSON += '"' + value + '"' + '';

                        return true;
                    }
                }

                function _bool() {

                    if (type === "boolean") {

                        strJSON += value + '';

                        return true;
                    }
                }

                function _null() {

                    if (type === "null") {

                        strJSON += "null";

                        return true;
                    }
                }

                function _number() {

                    if (type === "number") {

                        strJSON += JSON.stringify(value);

                        return true;
                    }
                }
            }

            function _metadata(value, level, key = "") {

                if (ignoreMetadata || !value) { return; }

                var i = 0;

                key = key + "";
                key = "-metadata" + (key ? "-" + key : "");

                if (value[key] && !Array.isArray(value[key])) {

                    Object.defineProperty(value, key, { value: [value[key]], enumerable: false });
                }

                if (modifiedData && !value._isModified) { return; }

                while (value[key] && i < value[key].length) {

                    // write line
                    strJSON += _lineSpace(
                        '/*' + value[key][i] + '*/' + _newline(),
                        level
                    );

                    i++;
                }
            }

            function _lineSpace(text, level) {

                if (!space || !level) { return text; }

                return _space_(level) + text;

                function _space_(level) {

                    if (!space || !level) { return ""; }

                    return get[level] || get();

                    function get() {

                        get[level] = "";

                        for (var i = 0; i < level; i++) { get[level] += space; }

                        return get[level];
                    }
                }
            }

            function _newline() {

                if (!space) { return ""; }

                return "\n";
            }
        }

        //#endregion

        // is node.js
        if (typeof exports === 'object' && typeof module !== 'undefined') {

            var path = require('path'), fs = require('fs'), enableFileReadWrite = true;

            /**
             * 
             * @param {string} filePath 
             * @param {(event:Event)=>void} onDataChange
             * @param {(event:Event)=>void} onFileChange
             * @param {any} data Default {}
             * @returns Proxy
             * 
             * @typedef {object} Event Event object
             * @property {string} strChanges
             * @property {string} strJson
             * @property {Proxy} datacontext
             */
            function watchJsonFile({
                filePath = '',
                data = null,
                removeUnusedKeys = true,
                onDataChange = null,
                onFileChange = null
            } = {}) {

                if (!filePath.endsWith('.json')) {

                    throw new Error('The `filePath` argument of the `watchJsonFile` function must end with the file extension `.json`.');
                }

                filePath = resolvePath(filePath);

                var isInitData = !fs.existsSync(filePath),
                    isFileProcessing = false,
                    writeTimeout,
                    lastModifiedTime = Date.now();

                if (!data) { data = createDataContext({}); }
                if (!data._isDataContext) { data = createDataContext(data); }

                fs.watchFile(filePath, (curr, prev) => {

                    if (lastModifiedTime > curr.mtimeMs) { return; }

                    readFileSync();
                });

                data.on('-change', (event) => {

                    writeFileSync();

                    // I am alive.
                    return true;
                });

                if (isInitData) { Promise.resolve().then(writeFileSync); }
                else { readFileSync(); }

                return data;


                function resolvePath(pathToFile) {

                    var filePath = path.resolve(path.parse(process.argv[1]).dir.split("node_modules").shift(), pathToFile);

                    if (!fs.existsSync(path.parse(filePath).dir)) {

                        fs.mkdirSync(
                            path.parse(filePath).dir,
                            { recursive: true }
                        );
                    }
                    return filePath;
                }
                function readFileSync() {

                    if (!enableFileReadWrite || !fs.existsSync(filePath)) { return; }

                    var str = fs.readFileSync(
                        filePath,
                        { encoding: 'utf8' }
                    );

                    loadData(str);
                }
                function loadData(str) {

                    try {
                        var obj = str ? createDataContext.parse(str) : {};
                        data.resetChanges();
                        data = syncData(data, obj, removeUnusedKeys);

                        var strChanges = data.stringifyChanges();

                        if (onDataChange) {

                            setTimeout(onDataChange, 0, { strChanges, strJson: str, datacontext: data });
                        }

                        if (onFileChange) {

                            setTimeout(onFileChange, 0, { strChanges, strJson: str, datacontext: data });
                        }
                    }
                    catch (err) {

                        if (typeof isDebug === 'boolean' && isDebug) {

                            pError(err);
                        }
                    }
                }
                function writeFileSync() {

                    if (!enableFileReadWrite) { return; }

                    clearTimeout(writeTimeout);

                    writeTimeout = setTimeout(function () {

                        wait(write);
                    }, 5000);


                    function write() {

                        if (!isInitData && !data.isChanged) { return; }

                        isFileProcessing = true;

                        var strChanges = data.stringifyChanges(),
                            strJson = createDataContext.stringify(data, null, 2);

                        isInitData = false;

                        fs.writeFileSync(filePath, strJson, { encoding: 'utf8', flag: 'w', flush: true });

                        //data.resetChanges();
                        lastModifiedTime = Date.now();
                        isFileProcessing = false;

                        if (onDataChange) {

                            setTimeout(onDataChange, 0, { strChanges, strJson, datacontext: data });
                        }
                    }
                }
                function wait(cb) {

                    if (isFileProcessing) { return setTimeout(wait, 100, cb); }

                    cb();
                }
            }

            Object.defineProperties(createDataContext, {

                watchJsonFile: { value: watchJsonFile, configurable: false, enumerable: false, writable: false },
                //isSaveChanges
                enableFileReadWrite: {
                    configurable: false, enumerable: false,
                    get: function () { return enableFileReadWrite; },
                    set: function (val) { enableFileReadWrite = Boolean(val); }
                }
            });
        }

        Object.defineProperties(createDataContext, {

            createDataContext: { value: createDataContext, configurable: false, enumerable: false, writable: false },

            syncData: { value: syncData, configurable: false, enumerable: false, writable: false },

            parse: { value: parse, configurable: false, enumerable: false, writable: false },

            stringify: { value: stringify, configurable: false, enumerable: false, writable: false },

            ignoreMetadata: {
                configurable: false, enumerable: false,
                get: function () { return ignoreMetadata; },
                set: function (val) { ignoreMetadata = Boolean(val); }
            }
        });

        // Debugging
        function pDebug(...args) { if (isDebug) { console.log(`[ DEBUG ] `, ...args); } }
        function pWarn(...args) { if (isDebug) { console.warn(`[ WARN ] `, ...args); } }
        function pError(...args) { if (isDebug) { console.error(`[ ERROR ] `, ...args); } }

        return createDataContext;
    });


    /**
     * Exporting the library as a module.
     * @param {string} exportIdentifier Export identifier
     * @param {() => any} factory Factory function
     * @returns {void} Returns export library
     */
    function exportModule(exportIdentifier, factory) {

        var thisScope = "undefined" != typeof globalThis
            ? globalThis
            : "undefined" != typeof window
                ? window
                : "undefined" != typeof global
                    ? global : "undefined" != typeof self
                        ? self
                        : {};

        if (!thisScope.modules) { thisScope.modules = {}; }

        if (typeof exports === 'object' && typeof module !== 'undefined') {
            // CommonJS
            return module.exports = factory.call(thisScope);
        }

        // Browser
        thisScope.modules[exportIdentifier] = factory.call(thisScope);
    }
})();