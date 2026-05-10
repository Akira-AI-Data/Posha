function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function signBillingAccessEdge(plan: string, email: string, secret: string) {
  const data = new TextEncoder().encode(`${plan}:${email.trim().toLowerCase()}:${secret}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
}

