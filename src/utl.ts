/**
 * Helper function to encode email headers containing non-ASCII characters
 * according to RFC 2047 MIME specification
 */
function encodeEmailHeader(text: string): string {
  // Only encode if the text contains non-ASCII characters
  if (/[^\x00-\x7F]/.test(text)) {
    // Use MIME Words encoding (RFC 2047)
    return "=?UTF-8?B?" + Buffer.from(text).toString("base64") + "?=";
  }
  return text;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function createEmailMessage(validatedArgs: any): string {
  const encodedSubject = encodeEmailHeader(validatedArgs.subject);

  (validatedArgs.to as string[]).forEach((email) => {
    if (!validateEmail(email)) {
      throw new Error(`Recipient email address is invalid: ${email}`);
    }
  });

  const emailParts = [
    "From: me",
    `To: ${validatedArgs.to.join(", ")}`,
    validatedArgs.cc ? `Cc: ${validatedArgs.cc.join(", ")}` : "",
    validatedArgs.bcc ? `Bcc: ${validatedArgs.bcc.join(", ")}` : "",
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
  ].filter(Boolean);

  emailParts.push("");
  emailParts.push(validatedArgs.body);

  return emailParts.join("\r\n");
}

export function adaptMessagePart(part: Schema$MessagePart): GmailMessagePart {
  return {
    partId: part.partId ?? undefined, // 将 null 转换为 undefined
    mimeType: part.mimeType,
    filename: part.filename,
    headers: part.headers,
    body: part.body
      ? {
          attachmentId: part.body.attachmentId,
          size: part.body.size,
          data: part.body.data,
        }
      : undefined,
    parts: part.parts ? part.parts.map(adaptMessagePart) : undefined, // 递归处理子部分
  };
}

