import { PrismaClient } from "@prisma/client";

export class Prisma {
    private static prisma: PrismaClient;

    static getInstance(): PrismaClient {
        if (!Prisma.prisma) {
            Prisma.prisma = new PrismaClient();
        }
        return Prisma.prisma;
    }
}