# ClientComm
Communications interface for case managers at CJS.

## How to run
`git clone` the repository and then `cd` into it. `npm install` all dependencies. Start with `npm start`. This will run `nodemon` which will listen for changes everywhere but ignore `node_modules` folder. Make sure you have `PostgreSQL` up and running. Then, while in the root directory of this repo, run `touch credentials.js`. Your credentials should look like thfe following:

```
module.exports = {
	accountSid: "________________________________",
	authToken: "________________________________",
	twilioNum: "+_________",
	sessionSecret: "______________",
	db: {
    user:     "________",
    password: "________",
    host: "__________________"
	}
}
```

You will also need to configure the `knexfile.js` file. Create this as well in root, should it not exist. The file should be good to go except for the fact that you will need to update the development `psql` database to whatever name you prefer:

```
development: {
  client: "postgresql",
  connection: {
    user: "________",
    database: "________"
  }
}
```