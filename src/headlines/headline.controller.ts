import { Router } from "express";
import HeadlineService from "./headline.service";

const headlineController = Router();

headlineController.get("/", async (
    req, res) => 
{
    let limit: number | undefined;
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
        res.json(await HeadlineService.getHeadlines(
            limit,
            {
                title: titleContains,
            },
            {
                title: titleEquals,
            },
        ));
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