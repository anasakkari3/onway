import { redirect } from 'next/navigation';

/**
 * /admin has no dashboard of its own — send it to the platform overview,
 * which self-gates on super-admin access.
 */
export default function AdminIndexPage() {
  redirect('/admin/overview');
}
