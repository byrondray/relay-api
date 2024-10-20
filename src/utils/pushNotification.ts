import fetch from "node-fetch";

export const sendPushNotification = async (
  expoPushToken: string,
  messageText: string,
  senderId: string
) => {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: "New Message",
    body: messageText,
    data: { senderId },
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const responseData = await response.json();
    console.log("Successfully sent message:", responseData);
  } catch (error) {
    console.error("Error sending push notification via Expo:", error);
  }
};
