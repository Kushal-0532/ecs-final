import sqlite3 from 'sqlite3';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CLOUD_DB_URL = process.env.CLOUD_DB_URL || 'http://your-cloud-api.com/api';
const DB_PATH = path.join(__dirname, 'db', 'classroom.db');
const RETRY_INTERVAL = 5000; // 5 seconds
const MAX_RETRIES = 3;

class CloudSyncService {
  constructor() {
    this.db = null;
    this.isOnline = false;
    this.syncInProgress = false;
    this.retryQueue = [];
  }

  connect() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Database connection error:', err);
        process.exit(1);
      }
      console.log('Connected to classroom database');
      this.checkInternetConnection();
    });
  }

  checkInternetConnection() {
    console.log('Checking internet connection...');
    
    axios.get('http://8.8.8.8', { timeout: 5000 })
      .then(() => {
        console.log('Internet connection available');
        this.isOnline = true;
        this.syncToCloud();
      })
      .catch(() => {
        console.log('No internet connection. Will retry in 30 seconds...');
        this.isOnline = false;
        setTimeout(() => this.checkInternetConnection(), 30000);
      });
  }

  syncToCloud() {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    if (!this.isOnline) {
      console.log('No internet connection, cannot sync');
      return;
    }

    this.syncInProgress = true;
    console.log('Starting cloud sync...');

    this.db.all(
      'SELECT * FROM sync_queue WHERE synced = 0 LIMIT 100',
      async (err, records) => {
        if (err) {
          console.error('Error fetching sync queue:', err);
          this.syncInProgress = false;
          return;
        }

        if (records.length === 0) {
          console.log('No records to sync');
          this.syncInProgress = false;
          return;
        }

        console.log(`Found ${records.length} records to sync`);

        for (const record of records) {
          await this.syncRecord(record);
        }

        this.syncInProgress = false;
      }
    );
  }

  async syncRecord(record) {
    let retries = 0;

    const attemptSync = async () => {
      try {
        const data = JSON.parse(record.data);
        
        const endpoint = this.getEndpoint(record.table_name, record.action);
        
        console.log(`Syncing ${record.table_name} record ${record.record_id}...`);

        const response = await axios.post(`${CLOUD_DB_URL}${endpoint}`, {
          record_id: record.record_id,
          table_name: record.table_name,
          action: record.action,
          data: data,
          synced_at: new Date()
        }, { timeout: 10000 });

        if (response.status === 200) {
          // Mark as synced
          this.db.run(
            'UPDATE sync_queue SET synced = 1 WHERE id = ?',
            [record.id],
            (err) => {
              if (err) {
                console.error('Error marking record as synced:', err);
              } else {
                console.log(`✓ Synced ${record.table_name} record ${record.record_id}`);
              }
            }
          );
        }
      } catch (error) {
        retries++;
        console.error(`Sync attempt ${retries} failed:`, error.message);

        if (retries < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_INTERVAL}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
          await attemptSync();
        } else {
          console.error(`Failed to sync record after ${MAX_RETRIES} attempts`);
        }
      }
    };

    await attemptSync();
  }

  getEndpoint(tableName, action) {
    const endpoints = {
      'classes': '/sync/classes',
      'polls': '/sync/polls',
      'poll_responses': '/sync/responses',
      'transcriptions': '/sync/transcriptions'
    };

    return endpoints[tableName] || '/sync/data';
  }

  // Export class data as JSON
  exportClassData(classId) {
    return new Promise((resolve, reject) => {
      const classData = {};

      this.db.get('SELECT * FROM classes WHERE id = ?', [classId], (err, cls) => {
        if (err) return reject(err);
        classData.class = cls;

        this.db.all('SELECT * FROM polls WHERE class_id = ?', [classId], (err, polls) => {
          if (err) return reject(err);
          classData.polls = polls;

          this.db.all('SELECT * FROM poll_responses WHERE poll_id IN (SELECT id FROM polls WHERE class_id = ?)', [classId], (err, responses) => {
            if (err) return reject(err);
            classData.poll_responses = responses;

            this.db.all('SELECT * FROM transcriptions WHERE class_id = ?', [classId], (err, transcriptions) => {
              if (err) return reject(err);
              classData.transcriptions = transcriptions;

              resolve(classData);
            });
          });
        });
      });
    });
  }

  // Archive class data locally
  async archiveClassData(classId) {
    try {
      const data = await this.exportClassData(classId);
      const archiveDir = path.join(__dirname, 'archives');
      fs.ensureDirSync(archiveDir);

      const filename = `class_${classId}_${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(archiveDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      console.log(`Archived class data to ${filepath}`);

      return filepath;
    } catch (error) {
      console.error('Error archiving class data:', error);
    }
  }

  start() {
    console.log('Cloud Sync Service started');
    this.connect();

    // Check for sync every 60 seconds
    setInterval(() => {
      if (this.isOnline) {
        this.syncToCloud();
      }
    }, 60000);

    // Check internet connection every 30 seconds
    setInterval(() => {
      this.checkInternetConnection();
    }, 30000);
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log('Database connection closed');
    }
  }
}

// Start service
const service = new CloudSyncService();
service.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down sync service...');
  service.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down sync service...');
  service.close();
  process.exit(0);
});

export default CloudSyncService;
