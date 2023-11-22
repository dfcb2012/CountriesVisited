import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'YOUR_DATABASE',
  password: 'YOUR_PASSWORD',
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


async function alreadyVisited() {
  const result = await db.query("SELECT country_code FROM visited_countries");
      
  let countriesVisited = [];
  result.rows.forEach((country) => {
    countriesVisited.push(country.country_code);
  });
    return countriesVisited;
}

let totalOfCountries = 0;

app.get("/", async (req, res) => {
  const countriesVisited = await alreadyVisited();
  totalOfCountries = countriesVisited.length;
  res.render('index.ejs', { countries: countriesVisited, total: totalOfCountries });
});

app.post('/add', async (req, res) => {
  const countryChosen = req.body["country"];
  console.log(countryChosen);

  const result = await db.query(
    "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE $1 || '%';",
    [countryChosen.toLowerCase()]
  );

    if (result.rows.length === 1) {
      const data = result.rows[0];
      console.log(data);
      const countryCode = data.country_code;
      console.log(countryCode);

      const countryExist = await db.query(
        "SELECT country_code FROM visited_countries WHERE country_code = $1",
        [countryCode]
      );

      if (countryExist.rowCount === 1){
        const countriesVisited = await alreadyVisited();
        totalOfCountries = countriesVisited.length;
        const exist = true;
        res.render('index.ejs', {
          countries: countriesVisited,
          total: countriesVisited.length,
          countryCode: countryCode,
          error: "O país já se encontra adicionado! Sendo assim pretende eliminá-lo?",
          exist: exist
        });
      } else {
        await db.query(
          "INSERT INTO visited_countries (country_code) VALUES ($1)",
          [countryCode]
        );
        res.redirect("/");
      }    
    } else {
      console.log("I'm here");
      const countriesVisited = await alreadyVisited();
      totalOfCountries = countriesVisited.length;
      res.render("index.ejs", {
        countries: countriesVisited, 
        total: totalOfCountries,
        error: `O país introduzido não existe!` 
      });
    }
});

app.post('/delete', async (req, res) => {
  const countryCode = req.body['countryCode'];
  console.log(`Entering Delete path with country code "${countryCode}"`)

  await db.query(
    "DELETE FROM visited_countries WHERE country_code = $1",
    [countryCode]
  )
    res.redirect("/");
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
