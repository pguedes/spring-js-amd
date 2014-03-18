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
    "dojo/topic",
    "dojo/_base/event",
    "dojo/on",
    "dojo/string",
    "dojo/request/xhr",
    "dojo/_base/window",
    "dojo/dom-class",
    "dojo/query",
    "./DefaultEquals"
],
    function (declare, dom, registry, lang, locale, topic, event, on, string, xhr, win, domClass, query) {

        return declare("Spring.CommandLinkDecoration", [Spring.AbstractCommandLinkDecoration, Spring.DefaultEquals], {
            constructor: function (config) {
                lang.mixin(this, config);
            },

            apply: function () {
                var advisedNode = dom.byId(this.elementId);
                if (!domClass.contains(advisedNode, "progressiveLink")) {
                    //Node must be replaced
                    var nodeToReplace = new query.NodeList(advisedNode);
                    nodeToReplace.addContent(this.linkHtml, "after").orphan("*");
                    //Get the new node
                    advisedNode = dom.byId(this.elementId);
                }
                advisedNode.submitFormFromLink = this.submitFormFromLink;
                //return this to support method chaining
                return this;
            },

            submitFormFromLink: function (/*String*/ formId, /*String*/ sourceId, /*Array of name,value params*/ params) {

                require(["dojo/_base/array", "dojo/dom-construct"], function (array, builder) {
                    var addedNodes = [];
                    var formNode = dom.byId(formId);
                    var linkNode = document.createElement("input");
                    linkNode.name = sourceId;
                    linkNode.value = "submitted";
                    addedNodes.push(linkNode);

                    array.forEach(params, function (param) {
                        var paramNode = document.createElement("input");
                        paramNode.name = param.name;
                        paramNode.value = param.value;
                        addedNodes.push(paramNode);
                    });

                    array.forEach(addedNodes, function (nodeToAdd) {
                        domClass.addClass(nodeToAdd, "SpringLinkInput");
                        builder.place(nodeToAdd, formNode, "last");
                    });

                    if ((formNode.onsubmit ? !formNode.onsubmit() : false) || !formNode.submit()) {
                        array.forEach(addedNodes, function (hiddenNode) {
                            hiddenNode.parentNode.removeChild(hiddenNode);
                        });
                    }
                });
            }
        });
    });