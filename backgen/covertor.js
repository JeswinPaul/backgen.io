const indexCode = "const { ApolloServer } = require('@apollo/server');\nconst { startStandaloneServer } = require('@apollo/server/standalone');\nrequire('dotenv').config()\n\nconst { typeDefs } = require('./schema/typeDefs.js')\nconst { resolvers } = require('./schema/resolvers.js')\n\nasync function startServer() {\n const server = new ApolloServer({\n  typeDefs,\n  resolvers,\n });\n\n const { url } = await startStandaloneServer(server, {\n  listen: { port: 4000 },\n  context:({req:{headers}})=>{\n   if(headers?.authorization != process.env.BEARER_TOKEN) throw new Error('no auth')\n  }\n });\n\n console.log(`🚀  Server ready at: ${url}`);\n}\n\nstartServer()"
const indexCodeMongo = "const { ApolloServer } = require('@apollo/server');\nconst { startStandaloneServer } = require('@apollo/server/standalone');\nrequire('dotenv').config()\n\nconst { typeDefs } = require('./schema/typeDefs.js')\nconst { resolvers } = require('./schema/resolvers.js')\nconst { client } = require('./mongodb.js')\n\nasync function startServer() {\n const server = new ApolloServer({\n  typeDefs,\n  resolvers\n });\n\n const { url } = await startStandaloneServer(server, {\n  listen: { port: 4000 },\n  context:({req:{headers}})=>{\n   if(headers?.authorization != process.env.BEARER_TOKEN) throw new Error('no auth')\n  }\n });\n\n await client.connect().then(()=>{\n  console.log(`🍀  MongoDB connected`);\n })\n  console.log(`🚀  Server ready at: ${url}`);\n }\n\nstartServer()"

function DynoType({val, list}){
    if(val === 'String'){
        return list? 'SS' : 'S'
    }else if(val === 'Int'){
        return list? 'NS' : 'N'
    }else if(val === 'Bool'){
        return list? 'L' : 'BOOL'
    }else if(val === 'ID'){
        return 'S'
    }
}

const resolverCodeDyno = `const { DynamoDB } = require('@aws-sdk/client-dynamodb');\nconst { v4: uuidv4 } = require('uuid');\nrequire('dotenv').config()\n\nconst db = new DynamoDB({region: process.env.AWS_REGION, credentials:{accessKeyId: process.env.AWS_ACCESSKEY, secretAccessKey: process.env.AWS_SECRETKEY}});\n\n`
const resolverCodeFire = `const { initializeApp } = require('firebase-admin/app');\nrequire('dotenv').config()\n\nconst firebaseConfig = {\n};\nadmin.initializeApp(firebaseConfig);\nconst db = admin.firestore();\n\n`
const resolverCodeMongo = `const { ObjectId } = require('mongodb');\nrequire('dotenv').config()\n\nconst { db } = require('../mongodb.js');\n\n`

const resolverCode1 = `const resolvers = {\n`
const resolverCodeEnd = `\n};\n\nmodule.exports = { resolvers };`

function packageCodeDyno(data) {
    const packageCode = {
        "name": data?.getProject?.name?.toLowerCase(),
        "version": "1.0.0",
        "description": "",
        "main": "index.js",
        "scripts": {
            "start": "node index.js",
            "test": "nodemon index.js"
        },
        "keywords": [],
        "author": data?.getProject?.author,
        "license": "ISC",
        "dependencies": {
            "@apollo/server": "^4.7.1",
            "@aws-sdk/client-dynamodb": "^3.328.0",
            "dotenv": "^16.3.1",
            "graphql": "^16.6.0",
            "nodemon": "^2.0.22",
            "uuid": "^9.0.0"
        }
    }
    return packageCode
}

function packageCodeFire(data) {
    const packageCode = {
        "name": data?.getProject?.name?.toLowerCase(),
        "version": "1.0.0",
        "description": "",
        "main": "index.js",
        "scripts": {
            "start": "node index.js",
            "test": "nodemon index.js"
        },
        "keywords": [],
        "author": data?.getProject?.author,
        "license": "ISC",
        "dependencies": {
            "@apollo/server": "^4.7.1",
            "dotenv": "^16.3.1",
            "firebase-admin": "^11.9.0",
            "graphql": "^16.6.0",
            "nodemon": "^2.0.22"
        }
    }
    return packageCode
}

