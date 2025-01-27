
/**  Copyright (c) 2024, Manuel Lõhmus (MIT License). */

"use strict";

(function () {

    exportModule("data-context", function factory() {


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

                    value: function toString() {

                        if (type === "object") { return "{" + Object.keys(this).map(function (k) { return _string(k) + ":" + _string(value[k]); }).join(",") + "}"; }
                        if (type === "array") { return "[" + this.map(function (v) { return _string(v); }).join(",") + "]"; }

                        return "undefined";

                        function _string(val) {

                            if (val?._isDataContext) { return val.toString(); }

                            var t = typeof val;

                            if (t === "string") { return '"' + val + '"'; }
                            if (t === "boolean") { return Boolean.prototype.toString.call(val); }
                            if (t === "number") { return Number.prototype.toString.call(val); }
                            if (val === null) { return "null"; }
                            if (Array.isArray(val)) { return "[" + val.map(function (v) { return _string(v); }).join(",") + "]"; }
                            if (t === "object") { return "{" + Object.keys(val).map(function (k) { return _string(k) + ":" + _string(val[k]); }).join(",") + "}"; }

                            return "undefined";
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
                    value: function emit(eventName, ...params) {

                        var ret = this.emit(eventName, ...params);

                        if (parent && typeof parent.emitToParent === "function") {

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

        //#region *** Handler ***

        var handler = { deleteProperty, set };

        function deleteProperty(target, property) {

            if (target.propertyIsEnumerable(property)) {

                var oldValue = target[property],
                    newValue = undefined;

                var ret = Reflect.deleteProperty(target, property);

                if (oldValue === undefined) {

                    //console.log("? del: oldValue is undefined", property, { target, propertyPath: [property], oldValue, newValue });
                    target.emitToParent("-", { eventName: "delete", target, propertyPath: [property], oldValue, newValue });
                    target.emitToParent(property, { eventName: "delete", target, propertyPath: [property], oldValue, newValue });
                }
                //else if (oldValue._parent === null) {

                //    //console.log("'-delete' del: oldValue._parent is null", property, { target, propertyPath: [property], oldValue, newValue });
                //    target.emitToParent("-delete", { target, propertyPath: [property], oldValue, newValue });
                //    target.emitToParent(property, { eventName: "delete", target, propertyPath: [property], oldValue, newValue });
                //}
                else {

                    //console.log("'-delete' del: oldValue is ", property, event);
                    target.emitToParent("-", { eventName: "delete", target, propertyPath: [property], oldValue, newValue });
                    target.emitToParent(property, { eventName: "delete", target, propertyPath: [property], oldValue, newValue });
                }

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

                target.emitToParent(property, { eventName: "delete", target, propertyPath: [property], oldValue, newValue });

                clearTimeout(target.emitToParent.timeout);
                target.emitToParent.timeout = setTimeout(function () {

                    delete target.emitToParent.timeout;
                    target.emitToParent("-change", { eventName: "-change", target, propertyPath: [property], oldValue, newValue });
                });

                return ret;
            }

            return Reflect.deleteProperty(target, property);
        }

        function set(target, property, newValue, proxy) {

            if (target.propertyIsEnumerable(property)
                || target[property] === undefined) {

                var oldValue = target[property],
                    newValue = newValue && newValue._isDataContext ? newValue : createDataContext(newValue, property);


                if (oldValue !== newValue) {

                    var eventName = "";
                    var _modifiedLength = target?._modified.length;

                    var ret = Reflect.set(target, property, newValue, proxy);

                    var isDC = newValue && newValue._isDataContext;
                    var isNew = isDC && newValue._parent !== proxy && oldValue === undefined;
                    isDC && (newValue._isModified = true);
                    isDC && (newValue._parent = proxy);

                    if (isDC && newValue._propertyName !== property) {

                        //console.log("'-reposition' set: newValue propertyName is change ", newValue + "", ">", property, event);
                        eventName = "reposition";
                        newValue._propertyName = property;
                        target.emitToParent("-", { eventName, target, propertyPath: [property], oldValue, newValue });
                    }
                    else if (isDC && isNew) {

                        //console.log("'-new' set: oldValue is undefined", property, event);
                        eventName = "new";
                        target.emitToParent("-", { eventName, target, propertyPath: [property], oldValue, newValue });
                    }
                    else {

                        //console.log("'-set' set: newValue parent is change", property, event);
                        eventName = "set";
                        target.emitToParent("-", { eventName, target, propertyPath: [property], oldValue, newValue });
                    }

                    setModified(target, property);

                    target.emitToParent(property, { eventName, target, propertyPath: [property], oldValue, newValue });

                    clearTimeout(target.emitToParent.timeout);
                    target.emitToParent.timeout = setTimeout(function () {

                        delete target.emitToParent.timeout;

                        if (target?._isModified || target?._modified.length !== _modifiedLength) {

                            target.emitToParent("-change", { eventName: "-change", target, propertyPath: [property], oldValue, newValue });
                        }
                    });

                    return ret;
                }
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
            var _this = isGlobal(this) ? undefined : this;
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

                throw "[ ERROR ] " + e
                + " In parsing position: " + it.position + " '" + it.current + "' => "
                + it.text.substring(it.position < 10 ? 0 : it.position - 10, it.position + 10)
                    .replace(/\r/g, "\\r")
                    .replace(/\n/g, "\\n");
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
                this.text = text + '';
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
            }

            function _get(val, def) {

                if (it.current === '\r' && it.following === '\r'
                    || _typeof(val) !== _typeof(def)) {

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

                if (createDataContext.IgnoreMetadata) { return; }

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

                    var obj = _get(val, {});

                    _setMetadata(obj, meta);

                    while (it.current !== '}' && !it.isInfiniteLoop()) {

                        meta = _whitespace();

                        var k = _key();

                        _whitespace();

                        var v = _value(obj[k]);

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
                    }

                    if (it.current === '}') {

                        it.next();
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

                    var arr = _get(val, []);

                    _setMetadata(arr, meta);

                    var i = 0;

                    while (it.current !== ']' && !it.isInfiniteLoop()) {

                        meta = _whitespace();

                        // for update
                        var index = _index();

                        if (isOverwriting && index === undefined) {

                            throw "Overwriting data -> index must be.";
                        }

                        _whitespace();

                        var v = _value(arr[typeof index === "number" && index || i]);

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
         * Parse a string to an object, asynchronously.
         * @param {any} textOrReadStream Input value.
         * @param {any} reviver Reviver.
         * @param {any} callback Callback. Optional.
         * @returns {Promise} Returns a promise.
         */
        function parsePromise(textOrReadStream, reviver, callback = null) {

            if (textOrReadStream !== null
                && typeof textOrReadStream !== "string"
                && textOrReadStream && typeof textOrReadStream !== "number"
                && !_isStream(textOrReadStream)) {

                return;
            }

            var it = new _it(textOrReadStream);
            var _this = isGlobal(this) ? undefined : this;
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

            return new Promise(function (resolve, reject) {

                try {

                    it.next(function () {

                        _whitespace(function (meta) {

                            _value(_this, function (value) {

                                _setMetadata(value, meta);

                                if (reviver && reviver.name === "_set") {

                                    value = reviver.call(
                                        undefined,
                                        undefined,
                                        value
                                    );
                                }

                                else if (reviver) {

                                    value = reviver.call(
                                        { "": value },
                                        "",
                                        value
                                    );
                                }

                                resolve(value);

                                if (typeof callback === "function") {

                                    callback(null, value);
                                }
                            });
                        });
                    });
                }
                catch (e) {

                    var err = "[ ERROR ] " + e
                        + " In parsing position: " + it.position + " '" + it.current + "' => "
                        + it.text.substring(it.position < 10 ? 0 : it.position - 10, it.position + 10)
                            .replace(/\r/g, "\\r")
                            .replace(/\n/g, "\\n");

                    reject(err);

                    if (typeof callback === "function") {

                        callback(err);
                    }
                }
            });


            function _error(err) {

                reject(err);

                if (typeof callback === "function") {

                    callback(err);
                }
            }

            function _isStream(obj) {

                return obj
                    && typeof obj === "object"
                    && typeof obj.readable === "boolean";
            }

            function _it(text) {

                this.is = _is;
                this.next = _next;
                this.isInfiniteLoop = _isInfiniteLoop;
                this.setPosition = _setPosition;

                var currentPosition = 0;

                if (_isStream(text)) {

                    this.readStream = text;
                    this.text = '';
                    this.current = '';
                    this.following = '';
                    this.position = 0;
                    this.endCallback = null;

                    this.readStream.once("end", function () {

                        if (it.endCallback) {

                            it.endCallback();
                        }
                    })
                }
                else {

                    this.readStream = null;
                    this.text = text + '';
                    this.current = '';
                    this.following = this.text.charAt(0);
                    this.position = 0;
                }


                function _isInfiniteLoop() {

                    if (currentPosition !== this.position) {

                        currentPosition = this.position;

                        return false;
                    }

                    throw "Incorrect entry.";
                }

                function _next(cb) {

                    if (it.readStream?.readable
                        && (it.text.charAt(it.position) === '' || it.text.charAt(it.position + 1) === '')) {

                        return _readStreamText(_next.bind(it, cb));
                    }
                    else {

                        it.current = it.text.charAt(it.position);
                        it.position++;
                        it.following = it.text.charAt(it.position);

                        return cb();
                    }
                }

                function _readStreamText(cb) {

                    var str = it.readStream.read();

                    if (str === null && it.readStream.readable) {

                        it.readStream.once("readable", function () {

                            it.endCallback = cb;

                            return _readStreamText(cb);
                        });
                    }
                    else {

                        it.text += str;

                        if (it.position > 1 && it.position < it.text.length && cb.name === 'bound _next') {

                            it.text = it.text.substring(it.position - 1);
                            it.position = 1;
                            currentPosition = 0;
                        }

                        return cb();
                    }
                }

                function _is(str, cb) {

                    if (it.readStream && it.text.length - it.position < str.length) {

                        return _readStreamText(_is.bind(it, str, cb));
                    }
                    else {

                        return check();
                    }

                    function check() {

                        if (it.text.substring(it.position - 1, it.position - 1 + str.length) === str) {

                            it.position = it.position + str.length;
                            it.current = it.text.charAt(it.position - 1);
                            it.following = it.text.charAt(it.position);

                            return cb(true);
                        }

                        return cb(false);
                    }
                }

                function _setPosition(pos) {

                    this.position = pos;
                    this.current = this.text.charAt(pos - 1);
                    this.following = this.text.charAt(pos);
                }
            }

            function _get(val, def) {

                if (it.current === '\r' && it.following === '\r'
                    || _typeof(val) !== _typeof(def)) {

                    return def;
                }

                return val;
            }

            function _whitespace(cb) {

                var meta = [];
                return whitespace(function () {

                    return _metadata(addMetadata);
                });

                function whitespace(cb) {

                    if (it.current === '\n'
                        || it.current === '\r'
                        || it.current === '\t'
                        || it.current === '\u0020') {

                        return it.next(whitespace.bind(this, cb));
                    }
                    else {

                        return cb();
                    }
                }

                function addMetadata(metadata) {

                    if (metadata) {

                        meta.push(metadata);

                        return whitespace(function () {

                            return _metadata(addMetadata);
                        });
                    }

                    return cb(meta);
                }
            }

            function _metadata(cb) {

                if (it.current === '/' && it.following === '*') {

                    var metadata = '';

                    return it.next(it.next.bind(it, readMetadata));


                    function readMetadata() {

                        if (it.current !== '*' && it.following !== '/') {

                            metadata += it.current;
                            return it.next(readMetadata);
                        }
                        else {

                            return it.next(it.next.bind(it, function () {

                                return cb(metadata);
                            }));
                        }
                    }
                }

                return cb();
            }

            function _setMetadata(obj, metadata, key = '') {

                if (createDataContext.IgnoreMetadata) { return; }

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

            function _value(val, cb) {

                return _object(val, function (obj) {

                    if (obj !== undefined) { return cb(obj); }

                    return _array(val, function (arr) {

                        if (arr !== undefined) { return cb(arr); }

                        return _string(function (str) {

                            if (str !== undefined) { return cb(str); }

                            return _true(function (t) {

                                if (t !== undefined) { return cb(t); }

                                return _false(function (f) {

                                    if (f !== undefined) { return cb(f); }

                                    return _null(function (n) {

                                        if (n !== undefined) { return cb(n); }

                                        return _number(function (num) {

                                            if (num !== undefined) { return cb(num); }

                                            return cb();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }

            function _string(cb) {

                _whitespace(function (meta) {

                    var str = '';

                    if (it.current === '"') {

                        it.next(function () {

                            //if (!it.current) { return; }

                            addLetter();
                        });
                    }

                    else {

                        Promise.resolve(1)
                            .then(function () { cb(); })
                            .catch(_error);
                    }


                    function addLetter() {

                        if (it.current && it.current !== '"') {

                            str += it.current;
                            it.next(addLetter);
                        }

                        else if (it.current === '"') {

                            it.next(function () {

                                Promise.resolve(1)
                                    .then(function () { cb(str); })
                                    .catch(_error);
                            });
                        }

                        else {

                            throw "Incorrect string separator.";
                        }
                    }
                });
            }

            function _number(cb) {

                _whitespace(function (meta) {

                    var str = "";
                    _negative(function (negative) {

                        str += negative;

                        if (it.current === "0") {

                            str += "0";

                            it.next(function () {

                                if (it.current.toLowerCase() === "x") {

                                    str += "x";

                                    hex(cb);
                                }

                                else {

                                    fraction(cb);
                                }
                            });
                        }
                        else {

                            return _digit(function (digit) {

                                str += digit;

                                fraction(cb);
                            });
                        }


                        function hex(cb) {

                            it.next(function () {

                                _hex(function (hex) {

                                    str += hex;
                                    ret(cb);
                                });
                            });
                        }

                        function fraction(cb) {

                            if (it.current === ".") {

                                str += ".";

                                it.next(function () {

                                    _digit(function (digit) {

                                        str += digit;
                                        exponent(cb);
                                    });
                                });
                            }

                            else {

                                ret(cb);
                            }
                        }

                        function exponent(cb) {

                            if (it.current && "eE".includes(it.current)) {

                                str += "e";

                                it.next(function () {

                                    _negative(function (negative) {

                                        str += negative;

                                        _positive(function (positive) {

                                            str += positive;

                                            _digit(function (digit) {

                                                str += digit;

                                                ret(cb);
                                            });
                                        });
                                    });
                                });
                            }

                            else {

                                ret(cb);
                            }
                        }

                        function ret(cb) {

                            if (!str) {

                                Promise.resolve(1)
                                    .then(function () { cb(); })
                                    .catch(_error);
                            }

                            else {

                                str = JSON.parse(str);

                                Promise.resolve(1)
                                    .then(function () { cb(str); })
                                    .catch(_error);
                            }
                        }
                    });
                });
            }

            function _negative(cb) {

                if (it.current === '-') {

                    it.next(function () { return cb('-'); });
                }

                else {

                    cb('');
                }
            }

            function _positive(cb) {

                if (it.current === '+') {

                    it.next(function () { return cb('+'); });
                }

                else {

                    cb('');
                }
            }

            function _hex(cb) {

                var str = '';

                add();


                function add() {

                    if (it.current && "0123456789aAbBcCdDeEfF".includes(it.current)) {

                        str += it.current;
                        it.next(add);
                    }

                    else {

                        cb(str);
                    }
                }
            }

            function _digit(cb) {

                var str = '';

                add();


                function add() {

                    if (it.current && "0123456789".includes(it.current)) {

                        str += it.current;
                        it.next(add);
                    }

                    else {

                        cb(str);
                    }
                }
            }

            function _object(val, cb) {

                _whitespace(function (meta) {

                    if (it.current === '{') {

                        it.next(function () {

                            var obj = _get(val, {});

                            _setMetadata(obj, meta);

                            readKeyVal();


                            function readKeyVal() {

                                if (it.current !== '}' && !it.isInfiniteLoop()) {

                                    readKey();
                                }

                                else if (it.current === '}') {

                                    it.next(function () {

                                        Promise.resolve(1)
                                            .then(function () { cb(obj); })
                                            .catch(_error);
                                    });
                                }

                                else {

                                    Promise.resolve(1)
                                        .then(function () { cb(obj); })
                                        .catch(_error);
                                }
                            }

                            function readKey() {

                                _whitespace(function (meta) {

                                    _key(function (k) {

                                        _whitespace(function () {

                                            readVal(k, meta);
                                        });
                                    });
                                });
                            }

                            function readVal(k, meta) {

                                _value(obj[k], function (v) {

                                    _whitespace(function () {

                                        if (it.current !== ',' && it.current !== '}') {

                                            throw "Incorrect object separator.";
                                        }

                                        if (it.current === ',') {

                                            it.next(function () {

                                                set(k, v, meta);
                                            });
                                        }

                                        else {

                                            set(k, v, meta);
                                        }
                                    });
                                });
                            }

                            function set(k, v, meta) {

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

                                    Promise.resolve(1)
                                        .then(function () { readKeyVal(); })
                                        .catch(_error);
                                }
                            }
                        });
                    }

                    else {

                        Promise.resolve(1)
                            .then(function () { cb(); })
                            .catch(_error);
                    }
                });
            }

            function _key(cb) {

                _whitespace(function () {

                    if (it.current === ":") {

                        throw "Invalid object key.";
                    }

                    _string(function (key) {

                        _whitespace(function () {

                            if (typeof key !== "string" || it.current !== ":") {

                                throw "Invalid object key.";
                            }
                            else {

                                it.next(function () {

                                    Promise.resolve(1)
                                        .then(function () { cb(key); })
                                        .catch(_error);
                                });
                            }
                        });
                    });
                });
            }

            function _array(val, cb) {

                _whitespace(function (meta) {

                    if (it.current === '[') {

                        it.next(function () {

                            var arr = _get(val, []);

                            _setMetadata(arr, meta);

                            var i = 0;

                            readIndexVal();


                            function readIndexVal() {

                                if (it.current !== ']' && !it.isInfiniteLoop()) {

                                    readIndex();
                                }

                                else if (it.current === ']') {

                                    it.next(function () {

                                        Promise.resolve(1)
                                            .then(function () { cb(arr); })
                                            .catch(_error);
                                    });
                                }

                                else {

                                    Promise.resolve(1)
                                        .then(function () { cb(arr); })
                                        .catch(_error);
                                }
                            }

                            function readIndex() {

                                _whitespace(function (meta) {

                                    // for update
                                    _index(function (index) {

                                        if (isOverwriting && index === undefined) {

                                            throw "Overwriting data -> index must be.";
                                        }

                                        _whitespace(function () {

                                            readVal(index, meta);
                                        });
                                    });
                                });
                            }

                            function readVal(index, meta) {

                                _value(arr[typeof index === "number" && index || i], function (v) {

                                    _whitespace(function () {

                                        if (it.current !== ',' && it.current !== ']') {

                                            throw "Incorrect array separator.";
                                        }

                                        if (it.current === ',') {

                                            it.next(function () {

                                                set(index, v, meta);
                                            });
                                        }

                                        else {

                                            set(index, v, meta);
                                        }
                                    });
                                });
                            }

                            function set(index, v, meta) {

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

                                Promise.resolve(1)
                                    .then(function () { readIndexVal(); })
                                    .catch(_error);
                            }
                        });
                    }

                    else {

                        Promise.resolve(1)
                            .then(function () { cb(); })
                            .catch(_error);
                    }
                });
            }

            function _index(cb) {

                _whitespace(function () {

                    if (it.current === ":") {

                        throw "Invalid array index.";
                    }

                    var pos = it.position;

                    _number(function (nr) {

                        _whitespace(function () {

                            if (typeof nr !== "number" && it.current === ":") {

                                throw "Invalid array index.";
                            }

                            if (typeof nr === "number" && it.current === ":") {

                                it.next(function () {

                                    Promise.resolve(1)
                                        .then(function () { cb(nr); })
                                        .catch(_error);
                                });
                            }

                            else {

                                it.setPosition(pos);

                                Promise.resolve(1)
                                    .then(function () { cb(); })
                                    .catch(_error);
                            }
                        });
                    });
                });
            }

            function _true(cb) {

                _whitespace(function () {

                    it.is('true', function (is) {

                        Promise.resolve(1)
                            .then(function () { cb(is ? true : undefined); })
                            .catch(_error);
                    });
                });
            }

            function _false(cb) {

                _whitespace(function () {

                    it.is('false', function (is) {

                        Promise.resolve(1)
                            .then(function () { cb(is ? false : undefined); })
                            .catch(_error);
                    });
                });
            }

            function _null(cb) {

                _whitespace(function () {

                    _whitespace(function () {

                        it.is('null', function (is) {

                            Promise.resolve(1)
                                .then(function () { cb(is ? null : undefined); })
                                .catch(_error);
                        });
                    });
                });
            }
        }

        /**
         * Stringify an object.
         * @param {any} value Input value.
         * @param {any} replacer Replacer. Optional. 
         * @param {any} space Space. Optional. 
         * @param {any} options Options. Optional. 
         * @returns {string} Returns a string.
         * 
         * @typedef {Object} Options
         * @property {boolean} modifiedData Select modified data. Optional.
         * @property {boolean} setUnmodified Set unmodified. Optional.
         * @property {WriteStream} writeStream Write stream. Optional.
         * @property {function} callback Callback. Optional.
         */
        function stringify(value, replacer, space, { modifiedData = false, setUnmodified = false, writeStream = null, callback = null } = {}) {

            var strJSON = '';
            var isStream = _isStream(writeStream);
            var isModified = false;


            replacer = _replacer(replacer);

            space = _space(space);

            if (typeof replacer === "function") {

                value = replacer.call(
                    { "": value },
                    "",
                    value
                );
            }

            _value(value, 0, function () {


                if (isStream) {

                    writeStream.end();
                }

                if (typeof callback === "function") {

                    callback();
                }
            });

            return strJSON || undefined;


            function _isStream(obj) {

                return Boolean(obj
                    && typeof obj === "object"
                    && typeof obj.writable === "boolean");
            }

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
                ;
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

            function _metadata(value, level, key = "", cb) {

                if (createDataContext.IgnoreMetadata || !value) { return cb(); }

                var arr = [];
                var i = -1;

                key = key + "";
                key = "-metadata" + (key ? "-" + key : "");

                if (value[key] && !Array.isArray(value[key])) {

                    value[key] = [value[key]];
                }

                write();

                return;

                function write() {

                    i++;

                    if (value[key] && i < value[key].length) {

                        if (space) {

                            // write line
                            return _write(
                                _lineSpace(
                                    '/*' + value[key][i] + '*/' + _newline()
                                    , level
                                ),
                                write
                            );
                        }

                        // write line
                        return _write('/*' + value[key][i] + '*/', write);
                    }

                    return cb();
                }
            }

            function _value(value, level, cb) {


                var type = _typeof(value);

                _meta(function () {

                    if (modifiedData) {

                        //root
                        if (!value?._parent) {

                            _getValue(cb);
                        }
                        //selec all
                        else if (isModified) {

                            _setUnmodified();
                            _getValue(cb);
                        }

                        else if (value?._isModified === true) {

                            var isMod = isModified;
                            isModified = true;
                            _getValue(cb);
                            isModified = isMod;
                            _setUnmodified();
                        }
                        //selec modified
                        else {

                            _setUnmodified();

                            _getValue(cb);
                        }
                    }
                    else { _getValue(cb); }
                });

                return;


                function _meta(cb) {

                    if (level === 0
                        || modifiedData && value?._parent && !isModified && value?._isModified === true) {

                        return _metadata(value, level, '', cb);
                    }

                    return cb();
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

                function _getValue(cb) {

                    if (_object(cb)) { return; }

                    if (_string(cb)) { return; }

                    if (_bool(cb)) { return; }

                    if (_null(cb)) { return; }

                    if (_number(cb)) { return; }

                    return cb();
                }

                function _string(cb) {

                    if (type === "string") {

                        _write('"' + value + '"' + '', cb);

                        return true;
                    }
                }

                function _number(cb) {

                    if (type === "number") {

                        _write(JSON.stringify(value), cb);

                        return true;
                    }
                }

                function _object(cb) {

                    var startChar, isKeyVal, endChar;

                    if (type === "object") { startChar = '{'; isKeyVal = true; endChar = "}"; }
                    else if (type === "array") { startChar = '['; endChar = "]"; }

                    if (startChar && endChar) {

                        // signal of updating the entire object
                        if (modifiedData && value._isModified) {

                            if (value._isModified) {

                                startChar += '\r\r';
                            }
                            else {

                                return cb();
                            }
                        }

                        var keys = modifiedData && !value._isModified && !isModified
                            ? Object.values(value._modified).sort()
                            : Object.keys(value);

                        // write emty object
                        if (!keys.length) {

                            if (modifiedData) {

                                cb();

                                return true;
                            }

                            _write(startChar + endChar, cb);

                            return true;
                        }

                        // write startChar
                        if (space) {

                            startChar += startChar.includes("\r\r") ? "" : _newline();
                        }

                        _write(startChar, function () {

                            _writeValues(function () {

                                if (space) {

                                    return _write(_lineSpace(endChar, level), cb);
                                }

                                return _write(endChar, cb);
                            });
                        });

                        return true;
                    }

                    return;


                    function _writeValues(cb) {

                        var isMod = isModified;
                        isModified = value._isModified;

                        _writeKeyValMeta(keys.shift(), _next);

                        return;


                        function _next() {

                            if (keys.length) {

                                _writeKeyValMeta(keys.shift(), _next);
                            }
                            else {

                                isModified = isMod;

                                if (modifiedData) { value._isModified = false; }

                                _write(_newline(), cb);
                            }
                        }
                    }

                    function _writeKeyValMeta(k, cb) {

                        var val = value[k];

                        if (typeof replacer === "function") {

                            val = replacer.call(
                                value,
                                k,
                                val
                            );
                        }

                        if (val?._isDataContext) {

                            _metadata(val, level + 1, "", _writeKeyVal);
                        }
                        else {

                            _metadata(value, level + 1, k, _writeKeyVal);
                        }

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
                        }

                        function _writeKey(strKey, isStartTrim) {

                            _write(strKey, function () {

                                // write value
                                _value(val, level + 1, function () {

                                    // write separator
                                    _write(keys.length ? ',' + _newline() : '', setUnmodified);

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

                                        return cb();
                                    }
                                });
                            });

                            return;
                        }
                    }
                }

                function _bool(cb) {

                    if (type === "boolean") {

                        _write(value + '', cb);

                        return true;
                    }
                }

                function _null(cb) {

                    if (type === "null") {

                        _write("null", cb);

                        return true;
                    }
                }
            }

            function _write(str, cb) {

                if (!isStream) {

                    strJSON += str;
                    cb();
                }
                else if (str) {

                    // write -> OK
                    if (writeStream.write(str)) {

                        cb();
                    }
                    else {

                        writeStream.once('drain', cb);
                    }
                }
            }
        }

        //#endregion

        createDataContext.createDataContext = createDataContext;
        createDataContext.ignoreMetadata = false;
        createDataContext.parse = parse;
        createDataContext.parsePromise = parsePromise;
        createDataContext.stringify = stringify;

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