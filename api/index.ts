import express, { Express, Request, Response } from "express";
import { configureServer } from "./src/services/config";
import { ProcessingItemType } from "./src/types";
import { ProcessingStack } from "./src/helpers/ProcessingStack";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config({ path: ".env", override: false });

const port = process.env.REACT_APP_TIDARR_API_PORT;
const hostname = process.env.HOSTNAME;

const app: Express = express();
app.use(express.json());
app.use(cors());

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

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server !");
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
