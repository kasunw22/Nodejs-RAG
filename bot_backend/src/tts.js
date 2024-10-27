
export class TTS {
    constructor(fields) {
        
        Object.defineProperty(this, "endpoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: process.env.TTS_URL
        });
        
        this.endpoint = fields?.endpoint ?? this.endpoint;

    }
    async synthesize(
        text,
        language="en"
    ) {
        const jsonBody = {
            text: text,
            language: language
        };
  
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jsonBody)
        });

        if (!response.ok) {
            throw new Error(`Failed to get synthesized text: ${response.status}`);
        }
  
        const data = await response.json();
        // console.log(data)
        return [data.sample_rate, data.audio_response];
    }

    async isReady() {
        try {
            const response = await fetch(process.env.STATUS_URL);

            if (!response.ok) {
                throw new Error("Failed to get TTS status.")
            }

            const data = await response.json();
            
            return data.tts;

        } catch (error) {
            console.log("Error checking TTS status: ", error);
            return false;
        }
    }
}


// import dotenv from "dotenv";
// import dotenvExpand from 'dotenv-expand';

// dotenvExpand.expand(dotenv.config());

// const tts = new TTS();
// console.log(tts.endpoint);
// console.log(await tts.isReady());

// const res = await tts.synthesize("Hi there, how are you today?");
// console.log(res);
