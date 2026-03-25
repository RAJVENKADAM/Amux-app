const { Expo } = require('expo-server-sdk');

let expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN, // Set in .env
});

exports.sendPushNotification = async (userTokens, title, body, data = {}) => {
  if (!userTokens || userTokens.length === 0) return;

  const messages = [];
  for (let pushToken of userTokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.warn(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    });
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  for (let chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(`Error sending push chunk:`, error);
    }
  }
  return tickets;
};
