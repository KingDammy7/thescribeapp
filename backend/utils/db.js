const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

class Collection {
  constructor(name) {
    this.file = path.join(DATA_DIR, `${name}.json`);
    this.records = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.file)) {
        return JSON.parse(fs.readFileSync(this.file, 'utf8'));
      }
    } catch (e) {}
    return [];
  }

  _save() {
    fs.writeFileSync(this.file, JSON.stringify(this.records, null, 2));
  }

  findAll(query = {}) {
    return this.records.filter(r =>
      Object.entries(query).every(([k, v]) => r[k] === v)
    );
  }

  findOne(query = {}) {
    return this.records.find(r =>
      Object.entries(query).every(([k, v]) => r[k] === v)
    ) || null;
  }

  findById(id) {
    return this.records.find(r => r.id === id) || null;
  }

  create(data) {
    const record = { id: uuidv4(), ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this.records.push(record);
    this._save();
    return record;
  }

  update(id, data) {
    const idx = this.records.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.records[idx] = { ...this.records[idx], ...data, updated_at: new Date().toISOString() };
    this._save();
    return this.records[idx];
  }

  upsert(query, data) {
    const existing = this.findOne(query);
    if (existing) return this.update(existing.id, data);
    return this.create({ ...query, ...data });
  }

  delete(id) {
    const idx = this.records.findIndex(r => r.id === id);
    if (idx === -1) return false;
    this.records.splice(idx, 1);
    this._save();
    return true;
  }
}

module.exports = {
  users: new Collection('users'),
  voiceProfiles: new Collection('voice_profiles'),
  manuscripts: new Collection('manuscripts'),
  chapters: new Collection('chapters'),
};
