import type { NextAuthConfig } from 'next-auth'

// Edge-safe config — no Prisma, no bcryptjs
// Used by middleware to verify JWT without hitting the database
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/sign-in' },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (typeof token.id === 'string') session.user.id = token.id
      return session
    },
  },
}
