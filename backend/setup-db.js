// Database setup script
const fs = require('fs');
const mysql = require('mysql2');
const path = require('path');

// Read SQL file
const sqlFile = path.join(__dirname, 'database.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// Create connection without specifying database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to MySQL');
});

// Split SQL into individual statements and execute
const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

let executed = 0;

const executeNext = () => {
    if (executed >= statements.length) {
        console.log('\n✅ Database setup complete!');
        connection.end();
        process.exit(0);
    }

    const statement = statements[executed];
    executed++;

    connection.query(statement, (err, results) => {
        if (err) {
            console.error(`❌ Error executing statement ${executed}:`, err.message);
        } else {
            console.log(`✅ Executed statement ${executed}/${statements.length}`);
        }
        executeNext();
    });
};

executeNext();
