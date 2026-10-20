import { redirect } from 'next/navigation';

// Keep a compatibility route for old bookmarks, but use the single unified studio.
export default function ImmoAmenagementPage() {
  redirect('/immo/conception');
}
