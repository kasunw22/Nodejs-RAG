// redis-storage.js
import Redis from 'ioredis';


// Example storage interface implementation
export class InMemoryStorage {
    constructor() {
        this.data = {};
    }

    async save(data) {
        this.data = {...data};
    }

    async load() {
        return this.data;
    }
};


// Redis storage implementation
export class RedisStorage {
    constructor(config = {}) {
        const {
            host = process.env.REDIS_HOST || 'localhost',
            port = process.env.REDIS_PORT || 6379,
            password = process.env.REDIS_PASSWORD,
            keyPrefix = 'chat:history:',
            ttl = 7200 // 2 hours in seconds, matching maxIdleTime
        } = config;

        this.redis = new Redis({
            host,
            port,
            password,
            keyPrefix
        });

        this.ttl = ttl;
    }

    async save(sessionId, chatData) {
        try {
            const key = sessionId;
            await this.redis.setex(
                key,
                this.ttl,
                JSON.stringify(chatData)
            );
        } catch (error) {
            console.error('Redis save error:', error);
            throw new Error('Failed to save chat history');
        }
    }

    async load(sessionId) {
        try {
            const key = sessionId;
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Redis load error:', error);
            throw new Error('Failed to load chat history');
        }
    }

    async delete(sessionId) {
        try {
            const key = sessionId;
            await this.redis.del(key);
        } catch (error) {
            console.error('Redis delete error:', error);
            throw new Error('Failed to delete chat history');
        }
    }

    async clearExpired() {
        // Redis automatically handles expiration
        return true;
    }

    async disconnect() {
        await this.redis.quit();
    }
};