function packageCodeMango(data) {
    const packageCode = {
        "name": data?.getProject?.name?.toLowerCase(),
        "version": "1.0.0",
        "description": "",
        "main": "index.js",
        "scripts": {
            "start": "node index.js",
            "test": "nodemon index.js"
        },
        "keywords": [],
        "author": data?.getProject?.author,
        "license": "ISC",
        "dependencies": {
            "@apollo/server": "^4.7.1",
            "dotenv": "^16.3.1",
            "graphql": "^16.6.0",
            "mongodb": "^5.6.0",
            "nodemon": "^2.0.22",
            "shortid": "^2.2.16"
        }
    }
    return packageCode
}

function resolveSpace({schema, trigg}){
    const resolve = schema?.length > 0 || trigg?.length > 0 ? '\n' : ''
    return resolve
}

function tableCodeFire(schema){
    const table = `${schema?.map(({ name }) => 'const ' + name + 'Ref = db.collection("' + name + 's"' + ');\n').join('')}`
    return table
}

function tableCodeDyno(schema){
    const table = `${schema?.map(({ name }) => 'const ' + name + 'Table = "";\n').join('')}`
    return table
}

function tableCodeMongo(schema){
    const table = `${schema?.map(({ name }) => 'const ' + name + 'Collection = db.collection("'+name+'");\n').join('')}`
    return table
}

function tableCode({db, schema}){
    const table = db === "Firebase" ? tableCodeFire(schema) : db === "MongoDB"? tableCodeMongo(schema) : tableCodeDyno(schema)
    return table
}

function typeDefs ({schema, db}){
    `${schema?.map(({ name, fields, arrays, relations, types, requires }) => `\n\ntype ${name} {\n${fields?.map((item, index) => `  ${db === "MongoDB" && item === "id"? "_id" : item}: ${arrays[index] ? '[' : ''}${relations[index] ? relations[index] : types[index] === "Bool"?"Boolean":types[index]}${requires[index] ? '!' : ''}${arrays[index] ? ']' : ''}\n`).join('')}}`).join('')}`
}

function inputs (schema){
    const input = `${schema?.map(({ name, fields, arrays, types, requires }) => `\n\ninput ${name}Input {\n  id: ID\n${fields?.filter(e=>e !== 'id' )?.map((item, index) => `  ${item}: ${arrays[index + 1] ? '[' : ''}${types[index + 1] === "Bool"?"Boolean":types[index + 1]}${requires[index + 1] ? '!' : ''}${arrays[index + 1] ? ']' : ''}\n`).join('')}}`).join('')}`
    return input
}

function inputs1 (schema){
    const input = `${schema?.map(({ name, fields, arrays, types, requires }) => `\n\ninput ${name}Filter {\n${fields?.map((item, index) => name === 'id' ? null : `  ${item}: ${arrays[index] ? '[' : ''}${types[index] === "Bool"?"Boolean":types[index]}${arrays[index] ? ']' : ''}\n`).join('')}}`).join('')}`
    return input
}

function queries (schema){
    const query = `\n\ntype Query {\n${schema?.map(({ name, functions }) => functions?.filter(e => e === 'get' || e === 'list')?.map((val) => `  ${val}${name}(${val === 'list' ? "filter:" + name + "Filter, limit:Int" : "id:ID!"}): ${val === 'list' ? '[' : ''}${name}${val === 'list' ? ']' : ''}\n`).join('')).join('')}}`
    return query
}

function mutations (schema){
    const mutation = `\n\ntype Mutation {\n${schema?.map(({ name, functions }) => functions?.filter(e => e === 'create' || e === 'update' || e === 'delete')?.map((val) => val === 'delete' ? `  ${val}${name}(id:ID!): String\n` : `  ${val}${name}(${name?.toLowerCase()}:${name}Input): ID\n`).join('')).join('')}}\n`
    return mutation
}

