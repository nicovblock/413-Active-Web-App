export const sanitizeText = (input: string): string =>
  input.replace(/[<>]/g, '').trim().slice(0, 500);
