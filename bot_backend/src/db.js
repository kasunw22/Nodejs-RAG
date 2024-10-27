import { CustomEmbeddings } from "./encoder.js";
import { RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
// document loaders
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveUrlLoader } from "@langchain/community/document_loaders/web/recursive_url";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { compile } from "html-to-text";

import fs from "fs";
import path from "path";



async function asyncSleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

const isUrl = (urlString) => {
    try { 
        return Boolean(new URL(urlString)); 
    }
    catch(e){ 
        return false; 
    }
}

function sleep(millis) {
    return resolve => setTimeout(resolve, millis);
}

const pdfProcessor = async (filePath) => {
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    console.info(`[INFO] pdfProcessor read ${docs.length} documents from ${filePath}`);
    return docs;
};

const urlProcessor = async (url) => {
    const compiledConvert = compile({wordwrap: 130});
    const loader =new RecursiveUrlLoader(url,
    {
        extractor: compiledConvert,
        maxDepth: 1
    });
    const docs = await loader.load();
    console.info(`[INFO] urlProcessor read ${docs.length} documents from ${filePath}`);
    return docs;
};

const textProcessor = async (filePath) => {
    const loader = new TextLoader(filePath);
    const docs = await loader.load();
    console.info(`[INFO] textProcessor read ${docs.length} documents from ${filePath}`);
    return docs;
};

const docxProcessor = async (filePath) => {
    const loader = new DocxLoader(filePath);
    const docs = await loader.load();
    console.info(`[INFO] docxProcessor read ${docs.length} documents from ${filePath}`);
    return docs;
};

const csvProcessor = async (filePath) => {
    const loader = new CSVLoader(filePath);
    const docs = await loader.load();
    console.info(`[INFO] csvProcessor read ${docs.length} documents from ${filePath}`);
    return docs;
};


