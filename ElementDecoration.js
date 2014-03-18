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
    "./DefaultEquals"
],
    function (declare, dom, registry, lang, dateFormat) {

        return declare("Spring.ElementDecoration", [Spring.AbstractElementDecoration, Spring.DefaultEquals], {
            constructor: function (config) {
                this.widgetAttrs = {};
                this.copyFields = new Array('name', 'value', 'type', 'checked', 'selected', 'readOnly', 'disabled', 'alt', 'maxLength', 'class', 'title');
                lang.mixin(this, config);
                this.element = dom.byId(this.elementId);
                this.elementId = lang.isString(this.elementId) ? this.elementId : this.elementId.id;
                if (this.widgetModule == "") {
                    this.widgetModule = this.widgetType;
                }
            },

            apply: function () {
                if (registry.byId(this.elementId)) {
                    registry.byId(this.elementId).destroyRecursive(false);
                }

                if (!this.element) {
                    console.error("Could not apply " + this.widgetType + " decoration.  Element with id '" + this.elementId + "' not found in the DOM.");
                }
                else {
                    /*
                     * dijit.form.DateTextBox uses locale information when displaying a date and a
                     * fixed date format when parsing or serializing date values coming from the
                     * server-side. There is no way configure it to use a single date pattern,
                     * which is the reason for the code below.
                     */
                    var datePattern = this.widgetAttrs['datePattern'];
                    if (datePattern && this.widgetType == 'dijit.form.DateTextBox') {
                        if (!this.widgetAttrs['value']) {
                            // Help dijit.form.DateTextBox parse the server side date value.
                            this.widgetAttrs['value'] = dateFormat.parse(this.element.value, {selector: "date", datePattern: datePattern});
                        }
                        if (!this.widgetAttrs['serialize']) {
                            // Help dijit.form.DateTextBox format the date to send to the server side.
                            this.widgetAttrs['serialize'] = function (d, options) {
                                return dateFormat.format(d, {selector: "date", datePattern: datePattern});
                            }
                        }
                        // Add a constraint that specifies the date pattern to use when displaying a date
                        // but don't interfere with any constraints that may have been specified.
                        if (!this.widgetAttrs['constraints']) {
                            this.widgetAttrs['constraints'] = {};
                        }
                        if (!this.widgetAttrs['constraints'].datePattern) {
                            this.widgetAttrs['constraints'].datePattern = datePattern;
                        }
                    }
                    for (var copyField in this.copyFields) {
                        copyField = this.copyFields[copyField];
                        if (!this.widgetAttrs[copyField] && this.element[copyField] &&
                            (typeof this.element[copyField] != 'number' ||
                                (typeof this.element[copyField] == 'number' && this.element[copyField] >= 0))) {
                            this.widgetAttrs[copyField] = this.element[copyField];
                        }
                    }
                    if (this.element['style'] && this.element['style'].cssText) {
                        this.widgetAttrs['style'] = this.element['style'].cssText;
                    }

                    this.widgetModule = this.widgetModule.split('.').join('/');
                    require([this.widgetModule], lang.hitch(this, function(widgetConstructor){
                        this.widget = new widgetConstructor(this.widgetAttrs, this.elementId);
                        this.widget.startup();
                    }));
                }
                //return this to support method chaining
                return this;
            },

            validate: function () {
                if (!this.widget.isValid) {
                    // some widgets cannot be validated
                    return true;
                }
                var isValid = this.widget.isValid(false);
                if (!isValid) {
                    this.widget.state = "Error";
                    this.widget._setStateClass();
                }
                return isValid;
            }
        });

    });