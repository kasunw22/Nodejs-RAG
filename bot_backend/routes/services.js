import { clear } from "console";
import express from "express";
import {
    readRoot,
    createDb,
    parseFile,
    parseUrl,
    queryDb,
    searchDb,
    chat,
    clearChat,
    getStatus
} from "../controllers/serviceControllers.js"

const router = express.Router();

// home
router.get("/", readRoot);

// create db
router.post("/db/create", createDb);

// add file content to db
router.post("/db/parse_file", parseFile);

// add url content to db
router.post("/db/parse_url", parseUrl);

// query db
router.post("/db/query", queryDb);

// search db
router.post("/db/search", searchDb);

// chat with RAG
router.post("/api/chat", chat);

// clear chat history
router.post("/api/clear_chat", clearChat);

// status of the API
router.get("/status", getStatus);

export default router;
