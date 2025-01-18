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

let users = [];
let currentUser;

async function getUsers() {
  const result = await db.query('SELECT * FROM users');
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
  return countries;
}
app.get('/', async (req, res) => {
  const users = await getUsers();
  const countries = await checkVisisted();
  res.render('index.ejs', {
    countries: 0,
    total: 0,
    users: users,
    color: 'teal',
  });
});

// *******************  1.B  *********************
// UPDATING POST/ADD ROUTE
// ******************  START  *******************
app.post('/add', async (req, res) => {
  const input = req.body['country'];

  try {
    // *******************  1.B  *********************
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
      // *******************  1.B  *********************
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
  // *******************  1.B  *********************
  // This conlcudes the above code
  // *******************  END  ********************
});

app.post('/user', async (req, res) => {
  const users = await getUsers();
  // *******************  1.A - b  *******************
  // ****************** START ********************
  // Using if statement here to render new.ejs so a family
  // member can be added if the Add Family Member
  // option is selected. 
  if (req.body.add) {
    res.render('new.ejs');
  }
  // *****************  1.A - b  *******************
  // ******************  END  ********************
  currentUser = req.body.user;
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

// *******************  1.C  **********************
// Adding a new user is simple. 
// Grab the name and color inputs from the req.body
// and add them to the db using 1 query.
// Afterwards, redirect to the root.
// *****************  START  ********************

  try {
    
    const result = await db.query(
      'INSERT INTO users (first_name, color) VALUES ($1, $2)', [req.body.name, req.body.color]
    );
    res.redirect('/');
  } catch (error) {
    console.log(error)
  }

    // *******************  1.C  *********************
   // ******************  END  *********************

});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
