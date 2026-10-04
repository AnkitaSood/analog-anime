import { defineEventHandler, toWebRequest } from 'h3';
import { auth } from '../../../auth';

// Better Auth serves every /api/auth/* endpoint: sign-up, sign-in, sign-out, get-session, …
export default defineEventHandler((event) => auth.handler(toWebRequest(event)));
