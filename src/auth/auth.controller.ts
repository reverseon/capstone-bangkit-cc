import { Router } from "express";
import { SessionRequest } from "supertokens-node/framework/express";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import UserMetadata from "supertokens-node/recipe/usermetadata";

const authController = Router();

authController.get("/", (
    req, res) => 
{
    res.send("Hello World from Auth!");
});


authController.get("/sessioninfo", verifySession(), async (req: SessionRequest, res) => {
    let session = req.session;
    res.send({
        userId: session!.getUserId(),
        userInfo: (await UserMetadata.getUserMetadata(session!.getUserId()) as any).metadata.userInfo,
    });
});

export default authController;