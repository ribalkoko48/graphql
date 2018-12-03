var express = require('express');
var graphqlHTTP = require('express-graphql');
var {buildSchema} = require('graphql');

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
type RandomDie {
    numSides: Int!
    rollOnce: Int!
    roll(numRolls: Int!): [Int]
}

input InputData {
    content: String
    author: String
}

type Message {
    id: ID!
    content: String
    author: String
}

type Mutation {
    createMes(inputData: InputData): Message
    updateMes(id: ID!, inputData: InputData): Message
}

type Query {
    quoteOfTheDay: String
    random: Float!
    rollThreeDice: [Int]
    rollDice(numDice: Int!, numSide: Int) : [Int]
    getDie(numSides: Int!): RandomDie
    getMes(id: ID!): Message
}
`);

class RandomDie {
    constructor(numSides) {
        this.numSides = numSides;
    }

    rollOnce() {
        return 1 + Math.floor(Math.random() * this.numSides);
    }

    roll({numRolls}) {
        var output = [];
        for (var i = 0; i < numRolls; i++) {
            output.push(this.rollOnce());
        }
        return output;
    }
}

class Message {
    constructor(id, {content, author}) {
        this.id = id;
        this.content = content;
        this.author = author;
    }
}

// хранилище данных
const someStore = {}

var root = {
    quoteOfTheDay: () => Math.random() < 0.5 ? 'Меньше' : 'Больше',
    random: () => Math.random(),
    rollThreeDice: () => [1, 2, 3].map((item, i) => item + i),
    rollDice: ({numDice}) => Array.from({length: numDice}, (_, i) => i),
    getDie: ({numSides}) => new RandomDie(numSides || 6),
    createMes: ({inputData}) => {
        const id = require('crypto').randomBytes(10).toString('hex');

        someStore[id] = inputData
        console.log(someStore)

        return new Message(id, inputData)
    },
    getMes: ({id}) => {
        if (!someStore[id]) throw new Error('В базе нет пользователя с нужным Вам Id')

        return {id, ...someStore[id]}
    },
    updateMes: ({id, inputData}) => {
        if (!someStore[id]) throw new Error('В базе нет пользователя с нужным Вам Id')

        someStore[id] = inputData

        return new Message(id, inputData)
    }
};

/*
{
 random
}
*/
/*
mutation {
  createMes(inputData: {
    author: "Kostya",
	  content: "Hello!!"
  }) {id, author, content}
}
*/


var app = express();
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));
app.listen(4000);
console.log('Running a GraphQL API server at localhost:4000/graphql');

/*
fetch('/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({
  	query: '{getMes(id: "8f78fa383c1a1d28495f"){id,author,content}}'
 	})
})
  .then(r => r.json())
  .then(data => console.log('data returned:', data));
*/