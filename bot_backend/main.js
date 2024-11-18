import './config.js';  // Import entire config
console.log(process.env.STATUS_URL);

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import router from "./routes/services.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()

const APP_HOST = process.env.APP_HOST;
const APP_PORT = process.env.APP_PORT;

// Body parser middleware
app.use(express.json());  // raw json
app.use(express.urlencoded({extended: false}));  // form data

app.use("/", router);

app.listen(APP_PORT, APP_HOST, () => console.log(`App is running on http://${APP_HOST}:${APP_PORT}`));
