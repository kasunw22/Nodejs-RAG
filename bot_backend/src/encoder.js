import { Embeddings } from "@langchain/core/embeddings";
import { chunkArray } from "@langchain/core/utils/chunk_array";
/**
 * @example
 * ```typescript
 * const model = new CustomEmbeddings({
 *   endpoint: "http://127.0.0.1:8001/encode",
 * });
 *
 * // Embed a single query
 * const res = await model.embedQuery(
 *   "What would be a good company name for a company that makes colorful socks?"
 * );
 * console.log({ res });
 *
 * // Embed multiple documents
 * const documentRes = await model.embedDocuments(["Hello world", "Bye bye"]);
 * console.log({ documentRes });
 * ```
 */
export class CustomEmbeddings extends Embeddings {
    constructor(fields={}) {
        super(fields ?? {});
        
        Object.defineProperty(this, "endpoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: process.env.EMBED_URL
        });
        Object.defineProperty(this, "stripNewLines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "batchSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 512
        });
        
        this.endpoint = fields?.endpoint ?? this.endpoint;
        this.stripNewLines = fields?.stripNewLines ?? this.stripNewLines;

    }
    async embedDocuments(texts) {
        const batches = chunkArray(this.stripNewLines ? texts.map((t) => t.replace(/\n/g, " ")) : texts, this.batchSize);
        const batchRequests = batches.map((batch) => this._runEmbedding(batch));
        const batchResponses = await Promise.all(batchRequests);
        const embeddings = [];
        for (let i = 0; i < batchResponses.length; i += 1) {
            const batchResponse = batchResponses[i];
            for (let j = 0; j < batchResponse.length; j += 1) {
                embeddings.push(batchResponse[j]);
            }
        }
        return embeddings;
    }
    async embedQuery(text) {
        const data = await this._runEmbedding([
            this.stripNewLines ? text.replace(/\n/g, " ") : text,
        ]);
        return data[0];
    }
    async runEmbedding(texts) {
        const pipe = await (this.pipelinePromise ??= (await import("@xenova/transformers")).pipeline("feature-extraction", this.model, this.pretrainedOptions));
        return this.caller.call(async () => {
            const output = await pipe(texts, this.pipelineOptions);
            return output.tolist();
        });
    }
    async _runEmbedding(texts) {
        const jsonBody = {
            sentences: texts,
        };
  
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jsonBody)
        });

        if (!response.ok) {
            throw new Error(`Failed to get embeddings: ${response.status}`);
        }
  
        const data = await response.json();
        return data.embeddings;
      }
    
    async isReady() {
        try {
            const response = await fetch(process.env.STATUS_URL);

            if (!response.ok) {
                throw new Error("Failed to get Encoder status.")
            }

            const data = await response.json();
            
            return data.encoder;

        } catch (error) {
            console.log("Error checking Encoder status: ", error);
            return false;
        }
    }
}


// import dotenv from "dotenv";
// import dotenvExpand from 'dotenv-expand';

// dotenvExpand.expand(dotenv.config());

// // const embed = new CustomEmbeddings({endpoint: "http://127.0.0.1:8001/encode"} );
// const embed = new CustomEmbeddings();
// console.log(embed.endpoint);
// console.log(await embed.isReady());

// const res = await embed._runEmbedding([
//     "Hi there?",
//     "I love you"
// ]);
// console.log(res);
