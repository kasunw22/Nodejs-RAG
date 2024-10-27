
export class Translator {
    constructor(fields) {
        
        Object.defineProperty(this, "endpoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: process.env.TRANSLATOR_URL
        });
        
        this.endpoint = fields?.endpoint ?? this.endpoint;

    }
    async translate(
        query,
        srcLang,
        tgtLang
    ) {
        const jsonBody = {
            src: query,
            src_lang: srcLang,
            tgt_lang: tgtLang
        };
  
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jsonBody)
        });

        if (!response.ok) {
            throw new Error(`Failed to get translation: ${response.status}`);
        }
  
        const data = await response.json();
        
        return data.tgt;
    }

    async isReady() {
        try {
            const response = await fetch(process.env.STATUS_URL);

            if (!response.ok) {
                throw new Error("Failed to get Translator status.")
            }

            const data = await response.json();
            
            return data.translator;

        } catch (error) {
            console.log("Error checking Translator status: ", error);
            return false;
        }
    }
}


// import dotenv from "dotenv";
// import dotenvExpand from 'dotenv-expand';

// dotenvExpand.expand(dotenv.config());

// const tts = new Translator();
// console.log(tts.endpoint);
// console.log(await tts.isReady());
