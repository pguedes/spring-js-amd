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
    "./DefaultEquals"
],
    function (declare, dom, registry, lang, locale, kernel, topic, event) {

        return declare("Spring.ValidateAllDecoration", [Spring.AbstractValidateAllDecoration, Spring.DefaultEquals], {
            constructor: function (config) {
                this.originalHandler = null;
                this.connection = null;
                lang.mixin(this, config);
            },

            apply: function () {
                var element = dom.byId(this.elementId);
                if (!element) {
                    console.error("Could not apply ValidateAll decoration.  Element with id '" + this.elementId + "' not found in the DOM.");
                } else {
                    this.originalHandler = element[this.event];
                    var context = this;
                    element[this.event] = function (event) {
                        context.handleEvent(event, context);
                    };
                }
                return this;
            },

            cleanup: function () {
                this.connection.remove();
            },

            handleEvent: function (evt, context) {
                if (!Spring.validateAll()) {
                    topic.publish(this.elementId + "/validation", false);
                    event.stop(evt);
                } else {
                    topic.publish(this.elementId + "/validation", true);
                    if (lang.isFunction(context.originalHandler)) {
                        var result = context.originalHandler(event);
                        if (result == false) {
                            event.stop(evt);
                        }
                    }
                }
            }
        });
    });