import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

export class MemorySystem {
  constructor(dbPath = './memory.db') {
    this.db = new sqlite3.Database(dbPath);
    this.db.run = promisify(this.db.run.bind(this.db));
    this.db.get = promisify(this.db.get.bind(this.db));
    this.db.all = promisify(this.db.all.bind(this.db));
    this.initialized = this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY,
          agent_id TEXT,
          type TEXT,
          content TEXT,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.db.run(`
        CREATE TABLE IF NOT EXISTS agent_states (
          agent_id TEXT PRIMARY KEY,
          state TEXT,
          last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      console.error('Database initialization error:', error);
      // Continue anyway - the tables might already exist
    }
  }

  async ensureInitialized() {
    await this.initialized;
  }

  async addMemory(agentId, type, content, metadata = {}) {
    await this.ensureInitialized();
    const id = uuidv4();
    await this.db.run(
      'INSERT INTO memories (id, agent_id, type, content, metadata) VALUES (?, ?, ?, ?, ?)',
      [id, agentId, type, JSON.stringify(content), JSON.stringify(metadata)]
    );
    return id;
  }

  async getMemories(agentId, type = null, limit = 100) {
    await this.ensureInitialized();
    let query = 'SELECT * FROM memories WHERE agent_id = ?';
    const params = [agentId];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const memories = await this.db.all(query, params);
    return memories.map(memory => ({
      ...memory,
      content: JSON.parse(memory.content),
      metadata: JSON.parse(memory.metadata)
    }));
  }

  async updateAgentState(agentId, state) {
    await this.ensureInitialized();
    await this.db.run(
      'INSERT OR REPLACE INTO agent_states (agent_id, state, last_activity) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [agentId, JSON.stringify(state)]
    );
  }

  async getAgentState(agentId) {
    await this.ensureInitialized();
    const result = await this.db.get('SELECT * FROM agent_states WHERE agent_id = ?', [agentId]);
    if (result) {
      return {
        ...result,
        state: JSON.parse(result.state)
      };
    }
    return null;
  }

  async searchMemories(agentId, query, type = null) {
    await this.ensureInitialized();
    let sql = 'SELECT * FROM memories WHERE agent_id = ? AND content LIKE ?';
    const params = [agentId, `%${query}%`];
    
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    
    const memories = await this.db.all(sql, params);
    return memories.map(memory => ({
      ...memory,
      content: JSON.parse(memory.content),
      metadata: JSON.parse(memory.metadata)
    }));
  }

  async deleteMemory(memoryId) {
    await this.ensureInitialized();
    await this.db.run('DELETE FROM memories WHERE id = ?', [memoryId]);
  }

  async clearAgentMemory(agentId) {
    await this.ensureInitialized();
    await this.db.run('DELETE FROM memories WHERE agent_id = ?', [agentId]);
    await this.db.run('DELETE FROM agent_states WHERE agent_id = ?', [agentId]);
  }
}
