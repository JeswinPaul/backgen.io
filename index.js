#!/usr/bin/env node
import chalk from "chalk";
import inquirer from 'inquirer';
import { createSpinner } from 'nanospinner';
import figlet from "figlet";
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { gql, request } from 'graphql-request'
import { exec } from 'child_process'

const endpoint = ``

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const hasNodeModulesFolder = fs.existsSync('node_module');

const currentFolders = __dirname?.split('/')
const allarg = process.argv

const query = gql`

`

const variables = {
    getAdsId: "job"
}

const packageCodeFire = '{\n  "name": "server-factory",\n  "version": "1.0.0",\n  "description": "",\n  "main": "index.js",\n  "scripts": {\n    "start": "node index.js",\n    "test": "nodemon index.js"\n  },\n  "keywords": [],\n  "author": "",\n  "license": "ISC",\n  "dependencies": {\n    "@apollo/server": "^4.7.1",\n    "firebase": "^9.22.0",\n    "graphql": "^16.6.0",\n    "nodemon": "^2.0.22"\n  }\n}'

let user = "Jeswin"
let email
let password
let project

function welcome(){
    figlet("Backgen",{font:"Rectangles"}, function (err, data) {
        if (err) {
          console.log("Something went wrong");
          console.dir(err);
          return;
        }
        console.log(data);
        console.log(chalk.hex("#FF0000")("Under construction"))
        console.log("");
        setTimeout(() => {
            if(allarg[2] === 'login'){
                askLogin()
            }else if(allarg[2] === 'clone'){
                onClone()
            }else if(allarg[2] === 'update'){
                onUpdate()
            }else if(allarg[2] === 'whoami'){
                console.log(chalk.hex("#12a7cd")(user))
            }else if(allarg[2] === 'run'){
                onServe()
            }else{
                allOptions()
            }
        }, 1000)
    });
}

async function askLogin(){
    const data = await inquirer.prompt({
        name: 'email',
        type: 'input',
        message: 'Email Address:'
    })
    email = data.email
    return askPassword()
}

async function askPassword(){
    const data = await inquirer.prompt({
        name: 'password',
        type: 'password',
        message: 'Password:'
    })
    password = data.password
    return onLogin()
}

function onLogin(){
    const spinner = createSpinner('Please wait').start()

    setTimeout(() => {
        spinner.success({text:`Successfully logged in as`})
        console.log(chalk.hex("#12a7cd")(email))
    }, 3000)
}

async function allOptions(){
    const data = await inquirer.prompt({
        name: 'options',
        type: 'list',
        message: 'Select option:',
        choices:user? ["clone", "update", "help"] : ["clone", "update", "help"]
    })
    if(data.options === 'login'){
        return askLogin()
    }else if(data.options === 'clone'){
        onClone()
    }else if(data.options === 'update'){
        onUpdate()
    }
}

function onClone(){
    if(allarg[3] || project){
        checkProject()
    }else{
        getProjectId()
    }
}

async function getProjectId(){
    const data = await inquirer.prompt({
        name: 'project',
        type: 'input',
        message: 'Project ID:'
    })
    project = data?.project
    return onClone()
}

async function checkProject(){
    const spinner = createSpinner('Checking project').start()
    const data = [{image:"1234"}]
    // await request(endpoint, query, variables, headers)
    // .then((data)=>{
    //     spinner.success()
    //     getProject(data?.getAds)
    // })
    setTimeout(() => {
        spinner.success()
        getProject(data)
    }, 3000)
    // .catch((error)=>{
    //     spinner.error("Error: Download failed")
    // })
}

function getProject(data){
    const spinner = createSpinner('Downloading').start()
    try{
        const folderName = 'backgen';
        fs.mkdirSync(folderName);

        const nestedFolderName = 'schema';
        fs.mkdirSync(`${folderName}/${nestedFolderName}`);

        const file1Content = `console.log('${data[0]?.image}');`;
        const file2Content = `console.log('File 2');`;
        const file3Content = `console.log('File 3');`;

        fs.writeFileSync(`${folderName}/${nestedFolderName}/resolvers.js`, file1Content);
        fs.writeFileSync(`${folderName}/${nestedFolderName}/typeDefs.js`, file1Content);

        fs.writeFileSync(`${folderName}/index.js`, file2Content);

        fs.writeFileSync(`${folderName}/package.json`, packageCodeFire);
        fs.writeFileSync(`${folderName}/.env`, file3Content);
        setTimeout(() => {
            spinner.success()
        }, 3000)
    }catch(err){
        if(err?.code === 'EEXIST'){
            spinner.error({text:"Error: Folder with project name already exist"})
        }else{
            spinner.error({text:"Error: Downloading failed"})
        }
    }
}

function onUpdate(){
    const spinner = createSpinner('Checking project').start()
    
    fs.access(`${__dirname}/backgen.json`, fs.constants.F_OK, (err) => {
        if (err) {
            setTimeout(() => {
                spinner.error({text:"Error: backgen.json not found"})
            }, 2000)
        }else{
            fs.readFile(`${__dirname}/backgen.json`, 'utf8', (err, data) => {
                if (err) {
                    setTimeout(() => {
                        spinner.error({text:"Error: backgen.json not found"})
                    }, 2000)
                }
                try {
                    const jsonData = JSON.parse(data);
                    setTimeout(() => {
                        spinner.success()
                        checkUpdate(jsonData);
                    }, 2000)
                } catch (err) {
                    setTimeout(() => {
                        spinner.error({text:"Error: backgen.json not found"})
                    }, 2000)
                }
            });
        }
    });
}

function checkUpdate(data){
    const spinner = createSpinner('Checking for update').start()
    setTimeout(() => {
        spinner.success()
        console.log(`${data?.backgen?.name}/${data?.backgen?.user?.username}`);
    }, 3000)
}

function onServe(){
    const command = 'npm install';
    const spinner = createSpinner("Running "+ command).start()
    exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing command: ${error}`);
        return;
    }
    setTimeout(() => {
        spinner.success()
        console.log(`Command output: ${stdout}`);
        pm2Setup()
    }, 3000)
    })
}

function pm2Setup(){
    const spinner = createSpinner("Setting up PM2").start()
    setTimeout(() => {
        spinner.success()
    }, 3000)
}

welcome()