export const dynamic = 'force-dynamic';
import { PostsView } from '@postmill-ai/frontend/components/launches/posts-view';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: `Postmill Posts`,
  description: '',
};
export default async function Index() {
  return <PostsView />;
}
