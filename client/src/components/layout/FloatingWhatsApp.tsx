import { whatsappDigits, whatsappHref } from '@/lib/whatsapp';

const DEFAULT_PHONE = '03079036369';

function WhatsAppIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.55 2 2.08 6.45 2.08 11.94c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a10 10 0 0 0 4.79 1.22h.01c5.49 0 9.96-4.45 9.96-9.94 0-2.65-1.04-5.15-2.96-7zM12.05 20.15h-.01a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.27-4.4c0-4.54 3.72-8.24 8.29-8.24 2.21 0 4.29.86 5.85 2.42a8.18 8.18 0 0 1 2.43 5.83c0 4.55-3.73 8.26-8.27 8.26zm4.54-6.19c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.8-.79.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29z" />
    </svg>
  );
}

export function FloatingWhatsApp({ phone }: { phone?: string | null }) {
  const digits = whatsappDigits(phone?.trim() || DEFAULT_PHONE);
  const href = whatsappHref(digits, 'Hi SMART EDGE, I need help with phone covers.');
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with SMART EDGE on WhatsApp"
      className="fixed bottom-5 right-4 z-[70] inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/25 transition hover:scale-105 hover:bg-[#1ebe5d] sm:bottom-6 sm:right-6 sm:size-16"
    >
      <WhatsAppIcon size={30} />
    </a>
  );
}
