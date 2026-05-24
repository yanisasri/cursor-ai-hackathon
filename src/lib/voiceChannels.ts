import type { PersonalRoomAccess } from "../types";

export function livingVoiceChannelId(roomId: string): string {
  return `voice:${roomId}:living`;
}

export function personalVoiceChannelId(roomId: string, ownerId: string): string {
  return `voice:${roomId}:personal:${ownerId}`;
}

export function livingVoiceParticipants(memberIds: string[]): string[] {
  return memberIds;
}

export function personalVoiceParticipants(
  roomId: string,
  ownerId: string,
  accessList: PersonalRoomAccess[]
): string[] {
  const access = accessList.find((a) => a.roomId === roomId && a.ownerId === ownerId);
  if (!access) return [ownerId];
  const ids = [ownerId];
  if (access.activeGuestId) ids.push(access.activeGuestId);
  return ids;
}
