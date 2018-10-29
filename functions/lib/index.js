/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const functions_1 = require("./functions");
admin.initializeApp();
exports.addDeviceToken = functions.https.onCall(functions_1.addDeviceToken(functions, admin));
exports.createAccount = functions.https.onCall(functions_1.createAccount(functions, admin));
exports.sendMessage = functions.https.onCall(functions_1.sendMessage(functions, admin));
exports.createGroup = functions.https.onCall(functions_1.createGroup(functions, admin));
exports.addUnreadMessage = functions.database.ref('/messages/{chatID}/{messageID}').onWrite(functions_1.addUnreadMessage);
//# sourceMappingURL=index.js.map