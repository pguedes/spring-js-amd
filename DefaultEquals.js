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
    "dojo/_base/declare"
],
    function (declare) {

        // assumming that whatever needs to initialize the spring/js
        // will depend on this base class and so we can init here
        require(["spring/RemotingHandler", "dojo/domReady!"], function () {
            Spring.initialize();
            console.log("spring js was initialized");
        });

        return declare("Spring.DefaultEquals", null, {
            equals: function (/*Object*/other) {
                if (other.declaredClass && other.declaredClass == this.declaredClass) {
                    return true;
                } else {
                    return false;
                }
            }
        });
    });