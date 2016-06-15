

# ClientComm
Communications interface for case managers at Criminal Justice Services (CJS) in Salt Lake County, Utah. Code for America 2016 Fellowship Project.


## Set up assistance [![Join the chat at https://gitter.im/slco-2016/clientcomm](https://badges.gitter.im/slco-2016/clientcomm.svg)](https://gitter.im/slco-2016/clientcomm?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
Need assistance setting up this tool? Questions about the application structure? Send Kuan an [email](http://kuanbutts.com/contact/), or join the [conversation on Gitter](https://gitter.im/slco-2016/clientcomm).


## How to run
### Setting up dependencies and default settings
`git clone` the repository and then `cd` into it. `npm install` all dependencies. Start with `npm start`. This will run `nodemon` which will listen for changes everywhere but ignore `node_modules` folder. Make sure you have PostgreSQL up and running. Don't have PostgresSQL? Postgres.app is a great solution for Macs. Check it out [here](http://postgresapp.com/).

While in the root directory of this repo, run `touch credentials.js`. Your credentials should resemble the below example:

```
module.exports = {
  accountSid:    "__________________________",
  authToken:     "__________________________",
  twilioNum:     "+_________________________",
  sessionSecret: "__________________________",
  db: {
    user:        "__________________________",
    password:    "__________________________",
    host:        "__________________________"
  },
  em: {
    password:    "__________________________"
  }
}
```

##### Modifying knexfile.js connection settings
You will also need to configure the `knexfile.js` file. It is necessary to use the PostgreSQL as indicated in the example `development`, `testing`, and `production` objects. The reason for this is that ClientComm utilizes a number of raw SQL queries which include notation that is specific to PostgreSQL. In particular, it will be necessary to update the `connection.user` and `connection.database` values to whatever your configuration is.

##### Setting development and production environment defaults
With those two files set up, you should be good to go. In order to set which environment you are working in, navigate to `server/db.js`. At the top of that file, the variable `env` should be set in the following manner: `var env = "development"`. You can update this variable to whatever object keys you have in you `knexfile.js`. This will allow you to control whether you are working in, for example, a testing environment, a development environment, or a production environment.
