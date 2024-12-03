import { queryOpenAI } from "./langchain/langchain";
import { sendPushNotification } from "./pushNotification";

interface CarpoolNotificationParams {
  senderId: string;
  driverName: string;
  nextStop: string;
  nextStopTime: string;
  currentLocation: string;
  destination: string;
  parentName: string;
  parentExpoToken: string;
  childrenNames: string[];
}

export const sendCarpoolNotification = async ({
  senderId,
  driverName,
  nextStop,
  nextStopTime,
  currentLocation,
  destination,
  parentName,
  parentExpoToken,
  childrenNames,
}: CarpoolNotificationParams) => {
  const childList = childrenNames.join(", ");
  const prompt = `
  Write a short and friendly notification for a parent named ${parentName}.
  The carpool is driven by ${driverName}. The driver is currently near ${nextStop} and will arrive at the next stop in approximately ${nextStopTime}.
  The children (${childList}) are in the carpool, heading towards ${destination}.
  Limit the response to two sentences.
`;

  try {
    const aiResponse = await queryOpenAI(prompt);
    const messageContent: string =
      typeof aiResponse?.content === "string"
        ? aiResponse.content
        : `Your carpool update: Driver ${driverName} is heading to ${nextStop} at ${nextStopTime}.`;

    await sendPushNotification(
      parentExpoToken,
      messageContent,
      senderId,
      "Carpool Update"
    );

    console.log("Carpool notification sent successfully!");
    return messageContent;
  } catch (error) {
    console.error("Error sending carpool notification:", error);
  }
};

interface CarpoolEndNotificationParams {
  senderId: string;
  driverName: string;
  destination: string;
  parentName: string;
  parentExpoToken: string;
  childrenNames: string[];
}

export const sendCarpoolEndNotification = async ({
  senderId,
  driverName,
  destination,
  parentName,
  parentExpoToken,
  childrenNames,
}: CarpoolEndNotificationParams) => {
  const childList = childrenNames.join(", ");
  const prompt = `
  Write a short and friendly notification for a parent named ${parentName}.
  The carpool, driven by ${driverName}, has ended. The children (${childList}) have arrived safely at ${destination}.
  Limit the response to two sentences.
`;

  try {
    const aiResponse = await queryOpenAI(prompt);
    const messageContent: string =
      typeof aiResponse?.content === "string"
        ? aiResponse.content
        : `The carpool, driven by ${driverName}, has ended. ${childList} have arrived safely at ${destination}.`;

    await sendPushNotification(
      parentExpoToken,
      messageContent,
      senderId,
      "Carpool Completed"
    );

    console.log("Carpool end notification sent successfully!");
    return messageContent;
  } catch (error) {
    console.error("Error sending carpool end notification:", error);
  }
};
