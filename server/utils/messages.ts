import moment from "moment";

export type Message = {
  username: string;
  text: string;
};

export type SavedData = {
  room: string;
  message: Message;
  time: Date;
};

export function formatMessage(username: string, text: string) {
  return {
    username,
    text,
    time: moment().format("h:mm a"),
  };
}
