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
  // console.log('USERS: ', users);
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
  // console.log('CURRENT USER: ', currentUser);
  const currentUsersCountriesIDs = await db.query(
    'SELECT countries_id FROM users_journeys WHERE user_id=$1',
    [currentUser]
  );
  // console.log('COUNTRIES ID: ', currentUsersCountriesIDs);
  let usersCountries = [];
  currentUsersCountriesIDs.rows.forEach((country) => {
    usersCountries.push(country.countries_id);
  });
  // console.log('Users Countries IDs: ', usersCountries);

  const allCountriesQuery = await db.query('SELECT * FROM countries');
  // console.log('All Countries: ', allCountriesQuery.rows);

  let countries = [];
  for (let i = 0; i < allCountriesQuery.rows.length; i++) {
    // console.log('Country: ', allCountriesQuery.rows[i].country_code);

    // console.log('I: ', allCountriesQuery.rows[i].id);

    for (let j = 0; j < usersCountries.length; j++) {
      // console.log('J: ', usersCountries[j]);
      if (allCountriesQuery.rows[i].id === usersCountries[j]) {
        // console.log(
        //   'FOUND MATCH: ' +
        //     allCountriesQuery.rows[i].id +
        //     ' : ' +
        //     usersCountries[j] +
        //     ' : ' +
        //     allCountriesQuery.rows[i].country_code
        // );
        countries.push(allCountriesQuery.rows[i].country_code);
      }
    }

    // console.log(
    //   'COUNTRIES: ' +
    //     countries +
    //     ' TOTAL: ' +
    //     countries.length +
    //     ' USERS: ' +
    //     users +
    //     ' COLOR: teal'
    // );

    // console.log('COUNTRIES: ', countries);
    // console.log('TOTAL: ', countries.length);
    // console.log('USERS: ', users);

    // console.log(
    //   'Users idx: ' +
    //     usersCountries[i] +
    //     ' Countries idx: ' +
    //     allCountriesQuery.rows[i].country_code
    // );
  }

  // console.log('COUNTRIES: ', countries);
  res.render('index.ejs', {
    countries: countries,
    total: countries.length,
    users: users,
    color: 'teal',
  });

  // console.log(
  //   'CURRENT USER VISITED COUNTRIES ID: ',
  //   usersCountries
  // );
  // let userCountries = [];
  // usersCountries.forEach(async (item) => {
  // console.log('ITEM: ', item);
  // const convertedResult = await db.query(
  //   'SELECT country_code FROM countries WHERE id=$1',
  //   [item]
  // );
  // console.log(
  //   'CONVERTED RESULT: ',
  //   convertedResult.rows[0].country_code
  // );
  // userCountries.push(convertedResult.rows[0].country_code);
  // console.log('USER COUNTRIES: ', userCountries);
  // return userCountries;
});
// console.log('USER COUNTRIES PART TWO: ', userCountries);
// });

app.post('/new', async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
