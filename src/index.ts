import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import ThirdParty from "supertokens-node/recipe/thirdparty";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { errorHandler, middleware } from "supertokens-node/framework/express";
import Dashboard from "supertokens-node/recipe/dashboard";
import authController from "./auth/auth.controller";
import headlineController from "./headlines/headline.controller";
import UserMetadata from "supertokens-node/recipe/usermetadata";

dotenv.config();


supertokens.init({
    framework: "express",
    supertokens: {
        // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
        connectionURI: "https://auth.service.ishiori.net",
        apiKey: process.env.CORE_API_KEY || "",
    },
    appInfo: {
        // learn more about this on https://supertokens.com/docs/session/appinfo
        appName: "SINARI Back-end Service",
        apiDomain: "http://localhost:3001",
        websiteDomain: "http://localhost:3000",
        apiBasePath: "/auth",
        websiteBasePath: "/auth"
    },
    recipeList: [
        ThirdParty.init({
            signInAndUpFeature: {
                // We have provided you with development keys which you can use for testing.
                // IMPORTANT: Please replace them with your own OAuth keys for production use.
                providers: [{
                    config: {
                        thirdPartyId: "google",
                        clients: [{
                            clientType: "web",
                            clientId: process.env.GOOGLE_CLIENT_ID || "",
                            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
                        }]
                    }
                }],
            },
            override: {
                functions: (oI) => {
                    return {
                        ...oI,
                        signInUp: async (input) => {
                            let response = await oI.signInUp(input);
                            if (response.status === "OK") {
                                // You can add custom code here to do something after a user signs in or signs up.
                                await UserMetadata.updateUserMetadata(response.user.id, {
                                    userInfo: response.rawUserInfoFromProvider.fromUserInfoAPI ?? {},
                                })
                            }
                            return response;
                        },

                    }
                }
            }
        }),
        Session.init(), // initializes session features
        Dashboard.init(), // initializes dashboard features
        UserMetadata.init()
    ]
});

let app = express();


app.use(cors({
    origin: "http://localhost:3000",
    allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
    credentials: true
}));

app.use(middleware());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/auth", authController);
app.use("/headlines", headlineController);


app.use(errorHandler());


app.listen(3001, () => {
    console.log("listening on port 3001");
});