function resolveDynoQuery({schema, trigg}){
    const resolve = `  Query: {\n${schema?.map(({ name, functions, fields, types, arrays }) => functions?.filter(e => e === 'get' || e === 'list')?.map((val) => `   ${val}${name}: async (${val === 'list' ? '_,args,{}' : '_,{id},{}'})=>{\n  ${val === 'list' ? `   try{\n      const result = await db.scan({TableName: ${name}Table})\n      const resultArray = result?.Items?.map(obj => ({${fields?.map((items, index)=> `\n       ${items}:obj?.${items}.${DynoType({val:types[index], list:arrays[index]})}`)}\n      }))\n      return resultArray\n     } catch (error) {\n      console.error('Error ${val}ing ${name}:', error);\n      throw new Error('Failed to ${val} ${name}');\n     }` : `  const params = {\n     TableName: ${name}Table,\n     Key: {\n      id: { S: id },\n     }\n    };\n    try{\n     const result = await db.getItem(params)\n     return {     ${fields?.map((items, indexs)=> `\n      ${items}:result.Item?.${items}.${DynoType({val:types[indexs], list:arrays[indexs]})}`)}\n     }\n    } catch (error) {\n     console.error('Error ${val}ing ${name}:', error);\n     throw new Error('Failed to ${val} ${name}');\n    }`}\n   },\n`).join('')).join('')}  },\n  Mutation:{\n${schema?.map(({ name, functions, fields, types, arrays }, indexs) => functions?.filter(e => e === 'create' || e === 'update' || e === 'delete')?.map((val) => `   ${val}${name}: async (${val === 'delete' ? '_,{id},{}' : '_,args,{}'})=>{\n${val === 'create' ?'    const uuid = uuidv4()\n':''}${val === 'delete' ? '' : `    const {${fields?.map((items)=>` ${items}`)} } = args.${name?.toLowerCase()}\n`}${val === 'delete'?`    const params = {\n     TableName: ${name}Table,\n     Key: {\n      id: { S: id },\n     }\n    };\n`:val === 'create'?`    const params = {\n     TableName: ${name}Table,\n     Item: {\n      id: { S: id || uuid } },${fields?.filter(e=>e !== "id")?.map((items, index)=>`\n      ${items}: { ${DynoType({val:types[index + 1], list:arrays[index + 1]})}: ${items} }`)}\n     }\n    };\n` : `    const params = {\n     TableName: ${name}Table,\n     Key:{id:{S: id}},\n     UpdateExpression: "SET${fields?.filter(e=>e !== "id")?.map((items)=>` ${items}=:${items}`)}}}"\n     ExpressionAttributeValues:{${fields?.filter(e=>e !== "id")?.map((items,index)=>` ":${items}":{${DynoType({val:types[index + 1], list:arrays[index + 1]})}:${items}}`)}}\n     ReturnValues : "ALL_NEW"\n`}    try {${val === 'delete'?`\n     await db.deleteItem(params);`:val === 'create'?`\n     await db.putItem(params);`:`\n     await db.updateItem(params);`}\n${trigg?.filter(e => e?.when === val + name)?.map((itm) => `     ${itm?.name}()\n`).join('')}     return ${val === 'delete'? `"${name} deleted"`:val === 'create'?`params.Item.id.S`:`id`}\n    } catch (error) {\n     console.error('Error ${val === 'delete'? 'deleting': val === 'create'? 'creating': 'updating'} ${name}:', error);\n     throw new Error('Failed to ${val} ${name}');\n    }\n   },\n`).join('')).join('')}  },`
    return resolve
}

function resolveFireQuery({schema, trigg}){
    const resolve =  `  Query: {${schema?.map(({ name, functions }) => functions?.filter(e => e === 'get' || e === 'list')?.map((val) => `\n   ${val}${name}: async (${val === 'list' ? '_,args,{}' : '_,{id},{}'})=>{\n  ${val === 'list' ? `   try{\n      const result = ${name}Ref.get();\n      result.forEach((doc) => {\n       return doc.data()\n      })\n     } catch (error) {\n       console.error('Error ${val}ing ${name}:', error);\n       throw new Error('Failed to ${val} ${name}');\n     }` : `   try{\n      const result = await ${name}Ref.doc(documentId).get();\n      return result.data()\n     } catch (error) {\n      console.error('Error ${val}ing ${name}:', error);\n      throw new Error('Failed to ${val} ${name}');\n     }`}\n   },`).join('')).join('')}\n  },\n  Mutation:{\n${schema?.map(({ name, functions, fields }) => functions?.filter(e => e === 'create' || e === 'update' || e === 'delete')?.map((val) => `   ${val}${name}: async (${val === 'delete' ? '_,{id},{}' : '_,args,{}'})=>{    ${val === 'delete' ? `\n    try{\n     await ${name}Ref.doc(id).delete();\n     return "${name} deleted"\n    } catch (error){\n     console.error('Error deleting ${name}:', error);\n     new Error('Failed to ${val} ${name}')\n    }` :val === 'create'? `\n    const {${fields?.map((items)=>` ${items}`)}} = args.${name?.toLowerCase()}\n    const document = {${fields.map((e)=>`\n     ${e}: ${e}`)}\n    }\n    try{\n     const result = await ${name}Ref.add(document);\n     return id || result.id\n    } catch (error){\n     console.error('Error creating ${name}:', error);\n     new Error('Failed to ${val} ${name}')\n    }`:`\n    const {${fields?.map((items)=>` ${items}`)}} = args.${name?.toLowerCase()}\n    const document = {${fields.map((e)=>`\n     ${e}: ${e}`)}\n    }\n    try{\n     const result = await ${name}Ref.doc(id).update(document);\n     return id\n    } catch (error){\n     console.error('Error updating ${name}:', error);\n     throw new Error('Failed to ${val} ${name}')\n    }`}\n${trigg?.filter(e => e?.when === val + name)?.map((itm) => `    ${itm?.name}()\n`).join('')}   },\n`).join('')).join('')}  },`
    return resolve
}

