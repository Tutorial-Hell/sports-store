import NextAuth, { type DefaultSession } from 'next-auth'
import {PrismaAdapter} from '@auth/prisma-adapter'
import { prisma } from '@/db/prisma'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compareSync } from 'bcrypt-ts-edge'
import type {NextAuthConfig} from 'next-auth'
import { cookies} from 'next/headers'
import { NextResponse } from 'next/server'

declare module 'next-auth' {
    interface User {
        role?: string
    }
    interface Session {
        user: { role?: string } & DefaultSession['user']
    }
}

declare module '@auth/core/jwt' {
    interface JWT {
        role?: string
    }
}

export const config = {
    pages: {
        signIn: '/sign-in',
        error: '/sign-in'
    },
    session: {
        strategy: 'jwt',
        maxAge:30 * 24 * 60 * 60, // 30 days
    },
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            credentials: {
                email: {type: 'email'},
                password: {type: 'password'}
            },
            async authorize(credentials) {
                if(credentials == null) return null

                const user = await prisma.user.findFirst({
                    where: {
                        email: credentials.email as string
                    }
                })

                if(user && user.password) {
                    const isMatch = compareSync(credentials.password as string, user.password)

                    if(isMatch) {
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role
                        }
                    }
                }
                return null
            }
        })
    ],
    callbacks: {
        async session({session, user, trigger, token}: any) {

            session.user.id = token.sub
            session.user.role = token.role
            session.user.name = token.name

            if(trigger === 'update') {
                session.user.name = user.name
            }

            return session
        },
        async jwt({token, user, trigger, session}) {
            // assign user fields to the token
            if(user) {
                token.id = user.id
                token.role = user.role

                if(user.name === "NO_NAME") {
                    token.name = user.email!.split('@')[0]

                    await prisma.user.update({
                        where: {id: user.id},
                        data: {name: token.name}
                    })
                }
                if(trigger === 'signIn' || trigger === 'signUp') {
                    const cookiesObject = await cookies()
                    const sessionCartId = cookiesObject.get('sessionCartId')?.value

                    if(sessionCartId) {
                        const sessionCart = await prisma.cart.findFirst({
                            where: { sessionCartId }
                        })
                        if(sessionCart){
                            // Delete current user Cart 
                            await prisma.cart.deleteMany({
                                where: {userId: user.id}
                            })

                            // Assign new Cart
                            await prisma.cart.update({
                                where: {id: sessionCart.id},
                                data: {userId: user.id}
                            })

                        }
                    }

                }
            }
            return token
        },
       async authorized({request, auth}: any) {
            // Array of regex patterns for protected paths
            const protectedPaths = [
                /\/shipping-address/,
                /\/payment-method/,
                /\/place-order/,
                /\/profile/,
                /\/user\/(.*)/,
                /\/order\/(.*)/,
                /\/admin/,
            ]
            // get pathname from request url object
            const {pathname} = request.nextUrl

            // Check if user is not authenticated and redirect with callbackUrl
            if(!auth && protectedPaths.some((p) => p.test(pathname))) {
                return NextResponse.redirect(
                    new URL(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`, request.url)
                )
            }

            if(!request.cookies.get('sessionCartId')) {
                // Generate new sessionCartId Cookie
                const sessionCartId = crypto.randomUUID()

                // Clone the req headers
                const newRequestHeaders = new Headers(request.headers)

                //Create new response and add the new headers
                const response = NextResponse.next({
                    request: {
                        headers: newRequestHeaders
                    }
                })
               //Set newly generated sessionCartId in the response cookies
               response.cookies.set("sessionCartId", sessionCartId)

               return response
            } else {
                return true
            }
            
        }
    }

} satisfies NextAuthConfig

export const {handlers, auth, signIn, signOut} = NextAuth(config)