import { VectorDB } from "../src/db.js";
import { GrapApp } from "../src/graphApp.js";
import { Translator } from "../src/translator.js";
import { STT } from "../src/stt.js";
import { TTS } from "../src/tts.js";


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
export const queryDb = async (req, res) => {
    const query = req.body.query
    const dbPath = req.body.dbPath
    const k = req.body.k
    const returnScore = req.body.returnScore
    const returnRelevanceSocre = req.body.returnRelevanceSocre
    const searchKwargs = req.body.searchKwargs
    
    const content = await db.queryDb(
        query,
        dbPath, 
        k,
        returnScore,
        returnRelevanceSocre,
        searchKwargs
    )

    res.status(200).json({"query": query, "content": content})
};

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
    let tStart = Date.now();
    let tEnd;

    const sessionId = req.body.sessionId;
    const maxHistory = req.body.maxHistory;
    let srcLang = req.body.srcLang;
    let tgtLang = req.body.tgtLang;
    let question = req.body.question;
    let enQuestion = "";
    let enAnswer = "";
    let finalAnswer = "";

    let sampleRate = null;
    let audioData = null;

    let success = false;
    let error = "";

    if (req.body.enableAudioInput && !(req.body.question) && req.body.audioData) {
        if (await stt.isReady()) {
            const sttRes = await stt.transcribe(req.body.audioData, req.body.sampleRate)
            question = sttRes.transcription;
            srcLang = sttRes.language;
        } else {
            error = "STT Service noty ready";
            tEnd = Date.now();

            res.status(500).json({userQuery: "", enAnswer: enAnswer, finalAnswer: finalAnswer, success: success, error: error, timeTaken: (tEnd - tStart), sampleRate: sampleRate, audioData: audioData});
        }
    }

    if (srcLang === "en" || await translator.isReady()) {
        if (srcLang != "en") {
            enQuestion = await translator.translate(question, srcLang, "en");
        } else {
            enQuestion = question;
        }
    } else {
        error = "Translator is not ready";
        tEnd = Date.now();

        res.status(500).json({userQuery: question, enAnswer: enAnswer, finalAnswer: finalAnswer, success: success, error: error, timeTaken: (tEnd - tStart), sampleRate: sampleRate, audioData: audioData});
    }

    if (await graphApp.isReady()) {
        enAnswer = await graphApp.chat({
            enQuery: enQuestion,
            sessionId:sessionId,
            maxHistory: maxHistory,
            dbPath: req.body.dbPath,
            freeChatMode: req.body.freeChatMode,
        });

    } else {
        error = "Bot is not ready";
        tEnd = Date.now();

        res.status(500).json({userQuery: question, enAnswer: enAnswer, finalAnswer: finalAnswer, success: success, error: error, timeTaken: (tEnd - tStart), sampleRate: sampleRate, audioData: audioData});
    }

    if (tgtLang === "en" || await translator.isReady()) {
        if (tgtLang != "en") {
            finalAnswer = await translator.translate(enAnswer, "en", tgtLang);
        } else {
            finalAnswer = enAnswer;
        }
    } else {
        error = "Translator is not ready";
        tEnd = Date.now();
        res.status(500).json({userQuery: question, enAnswer: enAnswer, finalAnswer: finalAnswer, success: success, error: error, timeTaken: (tEnd - tStart), sampleRate: sampleRate, audioData: audioData});
    }

    if (req.body.enableAudioOutput && await tts.isReady()) {
        const ttsRes = await tts.synthesize(finalAnswer, tgtLang);
        sampleRate = ttsRes.sampleRate;
        audioData = ttsRes.audioResponse;
    }

    success = true;
    tEnd = Date.now();
    res.status(200).json({userQuery: question, enAnswer: enAnswer, finalAnswer: finalAnswer, success: success, error: error, timeTaken: (tEnd - tStart), sampleRate: sampleRate, audioData: audioData});
};

// @desc home
// @route POST /api/clear_chat
export const clearChat = async (req, res) => {
    const sessionId = req.body.sessionId;
    const success = await graphApp.clearHistory(sessionId);

    res.status(200).json({success: success});
};

// @desc home
// @route GET /status
export const getStatus = async (req, res) => {
    const llmStatus = await graphApp.llm.isReady();
    const translatorStatus = await translator.isReady();
    const encoderStatus = await db.embeddings.isReady();

    res.status(200).json({
        llm: llmStatus,
        translator: translatorStatus,
        encoder: encoderStatus,
        status: (llmStatus && translatorStatus && encoderStatus)
    });
};