function resolveMongoQuery({schema, trigg}){
    const resolve = ` Query: {${schema?.map(({ name, functions }) => functions?.filter(e => e === 'get' || e === 'list')?.map((val) => `\n   ${val}${name}: async (${val === 'list' ? '_,args,{}' : '_,{id},{}'})=>{\n  ${val === 'list' ? `   try{\n      const result = await ${name}Collection.find().toArray()\n      return result\n     } catch (error) {\n       console.error('Error ${val}ing ${name}:', error);\n       throw new Error('Failed to ${val} ${name}');\n     }` : `   try{\n      const result = await ${name}Collection.findOne({_id: new ObjectId(id)})\n      return result\n     } catch (error) {\n      console.error('Error ${val}ing ${name}:', error);\n      throw new Error('Failed to ${val} ${name}');\n     }`}\n   },`).join('')).join('')}\n  },\n  Mutation:{\n${schema?.map(({ name, functions, fields }) => functions?.filter(e => e === 'create' || e === 'update' || e === 'delete')?.map((val) => `   ${val}${name}: async(${val === 'delete' ? '_,{id},{}' : '_,args,{}'})=>{\n    try{\n     ${val === 'delete' ? `await ${name}Collection.deleteOne({_id: new ObjectId(id)})\n     return "${name} deleted"` : `const {${val === 'update'? ' id,' : '' }${fields?.filter(e=>e!=="id")?.map((items)=>val === 'create'?` ${items}`: ` ${items}`)} } = args.${name?.toLowerCase()}\n     const document = {${fields?.filter(e=>e!=="id")?.map((items)=>` ${items}:${items}`)}}\n     `}${val === 'create'?`const result =  await ${name}Collection.insertOne(document)\n     return result.insertedId`: val === 'update'?`await ${name}Collection.updateOne({_id: new ObjectId(id)},{$set:document})\n     return id`:''}\n${trigg?.filter(e => e?.when === val + name)?.map((itm) => `    ${itm?.name}()\n`).join('')}    } catch (error) {\n     console.error('Error ${val === 'delete'? 'deleting': val === 'create'? 'creating': 'updating'} ${name}:', error);\n     throw new Error('Failed to ${val} ${name}');\n    }\n   },\n`).join('')).join('')}  },`
    return resolve
}

function resolveQuery({db, schema, trigg}){
    const resolve = db === "Firebase" ? resolveFireQuery({schema:schema, trigg:trigg}) : db === "MongoDB"? resolveMongoQuery({schema:schema, trigg:trigg}) : resolveDynoQuery({schema:schema, trigg:trigg})
    return resolve
}

function resolveRelateMongo(schema){
    const resolve = `${schema?.map(({ name, relations, fields, arrays, relationFields })=> "\n  "+name+":{"+relations?.map((item, index)=> item!==""? `\n   ${fields[index]}: async(parent,{},{})=>{\n    try{\n     const result = await ${item}Collection.${arrays[index]?"find":"findOne"}({${arrays[index]?`${relationFields[index]}:parent._id`:`_id:parent.${fields[index]}`}})${arrays[index]?".toArray()":""}\n     return result\n    } catch (error) {\n     console.error('Error getting ${item}:', error);\n     throw new Error('Failed to get ${item}');\n    }\n   },` : '').join('')+"\n  }")}`
    return resolve
}

