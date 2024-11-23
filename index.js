import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import 'dotenv/config';

const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

let currentUserId = 1;

// let users = [
//   { id: 1, name: 'Angela', color: 'teal' },
//   { id: 2, name: 'Jack', color: 'powderblue' },
//   { id: 3, name: 'Miles', color: 'darkred' },
// ];

let users = [];

async function getUsers() {
  const result = await db.query('SELECT * FROM users');
  // console.log('RESULT: ', result.rows);
  users = [];
  result.rows.forEach((user) => {
    users.push(user);
  });
  return users;
}

async function checkVisisted() {
  const result = await db.query(
    'SELECT country_code FROM visited_countries'
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  console.log('COUNTRIES: ', countries);
  return countries;
}
app.get('/', async (req, res) => {
  const users = await getUsers();
  console.log('USERS', users);
  const countries = await checkVisisted();
  res.render('index.ejs', {
    countries: countries,
    total: countries.length,
    users: users,
    color: 'teal',
  });
});

app.post('/add', async (req, res) => {
  const input = req.body['country'];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        'INSERT INTO visited_countries (country_code) VALUES ($1)',
        [countryCode]
      );
      res.redirect('/');
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post('/user', async (req, res) => {
  const users = await getUsers();

  const currentUser = req.body.user;
  const currentUsersCountriesIDs = await db.query(
    'SELECT countries_id FROM users_journeys WHERE user_id=$1',
    [currentUser]
  );
  let usersCountries = [];
  currentUsersCountriesIDs.rows.forEach((country) => {
    usersCountries.push(country.countries_id);
  });

  const allCountriesQuery = await db.query('SELECT * FROM countries');

  let countries = [];
  for (let i = 0; i < allCountriesQuery.rows.length; i++) {
    for (let j = 0; j < usersCountries.length; j++) {
      if (allCountriesQuery.rows[i].id === usersCountries[j]) {
        countries.push(allCountriesQuery.rows[i].country_code);
      }
    }
  }

  res.render('index.ejs', {
    countries: countries,
    total: countries.length,
    users: users,
    color: 'teal',
  });
});

app.post('/new', async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
