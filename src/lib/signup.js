/**
 * Whether new accounts may be made. Open unless `DISABLE_SIGNUP` is `true` (any case): unset,
 * empty or any other value leaves sign-up open. Existing accounts sign in either way.
 */
export function parseSignUpDisabled(raw) {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

export const signUpDisabled = parseSignUpDisabled(process.env.DISABLE_SIGNUP);
