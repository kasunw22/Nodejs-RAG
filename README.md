# NodeJs Rag Services
This is a complete end-to-end RAG solution using NodeJs. This is the NodeJs version of [this](https://github.com/xphoenix-ai/rag-services) Python project.

## System Overview
![Model](img/overall_system.jpeg)

## System Architecture
![Model](img/architecture.png)

## Components

We have divided the system into 3 main components.

### Compute Service:

This is the heavy computation services of the system.

- **LLM Service** - LLM is up and running here
- **Embedding Service** - Sentence/Document embedding service is running here
- **Translator Service** - All direction translation service is running here
- **STT Service** - Speech-To-Text service is running here
- **TTS Service** - Text-To-Speech service is running here

### Bot Backend:

This is the full RAG pipeline which answers a user query using the available knowledge bases fed to the system.

- **Bot Service** - The RAG pipeline
- **DB Service** - The RAG knowledge base store

### Client App:

Client frontend App that the user interacts with the bot/system.

## Setup

The 3 services should be run as 3 separate services.
- Compute Service is independent of others
- Bot Backend is depending upon the Compute Service
- Bot Frontend is depending upon the Bot Backend

You can access the services as follows.

**Note:**
 - You can use the corresponding Python services of [this](https://github.com/xphoenix-ai/rag-services) project for yet to complete services.

### Steps to Start

1. Start the compute service (to be added)
```
cd compute_service
npm i
npm start
```

2. Start the bot backend
```
cd bot_backend
npm i
npm start
```

3. Start the frontend app (to be added)
```
cd bot_frontend
npm i
npm start
```

## Dockerization

This option will be availble in the future

<!-- ROADMAP -->
## Roadmap

- [ ] Complete Bot Backend
    - [x] Basic RAG Flow
    - [x] Session Management
    - [x] RAG mode and LLM-only chat mode
    - [x] Handle both text and voice input and output
    - [ ] Add knowledge to vector db through API
- [ ] Complete Compute Service
    - [ ] LLM Service
        - [ ] Huggingface
        - [ ] Ollama
        - [ ] Llama-cpp
        - [ ] Openai
    - [ ] Embedding Service
        - [ ] Huggingface
        - [ ] Sentence Transformers
        - [ ] Openai
    - [ ] Translation Service
        - [ ] Huggingface
        - [ ] Google Translate API
    - [ ] ASR Service
        - [ ] Huggingface
        - [ ] Openai-whisper
    - [ ] TTS Service
        - [ ] Huggingface
        - [ ] CoquiTTS
- [ ] Complete Frontend APP
    - [ ] Basic chat interface
    - [ ] Add knowledge to RAG (i.e. File Upload, URL fetch)
