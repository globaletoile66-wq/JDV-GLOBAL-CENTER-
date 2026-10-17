import { redirect } from 'next/navigation';

// L'ancien « QR code » (un simple espace réservé) est remplacé par un vrai QR code sur la page « Recevoir ».
export default function Page() { redirect('/pay/receive'); }
