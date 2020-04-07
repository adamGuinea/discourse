export type User = {
  id: number;
  username: string;
  room: string;
};

const users: User[] = [];

export function joinUser(id: number, username: string, room: string) {
  const user = { id, username, room };

  users.push(user);

  return user;
}

export function getCurrentUser(id: Partial<User>) {
  return users.find((user) => user.id === id);
}

export function onUserExit(id: Partial<User>) {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

export function getUsersInRoom(room: string) {
  return users.filter((user) => user.room === room);
}
