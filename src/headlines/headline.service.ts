import { GlobalState, PrismaClient } from "@prisma/client";
import { Prisma } from "../prisma/prisma";

enum HeadlineErrorType {
    NOT_FOUND = 'NOT_FOUND',
    INVALID = 'INVALID',
    UNKNOWN = 'UNKNOWN',
}
class HeadlineError extends Error {
    constructor(message: string, public type: HeadlineErrorType) {
        super(message);
    }
}

class HeadlineService {
    static async hello() {
        return 'Hello World!';
    }

    static async getHeadlines(
        limit: number = 10,
        page: number = 1,
        contains?: {
            title?: string,
        },
        equal?: {
            title?: string,
        },
    ) {
        const prisma = Prisma.getInstance();
        if (
            contains?.title && equal?.title
        ) {
            console.log("Contains and equal parameter are set, the contains parameter will be ignored")
        }
        try {
            await prisma.$connect();
            const filteredHeadlines = await prisma.headline.findMany({
                where: {
                    coverNews: {
                        title: equal?.title ? equal.title : (
                            contains?.title ? {
                                contains: contains.title,
                            } : undefined
                        )
                    },
                },
                skip: (page - 1) * (limit),
                take: limit,
                orderBy: {
                    id: 'desc',
                },
            });
            const returnedHeadlines = 
                await Promise.all(filteredHeadlines.map(
                    async (headline) => {
                    return {
                        referrer: headline.referrer,
                        headline: await prisma.news.findUnique({
                            where: {
                                headlineCoverId: headline.id,
                            },
                            select: {
                                title: true,
                                url: true,
                                publishedAt: true,
                                publisherName: true,
                                publisherLogo: true,
                                thumbnail: true,
                                excerpt: true,
                            },
                        }),
                        aggregateMetrics: await prisma.news.aggregate({
                            where: {
                                headlineNewsId: headline.id,
                            },
                            _avg: {
                                bias: true,
                                left_tendency: true,
                                right_tendency: true,
                                center_tendency: true,
                                subjectivity: true,
                            },
                        }),
                    }
                })
            );
            return {
                lastUpdated: (await prisma.state.findUnique({
                    where: {
                        key: GlobalState.LAST_SCRAPED
                    },
                    select: {
                        value: true,
                    },
                }))?.value,
                headlines: returnedHeadlines,
            }
        } catch (error) {
            if (
                error instanceof Error
            ) { 
                throw new HeadlineError(error.message, HeadlineErrorType.UNKNOWN);
            } else {
                throw new HeadlineError('Something went wrong', HeadlineErrorType.UNKNOWN);
            }
        } finally {
            await prisma.$disconnect();
        }
    }

    static async getNewsFromReferrer(referrer: string) {
        const prisma = Prisma.getInstance();
        try {
            await prisma.$connect();
            const headline = await prisma.headline.findUnique({
                where: {
                    referrer,
                },
                select: {
                    id: true,
                },
            });
            if (
                !headline
            ) {
                throw new HeadlineError('Headline not found', HeadlineErrorType.NOT_FOUND);
            }
            return {
                lastUpdated: (await prisma.state.findUnique({
                    where: {
                        key: GlobalState.LAST_SCRAPED
                    },
                    select: {
                        value: true,
                    },
                }))?.value,
                aggregateMetrics: await prisma.news.aggregate({
                    where: {
                        headlineNewsId: headline.id,
                    },
                    _avg: {
                        bias: true,
                        left_tendency: true,
                        right_tendency: true,
                        center_tendency: true,
                        subjectivity: true,
                    },
                }),
                news: await prisma.news.findMany({
                where: {
                    headlineNewsId: headline.id,
                },
                select: {
                    title: true,
                    url: true,
                    publishedAt: true,
                    publisherName: true,
                    publisherLogo: true,
                    thumbnail: true,
                    excerpt: true,
                    bias: true,
                    left_tendency: true,
                    right_tendency: true,
                    center_tendency: true,
                    subjectivity: true,
                },
            })};
        } catch (error) {
            if (
                error instanceof Error
            ) { 
                throw new HeadlineError(error.message, HeadlineErrorType.UNKNOWN);
            } else {
                throw new HeadlineError('Something went wrong', HeadlineErrorType.UNKNOWN);
            }
        } finally {
            await prisma.$disconnect();
        }
    }
}

export default HeadlineService;
