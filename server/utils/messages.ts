import moment from "moment";
import { type } from "os";

export type Message = {
  username: string;
  text: string;
};

export function formatMessage(username: string, text: string) {
  return {
    username,
    text,
    time: moment().format("h:mm a"),
  };
}
