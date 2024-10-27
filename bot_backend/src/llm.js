import { GenerationChunk } from "@langchain/core/outputs";
import { LLM } from "@langchain/core/language_models/llms";
/*
```
run this file only: node myLlm.js

const llm = new CustomLLM({
  endpoint: "http://127.0.0.1:8001/generate" 
});

Using invoke
const res = await llm.invoke(
  "Who is king Ashoka?"
);
console.log(res);
```
*/


export class CustomLLM extends LLM {
    constructor(fields={}) {
        super(fields);
        Object.defineProperty(this, "endpoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: process.env.LLM_URL
            });
        this.endpoint = fields?.endpoint ?? this.endpoint;
    }
  
    async _getResponse(prompt, kwargs = {}) {
      const defaultGenerationConfig = {
        num_predict: 200,
        temperature: 0.1,
        top_p: 0.95,
        top_k: 20,
      };
  
      const generationConfig = {
        ...defaultGenerationConfig,
        ...kwargs
      };

      const jsonBody = {
        prompt: prompt,
        generation_config: generationConfig,
      };

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to get llm response: ${response.status}`);
    }

      const data = await response.json();
      return data.response;
    }

    _llmType() {
      return "custom";
    }
  
    async _call(prompt, options, runManager) {
      try {
        return this._getResponse(prompt, options);
      } catch (error) {
        throw new Error(`Error calling local LLM endpoint: ${error.message}`);
      }
    }
  
    async *_streamResponseChunks(prompt, options, runManager) {
      try {
        const response = await this._getResponse(prompt, options);
        
        for (const char of response) {
          const chunk = new GenerationChunk({
            text: char,
          });
          
          if (runManager) {
            await runManager.handleLLMNewToken(chunk.text);
          }

          yield chunk;
        }
      } catch (error) {
        throw new Error(`Error streaming from local LLM endpoint: ${error.message}`);
      }
    }

    async isReady() {
        try {
            const response = await fetch(process.env.STATUS_URL);

            if (!response.ok) {
                throw new Error("Failed to get LLM status.")
            }

            const data = await response.json();
            
            return data.llm;

        } catch (error) {
            console.log("Error checking LLM status: ", error);
            return false;
        }
    }
}


// import dotenv from "dotenv";
// import dotenvExpand from 'dotenv-expand';

// dotenvExpand.expand(dotenv.config());

// // const llm = new CustomLLM({endpoint: "http://127.0.0.1:8001/generate"} );
// const llm = new CustomLLM();
// console.log(llm.endpoint);
// console.log(await llm.isReady());

// const res = await llm._getResponse("Hi there, how are you today?");
// console.log(res);

