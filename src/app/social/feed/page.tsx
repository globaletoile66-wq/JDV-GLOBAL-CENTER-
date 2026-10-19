import { redirect } from 'next/navigation';

// Preserve the existing /social workspace while supporting the specification's /social/feed route.
export default function SocialFeedRoute() {
  redirect('/social');
}
