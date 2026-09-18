export function shouldResetAdminWorkspace(
  currentUserId: string | null,
  nextUserId: string | null,
) {
  return currentUserId !== nextUserId
}
