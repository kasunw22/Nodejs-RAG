import { VectorDB } from "../src/db";
import { GrapApp } from "../src/graphApp";
import { Translator } from "../src/translator";
import { STT } from "../src/stt";
import { TTS } from "../src/tts";


const db = await new VectorDB({
    dbPath: process.env.DB_PATH,
    dataPath: process.env.DB_DATA_PATH,
}).init();
const graphApp = await new GrapApp({
    maxHistory: 4,
    maxIdleTime: 300
}).init();
const translator = new Translator();
const stt = new STT();
const tts = new TTS();


// @desc home
// @route GET /
export const readRoot = (req, res) => {
    const info = {
        info: "Bot Backend Service", 
        version: process.env.APP_VERSION, 
        vendor: "XXX",
    };
    res.status(200).json(info);
};

// @desc create vector db
// @route POST /db/create
export const createDb = async (req, res) => {
    const dbPath = req.body.dbPath;
    let error = "";
    let success = false
    if (await db.embeddings.isReady()) {
        await db.createDb(dbPath);
        success = true;
    } else {
        error = "Encoder not ready"
    }
    res.status(201).json({success: success, error: error});
};

// @desc home
// @route POST /db/parse_file
export const parseFile = (req, res) => {};

// @desc home
// @route POST /db/parse_url
export const parseUrl = (req, res) => {};

// @desc home
// @route POST /db/query
export const queryDb = (req, res) => {};

// @desc home
// @route POST /db/search
export const searchDb = (req, res) => {};

// @desc home
// @route POST /db/clear
export const clearDb = async (req, res) => {
    const dbPath = req.body.dbPath;
    graphApp.ragChain = null;
    const success = db.clearDb(dbPath);

    if (success) {
        await graphApp.addToRagChainArray(dbPath, true);
    };

    res.status(200).json({success: success});
};

// @desc home
// @route POST /api/chat
export const chat = async (req, res) => {
    const sessionId = req.body.sessionId;
    const srcLang = req.body.srcLang;
    const tgtLang = req.body.tgtLang;
    const maxHistory = req.body.maxHistory;
    
    let sampleRate = null;
    let audioData = null;

    if (req.body.enableAudioInput && !(req.body.question) && req.body.audioData) {
        if (await stt.isReady()) {
            question, srcLang = await stt.transcribe(req.body.audioData, req.body.sampleRate)
        }
    }
};

// @desc home
// @route POST /api/clear_chat
export const clearChat = (req, res) => {};

// @desc home
// @route GET /status
export const getStatus = (req, res) => {};
