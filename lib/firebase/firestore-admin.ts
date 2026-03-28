import { getFirestore } from 'firebase-admin/firestore';
import { getAdminAuth } from './admin';

/**
 * Returns the Firestore admin instance.
 * Ensures the admin app is initialised first.
 */
export function getAdminFirestore() {
    // getAdminAuth() triggers initializeApp if needed
    getAdminAuth();
    return getFirestore();
}
