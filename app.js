"use strict";

const fs = require("fs");

const pg = require("pg");

const https = require("https");

const dbPassword = '62I8anq3cFq5GYh2u4Lh';

const thisDir = __dirname;

const config = {
    connectionString:
        `postgres://candidate:${dbPassword}@rc1b-r21uoagjy1t7k77h.mdb.yandexcloud.net:6432/db1`,
    ssl: {
        rejectUnauthorized: true,
        ca: fs
            .readFileSync(`${thisDir}/root.crt`)
            .toString(),
    },
};

const conn = new pg.Client(config);

conn.connect((err) => {
    if (err) throw err;
});

const tableName = 'Tempname256113';

// conn.query(`SELECT version()`, (err, q) => {
//     if (err) throw err;
//     console.log(q.rows[0]);
//     conn.end();
// });

const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (
    id SERIAL PRIMARY KEY,
    name TEXT,
    data JSONB
)`;

const addNewCharacterQuery = `INSERT INTO ${tableName} (id, name, data) VALUES ($1, $2, $3)`;

conn.query(createTableQuery, (err, q) => {
    if (err) throw err;
});

https.get('https://rickandmortyapi.com/api/character', (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        const parsedResult = JSON.parse(data);

        for (let i = 1; i <= parsedResult.info.pages; i++) {
            https.get(`https://rickandmortyapi.com/api/character/?page=${i}`, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    const parsedResult = JSON.parse(data);

                    const charactersArray = parsedResult.results;

                    for (const character of charactersArray) {

                        conn.query(addNewCharacterQuery, [character.id, character.name, character], (err, q) => {
                            if (err) throw err;
                        });

                    }
                });
            })
        }
    });
});