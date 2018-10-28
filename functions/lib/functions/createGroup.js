"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const handlers_1 = require("./handlers");
exports.default = (functions, admin) => (data, context) => __awaiter(this, void 0, void 0, function* () {
    const databaseReference = (path) => admin.database().ref(path);
    const { uid, displayName } = context.auth;
    const { uids } = data;
    const timestamp = (new Date()).getTime();
    if (!context.auth) {
        return handlers_1.Handlers.triggerAuthorizationError();
    }
    const previewObject = {
        last_message: data.message,
        unread_message_count: 0,
        sender_name: data.group_name,
        sender_uid: uid,
        status: 'sent',
        timestamp
    };
    const createGroupNode = (chatId) => {
        return databaseReference(`groups/${chatId}`).update({
            title: data.group_name,
            date_created: timestamp,
            creator: displayName,
            profile_picture: data.profile_picture
        });
    };
    const addChatMembers = (userIDs, chatId) => {
        return databaseReference(`chat_members/${chatId}`).update(userIDs);
    };
    const createNewChatPreviewCreator = () => {
        return databaseReference(`chat_preview/${uid}`).push(previewObject);
    };
    const createNewChatPreview = (userID, chatId) => {
        return databaseReference(`chat_preview/${userID}/${chatId}`).update(previewObject);
    };
    const creatorChatPreview = yield createNewChatPreviewCreator();
    const chatID = creatorChatPreview.key;
    const mappedIDs = uids.map((userID) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield createNewChatPreview(userID, chatID);
        }
        catch (error) {
            console.error(error);
        }
        return {
            userID: true
        };
    }));
    try {
        yield createGroupNode(chatID);
        yield addChatMembers(mappedIDs, chatID);
        return handlers_1.Handlers.success('Group successfully created', null, 204);
    }
    catch (error) {
        return handlers_1.Handlers.error('Could not add members', error, 500);
    }
});
//# sourceMappingURL=createGroup.js.map