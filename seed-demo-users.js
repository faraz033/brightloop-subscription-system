const db = require('./db');
const bcrypt = require('bcryptjs');

const h = bcrypt.hashSync('Staff@12345', 10);
const c = bcrypt.hashSync('Customer@12345', 10);

if (!db.prepare("SELECT 1 FROM users WHERE email='staff@brightloop.com'").get()) {
  db.prepare("INSERT INTO users(name, email, password_hash, role) VALUES('Sarah Connor', 'staff@brightloop.com', ?, 'staff')").run(h);
} else {
  db.prepare("UPDATE users SET password_hash=? WHERE email='staff@brightloop.com'").run(h);
}

if (!db.prepare("SELECT 1 FROM users WHERE email='customer@brightloop.com'").get()) {
  db.prepare("INSERT INTO users(name, email, password_hash, role) VALUES('Alex Morgan', 'customer@brightloop.com', ?, 'customer')").run(c);
} else {
  db.prepare("UPDATE users SET password_hash=? WHERE email='customer@brightloop.com'").run(c);
}

console.log('Seeded demo accounts successfully:');
console.log(db.prepare("SELECT id, name, email, role FROM users WHERE email IN ('admin@brightloop.com', 'staff@brightloop.com', 'customer@brightloop.com')").all());
