const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, 'moviesData.db');
let db = null;

const dbInit = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    app.listen(3000, () => {
      console.log('Server is listening at 3000');
    });
  } catch (error) {
    console.error(`Error initializing database: ${error.message}`);
    process.exit(1);
  }
};

dbInit();

const convertToPlayerObj = each => ({
  playerId: each.player_id,
  playerName: each.player_name
});

const convertToMatchObj = each => ({
  matchID: each.match_id,
  match: each.match,
  year: each.year
});

app.get('/players/', async (request, response) => {
  try {
    const query = `SELECT * FROM player_details`;
    const result = await db.all(query);
    response.send(result.map(convertToPlayerObj));
  } catch (error) {
    console.error(`Error fetching players: ${error.message}`);
    response.status(500).send('Internal Server Error');
  }
});

app.get('/players/:playerId/', async (request, response) => {
  try {
    const { playerId } = request.params;
    const query = `SELECT * FROM player_details WHERE player_id=${playerId}`;
    const result = await db.get(query);
    if (result) {
      response.send(convertToPlayerObj(result));
    } else {
      response.status(404).send('Player not found');
    }
  } catch (error) {
    console.error(`Error fetching player details: ${error.message}`);
    response.status(500).send('Internal Server Error');
  }
});

app.put('/players/:playerId/', async (request, response) => {
  try {
    const { playerId } = request.params;
    const { playerName } = request.body;
    const query = `UPDATE player_details SET player_name='${playerName}' WHERE player_id=${playerId}`;
    await db.run(query);
    response.send('Player Details Updated');
  } catch (error) {
    console.error(`Error updating player details: ${error.message}`);
    response.status(500).send('Internal Server Error');
  }
});

app.get('/matches/:matchId/', async (request, response) => {
  try {
    const { matchId } = request.params;
    const query = `SELECT * FROM match_details WHERE match_id=${matchId}`;
    const result = await db.get(query);
    if (result) {
      response.send(convertToMatchObj(result));
    } else {
      response.status(404).send('Match not found');
    }
  } catch (error) {
    console.error(`Error fetching match details: ${error.message}`);
    response.status(500).send('Internal Server Error');
  }
});

app.get('/players/:playerId/matches', async (request, response) => {
  try {
    const { playerId } = request.params;
    const query = `SELECT match_id, match, year FROM match_details AS m, player_match_score AS p WHERE p.player_id=${playerId} AND m.match_id=p.match_id`;
    const result = await db.all(query);
    response.send(result.map(convertToMatchObj));
  } catch (error) {
    console.error(`Error fetching matches for player: ${error.message}`);
    response.status(500).send('Internal Server Error');
  }
});

app.get('/matches/:matchId/players', async (request, response) => {
  try {
    const { matchId } = request.params;
    const query = `SELECT player_id, player_name FROM player_details AS m, player_match_score AS p WHERE p.match_id=${matchId} AND m.player_id=p.player_id`;
    const result = await db.all(query);
    response.send(result.map(convertToPlayerObj));
  } catch (error) {
    console.error(`Error fetching players for match: ${error.message}`);
    response.status(500).send('Internal Server Error');
  }
});

app.get('/players/:playerId/playerScores', async (request, response) => {
  try {
    const { playerId } = request.params;
    const query = `SELECT player_id, player_name, SUM(score) AS totalScore, SUM(fours) AS totalFours, SUM(sixes) AS totalSixes FROM player_details AS m, player_match_score AS p WHERE m.player_id=p.player_id AND player_id=${playerId}`;
    const result = await db.get(query);
    if (result) {
      response.send({
        playerId: result.player_id,
        playerName: result.player_name,
        totalScore: result.totalScore,
        totalFours: result.totalFours,
        totalSixes: result.totalSixes
      });
    } else {
      response.status(404).send('Player not found');
    }
  } catch (error) {
    console.error(`Error fetching player scores: ${error.message}`);
    response.status(500).send('Internal Server Error');
  }
});
module.exposts=app

