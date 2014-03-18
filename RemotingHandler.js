/*
 * Copyright 2004-2008 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define([
    "dojo/_base/declare",
    "dojo/dom",
    "dijit/registry",
    "dojo/_base/lang",
    "dojo/date/locale",
    "dojo/_base/kernel",
    "dojo/topic",
    "dojo/_base/event",
    "dojo/on",
    "dojo/string",
    "dojo/request/xhr",
    "dojo/_base/window",
    "dojo/query"
],
    function (declare, dom, registry, lang, locale, kernel, topic, event, on, string, xhr, win, query) {

        return declare("Spring.RemotingHandler", Spring.AbstractRemotingHandler, {
            constructor: function () {
            },

            submitForm: function (/*String */ sourceId, /*String*/formId, /*Object*/ params) {
                var content = new Object();
                for (var key in params) {
                    content[key] = params[key];
                }

                var sourceComponent = dom.byId(sourceId);

                if (sourceComponent != null) {
                    if (sourceComponent.value != undefined && sourceComponent.type && ("button,submit,reset").indexOf(sourceComponent.type) < 0) {
                        content[sourceId] = sourceComponent.value;
                    }
                    else if (sourceComponent.name != undefined) {
                        content[sourceComponent.name] = sourceComponent.name;
                    } else {
                        content[sourceId] = sourceId;
                    }
                }

                if (!content['ajaxSource']) {
                    content['ajaxSource'] = sourceId;
                }

                var formNode = dom.byId(formId);
                var formMethod = string.trim(formNode.method);
                formMethod = formMethod.length > 0 ? formMethod.toUpperCase() : "GET";

                xhr(formMethod, {
                    query: content,
                    method: formMethod,
                    data: formId,
                    handleAs: "text",
                    headers: {"Accept": "text/html;type=ajax"}
                    // The LOAD function will be called on a successful response.
                    // The ERROR function will be called in an error case.
                }).then(this.handleResponse, this.handleError);

            },

            getLinkedResource: function (/*String */ linkId, /*Object*/params, /*boolean*/ modal) {
                this.getResource(dom.byId(linkId).href, params, modal);
            },

            getResource: function (/*String */ resourceUri, /*Object*/params, /*boolean*/ modal) {

                xhr.get(resourceUri, {
                    query: params,
                    handleAs: "text",
                    headers: {"Accept": "text/html;type=ajax"},
                    modal: modal
                }).then(this.handleResponse, this.handleError);
            },

            handleResponse: function (response, ioArgs) {

                //First check if this response should redirect
                var redirectURL = ioArgs.xhr.getResponseHeader('Spring-Redirect-URL');
                var modalViewHeader = ioArgs.xhr.getResponseHeader('Spring-Modal-View');
                var modalView = ((lang.isString(modalViewHeader) && modalViewHeader.length > 0) || ioArgs.args.modal);

                if (lang.isString(redirectURL) && redirectURL.length > 0) {
                    if (modalView) {
                        //render a popup with the new URL
                        Spring.remoting._renderURLToModalDialog(redirectURL);
                        return response;
                    }
                    else {
                        if (redirectURL.indexOf("/") >= 0) {
                            window.location = window.location.protocol + "//" + window.location.host + redirectURL;
                        } else {
                            var location = window.location.protocol + "//" + window.location.host + window.location.pathname;
                            var appendIndex = location.lastIndexOf("/");
                            location = location.substr(0, appendIndex + 1) + redirectURL;
                            if (location == window.location) {
                                Spring.remoting.getResource(location, ioArgs.args.content, false);
                            }
                            else {
                                window.location = location;
                            }
                        }
                        return response;
                    }
                } else if ((string.trim(response).length == 0) && (ioArgs.xhr.status != 204) && (ioArgs.xhr.status != 205)) {
                    if (Spring.debug) {
                        Spring.remoting.showError('Received empty response with no Spring redirect headers. If this is intentional set the response status code to 204 or 205.');
                    }
                }

                //Extract and store all <script> elements from the response
                var scriptPattern = '(?:<script(.|[\n|\r])*?>)((\n|\r|.)*?)(?:<\/script>)';
                var extractedScriptNodes = [];
                var matchAll = new RegExp(scriptPattern, 'img');
                var matchOne = new RegExp(scriptPattern, 'im');

                var scriptNodes = response.match(matchAll);
                if (scriptNodes != null) {
                    for (var i = 0; i < scriptNodes.length; i++) {
                        var script = (scriptNodes[i].match(matchOne) || ['', '', ''])[2];
                        script = script.replace(/<!--/mg, '').replace(/\/\/-->/mg, '').replace(/<!\[CDATA\[(\/\/>)*/mg, '').replace(/(<!)*\]\]>/mg, '');
                        extractedScriptNodes.push(script);
                    }
                }
                // Remove scripts but don't remove scripts entirely (see SWF-1358)
                response = response.replace(matchAll, '<script> // Original script removed to avoid re-execution </script>');

                if (modalView) {
                    //For a modal view, just dump the response into a modal dialog
                    Spring.remoting._renderResponseToModalDialog(response);
                } else {
                    //Extract the new DOM nodes from the response
                    var tempSpan = win.doc.createElement("span");
                    tempSpan.id = "ajaxResponse";
                    tempSpan.style.display = "none";
                    document.body.appendChild(tempSpan);
                    tempSpan.innerHTML = response;

                    require(["dojo/query", "dijit/registry"], function (query, registry) {
                        var tempContainer = new query.NodeList(tempSpan);
                        var newNodes = tempContainer.query(">").orphan();
                        tempContainer.orphan();

                        //Insert the new DOM nodes and update the Form's action URL
                        newNodes.forEach(function (item) {
                            if (item.id != null && item.id != "") {
                                var target = registry.byId(item.id) ? registry.byId(item.id).domNode : dom.byId(item.id);
                                if (!target) {
                                    console.error("An existing DOM elment with id '" + item.id + "' could not be found for replacement.");
                                } else {
                                    target.parentNode.replaceChild(item, target);
                                }
                            }
                        });
                    });
                }

                //Evaluate any script code
                require(["dojo/_base/array"], function (array) {
                    array.forEach(extractedScriptNodes, function (script) {
                        kernel.eval(script);
                    });
                });

                return response;
            },

            handleError: function (response, ioArgs) {
                require(["dijit/Dialog", "dojo/on"], function (Dialog, on) {
                    console.error("HTTP status code: ", ioArgs.xhr.status);

                    if (Spring.debug && ioArgs.xhr.status != 200) {
                        var dialog = new Dialog({ title: 'Ajax Request Error' });
                        on(dialog, "hide", dialog, function () {
                            this.destroyRecursive(false);
                        });
                        dialog.domNode.style.overflow = "auto";
                        dialog.setContent(ioArgs.xhr.responseText);
                        dialog.show();
                    }
                });
                return response;
            },

            showError: function (message) {
                require(["dijit/Dialog", "dojo/on"], function (Dialog, on) {
                    var dialog = new Dialog({ title: 'Error Message' });
                    on(dialog, "hide", dialog, function () {
                        this.destroyRecursive(false);
                    });
                    dialog.domNode.style.width = "500px";
                    dialog.setContent(message);
                    dialog.show();
                });
            },

            _renderURLToModalDialog: function (url) {
                Spring.remoting.getResource(url, {}, true);
            },

            _renderResponseToModalDialog: function (response) {
                require(["dijit/Dialog", "dojo/on"], function (Dialog, on) {
                    var dialog = new Dialog({});
                    dialog.setContent(response);
                    on(dialog, "hide", dialog, function () {
                        this.destroyRecursive(false);
                    });
                    dialog.show();
                });
            }
        });
    });