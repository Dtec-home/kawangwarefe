/**
 * Share links for campaign pages and the WhatsApp contributor list
 * (Fundraising S0, shared by every UI lane).
 */

export interface ShareLinks {
  whatsapp: string;
  facebook: string;
  x: string;
  sms: string;
}

/** WhatsApp (app on mobile, WhatsApp Web on desktop) with `text` pre-filled. */
export function whatsappTextUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildShareLinks({ url, text }: { url: string; text: string }): ShareLinks {
  const withLink = `${text} ${url}`;
  return {
    whatsapp: whatsappTextUrl(withLink),
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    x: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    sms: `sms:?&body=${encodeURIComponent(withLink)}`,
  };
}
