import { Router } from "express";
import HeadlineService from "./headline.service";

const headlineController = Router();

headlineController.get("/", async (
    req, res) => 
{
    let limit: number | undefined;
    let page: number | undefined;
    let titleContains: string | undefined;
    let titleEquals: string | undefined;
    try {
        if (
            req.query.limit
        ) {
            limit = Number(req.query.limit);
            if (isNaN(limit)) {
                throw new Error("Limit must be a number");
            }
        } 

        if (
            req.query.page
        ) {
            page = Number(req.query.page);
            if (isNaN(page)) {
                throw new Error("Page must be a number");
            }
        }

        if (
            req.query.titleContains
        ) {
            titleContains = String(req.query.titleContains);
        }

        if (
            req.query.titleEquals
        ) {
            titleEquals = String(req.query.titleEquals);
        }
    } catch (error) {
        res.status(400).send((error as Error).message);
        return;
    }
    try {
        const headlines = await HeadlineService.getHeadlines(
            limit,
            page,
            {
                title: titleContains,
            },
            {
                title: titleEquals,
            },
        );
        if (
            headlines.headlines.length > 0
        ) {
            res.json(headlines);
        } else {
            res.status(204).send(
                "No headlines found",
            );
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
});



headlineController.get("/:referrer", async (
    req, res) => 
{
    try {
        res.json(await HeadlineService.getNewsFromReferrer(
            req.params.referrer,
        ));
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
});
export default headlineController;