function resolveRelateDynamo(schema){
    const resolve = `${schema?.map(({ name, relations, fields, arrays, relationFields, types })=> "\n  "+name+":{"+relations?.map((item, index)=> item!==""? `\n   ${fields[index]}: async (parent,{},{})=>{\n    const params = {\n     TableName:${item}Table,${arrays[index]? `\n     FilterExpression:'${relationFields[index]} = :${relationFields[index]}',\n     ExpressionAttributeValues:{':${relationFields[index]}':{'S':parent.id}}\n    }` : `\n     Key: {\n      id: { S: parent.${fields[index]} },\n     }\n    }`}\n    try{\n     const result = await db.${arrays[index]?'scan':'getItem'}(params)${arrays[index]?`\n     const resultArray = result?.Items?.map(obj => ({${schema?.filter(e=>e.name === item)[0].fields?.map((items)=> `\n      ${items}:obj?.${items}.${DynoType({val:types[index], list:arrays[index]})}`)}\n     }))\n     return resultArray`:`\n     return{${schema?.filter(e=>e.name === item)[0].fields?.map((items)=> `\n      ${items}:result.Item?.${items}.${DynoType({val:types[index], list:arrays[index]})}`)}\n     }`}\n    } catch (error) {\n     console.error('Error getting ${item}:', error);\n     throw new Error('Failed to get ${item}');\n    }\n   },` : '').join('')+"\n  }")}`
    return resolve
}

function resolveRelateFire(schema){
    const resolve = `${schema?.map(({ name, relations, functions, arrays, fields, relationFields })=> "\n  "+name+":{"+relations?.map((item, index)=> item!==""? `\n   ${fields[index]}: async(parent,{},{})=>{\n    try{\n     const result = await ${arrays[index]? `${item}Ref.where('${relationFields[index]}', '==', parent.id).get()`:`${item}Ref.doc(parent.id).get()`};\n     ${arrays[index]?`result.forEach((doc) => {\n      return doc.data()\n     })`:`return result.data()`}\n    } catch (error) {\n     console.error('Error ${functions[index]}ing ${name}:', error);\n     throw new Error('Failed to ${functions[index]} ${name}')\n    }\n   },` : '').join('')+"\n  }")}`
    return resolve
}

function resolveRelate({db, schema}){
    const resolve = db === "MongoDB"? resolveRelateMongo(schema) : db === "Firebase" ? resolveRelateFire(schema) : resolveRelateDynamo(schema)
    return resolve
}

function resolverCode(db){
    const resolve = db === "Firebase" ? resolverCodeFire : db === "MongoDB"? resolverCodeMongo : resolverCodeDyno
    return resolve
}

function triggerCode(trigg){
    const trigger = `${trigg?.map((item) => '\nfunction ' + item?.name + '(){\n};\n').join('')}`
    return trigger
}

export function typeCode({schema, db}){
    const type = "const typeDefs = `#graphql" + typeDefs({schema:schema, db:db}) + inputs(schema) + inputs1(schema) + queries(schema) + mutations(schema) + "`;\n\nmodule.exports = { typeDefs };"
    return type
}

export function resolve({schema, db, trigg}){
    const resolve =  resolverCode(db) + tableCode({db:db, schema: schema}) + triggerCode(trigg) + resolveSpace({schema:schema, trigg:trigg}) + resolverCode1 + resolveQuery({db:db, schema:schema, trigg:trigg}) + resolveRelate({db:db, schema:schema}) + resolverCodeEnd
    return resolve
}

export const dockerFile = `FROM node:14-alpine\n\nWORKDIR /app\n\nCOPY package*.json ./\n\nRUN npm install\n\nCOPY . .\n\nEXPOSE 4000\n\nCMD [ "node", "index.js" ]`
export const dockerIgnore = `node_modules\nnpm-debug.log`
export const gitIgnore = `node_modules\nDS-STORE\n.DS_Store`

export function packageCode({data, db}){
    const code = db === "Firebase" ? packageCodeFire(data) : db === "DynamoDB"? packageCodeDyno(data) : packageCodeMango(data)
    return code
}

export function indCode(db){
    const code = db === "MongoDB"? indexCodeMongo : indexCode
    return code
}

export function envContent(db){
    const code = db === "Firebase" ? `BEARER_TOKEN=`: db === "MongoDB"? `BEARER_TOKEN=\nCONNECTION_URI=` : `BEARER_TOKEN=\nAWS_REGION=\nAWS_ACCESSKEY=\nAWS_SECRETKEY=`;
    return code
}

export const mongoFile = `const { MongoClient } = require('mongodb');\nrequire('dotenv').config()\n\nconst connectionURI = process.env.CONNECTION_URI;\nconst client = new MongoClient(connectionURI);\n\nconst db = client.db("backgen");\n\nmodule.exports = { client, db };`
