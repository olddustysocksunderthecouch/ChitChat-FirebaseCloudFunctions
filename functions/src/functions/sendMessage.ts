import { Handlers } from './handlers'
import { NotificationsService } from './sendNotification'

export default (functions, admin) => async (data, context) => {
  const { message } = data

  if (!(typeof message === 'string') || message.length === 0) {
    return Handlers.error('invalid-argument', {
      reason: 'The function must be called with one arguments "text" containing the message text to add.'
    }, 500)
  }

  if (!context.auth) {
    return Handlers.triggerAuthorizationError()
  }

  const { uid, displayName } = context.auth
  const timestamp = (new Date()).getTime()
  const databaseReference = (path: string) => admin.database().ref(path)
  const recipientUID = data.recipient_uid
  let chatID

  const previewObject = {
    last_message: data.message,
    unread_message_count: 0,
    sender_name: displayName || 'Unknown',
    sender_uid: uid,
    status: 'sent',
    timestamp
  }

  const contactHasExistingChat = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      return databaseReference(`existing_chats/${uid}`).once('value').then(chats => {
        const chatsSnapshot = chats.val()

        const snapshotContainsUserID = () => {
          if (chatsSnapshot) {
            const snapshotChatIDs = Object.keys(chatsSnapshot)
            return snapshotChatIDs.length && snapshotChatIDs.indexOf(data.recipient_uid) !== -1 
          }

          return false   
        }

        const chatExists = snapshotContainsUserID()
  
        if (chatExists) {
          chatID = chatsSnapshot[data.recipient_uid]
        }

        resolve(chatsSnapshot && chatExists)
      }).catch(error => {
        reject(error)
      })
    })
  }
  
  const addNewContactToExistingChats = async (): Promise<any> => {
    try {
      await databaseReference(`existing_chats/${uid}`).update({
        [recipientUID]: chatID
      })
  
      return databaseReference(`existing_chats/${recipientUID}`).update({
        [uid]: chatID
      })
    } catch(error) {
      Handlers.error('Could not add contact to chat', {
        reason: 'Unknown'
      }, 500)
    }
  }

  const createNewChatPreview = (): Promise<any> => {
    return databaseReference(`chat_preview/${uid}`).push(previewObject).then(snapshot => {
      chatID = snapshot.key
      return databaseReference(`chat_preview/${recipientUID}/${chatID}`).update(previewObject)
    })
  }

  const updateExistingChatPreview = (): Promise<any> => {
    return databaseReference(`chat_preview/${uid}/${chatID}`).update(previewObject)
  }

  const addChatMembers = (): Promise<any> => {
    return databaseReference(`chat_members/${chatID}`).update({
      [uid]: true,
      [recipientUID]: true
    })
  }

  try {
    const chatExists = await contactHasExistingChat()

    if (chatExists) {
      try {
        await updateExistingChatPreview()
        NotificationsService.sendNotifications(admin, uid, data.message, chatID, displayName)
  
        return Handlers.success('Chat preview updated', {
          chat_id: chatID
        }, 200)
      } catch(error) {
        return Handlers.error('Could not create chat', error, 500)
      }
    } else {
      try {
        await createNewChatPreview()
        await addChatMembers()
        await addNewContactToExistingChats()
  
        return Handlers.success('New chat was successfully created', {
          chat_id: chatID
        }, 200)
      } catch(error) {
        return Handlers.error('Could not create chat', error, 500)
      }
    }
  } catch (error) {
    return Handlers.error('Could not create chat', error, 500)
  }
}
