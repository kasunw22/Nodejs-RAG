
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
export const createDb = (req, res) => {};

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
// @route POST /api/chat
export const chat = (req, res) => {};

// @desc home
// @route POST /api/clear_chat
export const clearChat = (req, res) => {};

// @desc home
// @route GET /status
export const getStatus = (req, res) => {};
