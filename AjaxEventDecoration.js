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
    "./DefaultEquals"
],
    function (declare, dom, registry, lang, locale, kernel, topic, event, on) {

        return declare("Spring.AjaxEventDecoration", [Spring.AbstractAjaxEventDecoration, Spring.DefaultEquals], {
            constructor: function (config) {
                this.validationSubscription = null;
                this.connection = null;
                this.allowed = true;
                lang.mixin(this, config);
            },

            apply: function () {

                var element = registry.byId(this.elementId) ? registry.byId(this.elementId) : dom.byId(this.elementId);
                if (!element) {
                    console.error("Could not apply AjaxEvent decoration.  Element with id '" + this.elementId + "' not found in the DOM.");
                } else {
                    this.validationSubscription = topic.subscribe(this.elementId + "/validation", this, "_handleValidation");
                    this.connection = on(element, this.event, this, "submit");
                }
                return this;
            },

            cleanup: function () {
                this.validationSubscription.remove();
                this.connection.remove();
            },

            submit: function (evt) {
                if (this.sourceId == "") {
                    this.sourceId = this.elementId;
                }
                if (this.formId == "") {
                    Spring.remoting.getLinkedResource(this.sourceId, this.params, this.popup);
                } else {
                    if (this.allowed) {
                        Spring.remoting.submitForm(this.sourceId, this.formId, this.params);
                    }
                }
                event.stop(evt);
            },

            _handleValidation: function (success) {
                if (!success) {
                    this.allowed = false;
                } else {
                    this.allowed = true;
                }
            }
        });
    });