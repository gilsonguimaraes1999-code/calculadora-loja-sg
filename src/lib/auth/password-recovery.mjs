export function isPasswordRecoveryUrl(value) {
  try {
    return new URL(value).searchParams.get("mode") === "recovery";
  } catch {
    return false;
  }
}
