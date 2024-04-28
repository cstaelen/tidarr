import express, { Express, Request, Response } from "express";
import { configureServer } from "./src/services/config";
import { ProcessingItemType } from "./src/types";
import { ProcessingStack } from "./src/helpers/ProcessingStack";
import dotenv from "dotenv";

dotenv.config({ path: ".env", override: false });

const port = process.env.API_PORT;
const hostname = process.env.API_HOSTNAME;

const app: Express = express();
app.use(express.json());

const processingList = ProcessingStack(app);
app.set("processingList", processingList);

app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

app.post("/api/save", async (req: Request, res: Response) => {
  req.app.settings.processingList.actions.addItem(req.body.item);
  res.sendStatus(201);
});

app.post("/api/remove", async (req: Request, res: Response) => {
  req.app.settings.processingList.actions.removeItem(req.body.id);
  res.sendStatus(201);
});

app.get("/api/list", (req: Request, res: Response) => {
  const clone = [...req.app.settings.processingList.data].map((x) => x);
  const response = clone.map((item: ProcessingItemType) => {
    delete item.process;
    return item;
  });
  res.send(response);
});

app.get("/api/check", async (req: Request, res: Response) => {
  const response = await configureServer();
  res.send(response);
});

app.listen(port, () => {
  configureServer();
  console.log(`⚡️[server]: Server is running at http://${hostname}:${port}`);
});

// fallback load app

const frontendFiles = process.cwd() + "/build";
app.use(express.static(frontendFiles));
app.get("/*", (_, res) => {
  res.sendFile(frontendFiles + "/index.html");
});
