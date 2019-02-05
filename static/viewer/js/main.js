(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*!
 * Knockout JavaScript library v3.4.2
 * (c) The Knockout.js team - http://knockoutjs.com/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

(function(){
var DEBUG=true;
(function(undefined){
    // (0, eval)('this') is a robust way of getting a reference to the global object
    // For details, see http://stackoverflow.com/questions/14119988/return-this-0-evalthis/14120023#14120023
    var window = this || (0, eval)('this'),
        document = window['document'],
        navigator = window['navigator'],
        jQueryInstance = window["jQuery"],
        JSON = window["JSON"];
(function(factory) {
    // Support three module loading scenarios
    if (typeof define === 'function' && define['amd']) {
        // [1] AMD anonymous module
        define(['exports', 'require'], factory);
    } else if (typeof exports === 'object' && typeof module === 'object') {
        // [2] CommonJS/Node.js
        factory(module['exports'] || exports);  // module.exports is for Node.js
    } else {
        // [3] No module loader (plain <script> tag) - put directly in global namespace
        factory(window['ko'] = {});
    }
}(function(koExports, amdRequire){
// Internally, all KO objects are attached to koExports (even the non-exported ones whose names will be minified by the closure compiler).
// In the future, the following "ko" variable may be made distinct from "koExports" so that private objects are not externally reachable.
var ko = typeof koExports !== 'undefined' ? koExports : {};
// Google Closure Compiler helpers (used only to make the minified file smaller)
ko.exportSymbol = function(koPath, object) {
    var tokens = koPath.split(".");

    // In the future, "ko" may become distinct from "koExports" (so that non-exported objects are not reachable)
    // At that point, "target" would be set to: (typeof koExports !== "undefined" ? koExports : ko)
    var target = ko;

    for (var i = 0; i < tokens.length - 1; i++)
        target = target[tokens[i]];
    target[tokens[tokens.length - 1]] = object;
};
ko.exportProperty = function(owner, publicName, object) {
    owner[publicName] = object;
};
ko.version = "3.4.2";

ko.exportSymbol('version', ko.version);
// For any options that may affect various areas of Knockout and aren't directly associated with data binding.
ko.options = {
    'deferUpdates': false,
    'useOnlyNativeEvents': false
};

//ko.exportSymbol('options', ko.options);   // 'options' isn't minified
ko.utils = (function () {
    function objectForEach(obj, action) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                action(prop, obj[prop]);
            }
        }
    }

    function extend(target, source) {
        if (source) {
            for(var prop in source) {
                if(source.hasOwnProperty(prop)) {
                    target[prop] = source[prop];
                }
            }
        }
        return target;
    }

    function setPrototypeOf(obj, proto) {
        obj.__proto__ = proto;
        return obj;
    }

    var canSetPrototype = ({ __proto__: [] } instanceof Array);
    var canUseSymbols = !DEBUG && typeof Symbol === 'function';

    // Represent the known event types in a compact way, then at runtime transform it into a hash with event name as key (for fast lookup)
    var knownEvents = {}, knownEventTypesByEventName = {};
    var keyEventTypeName = (navigator && /Firefox\/2/i.test(navigator.userAgent)) ? 'KeyboardEvent' : 'UIEvents';
    knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress'];
    knownEvents['MouseEvents'] = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'];
    objectForEach(knownEvents, function(eventType, knownEventsForType) {
        if (knownEventsForType.length) {
            for (var i = 0, j = knownEventsForType.length; i < j; i++)
                knownEventTypesByEventName[knownEventsForType[i]] = eventType;
        }
    });
    var eventsThatMustBeRegisteredUsingAttachEvent = { 'propertychange': true }; // Workaround for an IE9 issue - https://github.com/SteveSanderson/knockout/issues/406

    // Detect IE versions for bug workarounds (uses IE conditionals, not UA string, for robustness)
    // Note that, since IE 10 does not support conditional comments, the following logic only detects IE < 10.
    // Currently this is by design, since IE 10+ behaves correctly when treated as a standard browser.
    // If there is a future need to detect specific versions of IE10+, we will amend this.
    var ieVersion = document && (function() {
        var version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

        // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
        while (
            div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
            iElems[0]
        ) {}
        return version > 4 ? version : undefined;
    }());
    var isIe6 = ieVersion === 6,
        isIe7 = ieVersion === 7;

    function isClickOnCheckableElement(element, eventType) {
        if ((ko.utils.tagNameLower(element) !== "input") || !element.type) return false;
        if (eventType.toLowerCase() != "click") return false;
        var inputType = element.type;
        return (inputType == "checkbox") || (inputType == "radio");
    }

    // For details on the pattern for changing node classes
    // see: https://github.com/knockout/knockout/issues/1597
    var cssClassNameRegex = /\S+/g;

    function toggleDomNodeCssClass(node, classNames, shouldHaveClass) {
        var addOrRemoveFn;
        if (classNames) {
            if (typeof node.classList === 'object') {
                addOrRemoveFn = node.classList[shouldHaveClass ? 'add' : 'remove'];
                ko.utils.arrayForEach(classNames.match(cssClassNameRegex), function(className) {
                    addOrRemoveFn.call(node.classList, className);
                });
            } else if (typeof node.className['baseVal'] === 'string') {
                // SVG tag .classNames is an SVGAnimatedString instance
                toggleObjectClassPropertyString(node.className, 'baseVal', classNames, shouldHaveClass);
            } else {
                // node.className ought to be a string.
                toggleObjectClassPropertyString(node, 'className', classNames, shouldHaveClass);
            }
        }
    }

    function toggleObjectClassPropertyString(obj, prop, classNames, shouldHaveClass) {
        // obj/prop is either a node/'className' or a SVGAnimatedString/'baseVal'.
        var currentClassNames = obj[prop].match(cssClassNameRegex) || [];
        ko.utils.arrayForEach(classNames.match(cssClassNameRegex), function(className) {
            ko.utils.addOrRemoveItem(currentClassNames, className, shouldHaveClass);
        });
        obj[prop] = currentClassNames.join(" ");
    }

    return {
        fieldsIncludedWithJsonPost: ['authenticity_token', /^__RequestVerificationToken(_.*)?$/],

        arrayForEach: function (array, action) {
            for (var i = 0, j = array.length; i < j; i++)
                action(array[i], i);
        },

        arrayIndexOf: function (array, item) {
            if (typeof Array.prototype.indexOf == "function")
                return Array.prototype.indexOf.call(array, item);
            for (var i = 0, j = array.length; i < j; i++)
                if (array[i] === item)
                    return i;
            return -1;
        },

        arrayFirst: function (array, predicate, predicateOwner) {
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate.call(predicateOwner, array[i], i))
                    return array[i];
            return null;
        },

        arrayRemoveItem: function (array, itemToRemove) {
            var index = ko.utils.arrayIndexOf(array, itemToRemove);
            if (index > 0) {
                array.splice(index, 1);
            }
            else if (index === 0) {
                array.shift();
            }
        },

        arrayGetDistinctValues: function (array) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(result, array[i]) < 0)
                    result.push(array[i]);
            }
            return result;
        },

        arrayMap: function (array, mapping) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                result.push(mapping(array[i], i));
            return result;
        },

        arrayFilter: function (array, predicate) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate(array[i], i))
                    result.push(array[i]);
            return result;
        },

        arrayPushAll: function (array, valuesToPush) {
            if (valuesToPush instanceof Array)
                array.push.apply(array, valuesToPush);
            else
                for (var i = 0, j = valuesToPush.length; i < j; i++)
                    array.push(valuesToPush[i]);
            return array;
        },

        addOrRemoveItem: function(array, value, included) {
            var existingEntryIndex = ko.utils.arrayIndexOf(ko.utils.peekObservable(array), value);
            if (existingEntryIndex < 0) {
                if (included)
                    array.push(value);
            } else {
                if (!included)
                    array.splice(existingEntryIndex, 1);
            }
        },

        canSetPrototype: canSetPrototype,

        extend: extend,

        setPrototypeOf: setPrototypeOf,

        setPrototypeOfOrExtend: canSetPrototype ? setPrototypeOf : extend,

        objectForEach: objectForEach,

        objectMap: function(source, mapping) {
            if (!source)
                return source;
            var target = {};
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    target[prop] = mapping(source[prop], prop, source);
                }
            }
            return target;
        },

        emptyDomNode: function (domNode) {
            while (domNode.firstChild) {
                ko.removeNode(domNode.firstChild);
            }
        },

        moveCleanedNodesToContainerElement: function(nodes) {
            // Ensure it's a real array, as we're about to reparent the nodes and
            // we don't want the underlying collection to change while we're doing that.
            var nodesArray = ko.utils.makeArray(nodes);
            var templateDocument = (nodesArray[0] && nodesArray[0].ownerDocument) || document;

            var container = templateDocument.createElement('div');
            for (var i = 0, j = nodesArray.length; i < j; i++) {
                container.appendChild(ko.cleanNode(nodesArray[i]));
            }
            return container;
        },

        cloneNodes: function (nodesArray, shouldCleanNodes) {
            for (var i = 0, j = nodesArray.length, newNodesArray = []; i < j; i++) {
                var clonedNode = nodesArray[i].cloneNode(true);
                newNodesArray.push(shouldCleanNodes ? ko.cleanNode(clonedNode) : clonedNode);
            }
            return newNodesArray;
        },

        setDomNodeChildren: function (domNode, childNodes) {
            ko.utils.emptyDomNode(domNode);
            if (childNodes) {
                for (var i = 0, j = childNodes.length; i < j; i++)
                    domNode.appendChild(childNodes[i]);
            }
        },

        replaceDomNodes: function (nodeToReplaceOrNodeArray, newNodesArray) {
            var nodesToReplaceArray = nodeToReplaceOrNodeArray.nodeType ? [nodeToReplaceOrNodeArray] : nodeToReplaceOrNodeArray;
            if (nodesToReplaceArray.length > 0) {
                var insertionPoint = nodesToReplaceArray[0];
                var parent = insertionPoint.parentNode;
                for (var i = 0, j = newNodesArray.length; i < j; i++)
                    parent.insertBefore(newNodesArray[i], insertionPoint);
                for (var i = 0, j = nodesToReplaceArray.length; i < j; i++) {
                    ko.removeNode(nodesToReplaceArray[i]);
                }
            }
        },

        fixUpContinuousNodeArray: function(continuousNodeArray, parentNode) {
            // Before acting on a set of nodes that were previously outputted by a template function, we have to reconcile
            // them against what is in the DOM right now. It may be that some of the nodes have already been removed, or that
            // new nodes might have been inserted in the middle, for example by a binding. Also, there may previously have been
            // leading comment nodes (created by rewritten string-based templates) that have since been removed during binding.
            // So, this function translates the old "map" output array into its best guess of the set of current DOM nodes.
            //
            // Rules:
            //   [A] Any leading nodes that have been removed should be ignored
            //       These most likely correspond to memoization nodes that were already removed during binding
            //       See https://github.com/knockout/knockout/pull/440
            //   [B] Any trailing nodes that have been remove should be ignored
            //       This prevents the code here from adding unrelated nodes to the array while processing rule [C]
            //       See https://github.com/knockout/knockout/pull/1903
            //   [C] We want to output a continuous series of nodes. So, ignore any nodes that have already been removed,
            //       and include any nodes that have been inserted among the previous collection

            if (continuousNodeArray.length) {
                // The parent node can be a virtual element; so get the real parent node
                parentNode = (parentNode.nodeType === 8 && parentNode.parentNode) || parentNode;

                // Rule [A]
                while (continuousNodeArray.length && continuousNodeArray[0].parentNode !== parentNode)
                    continuousNodeArray.splice(0, 1);

                // Rule [B]
                while (continuousNodeArray.length > 1 && continuousNodeArray[continuousNodeArray.length - 1].parentNode !== parentNode)
                    continuousNodeArray.length--;

                // Rule [C]
                if (continuousNodeArray.length > 1) {
                    var current = continuousNodeArray[0], last = continuousNodeArray[continuousNodeArray.length - 1];
                    // Replace with the actual new continuous node set
                    continuousNodeArray.length = 0;
                    while (current !== last) {
                        continuousNodeArray.push(current);
                        current = current.nextSibling;
                    }
                    continuousNodeArray.push(last);
                }
            }
            return continuousNodeArray;
        },

        setOptionNodeSelectionState: function (optionNode, isSelected) {
            // IE6 sometimes throws "unknown error" if you try to write to .selected directly, whereas Firefox struggles with setAttribute. Pick one based on browser.
            if (ieVersion < 7)
                optionNode.setAttribute("selected", isSelected);
            else
                optionNode.selected = isSelected;
        },

        stringTrim: function (string) {
            return string === null || string === undefined ? '' :
                string.trim ?
                    string.trim() :
                    string.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
        },

        stringStartsWith: function (string, startsWith) {
            string = string || "";
            if (startsWith.length > string.length)
                return false;
            return string.substring(0, startsWith.length) === startsWith;
        },

        domNodeIsContainedBy: function (node, containedByNode) {
            if (node === containedByNode)
                return true;
            if (node.nodeType === 11)
                return false; // Fixes issue #1162 - can't use node.contains for document fragments on IE8
            if (containedByNode.contains)
                return containedByNode.contains(node.nodeType === 3 ? node.parentNode : node);
            if (containedByNode.compareDocumentPosition)
                return (containedByNode.compareDocumentPosition(node) & 16) == 16;
            while (node && node != containedByNode) {
                node = node.parentNode;
            }
            return !!node;
        },

        domNodeIsAttachedToDocument: function (node) {
            return ko.utils.domNodeIsContainedBy(node, node.ownerDocument.documentElement);
        },

        anyDomNodeIsAttachedToDocument: function(nodes) {
            return !!ko.utils.arrayFirst(nodes, ko.utils.domNodeIsAttachedToDocument);
        },

        tagNameLower: function(element) {
            // For HTML elements, tagName will always be upper case; for XHTML elements, it'll be lower case.
            // Possible future optimization: If we know it's an element from an XHTML document (not HTML),
            // we don't need to do the .toLowerCase() as it will always be lower case anyway.
            return element && element.tagName && element.tagName.toLowerCase();
        },

        catchFunctionErrors: function (delegate) {
            return ko['onError'] ? function () {
                try {
                    return delegate.apply(this, arguments);
                } catch (e) {
                    ko['onError'] && ko['onError'](e);
                    throw e;
                }
            } : delegate;
        },

        setTimeout: function (handler, timeout) {
            return setTimeout(ko.utils.catchFunctionErrors(handler), timeout);
        },

        deferError: function (error) {
            setTimeout(function () {
                ko['onError'] && ko['onError'](error);
                throw error;
            }, 0);
        },

        registerEventHandler: function (element, eventType, handler) {
            var wrappedHandler = ko.utils.catchFunctionErrors(handler);

            var mustUseAttachEvent = ieVersion && eventsThatMustBeRegisteredUsingAttachEvent[eventType];
            if (!ko.options['useOnlyNativeEvents'] && !mustUseAttachEvent && jQueryInstance) {
                jQueryInstance(element)['bind'](eventType, wrappedHandler);
            } else if (!mustUseAttachEvent && typeof element.addEventListener == "function")
                element.addEventListener(eventType, wrappedHandler, false);
            else if (typeof element.attachEvent != "undefined") {
                var attachEventHandler = function (event) { wrappedHandler.call(element, event); },
                    attachEventName = "on" + eventType;
                element.attachEvent(attachEventName, attachEventHandler);

                // IE does not dispose attachEvent handlers automatically (unlike with addEventListener)
                // so to avoid leaks, we have to remove them manually. See bug #856
                ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                    element.detachEvent(attachEventName, attachEventHandler);
                });
            } else
                throw new Error("Browser doesn't support addEventListener or attachEvent");
        },

        triggerEvent: function (element, eventType) {
            if (!(element && element.nodeType))
                throw new Error("element must be a DOM node when calling triggerEvent");

            // For click events on checkboxes and radio buttons, jQuery toggles the element checked state *after* the
            // event handler runs instead of *before*. (This was fixed in 1.9 for checkboxes but not for radio buttons.)
            // IE doesn't change the checked state when you trigger the click event using "fireEvent".
            // In both cases, we'll use the click method instead.
            var useClickWorkaround = isClickOnCheckableElement(element, eventType);

            if (!ko.options['useOnlyNativeEvents'] && jQueryInstance && !useClickWorkaround) {
                jQueryInstance(element)['trigger'](eventType);
            } else if (typeof document.createEvent == "function") {
                if (typeof element.dispatchEvent == "function") {
                    var eventCategory = knownEventTypesByEventName[eventType] || "HTMLEvents";
                    var event = document.createEvent(eventCategory);
                    event.initEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
                    element.dispatchEvent(event);
                }
                else
                    throw new Error("The supplied element doesn't support dispatchEvent");
            } else if (useClickWorkaround && element.click) {
                element.click();
            } else if (typeof element.fireEvent != "undefined") {
                element.fireEvent("on" + eventType);
            } else {
                throw new Error("Browser doesn't support triggering events");
            }
        },

        unwrapObservable: function (value) {
            return ko.isObservable(value) ? value() : value;
        },

        peekObservable: function (value) {
            return ko.isObservable(value) ? value.peek() : value;
        },

        toggleDomNodeCssClass: toggleDomNodeCssClass,

        setTextContent: function(element, textContent) {
            var value = ko.utils.unwrapObservable(textContent);
            if ((value === null) || (value === undefined))
                value = "";

            // We need there to be exactly one child: a text node.
            // If there are no children, more than one, or if it's not a text node,
            // we'll clear everything and create a single text node.
            var innerTextNode = ko.virtualElements.firstChild(element);
            if (!innerTextNode || innerTextNode.nodeType != 3 || ko.virtualElements.nextSibling(innerTextNode)) {
                ko.virtualElements.setDomNodeChildren(element, [element.ownerDocument.createTextNode(value)]);
            } else {
                innerTextNode.data = value;
            }

            ko.utils.forceRefresh(element);
        },

        setElementName: function(element, name) {
            element.name = name;

            // Workaround IE 6/7 issue
            // - https://github.com/SteveSanderson/knockout/issues/197
            // - http://www.matts411.com/post/setting_the_name_attribute_in_ie_dom/
            if (ieVersion <= 7) {
                try {
                    element.mergeAttributes(document.createElement("<input name='" + element.name + "'/>"), false);
                }
                catch(e) {} // For IE9 with doc mode "IE9 Standards" and browser mode "IE9 Compatibility View"
            }
        },

        forceRefresh: function(node) {
            // Workaround for an IE9 rendering bug - https://github.com/SteveSanderson/knockout/issues/209
            if (ieVersion >= 9) {
                // For text nodes and comment nodes (most likely virtual elements), we will have to refresh the container
                var elem = node.nodeType == 1 ? node : node.parentNode;
                if (elem.style)
                    elem.style.zoom = elem.style.zoom;
            }
        },

        ensureSelectElementIsRenderedCorrectly: function(selectElement) {
            // Workaround for IE9 rendering bug - it doesn't reliably display all the text in dynamically-added select boxes unless you force it to re-render by updating the width.
            // (See https://github.com/SteveSanderson/knockout/issues/312, http://stackoverflow.com/questions/5908494/select-only-shows-first-char-of-selected-option)
            // Also fixes IE7 and IE8 bug that causes selects to be zero width if enclosed by 'if' or 'with'. (See issue #839)
            if (ieVersion) {
                var originalWidth = selectElement.style.width;
                selectElement.style.width = 0;
                selectElement.style.width = originalWidth;
            }
        },

        range: function (min, max) {
            min = ko.utils.unwrapObservable(min);
            max = ko.utils.unwrapObservable(max);
            var result = [];
            for (var i = min; i <= max; i++)
                result.push(i);
            return result;
        },

        makeArray: function(arrayLikeObject) {
            var result = [];
            for (var i = 0, j = arrayLikeObject.length; i < j; i++) {
                result.push(arrayLikeObject[i]);
            };
            return result;
        },

        createSymbolOrString: function(identifier) {
            return canUseSymbols ? Symbol(identifier) : identifier;
        },

        isIe6 : isIe6,
        isIe7 : isIe7,
        ieVersion : ieVersion,

        getFormFields: function(form, fieldName) {
            var fields = ko.utils.makeArray(form.getElementsByTagName("input")).concat(ko.utils.makeArray(form.getElementsByTagName("textarea")));
            var isMatchingField = (typeof fieldName == 'string')
                ? function(field) { return field.name === fieldName }
                : function(field) { return fieldName.test(field.name) }; // Treat fieldName as regex or object containing predicate
            var matches = [];
            for (var i = fields.length - 1; i >= 0; i--) {
                if (isMatchingField(fields[i]))
                    matches.push(fields[i]);
            };
            return matches;
        },

        parseJson: function (jsonString) {
            if (typeof jsonString == "string") {
                jsonString = ko.utils.stringTrim(jsonString);
                if (jsonString) {
                    if (JSON && JSON.parse) // Use native parsing where available
                        return JSON.parse(jsonString);
                    return (new Function("return " + jsonString))(); // Fallback on less safe parsing for older browsers
                }
            }
            return null;
        },

        stringifyJson: function (data, replacer, space) {   // replacer and space are optional
            if (!JSON || !JSON.stringify)
                throw new Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
            return JSON.stringify(ko.utils.unwrapObservable(data), replacer, space);
        },

        postJson: function (urlOrForm, data, options) {
            options = options || {};
            var params = options['params'] || {};
            var includeFields = options['includeFields'] || this.fieldsIncludedWithJsonPost;
            var url = urlOrForm;

            // If we were given a form, use its 'action' URL and pick out any requested field values
            if((typeof urlOrForm == 'object') && (ko.utils.tagNameLower(urlOrForm) === "form")) {
                var originalForm = urlOrForm;
                url = originalForm.action;
                for (var i = includeFields.length - 1; i >= 0; i--) {
                    var fields = ko.utils.getFormFields(originalForm, includeFields[i]);
                    for (var j = fields.length - 1; j >= 0; j--)
                        params[fields[j].name] = fields[j].value;
                }
            }

            data = ko.utils.unwrapObservable(data);
            var form = document.createElement("form");
            form.style.display = "none";
            form.action = url;
            form.method = "post";
            for (var key in data) {
                // Since 'data' this is a model object, we include all properties including those inherited from its prototype
                var input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = ko.utils.stringifyJson(ko.utils.unwrapObservable(data[key]));
                form.appendChild(input);
            }
            objectForEach(params, function(key, value) {
                var input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = value;
                form.appendChild(input);
            });
            document.body.appendChild(form);
            options['submitter'] ? options['submitter'](form) : form.submit();
            setTimeout(function () { form.parentNode.removeChild(form); }, 0);
        }
    }
}());

ko.exportSymbol('utils', ko.utils);
ko.exportSymbol('utils.arrayForEach', ko.utils.arrayForEach);
ko.exportSymbol('utils.arrayFirst', ko.utils.arrayFirst);
ko.exportSymbol('utils.arrayFilter', ko.utils.arrayFilter);
ko.exportSymbol('utils.arrayGetDistinctValues', ko.utils.arrayGetDistinctValues);
ko.exportSymbol('utils.arrayIndexOf', ko.utils.arrayIndexOf);
ko.exportSymbol('utils.arrayMap', ko.utils.arrayMap);
ko.exportSymbol('utils.arrayPushAll', ko.utils.arrayPushAll);
ko.exportSymbol('utils.arrayRemoveItem', ko.utils.arrayRemoveItem);
ko.exportSymbol('utils.extend', ko.utils.extend);
ko.exportSymbol('utils.fieldsIncludedWithJsonPost', ko.utils.fieldsIncludedWithJsonPost);
ko.exportSymbol('utils.getFormFields', ko.utils.getFormFields);
ko.exportSymbol('utils.peekObservable', ko.utils.peekObservable);
ko.exportSymbol('utils.postJson', ko.utils.postJson);
ko.exportSymbol('utils.parseJson', ko.utils.parseJson);
ko.exportSymbol('utils.registerEventHandler', ko.utils.registerEventHandler);
ko.exportSymbol('utils.stringifyJson', ko.utils.stringifyJson);
ko.exportSymbol('utils.range', ko.utils.range);
ko.exportSymbol('utils.toggleDomNodeCssClass', ko.utils.toggleDomNodeCssClass);
ko.exportSymbol('utils.triggerEvent', ko.utils.triggerEvent);
ko.exportSymbol('utils.unwrapObservable', ko.utils.unwrapObservable);
ko.exportSymbol('utils.objectForEach', ko.utils.objectForEach);
ko.exportSymbol('utils.addOrRemoveItem', ko.utils.addOrRemoveItem);
ko.exportSymbol('utils.setTextContent', ko.utils.setTextContent);
ko.exportSymbol('unwrap', ko.utils.unwrapObservable); // Convenient shorthand, because this is used so commonly

if (!Function.prototype['bind']) {
    // Function.prototype.bind is a standard part of ECMAScript 5th Edition (December 2009, http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf)
    // In case the browser doesn't implement it natively, provide a JavaScript implementation. This implementation is based on the one in prototype.js
    Function.prototype['bind'] = function (object) {
        var originalFunction = this;
        if (arguments.length === 1) {
            return function () {
                return originalFunction.apply(object, arguments);
            };
        } else {
            var partialArgs = Array.prototype.slice.call(arguments, 1);
            return function () {
                var args = partialArgs.slice(0);
                args.push.apply(args, arguments);
                return originalFunction.apply(object, args);
            };
        }
    };
}

ko.utils.domData = new (function () {
    var uniqueId = 0;
    var dataStoreKeyExpandoPropertyName = "__ko__" + (new Date).getTime();
    var dataStore = {};

    function getAll(node, createIfNotFound) {
        var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
        var hasExistingDataStore = dataStoreKey && (dataStoreKey !== "null") && dataStore[dataStoreKey];
        if (!hasExistingDataStore) {
            if (!createIfNotFound)
                return undefined;
            dataStoreKey = node[dataStoreKeyExpandoPropertyName] = "ko" + uniqueId++;
            dataStore[dataStoreKey] = {};
        }
        return dataStore[dataStoreKey];
    }

    return {
        get: function (node, key) {
            var allDataForNode = getAll(node, false);
            return allDataForNode === undefined ? undefined : allDataForNode[key];
        },
        set: function (node, key, value) {
            if (value === undefined) {
                // Make sure we don't actually create a new domData key if we are actually deleting a value
                if (getAll(node, false) === undefined)
                    return;
            }
            var allDataForNode = getAll(node, true);
            allDataForNode[key] = value;
        },
        clear: function (node) {
            var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
            if (dataStoreKey) {
                delete dataStore[dataStoreKey];
                node[dataStoreKeyExpandoPropertyName] = null;
                return true; // Exposing "did clean" flag purely so specs can infer whether things have been cleaned up as intended
            }
            return false;
        },

        nextKey: function () {
            return (uniqueId++) + dataStoreKeyExpandoPropertyName;
        }
    };
})();

ko.exportSymbol('utils.domData', ko.utils.domData);
ko.exportSymbol('utils.domData.clear', ko.utils.domData.clear); // Exporting only so specs can clear up after themselves fully

ko.utils.domNodeDisposal = new (function () {
    var domDataKey = ko.utils.domData.nextKey();
    var cleanableNodeTypes = { 1: true, 8: true, 9: true };       // Element, Comment, Document
    var cleanableNodeTypesWithDescendants = { 1: true, 9: true }; // Element, Document

    function getDisposeCallbacksCollection(node, createIfNotFound) {
        var allDisposeCallbacks = ko.utils.domData.get(node, domDataKey);
        if ((allDisposeCallbacks === undefined) && createIfNotFound) {
            allDisposeCallbacks = [];
            ko.utils.domData.set(node, domDataKey, allDisposeCallbacks);
        }
        return allDisposeCallbacks;
    }
    function destroyCallbacksCollection(node) {
        ko.utils.domData.set(node, domDataKey, undefined);
    }

    function cleanSingleNode(node) {
        // Run all the dispose callbacks
        var callbacks = getDisposeCallbacksCollection(node, false);
        if (callbacks) {
            callbacks = callbacks.slice(0); // Clone, as the array may be modified during iteration (typically, callbacks will remove themselves)
            for (var i = 0; i < callbacks.length; i++)
                callbacks[i](node);
        }

        // Erase the DOM data
        ko.utils.domData.clear(node);

        // Perform cleanup needed by external libraries (currently only jQuery, but can be extended)
        ko.utils.domNodeDisposal["cleanExternalData"](node);

        // Clear any immediate-child comment nodes, as these wouldn't have been found by
        // node.getElementsByTagName("*") in cleanNode() (comment nodes aren't elements)
        if (cleanableNodeTypesWithDescendants[node.nodeType])
            cleanImmediateCommentTypeChildren(node);
    }

    function cleanImmediateCommentTypeChildren(nodeWithChildren) {
        var child, nextChild = nodeWithChildren.firstChild;
        while (child = nextChild) {
            nextChild = child.nextSibling;
            if (child.nodeType === 8)
                cleanSingleNode(child);
        }
    }

    return {
        addDisposeCallback : function(node, callback) {
            if (typeof callback != "function")
                throw new Error("Callback must be a function");
            getDisposeCallbacksCollection(node, true).push(callback);
        },

        removeDisposeCallback : function(node, callback) {
            var callbacksCollection = getDisposeCallbacksCollection(node, false);
            if (callbacksCollection) {
                ko.utils.arrayRemoveItem(callbacksCollection, callback);
                if (callbacksCollection.length == 0)
                    destroyCallbacksCollection(node);
            }
        },

        cleanNode : function(node) {
            // First clean this node, where applicable
            if (cleanableNodeTypes[node.nodeType]) {
                cleanSingleNode(node);

                // ... then its descendants, where applicable
                if (cleanableNodeTypesWithDescendants[node.nodeType]) {
                    // Clone the descendants list in case it changes during iteration
                    var descendants = [];
                    ko.utils.arrayPushAll(descendants, node.getElementsByTagName("*"));
                    for (var i = 0, j = descendants.length; i < j; i++)
                        cleanSingleNode(descendants[i]);
                }
            }
            return node;
        },

        removeNode : function(node) {
            ko.cleanNode(node);
            if (node.parentNode)
                node.parentNode.removeChild(node);
        },

        "cleanExternalData" : function (node) {
            // Special support for jQuery here because it's so commonly used.
            // Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
            // so notify it to tear down any resources associated with the node & descendants here.
            if (jQueryInstance && (typeof jQueryInstance['cleanData'] == "function"))
                jQueryInstance['cleanData']([node]);
        }
    };
})();
ko.cleanNode = ko.utils.domNodeDisposal.cleanNode; // Shorthand name for convenience
ko.removeNode = ko.utils.domNodeDisposal.removeNode; // Shorthand name for convenience
ko.exportSymbol('cleanNode', ko.cleanNode);
ko.exportSymbol('removeNode', ko.removeNode);
ko.exportSymbol('utils.domNodeDisposal', ko.utils.domNodeDisposal);
ko.exportSymbol('utils.domNodeDisposal.addDisposeCallback', ko.utils.domNodeDisposal.addDisposeCallback);
ko.exportSymbol('utils.domNodeDisposal.removeDisposeCallback', ko.utils.domNodeDisposal.removeDisposeCallback);
(function () {
    var none = [0, "", ""],
        table = [1, "<table>", "</table>"],
        tbody = [2, "<table><tbody>", "</tbody></table>"],
        tr = [3, "<table><tbody><tr>", "</tr></tbody></table>"],
        select = [1, "<select multiple='multiple'>", "</select>"],
        lookup = {
            'thead': table,
            'tbody': table,
            'tfoot': table,
            'tr': tbody,
            'td': tr,
            'th': tr,
            'option': select,
            'optgroup': select
        },

        // This is needed for old IE if you're *not* using either jQuery or innerShiv. Doesn't affect other cases.
        mayRequireCreateElementHack = ko.utils.ieVersion <= 8;

    function getWrap(tags) {
        var m = tags.match(/^<([a-z]+)[ >]/);
        return (m && lookup[m[1]]) || none;
    }

    function simpleHtmlParse(html, documentContext) {
        documentContext || (documentContext = document);
        var windowContext = documentContext['parentWindow'] || documentContext['defaultView'] || window;

        // Based on jQuery's "clean" function, but only accounting for table-related elements.
        // If you have referenced jQuery, this won't be used anyway - KO will use jQuery's "clean" function directly

        // Note that there's still an issue in IE < 9 whereby it will discard comment nodes that are the first child of
        // a descendant node. For example: "<div><!-- mycomment -->abc</div>" will get parsed as "<div>abc</div>"
        // This won't affect anyone who has referenced jQuery, and there's always the workaround of inserting a dummy node
        // (possibly a text node) in front of the comment. So, KO does not attempt to workaround this IE issue automatically at present.

        // Trim whitespace, otherwise indexOf won't work as expected
        var tags = ko.utils.stringTrim(html).toLowerCase(), div = documentContext.createElement("div"),
            wrap = getWrap(tags),
            depth = wrap[0];

        // Go to html and back, then peel off extra wrappers
        // Note that we always prefix with some dummy text, because otherwise, IE<9 will strip out leading comment nodes in descendants. Total madness.
        var markup = "ignored<div>" + wrap[1] + html + wrap[2] + "</div>";
        if (typeof windowContext['innerShiv'] == "function") {
            // Note that innerShiv is deprecated in favour of html5shiv. We should consider adding
            // support for html5shiv (except if no explicit support is needed, e.g., if html5shiv
            // somehow shims the native APIs so it just works anyway)
            div.appendChild(windowContext['innerShiv'](markup));
        } else {
            if (mayRequireCreateElementHack) {
                // The document.createElement('my-element') trick to enable custom elements in IE6-8
                // only works if we assign innerHTML on an element associated with that document.
                documentContext.appendChild(div);
            }

            div.innerHTML = markup;

            if (mayRequireCreateElementHack) {
                div.parentNode.removeChild(div);
            }
        }

        // Move to the right depth
        while (depth--)
            div = div.lastChild;

        return ko.utils.makeArray(div.lastChild.childNodes);
    }

    function jQueryHtmlParse(html, documentContext) {
        // jQuery's "parseHTML" function was introduced in jQuery 1.8.0 and is a documented public API.
        if (jQueryInstance['parseHTML']) {
            return jQueryInstance['parseHTML'](html, documentContext) || []; // Ensure we always return an array and never null
        } else {
            // For jQuery < 1.8.0, we fall back on the undocumented internal "clean" function.
            var elems = jQueryInstance['clean']([html], documentContext);

            // As of jQuery 1.7.1, jQuery parses the HTML by appending it to some dummy parent nodes held in an in-memory document fragment.
            // Unfortunately, it never clears the dummy parent nodes from the document fragment, so it leaks memory over time.
            // Fix this by finding the top-most dummy parent element, and detaching it from its owner fragment.
            if (elems && elems[0]) {
                // Find the top-most parent element that's a direct child of a document fragment
                var elem = elems[0];
                while (elem.parentNode && elem.parentNode.nodeType !== 11 /* i.e., DocumentFragment */)
                    elem = elem.parentNode;
                // ... then detach it
                if (elem.parentNode)
                    elem.parentNode.removeChild(elem);
            }

            return elems;
        }
    }

    ko.utils.parseHtmlFragment = function(html, documentContext) {
        return jQueryInstance ?
            jQueryHtmlParse(html, documentContext) :   // As below, benefit from jQuery's optimisations where possible
            simpleHtmlParse(html, documentContext);  // ... otherwise, this simple logic will do in most common cases.
    };

    ko.utils.setHtml = function(node, html) {
        ko.utils.emptyDomNode(node);

        // There's no legitimate reason to display a stringified observable without unwrapping it, so we'll unwrap it
        html = ko.utils.unwrapObservable(html);

        if ((html !== null) && (html !== undefined)) {
            if (typeof html != 'string')
                html = html.toString();

            // jQuery contains a lot of sophisticated code to parse arbitrary HTML fragments,
            // for example <tr> elements which are not normally allowed to exist on their own.
            // If you've referenced jQuery we'll use that rather than duplicating its code.
            if (jQueryInstance) {
                jQueryInstance(node)['html'](html);
            } else {
                // ... otherwise, use KO's own parsing logic.
                var parsedNodes = ko.utils.parseHtmlFragment(html, node.ownerDocument);
                for (var i = 0; i < parsedNodes.length; i++)
                    node.appendChild(parsedNodes[i]);
            }
        }
    };
})();

ko.exportSymbol('utils.parseHtmlFragment', ko.utils.parseHtmlFragment);
ko.exportSymbol('utils.setHtml', ko.utils.setHtml);

ko.memoization = (function () {
    var memos = {};

    function randomMax8HexChars() {
        return (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1);
    }
    function generateRandomId() {
        return randomMax8HexChars() + randomMax8HexChars();
    }
    function findMemoNodes(rootNode, appendToArray) {
        if (!rootNode)
            return;
        if (rootNode.nodeType == 8) {
            var memoId = ko.memoization.parseMemoText(rootNode.nodeValue);
            if (memoId != null)
                appendToArray.push({ domNode: rootNode, memoId: memoId });
        } else if (rootNode.nodeType == 1) {
            for (var i = 0, childNodes = rootNode.childNodes, j = childNodes.length; i < j; i++)
                findMemoNodes(childNodes[i], appendToArray);
        }
    }

    return {
        memoize: function (callback) {
            if (typeof callback != "function")
                throw new Error("You can only pass a function to ko.memoization.memoize()");
            var memoId = generateRandomId();
            memos[memoId] = callback;
            return "<!--[ko_memo:" + memoId + "]-->";
        },

        unmemoize: function (memoId, callbackParams) {
            var callback = memos[memoId];
            if (callback === undefined)
                throw new Error("Couldn't find any memo with ID " + memoId + ". Perhaps it's already been unmemoized.");
            try {
                callback.apply(null, callbackParams || []);
                return true;
            }
            finally { delete memos[memoId]; }
        },

        unmemoizeDomNodeAndDescendants: function (domNode, extraCallbackParamsArray) {
            var memos = [];
            findMemoNodes(domNode, memos);
            for (var i = 0, j = memos.length; i < j; i++) {
                var node = memos[i].domNode;
                var combinedParams = [node];
                if (extraCallbackParamsArray)
                    ko.utils.arrayPushAll(combinedParams, extraCallbackParamsArray);
                ko.memoization.unmemoize(memos[i].memoId, combinedParams);
                node.nodeValue = ""; // Neuter this node so we don't try to unmemoize it again
                if (node.parentNode)
                    node.parentNode.removeChild(node); // If possible, erase it totally (not always possible - someone else might just hold a reference to it then call unmemoizeDomNodeAndDescendants again)
            }
        },

        parseMemoText: function (memoText) {
            var match = memoText.match(/^\[ko_memo\:(.*?)\]$/);
            return match ? match[1] : null;
        }
    };
})();

ko.exportSymbol('memoization', ko.memoization);
ko.exportSymbol('memoization.memoize', ko.memoization.memoize);
ko.exportSymbol('memoization.unmemoize', ko.memoization.unmemoize);
ko.exportSymbol('memoization.parseMemoText', ko.memoization.parseMemoText);
ko.exportSymbol('memoization.unmemoizeDomNodeAndDescendants', ko.memoization.unmemoizeDomNodeAndDescendants);
ko.tasks = (function () {
    var scheduler,
        taskQueue = [],
        taskQueueLength = 0,
        nextHandle = 1,
        nextIndexToProcess = 0;

    if (window['MutationObserver']) {
        // Chrome 27+, Firefox 14+, IE 11+, Opera 15+, Safari 6.1+
        // From https://github.com/petkaantonov/bluebird * Copyright (c) 2014 Petka Antonov * License: MIT
        scheduler = (function (callback) {
            var div = document.createElement("div");
            new MutationObserver(callback).observe(div, {attributes: true});
            return function () { div.classList.toggle("foo"); };
        })(scheduledProcess);
    } else if (document && "onreadystatechange" in document.createElement("script")) {
        // IE 6-10
        // From https://github.com/YuzuJS/setImmediate * Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic Denicola * License: MIT
        scheduler = function (callback) {
            var script = document.createElement("script");
            script.onreadystatechange = function () {
                script.onreadystatechange = null;
                document.documentElement.removeChild(script);
                script = null;
                callback();
            };
            document.documentElement.appendChild(script);
        };
    } else {
        scheduler = function (callback) {
            setTimeout(callback, 0);
        };
    }

    function processTasks() {
        if (taskQueueLength) {
            // Each mark represents the end of a logical group of tasks and the number of these groups is
            // limited to prevent unchecked recursion.
            var mark = taskQueueLength, countMarks = 0;

            // nextIndexToProcess keeps track of where we are in the queue; processTasks can be called recursively without issue
            for (var task; nextIndexToProcess < taskQueueLength; ) {
                if (task = taskQueue[nextIndexToProcess++]) {
                    if (nextIndexToProcess > mark) {
                        if (++countMarks >= 5000) {
                            nextIndexToProcess = taskQueueLength;   // skip all tasks remaining in the queue since any of them could be causing the recursion
                            ko.utils.deferError(Error("'Too much recursion' after processing " + countMarks + " task groups."));
                            break;
                        }
                        mark = taskQueueLength;
                    }
                    try {
                        task();
                    } catch (ex) {
                        ko.utils.deferError(ex);
                    }
                }
            }
        }
    }

    function scheduledProcess() {
        processTasks();

        // Reset the queue
        nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
    }

    function scheduleTaskProcessing() {
        ko.tasks['scheduler'](scheduledProcess);
    }

    var tasks = {
        'scheduler': scheduler,     // Allow overriding the scheduler

        schedule: function (func) {
            if (!taskQueueLength) {
                scheduleTaskProcessing();
            }

            taskQueue[taskQueueLength++] = func;
            return nextHandle++;
        },

        cancel: function (handle) {
            var index = handle - (nextHandle - taskQueueLength);
            if (index >= nextIndexToProcess && index < taskQueueLength) {
                taskQueue[index] = null;
            }
        },

        // For testing only: reset the queue and return the previous queue length
        'resetForTesting': function () {
            var length = taskQueueLength - nextIndexToProcess;
            nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
            return length;
        },

        runEarly: processTasks
    };

    return tasks;
})();

ko.exportSymbol('tasks', ko.tasks);
ko.exportSymbol('tasks.schedule', ko.tasks.schedule);
//ko.exportSymbol('tasks.cancel', ko.tasks.cancel);  "cancel" isn't minified
ko.exportSymbol('tasks.runEarly', ko.tasks.runEarly);
ko.extenders = {
    'throttle': function(target, timeout) {
        // Throttling means two things:

        // (1) For dependent observables, we throttle *evaluations* so that, no matter how fast its dependencies
        //     notify updates, the target doesn't re-evaluate (and hence doesn't notify) faster than a certain rate
        target['throttleEvaluation'] = timeout;

        // (2) For writable targets (observables, or writable dependent observables), we throttle *writes*
        //     so the target cannot change value synchronously or faster than a certain rate
        var writeTimeoutInstance = null;
        return ko.dependentObservable({
            'read': target,
            'write': function(value) {
                clearTimeout(writeTimeoutInstance);
                writeTimeoutInstance = ko.utils.setTimeout(function() {
                    target(value);
                }, timeout);
            }
        });
    },

    'rateLimit': function(target, options) {
        var timeout, method, limitFunction;

        if (typeof options == 'number') {
            timeout = options;
        } else {
            timeout = options['timeout'];
            method = options['method'];
        }

        // rateLimit supersedes deferred updates
        target._deferUpdates = false;

        limitFunction = method == 'notifyWhenChangesStop' ?  debounce : throttle;
        target.limit(function(callback) {
            return limitFunction(callback, timeout);
        });
    },

    'deferred': function(target, options) {
        if (options !== true) {
            throw new Error('The \'deferred\' extender only accepts the value \'true\', because it is not supported to turn deferral off once enabled.')
        }

        if (!target._deferUpdates) {
            target._deferUpdates = true;
            target.limit(function (callback) {
                var handle,
                    ignoreUpdates = false;
                return function () {
                    if (!ignoreUpdates) {
                        ko.tasks.cancel(handle);
                        handle = ko.tasks.schedule(callback);

                        try {
                            ignoreUpdates = true;
                            target['notifySubscribers'](undefined, 'dirty');
                        } finally {
                            ignoreUpdates = false;
                        }
                    }
                };
            });
        }
    },

    'notify': function(target, notifyWhen) {
        target["equalityComparer"] = notifyWhen == "always" ?
            null :  // null equalityComparer means to always notify
            valuesArePrimitiveAndEqual;
    }
};

var primitiveTypes = { 'undefined':1, 'boolean':1, 'number':1, 'string':1 };
function valuesArePrimitiveAndEqual(a, b) {
    var oldValueIsPrimitive = (a === null) || (typeof(a) in primitiveTypes);
    return oldValueIsPrimitive ? (a === b) : false;
}

function throttle(callback, timeout) {
    var timeoutInstance;
    return function () {
        if (!timeoutInstance) {
            timeoutInstance = ko.utils.setTimeout(function () {
                timeoutInstance = undefined;
                callback();
            }, timeout);
        }
    };
}

function debounce(callback, timeout) {
    var timeoutInstance;
    return function () {
        clearTimeout(timeoutInstance);
        timeoutInstance = ko.utils.setTimeout(callback, timeout);
    };
}

function applyExtenders(requestedExtenders) {
    var target = this;
    if (requestedExtenders) {
        ko.utils.objectForEach(requestedExtenders, function(key, value) {
            var extenderHandler = ko.extenders[key];
            if (typeof extenderHandler == 'function') {
                target = extenderHandler(target, value) || target;
            }
        });
    }
    return target;
}

ko.exportSymbol('extenders', ko.extenders);

ko.subscription = function (target, callback, disposeCallback) {
    this._target = target;
    this.callback = callback;
    this.disposeCallback = disposeCallback;
    this.isDisposed = false;
    ko.exportProperty(this, 'dispose', this.dispose);
};
ko.subscription.prototype.dispose = function () {
    this.isDisposed = true;
    this.disposeCallback();
};

ko.subscribable = function () {
    ko.utils.setPrototypeOfOrExtend(this, ko_subscribable_fn);
    ko_subscribable_fn.init(this);
}

var defaultEvent = "change";

// Moved out of "limit" to avoid the extra closure
function limitNotifySubscribers(value, event) {
    if (!event || event === defaultEvent) {
        this._limitChange(value);
    } else if (event === 'beforeChange') {
        this._limitBeforeChange(value);
    } else {
        this._origNotifySubscribers(value, event);
    }
}

var ko_subscribable_fn = {
    init: function(instance) {
        instance._subscriptions = { "change": [] };
        instance._versionNumber = 1;
    },

    subscribe: function (callback, callbackTarget, event) {
        var self = this;

        event = event || defaultEvent;
        var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

        var subscription = new ko.subscription(self, boundCallback, function () {
            ko.utils.arrayRemoveItem(self._subscriptions[event], subscription);
            if (self.afterSubscriptionRemove)
                self.afterSubscriptionRemove(event);
        });

        if (self.beforeSubscriptionAdd)
            self.beforeSubscriptionAdd(event);

        if (!self._subscriptions[event])
            self._subscriptions[event] = [];
        self._subscriptions[event].push(subscription);

        return subscription;
    },

    "notifySubscribers": function (valueToNotify, event) {
        event = event || defaultEvent;
        if (event === defaultEvent) {
            this.updateVersion();
        }
        if (this.hasSubscriptionsForEvent(event)) {
            var subs = event === defaultEvent && this._changeSubscriptions || this._subscriptions[event].slice(0);
            try {
                ko.dependencyDetection.begin(); // Begin suppressing dependency detection (by setting the top frame to undefined)
                for (var i = 0, subscription; subscription = subs[i]; ++i) {
                    // In case a subscription was disposed during the arrayForEach cycle, check
                    // for isDisposed on each subscription before invoking its callback
                    if (!subscription.isDisposed)
                        subscription.callback(valueToNotify);
                }
            } finally {
                ko.dependencyDetection.end(); // End suppressing dependency detection
            }
        }
    },

    getVersion: function () {
        return this._versionNumber;
    },

    hasChanged: function (versionToCheck) {
        return this.getVersion() !== versionToCheck;
    },

    updateVersion: function () {
        ++this._versionNumber;
    },

    limit: function(limitFunction) {
        var self = this, selfIsObservable = ko.isObservable(self),
            ignoreBeforeChange, notifyNextChange, previousValue, pendingValue, beforeChange = 'beforeChange';

        if (!self._origNotifySubscribers) {
            self._origNotifySubscribers = self["notifySubscribers"];
            self["notifySubscribers"] = limitNotifySubscribers;
        }

        var finish = limitFunction(function() {
            self._notificationIsPending = false;

            // If an observable provided a reference to itself, access it to get the latest value.
            // This allows computed observables to delay calculating their value until needed.
            if (selfIsObservable && pendingValue === self) {
                pendingValue = self._evalIfChanged ? self._evalIfChanged() : self();
            }
            var shouldNotify = notifyNextChange || self.isDifferent(previousValue, pendingValue);

            notifyNextChange = ignoreBeforeChange = false;

            if (shouldNotify) {
                self._origNotifySubscribers(previousValue = pendingValue);
            }
        });

        self._limitChange = function(value) {
            self._changeSubscriptions = self._subscriptions[defaultEvent].slice(0);
            self._notificationIsPending = ignoreBeforeChange = true;
            pendingValue = value;
            finish();
        };
        self._limitBeforeChange = function(value) {
            if (!ignoreBeforeChange) {
                previousValue = value;
                self._origNotifySubscribers(value, beforeChange);
            }
        };
        self._notifyNextChangeIfValueIsDifferent = function() {
            if (self.isDifferent(previousValue, self.peek(true /*evaluate*/))) {
                notifyNextChange = true;
            }
        };
    },

    hasSubscriptionsForEvent: function(event) {
        return this._subscriptions[event] && this._subscriptions[event].length;
    },

    getSubscriptionsCount: function (event) {
        if (event) {
            return this._subscriptions[event] && this._subscriptions[event].length || 0;
        } else {
            var total = 0;
            ko.utils.objectForEach(this._subscriptions, function(eventName, subscriptions) {
                if (eventName !== 'dirty')
                    total += subscriptions.length;
            });
            return total;
        }
    },

    isDifferent: function(oldValue, newValue) {
        return !this['equalityComparer'] || !this['equalityComparer'](oldValue, newValue);
    },

    extend: applyExtenders
};

ko.exportProperty(ko_subscribable_fn, 'subscribe', ko_subscribable_fn.subscribe);
ko.exportProperty(ko_subscribable_fn, 'extend', ko_subscribable_fn.extend);
ko.exportProperty(ko_subscribable_fn, 'getSubscriptionsCount', ko_subscribable_fn.getSubscriptionsCount);

// For browsers that support proto assignment, we overwrite the prototype of each
// observable instance. Since observables are functions, we need Function.prototype
// to still be in the prototype chain.
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(ko_subscribable_fn, Function.prototype);
}

ko.subscribable['fn'] = ko_subscribable_fn;


ko.isSubscribable = function (instance) {
    return instance != null && typeof instance.subscribe == "function" && typeof instance["notifySubscribers"] == "function";
};

ko.exportSymbol('subscribable', ko.subscribable);
ko.exportSymbol('isSubscribable', ko.isSubscribable);

ko.computedContext = ko.dependencyDetection = (function () {
    var outerFrames = [],
        currentFrame,
        lastId = 0;

    // Return a unique ID that can be assigned to an observable for dependency tracking.
    // Theoretically, you could eventually overflow the number storage size, resulting
    // in duplicate IDs. But in JavaScript, the largest exact integral value is 2^53
    // or 9,007,199,254,740,992. If you created 1,000,000 IDs per second, it would
    // take over 285 years to reach that number.
    // Reference http://blog.vjeux.com/2010/javascript/javascript-max_int-number-limits.html
    function getId() {
        return ++lastId;
    }

    function begin(options) {
        outerFrames.push(currentFrame);
        currentFrame = options;
    }

    function end() {
        currentFrame = outerFrames.pop();
    }

    return {
        begin: begin,

        end: end,

        registerDependency: function (subscribable) {
            if (currentFrame) {
                if (!ko.isSubscribable(subscribable))
                    throw new Error("Only subscribable things can act as dependencies");
                currentFrame.callback.call(currentFrame.callbackTarget, subscribable, subscribable._id || (subscribable._id = getId()));
            }
        },

        ignore: function (callback, callbackTarget, callbackArgs) {
            try {
                begin();
                return callback.apply(callbackTarget, callbackArgs || []);
            } finally {
                end();
            }
        },

        getDependenciesCount: function () {
            if (currentFrame)
                return currentFrame.computed.getDependenciesCount();
        },

        isInitial: function() {
            if (currentFrame)
                return currentFrame.isInitial;
        }
    };
})();

ko.exportSymbol('computedContext', ko.computedContext);
ko.exportSymbol('computedContext.getDependenciesCount', ko.computedContext.getDependenciesCount);
ko.exportSymbol('computedContext.isInitial', ko.computedContext.isInitial);

ko.exportSymbol('ignoreDependencies', ko.ignoreDependencies = ko.dependencyDetection.ignore);
var observableLatestValue = ko.utils.createSymbolOrString('_latestValue');

ko.observable = function (initialValue) {
    function observable() {
        if (arguments.length > 0) {
            // Write

            // Ignore writes if the value hasn't changed
            if (observable.isDifferent(observable[observableLatestValue], arguments[0])) {
                observable.valueWillMutate();
                observable[observableLatestValue] = arguments[0];
                observable.valueHasMutated();
            }
            return this; // Permits chained assignments
        }
        else {
            // Read
            ko.dependencyDetection.registerDependency(observable); // The caller only needs to be notified of changes if they did a "read" operation
            return observable[observableLatestValue];
        }
    }

    observable[observableLatestValue] = initialValue;

    // Inherit from 'subscribable'
    if (!ko.utils.canSetPrototype) {
        // 'subscribable' won't be on the prototype chain unless we put it there directly
        ko.utils.extend(observable, ko.subscribable['fn']);
    }
    ko.subscribable['fn'].init(observable);

    // Inherit from 'observable'
    ko.utils.setPrototypeOfOrExtend(observable, observableFn);

    if (ko.options['deferUpdates']) {
        ko.extenders['deferred'](observable, true);
    }

    return observable;
}

// Define prototype for observables
var observableFn = {
    'equalityComparer': valuesArePrimitiveAndEqual,
    peek: function() { return this[observableLatestValue]; },
    valueHasMutated: function () { this['notifySubscribers'](this[observableLatestValue]); },
    valueWillMutate: function () { this['notifySubscribers'](this[observableLatestValue], 'beforeChange'); }
};

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.observable constructor
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(observableFn, ko.subscribable['fn']);
}

var protoProperty = ko.observable.protoProperty = '__ko_proto__';
observableFn[protoProperty] = ko.observable;

ko.hasPrototype = function(instance, prototype) {
    if ((instance === null) || (instance === undefined) || (instance[protoProperty] === undefined)) return false;
    if (instance[protoProperty] === prototype) return true;
    return ko.hasPrototype(instance[protoProperty], prototype); // Walk the prototype chain
};

ko.isObservable = function (instance) {
    return ko.hasPrototype(instance, ko.observable);
}
ko.isWriteableObservable = function (instance) {
    // Observable
    if ((typeof instance == 'function') && instance[protoProperty] === ko.observable)
        return true;
    // Writeable dependent observable
    if ((typeof instance == 'function') && (instance[protoProperty] === ko.dependentObservable) && (instance.hasWriteFunction))
        return true;
    // Anything else
    return false;
}

ko.exportSymbol('observable', ko.observable);
ko.exportSymbol('isObservable', ko.isObservable);
ko.exportSymbol('isWriteableObservable', ko.isWriteableObservable);
ko.exportSymbol('isWritableObservable', ko.isWriteableObservable);
ko.exportSymbol('observable.fn', observableFn);
ko.exportProperty(observableFn, 'peek', observableFn.peek);
ko.exportProperty(observableFn, 'valueHasMutated', observableFn.valueHasMutated);
ko.exportProperty(observableFn, 'valueWillMutate', observableFn.valueWillMutate);
ko.observableArray = function (initialValues) {
    initialValues = initialValues || [];

    if (typeof initialValues != 'object' || !('length' in initialValues))
        throw new Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");

    var result = ko.observable(initialValues);
    ko.utils.setPrototypeOfOrExtend(result, ko.observableArray['fn']);
    return result.extend({'trackArrayChanges':true});
};

ko.observableArray['fn'] = {
    'remove': function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var removedValues = [];
        var predicate = typeof valueOrPredicate == "function" && !ko.isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        for (var i = 0; i < underlyingArray.length; i++) {
            var value = underlyingArray[i];
            if (predicate(value)) {
                if (removedValues.length === 0) {
                    this.valueWillMutate();
                }
                removedValues.push(value);
                underlyingArray.splice(i, 1);
                i--;
            }
        }
        if (removedValues.length) {
            this.valueHasMutated();
        }
        return removedValues;
    },

    'removeAll': function (arrayOfValues) {
        // If you passed zero args, we remove everything
        if (arrayOfValues === undefined) {
            var underlyingArray = this.peek();
            var allValues = underlyingArray.slice(0);
            this.valueWillMutate();
            underlyingArray.splice(0, underlyingArray.length);
            this.valueHasMutated();
            return allValues;
        }
        // If you passed an arg, we interpret it as an array of entries to remove
        if (!arrayOfValues)
            return [];
        return this['remove'](function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    'destroy': function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var predicate = typeof valueOrPredicate == "function" && !ko.isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        this.valueWillMutate();
        for (var i = underlyingArray.length - 1; i >= 0; i--) {
            var value = underlyingArray[i];
            if (predicate(value))
                underlyingArray[i]["_destroy"] = true;
        }
        this.valueHasMutated();
    },

    'destroyAll': function (arrayOfValues) {
        // If you passed zero args, we destroy everything
        if (arrayOfValues === undefined)
            return this['destroy'](function() { return true });

        // If you passed an arg, we interpret it as an array of entries to destroy
        if (!arrayOfValues)
            return [];
        return this['destroy'](function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    'indexOf': function (item) {
        var underlyingArray = this();
        return ko.utils.arrayIndexOf(underlyingArray, item);
    },

    'replace': function(oldItem, newItem) {
        var index = this['indexOf'](oldItem);
        if (index >= 0) {
            this.valueWillMutate();
            this.peek()[index] = newItem;
            this.valueHasMutated();
        }
    }
};

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.observableArray constructor
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(ko.observableArray['fn'], ko.observable['fn']);
}

// Populate ko.observableArray.fn with read/write functions from native arrays
// Important: Do not add any additional functions here that may reasonably be used to *read* data from the array
// because we'll eval them without causing subscriptions, so ko.computed output could end up getting stale
ko.utils.arrayForEach(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        // Use "peek" to avoid creating a subscription in any computed that we're executing in the context of
        // (for consistency with mutating regular observables)
        var underlyingArray = this.peek();
        this.valueWillMutate();
        this.cacheDiffForKnownOperation(underlyingArray, methodName, arguments);
        var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments);
        this.valueHasMutated();
        // The native sort and reverse methods return a reference to the array, but it makes more sense to return the observable array instead.
        return methodCallResult === underlyingArray ? this : methodCallResult;
    };
});

// Populate ko.observableArray.fn with read-only functions from native arrays
ko.utils.arrayForEach(["slice"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        var underlyingArray = this();
        return underlyingArray[methodName].apply(underlyingArray, arguments);
    };
});

ko.exportSymbol('observableArray', ko.observableArray);
var arrayChangeEventName = 'arrayChange';
ko.extenders['trackArrayChanges'] = function(target, options) {
    // Use the provided options--each call to trackArrayChanges overwrites the previously set options
    target.compareArrayOptions = {};
    if (options && typeof options == "object") {
        ko.utils.extend(target.compareArrayOptions, options);
    }
    target.compareArrayOptions['sparse'] = true;

    // Only modify the target observable once
    if (target.cacheDiffForKnownOperation) {
        return;
    }
    var trackingChanges = false,
        cachedDiff = null,
        arrayChangeSubscription,
        pendingNotifications = 0,
        underlyingNotifySubscribersFunction,
        underlyingBeforeSubscriptionAddFunction = target.beforeSubscriptionAdd,
        underlyingAfterSubscriptionRemoveFunction = target.afterSubscriptionRemove;

    // Watch "subscribe" calls, and for array change events, ensure change tracking is enabled
    target.beforeSubscriptionAdd = function (event) {
        if (underlyingBeforeSubscriptionAddFunction)
            underlyingBeforeSubscriptionAddFunction.call(target, event);
        if (event === arrayChangeEventName) {
            trackChanges();
        }
    };
    // Watch "dispose" calls, and for array change events, ensure change tracking is disabled when all are disposed
    target.afterSubscriptionRemove = function (event) {
        if (underlyingAfterSubscriptionRemoveFunction)
            underlyingAfterSubscriptionRemoveFunction.call(target, event);
        if (event === arrayChangeEventName && !target.hasSubscriptionsForEvent(arrayChangeEventName)) {
            if (underlyingNotifySubscribersFunction) {
                target['notifySubscribers'] = underlyingNotifySubscribersFunction;
                underlyingNotifySubscribersFunction = undefined;
            }
            arrayChangeSubscription.dispose();
            trackingChanges = false;
        }
    };

    function trackChanges() {
        // Calling 'trackChanges' multiple times is the same as calling it once
        if (trackingChanges) {
            return;
        }

        trackingChanges = true;

        // Intercept "notifySubscribers" to track how many times it was called.
        underlyingNotifySubscribersFunction = target['notifySubscribers'];
        target['notifySubscribers'] = function(valueToNotify, event) {
            if (!event || event === defaultEvent) {
                ++pendingNotifications;
            }
            return underlyingNotifySubscribersFunction.apply(this, arguments);
        };

        // Each time the array changes value, capture a clone so that on the next
        // change it's possible to produce a diff
        var previousContents = [].concat(target.peek() || []);
        cachedDiff = null;
        arrayChangeSubscription = target.subscribe(function(currentContents) {
            // Make a copy of the current contents and ensure it's an array
            currentContents = [].concat(currentContents || []);

            // Compute the diff and issue notifications, but only if someone is listening
            if (target.hasSubscriptionsForEvent(arrayChangeEventName)) {
                var changes = getChanges(previousContents, currentContents);
            }

            // Eliminate references to the old, removed items, so they can be GCed
            previousContents = currentContents;
            cachedDiff = null;
            pendingNotifications = 0;

            if (changes && changes.length) {
                target['notifySubscribers'](changes, arrayChangeEventName);
            }
        });
    }

    function getChanges(previousContents, currentContents) {
        // We try to re-use cached diffs.
        // The scenarios where pendingNotifications > 1 are when using rate-limiting or the Deferred Updates
        // plugin, which without this check would not be compatible with arrayChange notifications. Normally,
        // notifications are issued immediately so we wouldn't be queueing up more than one.
        if (!cachedDiff || pendingNotifications > 1) {
            cachedDiff = ko.utils.compareArrays(previousContents, currentContents, target.compareArrayOptions);
        }

        return cachedDiff;
    }

    target.cacheDiffForKnownOperation = function(rawArray, operationName, args) {
        // Only run if we're currently tracking changes for this observable array
        // and there aren't any pending deferred notifications.
        if (!trackingChanges || pendingNotifications) {
            return;
        }
        var diff = [],
            arrayLength = rawArray.length,
            argsLength = args.length,
            offset = 0;

        function pushDiff(status, value, index) {
            return diff[diff.length] = { 'status': status, 'value': value, 'index': index };
        }
        switch (operationName) {
            case 'push':
                offset = arrayLength;
            case 'unshift':
                for (var index = 0; index < argsLength; index++) {
                    pushDiff('added', args[index], offset + index);
                }
                break;

            case 'pop':
                offset = arrayLength - 1;
            case 'shift':
                if (arrayLength) {
                    pushDiff('deleted', rawArray[offset], offset);
                }
                break;

            case 'splice':
                // Negative start index means 'from end of array'. After that we clamp to [0...arrayLength].
                // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
                var startIndex = Math.min(Math.max(0, args[0] < 0 ? arrayLength + args[0] : args[0]), arrayLength),
                    endDeleteIndex = argsLength === 1 ? arrayLength : Math.min(startIndex + (args[1] || 0), arrayLength),
                    endAddIndex = startIndex + argsLength - 2,
                    endIndex = Math.max(endDeleteIndex, endAddIndex),
                    additions = [], deletions = [];
                for (var index = startIndex, argsIndex = 2; index < endIndex; ++index, ++argsIndex) {
                    if (index < endDeleteIndex)
                        deletions.push(pushDiff('deleted', rawArray[index], index));
                    if (index < endAddIndex)
                        additions.push(pushDiff('added', args[argsIndex], index));
                }
                ko.utils.findMovesInArrayComparison(deletions, additions);
                break;

            default:
                return;
        }
        cachedDiff = diff;
    };
};
var computedState = ko.utils.createSymbolOrString('_state');

ko.computed = ko.dependentObservable = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
    if (typeof evaluatorFunctionOrOptions === "object") {
        // Single-parameter syntax - everything is on this "options" param
        options = evaluatorFunctionOrOptions;
    } else {
        // Multi-parameter syntax - construct the options according to the params passed
        options = options || {};
        if (evaluatorFunctionOrOptions) {
            options["read"] = evaluatorFunctionOrOptions;
        }
    }
    if (typeof options["read"] != "function")
        throw Error("Pass a function that returns the value of the ko.computed");

    var writeFunction = options["write"];
    var state = {
        latestValue: undefined,
        isStale: true,
        isDirty: true,
        isBeingEvaluated: false,
        suppressDisposalUntilDisposeWhenReturnsFalse: false,
        isDisposed: false,
        pure: false,
        isSleeping: false,
        readFunction: options["read"],
        evaluatorFunctionTarget: evaluatorFunctionTarget || options["owner"],
        disposeWhenNodeIsRemoved: options["disposeWhenNodeIsRemoved"] || options.disposeWhenNodeIsRemoved || null,
        disposeWhen: options["disposeWhen"] || options.disposeWhen,
        domNodeDisposalCallback: null,
        dependencyTracking: {},
        dependenciesCount: 0,
        evaluationTimeoutInstance: null
    };

    function computedObservable() {
        if (arguments.length > 0) {
            if (typeof writeFunction === "function") {
                // Writing a value
                writeFunction.apply(state.evaluatorFunctionTarget, arguments);
            } else {
                throw new Error("Cannot write a value to a ko.computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
            }
            return this; // Permits chained assignments
        } else {
            // Reading the value
            ko.dependencyDetection.registerDependency(computedObservable);
            if (state.isDirty || (state.isSleeping && computedObservable.haveDependenciesChanged())) {
                computedObservable.evaluateImmediate();
            }
            return state.latestValue;
        }
    }

    computedObservable[computedState] = state;
    computedObservable.hasWriteFunction = typeof writeFunction === "function";

    // Inherit from 'subscribable'
    if (!ko.utils.canSetPrototype) {
        // 'subscribable' won't be on the prototype chain unless we put it there directly
        ko.utils.extend(computedObservable, ko.subscribable['fn']);
    }
    ko.subscribable['fn'].init(computedObservable);

    // Inherit from 'computed'
    ko.utils.setPrototypeOfOrExtend(computedObservable, computedFn);

    if (options['pure']) {
        state.pure = true;
        state.isSleeping = true;     // Starts off sleeping; will awake on the first subscription
        ko.utils.extend(computedObservable, pureComputedOverrides);
    } else if (options['deferEvaluation']) {
        ko.utils.extend(computedObservable, deferEvaluationOverrides);
    }

    if (ko.options['deferUpdates']) {
        ko.extenders['deferred'](computedObservable, true);
    }

    if (DEBUG) {
        // #1731 - Aid debugging by exposing the computed's options
        computedObservable["_options"] = options;
    }

    if (state.disposeWhenNodeIsRemoved) {
        // Since this computed is associated with a DOM node, and we don't want to dispose the computed
        // until the DOM node is *removed* from the document (as opposed to never having been in the document),
        // we'll prevent disposal until "disposeWhen" first returns false.
        state.suppressDisposalUntilDisposeWhenReturnsFalse = true;

        // disposeWhenNodeIsRemoved: true can be used to opt into the "only dispose after first false result"
        // behaviour even if there's no specific node to watch. In that case, clear the option so we don't try
        // to watch for a non-node's disposal. This technique is intended for KO's internal use only and shouldn't
        // be documented or used by application code, as it's likely to change in a future version of KO.
        if (!state.disposeWhenNodeIsRemoved.nodeType) {
            state.disposeWhenNodeIsRemoved = null;
        }
    }

    // Evaluate, unless sleeping or deferEvaluation is true
    if (!state.isSleeping && !options['deferEvaluation']) {
        computedObservable.evaluateImmediate();
    }

    // Attach a DOM node disposal callback so that the computed will be proactively disposed as soon as the node is
    // removed using ko.removeNode. But skip if isActive is false (there will never be any dependencies to dispose).
    if (state.disposeWhenNodeIsRemoved && computedObservable.isActive()) {
        ko.utils.domNodeDisposal.addDisposeCallback(state.disposeWhenNodeIsRemoved, state.domNodeDisposalCallback = function () {
            computedObservable.dispose();
        });
    }

    return computedObservable;
};

// Utility function that disposes a given dependencyTracking entry
function computedDisposeDependencyCallback(id, entryToDispose) {
    if (entryToDispose !== null && entryToDispose.dispose) {
        entryToDispose.dispose();
    }
}

// This function gets called each time a dependency is detected while evaluating a computed.
// It's factored out as a shared function to avoid creating unnecessary function instances during evaluation.
function computedBeginDependencyDetectionCallback(subscribable, id) {
    var computedObservable = this.computedObservable,
        state = computedObservable[computedState];
    if (!state.isDisposed) {
        if (this.disposalCount && this.disposalCandidates[id]) {
            // Don't want to dispose this subscription, as it's still being used
            computedObservable.addDependencyTracking(id, subscribable, this.disposalCandidates[id]);
            this.disposalCandidates[id] = null; // No need to actually delete the property - disposalCandidates is a transient object anyway
            --this.disposalCount;
        } else if (!state.dependencyTracking[id]) {
            // Brand new subscription - add it
            computedObservable.addDependencyTracking(id, subscribable, state.isSleeping ? { _target: subscribable } : computedObservable.subscribeToDependency(subscribable));
        }
        // If the observable we've accessed has a pending notification, ensure we get notified of the actual final value (bypass equality checks)
        if (subscribable._notificationIsPending) {
            subscribable._notifyNextChangeIfValueIsDifferent();
        }
    }
}

var computedFn = {
    "equalityComparer": valuesArePrimitiveAndEqual,
    getDependenciesCount: function () {
        return this[computedState].dependenciesCount;
    },
    addDependencyTracking: function (id, target, trackingObj) {
        if (this[computedState].pure && target === this) {
            throw Error("A 'pure' computed must not be called recursively");
        }

        this[computedState].dependencyTracking[id] = trackingObj;
        trackingObj._order = this[computedState].dependenciesCount++;
        trackingObj._version = target.getVersion();
    },
    haveDependenciesChanged: function () {
        var id, dependency, dependencyTracking = this[computedState].dependencyTracking;
        for (id in dependencyTracking) {
            if (dependencyTracking.hasOwnProperty(id)) {
                dependency = dependencyTracking[id];
                if ((this._evalDelayed && dependency._target._notificationIsPending) || dependency._target.hasChanged(dependency._version)) {
                    return true;
                }
            }
        }
    },
    markDirty: function () {
        // Process "dirty" events if we can handle delayed notifications
        if (this._evalDelayed && !this[computedState].isBeingEvaluated) {
            this._evalDelayed(false /*isChange*/);
        }
    },
    isActive: function () {
        var state = this[computedState];
        return state.isDirty || state.dependenciesCount > 0;
    },
    respondToChange: function () {
        // Ignore "change" events if we've already scheduled a delayed notification
        if (!this._notificationIsPending) {
            this.evaluatePossiblyAsync();
        } else if (this[computedState].isDirty) {
            this[computedState].isStale = true;
        }
    },
    subscribeToDependency: function (target) {
        if (target._deferUpdates && !this[computedState].disposeWhenNodeIsRemoved) {
            var dirtySub = target.subscribe(this.markDirty, this, 'dirty'),
                changeSub = target.subscribe(this.respondToChange, this);
            return {
                _target: target,
                dispose: function () {
                    dirtySub.dispose();
                    changeSub.dispose();
                }
            };
        } else {
            return target.subscribe(this.evaluatePossiblyAsync, this);
        }
    },
    evaluatePossiblyAsync: function () {
        var computedObservable = this,
            throttleEvaluationTimeout = computedObservable['throttleEvaluation'];
        if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
            clearTimeout(this[computedState].evaluationTimeoutInstance);
            this[computedState].evaluationTimeoutInstance = ko.utils.setTimeout(function () {
                computedObservable.evaluateImmediate(true /*notifyChange*/);
            }, throttleEvaluationTimeout);
        } else if (computedObservable._evalDelayed) {
            computedObservable._evalDelayed(true /*isChange*/);
        } else {
            computedObservable.evaluateImmediate(true /*notifyChange*/);
        }
    },
    evaluateImmediate: function (notifyChange) {
        var computedObservable = this,
            state = computedObservable[computedState],
            disposeWhen = state.disposeWhen,
            changed = false;

        if (state.isBeingEvaluated) {
            // If the evaluation of a ko.computed causes side effects, it's possible that it will trigger its own re-evaluation.
            // This is not desirable (it's hard for a developer to realise a chain of dependencies might cause this, and they almost
            // certainly didn't intend infinite re-evaluations). So, for predictability, we simply prevent ko.computeds from causing
            // their own re-evaluation. Further discussion at https://github.com/SteveSanderson/knockout/pull/387
            return;
        }

        // Do not evaluate (and possibly capture new dependencies) if disposed
        if (state.isDisposed) {
            return;
        }

        if (state.disposeWhenNodeIsRemoved && !ko.utils.domNodeIsAttachedToDocument(state.disposeWhenNodeIsRemoved) || disposeWhen && disposeWhen()) {
            // See comment above about suppressDisposalUntilDisposeWhenReturnsFalse
            if (!state.suppressDisposalUntilDisposeWhenReturnsFalse) {
                computedObservable.dispose();
                return;
            }
        } else {
            // It just did return false, so we can stop suppressing now
            state.suppressDisposalUntilDisposeWhenReturnsFalse = false;
        }

        state.isBeingEvaluated = true;
        try {
            changed = this.evaluateImmediate_CallReadWithDependencyDetection(notifyChange);
        } finally {
            state.isBeingEvaluated = false;
        }

        if (!state.dependenciesCount) {
            computedObservable.dispose();
        }

        return changed;
    },
    evaluateImmediate_CallReadWithDependencyDetection: function (notifyChange) {
        // This function is really just part of the evaluateImmediate logic. You would never call it from anywhere else.
        // Factoring it out into a separate function means it can be independent of the try/catch block in evaluateImmediate,
        // which contributes to saving about 40% off the CPU overhead of computed evaluation (on V8 at least).

        var computedObservable = this,
            state = computedObservable[computedState],
            changed = false;

        // Initially, we assume that none of the subscriptions are still being used (i.e., all are candidates for disposal).
        // Then, during evaluation, we cross off any that are in fact still being used.
        var isInitial = state.pure ? undefined : !state.dependenciesCount,   // If we're evaluating when there are no previous dependencies, it must be the first time
            dependencyDetectionContext = {
                computedObservable: computedObservable,
                disposalCandidates: state.dependencyTracking,
                disposalCount: state.dependenciesCount
            };

        ko.dependencyDetection.begin({
            callbackTarget: dependencyDetectionContext,
            callback: computedBeginDependencyDetectionCallback,
            computed: computedObservable,
            isInitial: isInitial
        });

        state.dependencyTracking = {};
        state.dependenciesCount = 0;

        var newValue = this.evaluateImmediate_CallReadThenEndDependencyDetection(state, dependencyDetectionContext);

        if (computedObservable.isDifferent(state.latestValue, newValue)) {
            if (!state.isSleeping) {
                computedObservable["notifySubscribers"](state.latestValue, "beforeChange");
            }

            state.latestValue = newValue;
            if (DEBUG) computedObservable._latestValue = newValue;

            if (state.isSleeping) {
                computedObservable.updateVersion();
            } else if (notifyChange) {
                computedObservable["notifySubscribers"](state.latestValue);
            }

            changed = true;
        }

        if (isInitial) {
            computedObservable["notifySubscribers"](state.latestValue, "awake");
        }

        return changed;
    },
    evaluateImmediate_CallReadThenEndDependencyDetection: function (state, dependencyDetectionContext) {
        // This function is really part of the evaluateImmediate_CallReadWithDependencyDetection logic.
        // You'd never call it from anywhere else. Factoring it out means that evaluateImmediate_CallReadWithDependencyDetection
        // can be independent of try/finally blocks, which contributes to saving about 40% off the CPU
        // overhead of computed evaluation (on V8 at least).

        try {
            var readFunction = state.readFunction;
            return state.evaluatorFunctionTarget ? readFunction.call(state.evaluatorFunctionTarget) : readFunction();
        } finally {
            ko.dependencyDetection.end();

            // For each subscription no longer being used, remove it from the active subscriptions list and dispose it
            if (dependencyDetectionContext.disposalCount && !state.isSleeping) {
                ko.utils.objectForEach(dependencyDetectionContext.disposalCandidates, computedDisposeDependencyCallback);
            }

            state.isStale = state.isDirty = false;
        }
    },
    peek: function (evaluate) {
        // By default, peek won't re-evaluate, except while the computed is sleeping or to get the initial value when "deferEvaluation" is set.
        // Pass in true to evaluate if needed.
        var state = this[computedState];
        if ((state.isDirty && (evaluate || !state.dependenciesCount)) || (state.isSleeping && this.haveDependenciesChanged())) {
            this.evaluateImmediate();
        }
        return state.latestValue;
    },
    limit: function (limitFunction) {
        // Override the limit function with one that delays evaluation as well
        ko.subscribable['fn'].limit.call(this, limitFunction);
        this._evalIfChanged = function () {
            if (this[computedState].isStale) {
                this.evaluateImmediate();
            } else {
                this[computedState].isDirty = false;
            }
            return this[computedState].latestValue;
        };
        this._evalDelayed = function (isChange) {
            this._limitBeforeChange(this[computedState].latestValue);

            // Mark as dirty
            this[computedState].isDirty = true;
            if (isChange) {
                this[computedState].isStale = true;
            }

            // Pass the observable to the "limit" code, which will evaluate it when
            // it's time to do the notification.
            this._limitChange(this);
        };
    },
    dispose: function () {
        var state = this[computedState];
        if (!state.isSleeping && state.dependencyTracking) {
            ko.utils.objectForEach(state.dependencyTracking, function (id, dependency) {
                if (dependency.dispose)
                    dependency.dispose();
            });
        }
        if (state.disposeWhenNodeIsRemoved && state.domNodeDisposalCallback) {
            ko.utils.domNodeDisposal.removeDisposeCallback(state.disposeWhenNodeIsRemoved, state.domNodeDisposalCallback);
        }
        state.dependencyTracking = null;
        state.dependenciesCount = 0;
        state.isDisposed = true;
        state.isStale = false;
        state.isDirty = false;
        state.isSleeping = false;
        state.disposeWhenNodeIsRemoved = null;
    }
};

var pureComputedOverrides = {
    beforeSubscriptionAdd: function (event) {
        // If asleep, wake up the computed by subscribing to any dependencies.
        var computedObservable = this,
            state = computedObservable[computedState];
        if (!state.isDisposed && state.isSleeping && event == 'change') {
            state.isSleeping = false;
            if (state.isStale || computedObservable.haveDependenciesChanged()) {
                state.dependencyTracking = null;
                state.dependenciesCount = 0;
                if (computedObservable.evaluateImmediate()) {
                    computedObservable.updateVersion();
                }
            } else {
                // First put the dependencies in order
                var dependeciesOrder = [];
                ko.utils.objectForEach(state.dependencyTracking, function (id, dependency) {
                    dependeciesOrder[dependency._order] = id;
                });
                // Next, subscribe to each one
                ko.utils.arrayForEach(dependeciesOrder, function (id, order) {
                    var dependency = state.dependencyTracking[id],
                        subscription = computedObservable.subscribeToDependency(dependency._target);
                    subscription._order = order;
                    subscription._version = dependency._version;
                    state.dependencyTracking[id] = subscription;
                });
            }
            if (!state.isDisposed) {     // test since evaluating could trigger disposal
                computedObservable["notifySubscribers"](state.latestValue, "awake");
            }
        }
    },
    afterSubscriptionRemove: function (event) {
        var state = this[computedState];
        if (!state.isDisposed && event == 'change' && !this.hasSubscriptionsForEvent('change')) {
            ko.utils.objectForEach(state.dependencyTracking, function (id, dependency) {
                if (dependency.dispose) {
                    state.dependencyTracking[id] = {
                        _target: dependency._target,
                        _order: dependency._order,
                        _version: dependency._version
                    };
                    dependency.dispose();
                }
            });
            state.isSleeping = true;
            this["notifySubscribers"](undefined, "asleep");
        }
    },
    getVersion: function () {
        // Because a pure computed is not automatically updated while it is sleeping, we can't
        // simply return the version number. Instead, we check if any of the dependencies have
        // changed and conditionally re-evaluate the computed observable.
        var state = this[computedState];
        if (state.isSleeping && (state.isStale || this.haveDependenciesChanged())) {
            this.evaluateImmediate();
        }
        return ko.subscribable['fn'].getVersion.call(this);
    }
};

var deferEvaluationOverrides = {
    beforeSubscriptionAdd: function (event) {
        // This will force a computed with deferEvaluation to evaluate when the first subscription is registered.
        if (event == 'change' || event == 'beforeChange') {
            this.peek();
        }
    }
};

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.computed constructor
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(computedFn, ko.subscribable['fn']);
}

// Set the proto chain values for ko.hasPrototype
var protoProp = ko.observable.protoProperty; // == "__ko_proto__"
ko.computed[protoProp] = ko.observable;
computedFn[protoProp] = ko.computed;

ko.isComputed = function (instance) {
    return ko.hasPrototype(instance, ko.computed);
};

ko.isPureComputed = function (instance) {
    return ko.hasPrototype(instance, ko.computed)
        && instance[computedState] && instance[computedState].pure;
};

ko.exportSymbol('computed', ko.computed);
ko.exportSymbol('dependentObservable', ko.computed);    // export ko.dependentObservable for backwards compatibility (1.x)
ko.exportSymbol('isComputed', ko.isComputed);
ko.exportSymbol('isPureComputed', ko.isPureComputed);
ko.exportSymbol('computed.fn', computedFn);
ko.exportProperty(computedFn, 'peek', computedFn.peek);
ko.exportProperty(computedFn, 'dispose', computedFn.dispose);
ko.exportProperty(computedFn, 'isActive', computedFn.isActive);
ko.exportProperty(computedFn, 'getDependenciesCount', computedFn.getDependenciesCount);

ko.pureComputed = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget) {
    if (typeof evaluatorFunctionOrOptions === 'function') {
        return ko.computed(evaluatorFunctionOrOptions, evaluatorFunctionTarget, {'pure':true});
    } else {
        evaluatorFunctionOrOptions = ko.utils.extend({}, evaluatorFunctionOrOptions);   // make a copy of the parameter object
        evaluatorFunctionOrOptions['pure'] = true;
        return ko.computed(evaluatorFunctionOrOptions, evaluatorFunctionTarget);
    }
}
ko.exportSymbol('pureComputed', ko.pureComputed);

(function() {
    var maxNestedObservableDepth = 10; // Escape the (unlikely) pathalogical case where an observable's current value is itself (or similar reference cycle)

    ko.toJS = function(rootObject) {
        if (arguments.length == 0)
            throw new Error("When calling ko.toJS, pass the object you want to convert.");

        // We just unwrap everything at every level in the object graph
        return mapJsObjectGraph(rootObject, function(valueToMap) {
            // Loop because an observable's value might in turn be another observable wrapper
            for (var i = 0; ko.isObservable(valueToMap) && (i < maxNestedObservableDepth); i++)
                valueToMap = valueToMap();
            return valueToMap;
        });
    };

    ko.toJSON = function(rootObject, replacer, space) {     // replacer and space are optional
        var plainJavaScriptObject = ko.toJS(rootObject);
        return ko.utils.stringifyJson(plainJavaScriptObject, replacer, space);
    };

    function mapJsObjectGraph(rootObject, mapInputCallback, visitedObjects) {
        visitedObjects = visitedObjects || new objectLookup();

        rootObject = mapInputCallback(rootObject);
        var canHaveProperties = (typeof rootObject == "object") && (rootObject !== null) && (rootObject !== undefined) && (!(rootObject instanceof RegExp)) && (!(rootObject instanceof Date)) && (!(rootObject instanceof String)) && (!(rootObject instanceof Number)) && (!(rootObject instanceof Boolean));
        if (!canHaveProperties)
            return rootObject;

        var outputProperties = rootObject instanceof Array ? [] : {};
        visitedObjects.save(rootObject, outputProperties);

        visitPropertiesOrArrayEntries(rootObject, function(indexer) {
            var propertyValue = mapInputCallback(rootObject[indexer]);

            switch (typeof propertyValue) {
                case "boolean":
                case "number":
                case "string":
                case "function":
                    outputProperties[indexer] = propertyValue;
                    break;
                case "object":
                case "undefined":
                    var previouslyMappedValue = visitedObjects.get(propertyValue);
                    outputProperties[indexer] = (previouslyMappedValue !== undefined)
                        ? previouslyMappedValue
                        : mapJsObjectGraph(propertyValue, mapInputCallback, visitedObjects);
                    break;
            }
        });

        return outputProperties;
    }

    function visitPropertiesOrArrayEntries(rootObject, visitorCallback) {
        if (rootObject instanceof Array) {
            for (var i = 0; i < rootObject.length; i++)
                visitorCallback(i);

            // For arrays, also respect toJSON property for custom mappings (fixes #278)
            if (typeof rootObject['toJSON'] == 'function')
                visitorCallback('toJSON');
        } else {
            for (var propertyName in rootObject) {
                visitorCallback(propertyName);
            }
        }
    };

    function objectLookup() {
        this.keys = [];
        this.values = [];
    };

    objectLookup.prototype = {
        constructor: objectLookup,
        save: function(key, value) {
            var existingIndex = ko.utils.arrayIndexOf(this.keys, key);
            if (existingIndex >= 0)
                this.values[existingIndex] = value;
            else {
                this.keys.push(key);
                this.values.push(value);
            }
        },
        get: function(key) {
            var existingIndex = ko.utils.arrayIndexOf(this.keys, key);
            return (existingIndex >= 0) ? this.values[existingIndex] : undefined;
        }
    };
})();

ko.exportSymbol('toJS', ko.toJS);
ko.exportSymbol('toJSON', ko.toJSON);
(function () {
    var hasDomDataExpandoProperty = '__ko__hasDomDataOptionValue__';

    // Normally, SELECT elements and their OPTIONs can only take value of type 'string' (because the values
    // are stored on DOM attributes). ko.selectExtensions provides a way for SELECTs/OPTIONs to have values
    // that are arbitrary objects. This is very convenient when implementing things like cascading dropdowns.
    ko.selectExtensions = {
        readValue : function(element) {
            switch (ko.utils.tagNameLower(element)) {
                case 'option':
                    if (element[hasDomDataExpandoProperty] === true)
                        return ko.utils.domData.get(element, ko.bindingHandlers.options.optionValueDomDataKey);
                    return ko.utils.ieVersion <= 7
                        ? (element.getAttributeNode('value') && element.getAttributeNode('value').specified ? element.value : element.text)
                        : element.value;
                case 'select':
                    return element.selectedIndex >= 0 ? ko.selectExtensions.readValue(element.options[element.selectedIndex]) : undefined;
                default:
                    return element.value;
            }
        },

        writeValue: function(element, value, allowUnset) {
            switch (ko.utils.tagNameLower(element)) {
                case 'option':
                    switch(typeof value) {
                        case "string":
                            ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, undefined);
                            if (hasDomDataExpandoProperty in element) { // IE <= 8 throws errors if you delete non-existent properties from a DOM node
                                delete element[hasDomDataExpandoProperty];
                            }
                            element.value = value;
                            break;
                        default:
                            // Store arbitrary object using DomData
                            ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, value);
                            element[hasDomDataExpandoProperty] = true;

                            // Special treatment of numbers is just for backward compatibility. KO 1.2.1 wrote numerical values to element.value.
                            element.value = typeof value === "number" ? value : "";
                            break;
                    }
                    break;
                case 'select':
                    if (value === "" || value === null)       // A blank string or null value will select the caption
                        value = undefined;
                    var selection = -1;
                    for (var i = 0, n = element.options.length, optionValue; i < n; ++i) {
                        optionValue = ko.selectExtensions.readValue(element.options[i]);
                        // Include special check to handle selecting a caption with a blank string value
                        if (optionValue == value || (optionValue == "" && value === undefined)) {
                            selection = i;
                            break;
                        }
                    }
                    if (allowUnset || selection >= 0 || (value === undefined && element.size > 1)) {
                        element.selectedIndex = selection;
                    }
                    break;
                default:
                    if ((value === null) || (value === undefined))
                        value = "";
                    element.value = value;
                    break;
            }
        }
    };
})();

ko.exportSymbol('selectExtensions', ko.selectExtensions);
ko.exportSymbol('selectExtensions.readValue', ko.selectExtensions.readValue);
ko.exportSymbol('selectExtensions.writeValue', ko.selectExtensions.writeValue);
ko.expressionRewriting = (function () {
    var javaScriptReservedWords = ["true", "false", "null", "undefined"];

    // Matches something that can be assigned to--either an isolated identifier or something ending with a property accessor
    // This is designed to be simple and avoid false negatives, but could produce false positives (e.g., a+b.c).
    // This also will not properly handle nested brackets (e.g., obj1[obj2['prop']]; see #911).
    var javaScriptAssignmentTarget = /^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i;

    function getWriteableValue(expression) {
        if (ko.utils.arrayIndexOf(javaScriptReservedWords, expression) >= 0)
            return false;
        var match = expression.match(javaScriptAssignmentTarget);
        return match === null ? false : match[1] ? ('Object(' + match[1] + ')' + match[2]) : expression;
    }

    // The following regular expressions will be used to split an object-literal string into tokens

        // These two match strings, either with double quotes or single quotes
    var stringDouble = '"(?:[^"\\\\]|\\\\.)*"',
        stringSingle = "'(?:[^'\\\\]|\\\\.)*'",
        // Matches a regular expression (text enclosed by slashes), but will also match sets of divisions
        // as a regular expression (this is handled by the parsing loop below).
        stringRegexp = '/(?:[^/\\\\]|\\\\.)*/\w*',
        // These characters have special meaning to the parser and must not appear in the middle of a
        // token, except as part of a string.
        specials = ',"\'{}()/:[\\]',
        // Match text (at least two characters) that does not contain any of the above special characters,
        // although some of the special characters are allowed to start it (all but the colon and comma).
        // The text can contain spaces, but leading or trailing spaces are skipped.
        everyThingElse = '[^\\s:,/][^' + specials + ']*[^\\s' + specials + ']',
        // Match any non-space character not matched already. This will match colons and commas, since they're
        // not matched by "everyThingElse", but will also match any other single character that wasn't already
        // matched (for example: in "a: 1, b: 2", each of the non-space characters will be matched by oneNotSpace).
        oneNotSpace = '[^\\s]',

        // Create the actual regular expression by or-ing the above strings. The order is important.
        bindingToken = RegExp(stringDouble + '|' + stringSingle + '|' + stringRegexp + '|' + everyThingElse + '|' + oneNotSpace, 'g'),

        // Match end of previous token to determine whether a slash is a division or regex.
        divisionLookBehind = /[\])"'A-Za-z0-9_$]+$/,
        keywordRegexLookBehind = {'in':1,'return':1,'typeof':1};

    function parseObjectLiteral(objectLiteralString) {
        // Trim leading and trailing spaces from the string
        var str = ko.utils.stringTrim(objectLiteralString);

        // Trim braces '{' surrounding the whole object literal
        if (str.charCodeAt(0) === 123) str = str.slice(1, -1);

        // Split into tokens
        var result = [], toks = str.match(bindingToken), key, values = [], depth = 0;

        if (toks) {
            // Append a comma so that we don't need a separate code block to deal with the last item
            toks.push(',');

            for (var i = 0, tok; tok = toks[i]; ++i) {
                var c = tok.charCodeAt(0);
                // A comma signals the end of a key/value pair if depth is zero
                if (c === 44) { // ","
                    if (depth <= 0) {
                        result.push((key && values.length) ? {key: key, value: values.join('')} : {'unknown': key || values.join('')});
                        key = depth = 0;
                        values = [];
                        continue;
                    }
                // Simply skip the colon that separates the name and value
                } else if (c === 58) { // ":"
                    if (!depth && !key && values.length === 1) {
                        key = values.pop();
                        continue;
                    }
                // A set of slashes is initially matched as a regular expression, but could be division
                } else if (c === 47 && i && tok.length > 1) {  // "/"
                    // Look at the end of the previous token to determine if the slash is actually division
                    var match = toks[i-1].match(divisionLookBehind);
                    if (match && !keywordRegexLookBehind[match[0]]) {
                        // The slash is actually a division punctuator; re-parse the remainder of the string (not including the slash)
                        str = str.substr(str.indexOf(tok) + 1);
                        toks = str.match(bindingToken);
                        toks.push(',');
                        i = -1;
                        // Continue with just the slash
                        tok = '/';
                    }
                // Increment depth for parentheses, braces, and brackets so that interior commas are ignored
                } else if (c === 40 || c === 123 || c === 91) { // '(', '{', '['
                    ++depth;
                } else if (c === 41 || c === 125 || c === 93) { // ')', '}', ']'
                    --depth;
                // The key will be the first token; if it's a string, trim the quotes
                } else if (!key && !values.length && (c === 34 || c === 39)) { // '"', "'"
                    tok = tok.slice(1, -1);
                }
                values.push(tok);
            }
        }
        return result;
    }

    // Two-way bindings include a write function that allow the handler to update the value even if it's not an observable.
    var twoWayBindings = {};

    function preProcessBindings(bindingsStringOrKeyValueArray, bindingOptions) {
        bindingOptions = bindingOptions || {};

        function processKeyValue(key, val) {
            var writableVal;
            function callPreprocessHook(obj) {
                return (obj && obj['preprocess']) ? (val = obj['preprocess'](val, key, processKeyValue)) : true;
            }
            if (!bindingParams) {
                if (!callPreprocessHook(ko['getBindingHandler'](key)))
                    return;

                if (twoWayBindings[key] && (writableVal = getWriteableValue(val))) {
                    // For two-way bindings, provide a write method in case the value
                    // isn't a writable observable.
                    propertyAccessorResultStrings.push("'" + key + "':function(_z){" + writableVal + "=_z}");
                }
            }
            // Values are wrapped in a function so that each value can be accessed independently
            if (makeValueAccessors) {
                val = 'function(){return ' + val + ' }';
            }
            resultStrings.push("'" + key + "':" + val);
        }

        var resultStrings = [],
            propertyAccessorResultStrings = [],
            makeValueAccessors = bindingOptions['valueAccessors'],
            bindingParams = bindingOptions['bindingParams'],
            keyValueArray = typeof bindingsStringOrKeyValueArray === "string" ?
                parseObjectLiteral(bindingsStringOrKeyValueArray) : bindingsStringOrKeyValueArray;

        ko.utils.arrayForEach(keyValueArray, function(keyValue) {
            processKeyValue(keyValue.key || keyValue['unknown'], keyValue.value);
        });

        if (propertyAccessorResultStrings.length)
            processKeyValue('_ko_property_writers', "{" + propertyAccessorResultStrings.join(",") + " }");

        return resultStrings.join(",");
    }

    return {
        bindingRewriteValidators: [],

        twoWayBindings: twoWayBindings,

        parseObjectLiteral: parseObjectLiteral,

        preProcessBindings: preProcessBindings,

        keyValueArrayContainsKey: function(keyValueArray, key) {
            for (var i = 0; i < keyValueArray.length; i++)
                if (keyValueArray[i]['key'] == key)
                    return true;
            return false;
        },

        // Internal, private KO utility for updating model properties from within bindings
        // property:            If the property being updated is (or might be) an observable, pass it here
        //                      If it turns out to be a writable observable, it will be written to directly
        // allBindings:         An object with a get method to retrieve bindings in the current execution context.
        //                      This will be searched for a '_ko_property_writers' property in case you're writing to a non-observable
        // key:                 The key identifying the property to be written. Example: for { hasFocus: myValue }, write to 'myValue' by specifying the key 'hasFocus'
        // value:               The value to be written
        // checkIfDifferent:    If true, and if the property being written is a writable observable, the value will only be written if
        //                      it is !== existing value on that writable observable
        writeValueToProperty: function(property, allBindings, key, value, checkIfDifferent) {
            if (!property || !ko.isObservable(property)) {
                var propWriters = allBindings.get('_ko_property_writers');
                if (propWriters && propWriters[key])
                    propWriters[key](value);
            } else if (ko.isWriteableObservable(property) && (!checkIfDifferent || property.peek() !== value)) {
                property(value);
            }
        }
    };
})();

ko.exportSymbol('expressionRewriting', ko.expressionRewriting);
ko.exportSymbol('expressionRewriting.bindingRewriteValidators', ko.expressionRewriting.bindingRewriteValidators);
ko.exportSymbol('expressionRewriting.parseObjectLiteral', ko.expressionRewriting.parseObjectLiteral);
ko.exportSymbol('expressionRewriting.preProcessBindings', ko.expressionRewriting.preProcessBindings);

// Making bindings explicitly declare themselves as "two way" isn't ideal in the long term (it would be better if
// all bindings could use an official 'property writer' API without needing to declare that they might). However,
// since this is not, and has never been, a public API (_ko_property_writers was never documented), it's acceptable
// as an internal implementation detail in the short term.
// For those developers who rely on _ko_property_writers in their custom bindings, we expose _twoWayBindings as an
// undocumented feature that makes it relatively easy to upgrade to KO 3.0. However, this is still not an official
// public API, and we reserve the right to remove it at any time if we create a real public property writers API.
ko.exportSymbol('expressionRewriting._twoWayBindings', ko.expressionRewriting.twoWayBindings);

// For backward compatibility, define the following aliases. (Previously, these function names were misleading because
// they referred to JSON specifically, even though they actually work with arbitrary JavaScript object literal expressions.)
ko.exportSymbol('jsonExpressionRewriting', ko.expressionRewriting);
ko.exportSymbol('jsonExpressionRewriting.insertPropertyAccessorsIntoJson', ko.expressionRewriting.preProcessBindings);
(function() {
    // "Virtual elements" is an abstraction on top of the usual DOM API which understands the notion that comment nodes
    // may be used to represent hierarchy (in addition to the DOM's natural hierarchy).
    // If you call the DOM-manipulating functions on ko.virtualElements, you will be able to read and write the state
    // of that virtual hierarchy
    //
    // The point of all this is to support containerless templates (e.g., <!-- ko foreach:someCollection -->blah<!-- /ko -->)
    // without having to scatter special cases all over the binding and templating code.

    // IE 9 cannot reliably read the "nodeValue" property of a comment node (see https://github.com/SteveSanderson/knockout/issues/186)
    // but it does give them a nonstandard alternative property called "text" that it can read reliably. Other browsers don't have that property.
    // So, use node.text where available, and node.nodeValue elsewhere
    var commentNodesHaveTextProperty = document && document.createComment("test").text === "<!--test-->";

    var startCommentRegex = commentNodesHaveTextProperty ? /^<!--\s*ko(?:\s+([\s\S]+))?\s*-->$/ : /^\s*ko(?:\s+([\s\S]+))?\s*$/;
    var endCommentRegex =   commentNodesHaveTextProperty ? /^<!--\s*\/ko\s*-->$/ : /^\s*\/ko\s*$/;
    var htmlTagsWithOptionallyClosingChildren = { 'ul': true, 'ol': true };

    function isStartComment(node) {
        return (node.nodeType == 8) && startCommentRegex.test(commentNodesHaveTextProperty ? node.text : node.nodeValue);
    }

    function isEndComment(node) {
        return (node.nodeType == 8) && endCommentRegex.test(commentNodesHaveTextProperty ? node.text : node.nodeValue);
    }

    function getVirtualChildren(startComment, allowUnbalanced) {
        var currentNode = startComment;
        var depth = 1;
        var children = [];
        while (currentNode = currentNode.nextSibling) {
            if (isEndComment(currentNode)) {
                depth--;
                if (depth === 0)
                    return children;
            }

            children.push(currentNode);

            if (isStartComment(currentNode))
                depth++;
        }
        if (!allowUnbalanced)
            throw new Error("Cannot find closing comment tag to match: " + startComment.nodeValue);
        return null;
    }

    function getMatchingEndComment(startComment, allowUnbalanced) {
        var allVirtualChildren = getVirtualChildren(startComment, allowUnbalanced);
        if (allVirtualChildren) {
            if (allVirtualChildren.length > 0)
                return allVirtualChildren[allVirtualChildren.length - 1].nextSibling;
            return startComment.nextSibling;
        } else
            return null; // Must have no matching end comment, and allowUnbalanced is true
    }

    function getUnbalancedChildTags(node) {
        // e.g., from <div>OK</div><!-- ko blah --><span>Another</span>, returns: <!-- ko blah --><span>Another</span>
        //       from <div>OK</div><!-- /ko --><!-- /ko -->,             returns: <!-- /ko --><!-- /ko -->
        var childNode = node.firstChild, captureRemaining = null;
        if (childNode) {
            do {
                if (captureRemaining)                   // We already hit an unbalanced node and are now just scooping up all subsequent nodes
                    captureRemaining.push(childNode);
                else if (isStartComment(childNode)) {
                    var matchingEndComment = getMatchingEndComment(childNode, /* allowUnbalanced: */ true);
                    if (matchingEndComment)             // It's a balanced tag, so skip immediately to the end of this virtual set
                        childNode = matchingEndComment;
                    else
                        captureRemaining = [childNode]; // It's unbalanced, so start capturing from this point
                } else if (isEndComment(childNode)) {
                    captureRemaining = [childNode];     // It's unbalanced (if it wasn't, we'd have skipped over it already), so start capturing
                }
            } while (childNode = childNode.nextSibling);
        }
        return captureRemaining;
    }

    ko.virtualElements = {
        allowedBindings: {},

        childNodes: function(node) {
            return isStartComment(node) ? getVirtualChildren(node) : node.childNodes;
        },

        emptyNode: function(node) {
            if (!isStartComment(node))
                ko.utils.emptyDomNode(node);
            else {
                var virtualChildren = ko.virtualElements.childNodes(node);
                for (var i = 0, j = virtualChildren.length; i < j; i++)
                    ko.removeNode(virtualChildren[i]);
            }
        },

        setDomNodeChildren: function(node, childNodes) {
            if (!isStartComment(node))
                ko.utils.setDomNodeChildren(node, childNodes);
            else {
                ko.virtualElements.emptyNode(node);
                var endCommentNode = node.nextSibling; // Must be the next sibling, as we just emptied the children
                for (var i = 0, j = childNodes.length; i < j; i++)
                    endCommentNode.parentNode.insertBefore(childNodes[i], endCommentNode);
            }
        },

        prepend: function(containerNode, nodeToPrepend) {
            if (!isStartComment(containerNode)) {
                if (containerNode.firstChild)
                    containerNode.insertBefore(nodeToPrepend, containerNode.firstChild);
                else
                    containerNode.appendChild(nodeToPrepend);
            } else {
                // Start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToPrepend, containerNode.nextSibling);
            }
        },

        insertAfter: function(containerNode, nodeToInsert, insertAfterNode) {
            if (!insertAfterNode) {
                ko.virtualElements.prepend(containerNode, nodeToInsert);
            } else if (!isStartComment(containerNode)) {
                // Insert after insertion point
                if (insertAfterNode.nextSibling)
                    containerNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
                else
                    containerNode.appendChild(nodeToInsert);
            } else {
                // Children of start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
            }
        },

        firstChild: function(node) {
            if (!isStartComment(node))
                return node.firstChild;
            if (!node.nextSibling || isEndComment(node.nextSibling))
                return null;
            return node.nextSibling;
        },

        nextSibling: function(node) {
            if (isStartComment(node))
                node = getMatchingEndComment(node);
            if (node.nextSibling && isEndComment(node.nextSibling))
                return null;
            return node.nextSibling;
        },

        hasBindingValue: isStartComment,

        virtualNodeBindingValue: function(node) {
            var regexMatch = (commentNodesHaveTextProperty ? node.text : node.nodeValue).match(startCommentRegex);
            return regexMatch ? regexMatch[1] : null;
        },

        normaliseVirtualElementDomStructure: function(elementVerified) {
            // Workaround for https://github.com/SteveSanderson/knockout/issues/155
            // (IE <= 8 or IE 9 quirks mode parses your HTML weirdly, treating closing </li> tags as if they don't exist, thereby moving comment nodes
            // that are direct descendants of <ul> into the preceding <li>)
            if (!htmlTagsWithOptionallyClosingChildren[ko.utils.tagNameLower(elementVerified)])
                return;

            // Scan immediate children to see if they contain unbalanced comment tags. If they do, those comment tags
            // must be intended to appear *after* that child, so move them there.
            var childNode = elementVerified.firstChild;
            if (childNode) {
                do {
                    if (childNode.nodeType === 1) {
                        var unbalancedTags = getUnbalancedChildTags(childNode);
                        if (unbalancedTags) {
                            // Fix up the DOM by moving the unbalanced tags to where they most likely were intended to be placed - *after* the child
                            var nodeToInsertBefore = childNode.nextSibling;
                            for (var i = 0; i < unbalancedTags.length; i++) {
                                if (nodeToInsertBefore)
                                    elementVerified.insertBefore(unbalancedTags[i], nodeToInsertBefore);
                                else
                                    elementVerified.appendChild(unbalancedTags[i]);
                            }
                        }
                    }
                } while (childNode = childNode.nextSibling);
            }
        }
    };
})();
ko.exportSymbol('virtualElements', ko.virtualElements);
ko.exportSymbol('virtualElements.allowedBindings', ko.virtualElements.allowedBindings);
ko.exportSymbol('virtualElements.emptyNode', ko.virtualElements.emptyNode);
//ko.exportSymbol('virtualElements.firstChild', ko.virtualElements.firstChild);     // firstChild is not minified
ko.exportSymbol('virtualElements.insertAfter', ko.virtualElements.insertAfter);
//ko.exportSymbol('virtualElements.nextSibling', ko.virtualElements.nextSibling);   // nextSibling is not minified
ko.exportSymbol('virtualElements.prepend', ko.virtualElements.prepend);
ko.exportSymbol('virtualElements.setDomNodeChildren', ko.virtualElements.setDomNodeChildren);
(function() {
    var defaultBindingAttributeName = "data-bind";

    ko.bindingProvider = function() {
        this.bindingCache = {};
    };

    ko.utils.extend(ko.bindingProvider.prototype, {
        'nodeHasBindings': function(node) {
            switch (node.nodeType) {
                case 1: // Element
                    return node.getAttribute(defaultBindingAttributeName) != null
                        || ko.components['getComponentNameForNode'](node);
                case 8: // Comment node
                    return ko.virtualElements.hasBindingValue(node);
                default: return false;
            }
        },

        'getBindings': function(node, bindingContext) {
            var bindingsString = this['getBindingsString'](node, bindingContext),
                parsedBindings = bindingsString ? this['parseBindingsString'](bindingsString, bindingContext, node) : null;
            return ko.components.addBindingsForCustomElement(parsedBindings, node, bindingContext, /* valueAccessors */ false);
        },

        'getBindingAccessors': function(node, bindingContext) {
            var bindingsString = this['getBindingsString'](node, bindingContext),
                parsedBindings = bindingsString ? this['parseBindingsString'](bindingsString, bindingContext, node, { 'valueAccessors': true }) : null;
            return ko.components.addBindingsForCustomElement(parsedBindings, node, bindingContext, /* valueAccessors */ true);
        },

        // The following function is only used internally by this default provider.
        // It's not part of the interface definition for a general binding provider.
        'getBindingsString': function(node, bindingContext) {
            switch (node.nodeType) {
                case 1: return node.getAttribute(defaultBindingAttributeName);   // Element
                case 8: return ko.virtualElements.virtualNodeBindingValue(node); // Comment node
                default: return null;
            }
        },

        // The following function is only used internally by this default provider.
        // It's not part of the interface definition for a general binding provider.
        'parseBindingsString': function(bindingsString, bindingContext, node, options) {
            try {
                var bindingFunction = createBindingsStringEvaluatorViaCache(bindingsString, this.bindingCache, options);
                return bindingFunction(bindingContext, node);
            } catch (ex) {
                ex.message = "Unable to parse bindings.\nBindings value: " + bindingsString + "\nMessage: " + ex.message;
                throw ex;
            }
        }
    });

    ko.bindingProvider['instance'] = new ko.bindingProvider();

    function createBindingsStringEvaluatorViaCache(bindingsString, cache, options) {
        var cacheKey = bindingsString + (options && options['valueAccessors'] || '');
        return cache[cacheKey]
            || (cache[cacheKey] = createBindingsStringEvaluator(bindingsString, options));
    }

    function createBindingsStringEvaluator(bindingsString, options) {
        // Build the source for a function that evaluates "expression"
        // For each scope variable, add an extra level of "with" nesting
        // Example result: with(sc1) { with(sc0) { return (expression) } }
        var rewrittenBindings = ko.expressionRewriting.preProcessBindings(bindingsString, options),
            functionBody = "with($context){with($data||{}){return{" + rewrittenBindings + "}}}";
        return new Function("$context", "$element", functionBody);
    }
})();

ko.exportSymbol('bindingProvider', ko.bindingProvider);
(function () {
    ko.bindingHandlers = {};

    // The following element types will not be recursed into during binding.
    var bindingDoesNotRecurseIntoElementTypes = {
        // Don't want bindings that operate on text nodes to mutate <script> and <textarea> contents,
        // because it's unexpected and a potential XSS issue.
        // Also bindings should not operate on <template> elements since this breaks in Internet Explorer
        // and because such elements' contents are always intended to be bound in a different context
        // from where they appear in the document.
        'script': true,
        'textarea': true,
        'template': true
    };

    // Use an overridable method for retrieving binding handlers so that a plugins may support dynamically created handlers
    ko['getBindingHandler'] = function(bindingKey) {
        return ko.bindingHandlers[bindingKey];
    };

    // The ko.bindingContext constructor is only called directly to create the root context. For child
    // contexts, use bindingContext.createChildContext or bindingContext.extend.
    ko.bindingContext = function(dataItemOrAccessor, parentContext, dataItemAlias, extendCallback, options) {

        // The binding context object includes static properties for the current, parent, and root view models.
        // If a view model is actually stored in an observable, the corresponding binding context object, and
        // any child contexts, must be updated when the view model is changed.
        function updateContext() {
            // Most of the time, the context will directly get a view model object, but if a function is given,
            // we call the function to retrieve the view model. If the function accesses any observables or returns
            // an observable, the dependency is tracked, and those observables can later cause the binding
            // context to be updated.
            var dataItemOrObservable = isFunc ? dataItemOrAccessor() : dataItemOrAccessor,
                dataItem = ko.utils.unwrapObservable(dataItemOrObservable);

            if (parentContext) {
                // When a "parent" context is given, register a dependency on the parent context. Thus whenever the
                // parent context is updated, this context will also be updated.
                if (parentContext._subscribable)
                    parentContext._subscribable();

                // Copy $root and any custom properties from the parent context
                ko.utils.extend(self, parentContext);

                // Because the above copy overwrites our own properties, we need to reset them.
                self._subscribable = subscribable;
            } else {
                self['$parents'] = [];
                self['$root'] = dataItem;

                // Export 'ko' in the binding context so it will be available in bindings and templates
                // even if 'ko' isn't exported as a global, such as when using an AMD loader.
                // See https://github.com/SteveSanderson/knockout/issues/490
                self['ko'] = ko;
            }
            self['$rawData'] = dataItemOrObservable;
            self['$data'] = dataItem;
            if (dataItemAlias)
                self[dataItemAlias] = dataItem;

            // The extendCallback function is provided when creating a child context or extending a context.
            // It handles the specific actions needed to finish setting up the binding context. Actions in this
            // function could also add dependencies to this binding context.
            if (extendCallback)
                extendCallback(self, parentContext, dataItem);

            return self['$data'];
        }
        function disposeWhen() {
            return nodes && !ko.utils.anyDomNodeIsAttachedToDocument(nodes);
        }

        var self = this,
            isFunc = typeof(dataItemOrAccessor) == "function" && !ko.isObservable(dataItemOrAccessor),
            nodes,
            subscribable;

        if (options && options['exportDependencies']) {
            // The "exportDependencies" option means that the calling code will track any dependencies and re-create
            // the binding context when they change.
            updateContext();
        } else {
            subscribable = ko.dependentObservable(updateContext, null, { disposeWhen: disposeWhen, disposeWhenNodeIsRemoved: true });

            // At this point, the binding context has been initialized, and the "subscribable" computed observable is
            // subscribed to any observables that were accessed in the process. If there is nothing to track, the
            // computed will be inactive, and we can safely throw it away. If it's active, the computed is stored in
            // the context object.
            if (subscribable.isActive()) {
                self._subscribable = subscribable;

                // Always notify because even if the model ($data) hasn't changed, other context properties might have changed
                subscribable['equalityComparer'] = null;

                // We need to be able to dispose of this computed observable when it's no longer needed. This would be
                // easy if we had a single node to watch, but binding contexts can be used by many different nodes, and
                // we cannot assume that those nodes have any relation to each other. So instead we track any node that
                // the context is attached to, and dispose the computed when all of those nodes have been cleaned.

                // Add properties to *subscribable* instead of *self* because any properties added to *self* may be overwritten on updates
                nodes = [];
                subscribable._addNode = function(node) {
                    nodes.push(node);
                    ko.utils.domNodeDisposal.addDisposeCallback(node, function(node) {
                        ko.utils.arrayRemoveItem(nodes, node);
                        if (!nodes.length) {
                            subscribable.dispose();
                            self._subscribable = subscribable = undefined;
                        }
                    });
                };
            }
        }
    }

    // Extend the binding context hierarchy with a new view model object. If the parent context is watching
    // any observables, the new child context will automatically get a dependency on the parent context.
    // But this does not mean that the $data value of the child context will also get updated. If the child
    // view model also depends on the parent view model, you must provide a function that returns the correct
    // view model on each update.
    ko.bindingContext.prototype['createChildContext'] = function (dataItemOrAccessor, dataItemAlias, extendCallback, options) {
        return new ko.bindingContext(dataItemOrAccessor, this, dataItemAlias, function(self, parentContext) {
            // Extend the context hierarchy by setting the appropriate pointers
            self['$parentContext'] = parentContext;
            self['$parent'] = parentContext['$data'];
            self['$parents'] = (parentContext['$parents'] || []).slice(0);
            self['$parents'].unshift(self['$parent']);
            if (extendCallback)
                extendCallback(self);
        }, options);
    };

    // Extend the binding context with new custom properties. This doesn't change the context hierarchy.
    // Similarly to "child" contexts, provide a function here to make sure that the correct values are set
    // when an observable view model is updated.
    ko.bindingContext.prototype['extend'] = function(properties) {
        // If the parent context references an observable view model, "_subscribable" will always be the
        // latest view model object. If not, "_subscribable" isn't set, and we can use the static "$data" value.
        return new ko.bindingContext(this._subscribable || this['$data'], this, null, function(self, parentContext) {
            // This "child" context doesn't directly track a parent observable view model,
            // so we need to manually set the $rawData value to match the parent.
            self['$rawData'] = parentContext['$rawData'];
            ko.utils.extend(self, typeof(properties) == "function" ? properties() : properties);
        });
    };

    ko.bindingContext.prototype.createStaticChildContext = function (dataItemOrAccessor, dataItemAlias) {
        return this['createChildContext'](dataItemOrAccessor, dataItemAlias, null, { "exportDependencies": true });
    };

    // Returns the valueAccesor function for a binding value
    function makeValueAccessor(value) {
        return function() {
            return value;
        };
    }

    // Returns the value of a valueAccessor function
    function evaluateValueAccessor(valueAccessor) {
        return valueAccessor();
    }

    // Given a function that returns bindings, create and return a new object that contains
    // binding value-accessors functions. Each accessor function calls the original function
    // so that it always gets the latest value and all dependencies are captured. This is used
    // by ko.applyBindingsToNode and getBindingsAndMakeAccessors.
    function makeAccessorsFromFunction(callback) {
        return ko.utils.objectMap(ko.dependencyDetection.ignore(callback), function(value, key) {
            return function() {
                return callback()[key];
            };
        });
    }

    // Given a bindings function or object, create and return a new object that contains
    // binding value-accessors functions. This is used by ko.applyBindingsToNode.
    function makeBindingAccessors(bindings, context, node) {
        if (typeof bindings === 'function') {
            return makeAccessorsFromFunction(bindings.bind(null, context, node));
        } else {
            return ko.utils.objectMap(bindings, makeValueAccessor);
        }
    }

    // This function is used if the binding provider doesn't include a getBindingAccessors function.
    // It must be called with 'this' set to the provider instance.
    function getBindingsAndMakeAccessors(node, context) {
        return makeAccessorsFromFunction(this['getBindings'].bind(this, node, context));
    }

    function validateThatBindingIsAllowedForVirtualElements(bindingName) {
        var validator = ko.virtualElements.allowedBindings[bindingName];
        if (!validator)
            throw new Error("The binding '" + bindingName + "' cannot be used with virtual elements")
    }

    function applyBindingsToDescendantsInternal (bindingContext, elementOrVirtualElement, bindingContextsMayDifferFromDomParentElement) {
        var currentChild,
            nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement),
            provider = ko.bindingProvider['instance'],
            preprocessNode = provider['preprocessNode'];

        // Preprocessing allows a binding provider to mutate a node before bindings are applied to it. For example it's
        // possible to insert new siblings after it, and/or replace the node with a different one. This can be used to
        // implement custom binding syntaxes, such as {{ value }} for string interpolation, or custom element types that
        // trigger insertion of <template> contents at that point in the document.
        if (preprocessNode) {
            while (currentChild = nextInQueue) {
                nextInQueue = ko.virtualElements.nextSibling(currentChild);
                preprocessNode.call(provider, currentChild);
            }
            // Reset nextInQueue for the next loop
            nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement);
        }

        while (currentChild = nextInQueue) {
            // Keep a record of the next child *before* applying bindings, in case the binding removes the current child from its position
            nextInQueue = ko.virtualElements.nextSibling(currentChild);
            applyBindingsToNodeAndDescendantsInternal(bindingContext, currentChild, bindingContextsMayDifferFromDomParentElement);
        }
    }

    function applyBindingsToNodeAndDescendantsInternal (bindingContext, nodeVerified, bindingContextMayDifferFromDomParentElement) {
        var shouldBindDescendants = true;

        // Perf optimisation: Apply bindings only if...
        // (1) We need to store the binding context on this node (because it may differ from the DOM parent node's binding context)
        //     Note that we can't store binding contexts on non-elements (e.g., text nodes), as IE doesn't allow expando properties for those
        // (2) It might have bindings (e.g., it has a data-bind attribute, or it's a marker for a containerless template)
        var isElement = (nodeVerified.nodeType === 1);
        if (isElement) // Workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(nodeVerified);

        var shouldApplyBindings = (isElement && bindingContextMayDifferFromDomParentElement)             // Case (1)
                               || ko.bindingProvider['instance']['nodeHasBindings'](nodeVerified);       // Case (2)
        if (shouldApplyBindings)
            shouldBindDescendants = applyBindingsToNodeInternal(nodeVerified, null, bindingContext, bindingContextMayDifferFromDomParentElement)['shouldBindDescendants'];

        if (shouldBindDescendants && !bindingDoesNotRecurseIntoElementTypes[ko.utils.tagNameLower(nodeVerified)]) {
            // We're recursing automatically into (real or virtual) child nodes without changing binding contexts. So,
            //  * For children of a *real* element, the binding context is certainly the same as on their DOM .parentNode,
            //    hence bindingContextsMayDifferFromDomParentElement is false
            //  * For children of a *virtual* element, we can't be sure. Evaluating .parentNode on those children may
            //    skip over any number of intermediate virtual elements, any of which might define a custom binding context,
            //    hence bindingContextsMayDifferFromDomParentElement is true
            applyBindingsToDescendantsInternal(bindingContext, nodeVerified, /* bindingContextsMayDifferFromDomParentElement: */ !isElement);
        }
    }

    var boundElementDomDataKey = ko.utils.domData.nextKey();


    function topologicalSortBindings(bindings) {
        // Depth-first sort
        var result = [],                // The list of key/handler pairs that we will return
            bindingsConsidered = {},    // A temporary record of which bindings are already in 'result'
            cyclicDependencyStack = []; // Keeps track of a depth-search so that, if there's a cycle, we know which bindings caused it
        ko.utils.objectForEach(bindings, function pushBinding(bindingKey) {
            if (!bindingsConsidered[bindingKey]) {
                var binding = ko['getBindingHandler'](bindingKey);
                if (binding) {
                    // First add dependencies (if any) of the current binding
                    if (binding['after']) {
                        cyclicDependencyStack.push(bindingKey);
                        ko.utils.arrayForEach(binding['after'], function(bindingDependencyKey) {
                            if (bindings[bindingDependencyKey]) {
                                if (ko.utils.arrayIndexOf(cyclicDependencyStack, bindingDependencyKey) !== -1) {
                                    throw Error("Cannot combine the following bindings, because they have a cyclic dependency: " + cyclicDependencyStack.join(", "));
                                } else {
                                    pushBinding(bindingDependencyKey);
                                }
                            }
                        });
                        cyclicDependencyStack.length--;
                    }
                    // Next add the current binding
                    result.push({ key: bindingKey, handler: binding });
                }
                bindingsConsidered[bindingKey] = true;
            }
        });

        return result;
    }

    function applyBindingsToNodeInternal(node, sourceBindings, bindingContext, bindingContextMayDifferFromDomParentElement) {
        // Prevent multiple applyBindings calls for the same node, except when a binding value is specified
        var alreadyBound = ko.utils.domData.get(node, boundElementDomDataKey);
        if (!sourceBindings) {
            if (alreadyBound) {
                throw Error("You cannot apply bindings multiple times to the same element.");
            }
            ko.utils.domData.set(node, boundElementDomDataKey, true);
        }

        // Optimization: Don't store the binding context on this node if it's definitely the same as on node.parentNode, because
        // we can easily recover it just by scanning up the node's ancestors in the DOM
        // (note: here, parent node means "real DOM parent" not "virtual parent", as there's no O(1) way to find the virtual parent)
        if (!alreadyBound && bindingContextMayDifferFromDomParentElement)
            ko.storedBindingContextForNode(node, bindingContext);

        // Use bindings if given, otherwise fall back on asking the bindings provider to give us some bindings
        var bindings;
        if (sourceBindings && typeof sourceBindings !== 'function') {
            bindings = sourceBindings;
        } else {
            var provider = ko.bindingProvider['instance'],
                getBindings = provider['getBindingAccessors'] || getBindingsAndMakeAccessors;

            // Get the binding from the provider within a computed observable so that we can update the bindings whenever
            // the binding context is updated or if the binding provider accesses observables.
            var bindingsUpdater = ko.dependentObservable(
                function() {
                    bindings = sourceBindings ? sourceBindings(bindingContext, node) : getBindings.call(provider, node, bindingContext);
                    // Register a dependency on the binding context to support observable view models.
                    if (bindings && bindingContext._subscribable)
                        bindingContext._subscribable();
                    return bindings;
                },
                null, { disposeWhenNodeIsRemoved: node }
            );

            if (!bindings || !bindingsUpdater.isActive())
                bindingsUpdater = null;
        }

        var bindingHandlerThatControlsDescendantBindings;
        if (bindings) {
            // Return the value accessor for a given binding. When bindings are static (won't be updated because of a binding
            // context update), just return the value accessor from the binding. Otherwise, return a function that always gets
            // the latest binding value and registers a dependency on the binding updater.
            var getValueAccessor = bindingsUpdater
                ? function(bindingKey) {
                    return function() {
                        return evaluateValueAccessor(bindingsUpdater()[bindingKey]);
                    };
                } : function(bindingKey) {
                    return bindings[bindingKey];
                };

            // Use of allBindings as a function is maintained for backwards compatibility, but its use is deprecated
            function allBindings() {
                return ko.utils.objectMap(bindingsUpdater ? bindingsUpdater() : bindings, evaluateValueAccessor);
            }
            // The following is the 3.x allBindings API
            allBindings['get'] = function(key) {
                return bindings[key] && evaluateValueAccessor(getValueAccessor(key));
            };
            allBindings['has'] = function(key) {
                return key in bindings;
            };

            // First put the bindings into the right order
            var orderedBindings = topologicalSortBindings(bindings);

            // Go through the sorted bindings, calling init and update for each
            ko.utils.arrayForEach(orderedBindings, function(bindingKeyAndHandler) {
                // Note that topologicalSortBindings has already filtered out any nonexistent binding handlers,
                // so bindingKeyAndHandler.handler will always be nonnull.
                var handlerInitFn = bindingKeyAndHandler.handler["init"],
                    handlerUpdateFn = bindingKeyAndHandler.handler["update"],
                    bindingKey = bindingKeyAndHandler.key;

                if (node.nodeType === 8) {
                    validateThatBindingIsAllowedForVirtualElements(bindingKey);
                }

                try {
                    // Run init, ignoring any dependencies
                    if (typeof handlerInitFn == "function") {
                        ko.dependencyDetection.ignore(function() {
                            var initResult = handlerInitFn(node, getValueAccessor(bindingKey), allBindings, bindingContext['$data'], bindingContext);

                            // If this binding handler claims to control descendant bindings, make a note of this
                            if (initResult && initResult['controlsDescendantBindings']) {
                                if (bindingHandlerThatControlsDescendantBindings !== undefined)
                                    throw new Error("Multiple bindings (" + bindingHandlerThatControlsDescendantBindings + " and " + bindingKey + ") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.");
                                bindingHandlerThatControlsDescendantBindings = bindingKey;
                            }
                        });
                    }

                    // Run update in its own computed wrapper
                    if (typeof handlerUpdateFn == "function") {
                        ko.dependentObservable(
                            function() {
                                handlerUpdateFn(node, getValueAccessor(bindingKey), allBindings, bindingContext['$data'], bindingContext);
                            },
                            null,
                            { disposeWhenNodeIsRemoved: node }
                        );
                    }
                } catch (ex) {
                    ex.message = "Unable to process binding \"" + bindingKey + ": " + bindings[bindingKey] + "\"\nMessage: " + ex.message;
                    throw ex;
                }
            });
        }

        return {
            'shouldBindDescendants': bindingHandlerThatControlsDescendantBindings === undefined
        };
    };

    var storedBindingContextDomDataKey = ko.utils.domData.nextKey();
    ko.storedBindingContextForNode = function (node, bindingContext) {
        if (arguments.length == 2) {
            ko.utils.domData.set(node, storedBindingContextDomDataKey, bindingContext);
            if (bindingContext._subscribable)
                bindingContext._subscribable._addNode(node);
        } else {
            return ko.utils.domData.get(node, storedBindingContextDomDataKey);
        }
    }

    function getBindingContext(viewModelOrBindingContext) {
        return viewModelOrBindingContext && (viewModelOrBindingContext instanceof ko.bindingContext)
            ? viewModelOrBindingContext
            : new ko.bindingContext(viewModelOrBindingContext);
    }

    ko.applyBindingAccessorsToNode = function (node, bindings, viewModelOrBindingContext) {
        if (node.nodeType === 1) // If it's an element, workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(node);
        return applyBindingsToNodeInternal(node, bindings, getBindingContext(viewModelOrBindingContext), true);
    };

    ko.applyBindingsToNode = function (node, bindings, viewModelOrBindingContext) {
        var context = getBindingContext(viewModelOrBindingContext);
        return ko.applyBindingAccessorsToNode(node, makeBindingAccessors(bindings, context, node), context);
    };

    ko.applyBindingsToDescendants = function(viewModelOrBindingContext, rootNode) {
        if (rootNode.nodeType === 1 || rootNode.nodeType === 8)
            applyBindingsToDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, true);
    };

    ko.applyBindings = function (viewModelOrBindingContext, rootNode) {
        // If jQuery is loaded after Knockout, we won't initially have access to it. So save it here.
        if (!jQueryInstance && window['jQuery']) {
            jQueryInstance = window['jQuery'];
        }

        if (rootNode && (rootNode.nodeType !== 1) && (rootNode.nodeType !== 8))
            throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
        rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional

        applyBindingsToNodeAndDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, true);
    };

    // Retrieving binding context from arbitrary nodes
    ko.contextFor = function(node) {
        // We can only do something meaningful for elements and comment nodes (in particular, not text nodes, as IE can't store domdata for them)
        switch (node.nodeType) {
            case 1:
            case 8:
                var context = ko.storedBindingContextForNode(node);
                if (context) return context;
                if (node.parentNode) return ko.contextFor(node.parentNode);
                break;
        }
        return undefined;
    };
    ko.dataFor = function(node) {
        var context = ko.contextFor(node);
        return context ? context['$data'] : undefined;
    };

    ko.exportSymbol('bindingHandlers', ko.bindingHandlers);
    ko.exportSymbol('applyBindings', ko.applyBindings);
    ko.exportSymbol('applyBindingsToDescendants', ko.applyBindingsToDescendants);
    ko.exportSymbol('applyBindingAccessorsToNode', ko.applyBindingAccessorsToNode);
    ko.exportSymbol('applyBindingsToNode', ko.applyBindingsToNode);
    ko.exportSymbol('contextFor', ko.contextFor);
    ko.exportSymbol('dataFor', ko.dataFor);
})();
(function(undefined) {
    var loadingSubscribablesCache = {}, // Tracks component loads that are currently in flight
        loadedDefinitionsCache = {};    // Tracks component loads that have already completed

    ko.components = {
        get: function(componentName, callback) {
            var cachedDefinition = getObjectOwnProperty(loadedDefinitionsCache, componentName);
            if (cachedDefinition) {
                // It's already loaded and cached. Reuse the same definition object.
                // Note that for API consistency, even cache hits complete asynchronously by default.
                // You can bypass this by putting synchronous:true on your component config.
                if (cachedDefinition.isSynchronousComponent) {
                    ko.dependencyDetection.ignore(function() { // See comment in loaderRegistryBehaviors.js for reasoning
                        callback(cachedDefinition.definition);
                    });
                } else {
                    ko.tasks.schedule(function() { callback(cachedDefinition.definition); });
                }
            } else {
                // Join the loading process that is already underway, or start a new one.
                loadComponentAndNotify(componentName, callback);
            }
        },

        clearCachedDefinition: function(componentName) {
            delete loadedDefinitionsCache[componentName];
        },

        _getFirstResultFromLoaders: getFirstResultFromLoaders
    };

    function getObjectOwnProperty(obj, propName) {
        return obj.hasOwnProperty(propName) ? obj[propName] : undefined;
    }

    function loadComponentAndNotify(componentName, callback) {
        var subscribable = getObjectOwnProperty(loadingSubscribablesCache, componentName),
            completedAsync;
        if (!subscribable) {
            // It's not started loading yet. Start loading, and when it's done, move it to loadedDefinitionsCache.
            subscribable = loadingSubscribablesCache[componentName] = new ko.subscribable();
            subscribable.subscribe(callback);

            beginLoadingComponent(componentName, function(definition, config) {
                var isSynchronousComponent = !!(config && config['synchronous']);
                loadedDefinitionsCache[componentName] = { definition: definition, isSynchronousComponent: isSynchronousComponent };
                delete loadingSubscribablesCache[componentName];

                // For API consistency, all loads complete asynchronously. However we want to avoid
                // adding an extra task schedule if it's unnecessary (i.e., the completion is already
                // async).
                //
                // You can bypass the 'always asynchronous' feature by putting the synchronous:true
                // flag on your component configuration when you register it.
                if (completedAsync || isSynchronousComponent) {
                    // Note that notifySubscribers ignores any dependencies read within the callback.
                    // See comment in loaderRegistryBehaviors.js for reasoning
                    subscribable['notifySubscribers'](definition);
                } else {
                    ko.tasks.schedule(function() {
                        subscribable['notifySubscribers'](definition);
                    });
                }
            });
            completedAsync = true;
        } else {
            subscribable.subscribe(callback);
        }
    }

    function beginLoadingComponent(componentName, callback) {
        getFirstResultFromLoaders('getConfig', [componentName], function(config) {
            if (config) {
                // We have a config, so now load its definition
                getFirstResultFromLoaders('loadComponent', [componentName, config], function(definition) {
                    callback(definition, config);
                });
            } else {
                // The component has no config - it's unknown to all the loaders.
                // Note that this is not an error (e.g., a module loading error) - that would abort the
                // process and this callback would not run. For this callback to run, all loaders must
                // have confirmed they don't know about this component.
                callback(null, null);
            }
        });
    }

    function getFirstResultFromLoaders(methodName, argsExceptCallback, callback, candidateLoaders) {
        // On the first call in the stack, start with the full set of loaders
        if (!candidateLoaders) {
            candidateLoaders = ko.components['loaders'].slice(0); // Use a copy, because we'll be mutating this array
        }

        // Try the next candidate
        var currentCandidateLoader = candidateLoaders.shift();
        if (currentCandidateLoader) {
            var methodInstance = currentCandidateLoader[methodName];
            if (methodInstance) {
                var wasAborted = false,
                    synchronousReturnValue = methodInstance.apply(currentCandidateLoader, argsExceptCallback.concat(function(result) {
                        if (wasAborted) {
                            callback(null);
                        } else if (result !== null) {
                            // This candidate returned a value. Use it.
                            callback(result);
                        } else {
                            // Try the next candidate
                            getFirstResultFromLoaders(methodName, argsExceptCallback, callback, candidateLoaders);
                        }
                    }));

                // Currently, loaders may not return anything synchronously. This leaves open the possibility
                // that we'll extend the API to support synchronous return values in the future. It won't be
                // a breaking change, because currently no loader is allowed to return anything except undefined.
                if (synchronousReturnValue !== undefined) {
                    wasAborted = true;

                    // Method to suppress exceptions will remain undocumented. This is only to keep
                    // KO's specs running tidily, since we can observe the loading got aborted without
                    // having exceptions cluttering up the console too.
                    if (!currentCandidateLoader['suppressLoaderExceptions']) {
                        throw new Error('Component loaders must supply values by invoking the callback, not by returning values synchronously.');
                    }
                }
            } else {
                // This candidate doesn't have the relevant handler. Synchronously move on to the next one.
                getFirstResultFromLoaders(methodName, argsExceptCallback, callback, candidateLoaders);
            }
        } else {
            // No candidates returned a value
            callback(null);
        }
    }

    // Reference the loaders via string name so it's possible for developers
    // to replace the whole array by assigning to ko.components.loaders
    ko.components['loaders'] = [];

    ko.exportSymbol('components', ko.components);
    ko.exportSymbol('components.get', ko.components.get);
    ko.exportSymbol('components.clearCachedDefinition', ko.components.clearCachedDefinition);
})();
(function(undefined) {

    // The default loader is responsible for two things:
    // 1. Maintaining the default in-memory registry of component configuration objects
    //    (i.e., the thing you're writing to when you call ko.components.register(someName, ...))
    // 2. Answering requests for components by fetching configuration objects
    //    from that default in-memory registry and resolving them into standard
    //    component definition objects (of the form { createViewModel: ..., template: ... })
    // Custom loaders may override either of these facilities, i.e.,
    // 1. To supply configuration objects from some other source (e.g., conventions)
    // 2. Or, to resolve configuration objects by loading viewmodels/templates via arbitrary logic.

    var defaultConfigRegistry = {};

    ko.components.register = function(componentName, config) {
        if (!config) {
            throw new Error('Invalid configuration for ' + componentName);
        }

        if (ko.components.isRegistered(componentName)) {
            throw new Error('Component ' + componentName + ' is already registered');
        }

        defaultConfigRegistry[componentName] = config;
    };

    ko.components.isRegistered = function(componentName) {
        return defaultConfigRegistry.hasOwnProperty(componentName);
    };

    ko.components.unregister = function(componentName) {
        delete defaultConfigRegistry[componentName];
        ko.components.clearCachedDefinition(componentName);
    };

    ko.components.defaultLoader = {
        'getConfig': function(componentName, callback) {
            var result = defaultConfigRegistry.hasOwnProperty(componentName)
                ? defaultConfigRegistry[componentName]
                : null;
            callback(result);
        },

        'loadComponent': function(componentName, config, callback) {
            var errorCallback = makeErrorCallback(componentName);
            possiblyGetConfigFromAmd(errorCallback, config, function(loadedConfig) {
                resolveConfig(componentName, errorCallback, loadedConfig, callback);
            });
        },

        'loadTemplate': function(componentName, templateConfig, callback) {
            resolveTemplate(makeErrorCallback(componentName), templateConfig, callback);
        },

        'loadViewModel': function(componentName, viewModelConfig, callback) {
            resolveViewModel(makeErrorCallback(componentName), viewModelConfig, callback);
        }
    };

    var createViewModelKey = 'createViewModel';

    // Takes a config object of the form { template: ..., viewModel: ... }, and asynchronously convert it
    // into the standard component definition format:
    //    { template: <ArrayOfDomNodes>, createViewModel: function(params, componentInfo) { ... } }.
    // Since both template and viewModel may need to be resolved asynchronously, both tasks are performed
    // in parallel, and the results joined when both are ready. We don't depend on any promises infrastructure,
    // so this is implemented manually below.
    function resolveConfig(componentName, errorCallback, config, callback) {
        var result = {},
            makeCallBackWhenZero = 2,
            tryIssueCallback = function() {
                if (--makeCallBackWhenZero === 0) {
                    callback(result);
                }
            },
            templateConfig = config['template'],
            viewModelConfig = config['viewModel'];

        if (templateConfig) {
            possiblyGetConfigFromAmd(errorCallback, templateConfig, function(loadedConfig) {
                ko.components._getFirstResultFromLoaders('loadTemplate', [componentName, loadedConfig], function(resolvedTemplate) {
                    result['template'] = resolvedTemplate;
                    tryIssueCallback();
                });
            });
        } else {
            tryIssueCallback();
        }

        if (viewModelConfig) {
            possiblyGetConfigFromAmd(errorCallback, viewModelConfig, function(loadedConfig) {
                ko.components._getFirstResultFromLoaders('loadViewModel', [componentName, loadedConfig], function(resolvedViewModel) {
                    result[createViewModelKey] = resolvedViewModel;
                    tryIssueCallback();
                });
            });
        } else {
            tryIssueCallback();
        }
    }

    function resolveTemplate(errorCallback, templateConfig, callback) {
        if (typeof templateConfig === 'string') {
            // Markup - parse it
            callback(ko.utils.parseHtmlFragment(templateConfig));
        } else if (templateConfig instanceof Array) {
            // Assume already an array of DOM nodes - pass through unchanged
            callback(templateConfig);
        } else if (isDocumentFragment(templateConfig)) {
            // Document fragment - use its child nodes
            callback(ko.utils.makeArray(templateConfig.childNodes));
        } else if (templateConfig['element']) {
            var element = templateConfig['element'];
            if (isDomElement(element)) {
                // Element instance - copy its child nodes
                callback(cloneNodesFromTemplateSourceElement(element));
            } else if (typeof element === 'string') {
                // Element ID - find it, then copy its child nodes
                var elemInstance = document.getElementById(element);
                if (elemInstance) {
                    callback(cloneNodesFromTemplateSourceElement(elemInstance));
                } else {
                    errorCallback('Cannot find element with ID ' + element);
                }
            } else {
                errorCallback('Unknown element type: ' + element);
            }
        } else {
            errorCallback('Unknown template value: ' + templateConfig);
        }
    }

    function resolveViewModel(errorCallback, viewModelConfig, callback) {
        if (typeof viewModelConfig === 'function') {
            // Constructor - convert to standard factory function format
            // By design, this does *not* supply componentInfo to the constructor, as the intent is that
            // componentInfo contains non-viewmodel data (e.g., the component's element) that should only
            // be used in factory functions, not viewmodel constructors.
            callback(function (params /*, componentInfo */) {
                return new viewModelConfig(params);
            });
        } else if (typeof viewModelConfig[createViewModelKey] === 'function') {
            // Already a factory function - use it as-is
            callback(viewModelConfig[createViewModelKey]);
        } else if ('instance' in viewModelConfig) {
            // Fixed object instance - promote to createViewModel format for API consistency
            var fixedInstance = viewModelConfig['instance'];
            callback(function (params, componentInfo) {
                return fixedInstance;
            });
        } else if ('viewModel' in viewModelConfig) {
            // Resolved AMD module whose value is of the form { viewModel: ... }
            resolveViewModel(errorCallback, viewModelConfig['viewModel'], callback);
        } else {
            errorCallback('Unknown viewModel value: ' + viewModelConfig);
        }
    }

    function cloneNodesFromTemplateSourceElement(elemInstance) {
        switch (ko.utils.tagNameLower(elemInstance)) {
            case 'script':
                return ko.utils.parseHtmlFragment(elemInstance.text);
            case 'textarea':
                return ko.utils.parseHtmlFragment(elemInstance.value);
            case 'template':
                // For browsers with proper <template> element support (i.e., where the .content property
                // gives a document fragment), use that document fragment.
                if (isDocumentFragment(elemInstance.content)) {
                    return ko.utils.cloneNodes(elemInstance.content.childNodes);
                }
        }

        // Regular elements such as <div>, and <template> elements on old browsers that don't really
        // understand <template> and just treat it as a regular container
        return ko.utils.cloneNodes(elemInstance.childNodes);
    }

    function isDomElement(obj) {
        if (window['HTMLElement']) {
            return obj instanceof HTMLElement;
        } else {
            return obj && obj.tagName && obj.nodeType === 1;
        }
    }

    function isDocumentFragment(obj) {
        if (window['DocumentFragment']) {
            return obj instanceof DocumentFragment;
        } else {
            return obj && obj.nodeType === 11;
        }
    }

    function possiblyGetConfigFromAmd(errorCallback, config, callback) {
        if (typeof config['require'] === 'string') {
            // The config is the value of an AMD module
            if (amdRequire || window['require']) {
                (amdRequire || window['require'])([config['require']], callback);
            } else {
                errorCallback('Uses require, but no AMD loader is present');
            }
        } else {
            callback(config);
        }
    }

    function makeErrorCallback(componentName) {
        return function (message) {
            throw new Error('Component \'' + componentName + '\': ' + message);
        };
    }

    ko.exportSymbol('components.register', ko.components.register);
    ko.exportSymbol('components.isRegistered', ko.components.isRegistered);
    ko.exportSymbol('components.unregister', ko.components.unregister);

    // Expose the default loader so that developers can directly ask it for configuration
    // or to resolve configuration
    ko.exportSymbol('components.defaultLoader', ko.components.defaultLoader);

    // By default, the default loader is the only registered component loader
    ko.components['loaders'].push(ko.components.defaultLoader);

    // Privately expose the underlying config registry for use in old-IE shim
    ko.components._allRegisteredComponents = defaultConfigRegistry;
})();
(function (undefined) {
    // Overridable API for determining which component name applies to a given node. By overriding this,
    // you can for example map specific tagNames to components that are not preregistered.
    ko.components['getComponentNameForNode'] = function(node) {
        var tagNameLower = ko.utils.tagNameLower(node);
        if (ko.components.isRegistered(tagNameLower)) {
            // Try to determine that this node can be considered a *custom* element; see https://github.com/knockout/knockout/issues/1603
            if (tagNameLower.indexOf('-') != -1 || ('' + node) == "[object HTMLUnknownElement]" || (ko.utils.ieVersion <= 8 && node.tagName === tagNameLower)) {
                return tagNameLower;
            }
        }
    };

    ko.components.addBindingsForCustomElement = function(allBindings, node, bindingContext, valueAccessors) {
        // Determine if it's really a custom element matching a component
        if (node.nodeType === 1) {
            var componentName = ko.components['getComponentNameForNode'](node);
            if (componentName) {
                // It does represent a component, so add a component binding for it
                allBindings = allBindings || {};

                if (allBindings['component']) {
                    // Avoid silently overwriting some other 'component' binding that may already be on the element
                    throw new Error('Cannot use the "component" binding on a custom element matching a component');
                }

                var componentBindingValue = { 'name': componentName, 'params': getComponentParamsFromCustomElement(node, bindingContext) };

                allBindings['component'] = valueAccessors
                    ? function() { return componentBindingValue; }
                    : componentBindingValue;
            }
        }

        return allBindings;
    }

    var nativeBindingProviderInstance = new ko.bindingProvider();

    function getComponentParamsFromCustomElement(elem, bindingContext) {
        var paramsAttribute = elem.getAttribute('params');

        if (paramsAttribute) {
            var params = nativeBindingProviderInstance['parseBindingsString'](paramsAttribute, bindingContext, elem, { 'valueAccessors': true, 'bindingParams': true }),
                rawParamComputedValues = ko.utils.objectMap(params, function(paramValue, paramName) {
                    return ko.computed(paramValue, null, { disposeWhenNodeIsRemoved: elem });
                }),
                result = ko.utils.objectMap(rawParamComputedValues, function(paramValueComputed, paramName) {
                    var paramValue = paramValueComputed.peek();
                    // Does the evaluation of the parameter value unwrap any observables?
                    if (!paramValueComputed.isActive()) {
                        // No it doesn't, so there's no need for any computed wrapper. Just pass through the supplied value directly.
                        // Example: "someVal: firstName, age: 123" (whether or not firstName is an observable/computed)
                        return paramValue;
                    } else {
                        // Yes it does. Supply a computed property that unwraps both the outer (binding expression)
                        // level of observability, and any inner (resulting model value) level of observability.
                        // This means the component doesn't have to worry about multiple unwrapping. If the value is a
                        // writable observable, the computed will also be writable and pass the value on to the observable.
                        return ko.computed({
                            'read': function() {
                                return ko.utils.unwrapObservable(paramValueComputed());
                            },
                            'write': ko.isWriteableObservable(paramValue) && function(value) {
                                paramValueComputed()(value);
                            },
                            disposeWhenNodeIsRemoved: elem
                        });
                    }
                });

            // Give access to the raw computeds, as long as that wouldn't overwrite any custom param also called '$raw'
            // This is in case the developer wants to react to outer (binding) observability separately from inner
            // (model value) observability, or in case the model value observable has subobservables.
            if (!result.hasOwnProperty('$raw')) {
                result['$raw'] = rawParamComputedValues;
            }

            return result;
        } else {
            // For consistency, absence of a "params" attribute is treated the same as the presence of
            // any empty one. Otherwise component viewmodels need special code to check whether or not
            // 'params' or 'params.$raw' is null/undefined before reading subproperties, which is annoying.
            return { '$raw': {} };
        }
    }

    // --------------------------------------------------------------------------------
    // Compatibility code for older (pre-HTML5) IE browsers

    if (ko.utils.ieVersion < 9) {
        // Whenever you preregister a component, enable it as a custom element in the current document
        ko.components['register'] = (function(originalFunction) {
            return function(componentName) {
                document.createElement(componentName); // Allows IE<9 to parse markup containing the custom element
                return originalFunction.apply(this, arguments);
            }
        })(ko.components['register']);

        // Whenever you create a document fragment, enable all preregistered component names as custom elements
        // This is needed to make innerShiv/jQuery HTML parsing correctly handle the custom elements
        document.createDocumentFragment = (function(originalFunction) {
            return function() {
                var newDocFrag = originalFunction(),
                    allComponents = ko.components._allRegisteredComponents;
                for (var componentName in allComponents) {
                    if (allComponents.hasOwnProperty(componentName)) {
                        newDocFrag.createElement(componentName);
                    }
                }
                return newDocFrag;
            };
        })(document.createDocumentFragment);
    }
})();(function(undefined) {

    var componentLoadingOperationUniqueId = 0;

    ko.bindingHandlers['component'] = {
        'init': function(element, valueAccessor, ignored1, ignored2, bindingContext) {
            var currentViewModel,
                currentLoadingOperationId,
                disposeAssociatedComponentViewModel = function () {
                    var currentViewModelDispose = currentViewModel && currentViewModel['dispose'];
                    if (typeof currentViewModelDispose === 'function') {
                        currentViewModelDispose.call(currentViewModel);
                    }
                    currentViewModel = null;
                    // Any in-flight loading operation is no longer relevant, so make sure we ignore its completion
                    currentLoadingOperationId = null;
                },
                originalChildNodes = ko.utils.makeArray(ko.virtualElements.childNodes(element));

            ko.utils.domNodeDisposal.addDisposeCallback(element, disposeAssociatedComponentViewModel);

            ko.computed(function () {
                var value = ko.utils.unwrapObservable(valueAccessor()),
                    componentName, componentParams;

                if (typeof value === 'string') {
                    componentName = value;
                } else {
                    componentName = ko.utils.unwrapObservable(value['name']);
                    componentParams = ko.utils.unwrapObservable(value['params']);
                }

                if (!componentName) {
                    throw new Error('No component name specified');
                }

                var loadingOperationId = currentLoadingOperationId = ++componentLoadingOperationUniqueId;
                ko.components.get(componentName, function(componentDefinition) {
                    // If this is not the current load operation for this element, ignore it.
                    if (currentLoadingOperationId !== loadingOperationId) {
                        return;
                    }

                    // Clean up previous state
                    disposeAssociatedComponentViewModel();

                    // Instantiate and bind new component. Implicitly this cleans any old DOM nodes.
                    if (!componentDefinition) {
                        throw new Error('Unknown component \'' + componentName + '\'');
                    }
                    cloneTemplateIntoElement(componentName, componentDefinition, element);
                    var componentViewModel = createViewModel(componentDefinition, element, originalChildNodes, componentParams),
                        childBindingContext = bindingContext['createChildContext'](componentViewModel, /* dataItemAlias */ undefined, function(ctx) {
                            ctx['$component'] = componentViewModel;
                            ctx['$componentTemplateNodes'] = originalChildNodes;
                        });
                    currentViewModel = componentViewModel;
                    ko.applyBindingsToDescendants(childBindingContext, element);
                });
            }, null, { disposeWhenNodeIsRemoved: element });

            return { 'controlsDescendantBindings': true };
        }
    };

    ko.virtualElements.allowedBindings['component'] = true;

    function cloneTemplateIntoElement(componentName, componentDefinition, element) {
        var template = componentDefinition['template'];
        if (!template) {
            throw new Error('Component \'' + componentName + '\' has no template');
        }

        var clonedNodesArray = ko.utils.cloneNodes(template);
        ko.virtualElements.setDomNodeChildren(element, clonedNodesArray);
    }

    function createViewModel(componentDefinition, element, originalChildNodes, componentParams) {
        var componentViewModelFactory = componentDefinition['createViewModel'];
        return componentViewModelFactory
            ? componentViewModelFactory.call(componentDefinition, componentParams, { 'element': element, 'templateNodes': originalChildNodes })
            : componentParams; // Template-only component
    }

})();
var attrHtmlToJavascriptMap = { 'class': 'className', 'for': 'htmlFor' };
ko.bindingHandlers['attr'] = {
    'update': function(element, valueAccessor, allBindings) {
        var value = ko.utils.unwrapObservable(valueAccessor()) || {};
        ko.utils.objectForEach(value, function(attrName, attrValue) {
            attrValue = ko.utils.unwrapObservable(attrValue);

            // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
            // when someProp is a "no value"-like value (strictly null, false, or undefined)
            // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
            var toRemove = (attrValue === false) || (attrValue === null) || (attrValue === undefined);
            if (toRemove)
                element.removeAttribute(attrName);

            // In IE <= 7 and IE8 Quirks Mode, you have to use the Javascript property name instead of the
            // HTML attribute name for certain attributes. IE8 Standards Mode supports the correct behavior,
            // but instead of figuring out the mode, we'll just set the attribute through the Javascript
            // property for IE <= 8.
            if (ko.utils.ieVersion <= 8 && attrName in attrHtmlToJavascriptMap) {
                attrName = attrHtmlToJavascriptMap[attrName];
                if (toRemove)
                    element.removeAttribute(attrName);
                else
                    element[attrName] = attrValue;
            } else if (!toRemove) {
                element.setAttribute(attrName, attrValue.toString());
            }

            // Treat "name" specially - although you can think of it as an attribute, it also needs
            // special handling on older versions of IE (https://github.com/SteveSanderson/knockout/pull/333)
            // Deliberately being case-sensitive here because XHTML would regard "Name" as a different thing
            // entirely, and there's no strong reason to allow for such casing in HTML.
            if (attrName === "name") {
                ko.utils.setElementName(element, toRemove ? "" : attrValue.toString());
            }
        });
    }
};
(function() {

ko.bindingHandlers['checked'] = {
    'after': ['value', 'attr'],
    'init': function (element, valueAccessor, allBindings) {
        var checkedValue = ko.pureComputed(function() {
            // Treat "value" like "checkedValue" when it is included with "checked" binding
            if (allBindings['has']('checkedValue')) {
                return ko.utils.unwrapObservable(allBindings.get('checkedValue'));
            } else if (allBindings['has']('value')) {
                return ko.utils.unwrapObservable(allBindings.get('value'));
            }

            return element.value;
        });

        function updateModel() {
            // This updates the model value from the view value.
            // It runs in response to DOM events (click) and changes in checkedValue.
            var isChecked = element.checked,
                elemValue = useCheckedValue ? checkedValue() : isChecked;

            // When we're first setting up this computed, don't change any model state.
            if (ko.computedContext.isInitial()) {
                return;
            }

            // We can ignore unchecked radio buttons, because some other radio
            // button will be getting checked, and that one can take care of updating state.
            if (isRadio && !isChecked) {
                return;
            }

            var modelValue = ko.dependencyDetection.ignore(valueAccessor);
            if (valueIsArray) {
                var writableValue = rawValueIsNonArrayObservable ? modelValue.peek() : modelValue;
                if (oldElemValue !== elemValue) {
                    // When we're responding to the checkedValue changing, and the element is
                    // currently checked, replace the old elem value with the new elem value
                    // in the model array.
                    if (isChecked) {
                        ko.utils.addOrRemoveItem(writableValue, elemValue, true);
                        ko.utils.addOrRemoveItem(writableValue, oldElemValue, false);
                    }

                    oldElemValue = elemValue;
                } else {
                    // When we're responding to the user having checked/unchecked a checkbox,
                    // add/remove the element value to the model array.
                    ko.utils.addOrRemoveItem(writableValue, elemValue, isChecked);
                }
                if (rawValueIsNonArrayObservable && ko.isWriteableObservable(modelValue)) {
                    modelValue(writableValue);
                }
            } else {
                ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'checked', elemValue, true);
            }
        };

        function updateView() {
            // This updates the view value from the model value.
            // It runs in response to changes in the bound (checked) value.
            var modelValue = ko.utils.unwrapObservable(valueAccessor());

            if (valueIsArray) {
                // When a checkbox is bound to an array, being checked represents its value being present in that array
                element.checked = ko.utils.arrayIndexOf(modelValue, checkedValue()) >= 0;
            } else if (isCheckbox) {
                // When a checkbox is bound to any other value (not an array), being checked represents the value being trueish
                element.checked = modelValue;
            } else {
                // For radio buttons, being checked means that the radio button's value corresponds to the model value
                element.checked = (checkedValue() === modelValue);
            }
        };

        var isCheckbox = element.type == "checkbox",
            isRadio = element.type == "radio";

        // Only bind to check boxes and radio buttons
        if (!isCheckbox && !isRadio) {
            return;
        }

        var rawValue = valueAccessor(),
            valueIsArray = isCheckbox && (ko.utils.unwrapObservable(rawValue) instanceof Array),
            rawValueIsNonArrayObservable = !(valueIsArray && rawValue.push && rawValue.splice),
            oldElemValue = valueIsArray ? checkedValue() : undefined,
            useCheckedValue = isRadio || valueIsArray;

        // IE 6 won't allow radio buttons to be selected unless they have a name
        if (isRadio && !element.name)
            ko.bindingHandlers['uniqueName']['init'](element, function() { return true });

        // Set up two computeds to update the binding:

        // The first responds to changes in the checkedValue value and to element clicks
        ko.computed(updateModel, null, { disposeWhenNodeIsRemoved: element });
        ko.utils.registerEventHandler(element, "click", updateModel);

        // The second responds to changes in the model value (the one associated with the checked binding)
        ko.computed(updateView, null, { disposeWhenNodeIsRemoved: element });

        rawValue = undefined;
    }
};
ko.expressionRewriting.twoWayBindings['checked'] = true;

ko.bindingHandlers['checkedValue'] = {
    'update': function (element, valueAccessor) {
        element.value = ko.utils.unwrapObservable(valueAccessor());
    }
};

})();var classesWrittenByBindingKey = '__ko__cssValue';
ko.bindingHandlers['css'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value !== null && typeof value == "object") {
            ko.utils.objectForEach(value, function(className, shouldHaveClass) {
                shouldHaveClass = ko.utils.unwrapObservable(shouldHaveClass);
                ko.utils.toggleDomNodeCssClass(element, className, shouldHaveClass);
            });
        } else {
            value = ko.utils.stringTrim(String(value || '')); // Make sure we don't try to store or set a non-string value
            ko.utils.toggleDomNodeCssClass(element, element[classesWrittenByBindingKey], false);
            element[classesWrittenByBindingKey] = value;
            ko.utils.toggleDomNodeCssClass(element, value, true);
        }
    }
};
ko.bindingHandlers['enable'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value && element.disabled)
            element.removeAttribute("disabled");
        else if ((!value) && (!element.disabled))
            element.disabled = true;
    }
};

ko.bindingHandlers['disable'] = {
    'update': function (element, valueAccessor) {
        ko.bindingHandlers['enable']['update'](element, function() { return !ko.utils.unwrapObservable(valueAccessor()) });
    }
};
// For certain common events (currently just 'click'), allow a simplified data-binding syntax
// e.g. click:handler instead of the usual full-length event:{click:handler}
function makeEventHandlerShortcut(eventName) {
    ko.bindingHandlers[eventName] = {
        'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var newValueAccessor = function () {
                var result = {};
                result[eventName] = valueAccessor();
                return result;
            };
            return ko.bindingHandlers['event']['init'].call(this, element, newValueAccessor, allBindings, viewModel, bindingContext);
        }
    }
}

ko.bindingHandlers['event'] = {
    'init' : function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var eventsToHandle = valueAccessor() || {};
        ko.utils.objectForEach(eventsToHandle, function(eventName) {
            if (typeof eventName == "string") {
                ko.utils.registerEventHandler(element, eventName, function (event) {
                    var handlerReturnValue;
                    var handlerFunction = valueAccessor()[eventName];
                    if (!handlerFunction)
                        return;

                    try {
                        // Take all the event args, and prefix with the viewmodel
                        var argsForHandler = ko.utils.makeArray(arguments);
                        viewModel = bindingContext['$data'];
                        argsForHandler.unshift(viewModel);
                        handlerReturnValue = handlerFunction.apply(viewModel, argsForHandler);
                    } finally {
                        if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                            if (event.preventDefault)
                                event.preventDefault();
                            else
                                event.returnValue = false;
                        }
                    }

                    var bubble = allBindings.get(eventName + 'Bubble') !== false;
                    if (!bubble) {
                        event.cancelBubble = true;
                        if (event.stopPropagation)
                            event.stopPropagation();
                    }
                });
            }
        });
    }
};
// "foreach: someExpression" is equivalent to "template: { foreach: someExpression }"
// "foreach: { data: someExpression, afterAdd: myfn }" is equivalent to "template: { foreach: someExpression, afterAdd: myfn }"
ko.bindingHandlers['foreach'] = {
    makeTemplateValueAccessor: function(valueAccessor) {
        return function() {
            var modelValue = valueAccessor(),
                unwrappedValue = ko.utils.peekObservable(modelValue);    // Unwrap without setting a dependency here

            // If unwrappedValue is the array, pass in the wrapped value on its own
            // The value will be unwrapped and tracked within the template binding
            // (See https://github.com/SteveSanderson/knockout/issues/523)
            if ((!unwrappedValue) || typeof unwrappedValue.length == "number")
                return { 'foreach': modelValue, 'templateEngine': ko.nativeTemplateEngine.instance };

            // If unwrappedValue.data is the array, preserve all relevant options and unwrap again value so we get updates
            ko.utils.unwrapObservable(modelValue);
            return {
                'foreach': unwrappedValue['data'],
                'as': unwrappedValue['as'],
                'includeDestroyed': unwrappedValue['includeDestroyed'],
                'afterAdd': unwrappedValue['afterAdd'],
                'beforeRemove': unwrappedValue['beforeRemove'],
                'afterRender': unwrappedValue['afterRender'],
                'beforeMove': unwrappedValue['beforeMove'],
                'afterMove': unwrappedValue['afterMove'],
                'templateEngine': ko.nativeTemplateEngine.instance
            };
        };
    },
    'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['init'](element, ko.bindingHandlers['foreach'].makeTemplateValueAccessor(valueAccessor));
    },
    'update': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['update'](element, ko.bindingHandlers['foreach'].makeTemplateValueAccessor(valueAccessor), allBindings, viewModel, bindingContext);
    }
};
ko.expressionRewriting.bindingRewriteValidators['foreach'] = false; // Can't rewrite control flow bindings
ko.virtualElements.allowedBindings['foreach'] = true;
var hasfocusUpdatingProperty = '__ko_hasfocusUpdating';
var hasfocusLastValue = '__ko_hasfocusLastValue';
ko.bindingHandlers['hasfocus'] = {
    'init': function(element, valueAccessor, allBindings) {
        var handleElementFocusChange = function(isFocused) {
            // Where possible, ignore which event was raised and determine focus state using activeElement,
            // as this avoids phantom focus/blur events raised when changing tabs in modern browsers.
            // However, not all KO-targeted browsers (Firefox 2) support activeElement. For those browsers,
            // prevent a loss of focus when changing tabs/windows by setting a flag that prevents hasfocus
            // from calling 'blur()' on the element when it loses focus.
            // Discussion at https://github.com/SteveSanderson/knockout/pull/352
            element[hasfocusUpdatingProperty] = true;
            var ownerDoc = element.ownerDocument;
            if ("activeElement" in ownerDoc) {
                var active;
                try {
                    active = ownerDoc.activeElement;
                } catch(e) {
                    // IE9 throws if you access activeElement during page load (see issue #703)
                    active = ownerDoc.body;
                }
                isFocused = (active === element);
            }
            var modelValue = valueAccessor();
            ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'hasfocus', isFocused, true);

            //cache the latest value, so we can avoid unnecessarily calling focus/blur in the update function
            element[hasfocusLastValue] = isFocused;
            element[hasfocusUpdatingProperty] = false;
        };
        var handleElementFocusIn = handleElementFocusChange.bind(null, true);
        var handleElementFocusOut = handleElementFocusChange.bind(null, false);

        ko.utils.registerEventHandler(element, "focus", handleElementFocusIn);
        ko.utils.registerEventHandler(element, "focusin", handleElementFocusIn); // For IE
        ko.utils.registerEventHandler(element, "blur",  handleElementFocusOut);
        ko.utils.registerEventHandler(element, "focusout",  handleElementFocusOut); // For IE
    },
    'update': function(element, valueAccessor) {
        var value = !!ko.utils.unwrapObservable(valueAccessor());

        if (!element[hasfocusUpdatingProperty] && element[hasfocusLastValue] !== value) {
            value ? element.focus() : element.blur();

            // In IE, the blur method doesn't always cause the element to lose focus (for example, if the window is not in focus).
            // Setting focus to the body element does seem to be reliable in IE, but should only be used if we know that the current
            // element was focused already.
            if (!value && element[hasfocusLastValue]) {
                element.ownerDocument.body.focus();
            }

            // For IE, which doesn't reliably fire "focus" or "blur" events synchronously
            ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, value ? "focusin" : "focusout"]);
        }
    }
};
ko.expressionRewriting.twoWayBindings['hasfocus'] = true;

ko.bindingHandlers['hasFocus'] = ko.bindingHandlers['hasfocus']; // Make "hasFocus" an alias
ko.expressionRewriting.twoWayBindings['hasFocus'] = true;
ko.bindingHandlers['html'] = {
    'init': function() {
        // Prevent binding on the dynamically-injected HTML (as developers are unlikely to expect that, and it has security implications)
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor) {
        // setHtml will unwrap the value if needed
        ko.utils.setHtml(element, valueAccessor());
    }
};
// Makes a binding like with or if
function makeWithIfBinding(bindingKey, isWith, isNot, makeContextCallback) {
    ko.bindingHandlers[bindingKey] = {
        'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var didDisplayOnLastUpdate,
                savedNodes;
            ko.computed(function() {
                var rawValue = valueAccessor(),
                    dataValue = ko.utils.unwrapObservable(rawValue),
                    shouldDisplay = !isNot !== !dataValue, // equivalent to isNot ? !dataValue : !!dataValue
                    isFirstRender = !savedNodes,
                    needsRefresh = isFirstRender || isWith || (shouldDisplay !== didDisplayOnLastUpdate);

                if (needsRefresh) {
                    // Save a copy of the inner nodes on the initial update, but only if we have dependencies.
                    if (isFirstRender && ko.computedContext.getDependenciesCount()) {
                        savedNodes = ko.utils.cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
                    }

                    if (shouldDisplay) {
                        if (!isFirstRender) {
                            ko.virtualElements.setDomNodeChildren(element, ko.utils.cloneNodes(savedNodes));
                        }
                        ko.applyBindingsToDescendants(makeContextCallback ? makeContextCallback(bindingContext, rawValue) : bindingContext, element);
                    } else {
                        ko.virtualElements.emptyNode(element);
                    }

                    didDisplayOnLastUpdate = shouldDisplay;
                }
            }, null, { disposeWhenNodeIsRemoved: element });
            return { 'controlsDescendantBindings': true };
        }
    };
    ko.expressionRewriting.bindingRewriteValidators[bindingKey] = false; // Can't rewrite control flow bindings
    ko.virtualElements.allowedBindings[bindingKey] = true;
}

// Construct the actual binding handlers
makeWithIfBinding('if');
makeWithIfBinding('ifnot', false /* isWith */, true /* isNot */);
makeWithIfBinding('with', true /* isWith */, false /* isNot */,
    function(bindingContext, dataValue) {
        return bindingContext.createStaticChildContext(dataValue);
    }
);
var captionPlaceholder = {};
ko.bindingHandlers['options'] = {
    'init': function(element) {
        if (ko.utils.tagNameLower(element) !== "select")
            throw new Error("options binding applies only to SELECT elements");

        // Remove all existing <option>s.
        while (element.length > 0) {
            element.remove(0);
        }

        // Ensures that the binding processor doesn't try to bind the options
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor, allBindings) {
        function selectedOptions() {
            return ko.utils.arrayFilter(element.options, function (node) { return node.selected; });
        }

        var selectWasPreviouslyEmpty = element.length == 0,
            multiple = element.multiple,
            previousScrollTop = (!selectWasPreviouslyEmpty && multiple) ? element.scrollTop : null,
            unwrappedArray = ko.utils.unwrapObservable(valueAccessor()),
            valueAllowUnset = allBindings.get('valueAllowUnset') && allBindings['has']('value'),
            includeDestroyed = allBindings.get('optionsIncludeDestroyed'),
            arrayToDomNodeChildrenOptions = {},
            captionValue,
            filteredArray,
            previousSelectedValues = [];

        if (!valueAllowUnset) {
            if (multiple) {
                previousSelectedValues = ko.utils.arrayMap(selectedOptions(), ko.selectExtensions.readValue);
            } else if (element.selectedIndex >= 0) {
                previousSelectedValues.push(ko.selectExtensions.readValue(element.options[element.selectedIndex]));
            }
        }

        if (unwrappedArray) {
            if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                unwrappedArray = [unwrappedArray];

            // Filter out any entries marked as destroyed
            filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) {
                return includeDestroyed || item === undefined || item === null || !ko.utils.unwrapObservable(item['_destroy']);
            });

            // If caption is included, add it to the array
            if (allBindings['has']('optionsCaption')) {
                captionValue = ko.utils.unwrapObservable(allBindings.get('optionsCaption'));
                // If caption value is null or undefined, don't show a caption
                if (captionValue !== null && captionValue !== undefined) {
                    filteredArray.unshift(captionPlaceholder);
                }
            }
        } else {
            // If a falsy value is provided (e.g. null), we'll simply empty the select element
        }

        function applyToObject(object, predicate, defaultValue) {
            var predicateType = typeof predicate;
            if (predicateType == "function")    // Given a function; run it against the data value
                return predicate(object);
            else if (predicateType == "string") // Given a string; treat it as a property name on the data value
                return object[predicate];
            else                                // Given no optionsText arg; use the data value itself
                return defaultValue;
        }

        // The following functions can run at two different times:
        // The first is when the whole array is being updated directly from this binding handler.
        // The second is when an observable value for a specific array entry is updated.
        // oldOptions will be empty in the first case, but will be filled with the previously generated option in the second.
        var itemUpdate = false;
        function optionForArrayItem(arrayEntry, index, oldOptions) {
            if (oldOptions.length) {
                previousSelectedValues = !valueAllowUnset && oldOptions[0].selected ? [ ko.selectExtensions.readValue(oldOptions[0]) ] : [];
                itemUpdate = true;
            }
            var option = element.ownerDocument.createElement("option");
            if (arrayEntry === captionPlaceholder) {
                ko.utils.setTextContent(option, allBindings.get('optionsCaption'));
                ko.selectExtensions.writeValue(option, undefined);
            } else {
                // Apply a value to the option element
                var optionValue = applyToObject(arrayEntry, allBindings.get('optionsValue'), arrayEntry);
                ko.selectExtensions.writeValue(option, ko.utils.unwrapObservable(optionValue));

                // Apply some text to the option element
                var optionText = applyToObject(arrayEntry, allBindings.get('optionsText'), optionValue);
                ko.utils.setTextContent(option, optionText);
            }
            return [option];
        }

        // By using a beforeRemove callback, we delay the removal until after new items are added. This fixes a selection
        // problem in IE<=8 and Firefox. See https://github.com/knockout/knockout/issues/1208
        arrayToDomNodeChildrenOptions['beforeRemove'] =
            function (option) {
                element.removeChild(option);
            };

        function setSelectionCallback(arrayEntry, newOptions) {
            if (itemUpdate && valueAllowUnset) {
                // The model value is authoritative, so make sure its value is the one selected
                // There is no need to use dependencyDetection.ignore since setDomNodeChildrenFromArrayMapping does so already.
                ko.selectExtensions.writeValue(element, ko.utils.unwrapObservable(allBindings.get('value')), true /* allowUnset */);
            } else if (previousSelectedValues.length) {
                // IE6 doesn't like us to assign selection to OPTION nodes before they're added to the document.
                // That's why we first added them without selection. Now it's time to set the selection.
                var isSelected = ko.utils.arrayIndexOf(previousSelectedValues, ko.selectExtensions.readValue(newOptions[0])) >= 0;
                ko.utils.setOptionNodeSelectionState(newOptions[0], isSelected);

                // If this option was changed from being selected during a single-item update, notify the change
                if (itemUpdate && !isSelected) {
                    ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);
                }
            }
        }

        var callback = setSelectionCallback;
        if (allBindings['has']('optionsAfterRender') && typeof allBindings.get('optionsAfterRender') == "function") {
            callback = function(arrayEntry, newOptions) {
                setSelectionCallback(arrayEntry, newOptions);
                ko.dependencyDetection.ignore(allBindings.get('optionsAfterRender'), null, [newOptions[0], arrayEntry !== captionPlaceholder ? arrayEntry : undefined]);
            }
        }

        ko.utils.setDomNodeChildrenFromArrayMapping(element, filteredArray, optionForArrayItem, arrayToDomNodeChildrenOptions, callback);

        ko.dependencyDetection.ignore(function () {
            if (valueAllowUnset) {
                // The model value is authoritative, so make sure its value is the one selected
                ko.selectExtensions.writeValue(element, ko.utils.unwrapObservable(allBindings.get('value')), true /* allowUnset */);
            } else {
                // Determine if the selection has changed as a result of updating the options list
                var selectionChanged;
                if (multiple) {
                    // For a multiple-select box, compare the new selection count to the previous one
                    // But if nothing was selected before, the selection can't have changed
                    selectionChanged = previousSelectedValues.length && selectedOptions().length < previousSelectedValues.length;
                } else {
                    // For a single-select box, compare the current value to the previous value
                    // But if nothing was selected before or nothing is selected now, just look for a change in selection
                    selectionChanged = (previousSelectedValues.length && element.selectedIndex >= 0)
                        ? (ko.selectExtensions.readValue(element.options[element.selectedIndex]) !== previousSelectedValues[0])
                        : (previousSelectedValues.length || element.selectedIndex >= 0);
                }

                // Ensure consistency between model value and selected option.
                // If the dropdown was changed so that selection is no longer the same,
                // notify the value or selectedOptions binding.
                if (selectionChanged) {
                    ko.utils.triggerEvent(element, "change");
                }
            }
        });

        // Workaround for IE bug
        ko.utils.ensureSelectElementIsRenderedCorrectly(element);

        if (previousScrollTop && Math.abs(previousScrollTop - element.scrollTop) > 20)
            element.scrollTop = previousScrollTop;
    }
};
ko.bindingHandlers['options'].optionValueDomDataKey = ko.utils.domData.nextKey();
ko.bindingHandlers['selectedOptions'] = {
    'after': ['options', 'foreach'],
    'init': function (element, valueAccessor, allBindings) {
        ko.utils.registerEventHandler(element, "change", function () {
            var value = valueAccessor(), valueToWrite = [];
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                if (node.selected)
                    valueToWrite.push(ko.selectExtensions.readValue(node));
            });
            ko.expressionRewriting.writeValueToProperty(value, allBindings, 'selectedOptions', valueToWrite);
        });
    },
    'update': function (element, valueAccessor) {
        if (ko.utils.tagNameLower(element) != "select")
            throw new Error("values binding applies only to SELECT elements");

        var newValue = ko.utils.unwrapObservable(valueAccessor()),
            previousScrollTop = element.scrollTop;

        if (newValue && typeof newValue.length == "number") {
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                var isSelected = ko.utils.arrayIndexOf(newValue, ko.selectExtensions.readValue(node)) >= 0;
                if (node.selected != isSelected) {      // This check prevents flashing of the select element in IE
                    ko.utils.setOptionNodeSelectionState(node, isSelected);
                }
            });
        }

        element.scrollTop = previousScrollTop;
    }
};
ko.expressionRewriting.twoWayBindings['selectedOptions'] = true;
ko.bindingHandlers['style'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor() || {});
        ko.utils.objectForEach(value, function(styleName, styleValue) {
            styleValue = ko.utils.unwrapObservable(styleValue);

            if (styleValue === null || styleValue === undefined || styleValue === false) {
                // Empty string removes the value, whereas null/undefined have no effect
                styleValue = "";
            }

            element.style[styleName] = styleValue;
        });
    }
};
ko.bindingHandlers['submit'] = {
    'init': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        if (typeof valueAccessor() != "function")
            throw new Error("The value for a submit binding must be a function");
        ko.utils.registerEventHandler(element, "submit", function (event) {
            var handlerReturnValue;
            var value = valueAccessor();
            try { handlerReturnValue = value.call(bindingContext['$data'], element); }
            finally {
                if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                    if (event.preventDefault)
                        event.preventDefault();
                    else
                        event.returnValue = false;
                }
            }
        });
    }
};
ko.bindingHandlers['text'] = {
    'init': function() {
        // Prevent binding on the dynamically-injected text node (as developers are unlikely to expect that, and it has security implications).
        // It should also make things faster, as we no longer have to consider whether the text node might be bindable.
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor) {
        ko.utils.setTextContent(element, valueAccessor());
    }
};
ko.virtualElements.allowedBindings['text'] = true;
(function () {

if (window && window.navigator) {
    var parseVersion = function (matches) {
        if (matches) {
            return parseFloat(matches[1]);
        }
    };

    // Detect various browser versions because some old versions don't fully support the 'input' event
    var operaVersion = window.opera && window.opera.version && parseInt(window.opera.version()),
        userAgent = window.navigator.userAgent,
        safariVersion = parseVersion(userAgent.match(/^(?:(?!chrome).)*version\/([^ ]*) safari/i)),
        firefoxVersion = parseVersion(userAgent.match(/Firefox\/([^ ]*)/));
}

// IE 8 and 9 have bugs that prevent the normal events from firing when the value changes.
// But it does fire the 'selectionchange' event on many of those, presumably because the
// cursor is moving and that counts as the selection changing. The 'selectionchange' event is
// fired at the document level only and doesn't directly indicate which element changed. We
// set up just one event handler for the document and use 'activeElement' to determine which
// element was changed.
if (ko.utils.ieVersion < 10) {
    var selectionChangeRegisteredName = ko.utils.domData.nextKey(),
        selectionChangeHandlerName = ko.utils.domData.nextKey();
    var selectionChangeHandler = function(event) {
        var target = this.activeElement,
            handler = target && ko.utils.domData.get(target, selectionChangeHandlerName);
        if (handler) {
            handler(event);
        }
    };
    var registerForSelectionChangeEvent = function (element, handler) {
        var ownerDoc = element.ownerDocument;
        if (!ko.utils.domData.get(ownerDoc, selectionChangeRegisteredName)) {
            ko.utils.domData.set(ownerDoc, selectionChangeRegisteredName, true);
            ko.utils.registerEventHandler(ownerDoc, 'selectionchange', selectionChangeHandler);
        }
        ko.utils.domData.set(element, selectionChangeHandlerName, handler);
    };
}

ko.bindingHandlers['textInput'] = {
    'init': function (element, valueAccessor, allBindings) {

        var previousElementValue = element.value,
            timeoutHandle,
            elementValueBeforeEvent;

        var updateModel = function (event) {
            clearTimeout(timeoutHandle);
            elementValueBeforeEvent = timeoutHandle = undefined;

            var elementValue = element.value;
            if (previousElementValue !== elementValue) {
                // Provide a way for tests to know exactly which event was processed
                if (DEBUG && event) element['_ko_textInputProcessedEvent'] = event.type;
                previousElementValue = elementValue;
                ko.expressionRewriting.writeValueToProperty(valueAccessor(), allBindings, 'textInput', elementValue);
            }
        };

        var deferUpdateModel = function (event) {
            if (!timeoutHandle) {
                // The elementValueBeforeEvent variable is set *only* during the brief gap between an
                // event firing and the updateModel function running. This allows us to ignore model
                // updates that are from the previous state of the element, usually due to techniques
                // such as rateLimit. Such updates, if not ignored, can cause keystrokes to be lost.
                elementValueBeforeEvent = element.value;
                var handler = DEBUG ? updateModel.bind(element, {type: event.type}) : updateModel;
                timeoutHandle = ko.utils.setTimeout(handler, 4);
            }
        };

        // IE9 will mess up the DOM if you handle events synchronously which results in DOM changes (such as other bindings);
        // so we'll make sure all updates are asynchronous
        var ieUpdateModel = ko.utils.ieVersion == 9 ? deferUpdateModel : updateModel;

        var updateView = function () {
            var modelValue = ko.utils.unwrapObservable(valueAccessor());

            if (modelValue === null || modelValue === undefined) {
                modelValue = '';
            }

            if (elementValueBeforeEvent !== undefined && modelValue === elementValueBeforeEvent) {
                ko.utils.setTimeout(updateView, 4);
                return;
            }

            // Update the element only if the element and model are different. On some browsers, updating the value
            // will move the cursor to the end of the input, which would be bad while the user is typing.
            if (element.value !== modelValue) {
                previousElementValue = modelValue;  // Make sure we ignore events (propertychange) that result from updating the value
                element.value = modelValue;
            }
        };

        var onEvent = function (event, handler) {
            ko.utils.registerEventHandler(element, event, handler);
        };

        if (DEBUG && ko.bindingHandlers['textInput']['_forceUpdateOn']) {
            // Provide a way for tests to specify exactly which events are bound
            ko.utils.arrayForEach(ko.bindingHandlers['textInput']['_forceUpdateOn'], function(eventName) {
                if (eventName.slice(0,5) == 'after') {
                    onEvent(eventName.slice(5), deferUpdateModel);
                } else {
                    onEvent(eventName, updateModel);
                }
            });
        } else {
            if (ko.utils.ieVersion < 10) {
                // Internet Explorer <= 8 doesn't support the 'input' event, but does include 'propertychange' that fires whenever
                // any property of an element changes. Unlike 'input', it also fires if a property is changed from JavaScript code,
                // but that's an acceptable compromise for this binding. IE 9 does support 'input', but since it doesn't fire it
                // when using autocomplete, we'll use 'propertychange' for it also.
                onEvent('propertychange', function(event) {
                    if (event.propertyName === 'value') {
                        ieUpdateModel(event);
                    }
                });

                if (ko.utils.ieVersion == 8) {
                    // IE 8 has a bug where it fails to fire 'propertychange' on the first update following a value change from
                    // JavaScript code. It also doesn't fire if you clear the entire value. To fix this, we bind to the following
                    // events too.
                    onEvent('keyup', updateModel);      // A single keystoke
                    onEvent('keydown', updateModel);    // The first character when a key is held down
                }
                if (ko.utils.ieVersion >= 8) {
                    // Internet Explorer 9 doesn't fire the 'input' event when deleting text, including using
                    // the backspace, delete, or ctrl-x keys, clicking the 'x' to clear the input, dragging text
                    // out of the field, and cutting or deleting text using the context menu. 'selectionchange'
                    // can detect all of those except dragging text out of the field, for which we use 'dragend'.
                    // These are also needed in IE8 because of the bug described above.
                    registerForSelectionChangeEvent(element, ieUpdateModel);  // 'selectionchange' covers cut, paste, drop, delete, etc.
                    onEvent('dragend', deferUpdateModel);
                }
            } else {
                // All other supported browsers support the 'input' event, which fires whenever the content of the element is changed
                // through the user interface.
                onEvent('input', updateModel);

                if (safariVersion < 5 && ko.utils.tagNameLower(element) === "textarea") {
                    // Safari <5 doesn't fire the 'input' event for <textarea> elements (it does fire 'textInput'
                    // but only when typing). So we'll just catch as much as we can with keydown, cut, and paste.
                    onEvent('keydown', deferUpdateModel);
                    onEvent('paste', deferUpdateModel);
                    onEvent('cut', deferUpdateModel);
                } else if (operaVersion < 11) {
                    // Opera 10 doesn't always fire the 'input' event for cut, paste, undo & drop operations.
                    // We can try to catch some of those using 'keydown'.
                    onEvent('keydown', deferUpdateModel);
                } else if (firefoxVersion < 4.0) {
                    // Firefox <= 3.6 doesn't fire the 'input' event when text is filled in through autocomplete
                    onEvent('DOMAutoComplete', updateModel);

                    // Firefox <=3.5 doesn't fire the 'input' event when text is dropped into the input.
                    onEvent('dragdrop', updateModel);       // <3.5
                    onEvent('drop', updateModel);           // 3.5
                }
            }
        }

        // Bind to the change event so that we can catch programmatic updates of the value that fire this event.
        onEvent('change', updateModel);

        ko.computed(updateView, null, { disposeWhenNodeIsRemoved: element });
    }
};
ko.expressionRewriting.twoWayBindings['textInput'] = true;

// textinput is an alias for textInput
ko.bindingHandlers['textinput'] = {
    // preprocess is the only way to set up a full alias
    'preprocess': function (value, name, addBinding) {
        addBinding('textInput', value);
    }
};

})();ko.bindingHandlers['uniqueName'] = {
    'init': function (element, valueAccessor) {
        if (valueAccessor()) {
            var name = "ko_unique_" + (++ko.bindingHandlers['uniqueName'].currentIndex);
            ko.utils.setElementName(element, name);
        }
    }
};
ko.bindingHandlers['uniqueName'].currentIndex = 0;
ko.bindingHandlers['value'] = {
    'after': ['options', 'foreach'],
    'init': function (element, valueAccessor, allBindings) {
        // If the value binding is placed on a radio/checkbox, then just pass through to checkedValue and quit
        if (element.tagName.toLowerCase() == "input" && (element.type == "checkbox" || element.type == "radio")) {
            ko.applyBindingAccessorsToNode(element, { 'checkedValue': valueAccessor });
            return;
        }

        // Always catch "change" event; possibly other events too if asked
        var eventsToCatch = ["change"];
        var requestedEventsToCatch = allBindings.get("valueUpdate");
        var propertyChangedFired = false;
        var elementValueBeforeEvent = null;

        if (requestedEventsToCatch) {
            if (typeof requestedEventsToCatch == "string") // Allow both individual event names, and arrays of event names
                requestedEventsToCatch = [requestedEventsToCatch];
            ko.utils.arrayPushAll(eventsToCatch, requestedEventsToCatch);
            eventsToCatch = ko.utils.arrayGetDistinctValues(eventsToCatch);
        }

        var valueUpdateHandler = function() {
            elementValueBeforeEvent = null;
            propertyChangedFired = false;
            var modelValue = valueAccessor();
            var elementValue = ko.selectExtensions.readValue(element);
            ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'value', elementValue);
        }

        // Workaround for https://github.com/SteveSanderson/knockout/issues/122
        // IE doesn't fire "change" events on textboxes if the user selects a value from its autocomplete list
        var ieAutoCompleteHackNeeded = ko.utils.ieVersion && element.tagName.toLowerCase() == "input" && element.type == "text"
                                       && element.autocomplete != "off" && (!element.form || element.form.autocomplete != "off");
        if (ieAutoCompleteHackNeeded && ko.utils.arrayIndexOf(eventsToCatch, "propertychange") == -1) {
            ko.utils.registerEventHandler(element, "propertychange", function () { propertyChangedFired = true });
            ko.utils.registerEventHandler(element, "focus", function () { propertyChangedFired = false });
            ko.utils.registerEventHandler(element, "blur", function() {
                if (propertyChangedFired) {
                    valueUpdateHandler();
                }
            });
        }

        ko.utils.arrayForEach(eventsToCatch, function(eventName) {
            // The syntax "after<eventname>" means "run the handler asynchronously after the event"
            // This is useful, for example, to catch "keydown" events after the browser has updated the control
            // (otherwise, ko.selectExtensions.readValue(this) will receive the control's value *before* the key event)
            var handler = valueUpdateHandler;
            if (ko.utils.stringStartsWith(eventName, "after")) {
                handler = function() {
                    // The elementValueBeforeEvent variable is non-null *only* during the brief gap between
                    // a keyX event firing and the valueUpdateHandler running, which is scheduled to happen
                    // at the earliest asynchronous opportunity. We store this temporary information so that
                    // if, between keyX and valueUpdateHandler, the underlying model value changes separately,
                    // we can overwrite that model value change with the value the user just typed. Otherwise,
                    // techniques like rateLimit can trigger model changes at critical moments that will
                    // override the user's inputs, causing keystrokes to be lost.
                    elementValueBeforeEvent = ko.selectExtensions.readValue(element);
                    ko.utils.setTimeout(valueUpdateHandler, 0);
                };
                eventName = eventName.substring("after".length);
            }
            ko.utils.registerEventHandler(element, eventName, handler);
        });

        var updateFromModel = function () {
            var newValue = ko.utils.unwrapObservable(valueAccessor());
            var elementValue = ko.selectExtensions.readValue(element);

            if (elementValueBeforeEvent !== null && newValue === elementValueBeforeEvent) {
                ko.utils.setTimeout(updateFromModel, 0);
                return;
            }

            var valueHasChanged = (newValue !== elementValue);

            if (valueHasChanged) {
                if (ko.utils.tagNameLower(element) === "select") {
                    var allowUnset = allBindings.get('valueAllowUnset');
                    var applyValueAction = function () {
                        ko.selectExtensions.writeValue(element, newValue, allowUnset);
                    };
                    applyValueAction();

                    if (!allowUnset && newValue !== ko.selectExtensions.readValue(element)) {
                        // If you try to set a model value that can't be represented in an already-populated dropdown, reject that change,
                        // because you're not allowed to have a model value that disagrees with a visible UI selection.
                        ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);
                    } else {
                        // Workaround for IE6 bug: It won't reliably apply values to SELECT nodes during the same execution thread
                        // right after you've changed the set of OPTION nodes on it. So for that node type, we'll schedule a second thread
                        // to apply the value as well.
                        ko.utils.setTimeout(applyValueAction, 0);
                    }
                } else {
                    ko.selectExtensions.writeValue(element, newValue);
                }
            }
        };

        ko.computed(updateFromModel, null, { disposeWhenNodeIsRemoved: element });
    },
    'update': function() {} // Keep for backwards compatibility with code that may have wrapped value binding
};
ko.expressionRewriting.twoWayBindings['value'] = true;
ko.bindingHandlers['visible'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var isCurrentlyVisible = !(element.style.display == "none");
        if (value && !isCurrentlyVisible)
            element.style.display = "";
        else if ((!value) && isCurrentlyVisible)
            element.style.display = "none";
    }
};
// 'click' is just a shorthand for the usual full-length event:{click:handler}
makeEventHandlerShortcut('click');
// If you want to make a custom template engine,
//
// [1] Inherit from this class (like ko.nativeTemplateEngine does)
// [2] Override 'renderTemplateSource', supplying a function with this signature:
//
//        function (templateSource, bindingContext, options) {
//            // - templateSource.text() is the text of the template you should render
//            // - bindingContext.$data is the data you should pass into the template
//            //   - you might also want to make bindingContext.$parent, bindingContext.$parents,
//            //     and bindingContext.$root available in the template too
//            // - options gives you access to any other properties set on "data-bind: { template: options }"
//            // - templateDocument is the document object of the template
//            //
//            // Return value: an array of DOM nodes
//        }
//
// [3] Override 'createJavaScriptEvaluatorBlock', supplying a function with this signature:
//
//        function (script) {
//            // Return value: Whatever syntax means "Evaluate the JavaScript statement 'script' and output the result"
//            //               For example, the jquery.tmpl template engine converts 'someScript' to '${ someScript }'
//        }
//
//     This is only necessary if you want to allow data-bind attributes to reference arbitrary template variables.
//     If you don't want to allow that, you can set the property 'allowTemplateRewriting' to false (like ko.nativeTemplateEngine does)
//     and then you don't need to override 'createJavaScriptEvaluatorBlock'.

ko.templateEngine = function () { };

ko.templateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options, templateDocument) {
    throw new Error("Override renderTemplateSource");
};

ko.templateEngine.prototype['createJavaScriptEvaluatorBlock'] = function (script) {
    throw new Error("Override createJavaScriptEvaluatorBlock");
};

ko.templateEngine.prototype['makeTemplateSource'] = function(template, templateDocument) {
    // Named template
    if (typeof template == "string") {
        templateDocument = templateDocument || document;
        var elem = templateDocument.getElementById(template);
        if (!elem)
            throw new Error("Cannot find template with ID " + template);
        return new ko.templateSources.domElement(elem);
    } else if ((template.nodeType == 1) || (template.nodeType == 8)) {
        // Anonymous template
        return new ko.templateSources.anonymousTemplate(template);
    } else
        throw new Error("Unknown template type: " + template);
};

ko.templateEngine.prototype['renderTemplate'] = function (template, bindingContext, options, templateDocument) {
    var templateSource = this['makeTemplateSource'](template, templateDocument);
    return this['renderTemplateSource'](templateSource, bindingContext, options, templateDocument);
};

ko.templateEngine.prototype['isTemplateRewritten'] = function (template, templateDocument) {
    // Skip rewriting if requested
    if (this['allowTemplateRewriting'] === false)
        return true;
    return this['makeTemplateSource'](template, templateDocument)['data']("isRewritten");
};

ko.templateEngine.prototype['rewriteTemplate'] = function (template, rewriterCallback, templateDocument) {
    var templateSource = this['makeTemplateSource'](template, templateDocument);
    var rewritten = rewriterCallback(templateSource['text']());
    templateSource['text'](rewritten);
    templateSource['data']("isRewritten", true);
};

ko.exportSymbol('templateEngine', ko.templateEngine);

ko.templateRewriting = (function () {
    var memoizeDataBindingAttributeSyntaxRegex = /(<([a-z]+\d*)(?:\s+(?!data-bind\s*=\s*)[a-z0-9\-]+(?:=(?:\"[^\"]*\"|\'[^\']*\'|[^>]*))?)*\s+)data-bind\s*=\s*(["'])([\s\S]*?)\3/gi;
    var memoizeVirtualContainerBindingSyntaxRegex = /<!--\s*ko\b\s*([\s\S]*?)\s*-->/g;

    function validateDataBindValuesForRewriting(keyValueArray) {
        var allValidators = ko.expressionRewriting.bindingRewriteValidators;
        for (var i = 0; i < keyValueArray.length; i++) {
            var key = keyValueArray[i]['key'];
            if (allValidators.hasOwnProperty(key)) {
                var validator = allValidators[key];

                if (typeof validator === "function") {
                    var possibleErrorMessage = validator(keyValueArray[i]['value']);
                    if (possibleErrorMessage)
                        throw new Error(possibleErrorMessage);
                } else if (!validator) {
                    throw new Error("This template engine does not support the '" + key + "' binding within its templates");
                }
            }
        }
    }

    function constructMemoizedTagReplacement(dataBindAttributeValue, tagToRetain, nodeName, templateEngine) {
        var dataBindKeyValueArray = ko.expressionRewriting.parseObjectLiteral(dataBindAttributeValue);
        validateDataBindValuesForRewriting(dataBindKeyValueArray);
        var rewrittenDataBindAttributeValue = ko.expressionRewriting.preProcessBindings(dataBindKeyValueArray, {'valueAccessors':true});

        // For no obvious reason, Opera fails to evaluate rewrittenDataBindAttributeValue unless it's wrapped in an additional
        // anonymous function, even though Opera's built-in debugger can evaluate it anyway. No other browser requires this
        // extra indirection.
        var applyBindingsToNextSiblingScript =
            "ko.__tr_ambtns(function($context,$element){return(function(){return{ " + rewrittenDataBindAttributeValue + " } })()},'" + nodeName.toLowerCase() + "')";
        return templateEngine['createJavaScriptEvaluatorBlock'](applyBindingsToNextSiblingScript) + tagToRetain;
    }

    return {
        ensureTemplateIsRewritten: function (template, templateEngine, templateDocument) {
            if (!templateEngine['isTemplateRewritten'](template, templateDocument))
                templateEngine['rewriteTemplate'](template, function (htmlString) {
                    return ko.templateRewriting.memoizeBindingAttributeSyntax(htmlString, templateEngine);
                }, templateDocument);
        },

        memoizeBindingAttributeSyntax: function (htmlString, templateEngine) {
            return htmlString.replace(memoizeDataBindingAttributeSyntaxRegex, function () {
                return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[4], /* tagToRetain: */ arguments[1], /* nodeName: */ arguments[2], templateEngine);
            }).replace(memoizeVirtualContainerBindingSyntaxRegex, function() {
                return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[1], /* tagToRetain: */ "<!-- ko -->", /* nodeName: */ "#comment", templateEngine);
            });
        },

        applyMemoizedBindingsToNextSibling: function (bindings, nodeName) {
            return ko.memoization.memoize(function (domNode, bindingContext) {
                var nodeToBind = domNode.nextSibling;
                if (nodeToBind && nodeToBind.nodeName.toLowerCase() === nodeName) {
                    ko.applyBindingAccessorsToNode(nodeToBind, bindings, bindingContext);
                }
            });
        }
    }
})();


// Exported only because it has to be referenced by string lookup from within rewritten template
ko.exportSymbol('__tr_ambtns', ko.templateRewriting.applyMemoizedBindingsToNextSibling);
(function() {
    // A template source represents a read/write way of accessing a template. This is to eliminate the need for template loading/saving
    // logic to be duplicated in every template engine (and means they can all work with anonymous templates, etc.)
    //
    // Two are provided by default:
    //  1. ko.templateSources.domElement       - reads/writes the text content of an arbitrary DOM element
    //  2. ko.templateSources.anonymousElement - uses ko.utils.domData to read/write text *associated* with the DOM element, but
    //                                           without reading/writing the actual element text content, since it will be overwritten
    //                                           with the rendered template output.
    // You can implement your own template source if you want to fetch/store templates somewhere other than in DOM elements.
    // Template sources need to have the following functions:
    //   text() 			- returns the template text from your storage location
    //   text(value)		- writes the supplied template text to your storage location
    //   data(key)			- reads values stored using data(key, value) - see below
    //   data(key, value)	- associates "value" with this template and the key "key". Is used to store information like "isRewritten".
    //
    // Optionally, template sources can also have the following functions:
    //   nodes()            - returns a DOM element containing the nodes of this template, where available
    //   nodes(value)       - writes the given DOM element to your storage location
    // If a DOM element is available for a given template source, template engines are encouraged to use it in preference over text()
    // for improved speed. However, all templateSources must supply text() even if they don't supply nodes().
    //
    // Once you've implemented a templateSource, make your template engine use it by subclassing whatever template engine you were
    // using and overriding "makeTemplateSource" to return an instance of your custom template source.

    ko.templateSources = {};

    // ---- ko.templateSources.domElement -----

    // template types
    var templateScript = 1,
        templateTextArea = 2,
        templateTemplate = 3,
        templateElement = 4;

    ko.templateSources.domElement = function(element) {
        this.domElement = element;

        if (element) {
            var tagNameLower = ko.utils.tagNameLower(element);
            this.templateType =
                tagNameLower === "script" ? templateScript :
                tagNameLower === "textarea" ? templateTextArea :
                    // For browsers with proper <template> element support, where the .content property gives a document fragment
                tagNameLower == "template" && element.content && element.content.nodeType === 11 ? templateTemplate :
                templateElement;
        }
    }

    ko.templateSources.domElement.prototype['text'] = function(/* valueToWrite */) {
        var elemContentsProperty = this.templateType === templateScript ? "text"
                                 : this.templateType === templateTextArea ? "value"
                                 : "innerHTML";

        if (arguments.length == 0) {
            return this.domElement[elemContentsProperty];
        } else {
            var valueToWrite = arguments[0];
            if (elemContentsProperty === "innerHTML")
                ko.utils.setHtml(this.domElement, valueToWrite);
            else
                this.domElement[elemContentsProperty] = valueToWrite;
        }
    };

    var dataDomDataPrefix = ko.utils.domData.nextKey() + "_";
    ko.templateSources.domElement.prototype['data'] = function(key /*, valueToWrite */) {
        if (arguments.length === 1) {
            return ko.utils.domData.get(this.domElement, dataDomDataPrefix + key);
        } else {
            ko.utils.domData.set(this.domElement, dataDomDataPrefix + key, arguments[1]);
        }
    };

    var templatesDomDataKey = ko.utils.domData.nextKey();
    function getTemplateDomData(element) {
        return ko.utils.domData.get(element, templatesDomDataKey) || {};
    }
    function setTemplateDomData(element, data) {
        ko.utils.domData.set(element, templatesDomDataKey, data);
    }

    ko.templateSources.domElement.prototype['nodes'] = function(/* valueToWrite */) {
        var element = this.domElement;
        if (arguments.length == 0) {
            var templateData = getTemplateDomData(element),
                containerData = templateData.containerData;
            return containerData || (
                this.templateType === templateTemplate ? element.content :
                this.templateType === templateElement ? element :
                undefined);
        } else {
            var valueToWrite = arguments[0];
            setTemplateDomData(element, {containerData: valueToWrite});
        }
    };

    // ---- ko.templateSources.anonymousTemplate -----
    // Anonymous templates are normally saved/retrieved as DOM nodes through "nodes".
    // For compatibility, you can also read "text"; it will be serialized from the nodes on demand.
    // Writing to "text" is still supported, but then the template data will not be available as DOM nodes.

    ko.templateSources.anonymousTemplate = function(element) {
        this.domElement = element;
    }
    ko.templateSources.anonymousTemplate.prototype = new ko.templateSources.domElement();
    ko.templateSources.anonymousTemplate.prototype.constructor = ko.templateSources.anonymousTemplate;
    ko.templateSources.anonymousTemplate.prototype['text'] = function(/* valueToWrite */) {
        if (arguments.length == 0) {
            var templateData = getTemplateDomData(this.domElement);
            if (templateData.textData === undefined && templateData.containerData)
                templateData.textData = templateData.containerData.innerHTML;
            return templateData.textData;
        } else {
            var valueToWrite = arguments[0];
            setTemplateDomData(this.domElement, {textData: valueToWrite});
        }
    };

    ko.exportSymbol('templateSources', ko.templateSources);
    ko.exportSymbol('templateSources.domElement', ko.templateSources.domElement);
    ko.exportSymbol('templateSources.anonymousTemplate', ko.templateSources.anonymousTemplate);
})();
(function () {
    var _templateEngine;
    ko.setTemplateEngine = function (templateEngine) {
        if ((templateEngine != undefined) && !(templateEngine instanceof ko.templateEngine))
            throw new Error("templateEngine must inherit from ko.templateEngine");
        _templateEngine = templateEngine;
    }

    function invokeForEachNodeInContinuousRange(firstNode, lastNode, action) {
        var node, nextInQueue = firstNode, firstOutOfRangeNode = ko.virtualElements.nextSibling(lastNode);
        while (nextInQueue && ((node = nextInQueue) !== firstOutOfRangeNode)) {
            nextInQueue = ko.virtualElements.nextSibling(node);
            action(node, nextInQueue);
        }
    }

    function activateBindingsOnContinuousNodeArray(continuousNodeArray, bindingContext) {
        // To be used on any nodes that have been rendered by a template and have been inserted into some parent element
        // Walks through continuousNodeArray (which *must* be continuous, i.e., an uninterrupted sequence of sibling nodes, because
        // the algorithm for walking them relies on this), and for each top-level item in the virtual-element sense,
        // (1) Does a regular "applyBindings" to associate bindingContext with this node and to activate any non-memoized bindings
        // (2) Unmemoizes any memos in the DOM subtree (e.g., to activate bindings that had been memoized during template rewriting)

        if (continuousNodeArray.length) {
            var firstNode = continuousNodeArray[0],
                lastNode = continuousNodeArray[continuousNodeArray.length - 1],
                parentNode = firstNode.parentNode,
                provider = ko.bindingProvider['instance'],
                preprocessNode = provider['preprocessNode'];

            if (preprocessNode) {
                invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node, nextNodeInRange) {
                    var nodePreviousSibling = node.previousSibling;
                    var newNodes = preprocessNode.call(provider, node);
                    if (newNodes) {
                        if (node === firstNode)
                            firstNode = newNodes[0] || nextNodeInRange;
                        if (node === lastNode)
                            lastNode = newNodes[newNodes.length - 1] || nodePreviousSibling;
                    }
                });

                // Because preprocessNode can change the nodes, including the first and last nodes, update continuousNodeArray to match.
                // We need the full set, including inner nodes, because the unmemoize step might remove the first node (and so the real
                // first node needs to be in the array).
                continuousNodeArray.length = 0;
                if (!firstNode) { // preprocessNode might have removed all the nodes, in which case there's nothing left to do
                    return;
                }
                if (firstNode === lastNode) {
                    continuousNodeArray.push(firstNode);
                } else {
                    continuousNodeArray.push(firstNode, lastNode);
                    ko.utils.fixUpContinuousNodeArray(continuousNodeArray, parentNode);
                }
            }

            // Need to applyBindings *before* unmemoziation, because unmemoization might introduce extra nodes (that we don't want to re-bind)
            // whereas a regular applyBindings won't introduce new memoized nodes
            invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node) {
                if (node.nodeType === 1 || node.nodeType === 8)
                    ko.applyBindings(bindingContext, node);
            });
            invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node) {
                if (node.nodeType === 1 || node.nodeType === 8)
                    ko.memoization.unmemoizeDomNodeAndDescendants(node, [bindingContext]);
            });

            // Make sure any changes done by applyBindings or unmemoize are reflected in the array
            ko.utils.fixUpContinuousNodeArray(continuousNodeArray, parentNode);
        }
    }

    function getFirstNodeFromPossibleArray(nodeOrNodeArray) {
        return nodeOrNodeArray.nodeType ? nodeOrNodeArray
                                        : nodeOrNodeArray.length > 0 ? nodeOrNodeArray[0]
                                        : null;
    }

    function executeTemplate(targetNodeOrNodeArray, renderMode, template, bindingContext, options) {
        options = options || {};
        var firstTargetNode = targetNodeOrNodeArray && getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
        var templateDocument = (firstTargetNode || template || {}).ownerDocument;
        var templateEngineToUse = (options['templateEngine'] || _templateEngine);
        ko.templateRewriting.ensureTemplateIsRewritten(template, templateEngineToUse, templateDocument);
        var renderedNodesArray = templateEngineToUse['renderTemplate'](template, bindingContext, options, templateDocument);

        // Loosely check result is an array of DOM nodes
        if ((typeof renderedNodesArray.length != "number") || (renderedNodesArray.length > 0 && typeof renderedNodesArray[0].nodeType != "number"))
            throw new Error("Template engine must return an array of DOM nodes");

        var haveAddedNodesToParent = false;
        switch (renderMode) {
            case "replaceChildren":
                ko.virtualElements.setDomNodeChildren(targetNodeOrNodeArray, renderedNodesArray);
                haveAddedNodesToParent = true;
                break;
            case "replaceNode":
                ko.utils.replaceDomNodes(targetNodeOrNodeArray, renderedNodesArray);
                haveAddedNodesToParent = true;
                break;
            case "ignoreTargetNode": break;
            default:
                throw new Error("Unknown renderMode: " + renderMode);
        }

        if (haveAddedNodesToParent) {
            activateBindingsOnContinuousNodeArray(renderedNodesArray, bindingContext);
            if (options['afterRender'])
                ko.dependencyDetection.ignore(options['afterRender'], null, [renderedNodesArray, bindingContext['$data']]);
        }

        return renderedNodesArray;
    }

    function resolveTemplateName(template, data, context) {
        // The template can be specified as:
        if (ko.isObservable(template)) {
            // 1. An observable, with string value
            return template();
        } else if (typeof template === 'function') {
            // 2. A function of (data, context) returning a string
            return template(data, context);
        } else {
            // 3. A string
            return template;
        }
    }

    ko.renderTemplate = function (template, dataOrBindingContext, options, targetNodeOrNodeArray, renderMode) {
        options = options || {};
        if ((options['templateEngine'] || _templateEngine) == undefined)
            throw new Error("Set a template engine before calling renderTemplate");
        renderMode = renderMode || "replaceChildren";

        if (targetNodeOrNodeArray) {
            var firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);

            var whenToDispose = function () { return (!firstTargetNode) || !ko.utils.domNodeIsAttachedToDocument(firstTargetNode); }; // Passive disposal (on next evaluation)
            var activelyDisposeWhenNodeIsRemoved = (firstTargetNode && renderMode == "replaceNode") ? firstTargetNode.parentNode : firstTargetNode;

            return ko.dependentObservable( // So the DOM is automatically updated when any dependency changes
                function () {
                    // Ensure we've got a proper binding context to work with
                    var bindingContext = (dataOrBindingContext && (dataOrBindingContext instanceof ko.bindingContext))
                        ? dataOrBindingContext
                        : new ko.bindingContext(dataOrBindingContext, null, null, null, { "exportDependencies": true });

                    var templateName = resolveTemplateName(template, bindingContext['$data'], bindingContext),
                        renderedNodesArray = executeTemplate(targetNodeOrNodeArray, renderMode, templateName, bindingContext, options);

                    if (renderMode == "replaceNode") {
                        targetNodeOrNodeArray = renderedNodesArray;
                        firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
                    }
                },
                null,
                { disposeWhen: whenToDispose, disposeWhenNodeIsRemoved: activelyDisposeWhenNodeIsRemoved }
            );
        } else {
            // We don't yet have a DOM node to evaluate, so use a memo and render the template later when there is a DOM node
            return ko.memoization.memoize(function (domNode) {
                ko.renderTemplate(template, dataOrBindingContext, options, domNode, "replaceNode");
            });
        }
    };

    ko.renderTemplateForEach = function (template, arrayOrObservableArray, options, targetNode, parentBindingContext) {
        // Since setDomNodeChildrenFromArrayMapping always calls executeTemplateForArrayItem and then
        // activateBindingsCallback for added items, we can store the binding context in the former to use in the latter.
        var arrayItemContext;

        // This will be called by setDomNodeChildrenFromArrayMapping to get the nodes to add to targetNode
        var executeTemplateForArrayItem = function (arrayValue, index) {
            // Support selecting template as a function of the data being rendered
            arrayItemContext = parentBindingContext['createChildContext'](arrayValue, options['as'], function(context) {
                context['$index'] = index;
            });

            var templateName = resolveTemplateName(template, arrayValue, arrayItemContext);
            return executeTemplate(null, "ignoreTargetNode", templateName, arrayItemContext, options);
        }

        // This will be called whenever setDomNodeChildrenFromArrayMapping has added nodes to targetNode
        var activateBindingsCallback = function(arrayValue, addedNodesArray, index) {
            activateBindingsOnContinuousNodeArray(addedNodesArray, arrayItemContext);
            if (options['afterRender'])
                options['afterRender'](addedNodesArray, arrayValue);

            // release the "cache" variable, so that it can be collected by
            // the GC when its value isn't used from within the bindings anymore.
            arrayItemContext = null;
        };

        return ko.dependentObservable(function () {
            var unwrappedArray = ko.utils.unwrapObservable(arrayOrObservableArray) || [];
            if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                unwrappedArray = [unwrappedArray];

            // Filter out any entries marked as destroyed
            var filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) {
                return options['includeDestroyed'] || item === undefined || item === null || !ko.utils.unwrapObservable(item['_destroy']);
            });

            // Call setDomNodeChildrenFromArrayMapping, ignoring any observables unwrapped within (most likely from a callback function).
            // If the array items are observables, though, they will be unwrapped in executeTemplateForArrayItem and managed within setDomNodeChildrenFromArrayMapping.
            ko.dependencyDetection.ignore(ko.utils.setDomNodeChildrenFromArrayMapping, null, [targetNode, filteredArray, executeTemplateForArrayItem, options, activateBindingsCallback]);

        }, null, { disposeWhenNodeIsRemoved: targetNode });
    };

    var templateComputedDomDataKey = ko.utils.domData.nextKey();
    function disposeOldComputedAndStoreNewOne(element, newComputed) {
        var oldComputed = ko.utils.domData.get(element, templateComputedDomDataKey);
        if (oldComputed && (typeof(oldComputed.dispose) == 'function'))
            oldComputed.dispose();
        ko.utils.domData.set(element, templateComputedDomDataKey, (newComputed && newComputed.isActive()) ? newComputed : undefined);
    }

    ko.bindingHandlers['template'] = {
        'init': function(element, valueAccessor) {
            // Support anonymous templates
            var bindingValue = ko.utils.unwrapObservable(valueAccessor());
            if (typeof bindingValue == "string" || bindingValue['name']) {
                // It's a named template - clear the element
                ko.virtualElements.emptyNode(element);
            } else if ('nodes' in bindingValue) {
                // We've been given an array of DOM nodes. Save them as the template source.
                // There is no known use case for the node array being an observable array (if the output
                // varies, put that behavior *into* your template - that's what templates are for), and
                // the implementation would be a mess, so assert that it's not observable.
                var nodes = bindingValue['nodes'] || [];
                if (ko.isObservable(nodes)) {
                    throw new Error('The "nodes" option must be a plain, non-observable array.');
                }
                var container = ko.utils.moveCleanedNodesToContainerElement(nodes); // This also removes the nodes from their current parent
                new ko.templateSources.anonymousTemplate(element)['nodes'](container);
            } else {
                // It's an anonymous template - store the element contents, then clear the element
                var templateNodes = ko.virtualElements.childNodes(element),
                    container = ko.utils.moveCleanedNodesToContainerElement(templateNodes); // This also removes the nodes from their current parent
                new ko.templateSources.anonymousTemplate(element)['nodes'](container);
            }
            return { 'controlsDescendantBindings': true };
        },
        'update': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var value = valueAccessor(),
                options = ko.utils.unwrapObservable(value),
                shouldDisplay = true,
                templateComputed = null,
                templateName;

            if (typeof options == "string") {
                templateName = value;
                options = {};
            } else {
                templateName = options['name'];

                // Support "if"/"ifnot" conditions
                if ('if' in options)
                    shouldDisplay = ko.utils.unwrapObservable(options['if']);
                if (shouldDisplay && 'ifnot' in options)
                    shouldDisplay = !ko.utils.unwrapObservable(options['ifnot']);
            }

            if ('foreach' in options) {
                // Render once for each data point (treating data set as empty if shouldDisplay==false)
                var dataArray = (shouldDisplay && options['foreach']) || [];
                templateComputed = ko.renderTemplateForEach(templateName || element, dataArray, options, element, bindingContext);
            } else if (!shouldDisplay) {
                ko.virtualElements.emptyNode(element);
            } else {
                // Render once for this single data point (or use the viewModel if no data was provided)
                var innerBindingContext = ('data' in options) ?
                    bindingContext.createStaticChildContext(options['data'], options['as']) :  // Given an explitit 'data' value, we create a child binding context for it
                    bindingContext;                                                        // Given no explicit 'data' value, we retain the same binding context
                templateComputed = ko.renderTemplate(templateName || element, innerBindingContext, options, element);
            }

            // It only makes sense to have a single template computed per element (otherwise which one should have its output displayed?)
            disposeOldComputedAndStoreNewOne(element, templateComputed);
        }
    };

    // Anonymous templates can't be rewritten. Give a nice error message if you try to do it.
    ko.expressionRewriting.bindingRewriteValidators['template'] = function(bindingValue) {
        var parsedBindingValue = ko.expressionRewriting.parseObjectLiteral(bindingValue);

        if ((parsedBindingValue.length == 1) && parsedBindingValue[0]['unknown'])
            return null; // It looks like a string literal, not an object literal, so treat it as a named template (which is allowed for rewriting)

        if (ko.expressionRewriting.keyValueArrayContainsKey(parsedBindingValue, "name"))
            return null; // Named templates can be rewritten, so return "no error"
        return "This template engine does not support anonymous templates nested within its templates";
    };

    ko.virtualElements.allowedBindings['template'] = true;
})();

ko.exportSymbol('setTemplateEngine', ko.setTemplateEngine);
ko.exportSymbol('renderTemplate', ko.renderTemplate);
// Go through the items that have been added and deleted and try to find matches between them.
ko.utils.findMovesInArrayComparison = function (left, right, limitFailedCompares) {
    if (left.length && right.length) {
        var failedCompares, l, r, leftItem, rightItem;
        for (failedCompares = l = 0; (!limitFailedCompares || failedCompares < limitFailedCompares) && (leftItem = left[l]); ++l) {
            for (r = 0; rightItem = right[r]; ++r) {
                if (leftItem['value'] === rightItem['value']) {
                    leftItem['moved'] = rightItem['index'];
                    rightItem['moved'] = leftItem['index'];
                    right.splice(r, 1);         // This item is marked as moved; so remove it from right list
                    failedCompares = r = 0;     // Reset failed compares count because we're checking for consecutive failures
                    break;
                }
            }
            failedCompares += r;
        }
    }
};

ko.utils.compareArrays = (function () {
    var statusNotInOld = 'added', statusNotInNew = 'deleted';

    // Simple calculation based on Levenshtein distance.
    function compareArrays(oldArray, newArray, options) {
        // For backward compatibility, if the third arg is actually a bool, interpret
        // it as the old parameter 'dontLimitMoves'. Newer code should use { dontLimitMoves: true }.
        options = (typeof options === 'boolean') ? { 'dontLimitMoves': options } : (options || {});
        oldArray = oldArray || [];
        newArray = newArray || [];

        if (oldArray.length < newArray.length)
            return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, options);
        else
            return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, options);
    }

    function compareSmallArrayToBigArray(smlArray, bigArray, statusNotInSml, statusNotInBig, options) {
        var myMin = Math.min,
            myMax = Math.max,
            editDistanceMatrix = [],
            smlIndex, smlIndexMax = smlArray.length,
            bigIndex, bigIndexMax = bigArray.length,
            compareRange = (bigIndexMax - smlIndexMax) || 1,
            maxDistance = smlIndexMax + bigIndexMax + 1,
            thisRow, lastRow,
            bigIndexMaxForRow, bigIndexMinForRow;

        for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
            lastRow = thisRow;
            editDistanceMatrix.push(thisRow = []);
            bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange);
            bigIndexMinForRow = myMax(0, smlIndex - 1);
            for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
                if (!bigIndex)
                    thisRow[bigIndex] = smlIndex + 1;
                else if (!smlIndex)  // Top row - transform empty array into new array via additions
                    thisRow[bigIndex] = bigIndex + 1;
                else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1])
                    thisRow[bigIndex] = lastRow[bigIndex - 1];                  // copy value (no edit)
                else {
                    var northDistance = lastRow[bigIndex] || maxDistance;       // not in big (deletion)
                    var westDistance = thisRow[bigIndex - 1] || maxDistance;    // not in small (addition)
                    thisRow[bigIndex] = myMin(northDistance, westDistance) + 1;
                }
            }
        }

        var editScript = [], meMinusOne, notInSml = [], notInBig = [];
        for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex;) {
            meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
            if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex-1]) {
                notInSml.push(editScript[editScript.length] = {     // added
                    'status': statusNotInSml,
                    'value': bigArray[--bigIndex],
                    'index': bigIndex });
            } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
                notInBig.push(editScript[editScript.length] = {     // deleted
                    'status': statusNotInBig,
                    'value': smlArray[--smlIndex],
                    'index': smlIndex });
            } else {
                --bigIndex;
                --smlIndex;
                if (!options['sparse']) {
                    editScript.push({
                        'status': "retained",
                        'value': bigArray[bigIndex] });
                }
            }
        }

        // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
        // smlIndexMax keeps the time complexity of this algorithm linear.
        ko.utils.findMovesInArrayComparison(notInBig, notInSml, !options['dontLimitMoves'] && smlIndexMax * 10);

        return editScript.reverse();
    }

    return compareArrays;
})();

ko.exportSymbol('utils.compareArrays', ko.utils.compareArrays);
(function () {
    // Objective:
    // * Given an input array, a container DOM node, and a function from array elements to arrays of DOM nodes,
    //   map the array elements to arrays of DOM nodes, concatenate together all these arrays, and use them to populate the container DOM node
    // * Next time we're given the same combination of things (with the array possibly having mutated), update the container DOM node
    //   so that its children is again the concatenation of the mappings of the array elements, but don't re-map any array elements that we
    //   previously mapped - retain those nodes, and just insert/delete other ones

    // "callbackAfterAddingNodes" will be invoked after any "mapping"-generated nodes are inserted into the container node
    // You can use this, for example, to activate bindings on those nodes.

    function mapNodeAndRefreshWhenChanged(containerNode, mapping, valueToMap, callbackAfterAddingNodes, index) {
        // Map this array value inside a dependentObservable so we re-map when any dependency changes
        var mappedNodes = [];
        var dependentObservable = ko.dependentObservable(function() {
            var newMappedNodes = mapping(valueToMap, index, ko.utils.fixUpContinuousNodeArray(mappedNodes, containerNode)) || [];

            // On subsequent evaluations, just replace the previously-inserted DOM nodes
            if (mappedNodes.length > 0) {
                ko.utils.replaceDomNodes(mappedNodes, newMappedNodes);
                if (callbackAfterAddingNodes)
                    ko.dependencyDetection.ignore(callbackAfterAddingNodes, null, [valueToMap, newMappedNodes, index]);
            }

            // Replace the contents of the mappedNodes array, thereby updating the record
            // of which nodes would be deleted if valueToMap was itself later removed
            mappedNodes.length = 0;
            ko.utils.arrayPushAll(mappedNodes, newMappedNodes);
        }, null, { disposeWhenNodeIsRemoved: containerNode, disposeWhen: function() { return !ko.utils.anyDomNodeIsAttachedToDocument(mappedNodes); } });
        return { mappedNodes : mappedNodes, dependentObservable : (dependentObservable.isActive() ? dependentObservable : undefined) };
    }

    var lastMappingResultDomDataKey = ko.utils.domData.nextKey(),
        deletedItemDummyValue = ko.utils.domData.nextKey();

    ko.utils.setDomNodeChildrenFromArrayMapping = function (domNode, array, mapping, options, callbackAfterAddingNodes) {
        // Compare the provided array against the previous one
        array = array || [];
        options = options || {};
        var isFirstExecution = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) === undefined;
        var lastMappingResult = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) || [];
        var lastArray = ko.utils.arrayMap(lastMappingResult, function (x) { return x.arrayEntry; });
        var editScript = ko.utils.compareArrays(lastArray, array, options['dontLimitMoves']);

        // Build the new mapping result
        var newMappingResult = [];
        var lastMappingResultIndex = 0;
        var newMappingResultIndex = 0;

        var nodesToDelete = [];
        var itemsToProcess = [];
        var itemsForBeforeRemoveCallbacks = [];
        var itemsForMoveCallbacks = [];
        var itemsForAfterAddCallbacks = [];
        var mapData;

        function itemMovedOrRetained(editScriptIndex, oldPosition) {
            mapData = lastMappingResult[oldPosition];
            if (newMappingResultIndex !== oldPosition)
                itemsForMoveCallbacks[editScriptIndex] = mapData;
            // Since updating the index might change the nodes, do so before calling fixUpContinuousNodeArray
            mapData.indexObservable(newMappingResultIndex++);
            ko.utils.fixUpContinuousNodeArray(mapData.mappedNodes, domNode);
            newMappingResult.push(mapData);
            itemsToProcess.push(mapData);
        }

        function callCallback(callback, items) {
            if (callback) {
                for (var i = 0, n = items.length; i < n; i++) {
                    if (items[i]) {
                        ko.utils.arrayForEach(items[i].mappedNodes, function(node) {
                            callback(node, i, items[i].arrayEntry);
                        });
                    }
                }
            }
        }

        for (var i = 0, editScriptItem, movedIndex; editScriptItem = editScript[i]; i++) {
            movedIndex = editScriptItem['moved'];
            switch (editScriptItem['status']) {
                case "deleted":
                    if (movedIndex === undefined) {
                        mapData = lastMappingResult[lastMappingResultIndex];

                        // Stop tracking changes to the mapping for these nodes
                        if (mapData.dependentObservable) {
                            mapData.dependentObservable.dispose();
                            mapData.dependentObservable = undefined;
                        }

                        // Queue these nodes for later removal
                        if (ko.utils.fixUpContinuousNodeArray(mapData.mappedNodes, domNode).length) {
                            if (options['beforeRemove']) {
                                newMappingResult.push(mapData);
                                itemsToProcess.push(mapData);
                                if (mapData.arrayEntry === deletedItemDummyValue) {
                                    mapData = null;
                                } else {
                                    itemsForBeforeRemoveCallbacks[i] = mapData;
                                }
                            }
                            if (mapData) {
                                nodesToDelete.push.apply(nodesToDelete, mapData.mappedNodes);
                            }
                        }
                    }
                    lastMappingResultIndex++;
                    break;

                case "retained":
                    itemMovedOrRetained(i, lastMappingResultIndex++);
                    break;

                case "added":
                    if (movedIndex !== undefined) {
                        itemMovedOrRetained(i, movedIndex);
                    } else {
                        mapData = { arrayEntry: editScriptItem['value'], indexObservable: ko.observable(newMappingResultIndex++) };
                        newMappingResult.push(mapData);
                        itemsToProcess.push(mapData);
                        if (!isFirstExecution)
                            itemsForAfterAddCallbacks[i] = mapData;
                    }
                    break;
            }
        }

        // Store a copy of the array items we just considered so we can difference it next time
        ko.utils.domData.set(domNode, lastMappingResultDomDataKey, newMappingResult);

        // Call beforeMove first before any changes have been made to the DOM
        callCallback(options['beforeMove'], itemsForMoveCallbacks);

        // Next remove nodes for deleted items (or just clean if there's a beforeRemove callback)
        ko.utils.arrayForEach(nodesToDelete, options['beforeRemove'] ? ko.cleanNode : ko.removeNode);

        // Next add/reorder the remaining items (will include deleted items if there's a beforeRemove callback)
        for (var i = 0, nextNode = ko.virtualElements.firstChild(domNode), lastNode, node; mapData = itemsToProcess[i]; i++) {
            // Get nodes for newly added items
            if (!mapData.mappedNodes)
                ko.utils.extend(mapData, mapNodeAndRefreshWhenChanged(domNode, mapping, mapData.arrayEntry, callbackAfterAddingNodes, mapData.indexObservable));

            // Put nodes in the right place if they aren't there already
            for (var j = 0; node = mapData.mappedNodes[j]; nextNode = node.nextSibling, lastNode = node, j++) {
                if (node !== nextNode)
                    ko.virtualElements.insertAfter(domNode, node, lastNode);
            }

            // Run the callbacks for newly added nodes (for example, to apply bindings, etc.)
            if (!mapData.initialized && callbackAfterAddingNodes) {
                callbackAfterAddingNodes(mapData.arrayEntry, mapData.mappedNodes, mapData.indexObservable);
                mapData.initialized = true;
            }
        }

        // If there's a beforeRemove callback, call it after reordering.
        // Note that we assume that the beforeRemove callback will usually be used to remove the nodes using
        // some sort of animation, which is why we first reorder the nodes that will be removed. If the
        // callback instead removes the nodes right away, it would be more efficient to skip reordering them.
        // Perhaps we'll make that change in the future if this scenario becomes more common.
        callCallback(options['beforeRemove'], itemsForBeforeRemoveCallbacks);

        // Replace the stored values of deleted items with a dummy value. This provides two benefits: it marks this item
        // as already "removed" so we won't call beforeRemove for it again, and it ensures that the item won't match up
        // with an actual item in the array and appear as "retained" or "moved".
        for (i = 0; i < itemsForBeforeRemoveCallbacks.length; ++i) {
            if (itemsForBeforeRemoveCallbacks[i]) {
                itemsForBeforeRemoveCallbacks[i].arrayEntry = deletedItemDummyValue;
            }
        }

        // Finally call afterMove and afterAdd callbacks
        callCallback(options['afterMove'], itemsForMoveCallbacks);
        callCallback(options['afterAdd'], itemsForAfterAddCallbacks);
    }
})();

ko.exportSymbol('utils.setDomNodeChildrenFromArrayMapping', ko.utils.setDomNodeChildrenFromArrayMapping);
ko.nativeTemplateEngine = function () {
    this['allowTemplateRewriting'] = false;
}

ko.nativeTemplateEngine.prototype = new ko.templateEngine();
ko.nativeTemplateEngine.prototype.constructor = ko.nativeTemplateEngine;
ko.nativeTemplateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options, templateDocument) {
    var useNodesIfAvailable = !(ko.utils.ieVersion < 9), // IE<9 cloneNode doesn't work properly
        templateNodesFunc = useNodesIfAvailable ? templateSource['nodes'] : null,
        templateNodes = templateNodesFunc ? templateSource['nodes']() : null;

    if (templateNodes) {
        return ko.utils.makeArray(templateNodes.cloneNode(true).childNodes);
    } else {
        var templateText = templateSource['text']();
        return ko.utils.parseHtmlFragment(templateText, templateDocument);
    }
};

ko.nativeTemplateEngine.instance = new ko.nativeTemplateEngine();
ko.setTemplateEngine(ko.nativeTemplateEngine.instance);

ko.exportSymbol('nativeTemplateEngine', ko.nativeTemplateEngine);
(function() {
    ko.jqueryTmplTemplateEngine = function () {
        // Detect which version of jquery-tmpl you're using. Unfortunately jquery-tmpl
        // doesn't expose a version number, so we have to infer it.
        // Note that as of Knockout 1.3, we only support jQuery.tmpl 1.0.0pre and later,
        // which KO internally refers to as version "2", so older versions are no longer detected.
        var jQueryTmplVersion = this.jQueryTmplVersion = (function() {
            if (!jQueryInstance || !(jQueryInstance['tmpl']))
                return 0;
            // Since it exposes no official version number, we use our own numbering system. To be updated as jquery-tmpl evolves.
            try {
                if (jQueryInstance['tmpl']['tag']['tmpl']['open'].toString().indexOf('__') >= 0) {
                    // Since 1.0.0pre, custom tags should append markup to an array called "__"
                    return 2; // Final version of jquery.tmpl
                }
            } catch(ex) { /* Apparently not the version we were looking for */ }

            return 1; // Any older version that we don't support
        })();

        function ensureHasReferencedJQueryTemplates() {
            if (jQueryTmplVersion < 2)
                throw new Error("Your version of jQuery.tmpl is too old. Please upgrade to jQuery.tmpl 1.0.0pre or later.");
        }

        function executeTemplate(compiledTemplate, data, jQueryTemplateOptions) {
            return jQueryInstance['tmpl'](compiledTemplate, data, jQueryTemplateOptions);
        }

        this['renderTemplateSource'] = function(templateSource, bindingContext, options, templateDocument) {
            templateDocument = templateDocument || document;
            options = options || {};
            ensureHasReferencedJQueryTemplates();

            // Ensure we have stored a precompiled version of this template (don't want to reparse on every render)
            var precompiled = templateSource['data']('precompiled');
            if (!precompiled) {
                var templateText = templateSource['text']() || "";
                // Wrap in "with($whatever.koBindingContext) { ... }"
                templateText = "{{ko_with $item.koBindingContext}}" + templateText + "{{/ko_with}}";

                precompiled = jQueryInstance['template'](null, templateText);
                templateSource['data']('precompiled', precompiled);
            }

            var data = [bindingContext['$data']]; // Prewrap the data in an array to stop jquery.tmpl from trying to unwrap any arrays
            var jQueryTemplateOptions = jQueryInstance['extend']({ 'koBindingContext': bindingContext }, options['templateOptions']);

            var resultNodes = executeTemplate(precompiled, data, jQueryTemplateOptions);
            resultNodes['appendTo'](templateDocument.createElement("div")); // Using "appendTo" forces jQuery/jQuery.tmpl to perform necessary cleanup work

            jQueryInstance['fragments'] = {}; // Clear jQuery's fragment cache to avoid a memory leak after a large number of template renders
            return resultNodes;
        };

        this['createJavaScriptEvaluatorBlock'] = function(script) {
            return "{{ko_code ((function() { return " + script + " })()) }}";
        };

        this['addTemplate'] = function(templateName, templateMarkup) {
            document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
        };

        if (jQueryTmplVersion > 0) {
            jQueryInstance['tmpl']['tag']['ko_code'] = {
                open: "__.push($1 || '');"
            };
            jQueryInstance['tmpl']['tag']['ko_with'] = {
                open: "with($1) {",
                close: "} "
            };
        }
    };

    ko.jqueryTmplTemplateEngine.prototype = new ko.templateEngine();
    ko.jqueryTmplTemplateEngine.prototype.constructor = ko.jqueryTmplTemplateEngine;

    // Use this one by default *only if jquery.tmpl is referenced*
    var jqueryTmplTemplateEngineInstance = new ko.jqueryTmplTemplateEngine();
    if (jqueryTmplTemplateEngineInstance.jQueryTmplVersion > 0)
        ko.setTemplateEngine(jqueryTmplTemplateEngineInstance);

    ko.exportSymbol('jqueryTmplTemplateEngine', ko.jqueryTmplTemplateEngine);
})();
}));
}());
})();

},{}],2:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var supportTouchEvents = ("ontouchstart" in window);

_knockout2["default"].bindingHandlers.menuButton = {
    init: function init(element, valueAccessor) {
        if (_knockout2["default"].unwrap(valueAccessor())) {
            if (supportTouchEvents) {
                element.addEventListener("touchstart", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover active", true);
                });
                element.addEventListener("touchend", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover active", false);
                });
            } else {
                element.addEventListener("mouseover", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover", true);
                });
                element.addEventListener("mousedown", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "active", true);
                });
                element.addEventListener("mouseup", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "active", false);
                });
                element.addEventListener("mouseout", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover", false);
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "active", false);
                    window.getSelection().removeAllRanges(); // prevent unwanted text selection
                });
            }
        }
    }
};

},{"knockout":1}],3:[function(require,module,exports){
/*
 * Copyright 2018 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var supportTouchEvents = ("ontouchstart" in window);

var xStart = null;
var yStart = null;
var arrowButton = null;

_knockout2["default"].bindingHandlers.swipePages = {
    init: function init(element, valueAccessor) {
        if (supportTouchEvents && _knockout2["default"].unwrap(valueAccessor())) {
            element.addEventListener("touchstart", function (event) {
                if (event.touches.length > 1) {
                    return; // multi-touch is not for page swipe
                }
                if (window.visualViewport && window.visualViewport.scale > 1) {
                    return; // disable page swipe when pinch-zoomed
                }
                var viewportElement = document.getElementById("vivliostyle-viewer-viewport");
                if (viewportElement && viewportElement.scrollWidth > viewportElement.clientWidth) {
                    return; // disable page swipe when horizontal scrollable
                }
                xStart = event.touches[0].clientX;
                yStart = event.touches[0].clientY;
            });
            element.addEventListener("touchmove", function (event) {
                if (event.touches.length > 1) {
                    return;
                }
                if (xStart !== null && yStart !== null) {
                    var xDiff = event.touches[0].clientX - xStart;
                    var yDiff = event.touches[0].clientY - yStart;
                    if (Math.abs(xDiff) > Math.abs(yDiff)) {
                        if (xDiff < 0) {
                            // swipe to left = go to right
                            arrowButton = document.getElementById("vivliostyle-page-navigation-right");
                        } else {
                            // swipe to right = go to left
                            arrowButton = document.getElementById("vivliostyle-page-navigation-left");
                        }
                    }
                    if (Math.abs(xDiff) + Math.abs(yDiff) >= 16) {
                        if (arrowButton) {
                            arrowButton.click();
                            _knockout2["default"].utils.toggleDomNodeCssClass(arrowButton, "active", true);
                        }
                        xStart = null;
                        yStart = null;
                    }
                }
            });
            element.addEventListener("touchend", function (event) {
                if (arrowButton) {
                    _knockout2["default"].utils.toggleDomNodeCssClass(arrowButton, "active", false);
                }
                arrowButton = null;
                xStart = null;
                yStart = null;
            });
        }
    }
};

},{"knockout":1}],4:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _modelsMessageQueue = require("../models/message-queue");

var _modelsMessageQueue2 = _interopRequireDefault(_modelsMessageQueue);

var LogLevel = {
    DEBUG: "debug",
    INFO: "info",
    WARN: "warn",
    ERROR: "error"
};

var Logger = (function () {
    function Logger() {
        _classCallCheck(this, Logger);

        this.logLevel = LogLevel.ERROR;
    }

    _createClass(Logger, [{
        key: "setLogLevel",
        value: function setLogLevel(logLevel) {
            this.logLevel = logLevel;
        }
    }, {
        key: "debug",
        value: function debug(content) {
            if (this.logLevel === LogLevel.DEBUG) {
                _modelsMessageQueue2["default"].push({
                    type: "debug",
                    content: content
                });
            }
        }
    }, {
        key: "info",
        value: function info(content) {
            if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO) {
                _modelsMessageQueue2["default"].push({
                    type: "info",
                    content: content
                });
            }
        }
    }, {
        key: "warn",
        value: function warn(content) {
            if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.WARN) {
                _modelsMessageQueue2["default"].push({
                    type: "warn",
                    content: content
                });
            }
        }
    }, {
        key: "error",
        value: function error(content) {
            if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.WARN || this.logLevel === LogLevel.ERROR) {
                _modelsMessageQueue2["default"].push({
                    type: "error",
                    content: content
                });
            }
        }
    }]);

    return Logger;
})();

Logger.LogLevel = LogLevel;

var instance = new Logger();

Logger.getLogger = function () {
    return instance;
};

exports["default"] = Logger;
module.exports = exports["default"];

},{"../models/message-queue":7}],5:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _vivliostyle = require("vivliostyle");

var _vivliostyle2 = _interopRequireDefault(_vivliostyle);

var _modelsVivliostyle = require("./models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var _vivliostyleViewer = require("./vivliostyle-viewer");

var _vivliostyleViewer2 = _interopRequireDefault(_vivliostyleViewer);

_modelsVivliostyle2["default"].setInstance(_vivliostyle2["default"]);
_vivliostyleViewer2["default"].start();

},{"./models/vivliostyle":11,"./vivliostyle-viewer":22,"vivliostyle":23}],6:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _storesUrlParameters = require("../stores/url-parameters");

var _storesUrlParameters2 = _interopRequireDefault(_storesUrlParameters);

var _pageSize = require("./page-size");

var _pageSize2 = _interopRequireDefault(_pageSize);

function getDocumentOptionsFromURL() {
    var epubUrl = _storesUrlParameters2["default"].getParameter("b");
    var url = _storesUrlParameters2["default"].getParameter("x");
    var fragment = _storesUrlParameters2["default"].getParameter("f", true);
    var style = _storesUrlParameters2["default"].getParameter("style");
    var userStyle = _storesUrlParameters2["default"].getParameter("userStyle");
    return {
        epubUrl: epubUrl[0] || null, // epubUrl and url are exclusive
        url: !epubUrl[0] && url.length ? url : null,
        fragment: fragment[0] || null,
        authorStyleSheet: style.length ? style : [],
        userStyleSheet: userStyle.length ? userStyle : []
    };
}

var DocumentOptions = (function () {
    function DocumentOptions() {
        _classCallCheck(this, DocumentOptions);

        var urlOptions = getDocumentOptionsFromURL();
        this.epubUrl = _knockout2["default"].observable(urlOptions.epubUrl || "");
        this.url = _knockout2["default"].observable(urlOptions.url || null);
        this.fragment = _knockout2["default"].observable(urlOptions.fragment || "");
        this.authorStyleSheet = _knockout2["default"].observable(urlOptions.authorStyleSheet);
        this.userStyleSheet = _knockout2["default"].observable(urlOptions.userStyleSheet);
        this.pageSize = new _pageSize2["default"]();

        // write fragment back to URL when updated
        this.fragment.subscribe(function (fragment) {
            if ((urlOptions.epubUrl ? /^epubcfi\(\/[246]\/2!\)/ : /^epubcfi\(\/2!\)/).test(fragment)) {
                _storesUrlParameters2["default"].removeParameter("f");
            } else {
                var encoded = fragment.replace(/[\s+&?=#\u007F-\uFFFF]+/g, encodeURIComponent);
                _storesUrlParameters2["default"].setParameter("f", encoded, true);
            }
        });
    }

    _createClass(DocumentOptions, [{
        key: "toObject",
        value: function toObject() {
            function convertStyleSheetArray(arr) {
                return arr.map(function (url) {
                    return {
                        url: url
                    };
                });
            }
            var uss = convertStyleSheetArray(this.userStyleSheet());
            // Do not include url
            // (url is a required argument to Viewer.loadDocument, separated from other options)
            return {
                fragment: this.fragment(),
                authorStyleSheet: convertStyleSheetArray(this.authorStyleSheet()),
                userStyleSheet: [{
                    text: "@page {" + this.pageSize.toCSSDeclarationString() + "}"
                }].concat(uss)
            };
        }
    }]);

    return DocumentOptions;
})();

exports["default"] = DocumentOptions;
module.exports = exports["default"];

},{"../stores/url-parameters":13,"./page-size":8,"knockout":1}],7:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

function MessageQueue() {
  return _knockout2["default"].observableArray();
}

exports["default"] = new MessageQueue();
module.exports = exports["default"];

},{"knockout":1}],8:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var Mode = {
    AUTO: "auto",
    PRESET: "preset",
    CUSTOM: "custom"
};

var PresetSize = [{ name: "A5", description: "A5" }, { name: "A4", description: "A4" }, { name: "A3", description: "A3" }, { name: "B5", description: "B5 (ISO)" }, { name: "B4", description: "B4 (ISO)" }, { name: "JIS-B5", description: "B5 (JIS)" }, { name: "JIS-B4", description: "B4 (JIS)" }, { name: "letter", description: "letter" }, { name: "legal", description: "legal" }, { name: "ledger", description: "ledger" }];

var PageSize = (function () {
    function PageSize(pageSize) {
        _classCallCheck(this, PageSize);

        this.mode = _knockout2["default"].observable(Mode.AUTO);
        this.presetSize = _knockout2["default"].observable(PresetSize[0]);
        this.isLandscape = _knockout2["default"].observable(false);
        this.customWidth = _knockout2["default"].observable("210mm");
        this.customHeight = _knockout2["default"].observable("297mm");
        this.isImportant = _knockout2["default"].observable(false);

        var setDisabledElements = function setDisabledElements(mode) {
            var presetSelectElem = document.getElementsByName("vivliostyle-misc_paginate_page-size_preset-select")[0];
            if (!presetSelectElem) {
                return;
            }
            var presetLandscapeElem = document.getElementsByName("vivliostyle-misc_paginate_page-size_preset-landscape")[0];
            var customWidthElem = document.getElementsByName("vivliostyle-misc_paginate_page-size_custom-width")[0];
            var customHeightElem = document.getElementsByName("vivliostyle-misc_paginate_page-size_custom-height")[0];

            switch (mode) {
                case Mode.AUTO:
                    presetSelectElem.disabled = true;
                    presetLandscapeElem.disabled = true;
                    customWidthElem.disabled = true;
                    customHeightElem.disabled = true;
                    break;
                case Mode.PRESET:
                    presetSelectElem.disabled = false;
                    presetLandscapeElem.disabled = false;
                    customWidthElem.disabled = true;
                    customHeightElem.disabled = true;
                    break;
                case Mode.CUSTOM:
                    presetSelectElem.disabled = true;
                    presetLandscapeElem.disabled = true;
                    customWidthElem.disabled = false;
                    customHeightElem.disabled = false;
                    break;
            }
        };

        if (pageSize) {
            this.copyFrom(pageSize);
        }

        setDisabledElements(this.mode());

        this.mode.subscribe(function (mode) {
            setDisabledElements(mode);
        });
    }

    _createClass(PageSize, [{
        key: "copyFrom",
        value: function copyFrom(other) {
            this.mode(other.mode());
            this.presetSize(other.presetSize());
            this.isLandscape(other.isLandscape());
            this.customWidth(other.customWidth());
            this.customHeight(other.customHeight());
            this.isImportant(other.isImportant());
        }
    }, {
        key: "equivalentTo",
        value: function equivalentTo(other) {
            if (this.isImportant() !== other.isImportant()) {
                return false;
            }
            var mode = this.mode();
            if (other.mode() === mode) {
                switch (mode) {
                    case Mode.AUTO:
                        return true;
                    case Mode.PRESET:
                        return this.presetSize() === other.presetSize() && this.isLandscape() === other.isLandscape();
                    case Mode.CUSTOM:
                        return this.customWidth() === other.customWidth() && this.customHeight() === other.customHeight();
                    default:
                        throw new Error("Unknown mode " + mode);
                }
            } else {
                return false;
            }
        }
    }, {
        key: "toCSSDeclarationString",
        value: function toCSSDeclarationString() {
            var declaration = "size: ";
            switch (this.mode()) {
                case Mode.AUTO:
                    declaration += "auto";
                    break;
                case Mode.PRESET:
                    declaration += this.presetSize().name;
                    if (this.isLandscape()) {
                        declaration += " landscape";
                    }
                    break;
                case Mode.CUSTOM:
                    declaration += this.customWidth() + " " + this.customHeight();
                    break;
                default:
                    throw new Error("Unknown mode " + this.mode());
            }

            if (this.isImportant()) {
                declaration += " !important";
            }

            return declaration + ";";
        }
    }]);

    return PageSize;
})();

PageSize.Mode = Mode;
PageSize.PresetSize = PageSize.prototype.PresetSize = PresetSize;

exports["default"] = PageSize;
module.exports = exports["default"];

},{"knockout":1}],9:[function(require,module,exports){
/*
 * Copyright 2016 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var PageViewModeInstance = (function () {
    function PageViewModeInstance() {
        _classCallCheck(this, PageViewModeInstance);
    }

    _createClass(PageViewModeInstance, [{
        key: "toSpreadViewString",
        value: function toSpreadViewString() {
            switch (this) {
                case PageViewMode.SPREAD:
                    return "true";
                case PageViewMode.SINGLE_PAGE:
                    return "false";
                case PageViewMode.AUTO_SPREAD:
                    return "auto";
                default:
                    throw new Error("Invalid PageViewMode");
            }
        }
    }, {
        key: "toString",
        value: function toString() {
            switch (this) {
                case PageViewMode.SPREAD:
                    return "spread"; // vivliostyle.viewer.PageViewMode.SPREAD;
                case PageViewMode.SINGLE_PAGE:
                    return "singlePage"; // vivliostyle.viewer.PageViewMode.SINGLE_PAGE;
                case PageViewMode.AUTO_SPREAD:
                    return "autoSpread"; // vivliostyle.viewer.PageViewMode.AUTO_SPREAD;
                default:
                    throw new Error("Invalid PageViewMode");
            }
        }
    }]);

    return PageViewModeInstance;
})();

var PageViewMode = {
    AUTO_SPREAD: new PageViewModeInstance(),
    SINGLE_PAGE: new PageViewModeInstance(),
    SPREAD: new PageViewModeInstance(),
    defaultMode: function defaultMode() {
        return this.AUTO_SPREAD;
    },
    fromSpreadViewString: function fromSpreadViewString(str) {
        switch (str) {
            case "true":
                return this.SPREAD;
            case "false":
                return this.SINGLE_PAGE;
            case "auto":
            default:
                return this.AUTO_SPREAD;
        }
    },
    of: function of(name) {
        switch (name) {
            case _modelsVivliostyle2["default"].viewer.PageViewMode.SPREAD:
                return this.SPREAD;
            case _modelsVivliostyle2["default"].viewer.PageViewMode.SINGLE_PAGE:
                return this.SINGLE_PAGE;
            case _modelsVivliostyle2["default"].viewer.PageViewMode.AUTO_SPREAD:
                return this.AUTO_SPREAD;
            default:
                throw new Error("Invalid PageViewMode name: " + name);
        }
    }
};

exports["default"] = PageViewMode;
module.exports = exports["default"];

},{"../models/vivliostyle":11}],10:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _storesUrlParameters = require("../stores/url-parameters");

var _storesUrlParameters2 = _interopRequireDefault(_storesUrlParameters);

var _pageViewMode = require("./page-view-mode");

var _pageViewMode2 = _interopRequireDefault(_pageViewMode);

var _zoomOptions = require("./zoom-options");

var _zoomOptions2 = _interopRequireDefault(_zoomOptions);

function getViewerOptionsFromURL() {
    var renderAllPages = _storesUrlParameters2["default"].getParameter("renderAllPages")[0];
    return {
        renderAllPages: renderAllPages === "true" ? true : renderAllPages === "false" ? false : null,
        profile: _storesUrlParameters2["default"].getParameter("profile")[0] === "true",
        pageViewMode: _pageViewMode2["default"].fromSpreadViewString(_storesUrlParameters2["default"].getParameter("spread")[0])
    };
}

function getDefaultValues() {
    var isNotEpub = !_storesUrlParameters2["default"].getParameter("b").length;
    return {
        renderAllPages: isNotEpub,
        fontSize: 16,
        profile: false,
        pageViewMode: _pageViewMode2["default"].defaultMode(),
        zoom: _zoomOptions2["default"].createDefaultOptions()
    };
}

var ViewerOptions = (function () {
    function ViewerOptions(options) {
        var _this = this;

        _classCallCheck(this, ViewerOptions);

        this.renderAllPages = _knockout2["default"].observable();
        this.fontSize = _knockout2["default"].observable();
        this.profile = _knockout2["default"].observable();
        this.pageViewMode = _knockout2["default"].observable();
        this.zoom = _knockout2["default"].observable();
        if (options) {
            this.copyFrom(options);
        } else {
            (function () {
                var defaultValues = getDefaultValues();
                var urlOptions = getViewerOptionsFromURL();
                _this.renderAllPages(urlOptions.renderAllPages !== null ? urlOptions.renderAllPages : defaultValues.renderAllPages);
                _this.fontSize(defaultValues.fontSize);
                _this.profile(urlOptions.profile || defaultValues.profile);
                _this.pageViewMode(urlOptions.pageViewMode || defaultValues.pageViewMode);
                _this.zoom(defaultValues.zoom);

                // write spread parameter back to URL when updated
                _this.pageViewMode.subscribe(function (pageViewMode) {
                    if (pageViewMode === defaultValues.pageViewMode) {
                        _storesUrlParameters2["default"].removeParameter("spread");
                    } else {
                        _storesUrlParameters2["default"].setParameter("spread", pageViewMode.toSpreadViewString());
                    }
                });
                _this.renderAllPages.subscribe(function (renderAllPages) {
                    if (renderAllPages === defaultValues.renderAllPages) {
                        _storesUrlParameters2["default"].removeParameter("renderAllPages");
                    } else {
                        _storesUrlParameters2["default"].setParameter("renderAllPages", renderAllPages.toString());
                    }
                });
            })();
        }
    }

    _createClass(ViewerOptions, [{
        key: "copyFrom",
        value: function copyFrom(other) {
            this.renderAllPages(other.renderAllPages());
            this.fontSize(other.fontSize());
            this.profile(other.profile());
            this.pageViewMode(other.pageViewMode());
            this.zoom(other.zoom());
        }
    }, {
        key: "toObject",
        value: function toObject() {
            return {
                renderAllPages: this.renderAllPages(),
                fontSize: this.fontSize(),
                pageViewMode: this.pageViewMode().toString(),
                zoom: this.zoom().zoom,
                fitToScreen: this.zoom().fitToScreen
            };
        }
    }]);

    return ViewerOptions;
})();

ViewerOptions.getDefaultValues = getDefaultValues;

exports["default"] = ViewerOptions;
module.exports = exports["default"];

},{"../stores/url-parameters":13,"./page-view-mode":9,"./zoom-options":12,"knockout":1}],11:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Vivliostyle = (function () {
    function Vivliostyle() {
        _classCallCheck(this, Vivliostyle);

        this.viewer = null;
        this.constants = null;
        this.profile = null;
    }

    _createClass(Vivliostyle, [{
        key: "setInstance",
        value: function setInstance(vivliostyle) {
            this.viewer = vivliostyle.viewer;
            this.constants = vivliostyle.constants;
            this.profile = vivliostyle.profile;
        }
    }]);

    return Vivliostyle;
})();

exports["default"] = new Vivliostyle();
module.exports = exports["default"];

},{}],12:[function(require,module,exports){
/*
 * Copyright 2016 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var ZoomOptions = (function () {
    function ZoomOptions(zoom) {
        _classCallCheck(this, ZoomOptions);

        this.zoom = zoom;
    }

    _createClass(ZoomOptions, [{
        key: "zoomIn",
        value: function zoomIn(viewer) {
            return new FixedZoomFactor(this.getCurrentZoomFactor(viewer) * 1.25);
        }
    }, {
        key: "zoomOut",
        value: function zoomOut(viewer) {
            return new FixedZoomFactor(this.getCurrentZoomFactor(viewer) * 0.8);
        }
    }, {
        key: "zoomToActualSize",
        value: function zoomToActualSize() {
            return new FixedZoomFactor(1);
        }
    }], [{
        key: "createDefaultOptions",
        value: function createDefaultOptions() {
            return new FitToScreen();
        }
    }, {
        key: "createFromZoomFactor",
        value: function createFromZoomFactor(zoom) {
            return new FixedZoomFactor(zoom);
        }
    }]);

    return ZoomOptions;
})();

var FitToScreen = (function (_ZoomOptions) {
    _inherits(FitToScreen, _ZoomOptions);

    function FitToScreen() {
        _classCallCheck(this, FitToScreen);

        _get(Object.getPrototypeOf(FitToScreen.prototype), "constructor", this).call(this, 1);
    }

    _createClass(FitToScreen, [{
        key: "toggleFitToScreen",
        value: function toggleFitToScreen() {
            return new FixedZoomFactor(1);
        }
    }, {
        key: "getCurrentZoomFactor",
        value: function getCurrentZoomFactor(viewer) {
            return viewer.queryZoomFactor(_modelsVivliostyle2["default"].viewer.ZoomType.FIT_INSIDE_VIEWPORT);
        }
    }, {
        key: "fitToScreen",
        get: function get() {
            return true;
        }
    }]);

    return FitToScreen;
})(ZoomOptions);

var FixedZoomFactor = (function (_ZoomOptions2) {
    _inherits(FixedZoomFactor, _ZoomOptions2);

    function FixedZoomFactor() {
        _classCallCheck(this, FixedZoomFactor);

        _get(Object.getPrototypeOf(FixedZoomFactor.prototype), "constructor", this).apply(this, arguments);
    }

    _createClass(FixedZoomFactor, [{
        key: "toggleFitToScreen",
        value: function toggleFitToScreen() {
            return new FitToScreen();
        }
    }, {
        key: "getCurrentZoomFactor",
        value: function getCurrentZoomFactor(viewer) {
            return this.zoom;
        }
    }, {
        key: "fitToScreen",
        get: function get() {
            return false;
        }
    }]);

    return FixedZoomFactor;
})(ZoomOptions);

exports["default"] = ZoomOptions;
module.exports = exports["default"];

},{"../models/vivliostyle":11}],13:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _utilsStringUtil = require("../utils/string-util");

var _utilsStringUtil2 = _interopRequireDefault(_utilsStringUtil);

function getRegExpForParameter(name) {
    return new RegExp("[#&]" + _utilsStringUtil2["default"].escapeUnicodeString(name) + "=([^&]*)", "g");
}

var URLParameterStore = (function () {
    function URLParameterStore() {
        _classCallCheck(this, URLParameterStore);

        this.history = window ? window.history : {};
        this.location = window ? window.location : { href: "" };
        this.storedUrl = this.location.href;
    }

    _createClass(URLParameterStore, [{
        key: "getBaseURL",
        value: function getBaseURL() {
            var url = this.location.href;
            url = url.replace(/#.*$/, "");
            return url.replace(/\/[^/]*$/, "/");
        }
    }, {
        key: "getParameter",
        value: function getParameter(name, dontPercentDecode) {
            var url = this.location.href;
            var regexp = getRegExpForParameter(name);
            var results = [];
            var r = undefined;
            while (r = regexp.exec(url)) {
                var value = r[1];
                if (!dontPercentDecode) value = _utilsStringUtil2["default"].percentDecodeAmpersandAndPercent(value);
                results.push(value);
            }
            return results;
        }
    }, {
        key: "setParameter",
        value: function setParameter(name, value, dontPercentEncode) {
            var url = this.location.href;
            if (!dontPercentEncode) value = _utilsStringUtil2["default"].percentEncodeAmpersandAndPercent(value);
            var updated = undefined;
            var regexp = getRegExpForParameter(name);
            var r = regexp.exec(url);
            if (r) {
                var l = r[1].length;
                var start = r.index + r[0].length - l;
                updated = url.substring(0, start) + value + url.substring(start + l);
            } else {
                updated = url + (url.match(/#/) ? "&" : "#") + name + "=" + value;
            }
            if (this.history.replaceState) {
                this.history.replaceState(null, "", updated);
            } else {
                this.location.href = updated;
            }
            this.storedUrl = updated;
        }
    }, {
        key: "removeParameter",
        value: function removeParameter(name) {
            var url = this.location.href;
            var updated = undefined;
            var regexp = getRegExpForParameter(name);
            var r = regexp.exec(url);
            if (r) {
                var end = r.index + r[0].length;
                if (r[0].charAt(0) == '#') {
                    updated = url.substring(0, r.index + 1) + url.substring(end + 1);
                } else {
                    updated = url.substring(0, r.index) + url.substring(end);
                }
                if (this.history.replaceState) {
                    this.history.replaceState(null, "", updated);
                } else {
                    this.location.href = updated;
                }
            }
            this.storedUrl = updated;
        }
    }]);

    return URLParameterStore;
})();

exports["default"] = new URLParameterStore();
module.exports = exports["default"];

},{"../utils/string-util":16}],14:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

// cf. http://www.w3.org/TR/DOM-Level-3-Events-key/
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var Keys = {
    Unidentified: "Unidentified",
    ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft",
    ArrowRight: "ArrowRight",
    ArrowUp: "ArrowUp",
    Home: "Home",
    End: "End",
    PageDown: "PageDown",
    PageUp: "PageUp",
    Escape: "Escape",
    Enter: "Enter",
    Space: " "
};

// CAUTION: This function covers only part of common keys on a keyboard. Keys not covered by the implementation are identified as KeyboardEvent.key, KeyboardEvent.keyIdentifier, or "Unidentified".
function identifyKeyFromEvent(event) {
    var key = event.key;
    var keyIdentifier = event.keyIdentifier;
    var location = event.location;
    if (key === Keys.ArrowDown || key === "Down" || keyIdentifier === "Down") {
        if (event.metaKey) {
            // Mac Cmd+Down -> End
            return Keys.End;
        }
        return Keys.ArrowDown;
    } else if (key === Keys.ArrowLeft || key === "Left" || keyIdentifier === "Left") {
        return Keys.ArrowLeft;
    } else if (key === Keys.ArrowRight || key === "Right" || keyIdentifier === "Right") {
        return Keys.ArrowRight;
    } else if (key === Keys.ArrowUp || key === "Up" || keyIdentifier === "Up") {
        if (event.metaKey) {
            // Mac Cmd+Up -> Home
            return Keys.Home;
        }
        return Keys.ArrowUp;
    } else if (key === Keys.Escape || key === "Esc" || keyIdentifier === "U+001B") {
        return Keys.Escape;
    } else if (key === Keys.Enter || keyIdentifier === "Enter") {
        return Keys.Enter;
    } else if (key === Keys.Space || keyIdentifier === "U+0020") {
        return Keys.Space;
    } else if (key === "0" || keyIdentifier === "U+0030") {
        return "0";
    } else if (key === "+" || key === "Add" || keyIdentifier === "U+002B" || keyIdentifier === "U+00BB" || keyIdentifier === "U+004B" && location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD /* workaround for Chrome for Windows */) {
            return "+";
        } else if (key === "-" || key === "Subtract" || keyIdentifier === "U+002D" || keyIdentifier === "U+00BD" || keyIdentifier === "U+004D" && location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD /* workaround for Chrome for Windows */) {
            return "-";
        } else {
        return key || keyIdentifier || Keys.Unidentified;
    }
}

exports["default"] = {
    Keys: Keys,
    identifyKeyFromEvent: identifyKeyFromEvent
};
module.exports = exports["default"];

},{}],15:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var util = {
    readonlyObservable: function readonlyObservable(value) {
        var obs = _knockout2["default"].observable(value);
        return {
            getter: _knockout2["default"].pureComputed(function () {
                return obs();
            }),
            value: obs
        };
    }
};

exports["default"] = util;
module.exports = exports["default"];

},{"knockout":1}],16:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports["default"] = {
    escapeUnicodeChar: function escapeUnicodeChar(ch) {
        return "\\u" + (0x10000 | ch.charCodeAt(0)).toString(16).substring(1);
    },
    escapeUnicodeString: function escapeUnicodeString(str) {
        return str.replace(/[^-a-zA-Z0-9_]/g, this.escapeUnicodeChar);
    },
    percentEncodeAmpersandAndPercent: function percentEncodeAmpersandAndPercent(str) {
        return str.replace(/%/g, "%25").replace(/&/g, "%26");
    },
    percentDecodeAmpersandAndPercent: function percentDecodeAmpersandAndPercent(str) {
        return str.replace(/%26/g, "&").replace(/%25/g, "%");
    }
};
module.exports = exports["default"];

},{}],17:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var MessageDialog = (function () {
    function MessageDialog(queue) {
        _classCallCheck(this, MessageDialog);

        this.list = queue;
        this.visible = _knockout2["default"].pureComputed(function () {
            return queue().length > 0;
        });
    }

    _createClass(MessageDialog, [{
        key: "getDisplayMessage",
        value: function getDisplayMessage(errorInfo) {
            var e = errorInfo.error;
            var msg = e && (e.toString() || e.frameTrace || e.stack);
            if (msg) {
                msg = msg.split("\n", 1)[0];
            }
            if (!msg) {
                msg = errorInfo.messages.join("\n");
            }
            return msg;
        }
    }]);

    return MessageDialog;
})();

exports["default"] = MessageDialog;
module.exports = exports["default"];

},{"knockout":1}],18:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2018 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _modelsViewerOptions = require("../models/viewer-options");

var _modelsViewerOptions2 = _interopRequireDefault(_modelsViewerOptions);

var _utilsKeyUtil = require("../utils/key-util");

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var Navigation = (function () {
    function Navigation(viewerOptions, viewer, settingsPanel, navigationOptions) {
        var _this = this;

        _classCallCheck(this, Navigation);

        this.viewerOptions_ = viewerOptions;
        this.viewer_ = viewer;
        this.settingsPanel_ = settingsPanel;
        this.justClicked = false; // double click check

        this.isDisabled = _knockout2["default"].pureComputed(function () {
            return _this.settingsPanel_.opened() && !_this.settingsPanel_.pinned() || !_this.viewer_.state.navigatable();
        });

        var navigationDisabled = _knockout2["default"].pureComputed(function () {
            return navigationOptions.disablePageNavigation || _this.isDisabled();
        });

        navigationDisabled.subscribe(function (disabled) {
            var pageNumberElem = document.getElementById("vivliostyle-page-number");
            if (pageNumberElem) {
                pageNumberElem.disabled = disabled;
            }
        });

        this.isPageNumberDisabled = _knockout2["default"].pureComputed(function () {
            return navigationDisabled();
        });

        this.isNavigateToPreviousDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.status === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            return _this.viewer_.firstPage();
        });

        this.isNavigateToNextDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.status === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (_this.viewerOptions_.renderAllPages() && _this.viewer_.state.status() != _modelsVivliostyle2["default"].constants.ReadyState.COMPLETE) {
                return false;
            }
            return _this.viewer_.lastPage();
        });

        this.isNavigateToLeftDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.pageProgression === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (_this.viewer_.state.pageProgression() === _modelsVivliostyle2["default"].constants.PageProgression.LTR) {
                return _this.isNavigateToPreviousDisabled();
            } else {
                return _this.isNavigateToNextDisabled();
            }
        });

        this.isNavigateToRightDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.pageProgression === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (_this.viewer_.state.pageProgression() === _modelsVivliostyle2["default"].constants.PageProgression.LTR) {
                return _this.isNavigateToNextDisabled();
            } else {
                return _this.isNavigateToPreviousDisabled();
            }
        });

        this.isNavigateToFirstDisabled = this.isNavigateToPreviousDisabled;

        this.isNavigateToLastDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.status === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (_this.viewerOptions_.renderAllPages() && _this.viewer_.state.status() != _modelsVivliostyle2["default"].constants.ReadyState.COMPLETE) {
                return true;
            }
            return _this.viewer_.lastPage();
        });

        this.hidePageNavigation = !!navigationOptions.disablePageNavigation;

        var zoomDisabled = _knockout2["default"].pureComputed(function () {
            return navigationOptions.disableZoom || _this.isDisabled();
        });

        this.isZoomOutDisabled = zoomDisabled;
        this.isZoomInDisabled = zoomDisabled;
        this.isZoomToActualSizeDisabled = zoomDisabled;
        this.isToggleFitToScreenDisabled = zoomDisabled;
        this.hideZoom = !!navigationOptions.disableZoom;

        this.fitToScreen = _knockout2["default"].pureComputed(function () {
            return viewerOptions.zoom().fitToScreen;
        });

        var fontSizeChangeDisabled = _knockout2["default"].pureComputed(function () {
            return navigationOptions.disableFontSizeChange || _this.isDisabled();
        });

        this.isIncreaseFontSizeDisabled = fontSizeChangeDisabled;
        this.isDecreaseFontSizeDisabled = fontSizeChangeDisabled;
        this.isDefaultFontSizeDisabled = fontSizeChangeDisabled;
        this.hideFontSizeChange = !!navigationOptions.disableFontSizeChange;

        this.isTOCToggleDisabled = _knockout2["default"].pureComputed(function () {
            return navigationOptions.disableTOCNavigation || _this.isDisabled() || _this.viewer_.tocVisible() == null;
        });
        this.hideTOCNavigation = !!navigationOptions.disableTOCNavigation;

        this.pageNumber = _knockout2["default"].pureComputed({
            read: function read() {
                return this.viewer_.epageToPageNumber(this.viewer_.epage());
            },
            write: function write(pageNumberText) {
                var _this2 = this;

                var epageOld = this.viewer_.epage();
                var pageNumberOld = this.viewer_.epageToPageNumber(epageOld);

                // Accept non-integer, convert fullwidth to ascii
                var pageNumber = parseFloat(pageNumberText.replace(/[０-９]/g, function (s) {
                    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
                })) || 0;
                if (/^[-+]/.test(pageNumberText)) {
                    // "+number" and "-number" to relative move.
                    pageNumber = pageNumberOld + pageNumber;
                }
                if (pageNumber < 1) {
                    pageNumber = 1;
                } else {
                    var epageCount = this.viewer_.epageCount();
                    if (this.viewerOptions_.renderAllPages()) {
                        if (pageNumber > epageCount) {
                            pageNumber = epageCount;
                        }
                    } else if (pageNumber > epageCount + 1) {
                        // Accept "epageCount + 1" because the last epage may equal epageCount.
                        pageNumber = epageCount + 1;
                    }
                }
                var epageNav = this.viewer_.epageFromPageNumber(pageNumber);
                var pageNumberElem = document.getElementById("vivliostyle-page-number");
                pageNumberElem.value = pageNumber;
                this.viewer_.navigateToEPage(epageNav);

                setTimeout(function () {
                    if (_this2.viewer_.state.status() != _modelsVivliostyle2["default"].constants.ReadyState.LOADING && _this2.viewer_.epage() === epageOld) {
                        pageNumberElem.value = pageNumberOld;
                    }
                    document.getElementById("vivliostyle-viewer-viewport").focus();
                }, 10);
            },
            owner: this
        });

        this.totalPages = _knockout2["default"].pureComputed(function () {
            var totalPages = _this.viewer_.epageCount();
            if (!totalPages) {
                return totalPages;
            }
            var pageNumber = _this.pageNumber();
            if (_this.viewer_.lastPage()) {
                totalPages = pageNumber;
            } else if (pageNumber >= totalPages) {
                totalPages++;
            }
            return totalPages;
        });

        ["navigateToPrevious", "navigateToNext", "navigateToLeft", "navigateToRight", "navigateToFirst", "navigateToLast", "zoomIn", "zoomOut", "zoomToActualSize", "toggleFitToScreen", "increaseFontSize", "decreaseFontSize", "defaultFontSize", "onclickViewport", "toggleTOC"].forEach(function (methodName) {
            _this[methodName] = _this[methodName].bind(_this);
        });
    }

    _createClass(Navigation, [{
        key: "navigateToPrevious",
        value: function navigateToPrevious() {
            if (!this.isNavigateToPreviousDisabled()) {
                this.viewer_.navigateToPrevious();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToNext",
        value: function navigateToNext() {
            if (!this.isNavigateToNextDisabled()) {
                this.viewer_.navigateToNext();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToLeft",
        value: function navigateToLeft() {
            if (!this.isNavigateToLeftDisabled()) {
                this.viewer_.navigateToLeft();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToRight",
        value: function navigateToRight() {
            if (!this.isNavigateToRightDisabled()) {
                this.viewer_.navigateToRight();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToFirst",
        value: function navigateToFirst() {
            if (!this.isNavigateToFirstDisabled()) {
                this.viewer_.navigateToFirst();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToLast",
        value: function navigateToLast() {
            if (!this.isNavigateToLastDisabled()) {
                this.viewer_.navigateToLast();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "zoomIn",
        value: function zoomIn() {
            if (!this.isZoomInDisabled()) {
                var zoom = this.viewerOptions_.zoom();
                this.viewerOptions_.zoom(zoom.zoomIn(this.viewer_));
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "zoomOut",
        value: function zoomOut() {
            if (!this.isZoomOutDisabled()) {
                var zoom = this.viewerOptions_.zoom();
                this.viewerOptions_.zoom(zoom.zoomOut(this.viewer_));
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "zoomToActualSize",
        value: function zoomToActualSize() {
            if (!this.isZoomToActualSizeDisabled()) {
                var zoom = this.viewerOptions_.zoom();
                this.viewerOptions_.zoom(zoom.zoomToActualSize());
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "toggleFitToScreen",
        value: function toggleFitToScreen() {
            if (!this.isToggleFitToScreenDisabled()) {
                var zoom = this.viewerOptions_.zoom();
                this.viewerOptions_.zoom(zoom.toggleFitToScreen());
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "increaseFontSize",
        value: function increaseFontSize() {
            if (!this.isIncreaseFontSizeDisabled()) {
                var fontSize = this.viewerOptions_.fontSize();
                this.viewerOptions_.fontSize(fontSize * 1.25);
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "decreaseFontSize",
        value: function decreaseFontSize() {
            if (!this.isDecreaseFontSizeDisabled()) {
                var fontSize = this.viewerOptions_.fontSize();
                this.viewerOptions_.fontSize(fontSize * 0.8);
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "defaultFontSize",
        value: function defaultFontSize() {
            if (!this.isDefaultFontSizeDisabled()) {
                var fontSize = _modelsViewerOptions2["default"].getDefaultValues().fontSize;
                this.viewerOptions_.fontSize(fontSize);
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "onclickViewport",
        value: function onclickViewport() {
            if (this.viewer_.tocVisible() && !this.viewer_.tocPinned()) {
                var tocBox = document.querySelector("[data-vivliostyle-toc-box]");
                if (tocBox && !tocBox.contains(document.activeElement)) {
                    this.toggleTOC();
                }
            }
            if (this.settingsPanel_.opened() && !this.settingsPanel_.pinned()) {
                this.settingsPanel_.close();
            }
            return true;
        }
    }, {
        key: "toggleTOC",
        value: function toggleTOC() {
            var _this3 = this;

            if (!this.isTOCToggleDisabled()) {
                var _ret = (function () {
                    var intervalID = 0;
                    var tocToggle = document.getElementById("vivliostyle-menu-item_toc-toggle");

                    if (!_this3.viewer_.tocVisible()) {
                        _this3.viewer_.showTOC(true, true); // autohide=true
                        _this3.justClicked = true;

                        // Here use timer for two purposes:
                        // - Check double click to make TOC box pinned.
                        // - Move focus to TOC box when TOC box becomes visible.
                        intervalID = setInterval(function () {
                            var tocBox = document.querySelector("[data-vivliostyle-toc-box]");
                            if (tocBox && tocBox.style.visibility === "visible") {
                                tocBox.tabIndex = 0;
                                tocBox.focus();

                                clearInterval(intervalID);
                                intervalID = 0;
                            }
                            _this3.justClicked = false;
                        }, 300);
                    } else if (_this3.justClicked) {
                        // Double click to keep TOC box visible during TOC navigation
                        _this3.viewer_.showTOC(true, false); // autohide=false
                        _this3.justClicked = false;
                    } else {
                        if (intervalID) {
                            clearInterval(intervalID);
                            intervalID = 0;
                        }
                        _this3.viewer_.showTOC(false);
                        document.getElementById("vivliostyle-viewer-viewport").focus();
                    }
                    return {
                        v: true
                    };
                })();

                if (typeof _ret === "object") return _ret.v;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateTOC",
        value: function navigateTOC(key) {
            var selecter = "[data-vivliostyle-toc-box] [tabindex='0'], [data-vivliostyle-toc-box] a:not([tabindex='-1'])";
            var nodes = Array.from(document.querySelectorAll(selecter));
            var index = nodes.indexOf(document.activeElement);

            var isButton = function isButton(index) {
                return nodes[index] && nodes[index].getAttribute("role") === "button";
            };
            var isExpanded = function isExpanded(index) {
                return nodes[index] && nodes[index].getAttribute("aria-expanded") === "true";
            };

            switch (key) {
                case _utilsKeyUtil.Keys.ArrowLeft:
                    if (index == -1) {
                        index = nodes.length - 1;
                        break;
                    }
                    if (!isButton(index) && isButton(index - 1)) {
                        index--;
                    }
                    if (isButton(index) && isExpanded(index)) {
                        nodes[index].click();
                    } else {
                        for (var i = index - 1; i >= 0; i--) {
                            if (isButton(i) && nodes[i].parentElement.contains(nodes[index])) {
                                index = i;
                                break;
                            }
                        }
                    }
                    break;
                case _utilsKeyUtil.Keys.ArrowRight:
                    if (index == -1) {
                        index = 0;
                        break;
                    }
                    if (!isButton(index) && isButton(index - 1)) {
                        index--;
                    }
                    if (isButton(index)) {
                        if (isExpanded(index)) {
                            index += 2;
                        } else {
                            nodes[index].click();
                        }
                    }
                    break;
                case _utilsKeyUtil.Keys.ArrowDown:
                    index++;
                    break;
                case _utilsKeyUtil.Keys.ArrowUp:
                    if (index == -1) {
                        index = nodes.length - 1;
                        break;
                    }
                    if (index > 0) {
                        if (isButton(--index)) {
                            index--;
                        }
                    }
                    break;
                case _utilsKeyUtil.Keys.Home:
                    index = 0;
                    break;
                case _utilsKeyUtil.Keys.End:
                    index = nodes.length - 1;
                    break;
                case _utilsKeyUtil.Keys.Space:
                    if (!isButton(index) && isButton(index - 1)) {
                        index--;
                    }
                    if (isButton(index)) {
                        nodes[index].click();
                    }
                    break;
            }

            if (isButton(index)) {
                index++;
            }

            if (nodes[index]) {
                nodes[index].focus();
            }

            return true;
        }
    }, {
        key: "handleKey",
        value: function handleKey(key) {
            var isSettingsActive = this.settingsPanel_.opened() && this.settingsPanel_.settingsToggle.contains(document.activeElement);

            if (isSettingsActive) {
                return true;
            }

            var pageNumberElem = document.getElementById("vivliostyle-page-number");
            var viewportElement = document.getElementById("vivliostyle-viewer-viewport");
            var horizontalScrollable = viewportElement.scrollWidth > viewportElement.clientWidth;
            var verticalScrollable = viewportElement.scrollHeight > viewportElement.clientHeight;
            var isPageNumberInput = pageNumberElem === document.activeElement;
            var isTOCActive = this.viewer_.tocVisible() && !isPageNumberInput && viewportElement != document.activeElement;

            switch (key) {
                case "+":
                    return isPageNumberInput || !this.increaseFontSize();
                case "-":
                    return isPageNumberInput || !this.decreaseFontSize();
                case "0":
                    return isPageNumberInput || !this.defaultFontSize();
                case "1":
                    return isPageNumberInput || !this.zoomToActualSize();
                case _utilsKeyUtil.Keys.ArrowLeft:
                    if (isTOCActive) return !this.navigateTOC(key);
                    return isPageNumberInput || horizontalScrollable || !this.navigateToLeft();
                case _utilsKeyUtil.Keys.ArrowRight:
                    if (isTOCActive) return !this.navigateTOC(key);
                    return isPageNumberInput || horizontalScrollable || !this.navigateToRight();
                case _utilsKeyUtil.Keys.ArrowDown:
                    if (isTOCActive) return !this.navigateTOC(key);
                    viewportElement.focus();
                    return verticalScrollable || !this.navigateToNext();
                case _utilsKeyUtil.Keys.ArrowUp:
                    if (isTOCActive) return !this.navigateTOC(key);
                    viewportElement.focus();
                    return verticalScrollable || !this.navigateToPrevious();
                case _utilsKeyUtil.Keys.PageDown:
                    if (isTOCActive) return true;
                    viewportElement.focus();
                    return !this.navigateToNext();
                case _utilsKeyUtil.Keys.PageUp:
                    if (isTOCActive) return true;
                    viewportElement.focus();
                    return !this.navigateToPrevious();
                case _utilsKeyUtil.Keys.Home:
                    if (isTOCActive) return !this.navigateTOC(key);
                    viewportElement.focus();
                    return !this.navigateToFirst();
                case _utilsKeyUtil.Keys.End:
                    if (isTOCActive) return !this.navigateTOC(key);
                    viewportElement.focus();
                    return !this.navigateToLast();
                case "o":
                case "O":
                    viewportElement.focus();
                    return !this.zoomOut();
                case "i":
                case "I":
                    viewportElement.focus();
                    return !this.zoomIn();
                case "f":
                case "F":
                    viewportElement.focus();
                    return !this.toggleFitToScreen();
                case "g":
                case "G":
                    pageNumberElem.focus();
                    return false;
                case "t":
                case "T":
                    viewportElement.focus();
                    return !this.toggleTOC();
                case _utilsKeyUtil.Keys.Escape:
                    if (this.viewer_.tocVisible()) {
                        return !this.toggleTOC();
                    }
                    viewportElement.focus();
                    return true;
                case _utilsKeyUtil.Keys.Space:
                    if (isTOCActive) return !this.navigateTOC(key);
                    if (document.activeElement.getAttribute("role") === "button") {
                        document.activeElement.click();
                        return false;
                    }
                    return true;
                default:
                    return true;
            }
        }
    }]);

    return Navigation;
})();

exports["default"] = Navigation;
module.exports = exports["default"];

},{"../models/viewer-options":10,"../models/vivliostyle":11,"../utils/key-util":14,"knockout":1}],19:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _modelsViewerOptions = require("../models/viewer-options");

var _modelsViewerOptions2 = _interopRequireDefault(_modelsViewerOptions);

var _modelsPageSize = require("../models/page-size");

var _modelsPageSize2 = _interopRequireDefault(_modelsPageSize);

var _modelsPageViewMode = require("../models/page-view-mode");

var _modelsPageViewMode2 = _interopRequireDefault(_modelsPageViewMode);

var _utilsKeyUtil = require("../utils/key-util");

var SettingsPanel = (function () {
    function SettingsPanel(viewerOptions, documentOptions, viewer, messageDialog, settingsPanelOptions) {
        var _this = this;

        _classCallCheck(this, SettingsPanel);

        this.viewerOptions_ = viewerOptions;
        this.documentOptions_ = documentOptions;
        this.viewer_ = viewer;

        this.isPageSizeChangeDisabled = !!settingsPanelOptions.disablePageSizeChange;
        this.isOverrideDocumentStyleSheetDisabled = this.isPageSizeChangeDisabled;
        this.isPageViewModeChangeDisabled = !!settingsPanelOptions.disablePageViewModeChange;
        this.isRenderAllPagesChangeDisabled = !!settingsPanelOptions.disableRenderAllPagesChange;

        this.justClicked = false; // double click check
        this.settingsToggle = document.getElementById("vivliostyle-menu-item_misc-toggle");

        this.opened = _knockout2["default"].observable(false);
        this.pinned = _knockout2["default"].observable(false);

        this.state = {
            viewerOptions: new _modelsViewerOptions2["default"](viewerOptions),
            pageSize: new _modelsPageSize2["default"](documentOptions.pageSize),
            pageViewMode: _knockout2["default"].pureComputed({
                read: function read() {
                    return _this.state.viewerOptions.pageViewMode().toString();
                },
                write: function write(value) {
                    _this.state.viewerOptions.pageViewMode(_modelsPageViewMode2["default"].of(value));
                }
            }),
            renderAllPages: _knockout2["default"].pureComputed({
                read: function read() {
                    return _this.state.viewerOptions.renderAllPages();
                },
                write: function write(value) {
                    _this.state.viewerOptions.renderAllPages(value);
                }
            })
        };

        ["close", "toggle", "apply", "reset"].forEach(function (methodName) {
            this[methodName] = this[methodName].bind(this);
        }, this);

        messageDialog.visible.subscribe(function (visible) {
            if (visible) this.close();
        }, this);
    }

    _createClass(SettingsPanel, [{
        key: "close",
        value: function close() {
            this.opened(false);
            this.pinned(false);
            var viewportElement = document.getElementById("vivliostyle-viewer-viewport");
            if (viewportElement) viewportElement.focus();
            return true;
        }
    }, {
        key: "toggle",
        value: function toggle() {
            var _this2 = this;

            if (!this.opened()) {
                if (!this.viewer_.tocPinned()) {
                    this.viewer_.showTOC(false); // Hide TOC box
                }
                this.opened(true);
                this.pinned(false);
                this.justClicked = true;
                this.focusToFirstItem();

                setTimeout(function () {
                    _this2.justClicked = false;
                }, 300);
            } else if (this.justClicked) {
                // Double click to keep Settings panel open when Applay or Reset is clicked.
                this.justClicked = false;
                this.pinned(true);
            } else {
                this.close();
            }
        }
    }, {
        key: "apply",
        value: function apply() {
            if (this.state.renderAllPages() === this.viewerOptions_.renderAllPages() && this.state.pageSize.equivalentTo(this.documentOptions_.pageSize)) {
                this.viewerOptions_.copyFrom(this.state.viewerOptions);
            } else {
                this.documentOptions_.pageSize.copyFrom(this.state.pageSize);
                this.viewer_.loadDocument(this.documentOptions_, this.state.viewerOptions);
            }
            if (this.pinned()) {
                this.focusToFirstItem();
            } else {
                this.close();
            }
        }
    }, {
        key: "reset",
        value: function reset() {
            this.state.viewerOptions.copyFrom(this.viewerOptions_);
            this.state.pageSize.copyFrom(this.documentOptions_.pageSize);
            this.close();
        }
    }, {
        key: "focusToFirstItem",
        value: function focusToFirstItem() {
            var inputElem = Array.from(this.settingsToggle.getElementsByTagName("input")).find(function (e) {
                return !e.disabled && e.checked;
            });
            if (inputElem) {
                inputElem.focus();
            }
        }
    }, {
        key: "handleKey",
        value: function handleKey(key) {
            var isSettingsActive = this.opened() && this.settingsToggle.contains(document.activeElement);
            var isInInput = isSettingsActive && (document.activeElement.type == "text" || document.activeElement.localName == "select");
            var isHotKeyEnabled = isSettingsActive && !isInInput;

            switch (key) {
                case _utilsKeyUtil.Keys.Escape:
                    if (this.opened()) {
                        this.reset();
                        this.close();
                    }
                    return true;
                case "s":
                case "S":
                    if (!this.opened() || isHotKeyEnabled || !isSettingsActive) {
                        this.toggle();
                        return false;
                    }
                    return true;
                case "o":
                case "O":
                    if (isHotKeyEnabled) {
                        document.getElementsByName("vivliostyle-misc_paginate_override-document-stylesheets")[0].focus();
                        return false;
                    }
                    return true;
                case "r":
                case "R":
                    if (isHotKeyEnabled) {
                        document.getElementsByName("vivliostyle-misc_render-all-pages")[0].focus();
                        return false;
                    }
                    return true;
                case _utilsKeyUtil.Keys.Enter:
                    if (isHotKeyEnabled && document.activeElement.id !== "vivliostyle-menu-button_apply" && document.activeElement.id !== "vivliostyle-menu-button_reset") {
                        document.getElementById("vivliostyle-menu-button_apply").focus();
                        return false;
                    }
                    return true;
                default:
                    return true;
            }
        }
    }]);

    return SettingsPanel;
})();

exports["default"] = SettingsPanel;
module.exports = exports["default"];

},{"../models/page-size":8,"../models/page-view-mode":9,"../models/viewer-options":10,"../utils/key-util":14,"knockout":1}],20:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var _modelsDocumentOptions = require("../models/document-options");

var _modelsDocumentOptions2 = _interopRequireDefault(_modelsDocumentOptions);

var _modelsZoomOptions = require("../models/zoom-options");

var _modelsZoomOptions2 = _interopRequireDefault(_modelsZoomOptions);

var _modelsViewerOptions = require("../models/viewer-options");

var _modelsViewerOptions2 = _interopRequireDefault(_modelsViewerOptions);

var _modelsMessageQueue = require("../models/message-queue");

var _modelsMessageQueue2 = _interopRequireDefault(_modelsMessageQueue);

var _viewer = require("./viewer");

var _viewer2 = _interopRequireDefault(_viewer);

var _navigation = require("./navigation");

var _navigation2 = _interopRequireDefault(_navigation);

var _settingsPanel = require("./settings-panel");

var _settingsPanel2 = _interopRequireDefault(_settingsPanel);

var _messageDialog = require("./message-dialog");

var _messageDialog2 = _interopRequireDefault(_messageDialog);

var _utilsKeyUtil = require("../utils/key-util");

var _utilsKeyUtil2 = _interopRequireDefault(_utilsKeyUtil);

var _storesUrlParameters = require("../stores/url-parameters");

var _storesUrlParameters2 = _interopRequireDefault(_storesUrlParameters);

function ViewerApp() {
    var _this = this;

    this.documentOptions = new _modelsDocumentOptions2["default"]();
    this.viewerOptions = new _modelsViewerOptions2["default"]();
    if (this.viewerOptions.profile()) {
        _modelsVivliostyle2["default"].profile.profiler.enable();
    }
    this.isDebug = _storesUrlParameters2["default"].getParameter("debug")[0] === "true";
    this.viewerSettings = {
        userAgentRootURL: _storesUrlParameters2["default"].getBaseURL() + "resources/",
        viewportElement: document.getElementById("vivliostyle-viewer-viewport"),
        debug: this.isDebug
    };
    this.viewer = new _viewer2["default"](this.viewerSettings, this.viewerOptions);
    this.messageDialog = new _messageDialog2["default"](_modelsMessageQueue2["default"]);

    var settingsPanelOptions = {
        disablePageSizeChange: false,
        disablePageViewModeChange: false,
        disableRenderAllPagesChange: false
    };

    this.settingsPanel = new _settingsPanel2["default"](this.viewerOptions, this.documentOptions, this.viewer, this.messageDialog, settingsPanelOptions);

    var navigationOptions = {
        disableTOCNavigation: false,
        disablePageNavigation: false,
        disableZoom: false,
        disableFontSizeChange: false
    };

    this.navigation = new _navigation2["default"](this.viewerOptions, this.viewer, this.settingsPanel, navigationOptions);

    this.handleKey = function (data, event) {
        var key = _utilsKeyUtil2["default"].identifyKeyFromEvent(event);
        if (!(key === "Home" || key === "End") && (event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) {
            return true;
        }
        var ret = _this.settingsPanel.handleKey(key);
        if (ret) {
            ret = _this.navigation.handleKey(key);
        }
        return ret;
    };

    this.viewer.loadDocument(this.documentOptions);

    window.onhashchange = function () {
        if (window.location.href != _storesUrlParameters2["default"].storedUrl) {
            // Reload when address bar change is detected
            window.location.reload();
        }
    };
}

exports["default"] = ViewerApp;
module.exports = exports["default"];

},{"../models/document-options":6,"../models/message-queue":7,"../models/viewer-options":10,"../models/vivliostyle":11,"../models/zoom-options":12,"../stores/url-parameters":13,"../utils/key-util":14,"./message-dialog":17,"./navigation":18,"./settings-panel":19,"./viewer":21,"knockout":1}],21:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2018 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _utilsObservableUtil = require("../utils/observable-util");

var _utilsObservableUtil2 = _interopRequireDefault(_utilsObservableUtil);

var _loggingLogger = require("../logging/logger");

var _loggingLogger2 = _interopRequireDefault(_loggingLogger);

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var Viewer = (function () {
    function Viewer(viewerSettings, viewerOptions) {
        _classCallCheck(this, Viewer);

        this.viewerOptions_ = viewerOptions;
        this.documentOptions_ = null;
        this.viewer_ = new _modelsVivliostyle2["default"].viewer.Viewer(viewerSettings, viewerOptions.toObject());
        var state_ = this.state_ = {
            status: _utilsObservableUtil2["default"].readonlyObservable(_modelsVivliostyle2["default"].constants.ReadyState.LOADING),
            pageProgression: _utilsObservableUtil2["default"].readonlyObservable(_modelsVivliostyle2["default"].constants.PageProgression.LTR)
        };
        this.state = {
            status: state_.status.getter.extend({
                rateLimit: { timeout: 100, method: "notifyWhenChangesStop" },
                notify: 'always'
            }),
            navigatable: _knockout2["default"].pureComputed(function () {
                return state_.status.value() !== _modelsVivliostyle2["default"].constants.ReadyState.LOADING;
            }),
            pageProgression: state_.pageProgression.getter
        };

        this.epage = _knockout2["default"].observable();
        this.epageCount = _knockout2["default"].observable();
        this.firstPage = _knockout2["default"].observable();
        this.lastPage = _knockout2["default"].observable();
        this.tocVisible = _knockout2["default"].observable();
        this.tocPinned = _knockout2["default"].observable();

        this.setupViewerEventHandler();
        this.setupViewerOptionSubscriptions();
    }

    _createClass(Viewer, [{
        key: "setupViewerEventHandler",
        value: function setupViewerEventHandler() {
            var _this = this;

            var logger = _loggingLogger2["default"].getLogger();
            var intervalID = 0;
            this.viewer_.addListener("debug", function (payload) {
                logger.debug(payload.content);
            });
            this.viewer_.addListener("info", function (payload) {
                logger.info(payload.content);
            });
            this.viewer_.addListener("warn", function (payload) {
                logger.warn(payload.content);
            });
            this.viewer_.addListener("error", function (payload) {
                logger.error(payload.content);
            });
            this.viewer_.addListener("readystatechange", function () {
                var readyState = _this.viewer_.readyState;
                if (readyState === _modelsVivliostyle2["default"].constants.ReadyState.INTERACTIVE || readyState === _modelsVivliostyle2["default"].constants.ReadyState.COMPLETE) {
                    _this.state_.pageProgression.value(_this.viewer_.getCurrentPageProgression());
                }
                _this.state_.status.value(readyState);
            });
            this.viewer_.addListener("loaded", function () {
                if (_this.viewerOptions_.profile()) {
                    _modelsVivliostyle2["default"].profile.profiler.printTimings();
                }
            });
            this.viewer_.addListener("nav", function (payload) {
                var cfi = payload.cfi;
                var first = payload.first;
                var last = payload.last;
                var epage = payload.epage;
                var epageCount = payload.epageCount;
                var metadata = payload.metadata;
                var itemTitle = payload.itemTitle;

                if (cfi) {
                    _this.documentOptions_.fragment(cfi);
                }
                if (first !== undefined) {
                    _this.firstPage(first);
                }
                if (last !== undefined) {
                    _this.lastPage(last);
                }
                if (epage !== undefined) {
                    _this.epage(epage);
                }
                if (epageCount !== undefined) {
                    _this.epageCount(epageCount);
                }
                if (metadata || itemTitle) {
                    var bookTitles = metadata && metadata["http://purl.org/dc/terms/title"];
                    var bookTitle = bookTitles && bookTitles[0] && bookTitles[0]["v"];
                    if (!bookTitle) {
                        document.title = itemTitle ? itemTitle : "Vivliostyle viewer";
                    } else if (!itemTitle || itemTitle === bookTitle || _this.firstPage() || /\.xhtml$/.test(itemTitle)) {
                        // ignore ugly titles copied from *.xhtml file name
                        document.title = bookTitle;
                    } else {
                        document.title = itemTitle + " | " + bookTitle;
                    }
                }

                var tocVisibleOld = _this.tocVisible();
                var tocVisibleNew = _this.viewer_.isTOCVisible();
                if (tocVisibleOld && !tocVisibleNew) {
                    // When resize, TOC box will be regenerated and hidden temporarily.
                    // So keep TOC toggle button status on.
                } else {
                        _this.tocVisible(tocVisibleNew);
                    }
            });
            this.viewer_.addListener("hyperlink", function (payload) {
                if (payload.internal) {
                    _this.navigateToInternalUrl(payload.href);

                    // When navigate from TOC, TOC box may or may not become hidden by autohide.
                    // Here set tocVisible false and it may become true again in "nav" event.
                    if (_this.tocVisible()) {
                        _this.tocVisible(false);
                    }

                    document.getElementById("vivliostyle-viewer-viewport").focus();
                } else {
                    window.location.href = payload.href;
                }
            });
        }
    }, {
        key: "setupViewerOptionSubscriptions",
        value: function setupViewerOptionSubscriptions() {
            _knockout2["default"].computed(function () {
                var viewerOptions = this.viewerOptions_.toObject();
                this.viewer_.setOptions(viewerOptions);
            }, this).extend({ rateLimit: 0 });
        }
    }, {
        key: "loadDocument",
        value: function loadDocument(documentOptions, viewerOptions) {
            this.state_.status.value("loading");
            if (viewerOptions) {
                this.viewerOptions_.copyFrom(viewerOptions);
            }
            this.documentOptions_ = documentOptions;
            if (documentOptions.url()) {
                this.viewer_.loadDocument(documentOptions.url(), documentOptions.toObject(), this.viewerOptions_.toObject());
            } else if (documentOptions.epubUrl()) {
                this.viewer_.loadEPUB(documentOptions.epubUrl(), documentOptions.toObject(), this.viewerOptions_.toObject());
            }
        }
    }, {
        key: "navigateToPrevious",
        value: function navigateToPrevious() {
            this.viewer_.navigateToPage("previous");
        }
    }, {
        key: "navigateToNext",
        value: function navigateToNext() {
            this.viewer_.navigateToPage("next");
        }
    }, {
        key: "navigateToLeft",
        value: function navigateToLeft() {
            this.viewer_.navigateToPage("left");
        }
    }, {
        key: "navigateToRight",
        value: function navigateToRight() {
            this.viewer_.navigateToPage("right");
        }
    }, {
        key: "navigateToFirst",
        value: function navigateToFirst() {
            this.viewer_.navigateToPage("first");
        }
    }, {
        key: "navigateToLast",
        value: function navigateToLast() {
            this.viewer_.navigateToPage("last");
        }
    }, {
        key: "navigateToEPage",
        value: function navigateToEPage(epage) {
            this.viewer_.navigateToPage("epage", epage);
        }
    }, {
        key: "navigateToInternalUrl",
        value: function navigateToInternalUrl(href) {
            this.viewer_.navigateToInternalUrl(href);
        }
    }, {
        key: "queryZoomFactor",
        value: function queryZoomFactor(type) {
            return this.viewer_.queryZoomFactor(type);
        }
    }, {
        key: "epageToPageNumber",
        value: function epageToPageNumber(epage) {
            if (!epage && epage != 0) {
                return undefined;
            }
            var pageNumber = Math.round(epage + 1);
            return pageNumber;
        }
    }, {
        key: "epageFromPageNumber",
        value: function epageFromPageNumber(pageNumber) {
            if (!pageNumber && pageNumber != 0) {
                return undefined;
            }
            var epage = pageNumber - 1;
            return epage;
        }
    }, {
        key: "showTOC",
        value: function showTOC(opt_show, opt_autohide) {
            if (this.viewer_.isTOCVisible() == null) {
                // TOC is unavailable
                return;
            }
            var show = opt_show == null ? !this.tocVisible() : opt_show;
            this.tocVisible(show);
            this.tocPinned(show ? !opt_autohide : false);
            this.viewer_.showTOC(show, opt_autohide);
        }
    }]);

    return Viewer;
})();

exports["default"] = Viewer;
module.exports = exports["default"];

},{"../logging/logger":4,"../models/vivliostyle":11,"../utils/observable-util":15,"knockout":1}],22:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _bindingsMenuButtonJs = require("./bindings/menuButton.js");

var _bindingsMenuButtonJs2 = _interopRequireDefault(_bindingsMenuButtonJs);

var _bindingsSwipePagesJs = require("./bindings/swipePages.js");

var _bindingsSwipePagesJs2 = _interopRequireDefault(_bindingsSwipePagesJs);

var _viewmodelsViewerApp = require("./viewmodels/viewer-app");

var _viewmodelsViewerApp2 = _interopRequireDefault(_viewmodelsViewerApp);

exports["default"] = {
    start: function start() {
        function startViewer() {
            _knockout2["default"].applyBindings(new _viewmodelsViewerApp2["default"]());
        }

        if (window["__loaded"]) startViewer();else window.onload = startViewer;
    }
};
module.exports = exports["default"];

},{"./bindings/menuButton.js":2,"./bindings/swipePages.js":3,"./viewmodels/viewer-app":20,"knockout":1}],23:[function(require,module,exports){
(function (global){
/*
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Vivliostyle core 2019.1.100-pre.20190203145702
 */
(function(factory) {
    if (typeof define === "function" && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof module === "object") {
        // Node.js
        var enclosingObject = {};
        module.exports = factory(enclosingObject);
    } else if (typeof exports === "object") {
        // CommonJS
        var enclosingObject = {};
        exports = factory(enclosingObject);
    } else {
        // Attach to the window object
        factory(window);
    }
})(function(enclosingObject) {
    enclosingObject = enclosingObject || {};
    var n,aa="function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){if(c.get||c.set)throw new TypeError("ES3 does not support getters and setters.");a!=Array.prototype&&a!=Object.prototype&&(a[b]=c.value)},ba="undefined"!=typeof window&&window===this?this:"undefined"!=typeof global?global:this;function ca(){ca=function(){};ba.Symbol||(ba.Symbol=da)}var ea=0;function da(a){return"jscomp_symbol_"+(a||"")+ea++}
function fa(){ca();var a=ba.Symbol.iterator;a||(a=ba.Symbol.iterator=ba.Symbol("iterator"));"function"!=typeof Array.prototype[a]&&aa(Array.prototype,a,{configurable:!0,writable:!0,value:function(){return ga(this)}});fa=function(){}}function ga(a){var b=0;return ha(function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}})}function ha(a){fa();a={next:a};a[ba.Symbol.iterator]=function(){return this};return a}function t(a){fa();var b=a[Symbol.iterator];return b?b.call(a):ga(a)}
function ia(a){if(!(a instanceof Array)){a=t(a);for(var b,c=[];!(b=a.next()).done;)c.push(b.value);a=c}return a}function ja(a,b){if(b){for(var c=ba,d=a.split("."),e=0;e<d.length-1;e++){var f=d[e];f in c||(c[f]={});c=c[f]}d=d[d.length-1];e=c[d];f=b(e);f!=e&&null!=f&&aa(c,d,{configurable:!0,writable:!0,value:f})}}
ja("Array.from",function(a){return a?a:function(a,c,d){fa();c=c?c:function(a){return a};var b=[],f=a[Symbol.iterator];if("function"==typeof f)for(a=f.call(a);!(f=a.next()).done;)b.push(c.call(d,f.value));else for(var f=a.length,g=0;g<f;g++)b.push(c.call(d,a[g]));return b}});ja("Object.assign",function(a){return a?a:function(a,c){for(var b=1;b<arguments.length;b++){var e=arguments[b];if(e)for(var f in e)Object.prototype.hasOwnProperty.call(e,f)&&(a[f]=e[f])}return a}});
function ka(a,b){fa();a instanceof String&&(a+="");var c=0,d={next:function(){if(c<a.length){var e=c++;return{value:b(e,a[e]),done:!1}}d.next=function(){return{done:!0,value:void 0}};return d.next()}};d[Symbol.iterator]=function(){return d};return d}ja("Array.prototype.values",function(a){return a?a:function(){return ka(this,function(a,c){return c})}});
ja("String.prototype.includes",function(a){return a?a:function(a,c){if(null==this)throw new TypeError("The 'this' value for String.prototype.includes must not be null or undefined");if(a instanceof RegExp)throw new TypeError("First argument to String.prototype.includes must not be a regular expression");return-1!==(this+"").indexOf(a,c||0)}});
ja("Array.prototype.findIndex",function(a){return a?a:function(a,c){var b;a:{b=this;b instanceof String&&(b=String(b));for(var e=b.length,f=0;f<e;f++)if(a.call(c,b[f],f,b)){b=f;break a}b=-1}return b}});var ma=this;function na(a,b){var c="undefined"!==typeof enclosingObject&&enclosingObject?enclosingObject:window,d=a.split("."),c=c||ma;d[0]in c||!c.execScript||c.execScript("var "+d[0]);for(var e;d.length&&(e=d.shift());)d.length||void 0===b?c[e]?c=c[e]:c=c[e]={}:c[e]=b}
function v(a,b){function c(){}c.prototype=b.prototype;a.ng=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.nh=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}};function oa(a){if(Error.captureStackTrace)Error.captureStackTrace(this,oa);else{var b=Error().stack;b&&(this.stack=b)}a&&(this.message=String(a))}v(oa,Error);oa.prototype.name="CustomError";function pa(a,b){for(var c=a.split("%s"),d="",e=Array.prototype.slice.call(arguments,1);e.length&&1<c.length;)d+=c.shift()+e.shift();return d+c.join("%s")};function qa(a,b){b.unshift(a);oa.call(this,pa.apply(null,b));b.shift()}v(qa,oa);qa.prototype.name="AssertionError";function ra(a,b){throw new qa("Failure"+(a?": "+a:""),Array.prototype.slice.call(arguments,1));};function sa(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function ta(a){a=Array.from(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function ua(a){this.f=a;this.Pb={}}function va(a,b,c){(a=a.Pb[b])&&a.forEach(function(a){a(c)})}function wa(a,b){var c=w,d=c.Pb[a];d||(d=c.Pb[a]=[]);d.push(b)}
ua.prototype.debug=function(a){var b=ta(arguments),c=sa(b);this.f?this.f.debug?this.f.debug.apply(this.f,[].concat(ia(c))):this.f.log.apply(this.f,[].concat(ia(c))):console.debug.apply(console,[].concat(ia(c)));va(this,1,b)};ua.prototype.g=function(a){var b=ta(arguments),c=sa(b);this.f?this.f.info?this.f.info.apply(this.f,[].concat(ia(c))):this.f.log.apply(this.f,[].concat(ia(c))):console.info.apply(console,[].concat(ia(c)));va(this,2,b)};
ua.prototype.b=function(a){var b=ta(arguments),c=sa(b);this.f?this.f.warn?this.f.warn.apply(this.f,[].concat(ia(c))):this.f.log.apply(this.f,[].concat(ia(c))):console.warn.apply(console,[].concat(ia(c)));va(this,3,b)};ua.prototype.error=function(a){var b=ta(arguments),c=sa(b);this.f?this.f.error?this.f.error.apply(this.f,[].concat(ia(c))):this.f.log.apply(this.f,[].concat(ia(c))):console.error.apply(console,[].concat(ia(c)));va(this,4,b)};var w=new ua;function xa(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var ya=window.location.href,za=window.location.href;
function Aa(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}
function Ba(a){var b;if(b=/^(https?:)\/\/github\.com\/([^/]+\/[^/]+)\/(blob\/|tree\/|raw\/)?(.*)$/.exec(a))a=b[1]+"//raw.githubusercontent.com/"+b[2]+"/"+(b[3]?"":"master/")+b[4];else if(b=/^(https?:)\/\/www\.aozora\.gr\.jp\/(cards\/[^/]+\/files\/[^/.]+\.html)$/.exec(a))a=b[1]+"//raw.githubusercontent.com/aozorabunko/aozorabunko/master/"+b[2];else if(b=/^(https?:)\/\/gist\.github\.com\/([^/]+\/\w+)(\/|$)(raw(\/|$))?(.*)$/.exec(a))a=b[1]+"//gist.githubusercontent.com/"+b[2]+"/raw/"+b[6];else if(b=
/^(https?:)\/\/(?:[^/.]+\.)?jsbin\.com\/(?!(?:blog|help)\b)(\w+)((\/\d+)?).*$/.exec(a))a=b[1]+"//output.jsbin.com/"+b[2]+b[3]+"/";return a}function Ea(a){a=new RegExp("#(.*&)?"+Fa(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function Ga(a,b){var c=new RegExp("#(.*&)?"+Fa("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function Ha(a){return null==a?a:a.toString()}
function Ia(){this.b=[null]}Ia.prototype.length=function(){return this.b.length-1};function Ja(a,b){a&&(b="-"+b,a=a.replace(/-/g,""),"moz"===a&&(a="Moz"));return a+b.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var Ka=" -webkit- -moz- -ms- -o- -epub-".split(" "),La={};
function Ma(a,b){if("writing-mode"===b){var c=document.createElement("span");if("-ms-"===a)return c.style.setProperty(a+b,"tb-rl"),"tb-rl"===c.style["writing-mode"];c.style.setProperty(a+b,"vertical-rl");return"vertical-rl"===c.style[a+b]}return"string"===typeof document.documentElement.style[Ja(a,b)]}
function Na(a){var b=La[a];if(b||null===b)return b;switch(a){case "writing-mode":if(Ma("-ms-","writing-mode"))return La[a]=["-ms-writing-mode"],["-ms-writing-mode"];break;case "filter":if(Ma("-webkit-","filter"))return La[a]=["-webkit-filter"],["-webkit-filter"];break;case "clip-path":if(Ma("-webkit-","clip-path"))return La[a]=["-webkit-clip-path","clip-path"];break;case "margin-inline-start":if(Ma("-webkit-","margin-start"))return La[a]=["-webkit-margin-start"],["-webkit-margin-start"];break;case "margin-inline-end":if(Ma("-webkit-",
"margin-end"))return La[a]=["-webkit-margin-end"],["-webkit-margin-end"];case "padding-inline-start":if(Ma("-webkit-","padding-start"))return La[a]=["-webkit-padding-start"],["-webkit-padding-start"];break;case "padding-inline-end":if(Ma("-webkit-","padding-end"))return La[a]=["-webkit-padding-end"],["-webkit-padding-end"]}for(var b=t(Ka),c=b.next();!c.done;c=b.next())if(c=c.value,Ma(c,a))return b=c+a,La[a]=[b],[b];w.b("Property not supported by the browser: ",a);return La[a]=null}
function x(a,b,c){try{var d=Na(b);d&&d.forEach(function(b){if("-ms-writing-mode"===b)switch(c){case "horizontal-tb":c="lr-tb";break;case "vertical-rl":c="tb-rl";break;case "vertical-lr":c="tb-lr"}a&&a.style&&a.style.setProperty(b,c)})}catch(e){w.b(e)}}function Oa(a,b,c){try{var d=La[b];return a.style.getPropertyValue(d?d[0]:b)}catch(e){}return c||""}
function Pa(a){var b=a.getAttributeNS("http://www.w3.org/XML/1998/namespace","lang");b||"http://www.w3.org/1999/xhtml"!=a.namespaceURI||(b=a.getAttribute("lang"));return b}function Qa(){this.b=[]}Qa.prototype.append=function(a){this.b.push(a);return this};Qa.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};function Ra(a){return"\\"+a.charCodeAt(0).toString(16)+" "}function Sa(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Ra)}
function Ta(a){return a.replace(/[\u0000-\u001F"]/g,Ra)}function Ua(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Va(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function Fa(a,b){return a.replace(/[^-a-zA-Z0-9_]/g,function(a){return("string"===typeof b?b:"\\u")+(65536|a.charCodeAt(0)).toString(16).substr(1)})}
function Wa(a){var b=":",b="string"===typeof b?b:"\\u",c=new RegExp(Fa(b)+"[0-9a-fA-F]{4}","g");return a.replace(c,function(a){var c=b,c="string"===typeof c?c:"\\u";return a.indexOf(c)?a:String.fromCharCode(parseInt(a.substring(c.length),16))})}function Xa(a){if(!a)throw"Assert failed";}function Ya(a,b){for(var c=0,d=a;;){Xa(c<=d);Xa(!c||!b(c-1));Xa(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function Za(a,b){return a-b}
function $a(a,b){for(var c={},d=t(a),e=d.next();!e.done;e=d.next()){var e=e.value,f=b(e);f&&!c[f]&&(c[f]=e)}return c}var ab={};function bb(a,b){for(var c={},d=t(a),e=d.next();!e.done;e=d.next()){var e=e.value,f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}function cb(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}function db(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function eb(){this.Pb={}}
function fb(a,b){var c=a.Pb[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}eb.prototype.addEventListener=function(a,b,c){c||((c=this.Pb[a])?c.push(b):this.Pb[a]=[b])};eb.prototype.removeEventListener=function(a,b,c){!c&&(a=this.Pb[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,1))};var gb=null,hb=null,ib=null,jb=null;function kb(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function lb(a){return"^"+a}function mb(a){return a.substr(1)}function nb(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,mb):a}
function ob(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),h=nb(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=h;break a}f.push(h)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function pb(){}pb.prototype.g=function(a){a.append("!")};pb.prototype.h=function(){return!1};function qb(a,b,c){this.index=a;this.id=b;this.Gb=c}
qb.prototype.g=function(a){a.append("/");a.append(this.index.toString());if(this.id||this.Gb)a.append("["),this.id&&a.append(this.id),this.Gb&&(a.append(";s="),a.append(this.Gb)),a.append("]")};
qb.prototype.h=function(a){if(1!=a.node.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.node,c=b.children,d=c.length,e=Math.floor(this.index/2)-1;0>e||!d?(c=b.firstChild,a.node=c||b):(c=c[Math.min(e,d-1)],this.index&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.K=!0),a.node=c);if(this.id&&(a.K||this.id!=kb(a.node)))throw Error("E_CFI_ID_MISMATCH");a.Gb=this.Gb;return!0};function sb(a,b,c,d){this.offset=a;this.f=b;this.b=c;this.Gb=d}
sb.prototype.h=function(a){if(0<this.offset&&!a.K){for(var b=this.offset,c=a.node;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.node=c;a.offset=b}a.Gb=this.Gb;return!0};
sb.prototype.g=function(a){a.append(":");a.append(this.offset.toString());if(this.f||this.b||this.Gb){a.append("[");if(this.f||this.b)this.f&&a.append(this.f.replace(/[\[\]\(\),=;^]/g,lb)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,lb));this.Gb&&(a.append(";s="),a.append(this.Gb));a.append("]")}};function tb(){this.pa=null}
function ub(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),h=c[3],c=ob(c[4]);f.push(new qb(g,h,Ha(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(h=c[4])&&(h=nb(h));var l=c[7];l&&(l=nb(l));c=ob(c[10]);f.push(new sb(g,h,l,Ha(c.s)));break;case "!":e++;f.push(new pb);break;case "~":case "@":case "":a.pa=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function vb(a,b){for(var c={node:b.documentElement,offset:0,K:!1,Gb:null,qd:null},d=0;d<a.pa.length;d++)if(!a.pa[d].h(c)){c.qd=new tb;c.qd.pa=a.pa.slice(d+1);break}return c}
tb.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function wb(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",l="";b;){switch(b.nodeType){case 3:case 4:case 5:var k=b.textContent,m=k.length;d?(c+=m,h||(h=k)):(c>m&&(c=m),d=!0,h=k.substr(0,c),l=k.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||h||l)h=a.trim(h,!1),l=a.trim(l,!0),f.push(new sb(c,h,l,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:kb(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new qb(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.pa?(f.push(new pb),a.pa=f.concat(a.pa)):a.pa=f}tb.prototype.toString=function(){if(!this.pa)return"";var a=new Qa;a.append("epubcfi(");for(var b=0;b<this.pa.length;b++)this.pa[b].g(a);a.append(")");return a.toString()};function xb(){return{fontFamily:"serif",lineHeight:1.25,margin:8,we:!1,oe:25,ve:!1,He:!1,ub:!1,Ac:1,af:{vivliostyle:!0,print:!0},sc:void 0}}function yb(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,we:a.we,oe:a.oe,ve:a.ve,He:a.He,ub:a.ub,Ac:a.Ac,af:Object.assign({},a.af),sc:a.sc?Object.assign({},a.sc):void 0}}var zb=xb(),Ab={};function Bb(a,b,c,d){a=Math.min((a-0)/c,(b-0)/d);return"matrix("+a+",0,0,"+a+",0,0)"}function Cb(a){return'"'+Ta(""+a)+'"'}
function Db(a){return Sa(""+a)}function Eb(a,b){return a?Sa(a)+"."+Sa(b):Sa(b)}var Fb=0;
function Gb(a,b){this.parent=a;this.u="S"+Fb++;this.children=[];this.b=new Hb(this,0);this.f=new Hb(this,1);this.j=new Hb(this,!0);this.h=new Hb(this,!1);a&&a.children.push(this);this.values={};this.D={};this.A={};this.l=b;if(!a){var c=this.A;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=Bb;c["css-string"]=Cb;c["css-name"]=Db;c["typeof"]=function(a){return typeof a};Ib(this,"page-width",function(){return this.hc()});Ib(this,"page-height",
function(){return this.gc()});Ib(this,"pref-font-family",function(){return this.$.fontFamily});Ib(this,"pref-night-mode",function(){return this.$.He});Ib(this,"pref-hyphenate",function(){return this.$.we});Ib(this,"pref-margin",function(){return this.$.margin});Ib(this,"pref-line-height",function(){return this.$.lineHeight});Ib(this,"pref-column-width",function(){return this.$.oe*this.fontSize});Ib(this,"pref-horizontal",function(){return this.$.ve});Ib(this,"pref-spread-view",function(){return this.$.ub})}}
function Ib(a,b,c){a.values[b]=new Jb(a,c,b)}function Kb(a,b){a.values["page-number"]=b}function Lb(a,b){a.A["has-content"]=b}function Mb(a){switch(a.toLowerCase()){case "vw":case "vh":case "vi":case "vb":case "vmin":case "vmax":case "pvw":case "pvh":case "pvi":case "pvb":case "pvmin":case "pvmax":return!0;default:return!1}}var Nb={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,dppx:1,dpi:1/96,dpcm:2.54/96};
function Ob(a){switch(a){case "q":case "rem":return!0;default:return!1}}function Pb(a,b,c,d){this.wb=b;this.Mb=c;this.Y=null;this.hc=function(){return this.Y?this.Y:this.$.ub?Math.floor(b/2)-this.$.Ac:b};this.R=null;this.gc=function(){return this.R?this.R:c};this.u=d;this.Za=null;this.fontSize=function(){return this.Za?this.Za:d};this.$=zb;this.J={};this.G=this.Z=this.ca=null}function Qb(a,b){a.J[b.u]={};for(var c=0;c<b.children.length;c++)Qb(a,b.children[c])}
function Rb(a,b,c){if(Mb(b)){var d=a.hc()/100,e=a.gc()/100,f=null!=a.ca?a.ca/100:d,g=null!=a.Z?a.Z/100:e;switch(b){case "vw":return f;case "vh":return g;case "vi":return a.G?g:f;case "vb":return a.G?f:g;case "vmin":return f<g?f:g;case "vmax":return f>g?f:g;case "pvw":return d;case "pvh":return e;case "pvi":return a.G?e:d;case "pvb":return a.G?d:e;case "pvmin":return d<e?d:e;case "pvmax":return d>e?d:e}}return"em"==b||"rem"==b?c?a.u:a.fontSize():"ex"==b?Nb.ex*(c?a.u:a.fontSize())/Nb.em:Nb[b]}
function Sb(a,b,c){do{var d=b.values[c];if(d||b.l&&(d=b.l.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}function Tb(a,b,c,d,e){do{var f=b.D[c];if(f||b.l&&(f=b.l.call(a,c,!0)))return f;if(f=b.A[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new Hb(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function Ub(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.hc();break;case "height":f=a.gc();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&!c)return!!f;return!1}function Vb(a){this.b=a;this.g="_"+Fb++}n=Vb.prototype;n.toString=function(){var a=new Qa;this.Ga(a,0);return a.toString()};n.Ga=function(){throw Error("F_ABSTRACT");};n.xb=function(){throw Error("F_ABSTRACT");};n.lb=function(){return this};n.tc=function(a){return a===this};function Wb(a,b,c,d){var e=d[a.g];if(null!=e)return e===Ab?!1:e;d[a.g]=Ab;b=a.tc(b,c,d);return d[a.g]=b}
n.evaluate=function(a){var b;b=(b=a.J[this.b.u])?b[this.g]:void 0;if("undefined"!=typeof b)return b;b=this.xb(a);var c=this.g,d=this.b,e=a.J[d.u];e||(e={},a.J[d.u]=e);return e[c]=b};n.gf=function(){return!1};function Xb(a,b){Vb.call(this,a);this.f=b}v(Xb,Vb);n=Xb.prototype;n.Ve=function(){throw Error("F_ABSTRACT");};n.bf=function(){throw Error("F_ABSTRACT");};n.xb=function(a){a=this.f.evaluate(a);return this.bf(a)};n.tc=function(a,b,c){return a===this||Wb(this.f,a,b,c)};
n.Ga=function(a,b){10<b&&a.append("(");a.append(this.Ve());this.f.Ga(a,10);10<b&&a.append(")")};n.lb=function(a,b){var c=this.f.lb(a,b);return c===this.f?this:new this.constructor(this.b,c)};function Yb(a,b,c){Vb.call(this,a);this.f=b;this.h=c}v(Yb,Vb);n=Yb.prototype;n.Bd=function(){throw Error("F_ABSTRACT");};n.hb=function(){throw Error("F_ABSTRACT");};n.Fb=function(){throw Error("F_ABSTRACT");};n.xb=function(a){var b=this.f.evaluate(a);a=this.h.evaluate(a);return this.Fb(b,a)};
n.tc=function(a,b,c){return a===this||Wb(this.f,a,b,c)||Wb(this.h,a,b,c)};n.Ga=function(a,b){var c=this.Bd();c<=b&&a.append("(");this.f.Ga(a,c);a.append(this.hb());this.h.Ga(a,c);c<=b&&a.append(")")};n.lb=function(a,b){var c=this.f.lb(a,b),d=this.h.lb(a,b);return c===this.f&&d===this.h?this:new this.constructor(this.b,c,d)};function Zb(a,b,c){Yb.call(this,a,b,c)}v(Zb,Yb);Zb.prototype.Bd=function(){return 1};function $b(a,b,c){Yb.call(this,a,b,c)}v($b,Yb);$b.prototype.Bd=function(){return 2};
function ac(a,b,c){Yb.call(this,a,b,c)}v(ac,Yb);ac.prototype.Bd=function(){return 3};function bc(a,b,c){Yb.call(this,a,b,c)}v(bc,Yb);bc.prototype.Bd=function(){return 4};function cc(a,b){Xb.call(this,a,b)}v(cc,Xb);cc.prototype.Ve=function(){return"!"};cc.prototype.bf=function(a){return!a};function dc(a,b){Xb.call(this,a,b)}v(dc,Xb);dc.prototype.Ve=function(){return"-"};dc.prototype.bf=function(a){return-a};function ec(a,b,c){Yb.call(this,a,b,c)}v(ec,Zb);ec.prototype.hb=function(){return"&&"};
ec.prototype.xb=function(a){return this.f.evaluate(a)&&this.h.evaluate(a)};function fc(a,b,c){Yb.call(this,a,b,c)}v(fc,ec);fc.prototype.hb=function(){return" and "};function gc(a,b,c){Yb.call(this,a,b,c)}v(gc,Zb);gc.prototype.hb=function(){return"||"};gc.prototype.xb=function(a){return this.f.evaluate(a)||this.h.evaluate(a)};function hc(a,b,c){Yb.call(this,a,b,c)}v(hc,gc);hc.prototype.hb=function(){return", "};function ic(a,b,c){Yb.call(this,a,b,c)}v(ic,$b);ic.prototype.hb=function(){return"<"};
ic.prototype.Fb=function(a,b){return a<b};function jc(a,b,c){Yb.call(this,a,b,c)}v(jc,$b);jc.prototype.hb=function(){return"<="};jc.prototype.Fb=function(a,b){return a<=b};function kc(a,b,c){Yb.call(this,a,b,c)}v(kc,$b);kc.prototype.hb=function(){return">"};kc.prototype.Fb=function(a,b){return a>b};function lc(a,b,c){Yb.call(this,a,b,c)}v(lc,$b);lc.prototype.hb=function(){return">="};lc.prototype.Fb=function(a,b){return a>=b};function mc(a,b,c){Yb.call(this,a,b,c)}v(mc,$b);mc.prototype.hb=function(){return"=="};
mc.prototype.Fb=function(a,b){return a==b};function nc(a,b,c){Yb.call(this,a,b,c)}v(nc,$b);nc.prototype.hb=function(){return"!="};nc.prototype.Fb=function(a,b){return a!=b};function oc(a,b,c){Yb.call(this,a,b,c)}v(oc,ac);oc.prototype.hb=function(){return"+"};oc.prototype.Fb=function(a,b){return a+b};function pc(a,b,c){Yb.call(this,a,b,c)}v(pc,ac);pc.prototype.hb=function(){return" - "};pc.prototype.Fb=function(a,b){return a-b};function qc(a,b,c){Yb.call(this,a,b,c)}v(qc,bc);qc.prototype.hb=function(){return"*"};
qc.prototype.Fb=function(a,b){return a*b};function rc(a,b,c){Yb.call(this,a,b,c)}v(rc,bc);rc.prototype.hb=function(){return"/"};rc.prototype.Fb=function(a,b){return a/b};function sc(a,b,c){Yb.call(this,a,b,c)}v(sc,bc);sc.prototype.hb=function(){return"%"};sc.prototype.Fb=function(a,b){return a%b};function tc(a,b,c){Vb.call(this,a);this.L=b;this.ka=c.toLowerCase()}v(tc,Vb);tc.prototype.Ga=function(a){a.append(this.L.toString());a.append(Sa(this.ka))};
tc.prototype.xb=function(a){return this.L*Rb(a,this.ka,!1)};function uc(a,b){Vb.call(this,a);this.f=b}v(uc,Vb);uc.prototype.Ga=function(a){a.append(this.f)};uc.prototype.xb=function(a){return Sb(a,this.b,this.f).evaluate(a)};uc.prototype.tc=function(a,b,c){return a===this||Wb(Sb(b,this.b,this.f),a,b,c)};function vc(a,b,c){Vb.call(this,a);this.f=b;this.name=c}v(vc,Vb);vc.prototype.Ga=function(a){this.f&&a.append("not ");a.append(Sa(this.name))};
vc.prototype.xb=function(a){var b=this.name;a="all"===b||!!a.$.af[b];return this.f?!a:a};vc.prototype.tc=function(a,b,c){return a===this||Wb(this.value,a,b,c)};vc.prototype.gf=function(){return!0};function Jb(a,b,c){Vb.call(this,a);this.Nc=b;this.Vc=c}v(Jb,Vb);Jb.prototype.Ga=function(a){a.append(this.Vc)};Jb.prototype.xb=function(a){return this.Nc.call(a)};function wc(a,b,c){Vb.call(this,a);this.h=b;this.f=c}v(wc,Vb);
wc.prototype.Ga=function(a){a.append(this.h);var b=this.f;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].Ga(a,0);a.append(")")};wc.prototype.xb=function(a){return Tb(a,this.b,this.h,this.f,!1).lb(a,this.f).evaluate(a)};wc.prototype.tc=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.f.length;d++)if(Wb(this.f[d],a,b,c))return!0;return Wb(Tb(b,this.b,this.h,this.f,!0),a,b,c)};
wc.prototype.lb=function(a,b){for(var c=this.f,d=c,e=0;e<c.length;e++){var f=c[e].lb(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.f?this:new wc(this.b,this.h,c)};function xc(a,b,c,d){Vb.call(this,a);this.f=b;this.j=c;this.h=d}v(xc,Vb);xc.prototype.Ga=function(a,b){0<b&&a.append("(");this.f.Ga(a,0);a.append("?");this.j.Ga(a,0);a.append(":");this.h.Ga(a,0);0<b&&a.append(")")};
xc.prototype.xb=function(a){return this.f.evaluate(a)?this.j.evaluate(a):this.h.evaluate(a)};xc.prototype.tc=function(a,b,c){return a===this||Wb(this.f,a,b,c)||Wb(this.j,a,b,c)||Wb(this.h,a,b,c)};xc.prototype.lb=function(a,b){var c=this.f.lb(a,b),d=this.j.lb(a,b),e=this.h.lb(a,b);return c===this.f&&d===this.j&&e===this.h?this:new xc(this.b,c,d,e)};function Hb(a,b){Vb.call(this,a);this.f=b}v(Hb,Vb);
Hb.prototype.Ga=function(a){switch(typeof this.f){case "number":case "boolean":a.append(this.f.toString());break;case "string":a.append('"');a.append(Ta(this.f));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};Hb.prototype.xb=function(){return this.f};function yc(a,b,c){Vb.call(this,a);this.name=b;this.value=c}v(yc,Vb);yc.prototype.Ga=function(a){a.append("(");a.append(Ta(this.name.name));a.append(":");this.value.Ga(a,0);a.append(")")};
yc.prototype.xb=function(a){return Ub(a,this.name.name,this.value)};yc.prototype.tc=function(a,b,c){return a===this||Wb(this.value,a,b,c)};yc.prototype.lb=function(a,b){var c=this.value.lb(a,b);return c===this.value?this:new yc(this.b,this.name,c)};function zc(a,b){Vb.call(this,a);this.index=b}v(zc,Vb);zc.prototype.Ga=function(a){a.append("$");a.append(this.index.toString())};zc.prototype.lb=function(a,b){var c=b[this.index];if(!c)throw Error("Parameter missing: "+this.index);return c};
function Ac(a,b,c){return b===a.h||b===a.b||c==a.h||c==a.b?a.h:b===a.j||b===a.f?c:c===a.j||c===a.f?b:new ec(a,b,c)}function y(a,b,c){return b===a.b?c:c===a.b?b:new oc(a,b,c)}function B(a,b,c){return b===a.b?new dc(a,c):c===a.b?b:new pc(a,b,c)}function Bc(a,b,c){return b===a.b||c===a.b?a.b:b===a.f?c:c===a.f?b:new qc(a,b,c)}function Cc(a,b,c){return b===a.b?a.b:c===a.f?b:new rc(a,b,c)};var Dc={};function Ec(){}n=Ec.prototype;n.oc=function(a){for(var b=0;b<a.length;b++)a[b].fa(this)};n.Re=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};n.Se=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};n.yd=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};n.nc=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};n.Zc=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};n.Yc=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};n.Xc=function(a){return this.Yc(a)};
n.ge=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};n.$c=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};n.Ub=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};n.mc=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};n.Xb=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};n.Wc=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function Fc(){}v(Fc,Ec);n=Fc.prototype;
n.oc=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.fa(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};n.yd=function(a){return a};n.nc=function(a){return a};n.Se=function(a){return a};n.Zc=function(a){return a};n.Yc=function(a){return a};n.Xc=function(a){return a};n.ge=function(a){return a};n.$c=function(a){return a};n.Ub=function(a){var b=this.oc(a.values);return b===a.values?a:new Gc(b)};
n.mc=function(a){var b=this.oc(a.values);return b===a.values?a:new Hc(b)};n.Xb=function(a){var b=this.oc(a.values);return b===a.values?a:new Ic(a.name,b)};n.Wc=function(a){return a};function Jc(){}n=Jc.prototype;n.toString=function(){var a=new Qa;this.$a(a,!0);return a.toString()};n.stringValue=function(){var a=new Qa;this.$a(a,!1);return a.toString()};n.Aa=function(){throw Error("F_ABSTRACT");};n.$a=function(a){a.append("[error]")};n.ef=function(){return!1};n.xc=function(){return!1};n.hf=function(){return!1};
n.Vf=function(){return!1};n.Sd=function(){return!1};function Kc(){if(C)throw Error("E_INVALID_CALL");}v(Kc,Jc);Kc.prototype.Aa=function(a){return new Hb(a,"")};Kc.prototype.$a=function(){};Kc.prototype.fa=function(a){return a.Re(this)};var C=new Kc;function Lc(){if(Mc)throw Error("E_INVALID_CALL");}v(Lc,Jc);Lc.prototype.Aa=function(a){return new Hb(a,"/")};Lc.prototype.$a=function(a){a.append("/")};Lc.prototype.fa=function(a){return a.Se(this)};var Mc=new Lc;function Nc(a){this.Vc=a}v(Nc,Jc);
Nc.prototype.Aa=function(a){return new Hb(a,this.Vc)};Nc.prototype.$a=function(a,b){b?(a.append('"'),a.append(Ta(this.Vc)),a.append('"')):a.append(this.Vc)};Nc.prototype.fa=function(a){return a.yd(this)};function Oc(a){this.name=a;if(Dc[a])throw Error("E_INVALID_CALL");Dc[a]=this}v(Oc,Jc);Oc.prototype.Aa=function(a){return new Hb(a,this.name)};Oc.prototype.$a=function(a,b){b?a.append(Sa(this.name)):a.append(this.name)};Oc.prototype.fa=function(a){return a.nc(this)};Oc.prototype.Vf=function(){return!0};
function D(a){var b=Dc[a];b||(b=new Oc(a));return b}function F(a,b){this.L=a;this.ka=b.toLowerCase()}v(F,Jc);F.prototype.Aa=function(a,b){return this.L?b&&"%"==this.ka?100==this.L?b:new qc(a,b,new Hb(a,this.L/100)):new tc(a,this.L,this.ka):a.b};F.prototype.$a=function(a){a.append(this.L.toString());a.append(this.ka)};F.prototype.fa=function(a){return a.Zc(this)};F.prototype.xc=function(){return!0};function Pc(a){this.L=a}v(Pc,Jc);
Pc.prototype.Aa=function(a){return this.L?1==this.L?a.f:new Hb(a,this.L):a.b};Pc.prototype.$a=function(a){a.append(this.L.toString())};Pc.prototype.fa=function(a){return a.Yc(this)};Pc.prototype.hf=function(){return!0};function Qc(a){this.L=a}v(Qc,Pc);Qc.prototype.fa=function(a){return a.Xc(this)};function Rc(a){this.b=a}v(Rc,Jc);Rc.prototype.$a=function(a){a.append("#");var b=this.b.toString(16);a.append("000000".substr(b.length));a.append(b)};Rc.prototype.fa=function(a){return a.ge(this)};
function Sc(a){this.url=a}v(Sc,Jc);Sc.prototype.$a=function(a){a.append('url("');a.append(Ta(this.url));a.append('")')};Sc.prototype.fa=function(a){return a.$c(this)};function Tc(a,b,c,d){var e=b.length;b[0].$a(a,d);for(var f=1;f<e;f++)a.append(c),b[f].$a(a,d)}function Gc(a){this.values=a}v(Gc,Jc);Gc.prototype.$a=function(a,b){Tc(a,this.values," ",b)};Gc.prototype.fa=function(a){return a.Ub(this)};Gc.prototype.Sd=function(){return!0};function Hc(a){this.values=a}v(Hc,Jc);
Hc.prototype.$a=function(a,b){Tc(a,this.values,",",b)};Hc.prototype.fa=function(a){return a.mc(this)};function Ic(a,b){this.name=a;this.values=b}v(Ic,Jc);Ic.prototype.$a=function(a,b){a.append(Sa(this.name));a.append("(");Tc(a,this.values,",",b);a.append(")")};Ic.prototype.fa=function(a){return a.Xb(this)};function G(a){this.Kc=a}v(G,Jc);G.prototype.Aa=function(){return this.Kc};G.prototype.$a=function(a){a.append("-epubx-expr(");this.Kc.Ga(a,0);a.append(")")};G.prototype.fa=function(a){return a.Wc(this)};
G.prototype.ef=function(){return!0};function Uc(a,b){if(a){if(a.xc())return Rb(b,a.ka,!1)*a.L;if(a.hf())return a.L}return 0}var Vc=D("absolute"),Wc=D("all"),Xc=D("always"),Yc=D("auto");D("avoid");var Zc=D("balance"),$c=D("balance-all"),ad=D("block"),bd=D("block-end"),cd=D("block-start"),dd=D("both"),ed=D("bottom"),fd=D("border-box"),gd=D("break-all"),hd=D("break-word"),id=D("crop"),jd=D("cross");D("column");
var kd=D("exclusive"),ld=D("false"),md=D("fixed"),nd=D("flex"),od=D("footnote"),pd=D("footer"),qd=D("header");D("hidden");var rd=D("horizontal-tb"),sd=D("inherit"),td=D("inline"),ud=D("inline-block"),vd=D("inline-end"),wd=D("inline-start"),xd=D("landscape"),yd=D("left"),zd=D("line"),Ad=D("list-item"),Bd=D("ltr");D("manual");var J=D("none"),Cd=D("normal"),Dd=D("oeb-page-foot"),Ed=D("oeb-page-head"),Fd=D("page"),Gd=D("relative"),Hd=D("right"),Id=D("same"),Jd=D("scale"),Kd=D("snap-block");D("spread");
var Ld=D("static"),Md=D("rtl"),Nd=D("table"),Od=D("table-caption"),Pd=D("table-cell"),Qd=D("table-footer-group"),Rd=D("table-header-group");D("table-row");var Sd=D("top"),Td=D("transparent"),Ud=D("vertical-lr"),Vd=D("vertical-rl"),Wd=D("visible"),Xd=D("true"),Yd=new F(100,"%"),Zd=new F(100,"pvw"),$d=new F(100,"pvh"),ae=new F(0,"px"),be={"font-size":1,color:2};function ce(a,b){return(be[a]||Number.MAX_VALUE)-(be[b]||Number.MAX_VALUE)};var de={SIMPLE_PROPERTY:"SIMPLE_PROPERTY",PREPROCESS_SINGLE_DOCUMENT:"PREPROCESS_SINGLE_DOCUMENT",PREPROCESS_TEXT_CONTENT:"PREPROCESS_TEXT_CONTENT",PREPROCESS_ELEMENT_STYLE:"PREPROCESS_ELEMENT_STYLE",POLYFILLED_INHERITED_PROPS:"POLYFILLED_INHERITED_PROPS",CONFIGURATION:"CONFIGURATION",RESOLVE_TEXT_NODE_BREAKER:"RESOLVE_TEXT_NODE_BREAKER",RESOLVE_FORMATTING_CONTEXT:"RESOLVE_FORMATTING_CONTEXT",RESOLVE_LAYOUT_PROCESSOR:"RESOLVE_LAYOUT_PROCESSOR",POST_LAYOUT_BLOCK:"POST_LAYOUT_BLOCK"},ee={};
function fe(a,b){if(de[a]){var c=ee[a];c||(c=ee[a]=[]);c.push(b)}else w.b(Error("Skipping unknown plugin hook '"+a+"'."))}function ge(a){return ee[a]||[]}na("vivliostyle.plugin.registerHook",fe);na("vivliostyle.plugin.removeHook",function(a,b){if(de[a]){var c=ee[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else w.b(Error("Ignoring unknown plugin hook '"+a+"'."))});var he=null,ie=null;function L(a){if(!he)throw Error("E_TASK_NO_CONTEXT");he.name||(he.name=a);var b=he;a=new je(b,b.top,a);b.top=a;a.b=ke;return a}function M(a){return new le(a)}function me(a,b,c){a=L(a);a.j=c;try{b(a)}catch(d){ne(a.f,d,a)}return a.result()}function oe(a){var b=pe,c;he?c=he.f:(c=ie)||(c=new qe(new re));b(c,a,void 0)}var ke=1;function re(){}re.prototype.currentTime=function(){return(new Date).valueOf()};function se(a,b){return setTimeout(a,b)}
function qe(a){this.g=a;this.h=1;this.slice=25;this.l=0;this.f=new Ia;this.b=this.u=null;this.j=!1;this.order=0;ie||(ie=this)}
function te(a){if(!a.j){var b=a.f.b[1].b,c=a.g.currentTime();if(null!=a.b){if(c+a.h>a.u)return;clearTimeout(a.b)}b-=c;b<=a.h&&(b=a.h);a.u=c+b;a.b=se(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.j=!0;try{var b=a.g.currentTime();for(a.l=b+a.slice;a.f.length();){var c=a.f.b[1];if(c.b>b)break;var f=a.f,g=f.b.pop(),h=f.b.length;if(1<h){for(var l=1;;){var k=2*l;if(k>=h)break;if(0<ue(f.b[k],g))k+1<h&&0<ue(f.b[k+1],f.b[k])&&k++;else if(k+1<h&&0<ue(f.b[k+1],g))k++;else break;f.b[l]=f.b[k];
l=k}f.b[l]=g}if(!c.g){var m=c.f;c.f=null;m&&m.b==c&&(m.b=null,l=he,he=m,O(m.top,c.result),he=l)}b=a.g.currentTime();if(b>=a.l)break}}catch(p){w.error(p)}a.j=!1;a.f.length()&&te(a)},b)}}qe.prototype.tb=function(a,b){var c=this.g.currentTime();a.order=this.order++;a.b=c+(b||0);a:{for(var c=this.f,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<ue(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}te(this)};
function pe(a,b,c){var d=new ve(a,c||"");d.top=new je(d,null,"bootstrap");d.top.b=ke;d.top.then(function(){function a(){d.j=!1;for(var a=t(d.h),b=a.next();!b.done;b=a.next()){b=b.value;try{b()}catch(h){w.error(h)}}}try{b().then(function(b){d.result=b;a()})}catch(f){ne(d,f),a()}});c=he;he=d;a.tb(we(d.top,"bootstrap"));he=c;return d}function xe(a){this.f=a;this.order=this.b=0;this.result=null;this.g=!1}function ue(a,b){return b.b-a.b||b.order-a.order}
xe.prototype.tb=function(a,b){this.result=a;this.f.f.tb(this,b)};function ve(a,b){this.f=a;this.name=b;this.h=[];this.g=null;this.j=!0;this.b=this.top=this.l=this.result=null}function ye(a,b){a.h.push(b)}ve.prototype.join=function(){var a=L("Task.join");if(this.j){var b=we(a,this),c=this;ye(this,function(){b.tb(c.result)})}else O(a,this.result);return a.result()};
function ne(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.g=b;a.top&&!a.top.j;)a.top=a.top.parent;a.top?(b=a.g,a.g=null,a.top.j(a.top,b)):a.g&&w.error(a.g,"Unhandled exception in task",a.name)}function le(a){this.value=a}n=le.prototype;n.then=function(a){a(this.value)};n.ea=function(a){return a(this.value)};n.Fc=function(a){return new le(a)};
n.La=function(a){O(a,this.value)};n.Xa=function(){return!1};n.get=function(){return this.value};function ze(a){this.b=a}n=ze.prototype;n.then=function(a){this.b.then(a)};n.ea=function(a){if(this.Xa()){var b=new je(this.b.f,this.b.parent,"AsyncResult.thenAsync");b.b=ke;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){O(b,a)})});return b.result()}return a(this.b.g)};n.Fc=function(a){return this.Xa()?this.ea(function(){return new le(a)}):new le(a)};
n.La=function(a){this.Xa()?this.then(function(b){O(a,b)}):O(a,this.b.g)};n.Xa=function(){return this.b.b==ke};n.get=function(){if(this.Xa())throw Error("Result is pending");return this.b.g};function je(a,b,c){this.f=a;this.parent=b;this.name=c;this.g=null;this.b=0;this.j=this.h=null}function Ae(a){if(!he)throw Error("F_TASK_NO_CONTEXT");if(a!==he.top)throw Error("F_TASK_NOT_TOP_FRAME");}je.prototype.result=function(){return new ze(this)};
function O(a,b){Ae(a);he.g||(a.g=b);a.b=2;var c=a.parent;he.top=c;if(a.h){try{a.h(b)}catch(d){ne(a.f,d,c)}a.b=3}}je.prototype.then=function(a){switch(this.b){case ke:if(this.h)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.h=a;break;case 2:var b=this.f,c=this.parent;try{a(this.g),this.b=3}catch(d){this.b=3,ne(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function Be(){var a=L("Frame.timeSlice"),b=a.f.f;b.g.currentTime()>=b.l?(w.debug("-- time slice --"),we(a).tb(!0)):O(a,!0);return a.result()}function Ce(a){var b=L("Frame.sleep");we(b).tb(!0,a);return b.result()}function De(a){function b(d){try{for(;d;){var e=a();if(e.Xa()){e.then(b);return}e.then(function(a){d=a})}O(c,!0)}catch(f){ne(c.f,f,c)}}var c=L("Frame.loop");b(!0);return c.result()}
function Ee(a){var b=he;if(!b)throw Error("E_TASK_NO_CONTEXT");return De(function(){var c;do c=new Fe(b,b.top),b.top=c,c.b=ke,a(c),c=c.result();while(!c.Xa()&&c.get());return c})}function we(a,b){Ae(a);if(a.f.b)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new xe(a.f);a.f.b=c;he=null;a.f.l=b||null;return c}function Fe(a,b){je.call(this,a,b,"loop")}v(Fe,je);function P(a){O(a,!0)}function Q(a){O(a,!1)};function Ge(a,b){this.fetch=a;this.name=b;this.f=!1;this.b=this.h=null;this.g=[]}Ge.prototype.start=function(){if(!this.b){var a=this;this.b=pe(he.f,function(){var b=L("Fetcher.run");a.fetch().then(function(c){var d=a.g;a.f=!0;a.h=c;a.b=null;a.g=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){w.error(f,"Error:")}O(b,c)});return b.result()},this.name)}};function He(a,b){a.f?b(a.h):a.g.push(b)}Ge.prototype.get=function(){if(this.f)return M(this.h);this.start();return this.b.join()};
function Ie(a){if(!a.length)return M(!0);if(1==a.length)return a[0].get().Fc(!0);var b=L("waitForFetches"),c=0;De(function(){for(;c<a.length;){var b=a[c++];if(!b.f)return b.get().Fc(!0)}return M(!1)}).then(function(){O(b,!0)});return b.result()}
function Je(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new Ge(function(){function e(b){l||(l=!0,"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height")),h.tb(b?b.type:"timeout"))}var g=L("loadImage"),h=we(g,a),l=!1;a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",
b),setTimeout(e,300)):a.src=b;return g.result()},"loadElement "+b);e.start();return e};function Ke(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function Le(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,Ke)}function Me(){this.type=0;this.b=!1;this.L=0;this.text="";this.position=0}
function Ne(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var Oe=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];Oe[NaN]=80;
var Pe=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];Pe[NaN]=43;
var Qe=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];Pe[NaN]=43;
var Re=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];Re[NaN]=35;
var Se=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];Se[NaN]=45;
var Te=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];Te[NaN]=37;
var Ue=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];Ue[NaN]=38;
var Ve=Ne(35,[61,36]),We=Ne(35,[58,77]),Xe=Ne(35,[61,36,124,50]),Ye=Ne(35,[38,51]),Ze=Ne(35,[42,54]),$e=Ne(39,[42,55]),af=Ne(54,[42,55,47,56]),bf=Ne(62,[62,56]),cf=Ne(35,[61,36,33,70]),df=Ne(62,[45,71]),ef=Ne(63,[45,56]),ff=Ne(76,[9,72,10,72,13,72,32,72]),gf=Ne(39,[39,46,10,72,13,72,92,48]),hf=Ne(39,[34,46,10,72,13,72,92,49]),jf=Ne(39,[39,47,10,74,13,74,92,48]),kf=Ne(39,[34,47,10,74,13,74,92,49]),lf=Ne(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),mf=Ne(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),nf=Ne(39,[39,68,10,74,13,74,92,75,NaN,67]),of=Ne(39,[34,68,10,74,13,74,92,75,NaN,67]),pf=Ne(72,[9,39,10,39,13,39,32,39,41,69]);function qf(a,b){this.l=b;this.g=15;this.u=a;this.j=Array(this.g+1);this.b=-1;for(var c=this.position=this.f=this.h=0;c<=this.g;c++)this.j[c]=new Me}function R(a){a.h==a.f&&rf(a);return a.j[a.f]}function sf(a,b){(a.h-a.f&a.g)<=b&&rf(a);return a.j[a.f+b&a.g]}function S(a){a.f=a.f+1&a.g}
function tf(a){if(0>a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.f=a.b;a.b=-1}qf.prototype.error=function(a,b,c){this.l&&this.l.error(c,b)};
function rf(a){var b=a.h,c=0<=a.b?a.b:a.f,d=a.g;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.g+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.h;)c[e]=a.j[d],d==a.f&&(a.f=e),d=d+1&a.g,e++;a.b=0;a.h=e;a.g=b;for(a.j=c;e<=b;)c[e++]=new Me;b=a.h;c=d=a.g}for(var e=Oe,f=a.u,g=a.position,h=a.j,l=0,k=0,m="",p=0,q=!1,r=h[b],z=-9;;){var u=f.charCodeAt(g);switch(e[u]||e[65]){case 72:l=51;m=isNaN(u)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;q=!0;continue;case 2:k=
g++;e=Te;continue;case 3:l=1;k=g++;e=Pe;continue;case 4:k=g++;l=31;e=Ve;continue;case 33:l=2;k=++g;e=gf;continue;case 34:l=2;k=++g;e=hf;continue;case 6:k=++g;l=7;e=Pe;continue;case 7:k=g++;l=32;e=Ve;continue;case 8:k=g++;l=21;break;case 9:k=g++;l=32;e=Ye;continue;case 10:k=g++;l=10;break;case 11:k=g++;l=11;break;case 12:k=g++;l=36;e=Ve;continue;case 13:k=g++;l=23;break;case 14:k=g++;l=16;break;case 15:l=24;k=g++;e=Re;continue;case 16:k=g++;e=Qe;continue;case 78:k=g++;l=9;e=Pe;continue;case 17:k=g++;
l=19;e=Ze;continue;case 18:k=g++;l=18;e=We;continue;case 77:g++;l=50;break;case 19:k=g++;l=17;break;case 20:k=g++;l=38;e=cf;continue;case 21:k=g++;l=39;e=Ve;continue;case 22:k=g++;l=37;e=Ve;continue;case 23:k=g++;l=22;break;case 24:k=++g;l=20;e=Pe;continue;case 25:k=g++;l=14;break;case 26:k=g++;l=15;break;case 27:k=g++;l=12;break;case 28:k=g++;l=13;break;case 29:z=k=g++;l=1;e=ff;continue;case 30:k=g++;l=33;e=Ve;continue;case 31:k=g++;l=34;e=Xe;continue;case 32:k=g++;l=35;e=Ve;continue;case 35:break;
case 36:g++;l=l+41-31;break;case 37:l=5;p=parseInt(f.substring(k,g),10);break;case 38:l=4;p=parseFloat(f.substring(k,g));break;case 39:g++;continue;case 40:l=3;p=parseFloat(f.substring(k,g));k=g++;e=Pe;continue;case 41:l=3;p=parseFloat(f.substring(k,g));m="%";k=g++;break;case 42:g++;e=Ue;continue;case 43:m=f.substring(k,g);break;case 44:z=g++;e=ff;continue;case 45:m=Le(f.substring(k,g));break;case 46:m=f.substring(k,g);g++;break;case 47:m=Le(f.substring(k,g));g++;break;case 48:z=g;g+=2;e=jf;continue;
case 49:z=g;g+=2;e=kf;continue;case 50:g++;l=25;break;case 51:g++;l=26;break;case 52:m=f.substring(k,g);if(1==l){g++;if("url"==m.toLowerCase()){e=lf;continue}l=6}break;case 53:m=Le(f.substring(k,g));if(1==l){g++;if("url"==m.toLowerCase()){e=lf;continue}l=6}break;case 54:e=$e;g++;continue;case 55:e=af;g++;continue;case 56:e=Oe;g++;continue;case 57:e=bf;g++;continue;case 58:l=5;e=Te;g++;continue;case 59:l=4;e=Ue;g++;continue;case 60:l=1;e=Pe;g++;continue;case 61:l=1;e=ff;z=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:k=g++;e=mf;continue;case 65:k=++g;e=nf;continue;case 66:k=++g;e=of;continue;case 67:l=8;m=Le(f.substring(k,g));g++;break;case 69:g++;break;case 70:e=df;g++;continue;case 71:e=ef;g++;continue;case 79:if(8>g-z&&f.substring(z+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:l=8;m=Le(f.substring(k,g));g++;e=pf;continue;case 74:g++;if(9>g-z&&f.substring(z+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;l=51;m="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-z&&f.substring(z+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}m=Le(f.substring(k,g));break;case 75:z=g++;continue;case 76:g++;e=Se;continue;default:e!==Oe?(l=51,m="E_CSS_UNEXPECTED_STATE"):(k=g,l=0)}r.type=l;r.b=q;r.L=p;r.text=m;r.position=k;b++;if(b>=c)break;e=Oe;q=!1;r=h[b&d]}a.position=g;a.h=b&d};function uf(a,b,c,d,e){var f=L("ajax"),g=new XMLHttpRequest,h=we(f,g),l={status:0,url:a,contentType:null,responseText:null,responseXML:null,Xd:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){l.status=g.status;if(200==l.status||!l.status)if(b&&"document"!==b||!g.responseXML||"parsererror"==g.responseXML.documentElement.localName)if((!b||"document"===b)&&g.response instanceof HTMLDocument)l.responseXML=g.response,l.contentType=g.response.contentType;
else{var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?l.Xd=vf([c]):l.Xd=c:w.b("Unexpected empty success response for",a):l.responseText=c;if(c=g.getResponseHeader("Content-Type"))l.contentType=c.replace(/(.*);.*$/,"$1")}else l.responseXML=g.responseXML,l.contentType=g.responseXML.contentType;h.tb(l)}};try{d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):(/^file:|^https?:\/\/[^/]+\.githubusercontent\.com/.test(a)&&(/\/aozorabunko\/[^/]+\/cards\/[^/]+\/files\/[^/.]+\.html$/.test(a)?
g.overrideMimeType("text/html; charset=Shift_JIS"):/\.(html|htm)$/.test(a)?g.overrideMimeType("text/html; charset=UTF-8"):/\.(xhtml|xht|xml|opf)$/.test(a)?g.overrideMimeType("application/xml; charset=UTF-8"):/\.(txt|css)$/.test(a)?g.overrideMimeType("text/plain; charset=UTF-8"):g.overrideMimeType("text/html; charset=UTF-8")),g.send(null))}catch(k){w.b(k,"Error fetching "+a),h.tb(l)}return f.result()}
function vf(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}function wf(a){var b=L("readBlob"),c=new FileReader,d=we(b,c);c.addEventListener("load",function(){d.tb(c.result)},!1);c.readAsArrayBuffer(a);return b.result()}function xf(a,b){this.ca=a;this.type=b;this.h={};this.j={}}
xf.prototype.load=function(a,b,c){a=xa(a);var d=this.h[a];return"undefined"!=typeof d?M(d):this.fetch(a,b,c).get()};function yf(a,b,c,d){var e=L("fetch");uf(b,a.type).then(function(f){if(c&&400<=f.status)throw Error(d||"Failed to fetch required resource: "+b);a.ca(f,a).then(function(c){delete a.j[b];a.h[b]=c;O(e,c)})});return e.result()}
xf.prototype.fetch=function(a,b,c){a=xa(a);if(this.h[a])return null;var d=this.j[a];if(!d){var e=this,d=new Ge(function(){return yf(e,a,b,c)},"Fetch "+a);e.j[a]=d;d.start()}return d};xf.prototype.get=function(a){return this.h[xa(a)]};function zf(a){a=a.responseText;return M(a?JSON.parse(a):null)};function Af(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new Rc(b);if(3==a.length)return new Rc(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function Bf(a){this.f=a;this.qb="Author"}n=Bf.prototype;n.gd=function(){return null};n.ma=function(){return this.f};n.error=function(){};n.Uc=function(a){this.qb=a};n.Wb=function(){};n.ne=function(){};n.od=function(){};n.pd=function(){};n.ye=function(){};n.Ed=function(){};
n.ac=function(){};n.me=function(){};n.le=function(){};n.se=function(){};n.Qc=function(){};n.Tb=function(){};n.$d=function(){};n.sd=function(){};n.de=function(){};n.Yd=function(){};n.ce=function(){};n.Tc=function(){};n.Pe=function(){};n.Dc=function(){};n.Zd=function(){};n.be=function(){};n.ae=function(){};n.wd=function(){};n.vd=function(){};n.Ka=function(){};n.Qb=function(){};n.bc=function(){};n.ud=function(){};n.Ld=function(){};
function Cf(a){switch(a.qb){case "UA":return 0;case "User":return 100663296;default:return 83886080}}function Df(a){switch(a.qb){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function Ef(){Bf.call(this,null);this.g=[];this.b=null}v(Ef,Bf);function Ff(a,b){a.g.push(a.b);a.b=b}n=Ef.prototype;n.gd=function(){return null};n.ma=function(){return this.b.ma()};n.error=function(a,b){this.b.error(a,b)};
n.Uc=function(a){Bf.prototype.Uc.call(this,a);0<this.g.length&&(this.b=this.g[0],this.g=[]);this.b.Uc(a)};n.Wb=function(a,b){this.b.Wb(a,b)};n.ne=function(a){this.b.ne(a)};n.od=function(a,b){this.b.od(a,b)};n.pd=function(a,b){this.b.pd(a,b)};n.ye=function(a){this.b.ye(a)};n.Ed=function(a,b,c,d){this.b.Ed(a,b,c,d)};n.ac=function(){this.b.ac()};n.me=function(){this.b.me()};n.le=function(){this.b.le()};n.se=function(){this.b.se()};n.Qc=function(){this.b.Qc()};n.Tb=function(){this.b.Tb()};n.$d=function(){this.b.$d()};
n.sd=function(a){this.b.sd(a)};n.de=function(){this.b.de()};n.Yd=function(){this.b.Yd()};n.ce=function(){this.b.ce()};n.Tc=function(){this.b.Tc()};n.Pe=function(a){this.b.Pe(a)};n.Dc=function(a){this.b.Dc(a)};n.Zd=function(a){this.b.Zd(a)};n.be=function(){this.b.be()};n.ae=function(a,b,c){this.b.ae(a,b,c)};n.wd=function(a,b,c){this.b.wd(a,b,c)};n.vd=function(a,b,c){this.b.vd(a,b,c)};n.Ka=function(){this.b.Ka()};n.Qb=function(a,b,c){this.b.Qb(a,b,c)};n.bc=function(){this.b.bc()};n.ud=function(a){this.b.ud(a)};
n.Ld=function(){this.b.Ld()};function Gf(a,b,c){Bf.call(this,a);this.N=c;this.J=0;if(this.oa=b)this.qb=b.qb}v(Gf,Bf);Gf.prototype.gd=function(){return this.oa.gd()};Gf.prototype.error=function(a){w.b(a)};Gf.prototype.Ka=function(){this.J++};Gf.prototype.bc=function(){if(!--this.J&&!this.N){var a=this.oa;a.b=a.g.pop()}};function Hf(a,b,c){Gf.call(this,a,b,c)}v(Hf,Gf);function If(a,b){a.error(b,a.gd())}function Jf(a,b){If(a,b);Ff(a.oa,new Gf(a.f,a.oa,!1))}n=Hf.prototype;n.Tb=function(){Jf(this,"E_CSS_UNEXPECTED_SELECTOR")};
n.$d=function(){Jf(this,"E_CSS_UNEXPECTED_FONT_FACE")};n.sd=function(){Jf(this,"E_CSS_UNEXPECTED_FOOTNOTE")};n.de=function(){Jf(this,"E_CSS_UNEXPECTED_VIEWPORT")};n.Yd=function(){Jf(this,"E_CSS_UNEXPECTED_DEFINE")};n.ce=function(){Jf(this,"E_CSS_UNEXPECTED_REGION")};n.Tc=function(){Jf(this,"E_CSS_UNEXPECTED_PAGE")};n.Dc=function(){Jf(this,"E_CSS_UNEXPECTED_WHEN")};n.Zd=function(){Jf(this,"E_CSS_UNEXPECTED_FLOW")};n.be=function(){Jf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};n.ae=function(){Jf(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};
n.wd=function(){Jf(this,"E_CSS_UNEXPECTED_PARTITION")};n.vd=function(){Jf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};n.ud=function(){Jf(this,"E_CSS_UNEXPECTED_SELECTOR_FUNC")};n.Ld=function(){Jf(this,"E_CSS_UNEXPECTED_END_SELECTOR_FUNC")};n.Qb=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.gd())};var Kf=[],Lf=[],T=[],Mf=[],Nf=[],Of=[],Pf=[],Qf=[],Rf=[],Sf=[],Tf=[],Uf=[],Vf=[];Kf[1]=28;Kf[36]=29;Kf[7]=29;Kf[9]=29;Kf[14]=29;Kf[18]=29;Kf[20]=30;Kf[13]=27;Kf[0]=200;Lf[1]=46;Lf[0]=200;Of[1]=2;
Of[36]=4;Of[7]=6;Of[9]=8;Of[14]=10;Of[18]=14;T[37]=11;T[23]=12;T[35]=56;T[1]=1;T[36]=3;T[7]=5;T[9]=7;T[14]=9;T[12]=13;T[18]=55;T[50]=42;T[16]=41;Mf[1]=1;Mf[36]=3;Mf[7]=5;Mf[9]=7;Mf[14]=9;Mf[11]=200;Mf[18]=55;Nf[1]=2;Nf[36]=4;Nf[7]=6;Nf[9]=8;Nf[18]=14;Nf[50]=42;Nf[14]=10;Nf[12]=13;Pf[1]=15;Pf[7]=16;Pf[4]=17;Pf[5]=18;Pf[3]=19;Pf[2]=20;Pf[8]=21;Pf[16]=22;Pf[19]=23;Pf[6]=24;Pf[11]=25;Pf[17]=26;Pf[13]=48;Pf[31]=47;Pf[23]=54;Pf[0]=44;Qf[1]=31;Qf[4]=32;Qf[5]=32;Qf[3]=33;Qf[2]=34;Qf[10]=40;Qf[6]=38;
Qf[31]=36;Qf[24]=36;Qf[32]=35;Rf[1]=45;Rf[16]=37;Rf[37]=37;Rf[38]=37;Rf[47]=37;Rf[48]=37;Rf[39]=37;Rf[49]=37;Rf[26]=37;Rf[25]=37;Rf[23]=37;Rf[24]=37;Rf[19]=37;Rf[21]=37;Rf[36]=37;Rf[18]=37;Rf[22]=37;Rf[11]=39;Rf[12]=43;Rf[17]=49;Sf[0]=200;Sf[12]=50;Sf[13]=51;Sf[14]=50;Sf[15]=51;Sf[10]=50;Sf[11]=51;Sf[17]=53;Tf[0]=200;Tf[12]=50;Tf[13]=52;Tf[14]=50;Tf[15]=51;Tf[10]=50;Tf[11]=51;Tf[17]=53;Uf[0]=200;Uf[12]=50;Uf[13]=51;Uf[14]=50;Uf[15]=51;Uf[10]=50;Uf[11]=51;Vf[11]=0;Vf[16]=0;Vf[22]=1;Vf[18]=1;
Vf[26]=2;Vf[25]=2;Vf[38]=3;Vf[37]=3;Vf[48]=3;Vf[47]=3;Vf[39]=3;Vf[49]=3;Vf[41]=3;Vf[23]=4;Vf[24]=4;Vf[36]=5;Vf[19]=5;Vf[21]=5;Vf[0]=6;Vf[52]=2;function Wf(a,b,c,d){this.b=a;this.f=b;this.u=c;this.Z=d;this.F=[];this.N={};this.g=this.H=null;this.D=!1;this.j=2;this.result=null;this.G=!1;this.A=this.J=null;this.l=[];this.h=[];this.R=this.Y=!1}function Xf(a,b){for(var c=[],d=a.F;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function Yf(a,b,c){var d=a.F,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new Gc(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.u.error("E_CSS_MISMATCHED_C_PAR",c),a.b=Tf,null;a=new Ic(d[e-1],Xf(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.u.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=Tf,null):1<
g?new Hc(Xf(a,e+1)):d[0]}function Zf(a,b,c){a.b=a.g?Tf:Sf;a.u.error(b,c)}
function $f(a,b,c){for(var d=a.F,e=a.u,f=d.pop(),g;;){var h=d.pop();if(11==b){for(g=[f];16==h;)g.unshift(d.pop()),h=d.pop();if("string"==typeof h){if("{"==h){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new hc(e.ma(),a,c),g.unshift(a);d.push(new G(g[0]));return!0}if("("==h){b=d.pop();f=d.pop();f=new wc(e.ma(),Eb(f,b),g);b=0;continue}}if(10==h){f.gf()&&(f=new yc(e.ma(),f,null));b=0;continue}}else if("string"==typeof h){d.push(h);break}if(0>h)if(-31==h)f=new cc(e.ma(),f);else if(-24==h)f=new dc(e.ma(),
f);else return Zf(a,"F_UNEXPECTED_STATE",c),!1;else{if(Vf[b]>Vf[h]){d.push(h);break}g=d.pop();switch(h){case 26:f=new ec(e.ma(),g,f);break;case 52:f=new fc(e.ma(),g,f);break;case 25:f=new gc(e.ma(),g,f);break;case 38:f=new ic(e.ma(),g,f);break;case 37:f=new kc(e.ma(),g,f);break;case 48:f=new jc(e.ma(),g,f);break;case 47:f=new lc(e.ma(),g,f);break;case 39:case 49:f=new mc(e.ma(),g,f);break;case 41:f=new nc(e.ma(),g,f);break;case 23:f=new oc(e.ma(),g,f);break;case 24:f=new pc(e.ma(),g,f);break;case 36:f=
new qc(e.ma(),g,f);break;case 19:f=new rc(e.ma(),g,f);break;case 21:f=new sc(e.ma(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new xc(e.ma(),d.pop(),g,f);break;case 10:if(g.gf())f=new yc(e.ma(),g,f);else return Zf(a,"E_CSS_MEDIA_TEST",c),!1}else return Zf(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return Zf(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return Zf(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function ag(a){for(var b=[];;){var c=R(a.f);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.L);break;default:return b}S(a.f)}}
function bg(a){var b=!1,c=R(a.f);if(23===c.type)b=!0,S(a.f),c=R(a.f);else if(1===c.type&&("even"===c.text||"odd"===c.text))return S(a.f),[2,"odd"===c.text?1:0];switch(c.type){case 3:if(b&&0>c.L)break;case 1:if(b&&"-"===c.text.charAt(0))break;if("n"===c.text||"-n"===c.text){if(b&&c.b)break;b="-n"===c.text?-1:1;3===c.type&&(b=c.L);var d=0;S(a.f);var c=R(a.f),e=24===c.type,f=23===c.type||e;f&&(S(a.f),c=R(a.f));if(5===c.type){d=c.L;if(1/d===1/-0){if(d=0,f)break}else if(0>d){if(f)break}else if(0<=d&&!f)break;
S(a.f)}else if(f)break;return[b,e&&0<d?-d:d]}if("n-"===c.text||"-n-"===c.text){if(!b||!c.b)if(b="-n-"===c.text?-1:1,3===c.type&&(b=c.L),S(a.f),c=R(a.f),5===c.type&&!(0>c.L||1/c.L===1/-0))return S(a.f),[b,c.L]}else{if(d=c.text.match(/^n(-[0-9]+)$/)){if(b&&c.b)break;S(a.f);return[3===c.type?c.L:1,parseInt(d[1],10)]}if(d=c.text.match(/^-n(-[0-9]+)$/))return S(a.f),[-1,parseInt(d[1],10)]}break;case 5:if(!b||!(c.b||0>c.L))return S(a.f),[0,c.L]}return null}
function cg(a,b,c){a=a.u.ma();if(!a)return null;c=c||a.j;if(b){b=b.split(/\s+/);b=t(b);for(var d=b.next();!d.done;d=b.next())switch(d.value){case "vertical":c=Ac(a,c,new cc(a,new uc(a,"pref-horizontal")));break;case "horizontal":c=Ac(a,c,new uc(a,"pref-horizontal"));break;case "day":c=Ac(a,c,new cc(a,new uc(a,"pref-night-mode")));break;case "night":c=Ac(a,c,new uc(a,"pref-night-mode"));break;default:c=a.h}}return c===a.j?null:new G(c)}
function dg(a){switch(a.h[a.h.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function eg(a,b,c,d,e,f){var g=a.u,h=a.f,l=a.F,k,m,p,q;e&&(a.j=2,a.F.push("{"));a:for(;0<b;--b)switch(k=R(h),a.b[k.type]){case 28:if(18!=sf(h,1).type){dg(a)?(g.error("E_CSS_COLON_EXPECTED",sf(h,1)),a.b=Tf):(a.b=Of,g.Tb());continue}m=sf(h,2);if(!(m.b||1!=m.type&&6!=m.type)){if(0<=h.b)throw Error("F_CSSTOK_BAD_CALL mark");h.b=h.f}a.g=k.text;a.D=!1;S(h);S(h);a.b=Pf;l.splice(0,l.length);continue;case 46:if(18!=sf(h,1).type){a.b=Tf;g.error("E_CSS_COLON_EXPECTED",sf(h,1));continue}a.g=k.text;a.D=!1;S(h);
S(h);a.b=Pf;l.splice(0,l.length);continue;case 29:a.b=Of;g.Tb();continue;case 1:if(!k.b){a.b=Uf;g.error("E_CSS_SPACE_EXPECTED",k);continue}g.ac();case 2:if(34==sf(h,1).type)if(S(h),S(h),p=a.N[k.text],null!=p)switch(k=R(h),k.type){case 1:g.Wb(p,k.text);a.b=f?Mf:T;S(h);break;case 36:g.Wb(p,null);a.b=f?Mf:T;S(h);break;default:a.b=Sf,g.error("E_CSS_NAMESPACE",k)}else a.b=Sf,g.error("E_CSS_UNDECLARED_PREFIX",k);else g.Wb(a.H,k.text),a.b=f?Mf:T,S(h);continue;case 3:if(!k.b){a.b=Uf;g.error("E_CSS_SPACE_EXPECTED",
k);continue}g.ac();case 4:if(34==sf(h,1).type)switch(S(h),S(h),k=R(h),k.type){case 1:g.Wb(null,k.text);a.b=f?Mf:T;S(h);break;case 36:g.Wb(null,null);a.b=f?Mf:T;S(h);break;default:a.b=Sf,g.error("E_CSS_NAMESPACE",k)}else g.Wb(a.H,null),a.b=f?Mf:T,S(h);continue;case 5:k.b&&g.ac();case 6:g.ye(k.text);a.b=f?Mf:T;S(h);continue;case 7:k.b&&g.ac();case 8:g.ne(k.text);a.b=f?Mf:T;S(h);continue;case 55:k.b&&g.ac();case 14:S(h);k=R(h);b:switch(k.type){case 1:g.od(k.text,null);S(h);a.b=f?Mf:T;continue;case 6:m=
k.text;S(h);switch(m){case "not":a.b=Of;g.ud("not");eg(a,Number.POSITIVE_INFINITY,!1,!1,!1,!0)?a.b=T:a.b=Uf;break a;case "lang":case "href-epub-type":if(k=R(h),1===k.type){p=[k.text];S(h);break}else break b;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(p=bg(a))break;else break b;default:p=ag(a)}k=R(h);if(11==k.type){g.od(m,p);S(h);a.b=f?Mf:T;continue}}g.error("E_CSS_PSEUDOCLASS_SYNTAX",k);a.b=Sf;continue;case 42:S(h);k=R(h);switch(k.type){case 1:g.pd(k.text,
null);a.b=f?Mf:T;S(h);continue;case 6:m=k.text;S(h);if("nth-fragment"==m){if(p=bg(a),!p)break}else p=ag(a);k=R(h);if(11==k.type){g.pd(m,p);a.b=f?Mf:T;S(h);continue}}g.error("E_CSS_PSEUDOELEM_SYNTAX",k);a.b=Sf;continue;case 9:k.b&&g.ac();case 10:S(h);k=R(h);if(1==k.type)m=k.text,S(h);else if(36==k.type)m=null,S(h);else if(34==k.type)m="";else{a.b=Uf;g.error("E_CSS_ATTR",k);S(h);continue}k=R(h);if(34==k.type){p=m?a.N[m]:m;if(null==p){a.b=Uf;g.error("E_CSS_UNDECLARED_PREFIX",k);S(h);continue}S(h);k=
R(h);if(1!=k.type){a.b=Uf;g.error("E_CSS_ATTR_NAME_EXPECTED",k);continue}m=k.text;S(h);k=R(h)}else p="";switch(k.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:q=k.type;S(h);k=R(h);break;case 15:g.Ed(p,m,0,null);a.b=f?Mf:T;S(h);continue;default:a.b=Uf;g.error("E_CSS_ATTR_OP_EXPECTED",k);continue}switch(k.type){case 1:case 2:g.Ed(p,m,q,k.text);S(h);k=R(h);break;default:a.b=Uf;g.error("E_CSS_ATTR_VAL_EXPECTED",k);continue}if(15!=k.type){a.b=Uf;g.error("E_CSS_ATTR",k);continue}a.b=f?Mf:
T;S(h);continue;case 11:g.me();a.b=Nf;S(h);continue;case 12:g.le();a.b=Nf;S(h);continue;case 56:g.se();a.b=Nf;S(h);continue;case 13:a.Y?(a.h.push("-epubx-region"),a.Y=!1):a.R?(a.h.push("page"),a.R=!1):a.h.push("[selector]");g.Ka();a.b=Kf;S(h);continue;case 41:g.Qc();a.b=Of;S(h);continue;case 15:l.push(D(k.text));S(h);continue;case 16:try{l.push(Af(k.text))}catch(z){g.error("E_CSS_COLOR",k),a.b=Sf}S(h);continue;case 17:l.push(new Pc(k.L));S(h);continue;case 18:l.push(new Qc(k.L));S(h);continue;case 19:Mb(k.text)?
l.push(new G(new tc(g.ma(),k.L,k.text))):l.push(new F(k.L,k.text));S(h);continue;case 20:l.push(new Nc(k.text));S(h);continue;case 21:l.push(new Sc(Aa(k.text,a.Z)));S(h);continue;case 22:Yf(a,",",k);l.push(",");S(h);continue;case 23:l.push(Mc);S(h);continue;case 24:m=k.text.toLowerCase();"-epubx-expr"==m||"calc"==m?(a.b=Qf,a.j=0,l.push("{")):(l.push(m),l.push("("));S(h);continue;case 25:Yf(a,")",k);S(h);continue;case 47:S(h);k=R(h);m=sf(h,1);if(1==k.type&&"important"==k.text.toLowerCase()&&(17==m.type||
0==m.type||13==m.type)){S(h);a.D=!0;continue}Zf(a,"E_CSS_SYNTAX",k);continue;case 54:m=sf(h,1);switch(m.type){case 4:case 3:case 5:if(!m.b){S(h);continue}}a.b===Pf&&0<=h.b?(tf(h),a.b=Of,g.Tb()):Zf(a,"E_CSS_UNEXPECTED_PLUS",k);continue;case 26:S(h);case 48:h.b=-1;(m=Yf(a,";",k))&&a.g&&g.Qb(a.g,m,a.D);a.b=d?Lf:Kf;continue;case 44:S(h);h.b=-1;m=Yf(a,";",k);if(c)return a.result=m,!0;a.g&&m&&g.Qb(a.g,m,a.D);if(d)return!0;Zf(a,"E_CSS_SYNTAX",k);continue;case 31:m=sf(h,1);9==m.type?(10!=sf(h,2).type||sf(h,
2).b?(l.push(new uc(g.ma(),Eb(k.text,m.text))),a.b=Rf):(l.push(k.text,m.text,"("),S(h)),S(h)):(2==a.j||3==a.j?"not"==k.text.toLowerCase()?(S(h),l.push(new vc(g.ma(),!0,m.text))):("only"==k.text.toLowerCase()&&(S(h),k=m),l.push(new vc(g.ma(),!1,k.text))):l.push(new uc(g.ma(),k.text)),a.b=Rf);S(h);continue;case 38:l.push(null,k.text,"(");S(h);continue;case 32:l.push(new Hb(g.ma(),k.L));S(h);a.b=Rf;continue;case 33:m=k.text;"%"==m&&(m=a.g&&a.g.match(/height|^(top|bottom)$/)?"vh":"vw");l.push(new tc(g.ma(),
k.L,m));S(h);a.b=Rf;continue;case 34:l.push(new Hb(g.ma(),k.text));S(h);a.b=Rf;continue;case 35:S(h);k=R(h);5!=k.type||k.b?Zf(a,"E_CSS_SYNTAX",k):(l.push(new zc(g.ma(),k.L)),S(h),a.b=Rf);continue;case 36:l.push(-k.type);S(h);continue;case 37:a.b=Qf;$f(a,k.type,k);l.push(k.type);S(h);continue;case 45:"and"==k.text.toLowerCase()?(a.b=Qf,$f(a,52,k),l.push(52),S(h)):Zf(a,"E_CSS_SYNTAX",k);continue;case 39:$f(a,k.type,k)&&(a.g?a.b=Pf:Zf(a,"E_CSS_UNBALANCED_PAR",k));S(h);continue;case 43:$f(a,11,k)&&(a.g||
3==a.j?Zf(a,"E_CSS_UNEXPECTED_BRC",k):(1==a.j?g.Dc(l.pop()):(k=l.pop(),g.Dc(k)),a.h.push("media"),g.Ka(),a.b=Kf));S(h);continue;case 49:if($f(a,11,k))if(a.g||3!=a.j)Zf(a,"E_CSS_UNEXPECTED_SEMICOL",k);else return a.A=l.pop(),a.G=!0,a.b=Kf,S(h),!1;S(h);continue;case 40:l.push(k.type);S(h);continue;case 27:a.b=Kf;S(h);g.bc();a.h.length&&a.h.pop();continue;case 30:m=k.text.toLowerCase();switch(m){case "import":S(h);k=R(h);if(2==k.type||8==k.type){a.J=k.text;S(h);k=R(h);if(17==k.type||0==k.type)return a.G=
!0,S(h),!1;a.g=null;a.j=3;a.b=Qf;l.push("{");continue}g.error("E_CSS_IMPORT_SYNTAX",k);a.b=Sf;continue;case "namespace":S(h);k=R(h);switch(k.type){case 1:m=k.text;S(h);k=R(h);if((2==k.type||8==k.type)&&17==sf(h,1).type){a.N[m]=k.text;S(h);S(h);continue}break;case 2:case 8:if(17==sf(h,1).type){a.H=k.text;S(h);S(h);continue}}g.error("E_CSS_NAMESPACE_SYNTAX",k);a.b=Sf;continue;case "charset":S(h);k=R(h);if(2==k.type&&17==sf(h,1).type){m=k.text.toLowerCase();"utf-8"!=m&&"utf-16"!=m&&g.error("E_CSS_UNEXPECTED_CHARSET "+
m,k);S(h);S(h);continue}g.error("E_CSS_CHARSET_SYNTAX",k);a.b=Sf;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==sf(h,1).type){S(h);S(h);switch(m){case "font-face":g.$d();break;case "-epubx-page-template":g.be();break;case "-epubx-define":g.Yd();break;case "-epubx-viewport":g.de()}a.h.push(m);g.Ka();continue}break;case "-adapt-footnote-area":S(h);k=R(h);switch(k.type){case 12:S(h);g.sd(null);a.h.push(m);g.Ka();continue;case 50:if(S(h),k=R(h),
1==k.type&&12==sf(h,1).type){m=k.text;S(h);S(h);g.sd(m);a.h.push("-adapt-footnote-area");g.Ka();continue}}break;case "-epubx-region":S(h);g.ce();a.Y=!0;a.b=Of;continue;case "page":S(h);g.Tc();a.R=!0;a.b=Nf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":S(h);
k=R(h);if(12==k.type){S(h);g.Pe(m);a.h.push(m);g.Ka();continue}break;case "-epubx-when":S(h);a.g=null;a.j=1;a.b=Qf;l.push("{");continue;case "media":S(h);a.g=null;a.j=2;a.b=Qf;l.push("{");continue;case "-epubx-flow":if(1==sf(h,1).type&&12==sf(h,2).type){g.Zd(sf(h,1).text);S(h);S(h);S(h);a.h.push(m);g.Ka();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":S(h);k=R(h);q=p=null;var r=[];1==k.type&&(p=k.text,S(h),k=R(h));18==k.type&&1==sf(h,1).type&&(q=sf(h,
1).text,S(h),S(h),k=R(h));for(;6==k.type&&"class"==k.text.toLowerCase()&&1==sf(h,1).type&&11==sf(h,2).type;)r.push(sf(h,1).text),S(h),S(h),S(h),k=R(h);if(12==k.type){S(h);switch(m){case "-epubx-page-master":g.ae(p,q,r);break;case "-epubx-partition":g.wd(p,q,r);break;case "-epubx-partition-group":g.vd(p,q,r)}a.h.push(m);g.Ka();continue}break;case "":g.error("E_CSS_UNEXPECTED_AT"+m,k);a.b=Uf;continue;default:g.error("E_CSS_AT_UNKNOWN "+m,k);a.b=Sf;continue}g.error("E_CSS_AT_SYNTAX "+m,k);a.b=Sf;continue;
case 50:if(c||d)return!0;a.l.push(k.type+1);S(h);continue;case 52:if(c||d)return!0;if(!a.l.length){a.b=Kf;continue}case 51:0<a.l.length&&a.l[a.l.length-1]==k.type&&a.l.pop();a.l.length||13!=k.type||(a.b=Kf);S(h);continue;case 53:if(c||d)return!0;a.l.length||(a.b=Kf);S(h);continue;case 200:return f&&(S(h),g.Ld()),!0;default:if(c||d)return!0;if(e)return $f(a,11,k)?(a.result=l.pop(),!0):!1;if(f)return 51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),!1;a.b===Pf&&0<=h.b?(tf(h),a.b=Of,g.Tb()):a.b!==
Sf&&a.b!==Uf&&a.b!==Tf?(51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),a.b=dg(a)?Tf:Uf):S(h)}return!1}function fg(a){Bf.call(this,null);this.f=a}v(fg,Bf);fg.prototype.error=function(a){throw Error(a);};fg.prototype.ma=function(){return this.f};
function gg(a,b,c,d,e){var f=L("parseStylesheet"),g=new Wf(Kf,a,b,c),h=null;e&&(h=hg(new qf(e,b),b,c));if(h=cg(g,d,h&&h.Aa()))b.Dc(h),b.Ka();De(function(){for(var a={};!eg(g,100,!1,!1,!1,!1);){if(g.G){var d=Aa(g.J,c);g.A&&(b.Dc(g.A),b.Ka());a.Be=L("parseStylesheet.import");ig(d,b,null,null).then(function(a){return function(){g.A&&b.bc();g.G=!1;g.J=null;g.A=null;O(a.Be,!0)}}(a));return a.Be.result()}d=Be();if(d.Xa)return d;a={Be:a.Be}}return M(!1)}).then(function(){h&&b.bc();O(f,!0)});return f.result()}
function jg(a,b,c,d,e){return me("parseStylesheetFromText",function(f){var g=new qf(a,b);gg(g,b,c,d,e).La(f)},function(b,c){w.b(c,"Failed to parse stylesheet text: "+a);O(b,!1)})}function ig(a,b,c,d){return me("parseStylesheetFromURL",function(e){uf(a).then(function(f){f.responseText?jg(f.responseText,b,a,c,d).then(function(b){b||w.b("Failed to parse stylesheet from "+a);O(e,!0)}):O(e,!0)})},function(b,c){w.b(c,"Exception while fetching and parsing:",a);O(b,!0)})}
function kg(a,b){var c=new Wf(Pf,b,new fg(a),"");eg(c,Number.POSITIVE_INFINITY,!0,!1,!1,!1);return c.result}function hg(a,b,c){a=new Wf(Qf,a,b,c);eg(a,Number.POSITIVE_INFINITY,!1,!1,!0,!1);return a.result}var lg={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function mg(a,b,c){if(b.ef())a:{b=b.Kc;a=b.evaluate(a);switch(typeof a){case "number":c=lg[c]?a==Math.round(a)?new Qc(a):new Pc(a):new F(a,"px");break a;case "string":c=a?kg(b.b,new qf(a,null)):C;break a;case "boolean":c=a?Xd:ld;break a;case "undefined":c=C;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function ng(a,b,c,d){this.V=a;this.T=b;this.U=c;this.P=d}function og(a,b){this.f=a;this.b=b}function pg(){this.bottom=this.right=this.top=this.left=0}function qg(a,b,c,d){this.b=a;this.f=b;this.h=c;this.g=d}function rg(a,b,c,d){this.T=a;this.P=b;this.V=c;this.U=d;this.right=this.left=null}function sg(a,b){return a.b.b-b.b.b||a.b.f-b.b.f}function tg(a){this.b=a}function ug(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.b<g.b?new qg(e,g,1,c):new qg(g,e,-1,c));e=g}}
function vg(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new og(a+c*Math.sin(g),b+d*Math.cos(g)))}return new tg(e)}function wg(a,b,c,d){return new tg([new og(a,b),new og(c,b),new og(c,d),new og(a,d)])}function xg(a,b,c,d){this.f=a;this.h=b;this.b=c;this.g=d}function yg(a,b){var c=a.b.f+(a.f.f-a.b.f)*(b-a.b.b)/(a.f.b-a.b.b);if(isNaN(c))throw Error("Bad intersection");return c}
function zg(a,b,c,d){var e,f;b.f.b<c&&w.b("Error: inconsistent segment (1)");b.b.b<=c?(c=yg(b,c),e=b.h):(c=b.b.f,e=0);b.f.b>=d?(d=yg(b,d),f=b.h):(d=b.f.f,f=0);c<d?(a.push(new xg(c,e,b.g,-1)),a.push(new xg(d,f,b.g,1))):(a.push(new xg(d,f,b.g,-1)),a.push(new xg(c,e,b.g,1)))}
function Ag(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],h=!1,l=a.length,k=0;k<l;k++){var m=a[k];d[m.b]+=m.h;e[m.b]+=m.g;for(var p=!1,f=0;f<b;f++)if(d[f]&&!e[f]){p=!0;break}if(p)for(f=b;f<=c;f++)if(d[f]||e[f]){p=!1;break}h!=p&&(g.push(m.f),h=p)}return g}function Bg(a,b){return b?Math.ceil(a/b)*b:a}function Cg(a,b){return b?Math.floor(a/b)*b:a}function Dg(a){return new og(a.b,-a.f)}function Eg(a){return new ng(a.T,-a.U,a.P,-a.V)}
function Fg(a){return new tg(cb(a.b,Dg))}
function Gg(a,b,c,d,e){e&&(a=Eg(a),b=cb(b,Fg),c=cb(c,Fg));e=b.length;var f=c?c.length:0,g=[],h=[],l,k,m;for(l=0;l<e;l++)ug(b[l],h,l);for(l=0;l<f;l++)ug(c[l],h,l+e);b=h.length;h.sort(sg);for(c=0;h[c].g>=e;)c++;c=h[c].b.b;c>a.T&&g.push(new rg(a.T,c,a.U,a.U));l=0;for(var p=[];l<b&&(m=h[l]).b.b<c;)m.f.b>c&&p.push(m),l++;for(;l<b||0<p.length;){var q=a.P,r=Math.min(Bg(Math.ceil(c+8),d),a.P);for(k=0;k<p.length&&q>r;k++)m=p[k],m.b.f==m.f.f?m.f.b<q&&(q=Math.max(Cg(m.f.b,d),r)):m.b.f!=m.f.f&&(q=r);q>a.P&&(q=
a.P);for(;l<b&&(m=h[l]).b.b<q;)if(m.f.b<c)l++;else if(m.b.b<r){if(m.b.b!=m.f.b||m.b.b!=c)p.push(m),q=r;l++}else{k=Cg(m.b.b,d);k<q&&(q=k);break}r=[];for(k=0;k<p.length;k++)zg(r,p[k],c,q);r.sort(function(a,b){return a.f-b.f||a.g-b.g});r=Ag(r,e,f);if(r.length){var z=0,u=a.V;for(k=0;k<r.length;k+=2){var A=Math.max(a.V,r[k]),H=Math.min(a.U,r[k+1])-A;H>z&&(z=H,u=A)}z?g.push(new rg(c,q,Math.max(u,a.V),Math.min(u+z,a.U))):g.push(new rg(c,q,a.U,a.U))}else g.push(new rg(c,q,a.U,a.U));if(q==a.P)break;c=q;for(k=
p.length-1;0<=k;k--)p[k].f.b<=q&&p.splice(k,1)}Hg(a,g);return g}function Hg(a,b){for(var c=b.length-1,d=new rg(a.P,a.P,a.V,a.U);0<=c;){var e=d,d=b[c];if(1>d.P-d.T||d.V==e.V&&d.U==e.U)e.T=d.T,b.splice(c,1),d=e;c--}}function Ig(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].P?c=e+1:d=e}return c}
function Jg(a,b){if(!a.length)return b;for(var c=b.T,d,e=0;e<a.length&&!(d=a[e],d.P>b.T&&d.V-.1<=b.V&&d.U+.1>=b.U);e++)c=Math.max(c,d.P);for(var f=c;e<a.length&&!(d=a[e],d.T>=b.P||d.V-.1>b.V||d.U+.1<b.U);e++)f=d.P;f=e===a.length?b.P:Math.min(f,b.P);return f<=c?null:new ng(b.V,c,b.U,f)}
function Kg(a,b){if(!a.length)return b;for(var c=b.P,d,e=a.length-1;0<=e&&!(d=a[e],e===a.length-1&&d.P<b.P)&&!(d.T<b.P&&d.V-.1<=b.V&&d.U+.1>=b.U);e--)c=Math.min(c,d.T);for(var f=Math.min(c,d.P);0<=e&&!(d=a[e],d.P<=b.T||d.V-.1>b.V||d.U+.1<b.U);e--)f=d.T;f=Math.max(f,b.T);return c<=f?null:new ng(b.V,f,b.U,c)};function Lg(){this.b={}}v(Lg,Ec);Lg.prototype.nc=function(a){this.b[a.name]=!0;return a};Lg.prototype.Ub=function(a){this.oc(a.values);return a};function Mg(a){this.value=a}v(Mg,Ec);Mg.prototype.Xc=function(a){this.value=a.L;return a};function Ng(a,b){if(a){var c=new Mg(b);try{return a.fa(c),c.value}catch(d){w.b(d,"toInt: ")}}return b}function Og(){this.b=!1;this.f=[];this.name=null}v(Og,Ec);Og.prototype.Zc=function(a){this.b&&this.f.push(a);return null};
Og.prototype.Yc=function(a){this.b&&!a.L&&this.f.push(new F(0,"px"));return null};Og.prototype.Ub=function(a){this.oc(a.values);return null};Og.prototype.Xb=function(a){this.b||(this.b=!0,this.oc(a.values),this.b=!1,this.name=a.name.toLowerCase());return null};
function Pg(a,b,c,d,e,f){if(0<a.f.length){var g=[];a.f.forEach(function(b,c){if("%"==b.ka){var h=c%2?e:d;3==c&&"circle"==a.name&&(h=Math.sqrt((d*d+e*e)/2));g.push(b.L*h/100)}else g.push(b.L*Rb(f,b.ka,!1))});switch(a.name){case "polygon":if(!(g.length%2)){for(var h=[],l=0;l<g.length;l+=2)h.push(new og(b+g[l],c+g[l+1]));return new tg(h)}break;case "rectangle":if(4==g.length)return wg(b+g[0],c+g[1],b+g[0]+g[2],c+g[1]+g[3]);break;case "ellipse":if(4==g.length)return vg(b+g[0],c+g[1],g[2],g[3]);break;
case "circle":if(3==g.length)return vg(b+g[0],c+g[1],g[2],g[2])}}return null}function Qg(a,b,c,d,e,f){if(a){var g=new Og;try{return a.fa(g),Pg(g,b,c,d,e,f)}catch(h){w.b(h,"toShape:")}}return wg(b,c,b+d,c+e)}function Rg(a){this.f=a;this.b={};this.name=null}v(Rg,Ec);Rg.prototype.nc=function(a){this.name=a.toString();this.b[this.name]=this.f?0:(this.b[this.name]||0)+1;return a};Rg.prototype.Xc=function(a){this.name&&(this.b[this.name]+=a.L-(this.f?0:1));return a};
Rg.prototype.Ub=function(a){this.oc(a.values);return a};function Sg(a,b){var c=new Rg(b);try{a.fa(c)}catch(d){w.b(d,"toCounters:")}return c.b}function Tg(a,b){this.b=a;this.f=b}v(Tg,Fc);Tg.prototype.$c=function(a){return new Sc(this.f.lc(a.url,this.b))};function Ug(a){this.f=this.g=null;this.b=0;this.eb=a}function Vg(a,b){this.b=-1;this.f=a;this.g=b}function Wg(){this.X=[];this.b=[];this.match=[];this.f=[];this.error=[];this.g=!0}Wg.prototype.connect=function(a,b){for(var c=0;c<a.length;c++)this.b[a[c]].b=b;a.splice(0,a.length)};
Wg.prototype.clone=function(){for(var a=new Wg,b=0;b<this.X.length;b++){var c=this.X[b],d=new Ug(c.eb);d.b=c.b;a.X.push(d)}for(b=0;b<this.b.length;b++)c=this.b[b],d=new Vg(c.f,c.g),d.b=c.b,a.b.push(d);a.match.push.apply(a.match,[].concat(ia(this.match)));a.f.push.apply(a.f,[].concat(ia(this.f)));a.error.push.apply(a.error,[].concat(ia(this.error)));return a};
function Xg(a,b,c,d){var e=a.X.length,f=new Ug(Yg);f.b=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.X.push(f);a.connect(b,e);c=new Vg(e,!0);e=new Vg(e,!1);b.push(a.b.length);a.b.push(e);b.push(a.b.length);a.b.push(c)}function Zg(a){return 1==a.X.length&&!a.X[0].b&&a.X[0].eb instanceof $g}
function ah(a,b,c){if(b.X.length){var d=a.X.length;if(4==c&&1==d&&Zg(b)&&Zg(a)){c=a.X[0].eb;b=b.X[0].eb;var d={},e={},f;for(f in c.f)d[f]=c.f[f];for(f in b.f)d[f]=b.f[f];for(var g in c.g)e[g]=c.g[g];for(g in b.g)e[g]=b.g[g];a.X[0].eb=new $g(c.b|b.b,d,e)}else{for(f=0;f<b.X.length;f++)a.X.push(b.X[f]);4==c?(a.g=!0,a.connect(a.f,d)):a.connect(a.match,d);g=a.b.length;for(f=0;f<b.b.length;f++)e=b.b[f],e.f+=d,0<=e.b&&(e.b+=d),a.b.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&a.connect(a.match,
d);if(2==c||3==c)for(f=0;f<b.f.length;f++)a.match.push(b.f[f]+g);else if(a.g){for(f=0;f<b.f.length;f++)a.f.push(b.f[f]+g);a.g=b.g}else for(f=0;f<b.f.length;f++)a.error.push(b.f[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.X=null;b.b=null}}}var U={};function bh(){}v(bh,Ec);bh.prototype.h=function(a,b){var c=a[b].fa(this);return c?[c]:null};function $g(a,b,c){this.b=a;this.f=b;this.g=c}v($g,bh);n=$g.prototype;n.Re=function(a){return this.b&1?a:null};
n.Se=function(a){return this.b&2048?a:null};n.yd=function(a){return this.b&2?a:null};n.nc=function(a){var b=this.f[a.name.toLowerCase()];return b?b:this.b&4?a:null};n.Zc=function(a){return a.L||this.b&512?0>a.L&&!(this.b&256)?null:this.g[a.ka]?a:null:"%"==a.ka&&this.b&1024?a:null};n.Yc=function(a){return a.L?0>=a.L&&!(this.b&256)?null:this.b&16?a:null:this.b&512?a:null};n.Xc=function(a){return a.L?0>=a.L&&!(this.b&256)?null:this.b&48?a:(a=this.f[""+a.L])?a:null:this.b&512?a:null};
n.ge=function(a){return this.b&64?a:null};n.$c=function(a){return this.b&128?a:null};n.Ub=function(){return null};n.mc=function(){return null};n.Xb=function(){return null};n.Wc=function(){return null};var Yg=new $g(0,U,U);
function ch(a){this.b=new Ug(null);var b=this.g=new Ug(null),c=a.X.length;a.X.push(this.b);a.X.push(b);a.connect(a.match,c);a.connect(a.f,c+1);a.connect(a.error,c+1);for(var b=t(a.b),d=b.next();!d.done;d=b.next())d=d.value,d.g?a.X[d.f].g=a.X[d.b]:a.X[d.f].f=a.X[d.b];for(b=0;b<c;b++)if(!a.X[b].f||!a.X[b].g)throw Error("Invalid validator state");this.f=a.X[0]}v(ch,bh);
function dh(a,b,c,d){for(var e=c?[]:b,f=a.f,g=d,h=null,l=null;f!==a.b&&f!==a.g;)if(g>=b.length)f=f.f;else{var k=b[g],m;if(f.b)m=!0,-1==f.b?(h?h.push(l):h=[l],l=[]):-2==f.b?0<h.length?l=h.pop():l=null:0<f.b&&!(f.b%2)?l[Math.floor((f.b-1)/2)]="taken":m=null==l[Math.floor((f.b-1)/2)],f=m?f.g:f.f;else{if(!g&&!c&&f.eb instanceof eh&&a instanceof eh){if(m=(new Gc(b)).fa(f.eb)){g=b.length;f=f.g;continue}}else if(!g&&!c&&f.eb instanceof fh&&a instanceof eh){if(m=(new Hc(b)).fa(f.eb)){g=b.length;f=f.g;continue}}else m=
k.fa(f.eb);if(m){if(m!==k&&b===e)for(e=[],k=0;k<g;k++)e[k]=b[k];b!==e&&(e[g-d]=m);g++;f=f.g}else f=f.f}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}n=ch.prototype;n.Cb=function(a){for(var b=null,c=this.f;c!==this.b&&c!==this.g;)a?c.b?c=c.g:(b=a.fa(c.eb))?(a=null,c=c.g):c=c.f:c=c.f;return c===this.b?b:null};n.Re=function(a){return this.Cb(a)};n.Se=function(a){return this.Cb(a)};n.yd=function(a){return this.Cb(a)};n.nc=function(a){return this.Cb(a)};n.Zc=function(a){return this.Cb(a)};n.Yc=function(a){return this.Cb(a)};
n.Xc=function(a){return this.Cb(a)};n.ge=function(a){return this.Cb(a)};n.$c=function(a){return this.Cb(a)};n.Ub=function(){return null};n.mc=function(){return null};n.Xb=function(a){return this.Cb(a)};n.Wc=function(){return null};function eh(a){ch.call(this,a)}v(eh,ch);eh.prototype.Ub=function(a){var b=dh(this,a.values,!1,0);return b===a.values?a:b?new Gc(b):null};
eh.prototype.mc=function(a){for(var b=this.f,c=!1;b;){if(b.eb instanceof fh){c=!0;break}b=b.f}return c?(b=dh(this,a.values,!1,0),b===a.values?a:b?new Hc(b):null):null};eh.prototype.h=function(a,b){return dh(this,a,!0,b)};function fh(a){ch.call(this,a)}v(fh,ch);fh.prototype.Ub=function(a){return this.Cb(a)};fh.prototype.mc=function(a){var b=dh(this,a.values,!1,0);return b===a.values?a:b?new Hc(b):null};fh.prototype.h=function(a,b){for(var c=this.f,d;c!==this.g;){if(d=c.eb.h(a,b))return d;c=c.f}return null};
function gh(a,b){ch.call(this,b);this.name=a}v(gh,ch);gh.prototype.Cb=function(){return null};gh.prototype.Xb=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=dh(this,a.values,!1,0);return b===a.values?a:b?new Ic(a.name,b):null};function hh(){}hh.prototype.b=function(a,b){return b};hh.prototype.f=function(){};function ih(a,b){this.name=b;this.eb=a.g[this.name]}v(ih,hh);
ih.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.eb.h(a,b)){var d=a.length;this.f(1<d?new Gc(a):a[0],c);return b+d}return b};ih.prototype.f=function(a,b){b.values[this.name]=a};function jh(a,b){ih.call(this,a,b[0]);this.g=b}v(jh,ih);jh.prototype.f=function(a,b){for(var c=0;c<this.g.length;c++)b.values[this.g[c]]=a};function kh(a,b){this.X=a;this.sf=b}v(kh,hh);
kh.prototype.b=function(a,b,c){var d=b;if(this.sf)if(a[b]==Mc){if(++b==a.length)return d}else return d;var e=this.X[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.X.length&&b<a.length;d++){e=this.X[d].b(a,b,c);if(e==b)break;b=e}return b};function lh(){this.f=this.zb=null;this.error=!1;this.values={};this.b=null}n=lh.prototype;n.clone=function(){var a=new this.constructor;a.zb=this.zb;a.f=this.f;a.b=this.b;return a};n.Ue=function(a,b){this.zb=a;this.f=b};n.Gc=function(){this.error=!0;return 0};
function mh(a,b){a.Gc([b]);return null}n.Re=function(a){return mh(this,a)};n.yd=function(a){return mh(this,a)};n.nc=function(a){return mh(this,a)};n.Zc=function(a){return mh(this,a)};n.Yc=function(a){return mh(this,a)};n.Xc=function(a){return mh(this,a)};n.ge=function(a){return mh(this,a)};n.$c=function(a){return mh(this,a)};n.Ub=function(a){this.Gc(a.values);return null};n.mc=function(){this.error=!0;return null};n.Xb=function(a){return mh(this,a)};n.Wc=function(){this.error=!0;return null};
function nh(){lh.call(this)}v(nh,lh);nh.prototype.Gc=function(a){for(var b=0,c=0;b<a.length;){var d=this.zb[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.zb.length){this.error=!0;break}}return b};function oh(){lh.call(this)}v(oh,lh);oh.prototype.Gc=function(a){if(a.length>this.zb.length||!a.length)return this.error=!0,0;for(var b=0;b<this.zb.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.zb[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function ph(){lh.call(this)}v(ph,lh);
ph.prototype.Gc=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===Mc){b=c;break}if(b>this.zb.length||!a.length)return this.error=!0,0;for(c=0;c<this.zb.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.zb[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function qh(){lh.call(this)}v(qh,nh);
qh.prototype.mc=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};if(a.values[c]instanceof Hc)this.error=!0;else{a.values[c].fa(this);for(var d=this.values,e=t(this.f),f=e.next();!f.done;f=e.next()){var f=f.value,g=d[f]||this.b.l[f],h=b[f];h||(h=[],b[f]=h);h.push(g)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0)}if(this.error)return null}this.values={};for(var l in b)this.values[l]="background-color"==l?b[l].pop():new Hc(b[l]);return null};
function rh(){lh.call(this)}v(rh,nh);rh.prototype.Ue=function(a,b){nh.prototype.Ue.call(this,a,b);this.f.push("font-family","line-height","font-size")};
rh.prototype.Gc=function(a){var b=nh.prototype.Gc.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.b.g;if(!a[b].fa(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===Mc){b++;if(b+2>a.length||!a[b].fa(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new Gc(a.slice(b,a.length));if(!d.fa(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
rh.prototype.mc=function(a){a.values[0].fa(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new Hc(b);a.fa(this.b.g["font-family"])?this.values["font-family"]=a:this.error=!0;return null};rh.prototype.nc=function(a){if(a=this.b.f[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var sh={SIMPLE:nh,INSETS:oh,INSETS_SLASH:ph,COMMA:qh,FONT:rh};
function th(){this.g={};this.A={};this.l={};this.b={};this.f={};this.h={};this.u=[];this.j=[]}function uh(a,b){var c;if(3==b.type)c=new F(b.L,b.text);else if(7==b.type)c=Af(b.text);else if(1==b.type)c=D(b.text);else throw Error("unexpected replacement");if(Zg(a)){var d=a.X[0].eb.f,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function vh(a,b,c){for(var d=new Wg,e=0;e<b;e++)ah(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)ah(d,a,3);else for(e=b;e<c;e++)ah(d,a.clone(),2);return d}function wh(a){var b=new Wg,c=b.X.length;b.X.push(new Ug(a));a=new Vg(c,!0);var d=new Vg(c,!1);b.connect(b.match,c);b.g?(b.f.push(b.b.length),b.g=!1):b.error.push(b.b.length);b.b.push(d);b.match.push(b.b.length);b.b.push(a);return b}
function xh(a,b){var c;switch(a){case "COMMA":c=new fh(b);break;case "SPACE":c=new eh(b);break;default:c=new gh(a.toLowerCase(),b)}return wh(c)}
function yh(a){a.b.HASHCOLOR=wh(new $g(64,U,U));a.b.POS_INT=wh(new $g(32,U,U));a.b.POS_NUM=wh(new $g(16,U,U));a.b.POS_PERCENTAGE=wh(new $g(8,U,{"%":C}));a.b.NEGATIVE=wh(new $g(256,U,U));a.b.ZERO=wh(new $g(512,U,U));a.b.ZERO_PERCENTAGE=wh(new $g(1024,U,U));a.b.POS_LENGTH=wh(new $g(8,U,{em:C,ex:C,ch:C,rem:C,vw:C,vh:C,vi:C,vb:C,vmin:C,vmax:C,pvw:C,pvh:C,pvi:C,pvb:C,pvmin:C,pvmax:C,cm:C,mm:C,"in":C,px:C,pt:C,pc:C,q:C}));a.b.POS_ANGLE=wh(new $g(8,U,{deg:C,grad:C,rad:C,turn:C}));a.b.POS_TIME=wh(new $g(8,
U,{s:C,ms:C}));a.b.FREQUENCY=wh(new $g(8,U,{Hz:C,kHz:C}));a.b.RESOLUTION=wh(new $g(8,U,{dpi:C,dpcm:C,dppx:C}));a.b.URI=wh(new $g(128,U,U));a.b.IDENT=wh(new $g(4,U,U));a.b.STRING=wh(new $g(2,U,U));a.b.SLASH=wh(new $g(2048,U,U));var b={"font-family":D("sans-serif")};a.f.caption=b;a.f.icon=b;a.f.menu=b;a.f["message-box"]=b;a.f["small-caption"]=b;a.f["status-bar"]=b}function zh(a){return!!a.match(/^[A-Z_0-9]+$/)}
function Ah(a,b,c){var d=R(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{S(b);d=R(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;S(b);d=R(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");S(b);d=R(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return S(b),null;d=d.text;S(b);if(2!=c){if(39!=R(b).type)throw Error("'=' expected");zh(d)||(a.A[d]=e)}else if(18!=R(b).type)throw Error("':' expected");return d}
function Bh(a,b){for(var c={};;){var d=Ah(a,b,1);if(!d)break;c.ra=[];var e=[];c.bb="";var f=void 0;c.ab=!0;c.ig=a;for(var g=function(a){return function(){if(!a.ra.length)throw Error("No values");var b;if(1==a.ra.length)b=a.ra[0];else{var c=a.bb,d=a.ra;b=new Wg;if("||"==c){for(c=0;c<d.length;c++){var e=new Wg;if(e.X.length)throw Error("invalid call");var f=new Ug(Yg);f.b=2*c+1;e.X.push(f);var f=new Vg(0,!0),g=new Vg(0,!1);e.f.push(e.b.length);e.b.push(g);e.match.push(e.b.length);e.b.push(f);ah(e,d[c],
1);Xg(e,e.match,!1,c);ah(b,e,c?4:1)}d=new Wg;if(d.X.length)throw Error("invalid call");Xg(d,d.match,!0,-1);ah(d,b,3);b=[d.match,d.f,d.error];for(c=0;c<b.length;c++)Xg(d,b[c],!1,-1);b=d}else{switch(c){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(c=0;c<d.length;c++)ah(b,d[c],c?e:1)}}return b}}(c),h=function(a){return function(b){if(a.ab)throw Error("'"+b+"': unexpected");if(a.bb&&a.bb!=b)throw Error("mixed operators: '"+b+"' and '"+a.bb+"'");a.bb=b;a.ab=
!0}}(c),l=null;!l;)switch(S(b),f=R(b),f.type){case 1:c.ab||h(" ");if(zh(f.text)){var k=a.b[f.text];if(!k)throw Error("'"+f.text+"' unexpected");c.ra.push(k.clone())}else k={},k[f.text.toLowerCase()]=D(f.text),c.ra.push(wh(new $g(0,k,U)));c.ab=!1;break;case 5:k={};k[""+f.L]=new Qc(f.L);c.ra.push(wh(new $g(0,k,U)));c.ab=!1;break;case 34:h("|");break;case 25:h("||");break;case 14:c.ab||h(" ");e.push({ra:c.ra,bb:c.bb,Nb:"["});c.bb="";c.ra=[];c.ab=!0;break;case 6:c.ab||h(" ");e.push({ra:c.ra,bb:c.bb,Nb:"(",
Nc:f.text});c.bb="";c.ra=[];c.ab=!0;break;case 15:f=g();k=e.pop();if("["!=k.Nb)throw Error("']' unexpected");c.ra=k.ra;c.ra.push(f);c.bb=k.bb;c.ab=!1;break;case 11:f=g();k=e.pop();if("("!=k.Nb)throw Error("')' unexpected");c.ra=k.ra;c.ra.push(xh(k.Nc,f));c.bb=k.bb;c.ab=!1;break;case 18:if(c.ab)throw Error("':' unexpected");S(b);c.ra.push(uh(c.ra.pop(),R(b)));break;case 22:if(c.ab)throw Error("'?' unexpected");c.ra.push(vh(c.ra.pop(),0,1));break;case 36:if(c.ab)throw Error("'*' unexpected");c.ra.push(vh(c.ra.pop(),
0,Number.POSITIVE_INFINITY));break;case 23:if(c.ab)throw Error("'+' unexpected");c.ra.push(vh(c.ra.pop(),1,Number.POSITIVE_INFINITY));break;case 12:S(b);f=R(b);if(5!=f.type)throw Error("<int> expected");var m=k=f.L;S(b);f=R(b);if(16==f.type){S(b);f=R(b);if(5!=f.type)throw Error("<int> expected");m=f.L;S(b);f=R(b)}if(13!=f.type)throw Error("'}' expected");c.ra.push(vh(c.ra.pop(),k,m));break;case 17:l=g();if(0<e.length)throw Error("unclosed '"+e.pop().Nb+"'");break;default:throw Error("unexpected token");
}S(b);zh(d)?a.b[d]=l:a.g[d]=1!=l.X.length||l.X[0].b?new eh(l):l.X[0].eb;c={ra:c.ra,ig:c.ig,bb:c.bb,ab:c.ab}}}function Ch(a,b){for(var c={},d=t(b),e=d.next();!e.done;e=d.next())for(var e=e.value,f=a.h[e],e=t(f?f.f:[e]),f=e.next();!f.done;f=e.next()){var f=f.value,g=a.l[f];g?c[f]=g:w.b("Unknown property in makePropSet:",f)}return c}
function Dh(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h&&(f=h[1],b=h[2]);if((h=a.A[b])&&h[f])if(f=a.g[b])(a=c===sd||c.ef()?c:c.fa(f))?e.Sb(b,a,d):e.hd(g,c);else if(b=a.h[b].clone(),c===sd)for(c=t(b.f),g=c.next();!g.done;g=c.next())e.Sb(g.value,sd,d);else{c.fa(b);if(b.error)d=!1;else{a=t(b.f);for(f=a.next();!f.done;f=a.next())f=f.value,e.Sb(f,b.values[f]||b.b.l[f],d);d=!0}d||e.hd(g,c)}else e.ee(g,c)}
var Eh=new Ge(function(){var a=L("loadValidatorSet.load"),b=Aa("validation.txt",za),c=uf(b),d=new th;yh(d);c.then(function(c){try{if(c.responseText){var e=new qf(c.responseText,null);for(Bh(d,e);;){var g=Ah(d,e,2);if(!g)break;for(c=[];;){S(e);var h=R(e);if(17==h.type){S(e);break}switch(h.type){case 1:c.push(D(h.text));break;case 4:c.push(new Pc(h.L));break;case 5:c.push(new Qc(h.L));break;case 3:c.push(new F(h.L,h.text));break;default:throw Error("unexpected token");}}d.l[g]=1<c.length?new Gc(c):
c[0]}for(;;){var l=Ah(d,e,3);if(!l)break;var k=sf(e,1),m;1==k.type&&sh[k.text]?(m=new sh[k.text],S(e)):m=new nh;m.b=d;g=!1;h=[];c=!1;for(var p=[],q=[];!g;)switch(S(e),k=R(e),k.type){case 1:if(d.g[k.text])h.push(new ih(m.b,k.text)),q.push(k.text);else if(d.h[k.text]instanceof oh){var r=d.h[k.text];h.push(new jh(r.b,r.f));q.push.apply(q,[].concat(ia(r.f)))}else throw Error("'"+k.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<h.length||c)throw Error("unexpected slash");
c=!0;break;case 14:p.push({sf:c,zb:h});h=[];c=!1;break;case 15:var z=new kh(h,c),u=p.pop(),h=u.zb;c=u.sf;h.push(z);break;case 17:g=!0;S(e);break;default:throw Error("unexpected token");}m.Ue(h,q);d.h[l]=m}d.j=Ch(d,["background"]);d.u=Ch(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else w.error("Error: missing",b)}catch(A){w.error(A,"Error:")}O(a,d)});return a.result()},"validatorFetcher");var Fh={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,"clip-rule":!0,color:!0,"color-interpolation":!0,"color-rendering":!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,fill:!0,"fill-opacity":!0,"fill-rule":!0,"font-kerning":!0,"font-size":!0,"font-size-adjust":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-stretch":!0,"font-variant":!0,"font-weight":!0,"glyph-orientation-vertical":!0,hyphens:!0,"hyphenate-character":!0,"hyphenate-limit-chars":!0,
"hyphenate-limit-last":!0,"image-rendering":!0,"image-resolution":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,marker:!0,"marker-end":!0,"marker-mid":!0,"marker-start":!0,orphans:!0,"overflow-wrap":!0,"paint-order":!0,"pointer-events":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,"shape-rendering":!0,stress:!0,stroke:!0,
"stroke-dasharray":!0,"stroke-dashoffset":!0,"stroke-linecap":!0,"stroke-linejoin":!0,"stroke-miterlimit":!0,"stroke-opacity":!0,"stroke-width":!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-anchor":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-rendering":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,
volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},Gh=["box-decoration-break","image-resolution","orphans","widows"];function Hh(){return ge("POLYFILLED_INHERITED_PROPS").reduce(function(a,b){return a.concat(b())},[].concat(Gh))}
for(var Ih={"http://www.idpf.org/2007/ops":!0,"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},Jh="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),Kh=["max-%","min-%","%"],Lh=["left","right","top","bottom"],Mh={width:!0,height:!0,"max-width":!0,"max-height":!0,"min-width":!0,"min-height":!0},Nh=0;Nh<Jh.length;Nh++)for(var Oh=0;Oh<Lh.length;Oh++){var Ph=Jh[Nh].replace("%",Lh[Oh]);Mh[Ph]=!0}
function Qh(a,b){for(var c={},d=t(Jh),e=d.next();!e.done;e=d.next()){var e=e.value,f;for(f in a){var g=e.replace("%",f),h=e.replace("%",a[f]);c[g]=h;c[h]=g}}d=t(Kh);for(f=d.next();!f.done;f=d.next()){f=f.value;for(var l in b)e=f.replace("%",l),g=f.replace("%",b[l]),c[e]=g,c[g]=e}return c}
var Rh=Qh({"block-start":"right","block-end":"left","inline-start":"top","inline-end":"bottom"},{"block-size":"width","inline-size":"height"}),Sh=Qh({"block-start":"top","block-end":"bottom","inline-start":"left","inline-end":"right"},{"block-size":"height","inline-size":"width"}),Th=Qh({"block-start":"right","block-end":"left","inline-start":"bottom","inline-end":"top"},{"block-size":"width","inline-size":"height"}),Uh=Qh({"block-start":"top","block-end":"bottom","inline-start":"right","inline-end":"left"},
{"block-size":"height","inline-size":"width"});function V(a,b){this.value=a;this.cb=b}n=V.prototype;n.Qf=function(){return this};n.Nd=function(a){a=this.value.fa(a);return a===this.value?this:new V(a,this.cb)};n.Sf=function(a){return a?new V(this.value,this.cb+a):this};n.evaluate=function(a,b){return mg(a,this.value,b)};n.zf=function(){return!0};function Vh(a,b,c){V.call(this,a,b);this.ia=c}v(Vh,V);Vh.prototype.Qf=function(){return new V(this.value,this.cb)};
Vh.prototype.Nd=function(a){a=this.value.fa(a);return a===this.value?this:new Vh(a,this.cb,this.ia)};Vh.prototype.Sf=function(a){return a?new Vh(this.value,this.cb+a,this.ia):this};Vh.prototype.zf=function(a){return!!this.ia.evaluate(a)};function Wh(a,b,c){return(!b||c.cb>b.cb)&&c.zf(a)?c.Qf():b}var Xh={"region-id":!0,"fragment-selector-id":!0};function Yh(a){return"_"!=a.charAt(0)&&!Xh[a]}function Zh(a,b,c){c?a[b]=c:delete a[b]}function $h(a,b){var c=a[b];c||(c={},a[b]=c);return c}
function ai(a){var b=a._viewConditionalStyles;b||(b=[],a._viewConditionalStyles=b);return b}function bi(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function ci(a,b,c,d,e,f,g){[{id:e,mg:"_pseudos"},{id:f,mg:"_regions"}].forEach(function(a){if(a.id){var c=$h(b,a.mg);b=c[a.id];b||(b={},c[a.id]=b)}});g&&(e=ai(b),b={},e.push({Mg:b,Cg:g}));for(var h in c)"_"!=h.charAt(0)&&(Xh[h]?(g=c[h],e=bi(b,h),Array.prototype.push.apply(e,g)):Zh(b,h,Wh(a,b[h],c[h].Sf(d))))}
function di(a,b){if(0<a.length){a.sort(function(a,b){return b.f()-a.f()});for(var c=null,d=a.length-1;0<=d;d--)c=a[d],c.b=b,b=c;return c}return b}function ei(a,b){this.g=a;this.f=b;this.b=""}v(ei,Fc);function fi(a){a=a.g["font-size"].value;var b;a:switch(a.ka.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.L*Nb[a.ka]}
ei.prototype.Zc=function(a){if("font-size"===this.b){var b=fi(this),c=this.f;a=gi(a,b,c);var d=a.ka,e=a.L;return"px"===d?a:"%"===d?new F(e/100*b,"px"):new F(e*Rb(c,d,!1),"px")}if("em"==a.ka||"ex"==a.ka||"rem"==a.ka)return gi(a,fi(this),this.f);if("%"==a.ka){if("line-height"===this.b)return a;b=this.b.match(/height|^(top|bottom)$/)?"vh":"vw";return new F(a.L,b)}return a};ei.prototype.Wc=function(a){return"font-size"==this.b?mg(this.f,a,this.b).fa(this):a};
function gi(a,b,c){var d=a.ka,e=a.L;return"em"===d||"ex"===d?new F(Nb[d]/Nb.em*e*b,"px"):"rem"===d?new F(e*c.fontSize(),"px"):a}function hi(){}hi.prototype.apply=function(){};hi.prototype.l=function(a){return new ii([this,a])};hi.prototype.clone=function(){return this};function ji(a){this.b=a}v(ji,hi);ji.prototype.apply=function(a){var b=this.b.g(a);a.h[a.h.length-1].push(b)};function ii(a){this.b=a}v(ii,hi);ii.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};
ii.prototype.l=function(a){this.b.push(a);return this};ii.prototype.clone=function(){return new ii([].concat(this.b))};function ki(a,b,c,d,e){this.style=a;this.ba=b;this.b=c;this.h=d;this.j=e}v(ki,hi);ki.prototype.apply=function(a){ci(a.l,a.F,this.style,this.ba,this.b,this.h,li(a,this.j))};function W(){this.b=null}v(W,hi);W.prototype.apply=function(a){this.b.apply(a)};W.prototype.f=function(){return 0};W.prototype.g=function(){return!1};function mi(a){this.b=null;this.h=a}v(mi,W);
mi.prototype.apply=function(a){a.G.includes(this.h)&&this.b.apply(a)};mi.prototype.f=function(){return 10};mi.prototype.g=function(a){this.b&&ni(a.Pa,this.h,this.b);return!0};function oi(a){this.b=null;this.id=a}v(oi,W);oi.prototype.apply=function(a){a.Y!=this.id&&a.la!=this.id||this.b.apply(a)};oi.prototype.f=function(){return 11};oi.prototype.g=function(a){this.b&&ni(a.g,this.id,this.b);return!0};function pi(a){this.b=null;this.localName=a}v(pi,W);
pi.prototype.apply=function(a){a.f==this.localName&&this.b.apply(a)};pi.prototype.f=function(){return 8};pi.prototype.g=function(a){this.b&&ni(a.xd,this.localName,this.b);return!0};function qi(a,b){this.b=null;this.h=a;this.localName=b}v(qi,W);qi.prototype.apply=function(a){a.f==this.localName&&a.j==this.h&&this.b.apply(a)};qi.prototype.f=function(){return 8};qi.prototype.g=function(a){if(this.b){var b=a.b[this.h];b||(b="ns"+a.j++ +":",a.b[this.h]=b);ni(a.h,b+this.localName,this.b)}return!0};
function ri(a){this.b=null;this.h=a}v(ri,W);ri.prototype.apply=function(a){var b=a.b;if(b&&"a"==a.f){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.h)&&this.b.apply(a)}};function si(a){this.b=null;this.h=a}v(si,W);si.prototype.apply=function(a){a.j==this.h&&this.b.apply(a)};function ti(a,b){this.b=null;this.h=a;this.name=b}v(ti,W);
ti.prototype.apply=function(a){a.b&&a.b.hasAttributeNS(this.h,this.name)&&this.b.apply(a)};function ui(a,b,c){this.b=null;this.h=a;this.name=b;this.value=c}v(ui,W);ui.prototype.apply=function(a){a.b&&a.b.getAttributeNS(this.h,this.name)==this.value&&this.b.apply(a)};ui.prototype.f=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?9:0};ui.prototype.g=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?(this.b&&ni(a.f,this.value,this.b),!0):!1};
function vi(a,b){this.b=null;this.h=a;this.name=b}v(vi,W);vi.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.h,this.name);b&&Ih[b]&&this.b.apply(a)}};vi.prototype.f=function(){return 0};vi.prototype.g=function(){return!1};function wi(a,b,c){this.b=null;this.j=a;this.name=b;this.h=c}v(wi,W);wi.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.j,this.name);b&&b.match(this.h)&&this.b.apply(a)}};function xi(a){this.b=null;this.h=a}v(xi,W);
xi.prototype.apply=function(a){a.lang.match(this.h)&&this.b.apply(a)};function yi(){this.b=null}v(yi,W);yi.prototype.apply=function(a){a.ob&&this.b.apply(a)};yi.prototype.f=function(){return 6};function zi(){this.b=null}v(zi,W);zi.prototype.apply=function(a){a.ta&&this.b.apply(a)};zi.prototype.f=function(){return 12};function Ai(a,b){this.b=null;this.h=a;this.Nb=b}v(Ai,W);function Bi(a,b,c){a-=c;return b?!(a%b)&&0<=a/b:!a}function Ci(a,b){Ai.call(this,a,b)}v(Ci,Ai);
Ci.prototype.apply=function(a){Bi(a.Za,this.h,this.Nb)&&this.b.apply(a)};Ci.prototype.f=function(){return 5};function Di(a,b){Ai.call(this,a,b)}v(Di,Ai);Di.prototype.apply=function(a){Bi(a.Jb[a.j][a.f],this.h,this.Nb)&&this.b.apply(a)};Di.prototype.f=function(){return 5};function Ei(a,b){Ai.call(this,a,b)}v(Ei,Ai);Ei.prototype.apply=function(a){var b=a.R;null===b&&(b=a.R=a.b.parentNode.childElementCount-a.Za+1);Bi(b,this.h,this.Nb)&&this.b.apply(a)};Ei.prototype.f=function(){return 4};
function Fi(a,b){Ai.call(this,a,b)}v(Fi,Ai);Fi.prototype.apply=function(a){var b=a.Bb;if(!b[a.j]){var c=a.b;do{var d=c.namespaceURI,e=c.localName,f=b[d];f||(f=b[d]={});f[e]=(f[e]||0)+1}while(c=c.nextElementSibling)}Bi(b[a.j][a.f],this.h,this.Nb)&&this.b.apply(a)};Fi.prototype.f=function(){return 4};function Gi(){this.b=null}v(Gi,W);Gi.prototype.apply=function(a){for(var b=a.b.firstChild;b;){switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0<b.length)return}b=b.nextSibling}this.b.apply(a)};
Gi.prototype.f=function(){return 4};function Hi(){this.b=null}v(Hi,W);Hi.prototype.apply=function(a){!1===a.b.disabled&&this.b.apply(a)};Hi.prototype.f=function(){return 5};function Ii(){this.b=null}v(Ii,W);Ii.prototype.apply=function(a){!0===a.b.disabled&&this.b.apply(a)};Ii.prototype.f=function(){return 5};function Ji(){this.b=null}v(Ji,W);Ji.prototype.apply=function(a){var b=a.b;!0!==b.selected&&!0!==b.checked||this.b.apply(a)};Ji.prototype.f=function(){return 5};
function Ki(a){this.b=null;this.ia=a}v(Ki,W);Ki.prototype.apply=function(a){if(a.ca[this.ia])try{a.fb.push(this.ia),this.b.apply(a)}finally{a.fb.pop()}};Ki.prototype.f=function(){return 5};function Li(){this.b=!1}v(Li,hi);Li.prototype.apply=function(){this.b=!0};Li.prototype.clone=function(){var a=new Li;a.b=this.b;return a};function Mi(a){this.b=null;this.h=new Li;this.j=di(a,this.h)}v(Mi,W);Mi.prototype.apply=function(a){this.j.apply(a);this.h.b||this.b.apply(a);this.h.b=!1};Mi.prototype.f=function(){return this.j.f()};
function Ni(a,b,c){this.ia=a;this.b=b;this.j=c}function Oi(a,b){var c=a.ia,d=a.j;b.ca[c]=(b.ca[c]||0)+1;d&&(b.A[c]?b.A[c].push(d):b.A[c]=[d])}function Pi(a,b){Qi(b,a.ia,a.j)}function Ri(a,b,c){Ni.call(this,a,b,c)}v(Ri,Ni);Ri.prototype.g=function(a){return new Ri(this.ia,this.b,li(a,this.b))};Ri.prototype.push=function(a,b){b||Oi(this,a);return!1};Ri.prototype.f=function(a,b){return b?!1:(Pi(this,a),!0)};function Si(a,b,c){Ni.call(this,a,b,c)}v(Si,Ni);
Si.prototype.g=function(a){return new Si(this.ia,this.b,li(a,this.b))};Si.prototype.push=function(a,b){b?1==b&&Pi(this,a):Oi(this,a);return!1};Si.prototype.f=function(a,b){if(b)1==b&&Oi(this,a);else return Pi(this,a),!0;return!1};function Ti(a,b,c){Ni.call(this,a,b,c);this.h=!1}v(Ti,Ni);Ti.prototype.g=function(a){return new Ti(this.ia,this.b,li(a,this.b))};Ti.prototype.push=function(a){return this.h?(Pi(this,a),!0):!1};
Ti.prototype.f=function(a,b){if(this.h)return Pi(this,a),!0;b||(this.h=!0,Oi(this,a));return!1};function Ui(a,b,c){Ni.call(this,a,b,c);this.h=!1}v(Ui,Ni);Ui.prototype.g=function(a){return new Ui(this.ia,this.b,li(a,this.b))};Ui.prototype.push=function(a,b){this.h&&(-1==b?Oi(this,a):b||Pi(this,a));return!1};Ui.prototype.f=function(a,b){if(this.h){if(-1==b)return Pi(this,a),!0;b||Oi(this,a)}else b||(this.h=!0,Oi(this,a));return!1};function Vi(a,b){this.b=a;this.element=b}Vi.prototype.g=function(){return this};
Vi.prototype.push=function(){return!1};Vi.prototype.f=function(a,b){return b?!1:(Wi(a,this.b,this.element),!0)};function Xi(a){this.lang=a}Xi.prototype.g=function(){return this};Xi.prototype.push=function(){return!1};Xi.prototype.f=function(a,b){return b?!1:(a.lang=this.lang,!0)};function Yi(a){this.b=a}Yi.prototype.g=function(){return this};Yi.prototype.push=function(){return!1};Yi.prototype.f=function(a,b){return b?!1:(a.J=this.b,!0)};function Zi(a){this.element=a}v(Zi,Fc);
function $i(a,b){switch(b){case "url":return a?new Sc(a):new Sc("about:invalid");default:return a?new Nc(a):new Nc("")}}
Zi.prototype.Xb=function(a){if("attr"!==a.name)return Fc.prototype.Xb.call(this,a);var b="string",c;a.values[0]instanceof Gc?(2<=a.values[0].values.length&&(b=a.values[0].values[1].stringValue()),c=a.values[0].values[0].stringValue()):c=a.values[0].stringValue();a=1<a.values.length?$i(a.values[1].stringValue(),b):$i(null,b);return this.element&&this.element.hasAttribute(c)?$i(this.element.getAttribute(c),b):a};function aj(a,b,c){this.f=a;this.element=b;this.b=c}v(aj,Fc);
aj.prototype.nc=function(a){var b=this.f,c=b.J,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.D)];b.D++;break;case "close-quote":return 0<b.D&&b.D--,c[2*Math.min(d,b.D)+1];case "no-open-quote":return b.D++,new Nc("");case "no-close-quote":return 0<b.D&&b.D--,new Nc("")}return a};
var bj={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},cj={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
dj={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},ej={oh:!1,dd:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",Td:"\u5341\u767e\u5343",Fg:"\u8ca0"};
function fj(a){if(9999<a||-9999>a)return""+a;if(!a)return ej.dd.charAt(0);var b=new Qa;0>a&&(b.append(ej.Fg),a=-a);if(10>a)b.append(ej.dd.charAt(a));else if(ej.ph&&19>=a)b.append(ej.Td.charAt(0)),a&&b.append(ej.Td.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(ej.dd.charAt(c)),b.append(ej.Td.charAt(2)));if(c=Math.floor(a/100)%10)b.append(ej.dd.charAt(c)),b.append(ej.Td.charAt(1));if(c=Math.floor(a/10)%10)b.append(ej.dd.charAt(c)),b.append(ej.Td.charAt(0));(a%=10)&&b.append(ej.dd.charAt(a))}return b.toString()}
aj.prototype.format=function(a,b){var c=!1,d=!1,e;if(e=b.match(/^upper-(.*)/))c=!0,b=e[1];else if(e=b.match(/^lower-(.*)/))d=!0,b=e[1];e="";if(bj[b])a:{e=bj[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",h=1;h<e.length;h+=2){var l=e[h],k=Math.floor(f/l);if(20<k){e="";break a}for(f-=k*l;0<k;)g+=e[h+1],k--}e=g}}else if(cj[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=cj[b];f=[];for(h=0;h<g.length;)if("-"==g.substr(h+1,1))for(k=g.charCodeAt(h),l=g.charCodeAt(h+2),h+=3;k<=l;k++)f.push(String.fromCharCode(k));
else f.push(g.substr(h++,1));g="";do e--,h=e%f.length,g=f[h]+g,e=(e-h)/f.length;while(0<e);e=g}else null!=dj[b]?e=dj[b]:"decimal-leading-zero"==b?(e=""+a,1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=fj(a):e=""+a;return c?e.toUpperCase():d?e.toLowerCase():e};
function gj(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.f.g[c];if(e&&e.length)return new Nc(a.format(e&&e.length&&e[e.length-1]||0,d));c=new G(hj(a.b,c,function(b){return a.format(b||0,d)}));return new Gc([c])}
function ij(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.f.g[c],g=new Qa;if(f&&f.length)for(var h=0;h<f.length;h++)0<h&&g.append(d),g.append(a.format(f[h],e));c=new G(jj(a.b,c,function(b){var c=[];if(b.length)for(var f=0;f<b.length;f++)c.push(a.format(b[f],e));b=g.toString();b.length&&c.push(b);return c.length?c.join(d):a.format(0,e)}));return new Gc([c])}
function kj(a,b){var c=b[0],c=c instanceof Sc?c.url:c.stringValue(),d=b[1].toString(),e=2<b.length?b[2].stringValue():"decimal",c=new G(lj(a.b,c,d,function(b){return a.format(b||0,e)}));return new Gc([c])}function mj(a,b){var c=b[0],c=c instanceof Sc?c.url:c.stringValue(),d=b[1].toString(),e=b[2].stringValue(),f=3<b.length?b[3].stringValue():"decimal",c=new G(nj(a.b,c,d,function(b){b=b.map(function(b){return a.format(b,f)});return b.length?b.join(e):a.format(0,f)}));return new Gc([c])}
aj.prototype.Xb=function(a){switch(a.name){case "counter":if(2>=a.values.length)return gj(this,a.values);break;case "counters":if(3>=a.values.length)return ij(this,a.values);break;case "target-counter":if(3>=a.values.length)return kj(this,a.values);break;case "target-counters":if(4>=a.values.length)return mj(this,a.values)}w.b("E_CSS_CONTENT_PROP:",a.toString());return new Nc("")};var oj=1/1048576;function pj(a,b){for(var c in a)b[c]=a[c].clone()}
function qj(){this.j=0;this.b={};this.xd={};this.h={};this.f={};this.Pa={};this.g={};this.md={};this.order=0}qj.prototype.clone=function(){var a=new qj;a.j=this.j;for(var b in this.b)a.b[b]=this.b[b];pj(this.xd,a.xd);pj(this.h,a.h);pj(this.f,a.f);pj(this.Pa,a.Pa);pj(this.g,a.g);pj(this.md,a.md);a.order=this.order;return a};function ni(a,b,c){var d=a[b];d&&(c=d.l(c));a[b]=c}qj.prototype.nf=function(){return this.order+=oj};
function rj(a,b,c,d){this.u=a;this.l=b;this.Hc=c;this.wb=d;this.h=[[],[]];this.ca={};this.G=this.F=this.ua=this.b=null;this.Ba=this.la=this.Y=this.j=this.f="";this.Z=this.N=null;this.ta=this.ob=!0;this.g={};this.H=[{}];this.J=[new Nc("\u201c"),new Nc("\u201d"),new Nc("\u2018"),new Nc("\u2019")];this.D=0;this.lang="";this.Mb=[0];this.Za=0;this.sa=[{}];this.Jb=this.sa[0];this.R=null;this.Lb=[this.R];this.Ib=[{}];this.Bb=this.sa[0];this.A={};this.fb=[];this.Kb=[]}
function Qi(a,b,c){a.ca[b]--;a.A[b]&&(a.A[b]=a.A[b].filter(function(a){return a!==c}),a.A[b].length||delete a.A[b])}function li(a,b){var c=null;b&&(c=sj(a.ua,b));var d=a.fb.map(function(b){return(b=a.A[b])&&0<b.length?1===b.length?b[0]:new tj([].concat(b)):null}).filter(function(a){return a});return 0>=d.length?c:c?new uj([c].concat(d)):1===d.length?d[0]:new uj(d)}function vj(a,b,c){(b=b[c])&&b.apply(a)}var wj=[];
function xj(a,b,c,d){a.b=null;a.ua=null;a.F=d;a.j="";a.f="";a.Y="";a.la="";a.G=b;a.Ba="";a.N=wj;a.Z=c;yj(a)}function zj(a,b,c){a.g[b]?a.g[b].push(c):a.g[b]=[c];c=a.H[a.H.length-1];c||(c={},a.H[a.H.length-1]=c);c[b]=!0}
function Aj(a,b){var c=td,d=b.display;d&&(c=d.evaluate(a.l));var e=null,f=d=null,g=b["counter-reset"];g&&(g=g.evaluate(a.l))&&(e=Sg(g,!0));(g=b["counter-set"])&&(g=g.evaluate(a.l))&&(f=Sg(g,!1));(g=b["counter-increment"])&&(g=g.evaluate(a.l))&&(d=Sg(g,!1));"ol"!=a.f&&"ul"!=a.f||"http://www.w3.org/1999/xhtml"!=a.j||(e||(e={}),e["ua-list-item"]=0);c===Ad&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var h in e)zj(a,h,e[h]);if(f)for(var l in f)a.g[l]?(h=a.g[l],h[h.length-1]=f[l]):zj(a,l,f[l]);if(d)for(var k in d)a.g[k]||
zj(a,k,0),h=a.g[k],h[h.length-1]+=d[k];c===Ad&&(c=a.g["ua-list-item"],b["ua-list-item-count"]=new V(new Pc(c[c.length-1]),0));a.H.push(null)}function Bj(a){var b=a.H.pop();if(b)for(var c in b)(b=a.g[c])&&(1==b.length?delete a.g[c]:b.pop())}function Wi(a,b,c){Aj(a,b);b.content&&(b.content=b.content.Nd(new aj(a,c,a.wb)));Bj(a)}var Cj="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function Dj(a,b,c,d){a.Kb.push(b);a.Z=null;a.b=b;a.ua=d;a.F=c;a.j=b.namespaceURI;a.f=b.localName;d=a.u.b[a.j];a.Ba=d?d+a.f:"";a.Y=b.getAttribute("id");a.la=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.G=d.split(/\s+/):a.G=wj;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.N=d.split(/\s+/):a.N=wj;"style"==a.f&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.j&&(a.G=[b.getAttribute("name")||""]);if(d=Pa(b))a.h[a.h.length-1].push(new Xi(a.lang)),
a.lang=d.toLowerCase();d=a.ta;var e=a.Mb;a.Za=++e[e.length-1];e.push(0);var e=a.sa,f=a.Jb=e[e.length-1],g=f[a.j];g||(g=f[a.j]={});g[a.f]=(g[a.f]||0)+1;e.push({});e=a.Lb;null!==e[e.length-1]?a.R=--e[e.length-1]:a.R=null;e.push(null);e=a.Ib;(f=a.Bb=e[e.length-1])&&f[a.j]&&f[a.j][a.f]--;e.push({});yj(a);Ej(a,b);e=c.quotes;c=null;e&&(e=e.evaluate(a.l))&&(c=new Yi(a.J),e===J?a.J=[new Nc(""),new Nc("")]:e instanceof Gc&&(a.J=e.values));Aj(a,a.F);e=a.Y||a.la||b.getAttribute("name")||"";if(d||e){var h={};
Object.keys(a.g).forEach(function(a){h[a]=Array.from(this.g[a])},a);Fj(a.Hc,e,h)}if(d=a.F._pseudos)for(e=!0,f=t(Cj),g=f.next();!g.done;g=f.next())(g=g.value)||(e=!1),(g=d[g])&&(e?Wi(a,g,b):a.h[a.h.length-2].push(new Vi(g,b)));c&&a.h[a.h.length-2].push(c)}function Gj(a,b){for(var c in b)Yh(c)&&(b[c]=b[c].Nd(a))}function Ej(a,b){var c=new Zi(b),d=a.F,e=d._pseudos,f;for(f in e)Gj(c,e[f]);Gj(c,d)}
function yj(a){var b;for(b=0;b<a.G.length;b++)vj(a,a.u.Pa,a.G[b]);for(b=0;b<a.N.length;b++)vj(a,a.u.f,a.N[b]);vj(a,a.u.g,a.Y);vj(a,a.u.xd,a.f);""!=a.f&&vj(a,a.u.xd,"*");vj(a,a.u.h,a.Ba);null!==a.Z&&(vj(a,a.u.md,a.Z),vj(a,a.u.md,"*"));a.b=null;a.h.push([]);for(var c=1;-1<=c;--c){var d=a.h[a.h.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.ob=!0;a.ta=!1}
function Hj(a){for(var b=1;-1<=b;--b)for(var c=a.h[a.h.length-b-2],d=0;d<c.length;)c[d].f(a,b)?c.splice(d,1):d++;a.h.pop();a.ob=!1}var Ij=null;function Jj(a,b,c,d,e,f,g){Gf.call(this,a,b,g);this.b=null;this.ba=0;this.h=this.mb=null;this.D=!1;this.ia=c;this.l=d?d.l:Ij?Ij.clone():new qj;this.G=e;this.A=f;this.u=0;this.j=null}v(Jj,Hf);Jj.prototype.Uf=function(a){ni(this.l.xd,"*",a)};function Kj(a,b){var c=di(a.b,b);c!==b&&c.g(a.l)||a.Uf(c)}
Jj.prototype.Wb=function(a,b){if(b||a)this.ba+=1,b&&a?this.b.push(new qi(a,b.toLowerCase())):b?this.b.push(new pi(b.toLowerCase())):this.b.push(new si(a))};Jj.prototype.ne=function(a){this.h?(w.b("::"+this.h,"followed by ."+a),this.b.push(new Ki(""))):(this.ba+=256,this.b.push(new mi(a)))};var Lj={"nth-child":Ci,"nth-of-type":Di,"nth-last-child":Ei,"nth-last-of-type":Fi};
Jj.prototype.od=function(a,b){if(this.h)w.b("::"+this.h,"followed by :"+a),this.b.push(new Ki(""));else{switch(a.toLowerCase()){case "enabled":this.b.push(new Hi);break;case "disabled":this.b.push(new Ii);break;case "checked":this.b.push(new Ji);break;case "root":this.b.push(new zi);break;case "link":this.b.push(new pi("a"));this.b.push(new ti("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+Fa(b[0])+"($|s)");this.b.push(new ri(c))}else this.b.push(new Ki(""));
break;case "-adapt-footnote-content":case "footnote-content":this.D=!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new Ki(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new xi(new RegExp("^"+Fa(b[0].toLowerCase())+"($|-)"))):this.b.push(new Ki(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c=Lj[a.toLowerCase()];b&&2==b.length?this.b.push(new c(b[0],b[1])):this.b.push(new Ki(""));break;case "first-child":this.b.push(new yi);
break;case "last-child":this.b.push(new Ei(0,1));break;case "first-of-type":this.b.push(new Di(0,1));break;case "last-of-type":this.b.push(new Fi(0,1));break;case "only-child":this.b.push(new yi);this.b.push(new Ei(0,1));break;case "only-of-type":this.b.push(new Di(0,1));this.b.push(new Fi(0,1));break;case "empty":this.b.push(new Gi);break;case "before":case "after":case "first-line":case "first-letter":this.pd(a,b);return;default:w.b("unknown pseudo-class selector: "+a),this.b.push(new Ki(""))}this.ba+=
256}};
Jj.prototype.pd=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":case "after-if-continues":this.h?(w.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new Ki(""))):this.h=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.h?(w.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new Ki(""))):this.h="first-"+c+"-lines";break}}case "nth-fragment":b&&2==
b.length?this.j="NFS_"+b[0]+"_"+b[1]:this.b.push(new Ki(""));break;default:w.b("Unrecognized pseudoelement: ::"+a),this.b.push(new Ki(""))}this.ba+=1};Jj.prototype.ye=function(a){this.ba+=65536;this.b.push(new oi(a))};
Jj.prototype.Ed=function(a,b,c,d){this.ba+=256;b=b.toLowerCase();d=d||"";var e;switch(c){case 0:e=new ti(a,b);break;case 39:e=new ui(a,b,d);break;case 45:!d||d.match(/\s/)?e=new Ki(""):e=new wi(a,b,new RegExp("(^|\\s)"+Fa(d)+"($|\\s)"));break;case 44:e=new wi(a,b,new RegExp("^"+Fa(d)+"($|-)"));break;case 43:d?e=new wi(a,b,new RegExp("^"+Fa(d))):e=new Ki("");break;case 42:d?e=new wi(a,b,new RegExp(Fa(d)+"$")):e=new Ki("");break;case 46:d?e=new wi(a,b,new RegExp(Fa(d))):e=new Ki("");break;case 50:"supported"==
d?e=new vi(a,b):(w.b("Unsupported :: attr selector op:",d),e=new Ki(""));break;default:w.b("Unsupported attr selector:",c),e=new Ki("")}this.b.push(e)};var Mj=0;n=Jj.prototype;n.ac=function(){var a="d"+Mj++;Kj(this,new ji(new Ri(a,this.j,null)));this.b=[new Ki(a)];this.j=null};n.me=function(){var a="c"+Mj++;Kj(this,new ji(new Si(a,this.j,null)));this.b=[new Ki(a)];this.j=null};n.le=function(){var a="a"+Mj++;Kj(this,new ji(new Ti(a,this.j,null)));this.b=[new Ki(a)];this.j=null};
n.se=function(){var a="f"+Mj++;Kj(this,new ji(new Ui(a,this.j,null)));this.b=[new Ki(a)];this.j=null};n.Qc=function(){Nj(this);this.h=null;this.D=!1;this.ba=0;this.b=[]};n.Tb=function(){var a;0!=this.u?(Jf(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.u=1,this.mb={},this.h=null,this.ba=0,this.D=!1,this.b=[])};n.error=function(a,b){Hf.prototype.error.call(this,a,b);1==this.u&&(this.u=0)};n.Uc=function(a){Hf.prototype.Uc.call(this,a);this.u=0};
n.Ka=function(){Nj(this);Hf.prototype.Ka.call(this);1==this.u&&(this.u=0)};n.bc=function(){Hf.prototype.bc.call(this)};function Nj(a){if(a.b){var b=a.ba+a.l.nf();Kj(a,a.Xf(b));a.b=null;a.h=null;a.j=null;a.D=!1;a.ba=0}}n.Xf=function(a){var b=this.G;this.D&&(b=b?"xxx-bogus-xxx":"footnote");return new ki(this.mb,a,this.h,b,this.j)};n.Qb=function(a,b,c){Dh(this.A,a,b,c,this)};n.hd=function(a,b){If(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};
n.ee=function(a,b){If(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};n.Sb=function(a,b,c){"display"!=a||b!==Ed&&b!==Dd||(this.Sb("flow-options",new Gc([kd,Ld]),c),this.Sb("flow-into",b,c),b=ad);ge("SIMPLE_PROPERTY").forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?Cf(this):Df(this);Zh(this.mb,a,this.ia?new Vh(b,d,this.ia):new V(b,d))};n.ud=function(a){switch(a){case "not":a=new Oj(this),a.Tb(),Ff(this.oa,a)}};
function Oj(a){Jj.call(this,a.f,a.oa,a.ia,a,a.G,a.A,!1);this.parent=a;this.g=a.b}v(Oj,Jj);n=Oj.prototype;n.ud=function(a){"not"==a&&Jf(this,"E_CSS_UNEXPECTED_NOT")};n.Ka=function(){Jf(this,"E_CSS_UNEXPECTED_RULE_BODY")};n.Qc=function(){Jf(this,"E_CSS_UNEXPECTED_NEXT_SELECTOR")};n.Ld=function(){this.b&&0<this.b.length&&this.g.push(new Mi(this.b));this.parent.ba+=this.ba;var a=this.oa;a.b=a.g.pop()};n.error=function(a,b){Jj.prototype.error.call(this,a,b);var c=this.oa;c.b=c.g.pop()};
function Pj(a,b){Gf.call(this,a,b,!1)}v(Pj,Hf);Pj.prototype.Qb=function(a,b){if(this.f.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.gd());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new tc(this.f,100,c),c=b.Aa(this.f,c);this.f.values[a]=c}};function Qj(a,b,c,d,e){Gf.call(this,a,b,!1);this.mb=d;this.ia=c;this.b=e}v(Qj,Hf);Qj.prototype.Qb=function(a,b,c){c?w.b("E_IMPORTANT_NOT_ALLOWED"):Dh(this.b,a,b,c,this)};Qj.prototype.hd=function(a,b){w.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
Qj.prototype.ee=function(a,b){w.b("E_INVALID_PROPERTY",a+":",b.toString())};Qj.prototype.Sb=function(a,b,c){c=c?Cf(this):Df(this);c+=this.order;this.order+=oj;Zh(this.mb,a,this.ia?new Vh(b,c,this.ia):new V(b,c))};function Rj(a,b){fg.call(this,a);this.mb={};this.b=b;this.order=0}v(Rj,fg);Rj.prototype.Qb=function(a,b,c){Dh(this.b,a,b,c,this)};Rj.prototype.hd=function(a,b){w.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};Rj.prototype.ee=function(a,b){w.b("E_INVALID_PROPERTY",a+":",b.toString())};
Rj.prototype.Sb=function(a,b,c){c=(c?67108864:50331648)+this.order;this.order+=oj;Zh(this.mb,a,new V(b,c))};function Sj(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==sd?b===Vd:c}function Tj(a,b,c){return(a=a.direction)&&(b=a.evaluate(b,"direction"))&&b!==sd?b===Md:c}function Uj(a,b,c,d){var e={},f;for(f in a)Yh(f)&&(e[f]=a[f]);Vj(e,b,a);Wj(a,c,d,function(a,c){Xj(e,c,b);Vj(e,b,c)});return e}
function Wj(a,b,c,d){a=a._regions;if((b||c)&&a)for(c&&(c=["footnote"],b=b?b.concat(c):c),b=t(b),c=b.next();!c.done;c=b.next()){c=c.value;var e=a[c];e&&d(c,e)}}function Xj(a,b,c){for(var d in b)Yh(d)&&(a[d]=Wh(c,a[d],b[d]))}function Yj(a,b,c,d,e){c=c?d?Th:Rh:d?Uh:Sh;for(var f in a)if(a.hasOwnProperty(f)&&(d=a[f])){var g=c[f];if(g){var h=a[g];if(h&&h.cb>d.cb)continue;g=Mh[g]?g:f}else g=f;b[g]=e(f,d)}};var Zj=!1,ak={dh:"ltr",eh:"rtl"};na("vivliostyle.constants.PageProgression",ak);ak.LTR="ltr";ak.RTL="rtl";var bk={pg:"left",qg:"right"};na("vivliostyle.constants.PageSide",bk);bk.LEFT="left";bk.RIGHT="right";var ck={LOADING:"loading",bh:"interactive",Zg:"complete"};na("vivliostyle.constants.ReadyState",ck);ck.LOADING="loading";ck.INTERACTIVE="interactive";ck.COMPLETE="complete";function dk(a,b,c){this.u=a;this.url=b;this.b=c;this.lang=null;this.h=-1;this.root=c.documentElement;b=a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(var d=this.root.firstChild;d;d=d.nextSibling)if(1==d.nodeType&&(c=d,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":b=c;break;case "body":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){b=this.root;for(d=this.root.firstChild;d;d=
d.nextSibling)1==d.nodeType&&(c=d,"http://www.gribuser.ru/xml/fictionbook/2.0"==c.namespaceURI&&"body"==c.localName&&(a=c));c=ek(ek(ek(ek(new fk([this.b]),"FictionBook"),"description"),"title-info"),"lang").textContent();0<c.length&&(this.lang=c[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)d=c.localName,"meta"===d?b=c:"body"===d&&(a=c);this.body=a;this.l=b;this.g=this.root;this.j=1;this.g.setAttribute("data-adapt-eloff","0")}
function gk(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.j,d=a.g;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,!d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.j=c;a.g=b;return c-1}
function hk(a,b,c,d){var e=0;if(1==b.nodeType){if(!d)return gk(a,b)}else{e=c;c=b.previousSibling;if(!c)return b=b.parentNode,e+=1,gk(a,b)+e;b=c}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;c=b.previousSibling;if(!c){b=b.parentNode;break}b=c}e+=1;return gk(a,b)+e}function ik(a){0>a.h&&(a.h=hk(a,a.root,0,!0));return a.h}
function jk(a,b){for(var c,d=a.root,e={};;){c=gk(a,d);if(c>=b)return d;e.children=d.children;if(!e.children)break;var f=Ya(e.children.length,function(c){return function(d){return gk(a,c.children[d])>b}}(e));if(!f)break;if(f<e.children.length&&gk(a,e.children[f])<=b)throw Error("Consistency check failed!");d=e.children[f-1];e={children:e.children}}c+=1;for(var e=d,f=e.firstChild||e.nextSibling,g=null;;){if(f){if(1==f.nodeType)break;g=e=f;c+=f.textContent.length;if(c>b)break}else if(e=e.parentNode,
!e)break;f=e.nextSibling}return g||d}function kk(a,b){var c=b.getAttribute("id");c&&!a.f[c]&&(a.f[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.f[c]&&(a.f[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)kk(a,c)}function lk(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);!d&&a.b.getElementsByName&&(d=a.b.getElementsByName(c)[0]);d||(a.f||(a.f={},kk(a,a.b.documentElement)),d=a.f[c]);return d}
var mk={hh:"text/html",ih:"text/xml",Ug:"application/xml",Tg:"application/xhtml_xml",ah:"image/svg+xml"};function nk(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function ok(a){var b=a.contentType;if(b){for(var c=Object.keys(mk),d=0;d<c.length;d++)if(mk[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function pk(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=ok(a);(c=nk(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=nk(e,"image/svg+xml",d)):c=nk(e,"text/html",d));c||(c=nk(e,"text/html",d))}}c=c?new dk(b,a.url,c):null;return M(c)}function qk(a){this.Nc=a}
function rk(){var a=sk;return new qk(function(b){return a.Nc(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function tk(){var a=rk(),b=sk;return new qk(function(c){if(!b.Nc(c))return!1;c=new fk([c]);c=ek(c,"EncryptionMethod");a&&(c=uk(c,a));return 0<c.size()})}var sk=new qk(function(){return!0});function fk(a){this.X=a}fk.prototype.size=function(){return this.X.length};
function uk(a,b){for(var c=[],d=t(a.X),e=d.next();!e.done;e=d.next())e=e.value,b.Nc(e)&&c.push(e);return new fk(c)}function vk(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.X.length;e++)b(a.X[e],c);return new fk(d)}fk.prototype.forEach=function(a){for(var b=[],c=0;c<this.X.length;c++)b.push(a(this.X[c]));return b};function wk(a,b){for(var c=[],d=0;d<a.X.length;d++){var e=b(a.X[d]);null!=e&&c.push(e)}return c}
function ek(a,b){return vk(a,function(a,d){for(var c=a.firstChild;c;c=c.nextSibling)c.localName==b&&d(c)})}function xk(a){return vk(a,function(a,c){for(var b=a.firstChild;b;b=b.nextSibling)1==b.nodeType&&c(b)})}function yk(a,b){return wk(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}fk.prototype.textContent=function(){return this.forEach(function(a){return a.textContent})};var zk={transform:!0,"transform-origin":!0},Ak={top:!0,bottom:!0,left:!0,right:!0};function Bk(a,b,c){this.target=a;this.name=b;this.value=c}var Ck={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};
function Dk(a,b){var c=Ck[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function Ek(a,b){this.Pb={};this.I=a;this.h=b;this.D=null;this.l=[];var c=this;this.J=function(a){var b=a.currentTarget,d=b.getAttribute("href")||b.getAttributeNS("http://www.w3.org/1999/xlink","href");d&&fb(c,{type:"hyperlink",target:null,currentTarget:null,mh:b,href:d,preventDefault:function(){a.preventDefault()}})};this.f={};this.g={width:0,height:0};this.A=this.u=!1;this.F=this.G=!0;this.O=0;this.position=null;this.offset=-1;this.b=null;this.j=[];this.H={top:{},bottom:{},left:{},right:{}}}
v(Ek,eb);function Fk(a,b){(a.G=b)?a.I.setAttribute("data-vivliostyle-auto-page-width",!0):a.I.removeAttribute("data-vivliostyle-auto-page-width")}function Gk(a,b){(a.F=b)?a.I.setAttribute("data-vivliostyle-auto-page-height",!0):a.I.removeAttribute("data-vivliostyle-auto-page-height")}function Hk(a,b,c){var d=a.f[c];d?d.push(b):a.f[c]=[b]}
function Ik(a,b,c){Object.keys(a.f).forEach(function(a){for(var b=this.f[a],c=0;c<b.length;)this.I.contains(b[c])?c++:b.splice(c,1);b.length||delete this.f[a]},a);for(var d=a.l,e=0;e<d.length;e++){var f=d[e];x(f.target,f.name,f.value.toString())}e=Jk(c,a.I);a.g.width=e.width;a.g.height=e.height;for(e=0;e<b.length;e++)if(c=b[e],f=a.f[c.qd],d=a.f[c.Hg],f&&d&&(f=Dk(f,c.action)))for(var g=0;g<d.length;g++)d[g].addEventListener(c.event,f,!1)}
Ek.prototype.zoom=function(a){x(this.I,"transform","scale("+a+")")};function Kk(a){switch(a){case "normal":case "nowrap":return 0;case "pre-line":return 1;case "pre":case "pre-wrap":return 2;default:return null}}function Lk(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return!c.length}throw Error("Unexpected whitespace: "+b);}function Mk(a){this.f=a;this.b=[];this.C=null}
function Nk(a,b,c,d,e,f,g,h,l){this.b=a;this.element=b;this.f=c;this.cb=d;this.l=e;this.h=f;this.u=g;this.j=h;this.yb=-1;this.g=l}function Ok(a,b){return a.h?!b.h||a.cb>b.cb?!0:a.j:!1}function Pk(a,b){return a.top-b.top}function Qk(a,b){return b.right-a.right}function Rk(a,b){return a===b?!0:a&&b?a.node===b.node&&a.kb===b.kb&&Sk(a.wa,b.wa)&&Sk(a.Ia,b.Ia)&&Rk(a.Fa,b.Fa):!1}
function Tk(a,b){if(a===b)return!0;if(!a||!b||a.na!==b.na||a.K!==b.K||a.pa.length!==b.pa.length)return!1;for(var c=0;c<a.pa.length;c++)if(!Rk(a.pa[c],b.pa[c]))return!1;return!0}function Uk(a){return{pa:[{node:a.M,kb:Vk,wa:a.wa,Ia:null,Fa:null,Sa:0}],na:0,K:!1,Qa:a.Qa}}function Wk(a,b){var c=new Xk(a.node,b,0);c.kb=a.kb;c.wa=a.wa;c.Ia=a.Ia;c.Fa=a.Fa?Wk(a.Fa,Yk(b)):null;c.C=a.C;c.Sa=a.Sa+1;return c}var Vk=0;
function Zk(a,b,c,d,e,f,g){this.oa=a;this.nd=d;this.vf=null;this.root=b;this.da=c;this.type=f;e&&(e.vf=this);this.b=g}function Sk(a,b){return a===b||!!a&&!!b&&(b?a.oa===b.oa&&a.da===b.da&&a.type===b.type&&Sk(a.nd,b.nd):!1)}function $k(a,b){this.Ig=a;this.count=b}
function Xk(a,b,c){this.M=a;this.parent=b;this.Ma=c;this.na=0;this.K=!1;this.kb=Vk;this.wa=b?b.wa:null;this.Fa=this.Ia=null;this.Ba=!1;this.ya=!0;this.xa=!1;this.j=b?b.j:0;this.display=null;this.W=al;this.ca=this.N=this.l=this.Ca=null;this.Z="baseline";this.la="top";this.ta=this.sa=0;this.H=!1;this.rc=b?b.rc:0;this.F=b?b.F:null;this.A=b?b.A:!1;this.R=this.fd=!1;this.D=this.B=this.G=this.g=null;this.h=b?b.h:{};this.b=b?b.b:!1;this.direction=b?b.direction:"ltr";this.f=b?b.f:null;this.Qa=this.lang=null;
this.C=b?b.C:null;this.u=null;this.ua={};this.Sa=1;this.Y=this.J=null}function bl(a){a.ya=!0;a.j=a.parent?a.parent.j:0;a.B=null;a.D=null;a.na=0;a.K=!1;a.display=null;a.W=al;a.Ca=null;a.l=null;a.N=null;a.ca=null;a.Z="baseline";a.H=!1;a.rc=a.parent?a.parent.rc:0;a.F=a.parent?a.parent.F:null;a.A=a.parent?a.parent.A:!1;a.g=null;a.G=null;a.Ia=null;a.fd=!1;a.R=!1;a.b=a.parent?a.parent.b:!1;a.Ia=null;a.Qa=null;a.C=a.parent?a.parent.C:null;a.u=null;a.ua={};a.Sa=1;a.J=null;a.Y=null}
function cl(a){var b=new Xk(a.M,a.parent,a.Ma);b.na=a.na;b.K=a.K;b.Ia=a.Ia;b.kb=a.kb;b.wa=a.wa;b.Fa=a.Fa;b.ya=a.ya;b.j=a.j;b.display=a.display;b.W=a.W;b.Ca=a.Ca;b.l=a.l;b.N=a.N;b.ca=a.ca;b.Z=a.Z;b.la=a.la;b.sa=a.sa;b.ta=a.ta;b.fd=a.fd;b.R=a.R;b.H=a.H;b.rc=a.rc;b.F=a.F;b.A=a.A;b.g=a.g;b.G=a.G;b.B=a.B;b.D=a.D;b.f=a.f;b.b=a.b;b.xa=a.xa;b.Qa=a.Qa;b.C=a.C;b.u=a.u;b.ua=Object.create(a.ua);b.Sa=a.Sa;b.J=a.J;b.Y=a.Y;return b}Xk.prototype.modify=function(){return this.Ba?cl(this):this};
function Yk(a){var b=a;do{if(b.Ba)break;b.Ba=!0;b=b.parent}while(b);return a}Xk.prototype.clone=function(){for(var a=cl(this),b=a,c;c=b.parent;)c=cl(c),b=b.parent=c;return a};function dl(a){return{node:a.M,kb:a.kb,wa:a.wa,Ia:a.Ia,Fa:a.Fa?dl(a.Fa):null,C:a.C,Sa:a.Sa}}function el(a){var b=a,c=[];do b.f&&b.parent&&b.parent.f!==b.f||c.push(dl(b)),b=b.parent;while(b);b=a.Qa?fl(a.Qa,a.na,-1):a.na;return{pa:c,na:b,K:a.K,Qa:a.Qa}}function gl(a){for(a=a.parent;a;){if(a.fd)return!0;a=a.parent}return!1}
function hl(a,b){for(var c=a;c;)c.ya||b(c),c=c.parent}function il(a,b){return a.C===b&&!!a.parent&&a.parent.C===b}function jl(a){this.f=a;this.b=null}jl.prototype.clone=function(){var a=new jl(this.f);if(this.b){a.b=[];for(var b=0;b<this.b.length;++b)a.b[b]=this.b[b]}return a};function kl(a,b){if(!b)return!1;if(a===b)return!0;if(!Tk(a.f,b.f))return!1;if(a.b){if(!b.b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++)if(!Tk(a.b[c],b.b[c]))return!1}else if(b.b)return!1;return!0}
function ll(a,b){this.b=a;this.qa=b}ll.prototype.clone=function(){return new ll(this.b.clone(),this.qa)};function ml(){this.b=[];this.g="any";this.f=null}ml.prototype.clone=function(){for(var a=new ml,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();a.g=this.g;a.f=this.f;return a};function nl(a,b){if(a===b)return!0;if(!b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++){var d=a.b[c],e=b.b[c];if(!e||d!==e&&!kl(d.b,e.b))return!1}return!0}
function ol(){this.page=0;this.f={};this.b={};this.g=0}ol.prototype.clone=function(){var a=new ol;a.page=this.page;a.h=this.h;a.g=this.g;a.j=this.j;a.f=this.f;for(var b in this.b)a.b[b]=this.b[b].clone();return a};function pl(a,b){if(a===b)return!0;if(!b||a.page!==b.page||a.g!==b.g)return!1;var c=Object.keys(a.b),d=Object.keys(b.b);if(c.length!==d.length)return!1;c=t(c);for(d=c.next();!d.done;d=c.next())if(d=d.value,!nl(a.b[d],b.b[d]))return!1;return!0}
function ql(a){this.element=a;this.G=this.F=this.height=this.width=this.R=this.J=this.Y=this.H=this.Ba=this.ca=this.Za=this.Z=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.Lb=this.ob=null;this.Bb=this.Md=this.Mb=this.Pd=this.h=0;this.b=!1}function rl(a){return a.marginTop+a.ca+a.J}function sl(a){return a.marginBottom+a.Ba+a.R}function tl(a){return a.marginLeft+a.Z+a.H}function ul(a){return a.marginRight+a.Za+a.Y}function vl(a){return a.b?-1:1}
function wl(a,b){a.element=b.element;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.Z=b.Z;a.Za=b.Za;a.ca=b.ca;a.Ba=b.Ba;a.H=b.H;a.Y=b.Y;a.J=b.J;a.R=b.R;a.width=b.width;a.height=b.height;a.F=b.F;a.G=b.G;a.Lb=b.Lb;a.ob=b.ob;a.h=b.h;a.Pd=b.Pd;a.Mb=b.Mb;a.b=b.b}function xl(a,b,c){a.top=b;a.height=c;x(a.element,"top",b+"px");x(a.element,"height",c+"px")}
function yl(a,b,c){a.left=b;a.width=c;x(a.element,"left",b+"px");x(a.element,"width",c+"px")}function zl(a,b,c){a.b?yl(a,b+c*vl(a),c):xl(a,b,c)}function Al(a,b,c){a.b?xl(a,b,c):yl(a,b,c)}function Bl(a){a=a.element;for(var b;b=a.lastChild;)a.removeChild(b)}function Cl(a){var b=a.F+a.left+a.marginLeft+a.Z,c=a.G+a.top+a.marginTop+a.ca;return new ng(b,c,b+(a.H+a.width+a.Y),c+(a.J+a.height+a.R))}function Dl(a,b,c){a=El(a);return Qg(b,a.V,a.T,a.U-a.V,a.P-a.T,c)}
function El(a){var b=a.F+a.left,c=a.G+a.top;return new ng(b,c,b+(tl(a)+a.width+ul(a)),c+(rl(a)+a.height+sl(a)))}function Fl(a,b,c,d){this.b=a;this.f=b;this.h=c;this.g=d}v(Fl,Ec);Fl.prototype.yd=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.Vc));return null};Fl.prototype.$c=function(a){if(this.h.url)this.b.setAttribute("src",a.url);else{var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b)}return null};
Fl.prototype.Ub=function(a){this.oc(a.values);return null};Fl.prototype.Wc=function(a){var b=a.Aa();a=b.evaluate(this.f);"string"===typeof a&&((b=this.g(b,a,this.b.ownerDocument))||(b=this.b.ownerDocument.createTextNode(a)),this.b.appendChild(b));return null};function Gl(a){return!!a&&a!==Cd&&a!==J&&a!==sd};function Hl(a,b,c){this.g=a;this.f=b;this.b=c}function Il(){this.map=[]}function Jl(a){return a.map.length?a.map[a.map.length-1].b:0}function Kl(a,b){if(a.map.length){var c=a.map[a.map.length-1],d=c.b+b-c.f;c.f==c.g?(c.f=b,c.g=b,c.b=d):a.map.push(new Hl(b,b,d))}else a.map.push(new Hl(b,b,b))}function Ll(a,b){a.map.length?a.map[a.map.length-1].f=b:a.map.push(new Hl(b,0,0))}function Ml(a,b){var c=Ya(a.map.length,function(c){return b<=a.map[c].f}),c=a.map[c];return c.b-Math.max(0,c.g-b)}
function Nl(a,b){var c=Ya(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.g-(c.b-b)}function Ol(a,b,c,d,e,f,g,h){this.A=a;this.style=b;this.offset=c;this.D=d;this.qa=e;this.b=e.b;this.ib=f;this.pb=g;this.F=h;this.j=this.l=null;this.u={};this.g=this.f=this.h=null;Pl(this)&&(b=b._pseudos)&&b.before&&(a=new Ol(a,b.before,c,!1,e,Ql(this),g,!0),c=Rl(a,"content"),Gl(c)&&(this.h=a,this.g=a.g));this.g=Sl(Tl(this,"before"),this.g);this.pb&&Ul[this.g]&&(e.g=Sl(e.g,this.g))}
function Rl(a,b,c){if(!(b in a.u)){var d=a.style[b];a.u[b]=d?d.evaluate(a.A,b):c||null}return a.u[b]}function Vl(a){return Rl(a,"display",td)}function Ql(a){if(null===a.l){var b=Vl(a),c=Rl(a,"position"),d=Rl(a,"float");a.l=Wl(b,c,d,a.D).display===ad}return a.l}function Pl(a){null===a.j&&(a.j=a.F&&Vl(a)!==J);return a.j}function Tl(a,b){var c=null;if(Ql(a)){var d=Rl(a,"break-"+b);d&&(c=d.toString())}return c}function Xl(a){this.g=a;this.b=[];this.pb=this.ib=!0;this.f=[]}
function Yl(a){return a.b[a.b.length-1]}function Zl(a){return a.b.every(function(a){return Vl(a)!==J})}Xl.prototype.push=function(a,b,c,d){var e=Yl(this);d&&e&&d.b!==e.b&&this.f.push({ib:this.ib,pb:this.pb});e=d||e.qa;d=this.pb||!!d;var f=Zl(this);a=new Ol(this.g,a,b,c,e,d||this.ib,d,f);this.b.push(a);this.ib=Pl(a)?!a.h&&Ql(a):this.ib;this.pb=Pl(a)?!a.h&&d:this.pb;return a};
function $l(a,b){if(!b.ib)return b.offset;var c=a.b.length-1,d=a.b[c];d===b&&(c--,d=a.b[c]);for(;0<=c;){if(d.b!==b.b)return b.offset;if(!d.ib||d.D)return d.offset;b=d;d=a.b[--c]}throw Error("No block start offset found!");}
function am(a,b,c,d,e,f,g,h){this.da=a;this.root=a.root;this.fb=c;this.h=d;this.A=f;this.f=this.root;this.F={};this.Y={};this.G={};this.J=[];this.D=this.R=this.N=null;this.Ba=g;this.Z=new rj(b,d,g,h);this.g=new Il;this.u=!0;this.la=[];this.Za=e;this.ua=this.ta=!1;this.b=a=gk(a,this.root);this.ca={};this.j=new Xl(d);Kl(this.g,a);d=bm(this,this.root);Dj(this.Z,this.root,d,a);cm(this,d,!1);this.H=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.H=
!1}this.la.push(!0);this.Y={};this.Y["e"+a]=d;this.b++;dm(this,-1)}function em(a,b,c,d){return(b=b[d])&&b.evaluate(a.h)!==c[d]}function fm(a,b,c){for(var d in c){var e=b[d];e?(a.F[d]=e,delete b[d]):(e=c[d])&&(a.F[d]=new V(e,33554432))}}var gm=["column-count","column-width","column-fill"];
function cm(a,b,c){["writing-mode","direction"].forEach(function(d){!b[d]||c&&a.F[d]||(a.F[d]=b[d])});if(!a.ta){var d=em(a,b,a.A.j,"background-color")?b["background-color"].evaluate(a.h):null,e=em(a,b,a.A.j,"background-image")?b["background-image"].evaluate(a.h):null;if(d&&d!==sd||e&&e!==sd)fm(a,b,a.A.j),a.ta=!0}if(!a.ua)for(d=0;d<gm.length;d++)if(em(a,b,a.A.u,gm[d])){fm(a,b,a.A.u);a.ua=!0;break}if(!c&&(d=b["font-size"])){e=d.evaluate(a.h);d=e.L;switch(e.ka){case "em":case "rem":d*=a.h.u;break;case "ex":d*=
a.h.u*Nb.ex/Nb.em;break;case "%":d*=a.h.u/100;break;default:(e=Nb[e.ka])&&(d*=e)}a.h.Za=d}}function hm(a){for(var b=0;!a.H&&(b+=5E3,im(a,b,0)!=Number.POSITIVE_INFINITY););return a.F}function bm(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.da.url,e=new Rj(a.fb,a.A),c=new qf(c,e);try{eg(new Wf(Lf,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1,!1)}catch(f){w.b(f,"Style attribute parse error:")}return e.mb}}return{}}
function dm(a,b){if(!(b>=a.b)){var c=a.h,d=gk(a.da,a.root);if(b<d){var e=a.l(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body",f=jm(a,f,e,a.root,d);!a.j.b.length&&a.j.push(e,d,!0,f)}d=jk(a.da,b);e=hk(a.da,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=gk(a.da,g))throw Error("Inconsistent offset");var h=a.l(g,!1);if(f=h["flow-into"])f=f.evaluate(c,"flow-into").toString(),jm(a,f,h,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(!f)for(;!(f=
d.nextSibling);)if(d=d.parentNode,d===a.root)return;d=f}}}function km(a,b){a.N=b;for(var c=0;c<a.J.length;c++)lm(a.N,a.J[c],a.G[a.J[c].b])}
function jm(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,l=!1,k=!1,m=c["flow-options"];if(m){var p;a:{if(h=m.evaluate(a.h,"flow-options")){l=new Lg;try{h.fa(l);p=l.b;break a}catch(q){w.b(q,"toSet:")}}p={}}k=p;h=!!k.exclusive;l=!!k["static"];k=!!k.last}(p=c["flow-linger"])&&(g=Ng(p.evaluate(a.h,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=Ng(c.evaluate(a.h,"flow-priority"),0));c=a.ca[e]||null;p=a.G[b];p||(p=Yl(a.j),p=a.G[b]=new Mk(p?p.qa.b:null));d=new Nk(b,d,e,f,g,h,
l,k,c);a.J.push(d);a.R==b&&(a.R=null);a.N&&lm(a.N,d,p);return d}function mm(a,b,c,d){Ul[b]&&(d=a.G[d].b,(!d.length||d[d.length-1]<c)&&d.push(c));a.ca[c]=Sl(a.ca[c],b)}
function im(a,b,c){var d=-1;if(b<=a.b&&(d=Ml(a.g,b),d+=c,d<Jl(a.g)))return Nl(a.g,d);if(!a.f)return Number.POSITIVE_INFINITY;for(var e=a.h;;){var f=a.f.firstChild;if(!f)for(;;){if(1==a.f.nodeType){var f=a.Z,g=a.f;if(f.Kb.pop()!==g)throw Error("Invalid call to popElement");f.Mb.pop();f.sa.pop();f.Lb.pop();f.Ib.pop();Hj(f);Bj(f);a.u=a.la.pop();var f=a.j,h=a.b,l=g=f.b.pop(),k=f.ib,m=f.pb;if(Pl(l)){var p=l.style._pseudos;p&&p.after&&(h=new Ol(l.A,p.after,h,!1,l.qa,k,m,!0),k=Rl(h,"content"),Gl(k)&&(l.f=
h))}f.pb&&g.f&&(l=Tl(g.f,"before"),g.qa.g=Sl(g.qa.g,l));if(l=Yl(f))l.b===g.b?Pl(g)&&(f.ib=f.pb=!1):(l=f.f.pop(),f.ib=l.ib,f.pb=l.pb);f=null;g.f&&(f=Tl(g.f,"before"),mm(a,f,g.f.ib?$l(a.j,g):g.f.offset,g.b),f=Tl(g.f,"after"));f=Sl(f,Tl(g,"after"));mm(a,f,a.b,g.b)}if(f=a.f.nextSibling)break;a.f=a.f.parentNode;if(a.f===a.root)return a.f=null,b<a.b&&(0>d&&(d=Ml(a.g,b),d+=c),d<=Jl(a.g))?Nl(a.g,d):Number.POSITIVE_INFINITY}a.f=f;if(1!=a.f.nodeType)a.b+=a.f.textContent.length,f=a.j,g=a.f,l=Yl(f),(f.ib||f.pb)&&
Pl(l)&&(l=Rl(l,"white-space",Cd).toString(),Lk(g,Kk(l))||(f.ib=!1,f.pb=!1)),a.u?Kl(a.g,a.b):Ll(a.g,a.b);else{g=a.f;f=bm(a,g);a.la.push(a.u);Dj(a.Z,g,f,a.b);(l=g.getAttribute("id")||g.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&l===a.D&&(a.D=null);a.H||"body"!=g.localName||g.parentNode!=a.root||(cm(a,f,!0),a.H=!0);(l=f["flow-into"])?(l=l.evaluate(e,"flow-into").toString(),h=jm(a,l,f,g,a.b),a.u=!!a.Za[l],g=a.j.push(f,a.b,g===a.root,h)):g=a.j.push(f,a.b,g===a.root);l=$l(a.j,g);mm(a,
g.g,l,g.b);g.h&&(h=Tl(g.h,"after"),mm(a,h,g.h.ib?l:g.offset,g.b));a.u&&Vl(g)===J&&(a.u=!1);if(gk(a.da,a.f)!=a.b)throw Error("Inconsistent offset");a.Y["e"+a.b]=f;a.b++;a.u?Kl(a.g,a.b):Ll(a.g,a.b);if(b<a.b&&(0>d&&(d=Ml(a.g,b),d+=c),d<=Jl(a.g)))return Nl(a.g,d)}}}am.prototype.l=function(a,b){var c=gk(this.da,a),d="e"+c;b&&(c=hk(this.da,a,0,!0));this.b<=c&&im(this,c,0);return this.Y[d]};am.prototype.sa=function(){};var nm={"font-style":Cd,"font-variant":Cd,"font-weight":Cd},om="OTTO"+(new Date).valueOf(),pm=1;function qm(a,b){var c={},d;for(d in a)c[d]=a[d].evaluate(b,d);for(var e in nm)c[e]||(c[e]=nm[e]);return c}function rm(a){a=this.Bc=a;var b=new Qa,c;for(c in nm)b.append(" "),b.append(a[c].toString());this.f=b.toString();this.src=this.Bc.src?this.Bc.src.toString():null;this.g=[];this.h=[];this.b=(c=this.Bc["font-family"])?c.stringValue():null}
function sm(a,b,c){var d=new Qa;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in nm)d.append(e),d.append(": "),a.Bc[e].$a(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.g.push(b),a.h.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function tm(a){this.f=a;this.b={}}
function um(a,b){if(b instanceof Hc){for(var c=[],d=t(b.values),e=d.next();!e.done;e=d.next()){var e=e.value,f=a.b[e.stringValue()];f&&c.push(D(f));c.push(e)}return new Hc(c)}return(c=a.b[b.stringValue()])?new Hc([D(c),b]):b}function vm(a,b){this.b=a;this.body=b;this.f={};this.g=0}function wm(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.g;return c.b[b]=d}
function xm(a,b,c,d){var e=L("initFont"),f=b.src,g={},h;for(h in nm)g[h]=b.Bc[h];d=wm(a,b,d);g["font-family"]=D(d);var l=new rm(g),k=a.body.ownerDocument.createElement("span");k.textContent="M";var m=(new Date).valueOf()+1E3;b=a.b.ownerDocument.createElement("style");h=om+pm++;b.textContent=sm(l,"",vf([h]));a.b.appendChild(b);a.body.appendChild(k);k.style.visibility="hidden";k.style.fontFamily=d;for(var p in nm)x(k,p,g[p].toString());var g=k.getBoundingClientRect(),q=g.right-g.left,r=g.bottom-g.top;
b.textContent=sm(l,f,c);w.g("Starting to load font:",f);var z=!1;De(function(){var a=k.getBoundingClientRect(),b=a.bottom-a.top;return q!=a.right-a.left||r!=b?(z=!0,M(!1)):(new Date).valueOf()>m?M(!1):Ce(10)}).then(function(){z?w.g("Loaded font:",f):w.b("Failed to load font:",f);a.body.removeChild(k);O(e,l)});return e.result()}
function ym(a,b,c){var d=b.src,e=a.f[d];e?He(e,function(a){if(a.f==b.f){var e=b.b,f=c.b[e];a=a.b;if(f){if(f!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;w.b("Found already-loaded font:",d)}else w.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new Ge(function(){var e=L("loadFont"),g=c.f?c.f(d):null;g?uf(d,"blob").then(function(d){d.Xd?g(d.Xd).then(function(d){xm(a,b,d,c).La(e)}):O(e,null)}):xm(a,b,null,c).La(e);return e.result()},"loadFont "+d),a.f[d]=e,e.start());return e}
function zm(a,b,c){var d=[];b=t(b);for(var e=b.next();!e.done;e=b.next())e=e.value,e.src&&e.b?d.push(ym(a,e,c)):w.b("E_FONT_FACE_INVALID");return Ie(d)};fe("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===Xc?Fd:c,important:a.important};default:return a}});var Ul={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},Am={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};
function Sl(a,b){if(a)if(b){var c=!!Ul[a],d=!!Ul[b];if(c&&d)switch(b){case "column":return a;case "region":return"column"===a?b:a;default:return b}else return d?b:c?a:Am[b]?b:Am[a]?a:b}else return a;else return b}function Bm(a){switch(a){case "left":case "right":case "recto":case "verso":return a;default:return"any"}};function Cm(){}n=Cm.prototype;n.Tf=function(a){return{w:a,Dd:!1,Vb:!1}};n.uf=function(){};n.Df=function(){};n.kg=function(){};n.Cf=function(){};n.zd=function(){};n.qc=function(){};function Dm(a,b){this.b=a;this.f=b}
function Em(a,b){var c=a.b,d=c.Tf(b),e=L("LayoutIterator");Ee(function(b){for(var e;d.w;){e=d.w.B?1!==d.w.B.nodeType?Lk(d.w.B,d.w.rc)?void 0:d.w.K?c.Df(d):c.uf(d):d.w.ya?d.w.K?c.Cf(d):c.kg(d):d.w.K?c.qc(d):c.zd(d):void 0;e=(e&&e.Xa()?e:M(!0)).ea(function(){return d.Vb?M(null):Fm(a.f,d.w,d.Dd)});if(e.Xa()){e.then(function(a){d.Vb?Q(b):(d.w=a,P(b))});return}if(d.Vb){Q(b);return}d.w=e.get()}Q(b)}).then(function(){O(e,d.w)});return e.result()}function Gm(a){this.ec=a}v(Gm,Cm);n=Gm.prototype;n.lg=function(){};
n.Nf=function(){};n.Tf=function(a){return{w:a,Dd:!!this.ec&&a.K,Vb:!1,ec:this.ec,bd:null,Ie:!1,Wf:[],jd:null}};n.uf=function(a){a.Ie=!1};n.zd=function(a){a.Wf.push(Yk(a.w));a.bd=Sl(a.bd,a.w.g);a.Ie=!0;return this.lg(a)};n.qc=function(a){var b;a.Ie?(b=(b=void 0,M(!0)),b=b.ea(function(){a.Vb||(a.Wf=[],a.ec=!1,a.Dd=!1,a.bd=null);return M(!0)})):b=(b=this.Nf(a))&&b.Xa()?b:M(!0);return b.ea(function(){a.Vb||(a.Ie=!1,a.jd=Yk(a.w),a.bd=Sl(a.bd,a.w.G));return M(!0)})};
function Hm(a,b,c){this.tf=[];this.za=Object.create(a);this.za.element=b;this.za.j=a.j.clone();this.za.u=!1;this.za.kf=c.C;this.za.Kd=a;a=Im(this.za,c);this.za.la-=a;var d=this;this.za.Fd=function(a){return Jm.prototype.Fd.call(this,a).ea(function(a){d.tf.push(Yk(a));return M(a)})}}function Km(a,b){return Lm(a.za,b,!0)}Hm.prototype.cc=function(a){var b=this.za.cc();if(a){a=Yk(this.tf[0]);var c=new Mm(a,null,a.xa,0);c.f(this.za,0);if(!b.w)return{Db:c,w:a}}return b};
Hm.prototype.Na=function(a,b,c){return this.za.Na(a,b,c)};function Nm(){this.u=this.h=null}function Om(a,b,c){a.eg(b,c);return Pm(a,b,c)}function Pm(a,b,c){var d=L("vivliostyle.layoututil.AbstractLayoutRetryer.tryLayout");a.yf(b,c);var e=a.qf(b);e.b(b,c).then(function(a){var f=e.f(a,c);(f=e.g(a,this.f,c,f))?O(d,a):(this.Hd(this.f),this.he(b,c),Pm(this,this.f,c).La(d))}.bind(a));return d.result()}Nm.prototype.eg=function(){};
Nm.prototype.Hd=function(a){a=a.B||a.parent.B;for(var b;b=a.lastChild;)a.removeChild(b);for(;b=a.nextSibling;)b.parentNode.removeChild(b)};Nm.prototype.yf=function(a,b){this.f=Yk(a);this.h=[].concat(b.N);this.D=[].concat(b.A);a.C&&(this.u=a.C.Ye())};Nm.prototype.he=function(a,b){b.N=this.h;b.A=this.D;a.C&&a.C.Xe(this.u)};function Qm(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);c=t(b);for(b=c.next();!b.done;b=c.next())if(b=b.value,b=a.replace(b.h,b.b),b!==a)return b;return a}function Rm(a){var b=Sm,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{h:new RegExp("(-?)"+(a?b.ga:b.ha)+"(-?)"),b:"$1"+(a?b.ha:b.ga)+"$2"}})})});return c}
var Sm={"horizontal-tb":{ltr:[{ga:"inline-start",ha:"left"},{ga:"inline-end",ha:"right"},{ga:"block-start",ha:"top"},{ga:"block-end",ha:"bottom"},{ga:"inline-size",ha:"width"},{ga:"block-size",ha:"height"}],rtl:[{ga:"inline-start",ha:"right"},{ga:"inline-end",ha:"left"},{ga:"block-start",ha:"top"},{ga:"block-end",ha:"bottom"},{ga:"inline-size",ha:"width"},{ga:"block-size",ha:"height"}]},"vertical-rl":{ltr:[{ga:"inline-start",ha:"top"},{ga:"inline-end",ha:"bottom"},{ga:"block-start",ha:"right"},{ga:"block-end",
ha:"left"},{ga:"inline-size",ha:"height"},{ga:"block-size",ha:"width"}],rtl:[{ga:"inline-start",ha:"bottom"},{ga:"inline-end",ha:"top"},{ga:"block-start",ha:"right"},{ga:"block-end",ha:"left"},{ga:"inline-size",ha:"height"},{ga:"block-size",ha:"width"}]},"vertical-lr":{ltr:[{ga:"inline-start",ha:"top"},{ga:"inline-end",ha:"bottom"},{ga:"block-start",ha:"left"},{ga:"block-end",ha:"right"},{ga:"inline-size",ha:"height"},{ga:"block-size",ha:"width"}],rtl:[{ga:"inline-start",ha:"bottom"},{ga:"inline-end",
ha:"top"},{ga:"block-start",ha:"left"},{ga:"block-end",ha:"right"},{ga:"inline-size",ha:"height"},{ga:"block-size",ha:"width"}]}},Tm=Rm(!0),Um=Rm(!1);var al="inline";function Vm(a){switch(a){case "inline":return al;case "column":return"column";case "region":return"region";case "page":return"page";default:throw Error("Unknown float-reference: "+a);}}function Wm(a){switch(a){case al:return!1;case "column":case "region":case "page":return!0;default:throw Error("Unknown float-reference: "+a);}}function Xm(a,b,c,d,e,f){this.b=a;this.W=b;this.Ca=c;this.h=d;this.f=e;this.j=f;this.id=this.order=null}
Xm.prototype.Ha=function(){if(null===this.order)throw Error("The page float is not yet added");return this.order};function Ym(a){if(!a.id)throw Error("The page float is not yet added");return a.id}Xm.prototype.df=function(){return!1};function Zm(){this.b=[];this.f=0}Zm.prototype.nf=function(){return this.f++};
Zm.prototype.ke=function(a){if(0<=this.b.findIndex(function(b){return Tk(b.b,a.b)}))throw Error("A page float with the same source node is already registered");var b=a.order=this.nf();a.id="pf"+b;this.b.push(a)};Zm.prototype.cf=function(a){var b=this.b.findIndex(function(b){return Tk(b.b,a)});return 0<=b?this.b[b]:null};function $m(a,b,c,d,e){this.W=a;this.Ca=b;this.Ob=c;this.b=d;this.g=e}function an(a,b){return a.Ob.some(function(a){return a.ja===b})}
$m.prototype.Ha=function(){var a=this.Ob.map(function(a){return a.ja});return Math.min.apply(null,a.map(function(a){return a.Ha()}))};$m.prototype.f=function(a){return this.Ha()<a.Ha()};function bn(a,b){this.ja=a;this.b=b}
function cn(a,b,c,d,e,f,g){(this.parent=a)&&a.children.push(this);this.children=[];this.W=b;this.I=c;this.h=d;this.H=e;this.F=f||a&&a.F||rd;this.direction=g||a&&a.direction||Bd;this.Oc=!1;this.u=a?a.u:new Zm;this.A=[];this.b=[];this.j=[];this.l={};this.f=[];a:{b=this;for(a=this.parent;a;){if(b=dn(a,b,this.W,this.h,this.H)){a=b;break a}b=a;a=a.parent}a=null}this.G=a?[].concat(a.f):[];this.D=[];this.g=!1}function en(a,b){if(!a.parent)throw Error("No PageFloatLayoutContext for "+b);return a.parent}
function dn(a,b,c,d,e){b=a.children.indexOf(b);0>b&&(b=a.children.length);for(--b;0<=b;b--){var f=a.children[b];if(f.W===c&&f.h===d&&Tk(f.H,e)||(f=dn(f,null,c,d,e)))return f}return null}function fn(a,b){return b&&b!==a.W?fn(en(a,b),b):a.I}function gn(a,b){a.I=b;hn(a)}cn.prototype.ke=function(a){this.u.ke(a)};function jn(a,b){return b===a.W?a:jn(en(a,b),b)}cn.prototype.cf=function(a){return this.u.cf(a)};
function kn(a,b){var c=Ym(b),d=b.W;d===a.W?a.A.includes(c)||(a.A.push(c),ln(b).og(b,a)):kn(en(a,d),b)}function mn(a,b){var c=Ym(b),d=b.W;return d===a.W?a.A.includes(c):mn(en(a,d),b)}function nn(a,b,c){var d=b.W;d!==a.W?nn(en(a,d),b,c):a.b.includes(b)||(a.b.push(b),a.b.sort(function(a,b){return a.Ha()-b.Ha()}));c||on(a)}function pn(a,b,c){var d=b.W;d!==a.W?pn(en(a,d),b,c):(b=a.b.indexOf(b),0<=b&&(b=a.b.splice(b,1)[0],(b=b.b&&b.b.element)&&b.parentNode&&b.parentNode.removeChild(b),c||on(a)))}
function qn(a,b){if(b.W!==a.W)return qn(en(a,b.W),b);var c=a.b.findIndex(function(a){return an(a,b)});return 0<=c?a.b[c]:null}function rn(a,b){return 0<a.b.length&&(!b||a.b.some(b))?!0:a.parent?rn(a.parent,b):!1}function sn(a,b){return rn(a,function(a){return a.g&&a.Ob[0].ja.f===b})}function tn(a,b,c){a.l[Ym(b)]=c}function un(a){var b=Object.assign({},a.l);return a.children.reduce(function(a,b){return Object.assign(a,un(b))},b)}
function vn(a,b){if(wn(a).some(function(a){return Ym(a.ja)===b}))return!0;var c=un(a)[b];return c?a.I&&a.I.element?a.I.element.contains(c):!1:!1}function xn(a,b){var c=b.ja;if(c.W===a.W){var d=a.f.findIndex(function(a){return a.ja===c});0<=d?a.f.splice(d,1,b):a.f.push(b)}else xn(en(a,c.W),b)}function yn(a,b,c){if(!c&&b.W!==a.W)return yn(en(a,b.W),b,!1);var d=b.Ha();return a.f.some(function(a){return a.ja.Ha()<d&&!b.df(a.ja)})?!0:a.parent?yn(a.parent,b,!0):!1}
function wn(a,b){b=b||a.h;var c=a.G.filter(function(a){return!b||a.ja.f===b});a.parent&&(c=wn(a.parent,b).concat(c));return c.sort(function(a,b){return a.ja.Ha()-b.ja.Ha()})}function zn(a,b){b=b||a.h;var c=a.f.filter(function(a){return!b||a.ja.f===b});return a.parent?zn(a.parent,b).concat(c):c}function An(a){for(var b=[],c=[],d=a.children.length-1;0<=d;d--){var e=a.children[d];c.includes(e.h)||(c.push(e.h),b=b.concat(e.f.map(function(a){return a.ja})),b=b.concat(An(e)))}return b}
function Bn(a){if(Cn(a))return!0;for(var b=a.b.length-1;0<=b;b--){var c=a.b[b],d;a:{d=a;for(var e=c.Ob.length-1;0<=e;e--){var f=c.Ob[e].ja;if(!vn(d,Ym(f))){d=f;break a}}d=null}if(d){if(a.g)on(a);else if(pn(a,c),kn(a,d),c=Dn(a,c.Ca),"block-end"===c||"inline-end"===c)for(b=0;b<a.b.length;)d=a.b[b],Dn(a,d.Ca)===c?pn(a,d):b++;return!0}}return"region"===a.W&&a.parent.g?Bn(a.parent):!1}
function Cn(a){var b=An(a),c=a.b.reduce(function(a,b){return a.concat(b.Ob.map(function(a){return a.ja}))},[]);c.sort(function(a,b){return b.Ha()-a.Ha()});for(var d={},c=t(c),e=c.next();!e.done;d={ja:d.ja,order:d.order},e=c.next())if(d.ja=e.value,d.order=d.ja.Ha(),b.some(function(a){return function(b){return!a.ja.df(b)&&a.order>b.Ha()}}(d)))return a.g?on(a):(kn(a,d.ja),b=qn(a,d.ja),pn(a,b)),!0;return!1}
function En(a){if(!Bn(a)){for(var b=a.f.length-1;0<=b;b--)if(!vn(a,Ym(a.f[b].ja))){if(a.g){on(a);return}a.f.splice(b,1)}a.G.forEach(function(a){0<=this.f.findIndex(function(b){return b?a===b?!0:a.ja===b.ja&&Tk(a.b,b.b):!1})||this.b.some(function(b){return an(b,a.ja)})||this.f.push(a)},a)}}function Fn(a,b){return!!a.I&&!!b.I&&a.I.element===b.I.element}
function on(a){a.Oc=!0;a.g||(a.I&&(a.children.forEach(function(a){Fn(this,a)&&a.b.forEach(function(a){(a=a.b.element)&&a.parentNode&&a.parentNode.removeChild(a)})},a),Bl(a.I)),a.children.forEach(function(a){a.D.splice(0)}),a.children.splice(0),Object.keys(a.l).forEach(function(a){delete this.l[a]},a))}function Gn(a){a=a.children.splice(0);a.forEach(function(a){a.b.forEach(function(a){(a=a.b.element)&&a.parentNode&&a.parentNode.removeChild(a)})});return a}
function Hn(a,b){b.forEach(function(a){this.children.push(a);hn(a)},a)}function In(a){return a.Oc||!!a.parent&&In(a.parent)}function Dn(a,b){return Qm(b,a.F.toString(),a.direction.toString()||null,Um)}function Jn(a,b){var c=b.W;if(c!==a.W)Jn(en(a,c),b);else if(c=Dn(a,b.Ca),"block-end"===c||"snap-block"===c||"inline-end"===c)for(var d=0;d<a.b.length;){var e=a.b[d],f=Dn(a,e.Ca);(f===c||"snap-block"===c&&"block-end"===f)&&e.f(b)?(a.j.push(e),a.b.splice(d,1)):d++}}
function Kn(a,b){b!==a.W?Kn(en(a,b),b):(a.j.forEach(function(a){nn(this,a,!0)},a),a.j.splice(0))}function Ln(a,b){b!==a.W?Ln(en(a,b),b):a.j.splice(0)}function Mn(a,b){return b===a.W?a.j.concat().sort(function(a,b){return b.Ha()-a.Ha()}):Mn(en(a,b),b)}
function Nn(a,b,c,d,e){var f=Dn(a,b);b=Qm(b,a.F.toString(),a.direction.toString()||null,Tm);a:{var g=On(a,c,d,e);switch(f){case "block-start":f=a.I.b?g.right:g.top;break a;case "block-end":f=a.I.b?g.left:g.bottom;break a;case "inline-start":f=a.I.b?g.top:g.left;break a;case "inline-end":f=a.I.b?g.bottom:g.right;break a;default:throw Error("Unknown logical side: "+f);}}if(a.parent&&a.parent.I)switch(a=Nn(a.parent,b,c,d,e),b){case "top":return Math.max(f,a);case "left":return Math.max(f,a);case "bottom":return Math.min(f,
a);case "right":return Math.min(f,a);default:ra("Should be unreachable")}return f}
function On(a,b,c,d){function e(a,d,e){if("%"===a.ka)a=e*a.L/100;else{e=a.L;var f=a.ka,g;b:switch(f.toLowerCase()){case "em":case "ex":case "rem":g=!0;break b;default:g=!1}if(g){for(;d&&1!==d.nodeType;)d=d.parentNode;d=parseFloat(Pn(c,d)["font-size"]);a=gi(a,d,b.b).L}else a=(d=Rb(b.b,f,!1))?e*d:a}return a}var f=a.I.F,g=a.I.G,h=Cl(a.I),l={top:h.T-g,left:h.V-f,bottom:h.P-g,right:h.U-f,Mc:0,Lc:0},k=a.b;0<k.length&&(l=k.reduce(function(b,c){if(d&&!d(c,a))return b;var f=Dn(a,c.Ca),g=c.b,k=c.Ob[0].ja.j,
l=b.top,m=b.left,p=b.bottom,E=b.right,K=b.Mc,I=b.Lc;switch(f){case "inline-start":g.b?l=Math.max(l,g.top+g.height):m=Math.max(m,g.left+g.width);break;case "block-start":g.b?(k&&g.left<E&&(K=e(k,g.Ib[0],h.U-h.V)),E=Math.min(E,g.left)):(k&&g.top+g.height>l&&(K=e(k,g.Ib[0],h.P-h.T)),l=Math.max(l,g.top+g.height));break;case "inline-end":g.b?p=Math.min(p,g.top):E=Math.min(E,g.left);break;case "block-end":g.b?(k&&g.left+g.width>m&&(I=e(k,g.Ib[0],h.U-h.V)),m=Math.max(m,g.left+g.width)):(k&&g.top<p&&(I=e(k,
g.Ib[0],h.P-h.T)),p=Math.min(p,g.top));break;default:throw Error("Unknown logical float side: "+f);}return{top:l,left:m,bottom:p,right:E,Mc:K,Lc:I}},l));l.left+=f;l.right+=f;l.top+=g;l.bottom+=g;return l}
function Qn(a,b,c,d,e,f,g,h){function l(a,c){var d=a(b.Jb,c);return d?(b.b&&(d=new ng(-d.P,d.V,-d.T,d.U)),m=b.b?Math.min(m,d.U):Math.max(m,d.T),p=b.b?Math.max(p,d.V):Math.min(p,d.P),!0):g}if(c!==a.W)return Qn(en(a,c),b,c,d,e,f,g,h);var k=Dn(a,d);if("snap-block"===k){if(!h["block-start"]&&!h["block-end"])return null}else if(!h[k])return null;var m=Nn(a,"block-start",b.j,b.f),p=Nn(a,"block-end",b.j,b.f);c=Nn(a,"inline-start",b.j,b.f);var q=Nn(a,"inline-end",b.j,b.f),r=b.b?b.F:b.G,z=b.b?b.G:b.F,m=b.b?
Math.min(m,b.left+tl(b)+b.width+ul(b)+r):Math.max(m,b.top+r),p=b.b?Math.max(p,b.left+r):Math.min(p,b.top+rl(b)+b.height+sl(b)+r),u;if(f){a=b.b?Eg(new ng(p,c,m,q)):new ng(c,m,q,p);if(("block-start"===k||"snap-block"===k||"inline-start"===k)&&!l(Jg,a)||("block-end"===k||"snap-block"===k||"inline-end"===k)&&!l(Kg,a))return null;u=(p-m)*vl(b);f=u-(b.b?ul(b):rl(b))-(b.b?tl(b):sl(b));e=q-c;a=e-(b.b?rl(b):tl(b))-(b.b?sl(b):ul(b));if(!g&&(0>=f||0>=a))return null}else{f=b.h;u=f+(b.b?ul(b):rl(b))+(b.b?tl(b):
sl(b));var A=(p-m)*vl(b);if("snap-block"===k&&(null===e?k="block-start":(k=Cl(a.I),k=vl(a.I)*(e-(a.I.b?k.U:k.T))<=vl(a.I)*((a.I.b?k.V:k.P)-e-u)?"block-start":"block-end"),!h[k]))if(h["block-end"])k="block-end";else return null;if(!g&&A<u)return null;a="inline-start"===k||"inline-end"===k?Rn(b.f,b.element,[Sn])[Sn]:b.ue?Tn(b):b.b?b.height:b.width;e=a+(b.b?rl(b):tl(b))+(b.b?sl(b):ul(b));if(!g&&q-c<e)return null}m-=r;p-=r;c-=z;q-=z;switch(k){case "inline-start":case "block-start":case "snap-block":Al(b,
c,a);zl(b,m,f);break;case "inline-end":case "block-end":Al(b,q-e,a);zl(b,p-u*vl(b),f);break;default:throw Error("unknown float direction: "+d);}return k}function Un(a){var b=a.b.map(function(a){return Dl(a.b,null,null)});return a.parent?Un(a.parent).concat(b):b}function hn(a){var b=a.I.element&&a.I.element.parentNode;b&&a.b.forEach(function(a){b.appendChild(a.b.element)})}
function Vn(a){var b=fn(a).b;return a.b.reduce(function(a,d){var c=El(d.b);return b?Math.min(a,c.V):Math.max(a,c.P)},b?Infinity:0)}function Wn(a){var b=fn(a).b;return a.b.filter(function(a){return"block-end"===a.Ca}).reduce(function(a,d){var c=El(d.b);return b?Math.max(a,c.U):Math.min(a,c.T)},b?0:Infinity)}
function Xn(a,b){function c(a){return function(b){return vn(a,Ym(b.ja))}}function d(a,b){return a.Ob.some(c(b))}for(var e=Cl(b),e=b.b?e.V:e.P,f=a;f;){if(f.f.some(c(f)))return e;f=f.parent}f=Nn(a,"block-start",b.j,b.f,d);return Nn(a,"block-end",b.j,b.f,d)*vl(b)<e*vl(b)?e:f}
function Yn(a,b,c,d){function e(a){return function(b){return b.Ca===a&&b.Ha()<l}}function f(a,b){return a.children.some(function(a){return a.b.some(e(b))||f(a,b)})}function g(a,b){var c=a.parent;return!!c&&(c.b.some(e(b))||g(c,b))}if(b.W!==a.W)return Yn(en(a,b.W),b,c,d);var h={"block-start":!0,"block-end":!0,"inline-start":!0,"inline-end":!0};if(!d)return h;c=Dn(a,c);d=Dn(a,d);d="all"===d?["block-start","block-end","inline-start","inline-end"]:"both"===d?["inline-start","inline-end"]:"same"===d?"snap-block"===
c?["block-start","block-end"]:[c]:[d];var l=b.Ha();d.forEach(function(a){switch(a){case "block-start":case "inline-start":h[a]=!f(this,a);break;case "block-end":case "inline-end":h[a]=!g(this,a);break;default:throw Error("Unexpected side: "+a);}},a);return h}function Zn(a){return(a.parent?Zn(a.parent):[]).concat(a.D)}function $n(a,b,c){c===a.W?a.D.push(b):$n(en(a,c),b,c)}
function ao(a,b){for(var c=b.j,d=b.f,e=a,f=null;e&&e.I;){var g=On(e,c,d);f?b.b?(g.right<f.right&&(f.right=g.right,f.Mc=g.Mc),g.left>f.left&&(f.left=g.left,f.Lc=g.Lc)):(g.top>f.top&&(f.top=g.top,f.Mc=g.Mc),g.bottom<f.bottom&&(f.bottom=g.bottom,f.Lc=g.Lc)):f=g;e=e.parent}return(b.b?f.right-f.left:f.bottom-f.top)<=Math.max(f.Mc,f.Lc)}function bo(a){var b=fn(a).b;return a.b.length?Math.max.apply(null,a.b.map(function(a){a=a.b;return b?a.width:a.height})):0}var co=[];
function eo(a){for(var b=co.length-1;0<=b;b--){var c=co[b];if(c.Ff(a))return c}throw Error("No PageFloatLayoutStrategy found for "+a);}function ln(a){for(var b=co.length-1;0<=b;b--){var c=co[b];if(c.Ef(a))return c}throw Error("No PageFloatLayoutStrategy found for "+a);}function fo(){}n=fo.prototype;n.Ff=function(a){return Wm(a.W)};n.Ef=function(){return!0};n.Lf=function(a,b,c){var d=a.W,e=a.Ca,f=el(a);return go(c,d,a.ca,a).ea(function(c){d=c;c=new Xm(f,d,e,a.l,b.h,a.N);b.ke(c);return M(c)})};
n.Mf=function(a,b,c,d){return new $m(a[0].ja.W,b,a,c,d)};n.xf=function(a,b){return qn(b,a)};n.Bf=function(){};n.og=function(){};co.push(new fo);var ho={img:!0,svg:!0,audio:!0,video:!0};
function io(a,b,c,d){var e=a.B;if(!e)return NaN;if(1==e.nodeType){if(a.K||!a.ya){var f=Jk(b,e);if(f.right>=f.left&&f.bottom>=f.top)return a.K?d?f.left:f.bottom:d?f.right:f.top}return NaN}var f=NaN,g=e.ownerDocument.createRange(),h=e.textContent.length;if(!h)return NaN;a.K&&(c+=h);c>=h&&(c=h-1);g.setStart(e,c);g.setEnd(e,c+1);a=jo(b,g);if(c=d){c=document.body;if(null==gb){var l=c.ownerDocument,g=l.createElement("div");g.style.position="absolute";g.style.top="0px";g.style.left="0px";g.style.width="100px";
g.style.height="100px";g.style.overflow="hidden";g.style.lineHeight="16px";g.style.fontSize="16px";x(g,"writing-mode","vertical-rl");c.appendChild(g);h=l.createTextNode("a a a a a a a a a a a a a a a a");g.appendChild(h);l=l.createRange();l.setStart(h,0);l.setEnd(h,1);h=l.getBoundingClientRect();gb=10>h.right-h.left;c.removeChild(g)}c=gb}if(c){c=e.ownerDocument.createRange();c.setStart(e,0);c.setEnd(e,e.textContent.length);b=jo(b,c);e=[];a=t(a);for(c=a.next();!c.done;c=a.next()){c=c.value;for(g=0;g<
b.length;g++)if(h=b[g],c.top>=h.top&&c.bottom<=h.bottom&&1>Math.abs(c.left-h.left)){e.push({top:c.top,left:h.left,bottom:c.bottom,right:h.right});break}g==b.length&&(w.b("Could not fix character box"),e.push(c))}a=e}b=0;e=t(a);for(a=e.next();!a.done;a=e.next())a=a.value,c=d?a.bottom-a.top:a.right-a.left,a.right>a.left&&a.bottom>a.top&&(isNaN(f)||c>b)&&(f=d?a.left:a.bottom,b=c);return f}
function ko(a){for(var b=ge("RESOLVE_LAYOUT_PROCESSOR"),c=0;c<b.length;c++){var d=b[c](a);if(d)return d}throw Error("No processor found for a formatting context: "+a.We());}function lo(a){this.Id=a}lo.prototype.b=function(a){return this.Id.every(function(b){return b.b(a)})};function mo(){}mo.prototype.u=function(){};mo.prototype.g=function(){return null};function no(a,b){return{current:b.reduce(function(b,d){return b+d.b(a)},0),Ge:b.reduce(function(b,d){return b+d.F(a)},0)}}
function oo(a,b){this.h=a;this.Rc=b;this.j=!1;this.l=null}v(oo,mo);oo.prototype.f=function(a,b){if(b<this.b())return null;this.j||(this.l=po(a,this,0<b),this.j=!0);return this.l};oo.prototype.b=function(){return this.Rc};oo.prototype.g=function(){return this.j?this.l:this.h[this.h.length-1]};function Mm(a,b,c,d){this.position=a;this.F=b;this.A=this.j=c;this.D=d;this.h=!1;this.uc=0}v(Mm,mo);
Mm.prototype.f=function(a,b){if(!this.h){var c=Im(a,this.position);this.uc=io(this.position,a.f,0,a.b)+c;this.h=!0}var c=this.uc,d=no(this.g(),qo(a));this.A=ro(a,c+(a.b?-1:1)*d.Ge);this.j=this.position.xa=ro(a,c+(a.b?-1:1)*d.current);b<this.b()?c=null:(a.h=this.D+so(a,this),c=this.position);return c};
Mm.prototype.b=function(){if(!this.h)throw Error("EdgeBreakPosition.prototype.updateEdge not called");var a;if((a=this.g())&&a.parent){var b=to(a.parent);a=b?(b=b.b)?a&&b.g===a.M:!1:!1}else a=!1;a=a&&!this.A;return(Am[this.F]?1:0)+(this.j&&!a?3:0)+(this.position.parent?this.position.parent.j:0)};Mm.prototype.g=function(){return this.position};
function uo(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?w.b("validateCheckPoints: duplicate entry"):c.Ma>=d.Ma?w.b("validateCheckPoints: incorrect boxOffset"):c.M==d.M&&(d.K?c.K&&w.b("validateCheckPoints: duplicate after points"):c.K||d.Ma-c.Ma!=d.na-c.na&&w.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}function vo(a){this.parent=a}vo.prototype.We=function(){return"Block formatting context (adapt.layout.BlockFormattingContext)"};vo.prototype.ff=function(a,b){return b};
vo.prototype.Ye=function(){};vo.prototype.Xe=function(){};function Jm(a,b,c,d,e){ql.call(this,a);this.j=b;this.f=c;this.Hc=d;this.Ng=a.ownerDocument;this.l=e;gn(e,this);this.kf=null;this.$f=this.gg=!1;this.la=this.sa=this.D=this.fb=this.ua=0;this.Jb=this.dg=this.cg=null;this.Jd=!1;this.g=this.N=null;this.Kb=!0;this.xe=this.Ee=this.De=0;this.u=!0;this.wb=null;this.A=[];this.ta=this.Kd=null;this.jf=NaN}v(Jm,ql);function wo(a,b){return!!b.Ca&&(!a.gg||!!b.parent)}
function ro(a,b){return a.b?b<a.la:b>a.la}function xo(a,b){if(a)for(var c;(c=a.lastChild)!=b;)a.removeChild(c)}Jm.prototype.Fd=function(a){var b=this,c=L("openAllViews"),d=a.pa;yo(b.j,b.element,b.$f);var e=d.length-1,f=null;De(function(){for(;0<=e;){f=Wk(d[e],f);e!==d.length-1||f.C||(f.C=b.kf);if(!e){var c=f,h;h=a;h=h.Qa?fl(h.Qa,h.na,1):h.na;c.na=h;f.K=a.K;f.Qa=a.Qa;if(f.K)break}c=zo(b.j,f,!e&&!f.na);e--;if(c.Xa())return c}return M(!1)}).then(function(){O(c,f)});return c.result()};var Ao=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;
function Bo(a,b){if(b.f&&b.ya&&!b.K&&!b.f.count&&1!=b.B.nodeType){var c=b.B.textContent.match(Ao);return Co(a.j,b,c[0].length)}return M(b)}
function Do(a,b,c){var d=!1,e=L("buildViewToNextBlockEdge");Ee(function(e){b.B&&!Eo(b)&&c.push(Yk(b));Bo(a,b).then(function(f){f!==b&&(b=f,Eo(b)||c.push(Yk(b)));Fo(a,b).then(function(c){if(b=c){if(d||!a.Hc.b(b))d=!0,b=b.modify(),b.xa=!0;wo(a,b)&&!a.b?Go(a,b).then(function(c){b=c;In(a.l)&&(b=null);b?P(e):Q(e)}):b.ya?P(e):Q(e)}else Q(e)})})}).then(function(){O(e,b)});return e.result()}function Fo(a,b,c){b=Fm(a.j,b,c);return Ho(b,a)}
function Io(a,b){if(!b.B)return M(b);var c=[],d=b.M,e=L("buildDeepElementView");Ee(function(e){b.B&&b.ya&&!Eo(b)?c.push(Yk(b)):(0<c.length&&Jo(a,b,c),c=[]);Bo(a,b).then(function(f){if(f!==b){for(var g=f;g&&g.M!=d;)g=g.parent;if(!g){b=f;Q(e);return}Eo(f)||c.push(Yk(f))}Fo(a,f).then(function(c){(b=c)&&b.M!=d?a.Hc.b(b)?P(e):(b=b.modify(),b.xa=!0,a.u?Q(e):P(e)):Q(e)})})}).then(function(){0<c.length&&Jo(a,b,c);O(e,b)});return e.result()}
function Ko(a,b,c,d,e){var f=a.Ng.createElement("div");a.b?(e>=a.height&&(e-=.1),x(f,"height",d+"px"),x(f,"width",e+"px")):(d>=a.width&&(d-=.1),x(f,"width",d+"px"),x(f,"height",e+"px"));x(f,"float",c);x(f,"clear",c);a.element.insertBefore(f,b);return f}function Lo(a){for(var b=a.element.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.element.removeChild(b);else break}b=c}}
function Mo(a){for(var b=a.element.firstChild,c=a.b?a.b?a.ua:a.D:a.b?a.sa:a.ua,d=a.b?a.b?a.fb:a.sa:a.b?a.D:a.fb,e=t(a.Jb),f=e.next();!f.done;f=e.next()){var f=f.value,g=f.P-f.T;f.left=Ko(a,b,"left",f.V-c,g);f.right=Ko(a,b,"right",d-f.U,g)}}
function No(a,b,c,d,e){var f;if(b&&Oo(b.B))return NaN;if(b&&b.K&&!b.ya&&(f=io(b,a.f,0,a.b),!isNaN(f)))return f;b=c[d];for(e-=b.Ma;;){f=io(b,a.f,e,a.b);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.D;b=c[d];1!=b.B.nodeType&&(e=b.B.textContent.length)}}}function X(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}
function Po(a,b){var c=Pn(a.f,b),d=new pg;c&&(d.left=X(c.marginLeft),d.top=X(c.marginTop),d.right=X(c.marginRight),d.bottom=X(c.marginBottom));return d}function Qo(a,b){var c=Pn(a.f,b),d=new pg;c&&(d.left=X(c.borderLeftWidth)+X(c.paddingLeft),d.top=X(c.borderTopWidth)+X(c.paddingTop),d.right=X(c.borderRightWidth)+X(c.paddingRight),d.bottom=X(c.borderBottomWidth)+X(c.paddingBottom));return d}
function Ro(a,b){var c=L("layoutFloat"),d=b.B,e=b.Ca;x(d,"float","none");x(d,"display","inline-block");x(d,"vertical-align","top");Io(a,b).then(function(f){for(var g=Jk(a.f,d),h=Po(a,d),g=new ng(g.left-h.left,g.top-h.top,g.right+h.right,g.bottom+h.bottom),h=a.ua,l=a.fb,k=b.parent;k&&k.ya;)k=k.parent;if(k){var m=k.B.ownerDocument.createElement("div");m.style.left="0px";m.style.top="0px";a.b?(m.style.bottom="0px",m.style.width="1px"):(m.style.right="0px",m.style.height="1px");k.B.appendChild(m);var p=
Jk(a.f,m),h=Math.max(a.b?p.top:p.left,h),l=Math.min(a.b?p.bottom:p.right,l);k.B.removeChild(m);m=a.b?g.P-g.T:g.U-g.V;"left"==e?l=Math.max(l,h+m):h=Math.min(h,l-m);k.B.appendChild(b.B)}m=new ng(h,vl(a)*a.D,l,vl(a)*a.sa);h=g;a.b&&(h=Eg(g));l=vl(a);h.T<a.xe*l&&(p=h.P-h.T,h.T=a.xe*l,h.P=h.T+p);a:for(var l=a.Jb,p=h,q=p.T,r=p.U-p.V,z=p.P-p.T,u=Ig(l,q);;){var A=q+z;if(A>m.P)break a;for(var H=m.V,E=m.U,K=u;K<l.length&&l[K].T<A;K++){var I=l[K];I.V>H&&(H=I.V);I.U<E&&(E=I.U)}if(H+r<=E||u>=l.length){"left"==
e?(p.V=H,p.U=H+r):(p.V=E-r,p.U=E);p.P+=q-p.T;p.T=q;break a}q=l[u].P;u++}a.b&&(g=new ng(-h.P,h.V,-h.T,h.U));a:{m=Pn(a.f,d);l=new pg;if(m){if("border-box"==m.boxSizing){m=Po(a,d);break a}l.left=X(m.marginLeft)+X(m.borderLeftWidth)+X(m.paddingLeft);l.top=X(m.marginTop)+X(m.borderTopWidth)+X(m.paddingTop);l.right=X(m.marginRight)+X(m.borderRightWidth)+X(m.paddingRight);l.bottom=X(m.marginBottom)+X(m.borderBottomWidth)+X(m.paddingBottom)}m=l}x(d,"width",g.U-g.V-m.left-m.right+"px");x(d,"height",g.P-g.T-
m.top-m.bottom+"px");x(d,"position","absolute");x(d,"display",b.display);l=null;if(k)if(k.R)l=k;else a:{for(k=k.parent;k;){if(k.R){l=k;break a}k=k.parent}l=null}l?(m=l.B.ownerDocument.createElement("div"),m.style.position="absolute",l.b?m.style.right="0":m.style.left="0",m.style.top="0",l.B.appendChild(m),k=Jk(a.f,m),l.B.removeChild(m)):k={left:(a.b?a.sa:a.ua)-a.H,right:(a.b?a.D:a.fb)+a.Y,top:(a.b?a.ua:a.D)-a.J};(l?l.b:a.b)?x(d,"right",k.right-g.U+"px"):x(d,"left",g.V-k.left+"px");x(d,"top",g.T-k.top+
"px");b.D&&(b.D.parentNode.removeChild(b.D),b.D=null);k=a.b?g.V:g.P;g=a.b?g.U:g.T;if(ro(a,k)&&a.N.length)b=b.modify(),b.xa=!0,O(c,b);else{Lo(a);m=new ng(a.b?a.sa:a.ua,a.b?a.ua:a.D,a.b?a.D:a.fb,a.b?a.fb:a.sa);a.b&&(m=Eg(m));l=a.Jb;for(p=[new rg(h.T,h.P,h.V,h.U)];0<p.length&&p[0].P<=m.T;)p.shift();if(p.length){p[0].T<m.T&&(p[0].T=m.T);h=l.length?l[l.length-1].P:m.T;h<m.P&&l.push(new rg(h,m.P,m.V,m.U));h=Ig(l,p[0].T);p=t(p);for(q=p.next();!q.done;q=p.next()){r=q.value;if(h==l.length)break;l[h].T<r.T&&
(q=l[h],h++,l.splice(h,0,new rg(r.T,q.P,q.V,q.U)),q.P=r.T);for(;h<l.length&&(q=l[h++],q.P>r.P&&(l.splice(h,0,new rg(r.P,q.P,q.V,q.U)),q.P=r.P),r.V!=r.U&&("left"==e?q.V=Math.min(r.U,m.U):q.U=Math.max(r.V,m.V)),q.P!=r.P););}Hg(m,l)}Mo(a);"left"==e?a.De=k:a.Ee=k;a.xe=g;So(a,k);O(c,f)}});return c.result()}
function To(a,b,c,d,e,f){var g=a.element.ownerDocument.createElement("div");x(g,"position","absolute");var h=jn(a.l,b.W),l=new cn(null,"column",null,a.l.h,b.b,null,null),h=fn(h),g=new Uo(c,g,a.j.clone(),a.f,a.Hc,l,h);gn(l,g);var h=b.W,k=a.l;b=fn(k,h);l=g.element;b.element.parentNode.appendChild(l);g.gg=!0;g.F=b.F;g.G=b.G;g.b=b.b;g.marginLeft=g.marginRight=g.marginTop=g.marginBottom=0;g.Z=g.Za=g.ca=g.Ba=0;g.H=g.Y=g.J=g.R=0;g.ob=(b.ob||[]).concat();g.Kb=!rn(k);g.Lb=null;var m=Cl(b);yl(g,m.V-b.F,m.U-
m.V);xl(g,m.T-b.G,m.P-m.T);e.Bf(g,b,a);Vo(g);(a=!!Qn(k,g,h,c,d,!0,!rn(k),f))?(Lo(g),Vo(g)):b.element.parentNode.removeChild(l);return a?g:null}
function Wo(a,b,c,d,e,f,g,h){var l=a.l;b=(h?h.Ob:[]).concat(b);var k=b[0].ja,m=Yn(l,k,c,d),p=To(a,k,c,g,f,m),q={Pf:p,pf:null,mf:null};if(!p)return M(q);var r=L("layoutSinglePageFloatFragment"),z=!1,u=0;Ee(function(a){u>=b.length?Q(a):Lm(p,new jl(b[u].b),!0).then(function(b){q.mf=b;!b||e?(u++,P(a)):(z=!0,Q(a))})}).then(function(){if(!z){var a=Qn(l,p,k.W,c,g,!1,e,m);a?(a=f.Mf(b,a,p,!!q.mf),nn(l,a,!0),q.pf=a):z=!0}O(r,q)});return r.result()}
function Xo(a,b,c,d,e){function f(a,c){c?pn(g,c,!0):a&&a.element.parentNode.removeChild(a.element);Kn(g,h.W);xn(g,b)}var g=a.l,h=b.ja;Jn(g,h);var l=L("layoutPageFloatInner");Wo(a,[b],h.Ca,h.h,!rn(g),c,d,e).then(function(b){var c=b.Pf,d=b.pf,k=b.mf;d?Yo(a,h.W,[e]).then(function(a){a?(nn(g,d),Ln(g,h.W),k&&xn(g,new bn(h,k.f)),O(l,!0)):(f(c,d),O(l,!1))}):(f(c,d),O(l,!1))});return l.result()}
function Yo(a,b,c){var d=a.l,e=Mn(d,b),f=[],g=[],h=!1,l=L("layoutStashedPageFloats"),k=0;Ee(function(b){if(k>=e.length)Q(b);else{var d=e[k];if(c.includes(d))k++,P(b);else{var l=ln(d.Ob[0].ja);Wo(a,d.Ob,d.Ca,null,!1,l,null).then(function(a){var c=a.Pf;c&&f.push(c);(a=a.pf)?(g.push(a),k++,P(b)):(h=!0,Q(b))})}}}).then(function(){h?(g.forEach(function(a){pn(d,a,!0)}),f.forEach(function(a){(a=a.element)&&a.parentNode&&a.parentNode.removeChild(a)})):e.forEach(function(a){(a=a.b.element)&&a.parentNode&&
a.parentNode.removeChild(a)});O(l,!h)});return l.result()}function Zo(a,b){var c=b.B.parentNode,d=c.ownerDocument.createElement("span");d.setAttribute("data-adapt-spec","1");"footnote"===b.Ca&&$o(a.j,b,"footnote-call",d);c.appendChild(d);c.removeChild(b.B);c=b.modify();c.K=!0;c.B=d;return c}
function go(a,b,c,d){var e=L("resolveFloatReferenceFromColumnSpan"),f=a.l,g=jn(f,"region");fn(f).width<fn(g).width&&"column"===b?c===Yc?Io(a,Yk(d)).then(function(c){var d=c.B;c=Rn(a.f,d,[ap])[ap];d=Po(a,d);c=a.b?c+(d.top+d.bottom):c+(d.left+d.right);c>a.width?O(e,"region"):O(e,b)}):c===Wc?O(e,"region"):O(e,b):O(e,b);return e.result()}
function bp(a,b){var c=a.l,d=eo(b),e=c.cf(el(b));return(e?M(e):d.Lf(b,c,a)).ea(function(e){var f=Uk(b),h=Zo(a,b),l=d.xf(e,c),f=new bn(e,f);if(l&&an(l,e))return tn(c,e,h.B),M(h);if(mn(c,e)||yn(c,e))return xn(c,f),tn(c,e,h.B),M(h);if(a.ta)return M(null);var k=io(h,a.f,0,a.b);return ro(a,k)?M(h):Xo(a,f,d,k,l).ea(function(a){if(a)return M(null);tn(c,e,h.B);return M(h)})})}
function cp(a,b,c){if(!b.K||b.ya){if(c){for(var d="",e=b.parent;e&&!d;e=e.parent)!e.ya&&e.B&&(d=e.B.style.textAlign);if("justify"!==d)return}var f=b.B,g=f.ownerDocument,h=c&&(b.K||1!=f.nodeType);(d=h?f.nextSibling:f)&&!d.parentNode&&(d=null);if(e=f.parentNode||b.parent&&b.parent.B){var l=d,k=document.body;if(null===ib){var m=k.ownerDocument,p=m.createElement("div");p.style.position="absolute";p.style.top="0px";p.style.left="0px";p.style.width="40px";p.style.height="100px";p.style.lineHeight="16px";
p.style.fontSize="16px";p.style.textAlign="justify";k.appendChild(p);var q=m.createTextNode("a a-");p.appendChild(q);var r=m.createElement("span");r.style.display="inline-block";r.style.width="40px";p.appendChild(r);m=m.createRange();m.setStart(q,2);m.setEnd(q,4);ib=37>m.getBoundingClientRect().right;k.removeChild(p)}ib&&(h=(h=h?f:f.previousSibling)?h.textContent:"",h.charAt(h.length-1)===dp(b)&&(h=f.ownerDocument,f=f.parentNode,k=document.body,null===jb&&(m=k.ownerDocument,p=m.createElement("div"),
p.style.position="absolute",p.style.top="0px",p.style.left="0px",p.style.width="40px",p.style.height="100px",p.style.lineHeight="16px",p.style.fontSize="16px",p.style.textAlign="justify",k.appendChild(p),q=m.createTextNode("a a-"),p.appendChild(q),p.appendChild(m.createElement("wbr")),r=m.createElement("span"),r.style.display="inline-block",r.style.width="40px",p.appendChild(r),m=m.createRange(),m.setStart(q,2),m.setEnd(q,4),jb=37>m.getBoundingClientRect().right,k.removeChild(p)),jb?f.insertBefore(h.createTextNode(" "),
l):f.insertBefore(h.createElement("wbr"),l)));h=b.b;f=g.createElement("span");f.style.visibility="hidden";f.style.verticalAlign="top";f.setAttribute("data-adapt-spec","1");k=g.createElement("span");k.style.fontSize="0";k.style.lineHeight="0";k.textContent=" #";f.appendChild(k);f.style.display="block";f.style.textIndent="0";f.style.textAlign="left";e.insertBefore(f,l);l=Jk(a.f,k);f.style.textAlign="right";k=Jk(a.f,k);f.style.textAlign="";p=document.body;if(null===hb){r=p.ownerDocument;q=r.createElement("div");
q.style.position="absolute";q.style.top="0px";q.style.left="0px";q.style.width="30px";q.style.height="100px";q.style.lineHeight="16px";q.style.fontSize="16px";q.style.textAlign="justify";p.appendChild(q);m=r.createTextNode("a | ");q.appendChild(m);var z=r.createElement("span");z.style.display="inline-block";z.style.width="30px";q.appendChild(z);r=r.createRange();r.setStart(m,0);r.setEnd(m,3);hb=27>r.getBoundingClientRect().right;p.removeChild(q)}hb?f.style.display="inline":f.style.display="inline-block";
l=h?k.top-l.top:k.left-l.left;l=1<=l?l-1+"px":"100%";h?f.style.paddingTop=l:f.style.paddingLeft=l;c||(c=g.createElement("div"),e.insertBefore(c,d),d=Jk(a.f,f),a=Jk(a.f,c),b.b?(c.style.marginRight=a.right-d.right+"px",c.style.width="0px"):(c.style.marginTop=d.top-a.top+"px",c.style.height="0px"),c.setAttribute("data-adapt-spec","1"))}}}
function ep(a,b,c,d){var e=L("processLineStyling");uo(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.f;0==h.count&&(h=h.Ig);Ee(function(d){if(h){var e=fp(a,f),l=h.count-g;if(e.length<=l)Q(d);else{var p=gp(a,f,e[l-1]);p?a.Na(p,!1,!1).then(function(){g+=l;Co(a.j,p,0).then(function(e){b=e;cp(a,b,!1);h=b.f;f=[];Do(a,b,f).then(function(a){c=a;P(d)})})}):Q(d)}}else Q(d)}).then(function(){Array.prototype.push.apply(d,f);uo(d);O(e,c)});return e.result()}
function hp(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.K||!f.B||1!=f.B.nodeType)break;f=Po(a,f.B);f=a.b?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function ip(a,b){var c=L("layoutBreakableBlock"),d=[];Do(a,b,d).then(function(e){var f=d.length-1;if(0>f)O(c,e);else{var f=No(a,e,d,f,d[f].Ma),g=!1;if(!e||!Oo(e.B)){var h=no(e,qo(a)),g=ro(a,f+(a.b?-1:1)*h.Ge);ro(a,f+(a.b?-1:1)*h.current)&&!a.ta&&(a.ta=e)}e||(f+=hp(a,d));So(a,f);var l;b.f?l=ep(a,b,e,d):l=M(e);l.then(function(b){Jo(a,b,d);0<d.length&&(a.N.push(new oo(d,d[0].j)),g&&(2!=d.length&&0<a.N.length||d[0].M!=d[1].M||!ho[d[0].M.localName])&&b&&(b=b.modify(),b.xa=!0));O(c,b)})}});return c.result()}
function Jo(a,b,c){ge("POST_LAYOUT_BLOCK").forEach(function(d){d(b,c,a)})}
function gp(a,b,c){uo(b);var d=a.b?c-1:c+1,e=0,f=b[0].Ma;c=e;for(var g=b.length-1,h=b[g].Ma,l;f<h;){l=f+Math.ceil((h-f)/2);c=e;for(var k=g;c<k;){var m=c+Math.ceil((k-c)/2);b[m].Ma>l?k=m-1:c=m}k=No(a,null,b,c,l);if(a.b?k<=d:k>=d){for(h=l-1;b[c].Ma==l;)c--;g=c}else So(a,k),f=l,e=c}d=f;b=b[c];c=b.B;1!=c.nodeType&&(jp(b),b.K?b.na=c.length:(e=d-b.Ma,d=c.data,173==d.charCodeAt(e)?(c.replaceData(e,d.length-e,b.A?"":dp(b)),c=e+1):(f=d.charAt(e),e++,g=d.charAt(e),c.replaceData(e,d.length-e,!b.A&&Va(f)&&Va(g)?
dp(b):""),c=e),e=c,0<e&&(c=e,b=b.modify(),b.na+=c,b.g=null)));kp(a,b,!1);return b}function jp(a){ge("RESOLVE_TEXT_NODE_BREAKER").reduce(function(b,c){return c(a)||b},lp)}var lp=new function(){};function dp(a){return a.F||a.parent&&a.parent.F||"-"}function Eo(a){return a?(a=a.B)&&1===a.nodeType?!!a.getAttribute("data-adapt-spec"):!1:!1}
function fp(a,b){for(var c=[],d=b[0].B,e=b[b.length-1].B,f=[],g=d.ownerDocument.createRange(),h=!1,l=null,k=!1,m=!0;m;){var p=!0;do{var q=null;d==e&&(m=1===e.nodeType?!(!e.firstChild||h):!1);if(1!=d.nodeType)k||(g.setStartBefore(d),k=!0),l=d;else if(h)h=!1;else if(d.getAttribute("data-adapt-spec"))p=!k;else{var r;if(!(r="ruby"==d.localName))a:{switch(Pn(a.f,d).display){case "ruby":case "inline-block":case "inline-flex":case "inline-grid":case "inline-list-item":case "inline-table":r=!0;break a}r=
!1}if(r){if(p=!k)g.setStartBefore(d),k=!0,l=d;d.contains(e)&&(m=!1)}else q=d.firstChild}q||(q=d.nextSibling,q||(h=!0,q=d.parentNode));d=q}while(p&&m);if(k){g.setEndAfter(l);k=jo(a.f,g);for(p=0;p<k.length;p++)f.push(k[p]);k=!1}}f.sort(a.b?Qk:Pk);l=d=h=g=e=0;for(m=vl(a);;){if(l<f.length&&(k=f[l],p=1,0<d&&(p=Math.max(a.b?k.right-k.left:k.bottom-k.top,1),p=m*(a.b?k.right:k.top)<m*e?m*((a.b?k.left:k.bottom)-e)/p:m*(a.b?k.left:k.bottom)>m*g?m*(g-(a.b?k.right:k.top))/p:1),!d||.6<=p||.2<=p&&(a.b?k.top:k.left)>=
h-1)){h=a.b?k.bottom:k.right;a.b?(e=d?Math.max(e,k.right):k.right,g=d?Math.min(g,k.left):k.left):(e=d?Math.min(e,k.top):k.top,g=d?Math.max(g,k.bottom):k.bottom);d++;l++;continue}0<d&&(c.push(g),d=0);if(l>=f.length)break}c.sort(Za);a.b&&c.reverse();return c}function Im(a,b){var c=0;hl(b,function(b){if("clone"===b.h["box-decoration-break"]){var d=Qo(a,b.B);c+=b.b?-d.left:d.bottom;"table"===b.display&&(c+=b.ta)}});return c}function so(a,b){return(b?no(b.g(),qo(a)):no(null,qo(a))).current}
function po(a,b,c){for(var d=b.h,e=d[0];e.parent&&e.ya;)e=e.parent;var f;c?f=c=1:(c=Math.max((e.h.widows||2)-0,1),f=Math.max((e.h.orphans||2)-0,1));var e=Im(a,e),g=fp(a,d),h=a.la-e,e=vl(a),l=so(a,b),h=h-e*l,k=mp(a,d);isNaN(k.uc)&&(k.uc=Infinity*e);var d=Ya(g.length,function(b){b=g[b];return a.b?b<h||b<=k.uc:b>h||b>=k.uc}),m=0>=d;m&&(d=Ya(g.length,function(b){return a.b?g[b]<h:g[b]>h}));d=Math.min(g.length-c,d);if(d<f)return null;h=g[d-1];if(b=m?k.If:gp(a,b.h,h))c=np(a,b),!isNaN(c)&&c<h&&(h=c),a.h=
e*(h-a.D)+l;return b}function np(a,b){var c=b;do c=c.parent;while(c&&c.ya);return c?(c=Yk(c).modify(),c.K=!0,io(c,a.f,0,a.b)):NaN}function mp(a,b){var c=b.findIndex(function(a){return a.xa});if(0>c)return{uc:NaN,If:null};var d=b[c];return{uc:No(a,null,b,c,d.Ma),If:d}}Jm.prototype.Na=function(a,b,c){var d=ko(a.C).Na(this,a,b,c);d||(d=op.Na(this,a,b,c));return d};
Jm.prototype.cc=function(){var a=null,b=null,c,d=0;do{c=d;for(var d=Number.MAX_VALUE,e=this.N.length-1;0<=e&&!b;--e){var a=this.N[e],b=a.f(this,c),f=a.b();f>c&&(d=Math.min(d,f))}}while(d>c&&!b&&this.Kb);return{Db:b?a:null,w:b}};
function pp(a,b,c,d,e){if(In(a.l)||a.g||!c)return M(b);var f=L("doFinishBreak"),g=!1;if(!b){if(a.Kb)return w.b("Could not find any page breaks?!!"),qp(a,c).then(function(b){b?(b=b.modify(),b.xa=!1,a.Na(b,g,!0).then(function(){O(f,b)})):O(f,b)}),f.result();b=d;g=!0;a.h=e}a.Na(b,g,!0).then(function(){O(f,b)});return f.result()}function rp(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}
function sp(a,b,c){if(!b||Oo(b.B))return!1;var d=io(b,a.f,0,a.b),e=no(b,qo(a)),f=ro(a,d+(a.b?-1:1)*e.Ge);ro(a,d+(a.b?-1:1)*e.current)&&!a.ta?a.ta=b:c&&(b=d+hp(a,c),e=a.la-vl(a)*e.current,d=a.b?Math.min(d,Math.max(b,e)):Math.max(d,Math.min(b,e)));So(a,d);return f}function tp(a,b,c,d,e){if(!b||Oo(b.B))return!1;c=sp(a,b,c);!d&&c||up(a,b,e,c);return c}
function vp(a,b){if(!b.B.parentNode)return!1;var c=Po(a,b.B),d=b.B.ownerDocument.createElement("div");a.b?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.B.parentNode.insertBefore(d,b.B);var e=Jk(a.f,d),e=a.b?e.right:e.top,f=vl(a),g=b.l,h=Infinity*-vl(a);"all"===g&&(h=Xn(a.l,a));switch(g){case "left":h=f*Math.max(h*f,a.De*f);break;case "right":h=f*Math.max(h*f,a.Ee*f);break;default:h=f*Math.max(h*
f,Math.max(a.Ee*f,a.De*f))}if(e*f>=h*f)return b.B.parentNode.removeChild(d),!1;e=Math.max(1,(h-e)*f);a.b?d.style.width=e+"px":d.style.height=e+"px";e=Jk(a.f,d);e=a.b?e.left:e.bottom;a.b?(h=e+c.right-h,0<h==0<=c.right&&(h+=c.right),d.style.marginLeft=h+"px"):(h-=e+c.top,0<h==0<=c.top&&(h+=c.top),d.style.marginBottom=h+"px");b.D=d;return!0}function wp(a){return a instanceof vo?!0:a instanceof xp?!1:a instanceof yp?!0:!1}
function zp(a,b,c,d){function e(){return!!d||!c&&!!Ul[m]}function f(){b=q[0]||b;b.B.parentNode.removeChild(b.B);h.g=m}var g=b.K?b.parent&&b.parent.C:b.C;if(g&&!wp(g))return M(b);var h=a,l=L("skipEdges"),k=!d&&c&&b&&b.K,m=d,p=null,q=[],r=[],z=!1;Ee(function(a){for(;b;){var d=ko(b.C);do if(b.B){if(b.ya&&1!=b.B.nodeType){if(Lk(b.B,b.rc))break;if(!b.K){e()?f():tp(h,p,null,!0,m)?(b=(h.u?p||b:b).modify(),b.xa=!0):(b=b.modify(),b.g=m);Q(a);return}}if(!b.K){if(d&&d.Ze(b))break;b.l&&vp(h,b)&&c&&!h.N.length&&
up(h,Yk(b),m,!1);if(!wp(b.C)||b.C instanceof yp||wo(h,b)||b.H){q.push(Yk(b));m=Sl(m,b.g);if(e())f();else if(tp(h,p,null,!0,m)||!h.Hc.b(b))b=(h.u?p||b:b).modify(),b.xa=!0;Q(a);return}}if(1==b.B.nodeType){var g=b.B.style;if(b.K){if(!(b.ya||d&&d.Af(b,h.u))){if(z){if(e()){f();Q(a);return}q=[];k=c=!1;m=null}z=!1;p=Yk(b);r.push(p);m=Sl(m,b.G);!g||rp(g.paddingBottom)&&rp(g.borderBottomWidth)||(r=[p])}}else{q.push(Yk(b));m=Sl(m,b.g);if(!h.Hc.b(b)&&(tp(h,p,null,!h.u,m),b=b.modify(),b.xa=!0,h.u)){Q(a);return}if(ho[b.B.localName]){e()?
f():tp(h,p,null,!0,m)&&(b=(h.u?p||b:b).modify(),b.xa=!0);Q(a);return}!g||rp(g.paddingTop)&&rp(g.borderTopWidth)||(k=!1,r=[]);z=!0}}}while(0);d=Fo(h,b,k);if(d.Xa()){d.then(function(c){b=c;P(a)});return}b=d.get()}tp(h,p,r,!h.u,m)?p&&h.u&&(b=p.modify(),b.xa=!0):Ul[m]&&(h.g=m);Q(a)}).then(function(){p&&(h.wb=el(p));O(l,b)});return l.result()}
function qp(a,b){var c=Yk(b),d=L("skipEdges"),e=null,f=!1;Ee(function(d){for(;b;){do if(b.B){if(b.ya&&1!=b.B.nodeType){if(Lk(b.B,b.rc))break;if(!b.K){Ul[e]&&(a.g=e);Q(d);return}}if(!b.K&&(wo(a,b)||b.H)){e=Sl(e,b.g);Ul[e]&&(a.g=e);Q(d);return}if(1==b.B.nodeType){var g=b.B.style;if(b.K){if(f){if(Ul[e]){a.g=e;Q(d);return}e=null}f=!1;e=Sl(e,b.G)}else{e=Sl(e,b.g);if(ho[b.B.localName]){Ul[e]&&(a.g=e);Q(d);return}if(g&&(!rp(g.paddingTop)||!rp(g.borderTopWidth))){Q(d);return}}f=!0}}while(0);g=Fm(a.j,b);if(g.Xa()){g.then(function(a){b=
a;P(d)});return}b=g.get()}c=null;Q(d)}).then(function(){O(d,c)});return d.result()}function Go(a,b){return Wm(b.W)||"footnote"===b.Ca?bp(a,b):Ro(a,b)}function Ap(a,b,c,d){var e=L("layoutNext");zp(a,b,c,d||null).then(function(d){b=d;!b||a.g||a.u&&b&&b.xa?O(e,b):ko(b.C).ie(b,a,c).La(e)});return e.result()}function kp(a,b,c){if(b)for(var d=b.parent;b;b=d,d=d?d.parent:null)ko((d||b).C).Cd(a,d,b,c),c=!1}
function Vo(a){a.dg=[];x(a.element,"width",a.width+"px");x(a.element,"height",a.height+"px");var b=a.element.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.J+"px";b.style.right=a.Y+"px";b.style.bottom=a.R+"px";b.style.left=a.H+"px";a.element.appendChild(b);var c=Jk(a.f,b);a.element.removeChild(b);var b=a.F+a.left+tl(a),d=a.G+a.top+rl(a);a.cg=new ng(b,d,b+a.width,d+a.height);a.ua=c?a.b?c.top:c.left:0;a.fb=c?a.b?c.bottom:c.right:0;a.D=c?a.b?c.right:c.top:0;a.sa=c?a.b?c.left:
c.bottom:0;a.De=a.D;a.Ee=a.D;a.xe=a.D;a.la=a.sa;c=a.cg;b=a.F+a.left+tl(a);d=a.G+a.top+rl(a);d=new ng(b,d,b+a.width,d+a.height);if(a.Lb){for(var b=d.V,d=d.T,e=[],f=t(a.Lb.b),g=f.next();!g.done;g=f.next())g=g.value,e.push(new og(g.f+b,g.b+d));b=new tg(e)}else b=wg(d.V,d.T,d.U,d.P);b=[b];d=Un(a.l);a.Jb=Gg(c,b,a.ob.concat(d),a.Mb,a.b);Mo(a);a.h=0;a.Jd=!1;a.g=null;a.wb=null}function up(a,b,c,d){var e=Yk(b);b=ko(b.C);var f=Im(a,e);c=b.Kf(e,c,d,a.h+f);a.N.push(c)}
function So(a,b){isNaN(b)||(a.h=Math.max(vl(a)*(b-a.D),a.h))}
function Lm(a,b,c,d){a.dg.push(b);b.f.K&&(a.wb=b.f);if(a.u&&a.Jd)return M(b);if(ao(a.l,a))return b.f.K&&1===b.f.pa.length?M(null):M(b);var e=L("layout");a.Fd(b.f).then(function(b){var f=null;if(b.B)f=Yk(b);else{var h=function(b){b.w.B&&(f=b.w,a.j.removeEventListener("nextInTree",h))};a.j.addEventListener("nextInTree",h)}var l=new Bp(c,d);Om(l,b,a).then(function(b){pp(a,b,l.g.Ud,f,l.b).then(function(b){var c=null;a.Kd?c=M(null):c=Cp(a,b);c.then(function(){if(In(a.l))O(e,null);else if(b){a.Jd=!0;var c=
new jl(el(b));O(e,c)}else O(e,null)})})})});return e.result()}function Cp(a,b){var c=L("doFinishBreakOfFragmentLayoutConstraints"),d=[].concat(a.A);d.sort(function(a,b){return a.te()-b.te()});var e=0;De(function(){return e<d.length?d[e++].Na(b,a).Fc(!0):M(!1)}).then(function(){O(c,!0)});return c.result()}
function Fp(a,b,c,d){var e=L("doLayout"),f=null;a.N=[];a.ta=null;Ee(function(e){for(var g={};b;){g.Oa=!0;Ap(a,b,c,d||null).then(function(g){return function(h){c=!1;d=null;a.ta&&a.u?(a.g=null,b=a.ta,b.xa=!0):b=h;In(a.l)?Q(e):a.g?Q(e):b&&a.u&&b&&b.xa?(f=b,h=a.cc(),b=h.w,h.Db&&h.Db.u(a),Q(e)):g.Oa?g.Oa=!1:P(e)}}(g));if(g.Oa){g.Oa=!1;return}g={Oa:g.Oa}}a.h+=so(a);Q(e)}).then(function(){O(e,{w:b,Ud:f})});return e.result()}function Gp(a){var b=Wn(a.l);0<b&&isFinite(b)&&(a.jf=vl(a)*(b-a.D-a.h))}
function Oo(a){for(;a;){if(a.parentNode===a.ownerDocument)return!1;a=a.parentNode}return!0}function Bp(a,b){Nm.call(this);this.ec=a;this.A=b||null;this.l=null;this.b=0;this.j=!1;this.g={Ud:null}}v(Bp,Nm);n=Bp.prototype;n.qf=function(){return new Hp(this.ec,this.A,this.g)};n.eg=function(a,b){b.A=[];b.Kd||(Ip=[])};n.Hd=function(a){for(Nm.prototype.Hd.call(this,a);a;){var b=a.B;b&&xo(b.parentNode,b);a=a.parent}};n.yf=function(a,b){Nm.prototype.yf.call(this,a,b);this.l=b.g;this.b=b.h;this.j=b.Jd};
n.he=function(a,b){Nm.prototype.he.call(this,a,b);b.g=this.l;b.h=this.b;b.Jd=this.j};function Hp(a,b,c){this.ec=a;this.j=b;this.h=c}Hp.prototype.b=function(a,b){var c=this,d=L("adapt.layout.DefaultLayoutMode.doLayout");Jp(a,b).then(function(){Fp(b,a,c.ec,c.j).then(function(a){c.h.Ud=a.Ud;O(d,a.w)})});return d.result()};Hp.prototype.f=function(a,b){var c=this;return In(b.l)||b.g||0>=b.A.length?!0:b.A.every(function(d){return d.je(a,c.h.Ud,b)})};
Hp.prototype.g=function(a,b,c,d){d||(d=!c.A.some(function(b){return b.ld(a)}));c.A.forEach(function(e){e.ad(d,a,b,c)});return d};function Kp(){}n=Kp.prototype;n.ie=function(a,b){var c;if(wo(b,a))c=Go(b,a);else{a:if(a.K)c=!0;else{switch(a.M.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!a.H}c=c?ip(b,a):Io(b,a)}return c};n.Kf=function(a,b,c,d){return new Mm(Yk(a),b,c,d)};n.Ze=function(){return!1};n.Af=function(){return!1};
n.Cd=function(a,b,c,d){c.B&&c.B.parentNode&&(a=c.B.parentNode,xo(a,c.B),d&&a.removeChild(c.B))};n.Na=function(a,b,c,d){c=c||!!b.B&&1==b.B.nodeType&&!b.K;kp(a,b,c);d&&(cp(a,b,!0),Lp(c?b:b.parent));return M(!0)};var op=new Kp;fe("RESOLVE_FORMATTING_CONTEXT",function(a,b,c,d,e,f){b=a.parent;return!b&&a.C?null:b&&a.C!==b.C?null:a.fd||!a.C&&Wl(c,d,e,f).display===ad?new vo(b?b.C:null):null});fe("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof vo?op:null});
function Uo(a,b,c,d,e,f,g){Jm.call(this,b,c,d,e,f);this.Ca=a;this.hg=g;this.Ib=[];this.fg=[];this.ue=!0}v(Uo,Jm);
Uo.prototype.Fd=function(a){var b=this;return Jm.prototype.Fd.call(this,a).ea(function(a){if(a){for(var c=a;c.parent;)c=c.parent;c=c.B;b.Ib.push(c);b.ue&&Mp(b,c);b.fg.push(Po(b,c));if(b.ue){var e=b.Ca;if(b.hg.b){if("block-end"===e||"left"===e)e=Oa(c,"height"),""!==e&&"auto"!==e&&x(c,"margin-top","auto")}else if("block-end"===e||"bottom"===e)e=Oa(c,"width"),""!==e&&"auto"!==e&&x(c,"margin-left","auto")}}return M(a)})};
function Mp(a,b){function c(a,c){a.forEach(function(a){var d=Oa(b,a);d&&"%"===d.charAt(d.length-1)&&x(b,a,c*parseFloat(d)/100+"px")})}var d=Cl(a.hg),e=d.U-d.V,d=d.P-d.T;c(["width","max-width","min-width"],e);c(["height","max-height","min-height"],d);c("margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left".split(" "),a.b?d:e);["margin-top","margin-right","margin-bottom","margin-left"].forEach(function(a){"auto"===Oa(b,a)&&x(b,a,"0")})}
function Tn(a){return Math.max.apply(null,a.Ib.map(function(a,c){var b=Jk(this.f,a),e=this.fg[c];return this.b?e.top+b.height+e.bottom:e.left+b.width+e.right},a))}function Np(a,b,c){var d=Jk(b.f,a);a=Po(b,a);return c?d.width+a.left+a.right:d.height+a.top+a.bottom};function Op(a){var b={};Object.keys(a).forEach(function(c){b[c]=Array.from(a[c])});return b}function Pp(a,b){this.Ec=a;this.rd=b;this.Ke=null;this.aa=this.O=-1}function Qp(a,b){this.b=a;this.f=b}function Fj(a,b,c){b=a.b.J.Qe(b,a.f);a.b.l[b]=c}function Rp(a,b,c,d){this.b=a;this.g=b;this.j=c;this.f=d;this.h=null}function Sp(a){return(a=a.match(/^[^#]*#(.*)$/))?a[1]:null}function Tp(a,b){var c=a.b.J.lc(Aa(b,a.g),a.g);"#"===c.charAt(0)&&(c=c.substring(1));return c}
function hj(a,b,c){var d=new Jb(a.f,function(){var d=a.b.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b);Up(a.b,b,function(a){return c(a[0])},d);return d}function jj(a,b,c){var d=new Jb(a.f,function(){return c(a.b.b[b]||[])},"page-counters-"+b);Up(a.b,b,c,d);return d}function Vp(a,b,c,d){var e=a.b.l[c];if(!e&&d&&b){d=a.h;if(b){d.D=b;for(b=0;d.D&&(b+=5E3,im(d,b,0)!==Number.POSITIVE_INFINITY););d.D=null}e=a.b.l[c]}return e||null}
function lj(a,b,c,d){var e=Sp(b),f=Tp(a,b),g=Vp(a,e,f,!1);return g&&g[c]?(b=g[c],new Hb(a.j,d(b[b.length-1]||null))):new Jb(a.f,function(){if(g=Vp(a,e,f,!0)){if(g[c]){var b=g[c];return d(b[b.length-1]||null)}if(b=a.b.j.f[f]?a.b.b:a.b.A[f]||null)return Wp(a.b,f),b[c]?(b=b[c],d(b[b.length-1]||null)):d(0);Xp(a.b,f,!1);return"??"}Xp(a.b,f,!1);return"??"},"target-counter-"+c+"-of-"+b)}
function nj(a,b,c,d){var e=Sp(b),f=Tp(a,b);return new Jb(a.f,function(){var b=a.b.j.f[f]?a.b.b:a.b.A[f]||null;if(b){Wp(a.b,f);var b=b[c]||[],h=Vp(a,e,f,!0)[c]||[];return d(b.concat(h))}Xp(a.b,f,!1);return"??"},"target-counters-"+c+"-of-"+b)}function Yp(a){this.J=a;this.l={};this.A={};this.b={};this.b.page=[0];this.G={};this.F=[];this.D={};this.j=null;this.u=[];this.g=[];this.H=[];this.f={};this.h={};this.Me=[]}function Zp(a,b){var c=a.b.page;c&&c.length?c[c.length-1]=b:a.b.page=[b]}
function $p(a,b,c){a.G=Op(a.b);var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=Sg(e,!0));if(d)for(var f in d){var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g]=[h]}var l;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(l=Sg(c,!1));l?"page"in l||(l.page=1):l={page:1};for(var k in l)a.b[k]||(c=a,b=k,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[k],c[c.length-1]+=l[k]}function aq(a,b){a.F.push(a.b);a.b=Op(b)}
function Wp(a,b){var c=a.f[b],d=a.h[b];d||(d=a.h[b]=[]);for(var e=!1,f=0;f<a.g.length;){var g=a.g[f];g.Ec===b?(g.rd=!0,a.g.splice(f,1),c&&(e=c.indexOf(g),0<=e&&c.splice(e,1)),d.push(g),e=!0):f++}e||Xp(a,b,!0)}function Xp(a,b,c){a.u.some(function(a){return a.Ec===b})||a.u.push(new Pp(b,c))}
function bq(a,b,c){var d=Object.keys(a.j.f);if(0<d.length){var e=Op(a.b);d.forEach(function(a){this.A[a]=e;var d=this.D[a];if(d&&d.aa<c&&(d=this.h[a])){var f=this.f[a];f||(f=this.f[a]=[]);for(var g;g=d.shift();)g.rd=!1,f.push(g)}this.D[a]={O:b,aa:c}},a)}for(var d=a.G,f;f=a.u.shift();){f.Ke=d;f.O=b;f.aa=c;var g=void 0;f.rd?(g=a.h[f.Ec])||(g=a.h[f.Ec]=[]):(g=a.f[f.Ec])||(g=a.f[f.Ec]=[]);g.every(function(a){return!(f===a||a&&f.Ec===a.Ec&&f.rd===a.rd&&f.O===a.O&&f.aa===a.aa)})&&g.push(f)}a.j=null}
function cq(a,b){var c=[];Object.keys(b.f).forEach(function(a){(a=this.f[a])&&(c=c.concat(a))},a);c.sort(function(a,b){return a.O-b.O||a.aa-b.aa});var d=[],e=null;c.forEach(function(a){e&&e.O===a.O&&e.aa===a.aa?e.Wd.push(a):(e={O:a.O,aa:a.aa,Ke:a.Ke,Wd:[a]},d.push(e))});return d}function dq(a,b){a.H.push(a.g);a.g=b}function Up(a,b,c,d){"pages"===b&&a.Me.push({Kc:d,format:c})}function eq(a){return a.N.bind(a)}
Yp.prototype.N=function(a,b,c){return 0<=this.Me.findIndex(function(b){return b.Kc===a})?(c=c.createElement("span"),c.textContent=b,c.setAttribute("data-vivliostyle-pages-counter",a.g),c):null};function fq(a,b){var c=a.b.page[0];Array.from(b.root.querySelectorAll("[data-vivliostyle-pages-counter]")).forEach(function(a){var b=a.getAttribute("data-vivliostyle-pages-counter"),d=this.Me.findIndex(function(a){return a.Kc.g===b});a.textContent=this.Me[d].format([c])},a)}
function gq(a,b){this.f=a;this.aa=b}gq.prototype.b=function(a){if(!a||a.K)return!0;a=a.B;if(!a||1!==a.nodeType)return!0;a=a.getAttribute("id")||a.getAttribute("name");return a&&(this.f.h[a]||this.f.f[a])?(a=this.f.D[a])?this.aa>=a.aa:!0:!0};var hq=1;function iq(a,b,c,d,e){this.b={};this.children=[];this.g=null;this.index=0;this.f=a;this.name=b;this.kc=c;this.Pa=d;this.parent=e;this.j="p"+hq++;e&&(this.index=e.children.length,e.children.push(this))}iq.prototype.h=function(){throw Error("E_UNEXPECTED_CALL");};iq.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function jq(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}
function kq(a,b){for(var c=0;c<a.children.length;c++)a.children[c].clone({parent:b})}function lq(a){iq.call(this,a,null,null,[],null);this.b.width=new V(Zd,0);this.b.height=new V($d,0)}v(lq,iq);
function mq(a,b){this.g=b;var c=this;Gb.call(this,a,function(a,b){var d=a.match(/^([^.]+)\.([^.]+)$/);if(d){var e=c.g.l[d[1]];if(e&&(e=this.fb[e])){if(b){var d=d[2],h=e.la[d];if(h)e=h;else{switch(d){case "columns":var h=e.f.f,l=new zc(h,0),k=nq(e,"column-count"),m=nq(e,"column-width"),p=nq(e,"column-gap"),h=B(h,Bc(h,new wc(h,"min",[l,k]),y(h,m,p)),p)}h&&(e.la[d]=h);e=h}}else e=nq(e,d[2]);return e}}return null})}v(mq,Gb);
function oq(a,b,c,d,e,f,g){a=a instanceof mq?a:new mq(a,this);iq.call(this,a,b,c,d,e);this.g=this;this.ia=f;this.ba=g;this.b.width=new V(Zd,0);this.b.height=new V($d,0);this.b["wrap-flow"]=new V(Yc,0);this.b.position=new V(Gd,0);this.b.overflow=new V(Wd,0);this.b.top=new V(new F(-1,"px"),0);this.l={}}v(oq,iq);oq.prototype.h=function(a){return new pq(a,this)};oq.prototype.clone=function(a){a=new oq(this.f,this.name,a.kc||this.kc,this.Pa,this.parent,this.ia,this.ba);jq(this,a);kq(this,a);return a};
function qq(a,b,c,d,e){iq.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.l[b]=this.j);this.b["wrap-flow"]=new V(Yc,0)}v(qq,iq);qq.prototype.h=function(a){return new rq(a,this)};qq.prototype.clone=function(a){a=new qq(a.parent.f,this.name,this.kc,this.Pa,a.parent);jq(this,a);kq(this,a);return a};function sq(a,b,c,d,e){iq.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.l[b]=this.j)}v(sq,iq);sq.prototype.h=function(a){return new tq(a,this)};
sq.prototype.clone=function(a){a=new sq(a.parent.f,this.name,this.kc,this.Pa,a.parent);jq(this,a);kq(this,a);return a};function Y(a,b,c){return b&&b!==Yc?b.Aa(a,c):null}function uq(a,b,c){return b&&b!==Yc?b.Aa(a,c):a.b}function vq(a,b,c){return b?b===Yc?null:b.Aa(a,c):a.b}function wq(a,b,c,d){return b&&c!==J?b.Aa(a,d):a.b}function xq(a,b,c){return b?b===Xd?a.j:b===ld?a.h:b.Aa(a,a.b):c}
function yq(a,b){this.g=a;this.f=b;this.J={};this.style={};this.A=this.D=null;this.children=[];this.N=this.R=this.h=this.j=!1;this.G=this.H=0;this.F=null;this.sa={};this.la={};this.ua=this.Z=this.b=!1;a&&a.children.push(this)}function zq(a){a.H=0;a.G=0}function Aq(a,b,c){b=nq(a,b);c=nq(a,c);if(!b||!c)throw Error("E_INTERNAL");return y(a.f.f,b,c)}
function nq(a,b){var c=a.sa[b];if(c)return c;var d=a.style[b];d&&(c=d.Aa(a.f.f,a.f.f.b));switch(b){case "margin-left-edge":c=nq(a,"left");break;case "margin-top-edge":c=nq(a,"top");break;case "margin-right-edge":c=Aq(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=Aq(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=Aq(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=Aq(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
Aq(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=Aq(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=Aq(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=Aq(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=Aq(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=Aq(a,"bottom-edge","padding-bottom");break;case "left-edge":c=Aq(a,"padding-left-edge","padding-left");break;case "top-edge":c=
Aq(a,"padding-top-edge","padding-top");break;case "right-edge":c=Aq(a,"left-edge","width");break;case "bottom-edge":c=Aq(a,"top-edge","height")}if(!c){if("extent"==b)d=a.b?"width":"height";else if("measure"==b)d=a.b?"height":"width";else{var e=a.b?Rh:Sh,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=nq(a,d))}c&&(a.sa[b]=c);return c}
function Bq(a){var b=a.f.f,c=a.style,d=xq(b,c.enabled,b.j),e=Y(b,c.page,b.b);if(e)var f=new uc(b,"page-number"),d=Ac(b,d,new mc(b,e,f));(e=Y(b,c["min-page-width"],b.b))&&(d=Ac(b,d,new lc(b,new uc(b,"page-width"),e)));(e=Y(b,c["min-page-height"],b.b))&&(d=Ac(b,d,new lc(b,new uc(b,"page-height"),e)));d=a.Y(d);c.enabled=new G(d)}yq.prototype.Y=function(a){return a};
yq.prototype.ze=function(){var a=this.f.f,b=this.style,c=this.g?this.g.style.width.Aa(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=wq(a,b["border-left-width"],b["border-left-style"],c),g=uq(a,b["padding-left"],c),h=Y(a,b.width,c),l=Y(a,b["max-width"],c),k=uq(a,b["padding-right"],c),m=wq(a,b["border-right-width"],b["border-right-style"],c),p=Y(a,b["margin-right"],c),q=Y(a,b.right,c),r=y(a,f,g),z=y(a,f,k);d&&q&&h?(r=B(a,c,y(a,h,y(a,y(a,d,r),z))),e?p?q=B(a,r,p):p=B(a,r,y(a,q,e)):(r=B(a,r,
q),p?e=B(a,r,p):p=e=Bc(a,r,new Hb(a,.5)))):(e||(e=a.b),p||(p=a.b),d||q||h||(d=a.b),d||h?d||q?h||q||(h=this.D,this.j=!0):d=a.b:(h=this.D,this.j=!0),r=B(a,c,y(a,y(a,e,r),y(a,p,z))),this.j&&(l||(l=B(a,r,d?d:q)),this.b||!Y(a,b["column-width"],null)&&!Y(a,b["column-count"],null)||(h=l,this.j=!1)),d?h?q||(q=B(a,r,y(a,d,h))):h=B(a,r,y(a,d,q)):d=B(a,r,y(a,q,h)));a=uq(a,b["snap-width"]||(this.g?this.g.style["snap-width"]:null),c);b.left=new G(d);b["margin-left"]=new G(e);b["border-left-width"]=new G(f);b["padding-left"]=
new G(g);b.width=new G(h);b["max-width"]=new G(l?l:h);b["padding-right"]=new G(k);b["border-right-width"]=new G(m);b["margin-right"]=new G(p);b.right=new G(q);b["snap-width"]=new G(a)};
yq.prototype.Ae=function(){var a=this.f.f,b=this.style,c=this.g?this.g.style.width.Aa(a,null):null,d=this.g?this.g.style.height.Aa(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=wq(a,b["border-top-width"],b["border-top-style"],c),h=uq(a,b["padding-top"],c),l=Y(a,b.height,d),k=Y(a,b["max-height"],d),m=uq(a,b["padding-bottom"],c),p=wq(a,b["border-bottom-width"],b["border-bottom-style"],c),q=Y(a,b["margin-bottom"],c),r=Y(a,b.bottom,d),z=y(a,g,h),u=y(a,p,m);e&&r&&l?(d=B(a,d,y(a,l,y(a,y(a,e,z),
u))),f?q?r=B(a,d,f):q=B(a,d,y(a,r,f)):(d=B(a,d,r),q?f=B(a,d,q):q=f=Bc(a,d,new Hb(a,.5)))):(f||(f=a.b),q||(q=a.b),e||r||l||(e=a.b),e||l?e||r?l||r||(l=this.A,this.h=!0):e=a.b:(l=this.A,this.h=!0),d=B(a,d,y(a,y(a,f,z),y(a,q,u))),this.h&&(k||(k=B(a,d,e?e:r)),this.b&&(Y(a,b["column-width"],null)||Y(a,b["column-count"],null))&&(l=k,this.h=!1)),e?l?r||(r=B(a,d,y(a,e,l))):l=B(a,d,y(a,r,e)):e=B(a,d,y(a,r,l)));a=uq(a,b["snap-height"]||(this.g?this.g.style["snap-height"]:null),c);b.top=new G(e);b["margin-top"]=
new G(f);b["border-top-width"]=new G(g);b["padding-top"]=new G(h);b.height=new G(l);b["max-height"]=new G(k?k:l);b["padding-bottom"]=new G(m);b["border-bottom-width"]=new G(p);b["margin-bottom"]=new G(q);b.bottom=new G(r);b["snap-height"]=new G(a)};
function Cq(a){var b=a.f.f,c=a.style;a=Y(b,c[a.b?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==Cd?f.Aa(b,null):null)||(f=new tc(b,1,"em"));d&&!e&&(e=new wc(b,"floor",[Cc(b,y(b,a,f),y(b,d,f))]),e=new wc(b,"max",[b.f,e]));e||(e=b.f);d=B(b,Cc(b,y(b,a,f),e),f);c["column-width"]=new G(d);c["column-count"]=new G(e);c["column-gap"]=new G(f)}function Dq(a,b,c,d){a=a.style[b].Aa(a.f.f,null);return Wb(a,c,d,{})}
function Eq(a,b){b.fb[a.f.j]=a;var c=a.f.f,d=a.style,e=a.g?Fq(a.g,b):null,e=Uj(a.J,b,e,!1);a.b=Sj(e,b,a.g?a.g.b:!1);a.Z=Tj(e,b,a.g?a.g.Z:!1);Yj(e,d,a.b,a.Z,function(a,b){return b.value});a.D=new Jb(c,function(){return a.H},"autoWidth");a.A=new Jb(c,function(){return a.G},"autoHeight");a.ze();a.Ae();Cq(a);Bq(a)}function Gq(a,b,c){(a=a.style[c])&&(a=mg(b,a,c));return a}function Z(a,b,c){(a=a.style[c])&&(a=mg(b,a,c));return Uc(a,b)}
function Fq(a,b){var c;a:{if(c=a.J["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==C&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function Hq(a,b,c,d,e){if(a=Gq(a,b,d))a.xc()&&Ob(a.ka)&&(a=new F(Uc(a,b),"px")),"font-family"===d&&(a=um(e,a)),x(c,d,a.toString())}
function Iq(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a=Z(a,b,"width");yl(c,d,a);x(c.element,"margin-left",e+"px");x(c.element,"padding-left",f+"px");x(c.element,"border-left-width",g+"px");c.marginLeft=e;c.Z=g;c.H=f}
function Jq(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b=Z(a,b,"border-right-width");x(c.element,"margin-right",f+"px");x(c.element,"padding-right",g+"px");x(c.element,"border-right-width",b+"px");c.marginRight=f;c.Za=b;a.b&&0<e&&(a=d+ul(c),a-=Math.floor(a/e)*e,0<a&&(c.Md=e-a,g+=c.Md));c.Y=g;c.Pd=e}
function Kq(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b=Z(a,b,"border-top-width");c.top=e;c.marginTop=f;c.ca=b;c.Mb=d;!a.b&&0<d&&(a=e+rl(c),a-=Math.floor(a/d)*d,0<a&&(c.Bb=d-a,g+=c.Bb));c.J=g;x(c.element,"top",e+"px");x(c.element,"margin-top",f+"px");x(c.element,"padding-top",g+"px");x(c.element,"border-top-width",b+"px")}
function Lq(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a=Z(a,b,"height")-c.Bb;x(c.element,"height",a+"px");x(c.element,"margin-bottom",d+"px");x(c.element,"padding-bottom",e+"px");x(c.element,"border-bottom-width",f+"px");c.height=a-c.Bb;c.marginBottom=d;c.Ba=f;c.R=e}function Mq(a,b,c){a.b?(Kq(a,b,c),Lq(a,b,c)):(Jq(a,b,c),Iq(a,b,c))}
function Nq(a,b,c){x(c.element,"border-top-width","0px");var d=Z(a,b,"max-height");a.R?xl(c,0,d):(Kq(a,b,c),d-=c.Bb,c.height=d,x(c.element,"height",d+"px"))}function Oq(a,b,c){x(c.element,"border-left-width","0px");var d=Z(a,b,"max-width");a.N?yl(c,0,d):(Jq(a,b,c),d-=c.Md,c.width=d,a=Z(a,b,"right"),x(c.element,"right",a+"px"),x(c.element,"width",d+"px"))}
var Pq="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),Qq="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
Rq="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),Sq=["width","height"],Tq=["transform","transform-origin"];
yq.prototype.ic=function(a,b,c,d){this.g&&this.b==this.g.b||x(b.element,"writing-mode",this.b?"vertical-rl":"horizontal-tb");(this.b?this.j:this.h)?this.b?Oq(this,a,b):Nq(this,a,b):(this.b?Jq(this,a,b):Kq(this,a,b),this.b?Iq(this,a,b):Lq(this,a,b));(this.b?this.h:this.j)?this.b?Nq(this,a,b):Oq(this,a,b):Mq(this,a,b);for(c=0;c<Pq.length;c++)Hq(this,a,b.element,Pq[c],d)};function Uq(a,b,c,d){for(var e=0;e<Rq.length;e++)Hq(a,b,c.element,Rq[e],d)}
function Vq(a,b,c,d){for(var e=0;e<Sq.length;e++)Hq(a,b,c,Sq[e],d)}
yq.prototype.Od=function(a,b,c,d,e,f,g){this.b?this.H=b.h+b.Md:this.G=b.h+b.Bb;var h=(this.b||!d)&&this.h,l=(!this.b||!d)&&this.j;if(l||h)l&&x(b.element,"width","auto"),h&&x(b.element,"height","auto"),d=Jk(f,d?d.element:b.element),l&&(this.H=Math.ceil(d.right-d.left-b.H-b.Z-b.Y-b.Za),this.b&&(this.H+=b.Md)),h&&(this.G=d.bottom-d.top-b.J-b.ca-b.R-b.Ba,this.b||(this.G+=b.Bb));(this.b?this.h:this.j)&&Mq(this,a,b);if(this.b?this.j:this.h){if(this.b?this.N:this.R)this.b?Jq(this,a,b):Kq(this,a,b);this.b?
Iq(this,a,b):Lq(this,a,b)}if(1<e&&(l=Z(this,a,"column-rule-width"),d=Gq(this,a,"column-rule-style"),f=Gq(this,a,"column-rule-color"),0<l&&d&&d!=J&&f!=Td))for(var k=Z(this,a,"column-gap"),m=this.b?b.height:b.width,p=this.b?"border-top":"border-left",h=1;h<e;h++){var q=(m+k)*h/e-k/2+b.H-l/2,r=b.height+b.J+b.R,z=b.element.ownerDocument.createElement("div");x(z,"position","absolute");x(z,this.b?"left":"top","0px");x(z,this.b?"top":"left",q+"px");x(z,this.b?"height":"width","0px");x(z,this.b?"width":"height",
r+"px");x(z,p,l+"px "+d.toString()+(f?" "+f.toString():""));b.element.insertBefore(z,b.element.firstChild)}for(h=0;h<Qq.length;h++)Hq(this,a,b.element,Qq[h],g);for(h=0;h<Tq.length;h++)e=b,g=Tq[h],l=c.l,(d=Gq(this,a,g))&&l.push(new Bk(e.element,g,d))};
yq.prototype.l=function(a,b){var c=this.J,d=this.f.b,e;for(e in d)Yh(e)&&Zh(c,e,d[e]);if("background-host"==this.f.kc)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.f.kc)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);xj(a,this.f.Pa,null,c);c.content&&(c.content=c.content.Nd(new aj(a,null,a.wb)));Eq(this,a.l);c=t(this.f.children);for(d=c.next();!d.done;d=c.next())d.value.h(this).l(a,b);Hj(a)};
function Wq(a,b){a.j&&(a.N=Dq(a,"right",a.D,b)||Dq(a,"margin-right",a.D,b)||Dq(a,"border-right-width",a.D,b)||Dq(a,"padding-right",a.D,b));a.h&&(a.R=Dq(a,"top",a.A,b)||Dq(a,"margin-top",a.A,b)||Dq(a,"border-top-width",a.A,b)||Dq(a,"padding-top",a.A,b));for(var c=t(a.children),d=c.next();!d.done;d=c.next())Wq(d.value,b)}function Xq(a){yq.call(this,null,a)}v(Xq,yq);Xq.prototype.l=function(a,b){yq.prototype.l.call(this,a,b);this.children.sort(function(a,b){return b.f.ba-a.f.ba||a.f.index-b.f.index})};
function pq(a,b){yq.call(this,a,b);this.F=this}v(pq,yq);pq.prototype.Y=function(a){var b=this.f.g;b.ia&&(a=Ac(b.f,a,b.ia));return a};pq.prototype.ca=function(){};function rq(a,b){yq.call(this,a,b);this.F=a.F}v(rq,yq);function tq(a,b){yq.call(this,a,b);this.F=a.F}v(tq,yq);
function Yq(a,b,c,d){var e=null;c instanceof Oc&&(e=[c]);c instanceof Hc&&(e=c.values);if(e)for(a=a.f.f,c=0;c<e.length;c++)if(e[c]instanceof Oc){var f=Eb(e[c].name,"enabled"),f=new uc(a,f);d&&(f=new cc(a,f));b=Ac(a,b,f)}return b}
tq.prototype.Y=function(a){var b=this.f.f,c=this.style,d=xq(b,c.required,b.h)!==b.h;if(d||this.h){var e=c["flow-from"],e=e?e.Aa(b,b.b):new Hb(b,"body"),e=new wc(b,"has-content",[e]);a=Ac(b,a,e)}a=Yq(this,a,c["required-partitions"],!1);a=Yq(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.F.style.enabled)?c.Aa(b,null):b.j,c=Ac(b,c,a),this.F.style.enabled=new G(c));return a};tq.prototype.ic=function(a,b,c,d,e){x(b.element,"overflow","hidden");yq.prototype.ic.call(this,a,b,c,d,e)};
function Zq(a,b,c,d){Gf.call(this,a,b,!1);this.target=c;this.b=d}v(Zq,Hf);Zq.prototype.Qb=function(a,b,c){Dh(this.b,a,b,c,this)};Zq.prototype.ee=function(a,b){If(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};Zq.prototype.hd=function(a,b){If(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Zq.prototype.Sb=function(a,b,c){this.target.b[a]=new V(b,c?50331648:67108864)};function $q(a,b,c,d){Zq.call(this,a,b,c,d)}v($q,Zq);
function ar(a,b,c,d){Zq.call(this,a,b,c,d);c.b.width=new V(Yd,0);c.b.height=new V(Yd,0)}v(ar,Zq);ar.prototype.wd=function(a,b,c){a=new sq(this.f,a,b,c,this.target);Ff(this.oa,new $q(this.f,this.oa,a,this.b))};ar.prototype.vd=function(a,b,c){a=new qq(this.f,a,b,c,this.target);a=new ar(this.f,this.oa,a,this.b);Ff(this.oa,a)};function br(a,b,c,d){Zq.call(this,a,b,c,d)}v(br,Zq);br.prototype.wd=function(a,b,c){a=new sq(this.f,a,b,c,this.target);Ff(this.oa,new $q(this.f,this.oa,a,this.b))};
br.prototype.vd=function(a,b,c){a=new qq(this.f,a,b,c,this.target);a=new ar(this.f,this.oa,a,this.b);Ff(this.oa,a)};function cr(a){a=a.toString();switch(a){case "inline-flex":a="flex";break;case "inline-grid":a="grid";break;case "inline-table":a="table";break;case "inline":case "table-row-group":case "table-column":case "table-column-group":case "table-header-group":case "table-footer-group":case "table-row":case "table-cell":case "table-caption":case "inline-block":a="block"}return D(a)}function Wl(a,b,c,d){if(a!==J)if(b===Vc||b===md)c=J,a=cr(a);else if(c&&c!==J||d)a=cr(a);return{display:a,position:b,ja:c}}
function dr(a){switch(a.toString()){case "inline":case "inline-block":case "inline-list-item":case "inline-flex":case "inline-grid":case "ruby":case "inline-table":return!0;default:return!1}}function er(a,b,c,d,e,f,g){e=e||f||rd;return!!g||!!c&&c!==J||b===Vc||b===md||a===ud||a===Pd||a===Od||a==nd||(a===ad||a===Ad)&&!!d&&d!==Wd||!!f&&e!==f};function fr(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return'url("'+c.lc(e,b)+'"'}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return"url('"+c.lc(e,b)+"'"}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return"url("+c.lc(e,b)})}
fr=function(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return'url("'+c.lc(e,b)+'"'}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return"url('"+c.lc(e,b)+"'"}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return"url("+c.lc(e,b)})};var gr={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent","border-top-left-radius":"0px","border-top-right-radius":"0px"},hr={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent","border-top-right-radius":"0px","border-bottom-right-radius":"0px"},ir={"margin-top":"0px"},jr={"margin-right":"0px"},kr={};
function lr(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var mr=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),nr="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function or(a,b){a.setAttribute("data-adapt-pseudo",b)}function pr(a,b,c,d,e){this.style=b;this.element=a;this.b=c;this.g=d;this.h=e;this.f={}}pr.prototype.l=function(a){var b=a.getAttribute("data-adapt-pseudo")||"";this.b&&b&&b.match(/after$/)&&(this.style=this.b.l(this.element,!0),this.b=null);a=this.style._pseudos[b]||{};if(b.match(/^first-/)&&!a["x-first-pseudo"]){var c=1;if("first-letter"==b)c=0;else if(b=b.match(/^first-([0-9]+)-lines$/))c=b[1]-0;a["x-first-pseudo"]=new V(new Qc(c),0)}return a};
pr.prototype.sa=function(a,b){var c=a.getAttribute("data-adapt-pseudo")||"";this.f[c]||(this.f[c]=!0,(c=b.content)&&Gl(c)&&c.fa(new Fl(a,this.g,c,this.h)))};function qr(a,b,c,d,e,f,g,h,l,k,m,p,q){this.Pb={};this.G=a;this.b=b;this.viewport=c;this.D=c.b;this.j=d;this.u=eq(d.Ba.b);this.l=e;this.da=f;this.H=g;this.A=h;this.J=l;this.page=k;this.g=m;this.F=p;this.h=q;this.N=this.w=null;this.f=!1;this.M=null;this.na=0;this.B=null}v(qr,eb);
qr.prototype.clone=function(){return new qr(this.G,this.b,this.viewport,this.j,this.l,this.da,this.H,this.A,this.J,this.page,this.g,this.F,this.h)};function rr(a,b,c,d){a=a._pseudos;if(!a)return null;var e={},f={},g;for(g in a)f.cd=e[g]={},Xj(f.cd,a[g],d),Vj(f.cd,d,a[g]),Wj(a[g],b,c,function(a){return function(b,c){Xj(a.cd,c,d);sr(c,function(b){Xj(a.cd,b,d)})}}(f)),f={cd:f.cd};return e}
function tr(a,b,c,d,e,f){var g=L("createRefShadow");a.da.u.load(b).then(function(h){if(h){var l=lk(h,b);if(l){var k=a.J,m=k.N[h.url];if(!m){var m=k.style.F.f[h.url],p=new Pb(0,k.hc(),k.gc(),k.u),m=new am(h,m.g,m.f,p,k.l,m.G,new Qp(k.h,h.url),new Rp(k.h,h.url,m.f,m.b));k.N[h.url]=m}f=new Zk(d,l,h,e,f,c,m)}}O(g,f)});return g.result()}
function ur(a,b,c,d,e,f,g,h){var l=L("createShadows"),k=e.template,m;k instanceof Sc?m=tr(a,k.url,2,b,h,null):m=M(null);m.then(function(k){var m=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var p=b.getAttribute("href"),z=null;p?z=h?h.da:a.da:h&&(p="http://www.w3.org/1999/xhtml"==h.oa.namespaceURI?h.oa.getAttribute("href"):h.oa.getAttributeNS("http://www.w3.org/1999/xlink","href"),z=h.nd?h.nd.da:a.da);p&&(p=Aa(p,z.url),m=tr(a,p,3,b,h,k))}m||(m=M(k));var u=null;
m.then(function(c){e.display===Pd?u=tr(a,Aa("user-agent.xml#table-cell",za),2,b,h,c):u=M(c)});u.then(function(k){var m=rr(d,a.l,a.f,g);if(m){for(var p=[],q=mr.createElementNS("http://www.pyroxy.com/ns/shadow","root"),r=q,u=t(nr),z=u.next();!z.done;z=u.next()){var z=z.value,A;if(z){if(!m[z])continue;if(!("footnote-marker"!=z||c&&a.f))continue;if(z.match(/^first-/)&&(A=e.display,!A||A===td))continue;if("before"===z||"after"===z)if(A=m[z].content,!A||A===Cd||A===J)continue;p.push(z);A=mr.createElementNS("http://www.w3.org/1999/xhtml",
"span");or(A,z)}else A=mr.createElementNS("http://www.pyroxy.com/ns/shadow","content");r.appendChild(A);z.match(/^first-/)&&(r=A)}k=p.length?new Zk(b,q,null,h,k,2,new pr(b,d,f,g,a.u)):k}O(l,k)})});return l.result()}function yo(a,b,c){a.N=b;a.f=c}
function vr(a,b,c,d,e){var f=a.b;d=Uj(d,f,a.l,a.f);b=Sj(d,f,b);c=Tj(d,f,c);Yj(d,e,b,c,function(b,c){var d=c.evaluate(f,b);"font-family"==b&&(d=um(a.H,d));return d});var g=Wl(e.display||td,e.position,e["float"],a.M===a.da.root);["display","position","float"].forEach(function(a){g[a]&&(e[a]=g[a])});return b}
function wr(a,b){for(var c=a.w.M,d=[],e=null,f=a.w.wa,g=-1;c&&1==c.nodeType;){var h=f&&f.root==c;if(!h||2==f.type){var l=(f?f.b:a.j).l(c,!1);d.push(l);e=e||Pa(c)}h?(c=f.oa,f=f.nd):(c=c.parentNode,g++)}c=Rb(a.b,"em",!g);c={"font-size":new V(new F(c,"px"),0)};f=new ei(c,a.b);for(g=d.length-1;0<=g;--g){var h=d[g],l=[],k;for(k in h)Fh[k]&&l.push(k);l.sort(ce);for(var l=t(l),m=l.next();!m.done;m=l.next()){m=m.value;f.b=m;var p=h[m];p.value!==sd&&(c[m]=p.Nd(f))}}for(var q in b)Fh[q]||(c[q]=b[q]);return{lang:e,
mb:c}}var xr={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function yr(a,b){b=Aa(b,a.da.url);return a.F[b]||b}function zr(a){a.w.lang=Pa(a.w.M)||a.w.parent&&a.w.parent.lang||a.w.lang}
function Ar(a,b){var c=Hh().filter(function(a){return b[a]});if(c.length){var d=a.w.h;if(a.w.parent){var d=a.w.h={},e;for(e in a.w.parent.h)d[e]=a.w.parent.h[e]}c.forEach(function(a){var c=b[a];if(c){if(c instanceof Qc)d[a]=c.L;else if(c instanceof Oc)d[a]=c.name;else if(c instanceof F)switch(c.ka){case "dpi":case "dpcm":case "dppx":d[a]=c.L*Nb[c.ka]}else d[a]=c;delete b[a]}})}}
function Br(a,b,c,d,e,f){for(var g=ge("RESOLVE_FORMATTING_CONTEXT"),h=0;h<g.length;h++){var l=g[h](a,b,c,d,e,f);if(l){a.C=l;break}}}
function Cr(a,b,c){var d=!0,e=L("createElementView"),f=a.M,g=a.w.wa?a.w.wa.b:a.j,h=g.l(f,!1);if(!a.w.wa){var l=gk(a.da,f);Dr(l,a.w.Sa,0)}var k={};a.w.parent||(l=wr(a,h),h=l.mb,a.w.lang=l.lang);var m=h["float-reference"]&&Vm(h["float-reference"].value.toString());a.w.parent&&m&&Wm(m)&&(l=wr(a,h),h=l.mb,a.w.lang=l.lang);a.w.b=vr(a,a.w.b,"rtl"===a.w.direction,h,k);g.sa(f,k);Ar(a,k);zr(a);k.direction&&(a.w.direction=k.direction.toString());if((l=k["flow-into"])&&l.toString()!=a.G)return O(e,!1),e.result();
var p=k.display;if(p===J)return O(e,!1),e.result();var q=!a.w.parent;a.w.H=p===nd;ur(a,f,q,h,k,g,a.b,a.w.wa).then(function(l){a.w.Ia=l;l=k.position;var r=k["float"],u=k.clear,A=a.w.b?Vd:rd,H=a.w.parent?a.w.parent.b?Vd:rd:A,E="true"===f.getAttribute("data-vivliostyle-flow-root");a.w.fd=er(p,l,r,k.overflow,A,H,E);a.w.R=l===Gd||l===Vc||l===md;!gl(a.w)||r===od||m&&Wm(m)||(u=r=null);A=r===yd||r===Hd||r===Sd||r===ed||r===wd||r===vd||r===cd||r===bd||r===Kd||r===od;r&&(delete k["float"],r===od&&(a.f?(A=!1,
k.display=ad):k.display=td));u&&(u===sd&&a.w.parent&&a.w.parent.l&&(u=D(a.w.parent.l)),u===yd||u===Hd||u===Sd||u===ed||u===dd||u===Wc||u===Id)&&(delete k.clear,k.display&&k.display!=td&&(a.w.l=u.toString()));var K=p===Ad&&k["ua-list-item-count"];(A||k["break-inside"]&&k["break-inside"]!==Yc)&&a.w.j++;p&&p!==td&&dr(p)&&a.w.j++;if(!(u=!A&&!p||dr(p)))a:switch(p.toString()){case "ruby-base":case "ruby-text":case "ruby-base-container":case "ruby-text-container":u=!0;break a;default:u=!1}a.w.ya=u;a.w.display=
p?p.toString():"inline";a.w.Ca=A?r.toString():null;a.w.W=m||al;a.w.N=k["float-min-wrap-block"]||null;a.w.ca=k["column-span"];if(!a.w.ya){if(u=k["break-after"])a.w.G=u.toString();if(u=k["break-before"])a.w.g=u.toString()}a.w.Z=k["vertical-align"]&&k["vertical-align"].toString()||"baseline";a.w.la=k["caption-side"]&&k["caption-side"].toString()||"top";u=k["border-collapse"];if(!u||u===D("separate"))if(A=k["border-spacing"])A.Sd()?(u=A.values[0],A=A.values[1]):u=A,u.xc()&&(a.w.sa=Uc(u,a.b)),A.xc()&&
(a.w.ta=Uc(A,a.b));a.w.Y=k["footnote-policy"];if(u=k["x-first-pseudo"])a.w.f=new $k(a.w.parent?a.w.parent.f:null,u.L);a.w.ya||Er(a,f,h,g,a.b);if(u=k["white-space"])u=Kk(u.toString()),null!==u&&(a.w.rc=u);(u=k["hyphenate-character"])&&u!==Yc&&(a.w.F=u.Vc);u=k["overflow-wrap"]||["word-wrap"];a.w.A=k["word-break"]===gd||u===hd;Br(a.w,b,p,l,r,q);a.w.parent&&a.w.parent.C&&(b=a.w.parent.C.ff(a.w,b));a.w.ya||(a.w.u=Fr(k),Gr(a,f,g));var I=!1,la=null,Ca=[],Da=f.namespaceURI,N=f.localName;if("http://www.w3.org/1999/xhtml"==
Da)"html"==N||"body"==N||"script"==N||"link"==N||"meta"==N?N="div":"vide_"==N?N="video":"audi_"==N?N="audio":"object"==N&&(I=!!a.g),f.getAttribute("data-adapt-pseudo")&&h.content&&h.content.value&&h.content.value.url&&(N="img");else if("http://www.idpf.org/2007/ops"==Da)N="span",Da="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==Da){Da="http://www.w3.org/1999/xhtml";if("image"==N){if(N="div",(l=f.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==l.charAt(0)&&
(l=lk(a.da,l)))la=Hr(a,Da,"img"),l="data:"+(l.getAttribute("content-type")||"image/jpeg")+";base64,"+l.textContent.replace(/[ \t\n\t]/g,""),Ca.push(Je(la,l))}else N=xr[N];N||(N=a.w.ya?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==Da)if(Da="http://www.w3.org/1999/xhtml","ncx"==N||"navPoint"==N)N="div";else if("navLabel"==N){if(N="span",r=f.parentNode){l=null;for(r=r.firstChild;r;r=r.nextSibling)if(1==r.nodeType&&(u=r,"http://www.daisy.org/z3986/2005/ncx/"==u.namespaceURI&&"content"==
u.localName)){l=u.getAttribute("src");break}l&&(N="a",f=f.ownerDocument.createElementNS(Da,"a"),f.setAttribute("href",l))}}else N="span";else"http://www.pyroxy.com/ns/shadow"==Da?(Da="http://www.w3.org/1999/xhtml",N=a.w.ya?"span":"div"):I=!!a.g;K?b?N="li":(N="div",p=ad,k.display=p):"body"==N||"li"==N?N="div":"q"==N?N="span":"a"==N&&(l=k["hyperlink-processing"])&&"normal"!=l.toString()&&(N="span");k.behavior&&"none"!=k.behavior.toString()&&a.g&&(I=!0);f.dataset&&"true"===f.getAttribute("data-math-typeset")&&
(I=!0);var rb;I?rb=a.g(f,a.w.parent?a.w.parent.B:null,k):rb=M(null);rb.then(function(g){g?I&&(d="true"==g.getAttribute("data-adapt-process-children")):g=Hr(a,Da,N);"a"==N&&g.addEventListener("click",a.page.J,!1);la&&($o(a,a.w,"inner",la),g.appendChild(la));"iframe"==g.localName&&"http://www.w3.org/1999/xhtml"==g.namespaceURI&&lr(g);var h=a.w.h["image-resolution"],l=[],m=k.width,p=k.height,q=f.getAttribute("width"),r=f.getAttribute("height"),m=m===Yc||!m&&!q,p=p===Yc||!p&&!r;if("http://www.gribuser.ru/xml/fictionbook/2.0"!=
f.namespaceURI||"td"==N){for(var q=f.attributes,u=q.length,r=null,z=0;z<u;z++){var A=q[z],H=A.namespaceURI,E=A.localName,A=A.nodeValue;if(H)if("http://www.w3.org/2000/xmlns/"==H)continue;else"http://www.w3.org/1999/xlink"==H&&"href"==E&&(A=yr(a,A));else{if(E.match(/^on/))continue;if("style"==E)continue;if(("id"==E||"name"==E)&&b){A=a.h.Qe(A,a.da.url);g.setAttribute(E,A);Hk(a.page,g,A);continue}"src"==E||"href"==E||"poster"==E?(A=yr(a,A),"href"===E&&(A=a.h.lc(A,a.da.url))):"srcset"==E&&(A=A.split(",").map(function(b){return yr(a,
b.trim())}).join(","));if("poster"===E&&"video"===N&&"http://www.w3.org/1999/xhtml"===Da&&m&&p){var rb=new Image,Dp=Je(rb,A);Ca.push(Dp);l.push({Rf:rb,element:g,Of:Dp})}}"http://www.w3.org/2000/svg"==Da&&/^[A-Z\-]+$/.test(E)&&(E=E.toLowerCase());Ir.includes(E.toLowerCase())&&(A=fr(A,a.da.url,a.h));H&&(rb=kr[H])&&(E=rb+":"+E);"src"!=E||H||"img"!=N&&"input"!=N||"http://www.w3.org/1999/xhtml"!=Da?"href"==E&&"image"==N&&"http://www.w3.org/2000/svg"==Da&&"http://www.w3.org/1999/xlink"==H?a.page.j.push(Je(g,
A)):H?g.setAttributeNS(H,E,A):g.setAttribute(E,A):r=A}r&&(rb="input"===N?new Image:g,q=Je(rb,r),rb!==g&&(g.src=r),m||p?(m&&p&&h&&1!==h&&l.push({Rf:rb,element:g,Of:q}),Ca.push(q)):a.page.j.push(q))}delete k.content;(m=k["list-style-image"])&&m instanceof Sc&&(m=m.url,Ca.push(Je(new Image,m)));Jr(a,k);Kr(a,g,k);if(!a.w.ya&&(m=null,b?c&&(m=a.w.b?jr:ir):m="clone"!==a.w.h["box-decoration-break"]?a.w.b?hr:gr:a.w.b?jr:ir,m))for(var Ep in m)x(g,Ep,m[Ep]);K&&g.setAttribute("value",k["ua-list-item-count"].stringValue());
a.B=g;Ca.length?Ie(Ca).then(function(){0<h&&Lr(a,l,h,k,a.w.b);O(e,d)}):Be().then(function(){O(e,d)})})});return e.result()}function Er(a,b,c,d,e){var f=rr(c,a.l,a.f,e);f&&f["after-if-continues"]&&f["after-if-continues"].content&&(a.w.J=new Mr(b,new pr(b,c,d,e,a.u)))}var Ir="color-profile clip-path cursor filter marker marker-start marker-end marker-mid fill stroke mask".split(" ");
function Lr(a,b,c,d,e){b.forEach(function(b){if("load"===b.Of.get().get()){var f=b.Rf,h=f.width/c,f=f.height/c;b=b.element;if(0<h&&0<f)if(d["box-sizing"]===fd&&(d["border-left-style"]!==J&&(h+=Uc(d["border-left-width"],a.b)),d["border-right-style"]!==J&&(h+=Uc(d["border-right-width"],a.b)),d["border-top-style"]!==J&&(f+=Uc(d["border-top-width"],a.b)),d["border-bottom-style"]!==J&&(f+=Uc(d["border-bottom-width"],a.b))),1<c){var l=d["max-width"]||J,k=d["max-height"]||J;l===J&&k===J?x(b,"max-width",
h+"px"):l!==J&&k===J?x(b,"width",h+"px"):l===J&&k!==J?x(b,"height",f+"px"):"%"!==l.ka?x(b,"max-width",Math.min(h,Uc(l,a.b))+"px"):"%"!==k.ka?x(b,"max-height",Math.min(f,Uc(k,a.b))+"px"):e?x(b,"height",f+"px"):x(b,"width",h+"px")}else 1>c&&(l=d["min-width"]||ae,k=d["min-height"]||ae,l.L||k.L?l.L&&!k.L?x(b,"width",h+"px"):!l.L&&k.L?x(b,"height",f+"px"):"%"!==l.ka?x(b,"min-width",Math.max(h,Uc(l,a.b))+"px"):"%"!==k.ka?x(b,"min-height",Math.max(f,Uc(k,a.b))+"px"):e?x(b,"height",f+"px"):x(b,"width",h+
"px"):x(b,"min-width",h+"px"))}})}function Jr(a,b){ge("PREPROCESS_ELEMENT_STYLE").forEach(function(c){c(a.w,b)})}function Gr(a,b,c){for(b=b.firstChild;b;b=b.nextSibling)if(1===b.nodeType){var d={},e=c.l(b,!1);vr(a,a.w.b,"rtl"===a.w.direction,e,d);if(Fr(d)){if(a.w.C instanceof yp&&!il(a.w,a.w.C))break;c=a.w.parent;a.w.C=new yp(c&&c.C,a.w.M);Nr(a.w.C,a.w.b);break}}}
function Fr(a){var b=a["repeat-on-break"];return b!==J&&(b===Yc&&(b=a.display===Rd?qd:a.display===Qd?pd:J),b&&b!==J)?b.toString():null}function Or(a){var b=L("createTextNodeView");Pr(a).then(function(){var c=a.na||0,c=Qr(a.w.Qa).substr(c);a.B=document.createTextNode(c);O(b,!0)});return b.result()}
function Pr(a){if(a.w.Qa)return M(!0);var b,c=b=a.M.textContent,d=L("preprocessTextContent"),e=ge("PREPROCESS_TEXT_CONTENT"),f=0;De(function(){return f>=e.length?M(!1):e[f++](a.w,c).ea(function(a){c=a;return M(!0)})}).then(function(){a.w.Qa=Rr(b,c,0);O(d,!0)});return d.result()}
function Sr(a,b,c){var d=L("createNodeView"),e=!0;1==a.M.nodeType?b=Cr(a,b,c):8==a.M.nodeType?(a.B=null,b=M(!0)):b=Or(a);b.then(function(b){e=b;(a.w.B=a.B)&&(b=a.w.parent?a.w.parent.B:a.N)&&b.appendChild(a.B);O(d,e)});return d.result()}function zo(a,b,c,d){(a.w=b)?(a.M=b.M,a.na=b.na):(a.M=null,a.na=-1);a.B=null;return a.w?Sr(a,c,!!d):M(!0)}
function Tr(a){if(null==a.wa||"content"!=a.M.localName||"http://www.pyroxy.com/ns/shadow"!=a.M.namespaceURI)return a;var b=a.Ma,c=a.wa,d=a.parent,e,f;c.vf?(f=c.vf,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.nd,e=c.oa.firstChild,c=2);var g=a.M.nextSibling;g?(a.M=g,bl(a)):a.Fa?a=a.Fa:e?a=null:(a=a.parent.modify(),a.K=!0);if(e)return b=new Xk(e,d,b),b.wa=f,b.kb=c,b.Fa=a,b;a.Ma=b;return a}
function Ur(a){var b=a.Ma+1;if(a.K){if(!a.parent)return null;if(3!=a.kb){var c=a.M.nextSibling;if(c)return a=a.modify(),a.Ma=b,a.M=c,bl(a),Tr(a)}if(a.Fa)return a=a.Fa.modify(),a.Ma=b,a;a=a.parent.modify()}else{if(a.Ia&&(c=a.Ia.root,2==a.Ia.type&&(c=c.firstChild),c))return b=new Xk(c,a,b),b.wa=a.Ia,b.kb=a.Ia.type,Tr(b);if(c=a.M.firstChild)return Tr(new Xk(c,a,b));1!=a.M.nodeType&&(c=Qr(a.Qa),b+=c.length-1-a.na);a=a.modify()}a.Ma=b;a.K=!0;return a}
function Fm(a,b,c){b=Ur(b);if(!b||b.K)return M(b);var d=L("nextInTree");zo(a,b,!0,c).then(function(c){b.B&&c||(b=b.modify(),b.K=!0,b.B||(b.ya=!0));fb(a,{type:"nextInTree",w:b});O(d,b)});return d.result()}function Vr(a,b){if(b instanceof Hc)for(var c=b.values,d=0;d<c.length;d++)Vr(a,c[d]);else b instanceof Sc&&(c=b.url,a.page.j.push(Je(new Image,c)))}
var Wr={"box-decoration-break":!0,"float-min-wrap-block":!0,"float-reference":!0,"flow-into":!0,"flow-linger":!0,"flow-options":!0,"flow-priority":!0,"footnote-policy":!0,page:!0};function Kr(a,b,c){var d=c["background-image"];d&&Vr(a,d);var d=c.position===Gd,e;for(e in c)if(!Wr[e]){var f=c[e],f=f.fa(new Tg(a.da.url,a.h));f.xc()&&Ob(f.ka)&&(f=new F(Uc(f,a.b),"px"));zk[e]||d&&Ak[e]?a.page.l.push(new Bk(b,e,f)):x(b,e,f.toString())}}
function $o(a,b,c,d){if(!b.K){var e=(b.wa?b.wa.b:a.j).l(a.M,!1);if(e=e._pseudos)if(e=e[c])c={},b.b=vr(a,b.b,"rtl"===b.direction,e,c),b=c.content,Gl(b)&&(b.fa(new Fl(d,a.b,b,a.u)),delete c.content),Kr(a,d,c)}}
function Co(a,b,c){var d=L("peelOff"),e=b.f,f=b.na,g=b.K;if(0<c)b.B.textContent=b.B.textContent.substr(0,c),f+=c;else if(!g&&b.B&&!f){var h=b.B.parentNode;h&&h.removeChild(b.B)}for(var l=b.Ma+c,k=[];b.f===e;)k.push(b),b=b.parent;var m=k.pop(),p=m.Fa;De(function(){for(;0<k.length;){m=k.pop();b=new Xk(m.M,b,l);k.length||(b.na=f,b.K=g);b.kb=m.kb;b.wa=m.wa;b.Ia=m.Ia;b.Fa=m.Fa?m.Fa:p;p=null;var c=zo(a,b,!1);if(c.Xa())return c}return M(!1)}).then(function(){O(d,b)});return d.result()}
function Hr(a,b,c){return"http://www.w3.org/1999/xhtml"==b?a.D.createElement(c):a.D.createElementNS(b,c)}function Lp(a){a&&hl(a,function(a){var b=a.h["box-decoration-break"];b&&"slice"!==b||(b=a.B,a.b?(x(b,"padding-left","0"),x(b,"border-left","none"),x(b,"border-top-left-radius","0"),x(b,"border-bottom-left-radius","0")):(x(b,"padding-bottom","0"),x(b,"border-bottom","none"),x(b,"border-bottom-left-radius","0"),x(b,"border-bottom-right-radius","0")))})}
function Xr(a){this.b=a.h;this.window=a.window}function Yr(a,b){var c=b.left,d=b.top;return{left:a.left-c,top:a.top-d,right:a.right-c,bottom:a.bottom-d,width:a.width,height:a.height}}function jo(a,b){var c=b.getClientRects(),d=a.b.getBoundingClientRect();return Array.from(c).map(function(a){return Yr(a,d)},a)}function Jk(a,b){var c=b.getBoundingClientRect(),d=a.b.getBoundingClientRect();return Yr(c,d)}function Pn(a,b){return a.window.getComputedStyle(b,null)}
function Zr(a,b,c,d,e){this.window=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));var f=b.nextElementSibling;f||(f=this.b.createElement("div"),f.setAttribute("data-vivliostyle-layout-box",!0),this.root.appendChild(f));
this.g=b;this.f=c;this.h=f;b=Pn(new Xr(this),this.root);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||a.innerHeight}Zr.prototype.zoom=function(a,b,c){x(this.g,"width",a*c+"px");x(this.g,"height",b*c+"px");x(this.f,"width",a+"px");x(this.f,"height",b+"px");x(this.f,"transform","scale("+c+")")};var ap="min-content inline size",Sn="fit-content inline size";
function Rn(a,b,c){function d(c){return Pn(a,b).getPropertyValue(c)}function e(){x(b,"display","block");x(b,"position","static");return d(la)}function f(){x(b,"display","inline-block");x(E,la,"99999999px");var a=d(la);x(E,la,"");return a}function g(){x(b,"display","inline-block");x(E,la,"0");var a=d(la);x(E,la,"");return a}function h(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function l(){throw Error("Getting fill-available block size is not implemented");}
var k=b.style.display,m=b.style.position,p=b.style.width,q=b.style.maxWidth,r=b.style.minWidth,z=b.style.height,u=b.style.maxHeight,A=b.style.minHeight,H=b.parentNode,E=b.ownerDocument.createElement("div");x(E,"position",m);H.insertBefore(E,b);E.appendChild(b);x(b,"width","auto");x(b,"max-width","none");x(b,"min-width","0");x(b,"height","auto");x(b,"max-height","none");x(b,"min-height","0");var K=Na("writing-mode"),K=(K?d(K[0]):null)||d("writing-mode"),I="vertical-rl"===K||"tb-rl"===K||"vertical-lr"===
K||"tb-lr"===K,la=I?"height":"width",Ca=I?"width":"height",Da={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=f();break;case ap:c=g();break;case Sn:c=h();break;case "fill-available block size":c=l();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(Ca);break;case "fill-available width":c=I?l():e();break;case "fill-available height":c=I?e():l();break;case "max-content width":c=
I?d(Ca):f();break;case "max-content height":c=I?f():d(Ca);break;case "min-content width":c=I?d(Ca):g();break;case "min-content height":c=I?g():d(Ca);break;case "fit-content width":c=I?d(Ca):h();break;case "fit-content height":c=I?h():d(Ca)}Da[a]=parseFloat(c);x(b,"position",m);x(b,"display",k)});x(b,"width",p);x(b,"max-width",q);x(b,"min-width",r);x(b,"height",z);x(b,"max-height",u);x(b,"min-height",A);H.insertBefore(b,E);H.removeChild(E);return Da};function $r(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===Ud||b!==Vd&&a!==Md?"ltr":"rtl"}
var as={a5:{width:new F(148,"mm"),height:new F(210,"mm")},a4:{width:new F(210,"mm"),height:new F(297,"mm")},a3:{width:new F(297,"mm"),height:new F(420,"mm")},b5:{width:new F(176,"mm"),height:new F(250,"mm")},b4:{width:new F(250,"mm"),height:new F(353,"mm")},"jis-b5":{width:new F(182,"mm"),height:new F(257,"mm")},"jis-b4":{width:new F(257,"mm"),height:new F(364,"mm")},letter:{width:new F(8.5,"in"),height:new F(11,"in")},legal:{width:new F(8.5,"in"),height:new F(14,"in")},ledger:{width:new F(11,"in"),
height:new F(17,"in")}},bs=new F(.24,"pt"),cs=new F(3,"mm"),ds=new F(10,"mm"),es=new F(13,"mm");
function fs(a){var b={width:Zd,height:$d,Yb:ae,Zb:ae},c=a.size;if(c&&c.value!==Yc){var d=c.value;d.Sd()?(c=d.values[0],d=d.values[1]):(c=d,d=null);if(c.xc())b.width=c,b.height=d||c;else if(c=as[c.name.toLowerCase()])d&&d===xd?(b.width=c.height,b.height=c.width):(b.width=c.width,b.height=c.height)}(c=a.marks)&&c.value!==J&&(b.Zb=es);a=a.bleed;a&&a.value!==Yc?a.value&&a.value.xc()&&(b.Yb=a.value):c&&(a=!1,c.value.Sd()?a=c.value.values.some(function(a){return a===id}):a=c.value===id,a&&(b.Yb=new F(6,
"pt")));return b}function gs(a,b){var c={},d=a.Yb.L*Rb(b,a.Yb.ka,!1),e=a.Zb.L*Rb(b,a.Zb.ka,!1),f=d+e,g=a.width;c.hc=g===Zd?b.$.sc?b.$.sc.width*Rb(b,"px",!1):(b.$.ub?Math.floor(b.wb/2)-b.$.Ac:b.wb)-2*f:g.L*Rb(b,g.ka,!1);g=a.height;c.gc=g===$d?b.$.sc?b.$.sc.height*Rb(b,"px",!1):b.Mb-2*f:g.L*Rb(b,g.ka,!1);c.Yb=d;c.Zb=e;c.pe=f;return c}function hs(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position="absolute";return a}
function is(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg",c||"polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a}var js={kh:"top left",lh:"top right",Xg:"bottom left",Yg:"bottom right"};
function ks(a,b,c,d,e,f){var g=d;g<=e+2*Nb.mm&&(g=e+d/2);var h=Math.max(d,g),l=e+h+c/2,k=hs(a,l,l),g=[[0,e+d],[d,e+d],[d,e+d-g]];d=g.map(function(a){return[a[1],a[0]]});if("top right"===b||"bottom right"===b)g=g.map(function(a){return[e+h-a[0],a[1]]}),d=d.map(function(a){return[e+h-a[0],a[1]]});if("bottom left"===b||"bottom right"===b)g=g.map(function(a){return[a[0],e+h-a[1]]}),d=d.map(function(a){return[a[0],e+h-a[1]]});l=is(a,c);l.setAttribute("points",g.map(function(a){return a.join(",")}).join(" "));
k.appendChild(l);a=is(a,c);a.setAttribute("points",d.map(function(a){return a.join(",")}).join(" "));k.appendChild(a);b.split(" ").forEach(function(a){k.style[a]=f+"px"});return k}var ls={jh:"top",Wg:"bottom",pg:"left",qg:"right"};
function ms(a,b,c,d,e){var f=2*d,g;"top"===b||"bottom"===b?(g=f,f=d):g=d;var h=hs(a,g,f),l=is(a,c);l.setAttribute("points","0,"+f/2+" "+g+","+f/2);h.appendChild(l);l=is(a,c);l.setAttribute("points",g/2+",0 "+g/2+","+f);h.appendChild(l);a=is(a,c,"circle");a.setAttribute("cx",g/2);a.setAttribute("cy",f/2);a.setAttribute("r",d/4);h.appendChild(a);var k;switch(b){case "top":k="bottom";break;case "bottom":k="top";break;case "left":k="right";break;case "right":k="left"}Object.keys(ls).forEach(function(a){a=
ls[a];a===b?h.style[a]=e+"px":a!==k&&(h.style[a]="0",h.style["margin-"+a]="auto")});return h}function ns(a,b,c,d){var e=!1,f=!1;if(a=a.marks)a=a.value,a.Sd()?a.values.forEach(function(a){a===id?e=!0:a===jd&&(f=!0)}):a===id?e=!0:a===jd&&(f=!0);if(e||f){var g=c.I,h=g.ownerDocument,l=b.Yb,k=Uc(bs,d),m=Uc(cs,d),p=Uc(ds,d);e&&Object.keys(js).forEach(function(a){a=ks(h,js[a],k,p,l,m);g.appendChild(a)});f&&Object.keys(ls).forEach(function(a){a=ms(h,ls[a],k,p,m);g.appendChild(a)})}}
var os=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),ps={"top-left-corner":{order:1,Wa:!0,Ta:!1,Ua:!0,Va:!0,Da:null},"top-left":{order:2,
Wa:!0,Ta:!1,Ua:!1,Va:!1,Da:"start"},"top-center":{order:3,Wa:!0,Ta:!1,Ua:!1,Va:!1,Da:"center"},"top-right":{order:4,Wa:!0,Ta:!1,Ua:!1,Va:!1,Da:"end"},"top-right-corner":{order:5,Wa:!0,Ta:!1,Ua:!1,Va:!0,Da:null},"right-top":{order:6,Wa:!1,Ta:!1,Ua:!1,Va:!0,Da:"start"},"right-middle":{order:7,Wa:!1,Ta:!1,Ua:!1,Va:!0,Da:"center"},"right-bottom":{order:8,Wa:!1,Ta:!1,Ua:!1,Va:!0,Da:"end"},"bottom-right-corner":{order:9,Wa:!1,Ta:!0,Ua:!1,Va:!0,Da:null},"bottom-right":{order:10,Wa:!1,Ta:!0,Ua:!1,Va:!1,Da:"end"},
"bottom-center":{order:11,Wa:!1,Ta:!0,Ua:!1,Va:!1,Da:"center"},"bottom-left":{order:12,Wa:!1,Ta:!0,Ua:!1,Va:!1,Da:"start"},"bottom-left-corner":{order:13,Wa:!1,Ta:!0,Ua:!0,Va:!1,Da:null},"left-bottom":{order:14,Wa:!1,Ta:!1,Ua:!0,Va:!1,Da:"end"},"left-middle":{order:15,Wa:!1,Ta:!1,Ua:!0,Va:!1,Da:"center"},"left-top":{order:16,Wa:!1,Ta:!1,Ua:!0,Va:!1,Da:"start"}},qs=Object.keys(ps).sort(function(a,b){return ps[a].order-ps[b].order});
function rs(a,b,c){oq.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=fs(c);new ss(this.f,this,c,a);this.A={};ts(this,c);this.b.position=new V(Gd,0);this.b.width=new V(a.width,0);this.b.height=new V(a.height,0);for(var d in c)os[d]||"background-clip"===d||(this.b[d]=c[d])}v(rs,oq);function ts(a,b){var c=b._marginBoxes;c&&qs.forEach(function(d){c[d]&&(a.A[d]=new us(a.f,a,d,b))})}rs.prototype.h=function(a){return new vs(a,this)};
function ss(a,b,c,d){sq.call(this,a,null,null,[],b);this.D=d;this.b["z-index"]=new V(new Qc(0),0);this.b["flow-from"]=new V(D("body"),0);this.b.position=new V(Vc,0);this.b.overflow=new V(Wd,0);for(var e in os)os.hasOwnProperty(e)&&(this.b[e]=c[e])}v(ss,sq);ss.prototype.h=function(a){return new ws(a,this)};
function us(a,b,c,d){sq.call(this,a,null,null,[],b);this.u=c;a=d._marginBoxes[this.u];for(var e in d)if(b=d[e],c=a[e],Fh[e]||c&&c.value===sd)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==sd&&(this.b[e]=b)}v(us,sq);us.prototype.h=function(a){return new xs(a,this)};function vs(a,b){pq.call(this,a,b);this.u=null;this.ta={}}v(vs,pq);
vs.prototype.l=function(a,b){var c=this.J,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}pq.prototype.l.call(this,a,b)};vs.prototype.ze=function(){var a=this.style;a.left=ae;a["margin-left"]=ae;a["border-left-width"]=ae;a["padding-left"]=ae;a["padding-right"]=ae;a["border-right-width"]=ae;a["margin-right"]=ae;a.right=ae};
vs.prototype.Ae=function(){var a=this.style;a.top=new F(-1,"px");a["margin-top"]=ae;a["border-top-width"]=ae;a["padding-top"]=ae;a["padding-bottom"]=ae;a["border-bottom-width"]=ae;a["margin-bottom"]=ae;a.bottom=ae};vs.prototype.ca=function(a,b,c){b=b.H;var d={start:this.u.marginLeft,end:this.u.marginRight,va:this.u.Jc},e={start:this.u.marginTop,end:this.u.marginBottom,va:this.u.Ic};ys(this,b.top,!0,d,a,c);ys(this,b.bottom,!0,d,a,c);ys(this,b.left,!1,e,a,c);ys(this,b.right,!1,e,a,c)};
function zs(a,b,c,d,e){this.I=a;this.A=e;this.j=c;this.u=!Y(d,b[c?"width":"height"],new tc(d,0,"px"));this.size=null}zs.prototype.b=function(){return this.u};function As(a){a.size||(a.size=Rn(a.A,a.I.element,a.j?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.size}zs.prototype.g=function(){var a=As(this);return this.j?tl(this.I)+a["max-content width"]+ul(this.I):rl(this.I)+a["max-content height"]+sl(this.I)};
zs.prototype.h=function(){var a=As(this);return this.j?tl(this.I)+a["min-content width"]+ul(this.I):rl(this.I)+a["min-content height"]+sl(this.I)};zs.prototype.f=function(){return this.j?tl(this.I)+this.I.width+ul(this.I):rl(this.I)+this.I.height+sl(this.I)};function Bs(a){this.j=a}Bs.prototype.b=function(){return this.j.some(function(a){return a.b()})};Bs.prototype.g=function(){var a=this.j.map(function(a){return a.g()});return Math.max.apply(null,a)*a.length};
Bs.prototype.h=function(){var a=this.j.map(function(a){return a.h()});return Math.max.apply(null,a)*a.length};Bs.prototype.f=function(){var a=this.j.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};function Cs(a,b,c,d,e,f){zs.call(this,a,b,c,d,e);this.l=f}v(Cs,zs);Cs.prototype.b=function(){return!1};Cs.prototype.g=function(){return this.f()};Cs.prototype.h=function(){return this.f()};Cs.prototype.f=function(){return this.j?tl(this.I)+this.l+ul(this.I):rl(this.I)+this.l+sl(this.I)};
function ys(a,b,c,d,e,f){var g=a.f.f,h={},l={},k={},m;for(m in b){var p=ps[m];if(p){var q=b[m],r=a.ta[m],z=new zs(q,r.style,c,g,f);h[p.Da]=q;l[p.Da]=r;k[p.Da]=z}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.va.evaluate(e);var u=Ds(k,b),A=!1,H={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"max-width":"max-height"],d.va);b&&(b=b.evaluate(e),u[a]>b&&(b=k[a]=new Cs(h[a],l[a].style,c,g,f,b),H[a]=b.f(),A=!0))});A&&(u=Ds(k,b),A=!1,["start","center","end"].forEach(function(a){u[a]=H[a]||u[a]}));
var E={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"min-width":"min-height"],d.va);b&&(b=b.evaluate(e),u[a]<b&&(b=k[a]=new Cs(h[a],l[a].style,c,g,f,b),E[a]=b.f(),A=!0))});A&&(u=Ds(k,b),["start","center","end"].forEach(function(a){u[a]=E[a]||u[a]}));var K=a+b,I=a+(a+b);["start","center","end"].forEach(function(a){var b=u[a];if(b){var d=h[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(I-b)/2;break;case "end":e=K-b}c?yl(d,e,b-tl(d)-ul(d)):xl(d,e,b-rl(d)-sl(d))}})}
function Ds(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=Es(d,g.length?new Bs(g):null,b);g.Ab&&(f.center=g.Ab);d=g.Ab||d.f();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=Es(c,e,b),c.Ab&&(f.start=c.Ab),c.Ad&&(f.end=c.Ad);return f}
function Es(a,b,c){var d={Ab:null,Ad:null};if(a&&b)if(a.b()&&b.b()){var e=a.g(),f=b.g();0<e&&0<f?(f=e+f,f<c?d.Ab=c*e/f:(a=a.h(),b=b.h(),b=a+b,b<c?d.Ab=a+(c-b)*(e-a)/(f-b):0<b&&(d.Ab=c*a/b)),0<d.Ab&&(d.Ad=c-d.Ab)):0<e?d.Ab=c:0<f&&(d.Ad=c)}else a.b()?d.Ab=Math.max(c-b.f(),0):b.b()&&(d.Ad=Math.max(c-a.f(),0));else a?a.b()&&(d.Ab=c):b&&b.b()&&(d.Ad=c);return d}vs.prototype.ic=function(a,b,c,d,e){vs.ng.ic.call(this,a,b,c,d,e);b.element.setAttribute("data-vivliostyle-page-box",!0)};
function ws(a,b){tq.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.Ic=this.Jc=null}v(ws,tq);
ws.prototype.l=function(a,b){var c=this.J,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);tq.prototype.l.call(this,a,b);d=this.g;c={Jc:this.Jc,Ic:this.Ic,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.u=c;d=d.style;d.width=new G(c.Jc);d.height=new G(c.Ic);d["padding-left"]=new G(c.marginLeft);d["padding-right"]=new G(c.marginRight);d["padding-top"]=new G(c.marginTop);
d["padding-bottom"]=new G(c.marginBottom)};ws.prototype.ze=function(){var a=Fs(this,{start:"left",end:"right",va:"width"});this.Jc=a.Gf;this.marginLeft=a.Zf;this.marginRight=a.Yf};ws.prototype.Ae=function(){var a=Fs(this,{start:"top",end:"bottom",va:"height"});this.Ic=a.Gf;this.marginTop=a.Zf;this.marginBottom=a.Yf};
function Fs(a,b){var c=a.style,d=a.f.f,e=b.start,f=b.end,g=b.va,h=a.f.D[g].Aa(d,null),l=Y(d,c[g],h),k=Y(d,c["margin-"+e],h),m=Y(d,c["margin-"+f],h),p=uq(d,c["padding-"+e],h),q=uq(d,c["padding-"+f],h),r=wq(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),z=wq(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),u=B(d,h,y(d,y(d,r,p),y(d,z,q)));l?(u=B(d,u,l),k||m?k?m=B(d,u,k):k=B(d,u,m):m=k=Bc(d,u,new Hb(d,.5))):(k||(k=d.b),m||(m=d.b),l=B(d,u,y(d,k,m)));c[e]=new G(k);c[f]=new G(m);c["margin-"+e]=
ae;c["margin-"+f]=ae;c["padding-"+e]=new G(p);c["padding-"+f]=new G(q);c["border-"+e+"-width"]=new G(r);c["border-"+f+"-width"]=new G(z);c[g]=new G(l);c["max-"+g]=new G(l);return{Gf:B(d,h,y(d,k,m)),Zf:k,Yf:m}}ws.prototype.ic=function(a,b,c,d,e){tq.prototype.ic.call(this,a,b,c,d,e);c.D=b.element;a.ca=parseFloat(c.D.style.width);a.Z=parseFloat(c.D.style.height)};function xs(a,b){tq.call(this,a,b);var c=b.u;this.u=ps[c];a.ta[c]=this;this.ua=!0}v(xs,tq);n=xs.prototype;
n.ic=function(a,b,c,d,e){var f=b.element;x(f,"display","flex");var g=Gq(this,a,"vertical-align"),h=null;g===D("middle")?h="center":g===D("top")?h="flex-start":g===D("bottom")&&(h="flex-end");h&&(x(f,"flex-flow",this.b?"row":"column"),x(f,"justify-content",h));tq.prototype.ic.call(this,a,b,c,d,e)};
n.Da=function(a,b){var c=this.style,d=this.f.f,e=a.start,f=a.end,g="left"===e,h=g?b.Jc:b.Ic,l=Y(d,c[a.va],h),g=g?b.marginLeft:b.marginTop;if("start"===this.u.Da)c[e]=new G(g);else if(l){var k=uq(d,c["margin-"+e],h),m=uq(d,c["margin-"+f],h),p=uq(d,c["padding-"+e],h),q=uq(d,c["padding-"+f],h),r=wq(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),f=wq(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),l=y(d,l,y(d,y(d,p,q),y(d,y(d,r,f),y(d,k,m))));switch(this.u.Da){case "center":c[e]=new G(y(d,
g,Cc(d,B(d,h,l),new Hb(d,2))));break;case "end":c[e]=new G(B(d,y(d,g,h),l))}}};
function Gs(a,b,c){function d(a){if(u)return u;u={va:z?z.evaluate(a):null,rb:l?l.evaluate(a):null,sb:k?k.evaluate(a):null};var b=h.evaluate(a),c=0;[q,m,p,r].forEach(function(b){b&&(c+=b.evaluate(a))});(null===u.rb||null===u.sb)&&c+u.va+u.rb+u.sb>b&&(null===u.rb&&(u.rb=0),null===u.sb&&(u.qh=0));null!==u.va&&null!==u.rb&&null!==u.sb&&(u.sb=null);null===u.va&&null!==u.rb&&null!==u.sb?u.va=b-c-u.rb-u.sb:null!==u.va&&null===u.rb&&null!==u.sb?u.rb=b-c-u.va-u.sb:null!==u.va&&null!==u.rb&&null===u.sb?u.sb=
b-c-u.va-u.rb:null===u.va?(u.rb=u.sb=0,u.va=b-c):u.rb=u.sb=(b-c-u.va)/2;return u}var e=a.style;a=a.f.f;var f=b.Ce,g=b.Je;b=b.va;var h=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],l=vq(a,e["margin-"+f],h),k=vq(a,e["margin-"+g],h),m=uq(a,e["padding-"+f],h),p=uq(a,e["padding-"+g],h),q=wq(a,e["border-"+f+"-width"],e["border-"+f+"-style"],h),r=wq(a,e["border-"+g+"-width"],e["border-"+g+"-style"],h),z=Y(a,e[b],h),u=null;e[b]=new G(new Jb(a,function(){var a=d(this).va;return null===a?0:a},b));e["margin-"+
f]=new G(new Jb(a,function(){var a=d(this).rb;return null===a?0:a},"margin-"+f));e["margin-"+g]=new G(new Jb(a,function(){var a=d(this).sb;return null===a?0:a},"margin-"+g));"left"===f?e.left=new G(y(a,c.marginLeft,c.Jc)):"top"===f&&(e.top=new G(y(a,c.marginTop,c.Ic)))}n.ze=function(){var a=this.g.u;this.u.Ua?Gs(this,{Ce:"right",Je:"left",va:"width"},a):this.u.Va?Gs(this,{Ce:"left",Je:"right",va:"width"},a):this.Da({start:"left",end:"right",va:"width"},a)};
n.Ae=function(){var a=this.g.u;this.u.Wa?Gs(this,{Ce:"bottom",Je:"top",va:"height"},a):this.u.Ta?Gs(this,{Ce:"top",Je:"bottom",va:"height"},a):this.Da({start:"top",end:"bottom",va:"height"},a)};n.Od=function(a,b,c,d,e,f,g){tq.prototype.Od.call(this,a,b,c,d,e,f,g);a=c.H;c=this.f.u;d=this.u;d.Ua||d.Va?d.Wa||d.Ta||(d.Ua?a.left[c]=b:d.Va&&(a.right[c]=b)):d.Wa?a.top[c]=b:d.Ta&&(a.bottom[c]=b)};
function Hs(a,b,c,d,e){this.f=a;this.l=b;this.h=c;this.b=d;this.g=e;this.j={};a=this.l;b=new uc(a,"page-number");b=new mc(a,new sc(a,b,new Hb(a,2)),a.b);c=new cc(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===(this.b.H||$r(this.g))?(a.values["left-page"]=b,b=new cc(a,b),a.values["right-page"]=b):(c=new cc(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function Is(a){var b={};xj(a.f,[],"",b);Hj(a.f);return b}
function Js(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof V?""+e.value:Js(a,e);c.push(d+f+(e.cb||""))}return c.sort().join("^")}function Ks(a,b,c){c=c.clone({kc:"vivliostyle-page-rule-master"});var d=c.b,e=b.size;if(e){var f=fs(b),e=e.cb;d.width=Wh(a.b,d.width,new V(f.width,e));d.height=Wh(a.b,d.height,new V(f.height,e))}["counter-reset","counter-increment"].forEach(function(a){d[a]&&(b[a]=d[a])});c=c.h(a.h);c.l(a.f,a.g);Wq(c,a.b);return c}
function Ls(a){this.b=null;this.h=a}v(Ls,W);Ls.prototype.apply=function(a){a.Z===this.h&&this.b.apply(a)};Ls.prototype.f=function(){return 3};Ls.prototype.g=function(a){this.b&&ni(a.md,this.h,this.b);return!0};function Ms(a){this.b=null;this.h=a}v(Ms,W);Ms.prototype.apply=function(a){1===(new uc(this.h,"page-number")).evaluate(a.l)&&this.b.apply(a)};Ms.prototype.f=function(){return 2};function Ns(a){this.b=null;this.h=a}v(Ns,W);
Ns.prototype.apply=function(a){(new uc(this.h,"left-page")).evaluate(a.l)&&this.b.apply(a)};Ns.prototype.f=function(){return 1};function Os(a){this.b=null;this.h=a}v(Os,W);Os.prototype.apply=function(a){(new uc(this.h,"right-page")).evaluate(a.l)&&this.b.apply(a)};Os.prototype.f=function(){return 1};function Ps(a){this.b=null;this.h=a}v(Ps,W);Ps.prototype.apply=function(a){(new uc(this.h,"recto-page")).evaluate(a.l)&&this.b.apply(a)};Ps.prototype.f=function(){return 1};
function Qs(a){this.b=null;this.h=a}v(Qs,W);Qs.prototype.apply=function(a){(new uc(this.h,"verso-page")).evaluate(a.l)&&this.b.apply(a)};Qs.prototype.f=function(){return 1};function Rs(a,b){ki.call(this,a,b,null,null,null)}v(Rs,ki);Rs.prototype.apply=function(a){var b=a.l,c=a.F,d=this.style;a=this.ba;ci(b,c,d,a,null,null,null);if(d=d._marginBoxes){var c=$h(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);ci(b,f,d[e],a,null,null,null)}}};
function Ss(a,b,c,d,e){Jj.call(this,a,b,null,c,null,d,!1);this.R=e;this.H=[];this.g="";this.F=[]}v(Ss,Jj);n=Ss.prototype;n.Tc=function(){this.Tb()};n.Wb=function(a,b){if(this.g=b)this.b.push(new Ls(b)),this.ba+=65536};
n.od=function(a,b){b&&Jf(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.F.push(":"+a);switch(a.toLowerCase()){case "first":this.b.push(new Ms(this.f));this.ba+=256;break;case "left":this.b.push(new Ns(this.f));this.ba+=1;break;case "right":this.b.push(new Os(this.f));this.ba+=1;break;case "recto":this.b.push(new Ps(this.f));this.ba+=1;break;case "verso":this.b.push(new Qs(this.f));this.ba+=1;break;default:Jf(this,"E_INVALID_PAGE_SELECTOR :"+a)}};
function Ts(a){var b;a.g||a.F.length?b=[a.g].concat(a.F.sort()):b=null;a.H.push({rf:b,ba:a.ba});a.g="";a.F=[]}n.Qc=function(){Ts(this);Jj.prototype.Qc.call(this)};n.Ka=function(){Ts(this);Jj.prototype.Ka.call(this)};
n.Sb=function(a,b,c){if("bleed"!==a&&"marks"!==a||this.H.some(function(a){return!a.rf})){Jj.prototype.Sb.call(this,a,b,c);var d=this.mb[a],e=this.R;if("bleed"===a||"marks"===a)e[""]||(e[""]={}),Object.keys(e).forEach(function(b){Zh(e[b],a,d)});else if("size"===a){var f=e[""];this.H.forEach(function(b){var c=new V(d.value,d.cb+b.ba);b=b.rf?b.rf.join(""):"";var g=e[b];g?(c=(b=g[a])?Wh(null,c,b):c,Zh(g,a,c)):(g=e[b]={},Zh(g,a,c),f&&["bleed","marks"].forEach(function(a){f[a]&&Zh(g,a,f[a])},this))},this)}}};
n.Uf=function(a){ni(this.l.md,"*",a)};n.Xf=function(a){return new Rs(this.mb,a)};n.Pe=function(a){var b=$h(this.mb,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);Ff(this.oa,new Us(this.f,this.oa,this.A,c))};function Us(a,b,c,d){Gf.call(this,a,b,!1);this.g=c;this.b=d}v(Us,Hf);Us.prototype.Qb=function(a,b,c){Dh(this.g,a,b,c,this)};Us.prototype.hd=function(a,b){If(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Us.prototype.ee=function(a,b){If(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
Us.prototype.Sb=function(a,b,c){Zh(this.b,a,new V(b,c?Cf(this):Df(this)))};function Vs(a){if(1>=a.length)return!1;var b=a[a.length-1].h;return a.slice(0,a.length-1).every(function(a){return b>a.h})}function Ws(a,b){a.b?a.width=b:a.height=b}function Xs(a){return a.b?a.width:a.height}function Ys(a,b){this.kd=a;this.Rc=b}function Zs(a,b,c){this.b=a;this.F=b;this.A=c;this.f=Xs(a)}
function $s(a,b){var c=L("ColumnBalancer#balanceColumns");a.u(b);at(a,b);Bl(a.b);var d=[bt(a,b)];Ee(function(b){a.l(d)?(a.D(d),a.F().then(function(c){at(a,c);Bl(a.b);c?(d.push(bt(a,c)),P(b)):Q(b)})):Q(b)}).then(function(){var b=d.reduce(function(a,b){return b.Rc<a.Rc?b:a},d[0]);ct(a,b.kd);Ws(a.b,a.f);O(c,b.kd)});return c.result()}function bt(a,b){var c=a.j(b);return new Ys(b,c)}Zs.prototype.u=function(){};function at(a,b){var c=Gn(a.A);b&&(b.ug=c)}
function ct(a,b){var c=a.b.element;b.Eb.forEach(function(a){c.appendChild(a.element)});Hn(a.A,b.ug)}function dt(a){var b=a[a.length-1];if(!b.Rc||(a=a[a.length-2])&&b.Rc>=a.Rc)return!1;a=b.kd.Eb;b=Math.max.apply(null,a.map(function(a){return a.h}));a=Math.max.apply(null,a.map(function(a){return bo(a.l)}));return b>a+1}function et(a,b){var c=Math.max.apply(null,a[a.length-1].kd.Eb.map(function(a){return isNaN(a.jf)?a.h:a.h-a.jf+1}))-1;c<Xs(b)?Ws(b,c):Ws(b,Xs(b)-1)}
function ft(a,b,c,d){Zs.call(this,c,a,b);this.G=d;this.h=null;this.g=!1}v(ft,Zs);ft.prototype.u=function(a){var b=a.Eb.reduce(function(a,b){return a+b.h},0);Ws(this.b,b/this.G);this.h=a.position};function gt(a,b){return a.h?pl(a.h,b):!b}ft.prototype.j=function(a){if(!gt(this,a.position))return Infinity;a=a.Eb;return Vs(a)?Infinity:Math.max.apply(null,a.map(function(a){return a.h}))};
ft.prototype.l=function(a){if(1===a.length)return!0;if(this.g)return dt(a);a=a[a.length-1];return gt(this,a.kd.position)&&!Vs(a.kd.Eb)?this.g=!0:Xs(this.b)<this.f};ft.prototype.D=function(a){this.g?et(a,this.b):Ws(this.b,Math.min(this.f,Xs(this.b)+.1*this.f))};function ht(a,b,c){Zs.call(this,c,a,b)}v(ht,Zs);ht.prototype.j=function(a){if(a.Eb.every(function(a){return!a.h}))return Infinity;a=a.Eb.filter(function(a){return!a.g}).map(function(a){return a.h});return it(a)};ht.prototype.l=function(a){return dt(a)};
ht.prototype.D=function(a){et(a,this.b)};function jt(a,b,c,d,e,f,g){if(b===Yc)return null;f=f[f.length-1];f=!(!f||!f.g);return!g.b.length||f?new ft(c,d,e,a):b===$c?new ht(c,d,e):null};var kt=new Ge(function(){var a=L("uaStylesheetBase");Eh.get().then(function(b){var c=Aa("user-agent-base.css",za);b=new Jj(null,null,null,null,null,b,!0);b.Uc("UA");Ij=b.l;ig(c,b,null,null).La(a)});return a.result()},"uaStylesheetBaseFetcher");
function lt(a,b,c,d,e,f,g,h,l,k){this.F=a;this.f=b;this.b=c;this.g=d;this.D=e;this.l=f;this.H=a.R;this.u=g;this.h=h;this.j=l;this.A=k;this.G=a.l;Lb(this.b,function(a){var b=this.b,c;c=(c=b.b[a])?(c=c.b[0])?c.qa:null:null;var d;d=b.b[a];if(d=mt(this,d?d.g:"any"))d=(a=b.b[a])?0<a.b.length&&a.b[0].qa.f<=this.D:!1;return d&&!!c&&!nt(this,c)});Kb(this.b,new Jb(this.b,function(){return this.ta+this.b.page},"page-number"))}
function ot(a,b,c,d,e){if(a.j.length){var f=new Pb(0,b,c,d);a=a.j;for(var g={},h=0;h<a.length;h++)ci(f,g,a[h],0,null,null,null);h=g.width;a=g.height;var l=g["text-zoom"];if(h&&a||l)if(g=Nb.em,(l?l.evaluate(f,"text-zoom"):null)===Jd&&(l=g/d,d=g,b*=l,c*=l),h&&a&&(h=Uc(h.evaluate(f,"width"),f),f=Uc(a.evaluate(f,"height"),f),0<h&&0<f))return{width:e&&e.ub?2*(h+e.Ac):h,height:f,fontSize:d}}return{width:b,height:c,fontSize:d}}
function pt(a,b,c,d,e,f,g,h,l,k,m,p){Pb.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.da=b;this.lang=b.lang||c;this.viewport=d;this.l={body:!0};this.g=e;this.A=this.b=this.N=this.f=this.F=null;this.D=0;this.Lb=f;this.j=new tm(this.style.H);this.fb={};this.sa=null;this.h=m;this.Ib=new cn(null,null,null,null,null,null,null);this.la={};this.H=p||null;this.Bb=g;this.Kb=h;this.ta=l;this.Jb=k;for(var q in a.h)(b=a.h[q]["flow-consume"])&&(b.evaluate(this,"flow-consume")==Wc?this.l[q]=!0:delete this.l[q]);
this.ob={};this.Ba=this.ua=0}v(pt,Pb);
function qt(a){var b=L("StyleInstance.init"),c=new Qp(a.h,a.da.url),d=new Rp(a.h,a.da.url,a.style.f,a.style.b);a.f=new am(a.da,a.style.g,a.style.f,a,a.l,a.style.G,c,d);d.h=a.f;km(a.f,a);a.N={};a.N[a.da.url]=a.f;var e=hm(a.f);a.H||(a.H=$r(e));a.F=new Xq(a.style.D);c=new rj(a.style.g,a,c,d);a.F.l(c,e);Wq(a.F,a);a.sa=new Hs(c,a.style.b,a.F,a,e);e=[];c=t(a.style.l);for(d=c.next();!d.done;d=c.next())if(d=d.value,!d.ia||d.ia.evaluate(a))d=qm(d.Bc,a),d=new rm(d),e.push(d);zm(a.Lb,e,a.j).La(b);var f=a.style.A;
Object.keys(f).forEach(function(a){var b=gs(fs(f[a]),this);this.ob[a]={width:b.hc+2*b.pe,height:b.gc+2*b.pe}},a);return b.result()}function lm(a,b,c){if(a=a.b)a.f[b.b]||(a.f[b.b]=c),c=a.b[b.b],c||(c=new ml,a.b[b.b]=c),c.b.push(new ll(new jl({pa:[{node:b.element,kb:Vk,wa:null,Ia:null,Fa:null,Sa:0}],na:0,K:!1,Qa:null}),b))}
function rt(a,b){for(var c=Number.POSITIVE_INFINITY,d=0;d<b.b.length;d++){for(var e=b.b[d].b.f,f=e.pa[0].node,g=e.na,h=e.K,l=0;f.ownerDocument!=a.da.b;)l++,f=e.pa[l].node,h=!1,g=0;e=hk(a.da,f,g,h);e<c&&(c=e)}return c}
function st(a,b,c){if(!b)return 0;var d=Number.POSITIVE_INFINITY,e;for(e in a.l){var f=b.b[e];if(!(c||f&&f.b.length)&&a.b){f=a.f;f.R=e;for(var g=0;null!=f.R&&(g+=5E3,im(f,g,0)!=Number.POSITIVE_INFINITY););f=a.b.b[e];b!=a.b&&f&&(f=f.clone(),b.b[e]=f)}f&&(f=rt(a,f),f<d&&(d=f))}return d}function mt(a,b){switch(b){case "left":case "right":case "recto":case "verso":return(new uc(a.style.b,b+"-page")).evaluate(a);default:return!0}}
function tt(a,b){var c=a.b,d=st(a,c);if(d==Number.POSITIVE_INFINITY)return null;for(var e=a.F.children,f,g=0;g<e.length;g++)if(f=e[g],"vivliostyle-page-rule-master"!==f.f.kc){var h=1,l=Gq(f,a,"utilization");l&&l.hf()&&(h=l.L);var l=Rb(a,"em",!1),k=a.hc()*a.gc();a.D=im(a.f,d,Math.ceil(h*k/(l*l)));h=a;l=void 0;for(l in c.b)if((k=c.b[l])&&0<k.b.length){var m=k.b[0].qa;if(rt(h,k)===m.f){a:switch(m=k.g,m){case "left":case "right":case "recto":case "verso":break a;default:m=null}k.g=Bm(Sl(m,k.b[0].qa.g))}}a.A=
c.clone();h=a;l=h.b.page;k=void 0;for(k in h.b.b)for(var m=h.b.b[k],p=m.b.length-1;0<=p;p--){var q=m.b[p];0>q.qa.yb&&q.qa.f<h.D&&(q.qa.yb=l)}Qb(a,a.style.b);h=Gq(f,a,"enabled");if(!h||h===Xd){c=a;w.debug("Location - page",c.b.page);w.debug("  current:",d);w.debug("  lookup:",c.D);d=void 0;for(d in c.b.b)for(e=t(c.b.b[d].b),g=e.next();!g.done;g=e.next())w.debug("  Chunk",d+":",g.value.qa.f);d=a.sa;e=f;f=b;c=e.f;Object.keys(f).length?(e=c,g=Js(d,f),e=e.j+"^"+g,g=d.j[e],g||("background-host"===c.kc?
(c=d,f=(new rs(c.l,c.h.f,f)).h(c.h),f.l(c.f,c.g),Wq(f,c.b),g=f):g=Ks(d,f,c),d.j[e]=g),f=g.f,f.f.g=f,f=g):(c.f.g=c,f=e);return f}}throw Error("No enabled page masters");}function nt(a,b){var c=a.A.f,d=c[b.b].f;if(d){var e=b.f,f=c[d].b;if(!f.length||e<f[0])return!1;var c=Ya(f.length,function(a){return f[a]>e})-1,c=f[c],d=a.A.b[d],g=rt(a,d);return c<g?!1:g<c?!0:!mt(a,d.g)}return!1}function ut(a,b,c){a=a.b.f[c];a.C||(a.C=new vo(null));b.kf=a.C}
function vt(a){var b=a.l,c=wn(b),d=L("layoutDeferredPageFloats"),e=!1,f=0;Ee(function(d){if(f===c.length)Q(d);else{var g=c[f++],l=g.ja,k=ln(l),m=k.xf(l,b);m&&an(m,l)?P(d):mn(b,l)||yn(b,l)?(xn(b,g),Q(d)):Xo(a,g,k,null,m).then(function(a){a?(a=In(b.parent))?Q(d):(In(b)&&!a&&(e=!0,b.Oc=!1),P(d)):Q(d)})}}).then(function(){e&&on(b);O(d,!0)});return d.result()}
function wt(a,b,c){var d=a.b.b[c];if(!d||!mt(a,d.g))return M(!0);d.g="any";ut(a,b,c);Vo(b);a.l[c]&&0<b.Jb.length&&(b.Kb=!1);var e=L("layoutColumn");vt(b).then(function(){if(In(b.l))O(e,!0);else{var f=[],g=[],h=!0;Ee(function(e){if(!sn(b.l,c))for(var k={};0<d.b.length-g.length;){for(k.index=0;g.includes(k.index);)k.index++;k.selected=d.b[k.index];if(k.selected.qa.f>a.D||nt(a,k.selected.qa))break;for(var l=k.index+1;l<d.b.length;l++)if(!g.includes(l)){var p=d.b[l];if(p.qa.f>a.D||nt(a,p.qa))break;Ok(p.qa,
k.selected.qa)&&(k.selected=p,k.index=l)}k.qa=k.selected.qa;k.Oa=!0;Lm(b,k.selected.b,h,d.f).then(function(a){return function(c){if(In(b.l))Q(e);else if(h=!1,a.selected.qa.u&&(null===c||a.qa.h)&&f.push(a.index),a.qa.h)g.push(a.index),Q(e);else{var k=!!c||!!b.g,l;0<zn(b.l).length&&b.wb?c?(l=c.clone(),l.f=b.wb):l=new jl(b.wb):l=null;if(b.g&&l)a.selected.b=l,d.f=b.g,b.g=null;else{g.push(a.index);if(c||l)a.selected.b=c||l,f.push(a.index);b.g&&(d.g=Bm(b.g))}k?Q(e):(b.Kb=!1,a.Oa?a.Oa=!1:P(e))}}}(k));if(k.Oa){k.Oa=
!1;return}k={selected:k.selected,qa:k.qa,index:k.index,Oa:k.Oa}}Q(e)}).then(function(){if(!In(b.l)){d.b=d.b.filter(function(a,b){return f.includes(b)||!g.includes(b)});"column"===d.f&&(d.f=null);Gp(b);var a=Vn(b.l);So(b,a)}O(e,!0)})}});return e.result()}
function xt(a,b,c,d,e,f,g,h,l,k,m,p,q,r,z){var u=b.b?b.j&&b.N:b.h&&b.R,A=f.element,H=new cn(l,"column",null,h,null,null,null),E=a.b.clone(),K=L("createAndLayoutColumn"),I;Ee(function(b){var K=new lo([new gq(a.h,a.b.page-1)].concat(Zn(H)));if(1<k){var la=a.viewport.b.createElement("div");x(la,"position","absolute");A.appendChild(la);I=new Jm(la,r,a.g,K,H);I.Kb=z;I.b=f.b;I.Mb=f.Mb;I.Pd=f.Pd;f.b?(K=g*(p+m)+f.J,yl(I,f.H,f.width),xl(I,K,p)):(K=g*(p+m)+f.H,xl(I,f.J,f.height),yl(I,K,p));I.F=c;I.G=d}else I=
new Jm(A,r,a.g,K,H),wl(I,f);I.ob=u?[]:e.concat();I.Lb=q;gn(H,I);0<=I.width?wt(a,I,h).then(function(){In(H)||En(H);In(I.l)&&!In(l)?(I.l.Oc=!1,a.b=E.clone(),I.element!==A&&A.removeChild(I.element),P(b)):Q(b)}):(En(H),Q(b))}).then(function(){O(K,I)});return K.result()}function yt(a,b,c,d,e){var f=Gq(c,a,"writing-mode")||null;a=Gq(c,a,"direction")||null;return new cn(b,"region",d,e,null,f,a)}
function zt(a,b,c,d,e,f,g,h,l,k){function m(){p.b=q.clone();return At(p,b,c,d,e,f,g,r,h,l,k,z).ea(function(a){return a?M({Eb:a,position:p.b}):M(null)})}var p=a,q=p.b.clone(),r=yt(p,g,c,h,l),z=!0;return m().ea(function(a){if(!a)return M(null);if(1>=k)return M(a.Eb);var b=Gq(c,p,"column-fill")||Zc,b=jt(k,b,m,r,h,a.Eb,p.b.b[l]);if(!b)return M(a.Eb);z=!1;g.g=!0;r.g=!0;return $s(b,a).ea(function(a){g.g=!1;g.Oc=!1;r.g=!1;p.b=a.position;return M(a.Eb)})})}
function At(a,b,c,d,e,f,g,h,l,k,m,p){var q=L("layoutFlowColumns"),r=a.b.clone(),z=Z(c,a,"column-gap"),u=1<m?Z(c,a,"column-width"):l.width,A=Fq(c,a),H=Gq(c,a,"shape-inside"),E=Qg(H,0,0,l.width,l.height,a),K=new qr(k,a,a.viewport,a.f,A,a.da,a.j,a.style.u,a,b,a.Bb,a.Kb,a.Jb),I=0,la=null,Ca=[];Ee(function(b){xt(a,c,d,e,f,l,I++,k,h,m,z,u,E,K,p).then(function(c){In(g)?(Ca=null,Q(b)):((c.g&&"column"!==c.g||I===m)&&!In(h)&&En(h),In(h)?(I=0,a.b=r.clone(),h.Oc=!1,h.g?(Ca=null,Q(b)):P(b)):(la=c,Ca[I-1]=la,la.g&&
"column"!=la.g&&(I=m,"region"!=la.g&&(a.la[k]=!0)),I<m?P(b):Q(b)))})}).then(function(){O(q,Ca)});return q.result()}
function Bt(a,b,c,d,e,f,g,h){zq(c);var l=Gq(c,a,"enabled");if(l&&l!==Xd)return M(!0);var k=L("layoutContainer"),m=Gq(c,a,"wrap-flow")===Yc,l=Gq(c,a,"flow-from"),p=a.viewport.b.createElement("div"),q=Gq(c,a,"position");x(p,"position",q?q.name:"absolute");d.insertBefore(p,d.firstChild);var r=new ql(p);r.b=c.b;r.ob=g;c.ic(a,r,b,a.j,a.g);r.F=e;r.G=f;e+=r.left+r.marginLeft+r.Z;f+=r.top+r.marginTop+r.ca;(c instanceof ws||c instanceof pq&&!(c instanceof vs))&&gn(h,r);var z=!1;if(l&&l.Vf())if(a.la[l.toString()])In(h)||
c.Od(a,r,b,null,1,a.g,a.j),l=M(!0);else{var u=L("layoutContainer.inner"),A=l.toString(),H=Z(c,a,"column-count");zt(a,b,c,e,f,g,h,r,A,H).then(function(d){if(!In(h)){var e=d[0];e.element===p&&(r=e);r.h=Math.max.apply(null,d.map(function(a){return a.h}));c.Od(a,r,b,e,H,a.g,a.j);(d=a.b.b[A])&&"region"===d.f&&(d.f=null)}O(u,!0)});l=u.result()}else{if((l=Gq(c,a,"content"))&&Gl(l)){q="span";l.url&&(q="img");var E=a.viewport.b.createElement(q);l.fa(new Fl(E,a,l,eq(a.h)));p.appendChild(E);"img"==q&&Vq(c,a,
E,a.j);Uq(c,a,r,a.j)}else c.ua&&(d.removeChild(p),z=!0);z||c.Od(a,r,b,null,1,a.g,a.j);l=M(!0)}l.then(function(){if(In(h))O(k,!0);else{if(!c.h||0<Math.floor(r.h)){if(!z&&!m){var l=Gq(c,a,"shape-outside"),l=Dl(r,l,a);g.push(l)}}else if(!c.children.length){d.removeChild(p);O(k,!0);return}var q=c.children.length-1;De(function(){for(;0<=q;){var d=c.children[q--],d=Bt(a,b,d,p,e,f,g,h);if(d.Xa())return d.ea(function(){return M(!In(h))});if(In(h))break}return M(!1)}).then(function(){O(k,!0)})}});return k.result()}
function Ct(a){var b=a.b.page,c;for(c in a.b.b)for(var d=a.b.b[c],e=d.b.length-1;0<=e;e--){var f=d.b[e];0<=f.qa.yb&&f.qa.yb+f.qa.l-1<=b&&d.b.splice(e,1)}}function Dt(a,b){for(var c in a.l){var d=b.b[c];if(d&&0<d.b.length)return!1}return!0}
function Et(a,b,c){var d=b.I===b.h;a.la={};c?(a.b=c.clone(),dm(a.f,c.g)):(a.b=new ol,dm(a.f,-1));a.lang&&b.h.setAttribute("lang",a.lang);c=a.b;c.page++;Qb(a,a.style.b);a.A=c.clone();var e=d?{}:Is(a.sa),f=tt(a,e);if(!f)return M(null);var g=0;if(!d){Fk(b,f.f.b.width.value===Zd);Gk(b,f.f.b.height.value===$d);a.h.j=b;$p(a.h,e,a);var h=gs(fs(e),a);Ft(a,h,b);ns(e,h,b,a);g=h.Zb+h.Yb}e=!d&&Gq(f,a,"writing-mode")||rd;a.G=e!=rd;var h=Gq(f,a,"direction")||Bd,l=new cn(a.Ib,"page",null,null,null,e,h),k=L("layoutNextPage");
Ee(function(c){Bt(a,b,f,b.h,g,g+1,[],l).then(function(){In(l)||En(l);In(l)?(a.b=a.A.clone(),l.Oc=!1,P(c)):Q(c)})}).then(function(){f.ca(a,b,a.g);if(!d){var e=new uc(f.f.f,"left-page");b.b=e.evaluate(a)?"left":"right";Ct(a);c=a.b;Object.keys(c.b).forEach(function(b){b=c.b[b];var d=b.f;!d||"page"!==d&&mt(a,d)||(b.f=null)})}a.b=a.A=null;c.g=a.f.b;Ik(b,a.style.F.N[a.da.url],a.g);Dt(a,c)&&(c=null);O(k,c)});return k.result()}
function Ft(a,b,c){a.Y=b.hc;a.R=b.gc;a.Ba=b.hc+2*b.pe;a.ua=b.gc+2*b.pe;c.I.style.width=a.Ba+"px";c.I.style.height=a.ua+"px";c.h.style.left=b.Zb+"px";c.h.style.right=b.Zb+"px";c.h.style.top=b.Zb+"px";c.h.style.bottom=b.Zb+"px";c.h.style.padding=b.Yb+"px";c.h.style.paddingTop=b.Yb+1+"px"}function Gt(a,b,c,d){Jj.call(this,a.j,a,b,c,d,a.h,!c);this.g=a;this.F=!1}v(Gt,Jj);n=Gt.prototype;n.be=function(){};
n.ae=function(a,b,c){a=new oq(this.g.u,a,b,c,this.g.G,this.ia,Df(this.oa));Ff(this.g,new br(a.f,this.g,a,this.A))};n.Dc=function(a){a=a.Kc;this.ia&&(a=Ac(this.f,this.ia,a));Ff(this.g,new Gt(this.g,a,this,this.G))};n.Yd=function(){Ff(this.g,new Pj(this.f,this.oa))};n.$d=function(){var a={};this.g.A.push({Bc:a,ia:this.ia});Ff(this.g,new Qj(this.f,this.oa,null,a,this.g.h))};n.Zd=function(a){var b=this.g.l[a];b||(b={},this.g.l[a]=b);Ff(this.g,new Qj(this.f,this.oa,null,b,this.g.h))};
n.de=function(){var a={};this.g.H.push(a);Ff(this.g,new Qj(this.f,this.oa,this.ia,a,this.g.h))};n.sd=function(a){var b=this.g.D;if(a){var c=$h(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}Ff(this.g,new Qj(this.f,this.oa,null,b,this.g.h))};n.ce=function(){this.F=!0;this.Tb()};n.Tc=function(){var a=new Ss(this.g.u,this.g,this,this.A,this.g.F);Ff(this.g,a);a.Tc()};
n.Ka=function(){Jj.prototype.Ka.call(this);if(this.F){this.F=!1;var a="R"+this.g.N++,b=D(a),c;this.ia?c=new Vh(b,0,this.ia):c=new V(b,0);bi(this.mb,"region-id").push(c);this.bc();a=new Gt(this.g,this.ia,this,a);Ff(this.g,a);a.Ka()}};
function Ht(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/);)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function It(a){Ef.call(this);this.h=a;this.j=new Gb(null);this.u=new Gb(this.j);this.G=new lq(this.j);this.J=new Gt(this,null,null,null);this.N=0;this.A=[];this.D={};this.l={};this.H=[];this.F={};this.b=this.J}v(It,Ef);
It.prototype.error=function(a){w.b("CSS parser:",a)};function Jt(a,b){return Kt(b,a)}function Lt(a){xf.call(this,Jt,"document");this.R=a;this.H={};this.u={};this.f={};this.N={};this.l=null;this.b=[];this.J=!1}v(Lt,xf);function Mt(a,b,c){Nt(a,b,c);var d=Aa("user-agent.xml",za),e=L("OPSDocStore.init");Eh.get().then(function(b){a.l=b;kt.get().then(function(){a.load(d).then(function(){a.J=!0;O(e,!0)})})});return e.result()}function Nt(a,b,c){a.b.splice(0);b&&b.forEach(a.Y,a);c&&c.forEach(a.Z,a)}
Lt.prototype.Y=function(a){var b=a.url;b&&(b=Aa(Ba(b),ya));this.b.push({url:b,text:a.text,qb:"Author",Pa:null,media:null})};Lt.prototype.Z=function(a){var b=a.url;b&&(b=Aa(Ba(b),ya));this.b.push({url:b,text:a.text,qb:"User",Pa:null,media:null})};
function Kt(a,b){var c=L("OPSDocStore.load"),d=b.url;pk(b,a).then(function(b){if(b){if(a.J)for(var e=ge("PREPROCESS_SINGLE_DOCUMENT"),g=0;g<e.length;g++)try{e[g](b.b)}catch(u){w.b("Error during single document preprocessing:",u)}for(var e=[],h=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),g=0;g<h.length;g++){var l=h[g],k=l.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=l.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=l.getAttribute("action"),
l=l.getAttribute("ref");k&&m&&p&&l&&e.push({Hg:k,event:m,action:p,qd:l})}a.N[d]=e;var q=[];q.push({url:Aa("user-agent-page.css",za),text:null,qb:"UA",Pa:null,media:null});if(g=b.l)for(g=g.firstChild;g;g=g.nextSibling)if(1==g.nodeType)if(e=g,h=e.namespaceURI,k=e.localName,"http://www.w3.org/1999/xhtml"==h)if("style"==k)h=e.getAttribute("class"),k=e.getAttribute("media"),m=e.getAttribute("title"),q.push({url:d,text:e.textContent,qb:"Author",Pa:m?h:null,media:k});else if("link"==k){if(m=e.getAttribute("rel"),
h=e.getAttribute("class"),k=e.getAttribute("media"),"stylesheet"==m||"alternate stylesheet"==m&&h)m=e.getAttribute("href"),m=Aa(m,d),e=e.getAttribute("title"),q.push({url:m,text:null,Pa:e?h:null,media:k,qb:"Author"})}else"meta"==k&&"viewport"==e.getAttribute("name")&&q.push({url:d,text:Ht(e),qb:"Author",Pa:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==h?"stylesheet"==k&&"text/css"==e.getAttribute("type")&&q.push({url:d,text:e.textContent,qb:"Author",Pa:null,media:null}):"http://example.com/sse"==
h&&"property"===k&&(h=e.getElementsByTagName("name")[0])&&"stylesheet"===h.textContent&&(e=e.getElementsByTagName("value")[0])&&(m=Aa(e.textContent,d),q.push({url:m,text:null,Pa:null,media:null,qb:"Author"}));for(g=0;g<a.b.length;g++)q.push(a.b[g]);for(var r="",g=0;g<q.length;g++)r+=q[g].url,r+="^",q[g].text&&(r+=q[g].text),r+="^";var z=a.H[r];z?(a.f[d]=z,O(c,b)):(g=a.u[r],g||(g=new Ge(function(){var b=L("fetchStylesheet"),c=0,d=new It(a.l);De(function(){if(c<q.length){var a=q[c++];d.Uc(a.qb);return null!==
a.text?jg(a.text,d,a.url,a.Pa,a.media).Fc(!0):ig(a.url,d,a.Pa,a.media)}return M(!1)}).then(function(){z=new lt(a,d.j,d.u,d.J.l,d.G,d.A,d.D,d.l,d.H,d.F);a.H[r]=z;delete a.u[r];O(b,z)});return b.result()},"FetchStylesheet "+d),a.u[r]=g,g.start()),g.get().then(function(e){a.f[d]=e;O(c,b)}))}else O(c,null)});return c.result()};function Ot(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function Pt(a){var b=new Qa;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(Ot(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],h=
b[2],l=b[3],k=b[4],m;for(d=0;80>d;d++)m=20>d?(g&h|~g&l)+1518500249:40>d?(g^h^l)+1859775393:60>d?(g&h|g&l|h&l)+2400959708:(g^h^l)+3395469782,m+=(f<<5|f>>>27)+k+c[d],k=l,l=h,h=g<<30|g>>>2,g=f,f=m;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+h|0;b[3]=b[3]+l|0;b[4]=b[4]+k|0}return b}function Qt(a){var b=Pt(a);a=[];for(var b=t(b),c=b.next();!c.done;c=b.next())c=c.value,a.push(c>>>24&255,c>>>16&255,c>>>8&255,c&255);return a}
function Rt(a){a=Pt(a);for(var b=new Qa,c=0;c<a.length;c++)b.append(Ot(a[c]));a=b.toString();b=new Qa;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};function St(a,b,c,d,e,f,g,h,l,k){this.b=a;this.url=b;this.lang=c;this.f=d;this.l=e;this.$=yb(f);this.$.ub=!1;this.u=g;this.j=h;this.h=l;this.g=k;this.nb=this.page=null}function Tt(a,b,c){if(c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=Oa(d,"height","auto")&&(x(d,"height","auto"),Tt(a,d,c));"absolute"==Oa(d,"position","static")&&(x(d,"position","relative"),Tt(a,d,c))}}
function Ut(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";var d=b.parentNode;b.setAttribute("aria-expanded",c?"true":"false");d.setAttribute("aria-expanded",c?"true":"false");for(b=d.firstChild;b;)1!=b.nodeType?b=b.nextSibling:(d=b,"toc-container"==d.getAttribute("data-adapt-class")?(d.setAttribute("aria-hidden",c?"false":"true"),b=d.firstChild):("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px",3<=d.children.length&&(d.children[0].tabIndex=
c?0:-1),2<=d.children.length&&(d.children[1].tabIndex=c?0:-1)),b=b.nextSibling));a.stopPropagation()}
St.prototype.Fe=function(a){var b=this.u.Fe(a);return function(a,d,e){var c=e.behavior;if(!c||"toc-node"!=c.toString()&&"toc-container"!=c.toString())return b(a,d,e);(e=a.firstChild)&&1!==e.nodeType&&""===e.textContent.trim()&&a.replaceChild(a.ownerDocument.createComment(e.textContent),e);var g=d.getAttribute("data-adapt-class");if("toc-node"==g){var h=d.firstChild;"\u25b8"!=h.textContent&&(h.textContent="\u25b8",x(h,"cursor","pointer"),h.addEventListener("click",Ut,!1),h.setAttribute("role","button"),
h.setAttribute("aria-expanded","false"),d.setAttribute("aria-expanded","false"),"0px"!==d.style.height&&(h.tabIndex=0))}e=d.ownerDocument.createElement("div");e.setAttribute("data-adapt-process-children","true");if("toc-node"==c.toString()){if(h=d.ownerDocument.createElement("div"),h.textContent="\u25b9",x(h,"margin","0.2em 0 0 -1em"),x(h,"margin-inline-start","-1em"),x(h,"margin-inline-end","0"),x(h,"display","inline-block"),x(h,"width","1em"),x(h,"text-align","center"),x(h,"vertical-align","top"),
x(h,"cursor","default"),x(h,"font-family","Menlo,sans-serif"),e.appendChild(h),x(e,"overflow","hidden"),e.setAttribute("data-adapt-class","toc-node"),e.setAttribute("role","treeitem"),"toc-node"==g||"toc-container"==g)x(e,"height","0px"),(a=a.firstElementChild)&&"a"===a.localName&&(a.tabIndex=-1)}else"toc-node"==g?(e.setAttribute("data-adapt-class","toc-container"),e.setAttribute("role","group"),e.setAttribute("aria-hidden","true")):null==g&&e.setAttribute("role","tree");return M(e)}};
St.prototype.Sc=function(a,b,c,d,e){if(this.page)return M(this.page);var f=this,g=L("showTOC"),h=new Ek(a,a);this.page=h;this.b.load(this.url).then(function(d){var k=f.b.f[d.url],k=new lt(f.b,k.f,k.b,Ij.clone(),k.D,k.l,k.u,k.h,k.j,k.A),l=ot(k,c,1E5,e);b=new Zr(b.window,l.fontSize,b.root,l.width,l.height);var p=new pt(k,d,f.lang,b,f.f,f.l,f.Fe(d),f.j,0,f.h,f.g);f.nb=p;p.$=f.$;qt(p).then(function(){Et(p,h,null).then(function(){Tt(f,a,2);O(g,h)})})});return g.result()};
St.prototype.Rd=function(){this.page&&(this.page.I.style.visibility="hidden",this.page.I.setAttribute("aria-hidden","true"))};St.prototype.Pc=function(){return!!this.page&&"visible"===this.page.I.style.visibility};function Vt(){Lt.call(this,Wt(this));this.g=new xf(pk,"document");this.F=new xf(zf,"text");this.G={};this.la={};this.A={};this.D={}}v(Vt,Lt);function Wt(a){return function(b){return a.A[b]}}
function Xt(a,b,c){var d=L("loadEPUBDoc");"/"!==b.substring(b.length-1)&&(b+="/");c&&a.F.fetch(b+"?r=list");a.g.fetch(b+"META-INF/encryption.xml");var e=b+"META-INF/container.xml";a.g.load(e,!0,"Failed to fetch EPUB container.xml from "+e).then(function(f){if(f){f=yk(ek(ek(ek(new fk([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");f=t(f);for(var g=f.next();!g.done;g=f.next())if(g=g.value){Yt(a,b,g,c).La(d);return}O(d,null)}else w.error("Received an empty response for EPUB container.xml "+
e+". This may be caused by the server not allowing cross origin requests.")});return d.result()}
function Yt(a,b,c,d){var e=b+c,f=a.G[e];if(f)return M(f);var g=L("loadOPF");a.g.load(e,void 0,void 0).then(function(c){c?a.g.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.F.load(b+"?r=list"):M(null)).then(function(d){f=new Zt(a,b);$t(f,c,h,d,b+"?r=manifest").then(function(){a.G[e]=f;a.la[b]=f;O(g,f)})})}):w.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross origin requests.")});return g.result()}
function au(a,b,c){var d=L("EPUBDocStore.load");b=xa(b);(a.D[b]=Kt(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,Xd:null})).La(d);return d.result()}
Vt.prototype.load=function(a){var b=xa(a);if(a=this.D[b])return a.Xa()?a:M(a.get());var c=L("EPUBDocStore.load");a=Vt.ng.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?O(c,a):w.error("Received an empty response for "+b+". This may be caused by the server not allowing cross origin requests.")});return c.result()};function bu(){this.id=null;this.src="";this.h=this.j=this.g=null;this.O=-1;this.u=0;this.A=null;this.f=this.b=0;this.Cc=this.yb=null;this.l=ab}
function cu(a){return a.id}function du(a){var b=Qt(a);return function(a){var c=L("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));wf(e).then(function(a){a=new DataView(a);for(var d=0;d<a.byteLength;d++){var e=a.getUint8(d),e=e^b[d%20];a.setUint8(d,e)}O(c,vf([a,f]))});return c.result()}}
var eu={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",rendition:"http://www.idpf.org/vocab/rendition/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},fu=eu.dcterms+"language",gu=eu.dcterms+"title",hu=eu.rendition+"layout";
function iu(a,b){var c={};return function(d,e){var f,g,h=d.r||c,l=e.r||c;if(a==gu&&(f="main"==h["http://idpf.org/epub/vocab/package/#title-type"],g="main"==l["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(l["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=fu&&b&&(f=(h[fu]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(l[fu]||l["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function ju(a,b){function c(a){for(var b in a){var d=a[b];d.sort(iu(b,k));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return db(a,function(a){return cb(a,function(a){var b={v:a.value,o:a.order};a.rh&&(b.s=a.scheme);if(a.id||a.lang){var c=l[a.id];if(c||a.lang)a.lang&&(a={name:fu,value:a.lang,lang:null,id:null,Oe:a.id,scheme:null,order:a.order},c?c.push(a):c=[a]),c=bb(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=
a[2]?f[a[2]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in eu)f[g]=eu[g];for(;g=b.match(/^\s*([A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/);)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=eu;var h=1;g=wk(xk(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),order:h++,Oe:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:eu.dcterms+a.localName,order:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),Oe:null,scheme:null};return null});var l=bb(g,function(a){return a.Oe});g=d(bb(g,function(a){return a.Oe?null:a.name}));var k=null;g[fu]&&(k=g[fu][0].v);c(g);return g}function ku(){var a=window.MathJax;return a?a.Hub:null}var lu={"application/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function Zt(a,b){this.g=a;this.D=this.f=this.b=this.l=this.h=null;this.N=b;this.H=null;this.Z={};this.lang=null;this.j=0;this.F=!1;this.J=!0;this.u=null;this.A={};this.ca=this.Te=this.lf=null;this.Y={};this.R=null;this.G=mu(this);ku()&&(Ih["http://www.w3.org/1998/Math/MathML"]=!0)}
function mu(a){function b(){}b.prototype.Qe=function(a,b){return"viv-id-"+Fa(b+(a?"#"+a:""),":")};b.prototype.lc=function(b,d){var c=b.match(/^([^#]*)#?(.*)$/);if(c){var f=c[1]||d,c=c[2];if(f&&a.l.some(function(a){return a.src===f}))return"#"+this.Qe(c,f)}return b};b.prototype.Kg=function(a){"#"===a.charAt(0)&&(a=a.substring(1));a.indexOf("viv-id-")||(a=a.substring(7));return(a=Wa(a).match(/^([^#]*)#?(.*)$/))?[a[1],a[2]]:[]};return new b}
function nu(a,b){return a.N?b.substr(0,a.N.length)==a.N?decodeURI(b.substr(a.N.length)):null:b}
function $t(a,b,c,d,e){a.h=b;var f=ek(new fk([b.b]),"package"),g=yk(f,"unique-identifier")[0];g&&(g=lk(b,b.url+"#"+g))&&(a.H=g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.l=cb(ek(ek(f,"manifest"),"item").X,function(c){var d=new bu,e=b.url;d.id=c.getAttribute("id");d.src=Aa(c.getAttribute("href"),e);d.g=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.l=f}(c=c.getAttribute("fallback"))&&!lu[d.g]&&(h[d.src]=c);!a.Te&&
d.l.nav&&(a.Te=d);!a.ca&&d.l["cover-image"]&&(a.ca=d);return d});a.f=$a(a.l,cu);a.D=$a(a.l,function(b){return nu(a,b.src)});for(var l in h)for(g=l;;){g=a.f[h[g]];if(!g)break;if(lu[g.g]){a.Y[l]=g.src;break}g=g.src}a.b=cb(ek(ek(f,"spine"),"itemref").X,function(b,c){var d=b.getAttribute("idref");if(d=a.f[d])d.h=b,d.O=c;return d});if(l=yk(ek(f,"spine"),"toc")[0])a.lf=a.f[l];if(l=yk(ek(f,"spine"),"page-progression-direction")[0]){a:switch(l){case "ltr":l="ltr";break a;case "rtl":l="rtl";break a;default:throw Error("unknown PageProgression: "+
l);}a.R=l}var g=c?yk(ek(ek(uk(ek(ek(new fk([c.b]),"encryption"),"EncryptedData"),tk()),"CipherData"),"CipherReference"),"URI"):[],k=ek(ek(f,"bindings"),"mediaType").X;for(c=0;c<k.length;c++){var m=k[c].getAttribute("handler");(l=k[c].getAttribute("media-type"))&&m&&a.f[m]&&(a.Z[l]=a.f[m].src)}a.A=ju(ek(f,"metadata"),yk(f,"prefix")[0]);a.A[fu]&&(a.lang=a.A[fu][0].v);a.A[hu]&&(a.F="pre-paginated"===a.A[hu][0].v);if(!d){if(0<g.length&&a.H)for(d=du(a.H),c=0;c<g.length;c++)a.g.A[a.N+g[c]]=d;a.F&&ou(a);
return M(!0)}f=new Qa;k={};if(0<g.length&&a.H)for(l="1040:"+Rt(a.H),c=0;c<g.length;c++)k[g[c]]=l;for(c=0;c<d.length;c++){var p=d[c];if(m=p.n){var q=decodeURI(m),g=a.D[q];l=null;g&&(g.A=0!=p.m,g.u=p.c,g.g&&(l=g.g.replace(/\s+/g,"")));g=k[q];if(l||g)f.append(m),f.append(" "),f.append(l||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}ou(a);return uf(e,"","POST",f.toString(),"text/plain")}
function ou(a){for(var b=0,c=t(a.b),d=c.next();!d.done;d=c.next()){var d=d.value,e=a.F?1:Math.ceil(d.u/1024);d.b=b;d.f=e;b+=e}a.j=b;a.u&&a.u(a.j)}function pu(a,b){a.J=b||a.F}
function qu(a,b){a.u=b;if(a.J)return a.F&&!a.j&&ou(a),M(!0);var c=0,d=0,e=L("estimatePageCount");Ee(function(b){if(d===a.b.length)Q(b);else{var e=a.b[d++];e.b=c;a.g.load(e.src).then(function(d){var f=1800,g=d.lang||a.lang;g&&g.match(/^(ja|ko|zh)/)&&(f/=3);e.f=Math.ceil(ik(d)/f);c+=e.f;a.j=c;a.u&&a.u(a.j);P(b)})}}).La(e);return e.result()}
function ru(a,b,c){a.f={};a.D={};a.l=[];a.b=a.l;var d=a.h=new dk(null,"",(new DOMParser).parseFromString("<spine></spine>","text/xml"));b.forEach(function(a){var b=new bu;b.O=a.index;b.id="item"+(a.index+1);b.src=a.url;b.yb=a.yb;b.Cc=a.Cc;var c=d.b.createElement("itemref");c.setAttribute("idref",b.id);d.root.appendChild(c);b.h=c;this.f[b.id]=b;this.D[a.url]=b;this.l.push(b)},a);return c?au(a.g,b[0].url,c):M(null)}
function su(a,b,c){var d=a.b[b],e=L("getCFI");a.g.load(d.src).then(function(a){var b=jk(a,c),f=null;b&&(a=hk(a,b,0,!1),f=new tb,wb(f,b,c-a),d.h&&wb(f,d.h,0),f=f.toString());O(e,f)});return e.result()}
function tu(a,b){return me("resolveFragment",function(c){if(b){var d=new tb;ub(d,b);var e;if(a.h){var f=vb(d,a.h.b);if(1!=f.node.nodeType||f.K||!f.qd){O(c,null);return}var g=f.node,h=g.getAttribute("idref");if("itemref"!=g.localName||!h||!a.f[h]){O(c,null);return}e=a.f[h];d=f.qd}else e=a.b[0];a.g.load(e.src).then(function(a){var b=vb(d,a.b);a=hk(a,b.node,b.offset,b.K);O(c,{O:e.O,Ea:a,aa:-1})})}else O(c,null)},function(a,d){w.b(d,"Cannot resolve fragment:",b);O(a,null)})}
function uu(a,b){return me("resolveEPage",function(c){if(0>=b)O(c,{O:0,Ea:0,aa:-1});else if(a.J){var d=a.b.findIndex(function(a){return!a.b&&!a.f||a.b<=b&&a.b+a.f>b});-1==d&&(d=a.b.length-1);var e=a.b[d];e&&e.f||(e=a.b[--d]);O(c,{O:d,Ea:-1,aa:Math.floor(b-e.b)})}else{var f=Ya(a.b.length,function(c){c=a.b[c];return c.b+c.f>b});f==a.b.length&&f--;var g=a.b[f];a.g.load(g.src).then(function(a){b-=g.b;b>g.f&&(b=g.f);var d=0;0<b&&(a=ik(a),d=Math.round(a*b/g.f),d==a&&d--);O(c,{O:f,Ea:d,aa:-1})})}},function(a,
d){w.b(d,"Cannot resolve epage:",b);O(a,null)})}function vu(a,b){var c=a.b[b.O];if(a.J)return M(c.b+b.aa);if(0>=b.Ea)return M(c.b);var d=L("getEPage");a.g.load(c.src).then(function(a){a=ik(a);O(d,c.b+Math.min(a,b.Ea)*c.f/a)});return d.result()}function wu(a,b){return{page:a,position:{O:a.O,aa:b,Ea:a.offset}}}function xu(a,b,c,d,e){this.S=a;this.viewport=b;this.j=c;this.l=e;this.Hb=[];this.g=[];this.$=yb(d);this.h=new Xr(b);this.f=new Yp(a.G);this.wf=!1}
function yu(a,b){var c=a.Hb[b.O];return c?c.Ja[b.aa]:null}n=xu.prototype;n.dc=function(a){return this.S.R?this.S.R:(a=this.Hb[a?a.O:0])?a.nb.H:null};
function zu(a,b,c,d){c.I.style.display="none";c.I.style.visibility="visible";c.I.style.position="";c.I.style.top="";c.I.style.left="";c.I.setAttribute("data-vivliostyle-page-side",c.b);var e=b.Ja[d];c.u=!b.item.O&&!d;b.Ja[d]=c;if(a.S.J){if(!d&&0<b.item.O){var f=a.S.b[b.item.O-1];b.item.b=f.b+f.f}b.item.f=b.Ja.length;a.S.j=a.S.b.reduce(function(a,b){return a+b.f},0);a.S.u&&a.S.u(a.S.j)}if(e)b.nb.viewport.f.replaceChild(c.I,e.I),fb(e,{type:"replaced",target:null,currentTarget:null,ag:c});else{e=null;
if(0<d)e=b.Ja[d-1].I.nextElementSibling;else for(f=b.item.O+1;f<a.Hb.length;f++){var g=a.Hb[f];if(g&&g.Ja[0]){e=g.Ja[0].I;break}}b.nb.viewport.f.insertBefore(c.I,e)}a.l({width:b.nb.Ba,height:b.nb.ua},b.nb.ob,b.item.O,b.nb.ta+d)}
function Au(a,b,c){var d=L("renderSinglePage"),e=Bu(a,b,c);Et(b.nb,e,c).then(function(f){var g=(c=f)?c.page-1:b.jb.length-1;zu(a,b,e,g);bq(a.f,e.O,g);f=null;if(c){var h=b.jb[c.page];b.jb[c.page]=c;h&&b.Ja[c.page]&&(pl(c,h)||(f=Au(a,b,c)))}f||(f=M(!0));f.then(function(){var f=cq(a.f,e),h=0;Ee(function(b){h++;if(h>f.length)Q(b);else{var c=f[h-1];c.Wd=c.Wd.filter(function(a){return!a.rd});c.Wd.length?Cu(a,c.O).then(function(d){d?(aq(a.f,c.Ke),dq(a.f,c.Wd),Au(a,d,d.jb[c.aa]).then(function(c){var d=a.f;
d.b=d.F.pop();d=a.f;d.g=d.H.pop();d=c.Vd.position;d.O===e.O&&d.aa===g&&(e=c.Vd.page);P(b)})):P(b)}):P(b)}}).then(function(){e.I.parentElement||(e=b.Ja[g]);e.A=!c&&b.item.O===a.S.b.length-1;e.A&&fq(a.f,a.viewport);O(d,{Vd:wu(e,g),bg:c})})})});return d.result()}
function Du(a,b){var c=a.aa,d=-1;0>c?(d=a.Ea,c=Ya(b.jb.length,function(a){return st(b.nb,b.jb[a],!0)>d}),c=c===b.jb.length?b.complete?b.jb.length-1:Number.POSITIVE_INFINITY:c-1):c===Number.POSITIVE_INFINITY&&-1!==a.Ea&&(d=a.Ea);return{O:a.O,aa:c,Ea:d}}
function Eu(a,b,c){var d=L("findPage");Cu(a,b.O).then(function(e){if(e){var f=null,g;Ee(function(d){var h=Du(b,e);g=h.aa;(f=e.Ja[g])?Q(d):e.complete?(g=e.jb.length-1,f=e.Ja[g],Q(d)):c?Fu(a,h).then(function(a){a&&(f=a.page,g=a.position.aa);Q(d)}):Ce(100).then(function(){P(d)})}).then(function(){O(d,wu(f,g))})}else O(d,null)});return d.result()}
function Fu(a,b){var c=L("renderPage");Cu(a,b.O).then(function(d){if(d){var e=Du(b,d),f=e.aa,g=e.Ea,h=d.Ja[f];h?O(c,wu(h,f)):Ee(function(b){if(f<d.jb.length)Q(b);else if(d.complete)f=d.jb.length-1,Q(b);else{var c=d.jb[d.jb.length-1];Au(a,d,c).then(function(a){var e=a.Vd.page;(c=a.bg)?0<=g&&st(d.nb,c)>g?(h=e,f=d.jb.length-2,Q(b)):P(b):(h=e,f=a.Vd.position.aa,d.complete=!0,Q(b))})}}).then(function(){h=h||d.Ja[f];var b=d.jb[f];h?O(c,wu(h,f)):Au(a,d,b).then(function(a){a.bg||(d.complete=!0);O(c,a.Vd)})})}else O(c,
null)});return c.result()}n.Rb=function(){return Gu(this,{O:this.S.b.length-1,aa:Number.POSITIVE_INFINITY,Ea:-1},!1)};function Gu(a,b,c){var d=L("renderPagesUpto");b||(b={O:0,aa:0,Ea:0});var e=b.O,f=b.aa,g=0;c&&(g=e);var h;Ee(function(c){Fu(a,{O:g,aa:g===e?f:Number.POSITIVE_INFINITY,Ea:g===e?b.Ea:-1}).then(function(a){h=a;++g>e?Q(c):P(c)})}).then(function(){O(d,h)});return d.result()}n.xg=function(a,b){return Eu(this,{O:0,aa:0,Ea:-1},b)};
n.Ag=function(a,b){return Eu(this,{O:this.S.b.length-1,aa:Number.POSITIVE_INFINITY,Ea:-1},b)};n.nextPage=function(a,b){var c=this,d=this,e=a.O,f=a.aa,g=L("nextPage");Cu(d,e).then(function(a){if(a){if(a.complete&&f==a.jb.length-1){if(e>=d.S.b.length-1){O(g,null);return}e++;f=0;var h=c.Hb[e],k=h&&h.Ja[0];a=a.Ja[a.Ja.length-1];k&&a&&k.b==a.b&&(h.Ja.forEach(function(a){a.I&&a.I.remove()}),c.Hb[e]=null,c.g[e]=null)}else f++;Eu(d,{O:e,aa:f,Ea:-1},b).La(g)}else O(g,null)});return g.result()};
n.Ne=function(a,b){var c=a.O,d=a.aa;if(d)d--;else{if(!c)return M(null);c--;d=Number.POSITIVE_INFINITY}return Eu(this,{O:c,aa:d,Ea:-1},b)};function Hu(a,b,c){b="left"===b.b;a="ltr"===a.dc(c);return!b&&a||b&&!a}function Iu(a,b,c){var d=L("getCurrentSpread"),e=yu(a,b);if(!e)return M({left:null,right:null});var f="left"===e.b;(Hu(a,e,b)?a.Ne(b,c):a.nextPage(b,c)).then(function(c){var e=yu(a,b);(c=c&&c.page)&&c.b===e.b&&(c=null);f?O(d,{left:e,right:c}):O(d,{left:c,right:e})});return d.result()}
n.Gg=function(a,b){var c=yu(this,a);if(!c)return M(null);var d=Hu(this,c,a),e=this.nextPage(a,b);if(d)return e;var f=this;return e.ea(function(a){if(a){if(a.page.b===c.b)return e;var d=f.nextPage(a.position,b);return d.ea(function(a){return a?d:e})}return M(null)})};n.Jg=function(a,b){var c=yu(this,a);if(!c)return M(null);var d=Hu(this,c,a),e=this.Ne(a,b),f=c.I.previousElementSibling;if(d){var g=this;return e.ea(function(a){return a?a.page.b===c.b||a.page.I!==f?e:g.Ne(a.position,b):M(null)})}return e};
function Ju(a,b,c){var d=L("navigateToEPage");uu(a.S,b).then(function(b){b?Eu(a,b,c).La(d):O(d,null)});return d.result()}function Ku(a,b,c){var d=L("navigateToCFI");tu(a.S,b).then(function(b){b?Eu(a,b,c).La(d):O(d,null)});return d.result()}
function Lu(a,b,c,d){w.debug("Navigate to",b);var e=nu(a.S,xa(b));if(!e){if(a.S.h&&b.match(/^#epubcfi\(/))e=nu(a.S,a.S.h.url);else if("#"===b.charAt(0)){var f=a.S.G.Kg(b);a.S.h?e=nu(a.S,f[0]):e=f[0];b=f[0]+(f[1]?"#"+f[1]:"")}if(null==e)return M(null)}var g=a.S.D[e];if(!g)return a.S.h&&e==nu(a.S,a.S.h.url)&&(e=b.indexOf("#"),0<=e)?Ku(a,b.substr(e+1),d):M(null);var h=L("navigateTo");Cu(a,g.O).then(function(e){var f=lk(e.da,b);f?Eu(a,{O:g.O,aa:-1,Ea:gk(e.da,f)},d).La(h):c.O!==g.O?Eu(a,{O:g.O,aa:0,Ea:-1},
d).La(h):O(h,null)});return h.result()}
function Bu(a,b,c){var d=b.nb.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);e.setAttribute("role","region");e.style.position="absolute";e.style.top="0";e.style.left="0";Zj||(e.style.visibility="hidden",e.setAttribute("aria-hidden","true"));d.h.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);var g=new Ek(e,f);g.O=b.item.O;g.position=c;g.offset=st(b.nb,c);g.offset||(b=a.S.G.Qe("",b.item.src),f.setAttribute("id",
b),Hk(g,f,b));d!==a.viewport&&(a=kg(null,new qf(Bb(a.viewport.width,a.viewport.height,d.width,d.height),null)),g.l.push(new Bk(e,"transform",a)));return g}function Mu(a,b,c,d){var e=ku();if(e){var f=d.ownerDocument,g=f.createElement("span");d.appendChild(g);c=f.importNode(c,!0);Nu(a,c,b);g.appendChild(c);a=e.queue;a.Push(["Typeset",e,g]);var e=L("makeMathJaxView"),h=we(e);a.Push(function(){h.tb(g)});return e.result()}return M(null)}
function Nu(a,b,c){if(b){if(1===b.nodeType&&"mglyph"===b.tagName)for(var d=t(b.attributes),e=d.next();!e.done;e=d.next())if(e=e.value,"src"===e.name){var f=Aa(e.nodeValue,c.url);e.namespaceURI?b.setAttributeNS(e.namespaceURI,e.name,f):b.setAttribute(e.name,f)}b.firstChild&&Nu(a,b.firstChild,c);b.nextSibling&&Nu(a,b.nextSibling,c)}}
n.Fe=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=Aa(f,a.url),g=c.getAttribute("media-type");if(!g){var h=nu(b.S,f);h&&(h=b.S.D[h])&&(g=h.g)}if(g&&(h=b.S.Z[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Ua(f),l=Ua(g),g=new Qa;g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(l);for(h=c.firstChild;h;h=h.nextSibling)1==h.nodeType&&
(l=h,"param"==l.localName&&"http://www.w3.org/1999/xhtml"==l.namespaceURI&&(f=l.getAttribute("name"),l=l.getAttribute("value"),f&&l&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(l)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=M(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=Mu(b,a,c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=M(e)}else e=c.dataset&&"true"==c.dataset.mathTypeset?Mu(b,a,c,d):M(null);return e}};
function Cu(a,b){if(b>=a.S.b.length)return M(null);var c=a.Hb[b];if(c)return M(c);var d=L("getPageViewItem"),e=a.g[b];if(e){var f=we(d);e.push(f);return d.result()}var e=a.g[b]=[],g=a.S.b[b],h=a.S.g;h.load(g.src).then(function(f){g.j=f.b.title;var k=h.f[f.url],l=a.Fe(f),p=a.viewport,q=ot(k,p.width,p.height,p.fontSize,a.$);if(q.width!=p.width||q.height!=p.height||q.fontSize!=p.fontSize)p=new Zr(p.window,q.fontSize,p.root,q.width,q.height);q=a.Hb[b-1];null!==g.yb?q=g.yb-1:(!(0<b)||q&&q.complete?q=q?
q.nb.ta+q.Ja.length:0:(q=g.b||b,a.S.F||q%2||q++),null!==g.Cc&&(q+=g.Cc));Zp(a.f,q);var r=new pt(k,f,a.S.lang,p,a.h,a.j,l,a.S.Y,q,a.S.G,a.f,a.S.R);r.$=a.$;qt(r).then(function(){c={item:g,da:f,nb:r,jb:[null],Ja:[],complete:!1};a.Hb[b]=c;O(d,c);e.forEach(function(a){a.tb(c)})})});return d.result()}function Ou(a){return a.Hb.some(function(a){return a&&0<a.Ja.length})}
n.Sc=function(a){var b=this.S,c=b.Te||b.lf;this.wf=a;if(!c)return M(null);if(this.b&&this.b.page)return this.b.page.I.style.visibility="visible",this.b.page.I.setAttribute("aria-hidden","false"),M(this.b.page);var d=L("showTOC");this.b||(this.b=new St(b.g,c.src,b.lang,this.h,this.j,this.$,this,b.Y,b.G,this.f));a=this.viewport;var b=Math.min(350,Math.round(.67*a.width)-16),c=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.visibility="hidden";e.style.width=b+10+"px";e.style.maxHeight=
c+"px";e.setAttribute("data-vivliostyle-toc-box","true");e.setAttribute("role","navigation");this.b.Sc(e,a,b,c,this.viewport.fontSize).then(function(a){e.style.visibility="visible";e.setAttribute("aria-hidden","false");O(d,a)});return d.result()};n.Rd=function(){this.b&&this.b.Rd()};n.Pc=function(){return!!this.b&&this.b.Pc()};var Pu={fh:"singlePage",gh:"spread",Vg:"autoSpread"};
function Qu(a,b,c,d){var e=this;this.window=a;this.fe=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);Zj&&b.setAttribute("data-vivliostyle-debug",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.Ba=c;this.ua=d;a=a.document;this.sa=new vm(a.head,b);this.u="loading";this.J=[];this.S=null;this.fc=this.Ya=!1;this.f=this.j=this.g=this.A=null;this.fontSize=16;this.zoom=1;this.D=!1;this.R="singlePage";this.ca=!1;this.Rb=!0;this.$=xb();this.Z=[];this.H=function(){};this.h=function(){};
this.Y=function(){e.Ya=!0;e.H()};this.Le=this.Le.bind(this);this.F=function(){};this.G=a.getElementById("vivliostyle-page-rules");this.N=!1;this.l=null;this.la={loadEPUB:this.rg,loadXML:this.sg,configure:this.$e,moveTo:this.ta,toc:this.Sc};Ru(this)}function Ru(a){wa(1,function(b){Su(a,{t:"debug",content:b})});wa(2,function(b){Su(a,{t:"info",content:b})});wa(3,function(b){Su(a,{t:"warn",content:b})});wa(4,function(b){Su(a,{t:"error",content:b})})}function Su(a,b){b.i=a.Ba;a.ua(b)}
function Tu(a,b){a.u!==b&&(a.u=b,a.fe.setAttribute("data-vivliostyle-viewer-status",b),Su(a,{t:"readystatechange"}))}n=Qu.prototype;n.rg=function(a){Uu.f("beforeRender");Tu(this,"loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=L("loadEPUB"),h=this;h.$e(a).then(function(){var a=new Vt;Mt(a,e,f).then(function(){var e=Aa(Ba(b),h.window.location.href);h.J=[e];Xt(a,e,d).then(function(a){h.S=a;Vu(h,c).then(function(){O(g,!0)})})})});return g.result()};
n.sg=function(a){Uu.f("beforeRender");Tu(this,"loading");var b=a.url,c=a.document,d=a.fragment,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=L("loadXML"),h=this;h.$e(a).then(function(){var a=new Vt;Mt(a,e,f).then(function(){var e=b.map(function(a,b){return{url:Aa(Ba(a.url),h.window.location.href),index:b,yb:a.yb,Cc:a.Cc}});h.J=e.map(function(a){return a.url});h.S=new Zt(a,"");ru(h.S,e,c).then(function(){Vu(h,d).then(function(){O(g,!0)})})})});return g.result()};
function Vu(a,b){Wu(a);var c;b?c=tu(a.S,b).ea(function(b){a.f=b;return M(!0)}):c=M(!0);return c.ea(function(){Uu.b("beforeRender");return Xu(a)})}function Yu(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d)return c*Nb.ex*a.fontSize/Nb.em;if(d=Nb[d])return c*d}return c}
n.$e=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.A=null,this.window.addEventListener("resize",this.Y,!1),this.Ya=!0):this.window.removeEventListener("resize",this.Y,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.Ya=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:Yu(this,b["margin-left"])||0,marginRight:Yu(this,b["margin-right"])||0,marginTop:Yu(this,b["margin-top"])||0,marginBottom:Yu(this,b["margin-bottom"])||
0,width:Yu(this,b.width)||0,height:Yu(this,b.height)||0},200<=b.width||200<=b.height)&&(this.window.removeEventListener("resize",this.Y,!1),this.A=b,this.Ya=!0);"boolean"==typeof a.hyphenate&&(this.$.we=a.hyphenate,this.Ya=!0);"boolean"==typeof a.horizontal&&(this.$.ve=a.horizontal,this.Ya=!0);"boolean"==typeof a.nightMode&&(this.$.He=a.nightMode,this.Ya=!0);"number"==typeof a.lineHeight&&(this.$.lineHeight=a.lineHeight,this.Ya=!0);"number"==typeof a.columnWidth&&(this.$.oe=a.columnWidth,this.Ya=
!0);"string"==typeof a.fontFamily&&(this.$.fontFamily=a.fontFamily,this.Ya=!0);"boolean"==typeof a.load&&(this.ca=a.load);"boolean"==typeof a.renderAllPages&&(this.Rb=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(ya=a.userAgentRootURL.replace(/resources\/?$/,""),za=a.userAgentRootURL);"string"==typeof a.rootURL&&(ya=a.rootURL,za=ya+"resources/");"string"==typeof a.pageViewMode&&a.pageViewMode!==this.R&&(this.R=a.pageViewMode,this.Ya=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.$.Ac&&
(this.viewport=null,this.$.Ac=a.pageBorder,this.Ya=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=a.zoom,this.fc=!0);"boolean"==typeof a.fitToScreen&&a.fitToScreen!==this.D&&(this.D=a.fitToScreen,this.fc=!0);"object"==typeof a.defaultPaperSize&&"number"==typeof a.defaultPaperSize.width&&"number"==typeof a.defaultPaperSize.height&&(this.viewport=null,this.$.sc=a.defaultPaperSize,this.Ya=!0);Zu(this,a);return M(!0)};
function Zu(a,b){ge("CONFIGURATION").forEach(function(c){c=c(b);a.Ya=c.Ya||a.Ya;a.fc=c.fc||a.fc})}n.Le=function(a){var b=this.g,c=this.j,d=a.target;c?c.left!==d&&c.right!==d||$u(this,a.ag):b===a.target&&$u(this,a.ag)};function av(a,b){var c=[];a.g&&c.push(a.g);a.j&&(c.push(a.j.left),c.push(a.j.right));c.forEach(function(a){a&&b(a)})}function bv(a){av(a,function(b){b.removeEventListener("hyperlink",a.F,!1);b.removeEventListener("replaced",a.Le,!1)})}
function cv(a){bv(a);av(a,function(a){x(a.I,"display","none");a.I.setAttribute("aria-hidden","true")});a.g=null;a.j=null}function dv(a,b){b.addEventListener("hyperlink",a.F,!1);b.addEventListener("replaced",a.Le,!1);x(b.I,"visibility","visible");x(b.I,"display","block");b.I.setAttribute("aria-hidden","false")}function ev(a,b){cv(a);a.g=b;dv(a,b)}
function fv(a){var b=L("reportPosition");su(a.S,a.f.O,a.f.Ea).then(function(c){var d=a.g;(a.ca&&0<d.j.length?Ie(d.j):M(!0)).then(function(){gv(a,d,c).La(b)})});return b.result()}function hv(a){var b=a.fe;if(a.A){var c=a.A;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new Zr(a.window,a.fontSize,b,c.width,c.height)}return new Zr(a.window,a.fontSize,b)}
function iv(a){var b=hv(a),c;a:switch(a.R){case "singlePage":c=!1;break a;case "spread":c=!0;break a;default:c=1.45<=b.width/b.height&&800<b.width}var d=a.$.ub!==c;a.$.ub=c;a.fe.setAttribute("data-vivliostyle-spread-view",c);if(a.A||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;if(!d&&b.width==a.viewport.width&&b.height==a.viewport.height||!d&&b.width==a.viewport.width&&b.height!=a.viewport.height&&/Android|iPhone|iPad|iPod/.test(navigator.userAgent))return!0;if(c=a.b&&Ou(a.b)){a:{c=t(a.b.Hb);
for(d=c.next();!d.done;d=c.next())if(d=d.value)for(var d=t(d.Ja),e=d.next();!e.done;e=d.next())if(e=e.value,e.G&&e.F){c=!0;break a}c=!1}c=!c}return c?(a.viewport.width=b.width,a.viewport.height=b.height,a.fc=!0):!1}n.Lg=function(a,b,c,d){this.Z[d]=a;jv(this,b)};function jv(a,b){if(!a.N&&a.G){var c="";Object.keys(b).forEach(function(a){c+="@page "+a+"{margin:0;size:";a=b[a];c+=a.width+"px "+a.height+"px;}"});a.G.textContent=c;a.N=!0}}
function kv(a){var b=!1,c=!1;if(a.b){b=a.b.Pc();c=a.b.wf;a.b.Rd();for(var d=a.b,e=t(d.Hb),f=e.next();!f.done;f=e.next())(f=f.value)&&f.Ja.splice(0);for(d=d.viewport.root;d.lastChild;)d.removeChild(d.lastChild)}a.G&&(a.G.textContent="",a.N=!1);a.viewport=hv(a);d=a.viewport;x(d.g,"width","");x(d.g,"height","");x(d.f,"width","");x(d.f,"height","");x(d.f,"transform","");a.b=new xu(a.S,a.viewport,a.sa,a.$,a.Lg.bind(a));b&&a.h({a:"toc",v:"show",autohide:c})}
function $u(a,b,c){a.fc=!1;bv(a);if(a.$.ub)return Iu(a.b,a.f,c).ea(function(c){cv(a);a.j=c;c.left&&(dv(a,c.left),c.right?c.left.I.removeAttribute("data-vivliostyle-unpaired-page"):c.left.I.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(dv(a,c.right),c.left?c.right.I.removeAttribute("data-vivliostyle-unpaired-page"):c.right.I.setAttribute("data-vivliostyle-unpaired-page",!0));c=lv(a,c);a.viewport.zoom(c.width,c.height,a.D?mv(a,c):a.zoom);a.g=b;return M(null)});ev(a,b);a.viewport.zoom(b.g.width,
b.g.height,a.D?mv(a,b.g):a.zoom);a.g=b;return M(null)}function lv(a,b){var c=0,d=0;b.left&&(c+=b.left.g.width,d=b.left.g.height);b.right&&(c+=b.right.g.width,d=Math.max(d,b.right.g.height));b.left&&b.right&&(c+=2*a.$.Ac);return{width:c,height:d}}var nv={$g:"fit inside viewport"};function mv(a,b){return Math.min(a.viewport.width/b.width,a.viewport.height/b.height)}function ov(){this.name="RenderingCanceledError";this.message="Page rendering has been canceled";this.stack=Error().stack}v(ov,Error);
function Wu(a){if(a.l){var b=a.l;ne(b,new ov);if(b!==he&&b.b){b.b.g=!0;var c=new xe(b);b.l="interrupt";b.b=c;b.f.tb(c)}}a.l=null}
function Xu(a){a.Ya=!1;a.fc=!1;if(iv(a))return M(!0);Tu(a,"loading");Wu(a);var b=pe(he.f,function(){return me("resize",function(c){a.l=b;Uu.f("render (resize)");kv(a);a.f&&(a.f.aa=-1);pu(a.S,a.Rb);Gu(a.b,a.f,!a.Rb).then(function(d){a.f=d.position;$u(a,d.page,!0).then(function(){Tu(a,"interactive");qu(a.S,function(b){b={t:"nav",epageCount:b,first:a.g.u,last:a.g.A,metadata:a.S.A,itemTitle:a.S.b[a.f.O].j};if(a.g.u||!a.f.aa&&a.S.b[a.f.O].b)b.epage=a.S.b[a.f.O].b;Su(a,b)}).then(function(){fv(a).then(function(d){(a.Rb?
a.b.Rb():M(null)).then(function(){a.l===b&&(a.l=null);Uu.b("render (resize)");a.Rb&&Tu(a,"complete");Su(a,{t:"loaded"});O(c,d)})})})})})},function(a,b){if(b instanceof ov)Uu.b("render (resize)"),w.debug(b.message);else throw b;})});return M(!0)}function gv(a,b,c){var d=L("sendLocationNotification"),e={t:"nav",first:b.u,last:b.A,metadata:a.S.A,itemTitle:a.S.b[b.O].j};vu(a.S,a.f).then(function(b){e.epage=b;e.epageCount=a.S.j;c&&(e.cfi=c);Su(a,e);O(d,!0)});return d.result()}
Qu.prototype.dc=function(){return this.b?this.b.dc(this.f):null};
Qu.prototype.ta=function(a){var b=this;"complete"!==this.u&&"next"!==a.where&&Tu(this,"loading");if("string"==typeof a.where){switch(a.where){case "next":a=this.$.ub?this.b.Gg:this.b.nextPage;break;case "previous":a=this.$.ub?this.b.Jg:this.b.Ne;break;case "last":a=this.b.Ag;break;case "first":a=this.b.xg;break;default:return M(!0)}if(a){var c=a;a=function(){return c.call(b.b,b.f,!b.Rb)}}}else if("number"==typeof a.epage){var d=a.epage;a=function(){return Ju(b.b,d,!b.Rb)}}else if("string"==typeof a.url){var e=
a.url;a=function(){return Lu(b.b,e,b.f,!b.Rb)}}else return M(!0);var f=L("moveTo");a.call(b.b).then(function(a){var c;if(a){b.f=a.position;var d=L("moveTo.showCurrent");c=d.result();$u(b,a.page,!b.Rb).then(function(){fv(b).La(d)})}else c=M(!0);c.then(function(a){"loading"===b.u&&Tu(b,"interactive");O(f,a)})});return f.result()};
Qu.prototype.Sc=function(a){var b=!!a.autohide;a=a.v;var c=this.b.Pc(),d=b!=this.b.wf&&"hide"!=a;if(c){if("show"==a&&!d)return M(!0)}else if("hide"==a)return M(!0);if(c&&"show"!=a)return this.b.Rd(),M(!0);var e=this,f=L("showTOC");this.b.Sc(b).then(function(a){a&&(d&&(a.Pb={}),b&&a.addEventListener("hyperlink",function(){e.b.Rd()},!1),a.addEventListener("hyperlink",e.F,!1));O(f,!0)});return f.result()};
function pv(a,b){var c=b.a||"";return me("runCommand",function(d){var e=a.la[c];e?e.call(a,b).then(function(){Su(a,{t:"done",a:c});O(d,!0)}):(w.error("No such action:",c),O(d,!0))},function(a,b){w.error(b,"Error during action:",c);O(a,!0)})}function qv(a){return"string"==typeof a?JSON.parse(a):a}
function rv(a,b){var c=qv(b),d=null;oe(function(){var b=L("commandLoop"),f=he.f;a.F=function(b){var c="#"===b.href.charAt(0)||a.J.some(function(a){return b.href.substr(0,a.length)==a});if(c){b.preventDefault();var d={t:"hyperlink",href:b.href,internal:c};pe(f,function(){Su(a,d);return M(!0)})}};Ee(function(b){if(a.Ya)Xu(a).then(function(){P(b)});else if(a.fc)a.g&&$u(a,a.g).then(function(){P(b)});else if(c){var e=c;c=null;pv(a,e).then(function(){P(b)})}else e=L("waitForCommand"),d=we(e,self),e.result().then(function(){P(b)})}).La(b);
return b.result()});a.H=function(){var a=d;a&&(d=null,a.tb())};a.h=function(b){if(c)return!1;c=qv(b);a.H();return!0};a.window.adapt_command=a.h};function Rr(a,b,c){if(a==b)return a?[[0,a]]:[];if(0>c||a.length<c)c=null;var d=sv(a,b),e=a.substring(0,d);a=a.substring(d);b=b.substring(d);var d=tv(a,b),f=a.substring(a.length-d);a=a.substring(0,a.length-d);b=b.substring(0,b.length-d);a=uv(a,b);e&&a.unshift([0,e]);f&&a.push([0,f]);vv(a);null!=c&&(a=wv(a,c));return a=xv(a)}
function uv(a,b){var c;if(!a)return[[1,b]];if(!b)return[[-1,a]];c=a.length>b.length?a:b;var d=a.length>b.length?b:a,e=c.indexOf(d);if(-1!=e)return c=[[1,c.substring(0,e)],[0,d],[1,c.substring(e+d.length)]],a.length>b.length&&(c[0][0]=c[2][0]=-1),c;if(1==d.length)return[[-1,a],[1,b]];var f=yv(a,b);if(f)return d=f[1],e=f[3],c=f[4],f=Rr(f[0],f[2]),d=Rr(d,e),f.concat([[0,c]],d);a:{c=a.length;for(var d=b.length,e=Math.ceil((c+d)/2),f=2*e,g=Array(f),h=Array(f),l=0;l<f;l++)g[l]=-1,h[l]=-1;g[e+1]=0;h[e+1]=
0;for(var l=c-d,k=!!(l%2),m=0,p=0,q=0,r=0,z=0;z<e;z++){for(var u=-z+m;u<=z-p;u+=2){var A=e+u,H;H=u==-z||u!=z&&g[A-1]<g[A+1]?g[A+1]:g[A-1]+1;for(var E=H-u;H<c&&E<d&&a.charAt(H)==b.charAt(E);)H++,E++;g[A]=H;if(H>c)p+=2;else if(E>d)m+=2;else if(k&&(A=e+l-u,0<=A&&A<f&&-1!=h[A])){var K=c-h[A];if(H>=K){c=zv(a,b,H,E);break a}}}for(u=-z+q;u<=z-r;u+=2){A=e+u;K=u==-z||u!=z&&h[A-1]<h[A+1]?h[A+1]:h[A-1]+1;for(H=K-u;K<c&&H<d&&a.charAt(c-K-1)==b.charAt(d-H-1);)K++,H++;h[A]=K;if(K>c)r+=2;else if(H>d)q+=2;else if(!k&&
(A=e+l-u,0<=A&&A<f&&-1!=g[A]&&(H=g[A],E=e+H-A,K=c-K,H>=K))){c=zv(a,b,H,E);break a}}}c=[[-1,a],[1,b]]}return c}function zv(a,b,c,d){var e=a.substring(c),f=b.substring(d);a=Rr(a.substring(0,c),b.substring(0,d));e=Rr(e,f);return a.concat(e)}function sv(a,b){if(!a||!b||a.charAt(0)!=b.charAt(0))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(f,e)==b.substring(f,e)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function tv(a,b){if(!a||!b||a.charAt(a.length-1)!=b.charAt(b.length-1))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(a.length-e,a.length-f)==b.substring(b.length-e,b.length-f)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function yv(a,b){function c(a,b,c){for(var d=a.substring(c,c+Math.floor(a.length/4)),e=-1,f="",g,h,k,l;-1!=(e=b.indexOf(d,e+1));){var m=sv(a.substring(c),b.substring(e)),K=tv(a.substring(0,c),b.substring(0,e));f.length<K+m&&(f=b.substring(e-K,e)+b.substring(e,e+m),g=a.substring(0,c-K),h=a.substring(c+m),k=b.substring(0,e-K),l=b.substring(e+m))}return 2*f.length>=a.length?[g,h,k,l,f]:null}var d=a.length>b.length?a:b,e=a.length>b.length?b:a;if(4>d.length||2*e.length<d.length)return null;var f=c(d,e,
Math.ceil(d.length/4)),d=c(d,e,Math.ceil(d.length/2)),g;if(f||d)d?g=f?f[4].length>d[4].length?f:d:d:g=f;else return null;var h;a.length>b.length?(f=g[0],d=g[1],e=g[2],h=g[3]):(e=g[0],h=g[1],f=g[2],d=g[3]);return[f,d,e,h,g[4]]}
function vv(a){a.push([0,""]);for(var b=0,c=0,d=0,e="",f="",g;b<a.length;)switch(a[b][0]){case 1:d++;f+=a[b][1];b++;break;case -1:c++;e+=a[b][1];b++;break;case 0:if(1<c+d){if(c&&d){if(g=sv(f,e))0<b-c-d&&0==a[b-c-d-1][0]?a[b-c-d-1][1]+=f.substring(0,g):(a.splice(0,0,[0,f.substring(0,g)]),b++),f=f.substring(g),e=e.substring(g);if(g=tv(f,e))a[b][1]=f.substring(f.length-g)+a[b][1],f=f.substring(0,f.length-g),e=e.substring(0,e.length-g)}c?d?a.splice(b-c-d,c+d,[-1,e],[1,f]):a.splice(b-c,c+d,[-1,e]):a.splice(b-
d,c+d,[1,f]);b=b-c-d+(c?1:0)+(d?1:0)+1}else b&&0==a[b-1][0]?(a[b-1][1]+=a[b][1],a.splice(b,1)):b++;c=d=0;f=e=""}""===a[a.length-1][1]&&a.pop();c=!1;for(b=1;b<a.length-1;)0==a[b-1][0]&&0==a[b+1][0]&&(a[b][1].substring(a[b][1].length-a[b-1][1].length)==a[b-1][1]?(a[b][1]=a[b-1][1]+a[b][1].substring(0,a[b][1].length-a[b-1][1].length),a[b+1][1]=a[b-1][1]+a[b+1][1],a.splice(b-1,1),c=!0):a[b][1].substring(0,a[b+1][1].length)==a[b+1][1]&&(a[b-1][1]+=a[b+1][1],a[b][1]=a[b][1].substring(a[b+1][1].length)+
a[b+1][1],a.splice(b+1,1),c=!0)),b++;c&&vv(a)}Rr.f=1;Rr.b=-1;Rr.g=0;
function wv(a,b){var c;a:{var d=a;if(0===b)c=[0,d];else{var e=0;for(c=0;c<d.length;c++){var f=d[c];if(-1===f[0]||0===f[0]){var g=e+f[1].length;if(b===g){c=[c+1,d];break a}if(b<g){d=d.slice();g=b-e;e=[f[0],f[1].slice(0,g)];f=[f[0],f[1].slice(g)];d.splice(c,1,e,f);c=[c+1,d];break a}e=g}}throw Error("cursor_pos is out of bounds!");}}d=c[1];c=c[0];e=d[c];f=d[c+1];return null==e||0!==e[0]?a:null!=f&&e[1]+f[1]===f[1]+e[1]?(d.splice(c,2,f,e),Av(d,c,2)):null!=f&&0===f[1].indexOf(e[1])?(d.splice(c,2,[f[0],
e[1]],[0,e[1]]),e=f[1].slice(e[1].length),0<e.length&&d.splice(c+2,0,[f[0],e]),Av(d,c,3)):a}
function xv(a){function b(a){return 55296<=a.charCodeAt(a.length-1)&&56319>=a.charCodeAt(a.length-1)}function c(a){return 56320<=a.charCodeAt(0)&&57343>=a.charCodeAt(0)}for(var d=!1,e=2;e<a.length;e+=1)0===a[e-2][0]&&b(a[e-2][1])&&-1===a[e-1][0]&&c(a[e-1][1])&&1===a[e][0]&&c(a[e][1])&&(d=!0,a[e-1][1]=a[e-2][1].slice(-1)+a[e-1][1],a[e][1]=a[e-2][1].slice(-1)+a[e][1],a[e-2][1]=a[e-2][1].slice(0,-1));if(!d)return a;d=[];for(e=0;e<a.length;e+=1)0<a[e][1].length&&d.push(a[e]);return d}
function Av(a,b,c){for(c=b+c-1;0<=c&&c>=b-1;c--)if(c+1<a.length){var d=a[c],e=a[c+1];d[0]===e[1]&&a.splice(c,2,[d[0],d[1]+e[1]])}return a};function Qr(a){return a.reduce(function(a,c){return c[0]===Rr.b?a:a+c[1]},"")}function fl(a,b,c){var d=0,e=0;a.some(function(a){for(var f=0;f<a[1].length;f++){switch(a[0]*c){case Rr.f:d++;break;case Rr.b:d--;e++;break;case Rr.g:e++}if(e>b)return!0}return!1});return Math.max(Math.min(b,e-1)+d,0)};function Bv(a,b,c,d,e){Xm.call(this,a,b,"block-end",null,c,e);this.g=d}v(Bv,Xm);Bv.prototype.df=function(a){return!(a instanceof Bv)};function Cv(a,b,c,d){$m.call(this,a,"block-end",b,c,d)}v(Cv,$m);Cv.prototype.Ha=function(){return Infinity};Cv.prototype.f=function(a){return a instanceof Bv?!0:this.Ha()<a.Ha()};function Dv(a){this.f=a}Dv.prototype.b=function(a){a=el(a);return!Tk(a,this.f.b)};function Ev(){}n=Ev.prototype;n.Ff=function(a){return"footnote"===a.Ca};
n.Ef=function(a){return a instanceof Bv};n.Lf=function(a,b){var c="region",d=jn(b,c);Fn(jn(b,"page"),d)&&(c="page");d=el(a);c=new Bv(d,c,b.h,a.Y,a.N);b.ke(c);return M(c)};n.Mf=function(a,b,c,d){return new Cv(a[0].ja.W,a,c,d)};n.xf=function(a,b){return jn(b,a.W).b.filter(function(a){return a instanceof Cv})[0]||null};
n.Bf=function(a,b,c){a.$f=!0;a.ue=!1;var d=a.element,e=c.j;b=b.b;var f=c.j.w&&"rtl"===c.j.w.direction,g={},h=e.A._pseudos;b=vr(e,b,f,e.A,g);if(h&&h.before){var l={},k=Hr(e,"http://www.w3.org/1999/xhtml","span");or(k,"before");d.appendChild(k);vr(e,b,f,h.before,l);delete l.content;Kr(e,k,l)}delete g.content;Kr(e,d,g);a.b=b;Mp(a,d);if(e=Pn(c.f,d))a.marginLeft=X(e.marginLeft),a.Z=X(e.borderLeftWidth),a.H=X(e.paddingLeft),a.marginTop=X(e.marginTop),a.ca=X(e.borderTopWidth),a.J=X(e.paddingTop),a.marginRight=
X(e.marginRight),a.Za=X(e.borderRightWidth),a.Y=X(e.paddingRight),a.marginBottom=X(e.marginBottom),a.Ba=X(e.borderBottomWidth),a.R=X(e.paddingBottom);if(c=Pn(c.f,d))a.width=X(c.width),a.height=X(c.height)};n.og=function(a,b){switch(a.g){case zd:$n(b,new Dv(a),a.W)}};co.push(new Ev);function Fv(a){return a.reduce(function(a,c){return a+c},0)/a.length}function it(a){var b=Fv(a);return Fv(a.map(function(a){a-=b;return a*a}))};function Gv(a,b){this.g(a,"end",b)}function Hv(a,b){this.g(a,"start",b)}function Iv(a,b,c){c||(c=this.j.now());var d=this.h[a];d||(d=this.h[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function Jv(){}function Kv(a){this.j=a;this.h={};this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=Jv}
Kv.prototype.l=function(){var a=this.h,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});w.g(b)};Kv.prototype.u=function(){this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=Jv};Kv.prototype.A=function(){this.g=Iv;this.registerStartTiming=this.f=Hv;this.registerEndTiming=this.b=Gv};
var Lv={now:Date.now},Uu,Mv=Uu=new Kv(window&&window.performance||Lv);Iv.call(Mv,"load_vivliostyle","start",void 0);na("vivliostyle.profile.profiler",Mv);Kv.prototype.printTimings=Kv.prototype.l;Kv.prototype.disable=Kv.prototype.u;Kv.prototype.enable=Kv.prototype.A;function to(a){return(a=a.C)&&a instanceof yp?a:null}function Nv(a,b,c){var d=a.b;return d&&!d.yc&&(a=Ov(a,b),a.B)?!d.vc||d.yc?M(!0):Pv(d,d.vc,a,null,c):M(!0)}function Qv(a,b,c){var d=a.b;return d&&(a=Ov(a,b),a.B)?!d.wc||d.zc?M(!0):Pv(d,d.wc,a,a.B.firstChild,c):M(!0)}function Rv(a,b){a&&Sv(a.K?a.parent:a,function(a,d){a instanceof xp||b.A.push(new Tv(d))})}function Sv(a,b){for(var c=a;c;c=c.parent){var d=c.C;d&&d instanceof yp&&!il(c,d)&&b(d,c)}}
function yp(a,b){this.parent=a;this.j=b;this.b=null}yp.prototype.We=function(){return"Repetitive elements owner formatting context (vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext)"};yp.prototype.ff=function(a,b){return b};function Uv(a,b){var c=Ov(a,b);return c?c.B:null}function Ov(a,b){do if(!il(b,a)&&b.M===a.j)return b;while(b=b.parent);return null}
function Nr(a,b){a.b||Ip.some(function(b){return b.root===a.j?(a.b=b.elements,!0):!1})||(a.b=new Vv(b,a.j),Ip.push({root:a.j,elements:a.b}))}yp.prototype.Ye=function(){};yp.prototype.Xe=function(){};var Ip=[];function Vv(a,b){this.N=a;this.vc=this.wc=this.u=this.D=this.l=this.A=null;this.G=this.H=0;this.yc=this.zc=!1;this.ed=this.qe=!0;this.j=!1;this.Z=b;this.J=this.g=null;this.R=[];this.Y=[]}function Wv(a,b){a.wc||(a.wc=Uk(b),a.A=b.M,a.D=b.B)}function Xv(a,b){a.vc||(a.vc=Uk(b),a.l=b.M,a.u=b.B)}
function Pv(a,b,c,d,e){var f=c.B,g=c.B.ownerDocument.createElement("div");f.appendChild(g);var h=new Hm(e,g,c),l=h.za.g;h.za.g=null;a.h=!0;return Km(h,new jl(b)).ea(function(){a.h=!1;f.removeChild(g);if(f)for(;g.firstChild;){var b=g.firstChild;g.removeChild(b);b.setAttribute("data-adapt-spec","1");d?f.insertBefore(b,d):f.appendChild(b)}h.za.g=l;return M(!0)})}Vv.prototype.b=function(a){var b=0;if(a&&!this.f(a))return b;if(!this.yc||a&&Yv(this,a))b+=this.G;this.zc||(b+=this.H);return b};
Vv.prototype.F=function(a){var b=0;if(a&&!this.f(a))return b;a&&Yv(this,a)&&(b+=this.G);this.ed||(b+=this.H);return b};function Yv(a,b){return Zv(b,a.Y,function(){return $v(a.J,b,!1)})}Vv.prototype.f=function(a){var b=this;return Zv(a,this.R,function(){return $v(b.Z,a,!0)})};function Zv(a,b,c){var d=b.filter(function(b){return b.w.M===a.M&&b.w.K===a.K});if(0<d.length)return d[0].result;c=c(a);b.push({w:a,result:c});return c}
function $v(a,b,c){for(var d=[];a;a=a.parentNode){if(b.M===a)return b.K;d.push(a)}for(a=b.M;a;a=a.parentNode){var e=d.indexOf(a);if(0<=e)return c?!e:!1;for(e=a;e;e=e.previousElementSibling)if(d.includes(e))return!0}return b.K}function aw(a){return!a.yc&&a.qe&&a.vc||!a.zc&&a.ed&&a.wc?!0:!1}function bw(a){this.C=a}bw.prototype.b=function(){};bw.prototype.f=function(a){return!!a};
bw.prototype.g=function(a,b,c,d){(a=this.C.b)&&!a.j&&(a.D&&(a.H=Np(a.D,c,a.N),a.D=null),a.u&&(a.G=Np(a.u,c,a.N),a.u=null),a.j=!0);return d};function cw(a){this.C=a}cw.prototype.b=function(){};cw.prototype.f=function(){return!0};cw.prototype.g=function(a,b,c,d){return d};function dw(a){this.C=a}v(dw,bw);dw.prototype.b=function(a,b){bw.prototype.b.call(this,a,b);var c=L("BlockLayoutProcessor.doInitialLayout");Em(new Dm(new ew(a.C),b.j),a).La(c);return c.result()};dw.prototype.f=function(){return!1};
function fw(a){this.C=a}v(fw,cw);fw.prototype.b=function(a,b){il(a,this.C)||a.K||b.A.unshift(new Tv(a));return gw(a,b)};function Tv(a){this.w=Ov(a.C,a)}n=Tv.prototype;n.je=function(a,b){var c=this.w.C.b;return c&&!Oo(this.w.B)&&aw(c)?b&&!a||a&&a.xa?!1:!0:!0};n.ld=function(){var a=this.w.C.b;return a&&aw(a)?(!a.yc&&a.qe&&a.vc?a.yc=!0:!a.zc&&a.ed&&a.wc&&(a.zc=!0),!0):!1};n.ad=function(a,b,c,d){(c=this.w.C.b)&&a&&d.u&&(!b||Yv(c,b))&&(c.yc=!1,c.qe=!1)};
n.Na=function(a,b){var c=this.w.C,d=this.w.C.b;if(!d)return M(!0);var e=this.w;return Qv(c,e,b).ea(function(){return Nv(c,e,b).ea(function(){d.zc=d.yc=!1;d.qe=!0;d.ed=!0;return M(!0)})})};n.re=function(a){return a instanceof Tv?this.w.C===a.w.C:!1};n.te=function(){return 10};function hw(a){Nm.call(this);this.C=a}v(hw,Nm);hw.prototype.qf=function(a){var b=this.C.b;return il(a,this.C)||b.j?(il(a,this.C)||a.K||!b||(b.zc=!1,b.ed=!1),new fw(this.C)):new dw(this.C)};function ew(a){this.C=a}v(ew,Gm);
ew.prototype.zd=function(a){var b=this.C,c=a.w,d=b.b;if(c.parent&&b.j===c.parent.M){switch(c.u){case "header":if(d.wc)c.u="none";else return Wv(d,c),M(!0);break;case "footer":if(d.vc)c.u="none";else return Xv(d,c),M(!0)}d.g||(d.g=c.M)}return Gm.prototype.zd.call(this,a)};ew.prototype.qc=function(a){var b=this.C,c=a.w;c.M===b.j&&(b.b.J=a.jd&&a.jd.M,a.Vb=!0);return"header"===c.u||"footer"===c.u?M(!0):Gm.prototype.qc.call(this,a)};function iw(){}v(iw,Kp);
iw.prototype.ie=function(a,b,c){if(wo(b,a))return Go(b,a);var d=a.C;return Uv(d,a)?(c&&Rv(a.parent,b),il(a,d)?Kp.prototype.ie.call(this,a,b,c):Om(new hw(d),a,b)):Io(b,a)};iw.prototype.Ze=function(a){var b=to(a).b;if(!b)return!1;b.h||b.A!==a.M&&b.l!==a.M||a.B.parentNode.removeChild(a.B);return!1};
function gw(a,b){var c=a.C,d=L("doLayout"),e=Fm(b.j,a,!1);Ho(e,b).then(function(a){var e=a;Ee(function(a){for(var d={};e;){d.Oa=!0;Ap(b,e,!1).then(function(d){return function(f){e=f;In(b.l)?Q(a):b.g?Q(a):e&&b.u&&e&&e.xa?Q(a):e&&e.K&&e.M==c.j?Q(a):d.Oa?d.Oa=!1:P(a)}}(d));if(d.Oa){d.Oa=!1;return}d={Oa:d.Oa}}Q(a)}).then(function(){O(d,e)})});return d.result()}iw.prototype.Na=function(a,b,c,d){return Kp.prototype.Na.call(this,a,b,c,d)};iw.prototype.Cd=function(a,b,c,d){Kp.prototype.Cd(a,b,c,d)};
function qo(a){for(var b=[],c=a;c;c=c.Kd)c.A.forEach(function(c){if(c instanceof Tv){var d=c.w.C.b;b.push(d)}c instanceof jw&&(d=new kw(c.w,c.f),b.push(d));c instanceof lw&&mw(c,a).forEach(function(a){b.push(a)})});return b}var nw=new iw;fe("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof yp&&!(a instanceof xp)?nw:null});function ow(a,b){if(!a||!a.J||a.K||wo(b,a))return M(a);var c=a.J;return pw(c,b,a).ea(function(d){var e=a.B;e.appendChild(d);var f=Np(d,b,a.b);e.removeChild(d);b.A.push(new jw(a,c,f));return M(a)})}function qw(a,b,c){this.b=a;this.f=b;this.Nb=c}qw.prototype.matches=function(){var a=rw[this.b];return!!a&&null!=a.Sa&&Bi(a.Sa,this.f,this.Nb)};function tj(a){this.b=a}tj.prototype.matches=function(){return this.b.some(function(a){return a.matches()})};function uj(a){this.b=a}uj.prototype.matches=function(){return this.b.every(function(a){return a.matches()})};
function sj(a,b){var c=b.split("_");if("NFS"==c[0])return new qw(a,parseInt(c[1],10),parseInt(c[2],10));ra("unknown view condition. condition="+b);return null}function Vj(a,b,c){sr(c,function(c){Xj(a,c,b)})}function sr(a,b){var c=a._viewConditionalStyles;c&&c.forEach(function(a){a.Cg.matches()&&b(a.Mg)})}function Dr(a,b,c){var d=rw;if(!d[a]||d[a].cb<=c)d[a]={Sa:b,cb:c}}var rw={};function Mr(a,b){this.b=b;this.M=a}
function pw(a,b,c){var d=c.B.ownerDocument.createElement("div"),e=new Hm(b,d,c),f=e.za.g;e.za.g=null;return Km(e,sw(a)).ea(function(){a.b.f["after-if-continues"]=!1;e.za.g=f;var b=d.firstChild;x(b,"display","block");return M(b)})}function sw(a){var b=mr.createElementNS("http://www.w3.org/1999/xhtml","div");or(b,"after-if-continues");a=new Zk(a.M,b,null,null,null,3,a.b);return new jl({pa:[{node:b,kb:a.type,wa:a,Ia:null,Fa:null}],na:0,K:!1,Qa:null})}function jw(a,b,c){this.w=a;this.b=b;this.f=c}n=jw.prototype;
n.je=function(a,b){return b&&!a||a&&a.xa?!1:!0};n.ld=function(){return!1};n.ad=function(){};n.Na=function(a,b){var c=this;return(new kw(this.w,this.f)).f(a)?pw(this.b,b,this.w).ea(function(a){c.w.B.appendChild(a);return M(!0)}):M(!0)};n.re=function(a){return a instanceof jw?this.b==a.b:!1};n.te=function(){return 9};function kw(a,b){this.w=a;this.g=b}kw.prototype.b=function(a){return this.f(a)?this.g:0};kw.prototype.F=function(a){return this.b(a)};
kw.prototype.f=function(a){if(!a)return!1;var b=a.wa?a.wa.oa:a.M;if(b===this.w.M)return!!a.K;for(a=b.parentNode;a;a=a.parentNode)if(a===this.w.M)return!0;return!1};function Ho(a,b){return a.ea(function(a){return ow(a,b)})}function Jp(a,b){var c=L("vivliostyle.selectors.processAfterIfContinuesOfAncestors"),d=a;De(function(){if(d){var a=ow(d,b);d=d.parent;return a.Fc(!0)}return M(!1)}).then(function(){O(c,!0)});return c.result()};function tw(a){var b=uw.findIndex(function(b){return b.root===a});0<=b&&uw.splice(b,1)}function vw(a){var b=uw.findIndex(function(b){return b.root===a});return(b=uw[b])?b.Og:null}
function ww(a,b,c){var d=a.w,e=d.display,f=d.parent?d.parent.display:null,g=!1;if("inline-table"===f&&!(d.C instanceof xp))for(var h=d.parent;h;h=h.parent)if(h.C instanceof xp){g=h.C===b;break}return g||"table-row"===e&&!xw(f)&&"table"!==f&&"inline-table"!==f||"table-cell"===e&&"table-row"!==f&&!xw(f)&&"table"!==f&&"inline-table"!==f||d.C instanceof xp&&d.C!==b?Io(c,d).ea(function(b){a.w=b;return M(!0)}):null}
function xw(a){return"table-row-group"===a||"table-header-group"===a||"table-footer-group"===a}function yw(a,b){this.rowIndex=a;this.M=b;this.b=[]}function zw(a){return Math.min.apply(null,a.b.map(function(a){return a.height}))}function Aw(a,b,c){this.rowIndex=a;this.Ra=b;this.g=c;this.f=c.colSpan||1;this.rowSpan=c.rowSpan||1;this.height=0;this.b=null}function Bw(a,b,c){this.rowIndex=a;this.Ra=b;this.$b=c}function Cw(a,b,c){this.g=a;this.b=c;this.jc=new Hm(a,b,c);this.f=!1}
Cw.prototype.cc=function(){var a=this.b.B,b=this.b.Z;"middle"!==b&&"bottom"!==b||x(a,"vertical-align","top");var c=this.jc.cc(!0);x(a,"vertical-align",b);return c};function Dw(a,b){this.B=a;this.b=b}function Ew(a,b,c,d){Mm.call(this,a,b,c,d);this.C=a.C;this.rowIndex=this.l=null}v(Ew,Mm);Ew.prototype.f=function(a,b){var c=Mm.prototype.f.call(this,a,b);return b<this.b()?null:Fw(this).every(function(a){return!!a.w})?c:null};
Ew.prototype.b=function(){var a=Mm.prototype.b.call(this);Fw(this).forEach(function(b){a+=b.Db.b()});return a};function Fw(a){a.l||(a.l=Gw(a).map(function(a){return a.cc()}));return a.l}function Gw(a){return Hw(a.C,null!=a.rowIndex?a.rowIndex:a.rowIndex=Iw(a.C,a.position.M)).map(a.C.Qd,a.C)}function Jw(a,b,c){this.rowIndex=a;this.j=b;this.C=c;this.h=null}v(Jw,mo);
Jw.prototype.f=function(a,b){if(b<this.b())return null;var c=Kw(this),d=Lw(this),e=d.every(function(a){return!!a.w})&&d.some(function(a,b){var d=c[b].jc,e=a.w,f=d.tf[0];return!(f.B===e.B&&f.K===e.K&&f.na===e.na)&&!Tk(el(e),d.za.wb)});this.j.xa=d.some(function(a){return a.w&&a.w.xa});return e?this.j:null};Jw.prototype.b=function(){var a=this.C,b=0;zw(a.g[this.rowIndex])>a.N/2||(b+=10);Lw(this).forEach(function(a){b+=a.Db.b()});return b};
function Lw(a){a.h||(a.h=Kw(a).map(function(a){return a.cc()}));return a.h}function Kw(a){return Mw(a.C,a.rowIndex).map(a.C.Qd,a.C)}function xp(a,b){yp.call(this,a,b);this.F=b;this.u=!1;this.G=-1;this.N=0;this.H=[];this.J=this.A=null;this.R=0;this.g=[];this.l=[];this.f=[];this.D=null;this.h=[];this.b=null}v(xp,yp);n=xp.prototype;n.We=function(){return"Table formatting context (vivliostyle.table.TableFormattingContext)"};
n.ff=function(a,b){if(!b)return b;switch(a.display){case "table-row":return!this.h.length;case "table-cell":return!this.h.some(function(b){return b.Gd.pa[0].node===a.M});default:return b}};function Nw(a,b){var c=a.l[b];c||(c=a.l[b]=[]);return c}function Iw(a,b){return a.g.findIndex(function(a){return b===a.M})}function Mw(a,b){return Nw(a,b).reduce(function(a,b){return b.$b!==a[a.length-1]?a.concat(b.$b):a},[])}function Hw(a,b){return Mw(a,b).filter(function(a){return a.rowIndex+a.rowSpan-1>b})}
n.Qd=function(a){return this.f[a.rowIndex]&&this.f[a.rowIndex][a.Ra]};function Ow(a){0>a.G&&(a.G=Math.max.apply(null,a.g.map(function(a){return a.b.reduce(function(a,b){return a+b.f},0)})));return a.G}function Pw(a,b){a.g.forEach(function(a){a.b.forEach(function(a){var c=Jk(b,a.g);a.g=null;a.height=this.u?c.width:c.height},this)},a)}
function Qw(a,b){if(!b)return null;var c=null,d=0;a:for(;d<a.f.length;d++)if(a.f[d])for(var e=0;e<a.f[d].length;e++)if(a.f[d][e]&&b===a.f[d][e].jc.za){c=a.g[d].b[e];break a}if(!c)return null;for(;d<a.l.length;d++)for(;e<a.l[d].length;e++){var f=a.l[d][e];if(f.$b===c)return{rowIndex:f.rowIndex,Ra:f.Ra}}return null}function Rw(a,b){var c=[];return a.l.reduce(function(d,e,f){if(f>=b.rowIndex)return d;e=a.Qd(e[b.Ra].$b);if(!e||c.includes(e))return d;Sw(e.jc.za,d);c.push(e);return d},[])}
function Tw(a){var b=[];a.g.forEach(function(c){c.b.forEach(function(c,e){b[e]||(b[e]={Jf:[],elements:[]});var d=b[e],g=a.Qd(c);g&&!d.Jf.includes(g)&&(Sw(g.jc.za,d.elements),d.Jf.push(g))})});return[new Uw(b.map(function(a){return a.elements}))]}function Sw(a,b){a.A.forEach(function(a){a instanceof Tv&&b.push(a.w.C.b);a instanceof lw&&mw(a,null).forEach(function(a){b.push(a)})})}n.Ye=function(){return[].concat(this.h)};n.Xe=function(a){this.h=a};function Uw(a){this.f=a}
Uw.prototype.b=function(a){return Vw(this,a,function(a){return a.current})};Uw.prototype.F=function(a){return Vw(this,a,function(a){return a.Ge})};function Vw(a,b,c){var d=0;a.f.forEach(function(a){a=no(b,a);d=Math.max(d,c(a))});return d}function Ww(a,b){this.C=a;this.h=b;this.rowIndex=-1;this.Ra=0;this.g=!1;this.f=[]}v(Ww,Gm);n=Ww.prototype;
n.zd=function(a){var b=this.C,c=ww(a,b,this.h);if(c)return c;Xw(this,a);var c=a.w,d=b.b;switch(c.display){case "table":b.R=c.sa;break;case "table-caption":b.H.push(new Dw(c.B,c.la));break;case "table-header-group":return d.wc||(this.b=!0,Wv(d,c)),M(!0);case "table-footer-group":return d.vc||(this.b=!0,Xv(d,c)),M(!0);case "table-row":this.b||(this.g=!0,this.rowIndex++,this.Ra=0,b.g[this.rowIndex]=new yw(this.rowIndex,c.M),d.g||(d.g=c.M))}return Gm.prototype.zd.call(this,a)};
n.qc=function(a){var b=this.C,c=a.w,d=c.display,e=this.h.f;Xw(this,a);if(c.M===b.F)d=Pn(e,Uv(b,c)),b.N=parseFloat(d[b.u?"height":"width"]),b.b.J=a.jd&&a.jd.M,a.Vb=!0;else switch(d){case "table-header-group":case "table-footer-group":if(this.b)return this.b=!1,M(!0);break;case "table-row":this.b||(b.D=c.B,this.g=!1);break;case "table-cell":if(!this.b){this.g||(this.rowIndex++,this.Ra=0,this.g=!0);d=this.rowIndex;c=new Aw(this.rowIndex,this.Ra,c.B);e=b.g[d];e||(b.g[d]=new yw(d,null),e=b.g[d]);e.b.push(c);
for(var e=d+c.rowSpan,f=Nw(b,d),g=0;f[g];)g++;for(;d<e;d++)for(var f=Nw(b,d),h=g;h<g+c.f;h++){var l=f[h]=new Bw(d,h,c);c.b||(c.b=l)}this.Ra++}}return Gm.prototype.qc.call(this,a)};n.uf=function(a){Yw(this,a)};n.Df=function(a){Yw(this,a)};n.kg=function(a){Yw(this,a)};n.Cf=function(a){Yw(this,a)};function Yw(a,b){var c=b.w;c&&c.B&&!Eo(c)&&a.f.push(c.clone())}function Xw(a,b){0<a.f.length&&Jo(a.h,b.w,a.f);a.f=[]}
function Zw(a,b){this.ec=!0;this.C=a;this.f=b;this.l=!1;this.b=-1;this.g=0;this.u=b.u;b.u=!1}v(Zw,Gm);var $w={"table-caption":!0,"table-column-group":!0,"table-column":!0};
function ax(a,b,c,d){var e=b.rowIndex,f=b.Ra,g=c.B;if(1<b.f){x(g,"box-sizing","border-box");for(var h=a.C.J,l=0,k=0;k<b.f;k++)l+=h[b.b.Ra+k];l+=a.C.R*(b.f-1);x(g,a.C.u?"height":"width",l+"px")}b=g.ownerDocument.createElement("div");g.appendChild(b);c=new Cw(a.f,b,c);a=a.C;(g=a.f[e])||(g=a.f[e]=[]);g[f]=c;1===d.f.pa.length&&d.f.K&&(c.f=!0);return Km(c.jc,d).Fc(!0)}function bx(a,b){var c=a.C.h[0];return c?c.$b.b.Ra===b:!1}
function cx(a){var b=a.C.h;if(!b.length)return[];var c=[],d=0;do{var e=b[d],f=e.$b.rowIndex;if(f<a.b){var g=c[f];g||(g=c[f]=[]);g.push(e);b.splice(d,1)}else d++}while(d<b.length);return c}
function dx(a,b){var c=a.C,d=cx(a),e=d.reduce(function(a){return a+1},0);if(0===e)return M(!0);var f=a.f.j,g=b.w;g.B.parentNode.removeChild(g.B);var h=L("layoutRowSpanningCellsFromPreviousFragment"),l=M(!0),k=0,m=[];d.forEach(function(a){var b=this;l=l.ea(function(){var d=Wk(a[0].Gd.pa[1],g.parent);return zo(f,d,!1).ea(function(){function g(a){for(;l<a;){if(!m.includes(l)){var b=d.B.ownerDocument.createElement("td");x(b,"padding","0");d.B.appendChild(b)}l++}}var h=M(!0),l=0;a.forEach(function(a){var b=
this;h=h.ea(function(){var c=a.$b;g(c.b.Ra);var h=a.Gd,p=Wk(h.pa[0],d);p.na=h.na;p.K=h.K;p.Sa=h.pa[0].Sa+1;return zo(f,p,!1).ea(function(){for(var d=a.Hf,f=0;f<c.f;f++)m.push(l+f);l+=c.f;return ax(b,c,p,d).ea(function(){p.B.rowSpan=c.rowIndex+c.rowSpan-b.b+e-k;return M(!0)})})})},b);return h.ea(function(){g(Ow(c));k++;return M(!0)})})})},a);l.then(function(){zo(f,g,!0,b.Dd).then(function(){O(h,!0)})});return h.result()}
function ex(a,b){if(a.j||a.h)return M(!0);var c=b.w,d=a.C;0>a.b?a.b=Iw(d,c.M):a.b++;a.g=0;a.l=!0;return dx(a,b).ea(function(){fx(a);tp(a.f,b.jd,null,!0,b.bd)&&!Hw(d,a.b-1).length&&(a.f.u=a.u,c.xa=!0,b.Vb=!0);return M(!0)})}function fx(a){a.C.g[a.b].b.forEach(function(b){var c=a.C.h[b.Ra];c&&c.$b.b.Ra==b.b.Ra&&(b=c.Gd.pa[0],c=gk(a.f.j.da,b.node),Dr(c,b.Sa+1,1))})}
function gx(a,b){if(a.j||a.h)return M(!0);var c=b.w;a.l||(0>a.b?a.b=0:a.b++,a.g=0,a.l=!0);var d=a.C.g[a.b].b[a.g],e=Yk(c).modify();e.K=!0;b.w=e;var f=L("startTableCell");bx(a,d.b.Ra)?(e=a.C.h.shift(),c.Sa=e.Gd.pa[0].Sa+1,e=M(e.Hf)):e=Fo(a.f,c,b.Dd).ea(function(a){a.B&&c.B.removeChild(a.B);return M(new jl(Uk(a)))});e.then(function(e){ax(a,d,c,e).then(function(){a.qc(b);a.g++;O(f,!0)})});return f.result()}
Zw.prototype.lg=function(a){var b=ww(a,this.C,this.f);if(b)return b;var b=a.w,c=this.C.b,d=b.display;return"table-header-group"===d&&c&&c.A===b.M?(this.j=!0,M(!0)):"table-footer-group"===d&&c&&c.l===b.M?(this.h=!0,M(!0)):"table-row"===d?ex(this,a):"table-cell"===d?gx(this,a):M(!0)};Zw.prototype.Nf=function(a){a=a.w;"table-row"===a.display&&(this.l=!1,this.j||this.h||(a=Yk(a).modify(),a.K=!1,this.f.N.push(new Jw(this.b,a,this.C))));return M(!0)};
Zw.prototype.qc=function(a){var b=a.w,c=this.C.b,d=b.display;"table-header-group"===d?c&&!c.h&&c.A===b.M?(this.j=!1,b.B.parentNode.removeChild(b.B)):x(b.B,"display","table-row-group"):"table-footer-group"===d&&(c&&!c.h&&c.l===b.M?(this.h=!1,b.B.parentNode.removeChild(b.B)):x(b.B,"display","table-row-group"));if(d&&$w[d])b.B.parentNode.removeChild(b.B);else if(b.M===this.C.F)b.xa=sp(this.f,b,null),this.f.u=this.u,a.Vb=!0;else return Gm.prototype.qc.call(this,a);return M(!0)};var uw=[];
function hx(){}function ix(a,b,c,d){for(var e=a.ownerDocument,f=e.createElement("tr"),g=[],h=0;h<b;h++){var l=e.createElement("td");f.appendChild(l);g.push(l)}a.parentNode.insertBefore(f,a.nextSibling);b=g.map(function(a){a=Jk(d,a);return c?a.height:a.width});a.parentNode.removeChild(f);return b}function jx(a){var b=[];for(a=a.firstElementChild;a;)"colgroup"===a.localName&&b.push(a),a=a.nextElementSibling;return b}
function kx(a){var b=[];a.forEach(function(a){var c=a.span;a.removeAttribute("span");for(var e=a.firstElementChild;e;){if("col"===e.localName){var f=e.span;e.removeAttribute("span");for(c-=f;1<f--;){var g=e.cloneNode(!0);a.insertBefore(g,e);b.push(g)}b.push(e)}e=e.nextElementSibling}for(;0<c--;)e=a.ownerDocument.createElement("col"),a.appendChild(e),b.push(e)});return b}
function lx(a,b,c,d){if(a.length<c){var e=d.ownerDocument.createElement("colgroup");b.push(e);for(b=a.length;b<c;b++){var f=d.ownerDocument.createElement("col");e.appendChild(f);a.push(f)}}}function mx(a,b,c){var d=a.u,e=a.D;if(e){a.D=null;var f=e.ownerDocument.createDocumentFragment(),g=Ow(a);if(0<g){var h=a.J=ix(e,g,d,c.f);c=jx(b);e=kx(c);lx(e,c,g,b);e.forEach(function(a,b){x(a,d?"height":"width",h[b]+"px")});c.forEach(function(a){f.appendChild(a.cloneNode(!0))})}a.A=f}}
function nx(a,b,c){var d=b.C;d.u=b.b;Nr(d,b.b);var e=vw(b.M);tw(b.M);var f=L("TableLayoutProcessor.doInitialLayout"),g=Yk(b);Em(new Dm(new Ww(b.C,c),c.j),b).then(function(a){var h=a.B,k=Jk(c.f,h),k=c.b?k.left:k.bottom,k=k+(c.b?-1:1)*no(b,qo(c)).current;ro(c,k)||e&&e.tg?(mx(d,h,c),Pw(d,c.f),O(f,null)):(c.N.push(new ox(g)),O(f,a))}.bind(a));return f.result()}function px(a,b,c){var d=a.H;d.forEach(function(a,f){a&&(b.insertBefore(a.B,c),"top"===a.b&&(d[f]=null))})}
function qx(a,b){if(a.A&&b){var c=jx(b);c&&c.forEach(function(a){b.removeChild(a)})}}function rx(a,b){var c=a.C,d=Uv(c,a),e=d.firstChild;px(c,d,e);c.A&&!jx(d).length&&d.insertBefore(c.A.cloneNode(!0),e);c=new Zw(c,b);c=new Dm(c,b.j);d=L("TableFormattingContext.doLayout");Em(c,a).La(d);return d.result()}n=hx.prototype;n.ie=function(a,b,c){var d=a.C;return Uv(d,a)?(c&&Rv(a.parent,b),Om(new sx(d,this),a,b)):Io(b,a)};n.Kf=function(a,b,c,d){return new Ew(a,b,c,d)};n.Ze=function(){return!1};n.Af=function(){return!1};
n.Na=function(a,b,c,d){var e=b.C;if("table-row"===b.display){var f=Iw(e,b.M);e.h=[];var g;g=b.K?Hw(e,f):Mw(e,f);if(g.length){var h=L("TableLayoutProcessor.finishBreak"),l=0;Ee(function(a){if(l===g.length)Q(a);else{var b=g[l++],c=e.Qd(b),d=c.cc().w,h=c.b,k=el(h),u=new jl(el(d));e.h.push({Gd:k,Hf:u,$b:b});h=h.B;Lp(c.b);f<b.rowIndex+b.rowSpan-1&&(h.rowSpan=f-b.rowIndex+1);c.f?P(a):c.jc.Na(d,!1,!0).then(function(){var b=e.b;if(b){var f=e.u,g=c.g,h=c.jc.za.element,k=c.b.B,l=Jk(g.f,k),k=Qo(g,k);f?(b=l.right-
g.la-b.b(d)-k.right,x(h,"max-width",b+"px")):(b=g.la-b.b(d)-l.top-k.top,x(h,"max-height",b+"px"));x(h,"overflow","hidden")}P(a)})}}).then(function(){kp(a,b,!1);Lp(b);e.f=[];O(h,!0)});return h.result()}}e.f=[];return op.Na(a,b,c,d)};n.Cd=function(a,b,c,d){Kp.prototype.Cd(a,b,c,d)};function sx(a,b){Nm.call(this);this.g=b;this.b=a}v(sx,Nm);sx.prototype.qf=function(a){var b=this.b.b;return b&&b.j?(a.M===this.b.F&&!a.K&&b&&(b.zc=!1,b.ed=!1),new tx(this.b)):new ux(this.b,this.g)};
sx.prototype.Hd=function(a){Nm.prototype.Hd.call(this,a);qx(this.b,Uv(this.b,a))};sx.prototype.he=function(a,b){Nm.prototype.he.call(this,a,b);this.b.f=[]};function ux(a,b){this.C=a;this.h=b}v(ux,bw);ux.prototype.b=function(a,b){bw.prototype.b.call(this,a,b);return nx(this.h,a,b)};function ox(a){Mm.call(this,a,null,a.xa,0)}v(ox,Mm);ox.prototype.b=function(){if(!this.h)throw Error("EdgeBreakPosition.prototype.updateEdge not called");return(this.j?3:0)+(this.position.parent?this.position.parent.j:0)};
ox.prototype.u=function(a){a.A.push(new vx(this.position.M))};function vx(a){this.b=a}n=vx.prototype;n.je=function(){return!1};n.ld=function(){return!0};n.ad=function(a,b){uw.push({root:b.M,Og:{tg:!0}})};n.Na=function(){return M(!0)};n.re=function(a){return a instanceof vx&&a.b===this.b};n.te=function(){return 0};function tx(a){this.C=a}v(tx,cw);tx.prototype.b=function(a,b){var c=this.C.b;if(c&&!Yv(c,a)){var d=new lw(a);b.A.some(function(a){return d.re(a)})||b.A.unshift(d)}return rx(a,b)};
function lw(a){Tv.call(this,a);this.b=[]}v(lw,Tv);n=lw.prototype;n.je=function(a,b,c){var d=this.w.C.b;return!d||c.Kd||Oo(this.w.B)||!aw(d)?!0:b&&!a||a&&a.xa?!1:!0};n.ld=function(a){return wx(a,this.w.C).some(function(b){return b.Id.some(function(b){return b.ld(a)})})?!0:Tv.prototype.ld.call(this,a)};n.ad=function(a,b,c,d){var e=this.w.C;this.b=wx(b,e);this.b.forEach(function(b){b.Id.forEach(function(e){e.ad(a,b.Db,c,d)})});a||(qx(e,Uv(e,this.w)),xx(c));Tv.prototype.ad.call(this,a,b,c,d)};
n.Na=function(a,b){var c=this,d=L("finishBreak"),e=this.b.reduce(function(a,b){return a.concat(b.Id.map(function(a){return{vg:a,Db:b.Db}}))},[]),f=0;De(function(){if(f<e.length){var a=e[f++];return a.vg.Na(a.Db,b).Fc(!0)}return M(!1)}).then(function(){O(d,!0)});return d.result().ea(function(){return Tv.prototype.Na.call(c,a,b)})};function xx(a){if(a&&"table-row"===a.display&&a.B)for(;a.B.previousElementSibling;){var b=a.B.previousElementSibling;b.parentNode&&b.parentNode.removeChild(b)}}
function wx(a,b){return yx(a,b).map(function(a){return{Id:a.yg.jc.za.A,Db:a.Db}})}function yx(a,b){var c=Number.MAX_VALUE;a&&"table-row"===a.display&&(c=Iw(b,a.M)+1);for(var c=Math.min(b.f.length,c),d=[],e=0;e<c;e++)b.f[e]&&b.f[e].forEach(function(a){a&&d.push({yg:a,Db:a.cc().w})});return d}function mw(a,b){var c=a.w.C,d=Qw(c,b);return d?Rw(c,d):Tw(c)}n.re=function(a){return a instanceof lw?this.w.C===a.w.C:!1};var zx=new hx;
fe("RESOLVE_FORMATTING_CONTEXT",function(a,b,c){return b?c===Nd?(b=a.parent,new xp(b?b.C:null,a.M)):null:null});fe("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof xp?zx:null});Array.from||(Array.from=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e],e):a[e];return c});
Array.prototype.findIndex||Object.defineProperty(Array.prototype,"findIndex",{value:function(a,b){if(null==this)throw new TypeError("Array.prototype.findIndex called on null or undefined");if("function"!==typeof a)throw new TypeError("predicate must be a function");for(var c=Object(this),d=c.length>>>0,e,f=0;f<d;f++)if(e=c[f],a.call(b,e,f,c))return f;return-1},enumerable:!1,configurable:!1,writable:!1});
Object.assign||(Object.assign=function(a,b){if(!b)return a;Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function Ax(a){function b(a){return"number"===typeof a?a:null}function c(a){return"string"===typeof a?{url:a,yb:null,Cc:null}:{url:a.url,yb:b(a.startPage),Cc:b(a.skipPagesBefore)}}return Array.isArray(a)?a.map(c):a?[c(a)]:null}function Bx(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}
function Cx(a,b){Zj=a.debug;this.g=!1;this.h=a;this.gb=new Qu(a.window||window,a.viewportElement,"main",this.wg.bind(this));this.f={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,pageViewMode:"autoSpread",zoom:1,fitToScreen:!1,defaultPaperSize:void 0};b&&this.jg(b);this.b=new eb;Object.defineProperty(this,"readyState",{get:function(){return this.gb.u}})}n=Cx.prototype;n.jg=function(a){var b=Object.assign({a:"configure"},Bx(a));this.gb.h(b);Object.assign(this.f,a)};
n.wg=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});fb(this.b,b)};n.Pg=function(a,b){this.b.addEventListener(a,b,!1)};n.Sg=function(a,b){this.b.removeEventListener(a,b,!1)};n.Bg=function(a,b,c){a||fb(this.b,{type:"error",content:"No URL specified"});Dx(this,a,null,b,c)};n.Qg=function(a,b,c){a||fb(this.b,{type:"error",content:"No URL specified"});Dx(this,null,a,b,c)};
function Dx(a,b,c,d,e){function f(a){if(a)return a.map(function(a){return{url:a.url||null,text:a.text||null}})}d=d||{};var g=f(d.authorStyleSheet),h=f(d.userStyleSheet);e&&Object.assign(a.f,e);b=Object.assign({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.h.userAgentRootURL,url:Ax(b)||c,document:d.documentObject,fragment:d.fragment,authorStyleSheet:g,userStyleSheet:h},Bx(a.f));a.g?a.gb.h(b):(a.g=!0,rv(a.gb,b))}n.dc=function(){return this.gb.dc()};
n.Eg=function(a,b){if("epage"===a)this.gb.h({a:"moveTo",epage:b});else{var c;a:switch(a){case "left":c="ltr"===this.dc()?"previous":"next";break a;case "right":c="ltr"===this.dc()?"next":"previous";break a;default:c=a}this.gb.h({a:"moveTo",where:c})}};n.Dg=function(a){this.gb.h({a:"moveTo",url:a})};n.Pc=function(){return this.gb.b&&this.gb.b.S&&(this.gb.b.S.Te||this.gb.b.S.lf)?!!this.gb.b.Pc():null};n.Sc=function(a,b){this.gb.h({a:"toc",v:null==a?"toggle":a?"show":"hide",autohide:b})};
n.Rg=function(a){a:{var b=this.gb;if(!b.g)throw Error("no page exists.");switch(a){case "fit inside viewport":a=mv(b,b.$.ub?lv(b,b.j):b.g.g);break a;default:throw Error("unknown zoom type: "+a);}}return a};n.zg=function(){return this.gb.Z};na("vivliostyle.viewer.Viewer",Cx);Cx.prototype.setOptions=Cx.prototype.jg;Cx.prototype.addListener=Cx.prototype.Pg;Cx.prototype.removeListener=Cx.prototype.Sg;Cx.prototype.loadDocument=Cx.prototype.Bg;Cx.prototype.loadEPUB=Cx.prototype.Qg;
Cx.prototype.getCurrentPageProgression=Cx.prototype.dc;Cx.prototype.navigateToPage=Cx.prototype.Eg;Cx.prototype.navigateToInternalUrl=Cx.prototype.Dg;Cx.prototype.isTOCVisible=Cx.prototype.Pc;Cx.prototype.showTOC=Cx.prototype.Sc;Cx.prototype.queryZoomFactor=Cx.prototype.Rg;Cx.prototype.getPageSizes=Cx.prototype.zg;na("vivliostyle.viewer.ZoomType",nv);nv.FIT_INSIDE_VIEWPORT="fit inside viewport";na("vivliostyle.viewer.PageViewMode",Pu);Pu.SINGLE_PAGE="singlePage";Pu.SPREAD="spread";
Pu.AUTO_SPREAD="autoSpread";Iv.call(Uu,"load_vivliostyle","end",void 0);var Ex=16,Fx="ltr";function Gx(a){window.adapt_command(a)}function Hx(){Gx({a:"moveTo",where:"ltr"===Fx?"previous":"next"})}function Ix(){Gx({a:"moveTo",where:"ltr"===Fx?"next":"previous"})}
function Jx(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)Gx({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)Gx({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)Gx({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)Gx({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)Ix(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)Hx(),a.preventDefault();else if("0"===b||"U+0030"===c)Gx({a:"configure",fontSize:Math.round(Ex)}),a.preventDefault();else if("t"===b||"U+0054"===c)Gx({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)Ex*=1.2,Gx({a:"configure",fontSize:Math.round(Ex)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)Ex/=1.2,Gx({a:"configure",
fontSize:Math.round(Ex)}),a.preventDefault()}
function Kx(a){switch(a.t){case "loaded":a=a.viewer;var b=Fx=a.dc();a.fe.setAttribute("data-vivliostyle-page-progression",b);a.fe.setAttribute("data-vivliostyle-spread-view",a.$.ub);window.addEventListener("keydown",Jx,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",Hx,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",Ix,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(Ga(location.href,Ua(a||"")));break;case "hyperlink":a.internal&&Gx({a:"moveTo",url:a.href})}}
na("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||Ea("f"),c=a&&a.epubURL||Ea("b"),d=a&&a.xmlURL||Ea("x"),e=a&&a.defaultPageWidth||Ea("w"),f=a&&a.defaultPageHeight||Ea("h"),g=a&&a.defaultPageSize||Ea("size"),h=a&&a.orientation||Ea("orientation"),l=Ea("spread"),l=a&&a.spreadView||!!l&&"false"!=l,k=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:l,pageBorder:1};var m;if(e&&f)m=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(m=g,"landscape"===h&&(m=m?m+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+m+"; margin: 0; }",document.head.appendChild(g));rv(new Qu(window,k,"main",Kx),a)});
    return enclosingObject.vivliostyle;
}.bind(window));




}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[5]);