export class VectorDB {
    constructor(fields) {
        this.dataPath = fields.dataPath;
        this.dbPath = fields.dbPath;
        this.embeddings = new CustomEmbeddings();
        this.rSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 20,
        });

        while (!this.embeddings.isReady()) {
            console.info("[INFO] Embedding service is not ready...")
            sleep(10);
        }

        // await this.createDb();
    }

    async getSourceDocuments(dataSources) {
        if (Array.isArray(dataSources)) {
            return dataSources
        } 
        const stats = await fs.promises.stat(dataSources);
        // fs.stat(dataSources, (err, stats) => {
        //     const stats = stats;
        //   });

        if (stats.isDirectory()) {
            const files = await fs.promises.readdir(dataSources);
            return files.map(file => path.join(dataSources, file));
        }

        if (stats.isFile()) {
            const content = await fs.readFile(dataSources, "utf-8");
            return content
                .split("\n")
                .map(line => line.trim())
                .filter(line => line);
        }
    };

    async postProcessDocs(documents) {
        const newDocuments = await Promise.all(
            documents.map(async (doc) => {
                const pageContent = doc.pageContent.trim().replace(/\n+/, "\n");
                if (pageContent) {
                    doc.pageContent = pageContent
                }
                return doc
            })
        );
        return newDocuments;
    }

    async chunkDocuments(sourceDocs) {
        const documents = await Promise.all(
            sourceDocs.map(async (element) => {
                console.info(`Processing ${element}`)
                try {
                    let docs;
                    if (isUrl(element)) {
                        docs = await urlProcessor(element);
                    } else if (element.endsWith(".pdf")) {
                        docs = await pdfProcessor(element);
                    } else if (element.endsWith(".txt")) {
                        docs = await textProcessor(element);
                    } else if (element.endsWith(".docx")) {
                        docs = await docxProcessor(element);
                    } else if (element.endsWith(".csv")) {
                        docs = await csvProcessor(element);
                    } else {
                        console.warn(`[WARNING] Skipping unsupported source document: ${element}`);
                        docs = [];
                    }
                    return docs;
                } catch (error) {
                    console.error(`[ERROR] Failed to process document ${element}: ${error.message}`);
                    return [];
                }
            })
        );

        // Flatten the array of document arrays
        const docChunks = await this.rSplitter.splitDocuments(documents.flat());
        
        return await this.postProcessDocs(docChunks)
    };

    async buildDbFromDocuments(docChunks, dbPath) {
        if (docChunks) {
            console.info(`[INFO] Creating a new db at ${dbPath}...`);
            // const vectorDb = await Chroma.fromDocuments(
            const vectorDb = await FaissStore.fromDocuments(
                docChunks,
                this.embeddings,
                // {collectionName: dbPath}
            );
            await vectorDb.save(dbPath);
            
            return vectorDb;
        };
        
        console.info(`[INFO] No documents found to build the db...`)
        return null;
    };

    async createDb(dbPath=null, dataPath=null) {
        dbPath = dbPath ?? this.dbPath;
        dataPath = dataPath ?? this.dataPath;

        if (fs.existsSync(dbPath)){
            return await this.readDb(dbPath);
        } 
        
        const sourceDocs = await this.getSourceDocuments(dataPath);
        const docChunks = await this.chunkDocuments(sourceDocs);

        return await this.buildDbFromDocuments(docChunks, dbPath);
    };

    async readDb(dbPath) {
        console.info(`[INFO] Reading the db from ${dbPath}...`);
        
        // Load existing ChromaDB
        // return await Chroma.load(
        return await FaissStore.load(
            dbPath,
            this.embeddings
        );

    };

    async addToDb(dataSource, dbPath=null) {
        dbPath = dbPath ?? this.dbPath;

        const sourceDocs = await this.getSourceDocuments(dataPath);
        const docChunks = await this.chunkDocuments(sourceDocs);
        
        if (fs.existsSync(dbPath)) {
            const vectorStore = await this.readDb(dbPath);
            await vectorStore.addDocuments(docChunks);
            return vectorStore;

        } else {
            return await this.buildDbFromDocuments(docChunks, dbPath);
        }
    };

    async getRetriever(dbPath=null) {
        dbPath = dbPath ?? this.dbPath;
        
        let vectorDb;
        if (fs.existsSync(dbPath)) {
            vectorDb = await this.readDb(dbPath);
        } else {
            vectorDb = await this.createDb(dbPath)
        }
        
        return vectorDb.asRetriever({
            searchType: 'similarity_score_threshold',
            searchKwargs: {
                scoreThreshold: 0.1,
                k: 5
            }
        })
    };

    async queryDb(
        query,
        dbPath=null, 
        k=4,
        returnScore=true,
        returnRelevanceSocre=false,
        searchKwargs={}
    ){
        dbPath = dbPath ?? this.dbPath;
        
        const vectorDb = await this.readDb(this.dbPath);

        let docs;
        let content;
        if (returnScore) {
            if (returnRelevanceSocre) {
                docs = await vectorDb.maxMarginalRelevanceSearch(query, {k: k});
            } else {
                docs = await vectorDb.similaritySearchWithScore(query, k, searchKwargs);
            };
            content = await Promise.all(docs.map((doc) => {
                return [doc[1], doc[0].pageContent];
            }));
        } else {
            docs = await vectorDb.similaritySearch(query, k, searchKwargs);
            content = await Promise.all(docs.map((doc) => {
                return doc.pageContent;
            }));
        }

        return content
    };

    async searchDb(dbPath, searchQuery) {
        dbPath = dbPath ?? this.dbPath;

        const vectorDb = await this.readDb(dbPath);
        return await vectorDb.getDocstore(searchQuery);
    };

    clearDb(dbPath) {
        if (!dbPath) {
            console.error("[ERROR] Specify the DB path to be cleared!")
            throw new Error("dbPath not specified!");
        }

        if (fs.existsSync(dbPath)) {
            console.info("[INFO] Clearining the db...")
            fs.rmSync(dbPath, 
                {
                    recursive: true, 
                    force: true 
                }
            );
            console.info("[INFO] Removed the db successfully...")
            return true;
        }
        console.error("[ERROR] MEntioned DB path does not exist!")
        throw new Error("dbPath does not exist!");
    }
};


import dotenv from "dotenv";
import dotenvExpand from 'dotenv-expand';

dotenvExpand.expand(dotenv.config());
const db = new VectorDB({
    dbPath: process.env.DB_PATH,
    dataPath: process.env.DB_DATA_PATH,
});

await db.createDb();

const query = "How many pieces are there?";

const retriever = await db.getRetriever()
console.log(await retriever.invoke(query));

// console.log(await db.queryDb(query, undefined, undefined, true, false));

// db.clearDb(process.env.DB_PATH);