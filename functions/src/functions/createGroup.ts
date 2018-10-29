import { Handlers } from './handlers'

export default (functions, admin) => async (data, context) => {

  if (!context.auth) {
		return Handlers.triggerAuthorizationError()
  }

  const databaseReference = (path: string) => admin.database().ref(path)
  const { uid, displayName } = context.auth
  const { uids } = data
  const timestamp: number = (new Date()).getTime()

  const previewObject = {
    last_message: `${displayName} just created a group`,
    unread_message_count: 0,
    sender_name: data.group_name,
    sender_uid: uid,
    status: 'sent',
    timestamp,
    is_group: true
  }

  const createGroupNode = (chatId: string): Promise<any> => {
    return databaseReference(`groups/${chatId}`).update({
      title: data.group_name,
      date_created: timestamp,
      creator: `displayName`,
      profile_picture: data.profile_picture
    })
  }

  const addChatMembers = (userIDs: any, chatId: string): Promise<any> => {
    return databaseReference(`chat_members/${chatId}`).update(userIDs)
  }

  const createNewChatPreviewForGroupCreator = (): Promise<any> => {
    return databaseReference(`chat_preview/${uid}`).push(previewObject)
  }

  const createNewChatPreview = (userID: string, chatId: string): Promise<any> => {
    return databaseReference(`chat_preview/${userID}/${chatId}`).update(previewObject)
  }

  try {
    const createChatPreview = await createNewChatPreviewForGroupCreator()
    const chatID: string = createChatPreview.key
    const uidsObject = {}

    uids.forEach(async (userID: string) => {
      await createNewChatPreview(userID, chatID)
      uidsObject[userID] = true
    })

    await createGroupNode(chatID)
    await addChatMembers(uidsObject, chatID)
    return Handlers.success('Group successfully created', null, 204)
  } catch (error) {
    return Handlers.error('Could not add members', error, 500)
  }
}
