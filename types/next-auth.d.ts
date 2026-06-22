import { DefaultSession } from "next-auth";

declare module 'next-auth' {
    export interface Session{
        user: {
            role: string;
        } & DefaultSession['user']
    }
    export interface User {
        role?: string;
    }
}

declare module '@auth/core/jwt' {
    interface JWT {
        id?: string;
        role?: string;
    }
}