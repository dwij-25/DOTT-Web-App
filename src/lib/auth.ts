import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // NOTE: adapter removed — PrismaAdapter conflicts with strategy:"jwt" and
  // causes /api/auth/session to return HTML instead of JSON (CLIENT_FETCH_ERROR).
  // User data is fetched directly inside the session callback via prisma instead.
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("User not found or using Google Auth");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return user;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        
        // Fetch custom user fields
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            dott_handle: true,
            tier: true,
            total_orders: true,
            points: true,
            name: true,
          }
        });

        if (dbUser) {
          session.user.dott_handle = dbUser.dott_handle;
          session.user.tier = dbUser.tier;
          session.user.name = dbUser.name;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          });
          if (dbUser) {
            token.sub = dbUser.id;
          } else {
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || null,
                avatar_url: user.image || null,
                role: "USER"
              }
            });
            token.sub = newUser.id;
          }
        } else {
          token.sub = user.id;
        }
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
};
