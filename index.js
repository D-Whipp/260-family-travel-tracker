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
let currentUser;

async function sayGlobalUser() {
  console.log('GLOBAL CURRENT USER: ', currentUser);
}

sayGlobalUser();

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
  // console.log('COUNTRIES: ', countries);
  return countries;
}
app.get('/', async (req, res) => {
  const users = await getUsers();
  // console.log('USERS', users);
  const countries = await checkVisisted();
  res.render('index.ejs', {
    countries: 0,
    total: 0,
    users: users,
    color: 'teal',
  });
});

// *******************  2.A  *********************
// DEPRECATED: Instructors code, Required
// updating as features progressed.
// ******************  START  *******************

// *****  SEE 2.B FOR ROUTE UPDATE  *******

// app.post('/add', async (req, res) => {
//   const input = req.body['country'];

//   try {
//     const result = await db.query(
//       "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
//       [input.toLowerCase()]
//     );

//     const data = result.rows[0];
//     // console.log('ADD ROUTE DATA: ', data);
//     const countryCode = data.country_code;
//     try {
//       await db.query(
//         'INSERT INTO visited_countries (country_code) VALUES ($1)',
//         [countryCode]
//       );
//       res.redirect('/');
//     } catch (err) {
//       console.log(err);
//     }
//   } catch (err) {
//     console.log(err);
//   }
// });
// *******************  2.A  *********************
// This concludes the above code
// ******************  END  *********************

// *******************  2.B  *********************
// UPDATING POST/ADD ROUTE
// ******************  START  *******************
app.post('/add', async (req, res) => {
  const input = req.body['country'];

  try {
    // *******************  2.B  *********************
    // Same as the original /add route, we take
    // the user's input and check for it in our db
    // ***************  CONTINUED  ****************

    const result = await db.query(
      "SELECT id FROM countries WHERE LOWER (country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryID = data.id;
    try {
      // *******************  2.B  *********************
      // Here we've changed our table to store the
      // user's visited country inside of users_journeys
      // and NOT visited_countries.
      // It's how I've chosen to keep track of each
      // individual user's journey.
      // ***************  CONTINUED  ****************
      await db.query(
        'INSERT INTO users_journeys (user_id, countries_id) VALUES ($1, $2)',
        [currentUser, countryID]
      );
      res.redirect('/');
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
  // *******************  2.B  *********************
  // This conlcudes the above code
  // *******************  END  ********************
});

app.post('/user', async (req, res) => {
  const users = await getUsers();
  // const currentUser = req.body.user;
  currentUser = req.body.user;
  console.log('CURRENT USER: ', currentUser);

  // *******************  1.A  *********************
  // The following code takes the ID's for the
  // countries the current user visited and
  // coverts them into country codes.
  // ******************  START  *******************

  const currentUsersCountriesIDs = await db.query(
    'SELECT countries_id FROM users_journeys WHERE user_id=$1',
    [currentUser]
  );
  let usersCountries = [];
  currentUsersCountriesIDs.rows.forEach((country) => {
    usersCountries.push(country.countries_id);
  });

  // *******************  1.A  *********************
  // Afterwards, we grab all the country data
  // from our database and check their country
  // codes against the users. If we find a match
  // we add the country code to the countries
  // list.
  // ***************  CONTINUED  ****************

  const allCountriesQuery = await db.query('SELECT * FROM countries');

  let countries = [];
  for (let i = 0; i < allCountriesQuery.rows.length; i++) {
    for (let j = 0; j < usersCountries.length; j++) {
      if (allCountriesQuery.rows[i].id === usersCountries[j]) {
        countries.push(allCountriesQuery.rows[i].country_code);
      }
    }
  }

  // *******************  1.A  *********************
  // Finally, we pass the countries list for
  // page rendering.
  // ***************  CONTINUED  ****************

  sayGlobalUser();

  res.render('index.ejs', {
    countries: countries,
    total: countries.length,
    users: users,
    color: 'teal',
  });

  // *******************  1.A  *********************
  // This conlcudes the above code
  // *******************  END  ********************
});

app.post('/new', async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
