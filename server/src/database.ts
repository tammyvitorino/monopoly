import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'codeg429_polybd',
  password: process.env.DB_PASS || '15Vhg6BDfUW0',
  database: process.env.DB_NAME || 'codeg429_monopbd',
  waitForConnections: true,
  connectionLimit: 10,
});

// Criar tabelas na inicialização
export async function initDatabase() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(21) PRIMARY KEY,
        code VARCHAR(6) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        initial_balance BIGINT NOT NULL DEFAULT 15000000,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active'
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS players (
        id VARCHAR(21) PRIMARY KEY,
        session_id VARCHAR(21) NOT NULL,
        name VARCHAR(100) NOT NULL,
        avatar VARCHAR(10),
        balance BIGINT NOT NULL,
        is_bank TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(21) PRIMARY KEY,
        session_id VARCHAR(21) NOT NULL,
        from_player_id VARCHAR(21),
        to_player_id VARCHAR(21),
        amount BIGINT NOT NULL,
        description VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id),
        FOREIGN KEY (from_player_id) REFERENCES players(id),
        FOREIGN KEY (to_player_id) REFERENCES players(id)
      )
    `);

    console.log('✅ Banco de dados inicializado');
  } finally {
    conn.release();
  }
}

export default pool;
