import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { createServerSupabaseClient } from './supabase';
import { isAdminEmail } from './admin';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = createServerSupabaseClient();
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email as string)
          .single();

        if (!user || !user.hashedPassword) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      try {
        const targetUrl = new URL(url);
        const currentBaseUrl = new URL(baseUrl);
        if (targetUrl.origin === currentBaseUrl.origin) {
          return url;
        }
      } catch {
        // Fall through to the safe default below.
      }

      return `${baseUrl}/dashboard`;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const supabase = createServerSupabaseClient();
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email!)
          .single();

        if (existingUser) {
          user.id = existingUser.id;
        } else {
          const { data: newUser } = await supabase
            .from('users')
            .insert({
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (!newUser) return false;
          user.id = newUser.id;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = isAdminEmail(user.email);
      }
      if (token.email) {
        token.isAdmin = isAdminEmail(token.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
});
