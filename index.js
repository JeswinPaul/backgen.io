#!/usr/bin/env node
import chalk from "chalk";
import inquirer from 'inquirer';
import { createSpinner } from 'nanospinner';
import figlet from "figlet";
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { request, GraphQLClient } from 'graphql-request'
import { exec } from 'child_process'
import 'dotenv/config'

import { project_query, projects_query } from "./gql/query.js"
import { login_mutation } from "./gql/mutation.js"
import { dockerFile, dockerIgnore, envContent, gitIgnore, indCode, mongoFile, packageCode, resolve, typeCode } from "./backgen/covertor.js";

const endpoint = `https://backgen-server.onrender.com`

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const hasNodeModulesFolder = fs.existsSync('node_module');

const currentFolders = __dirname?.split('/')
const allarg = process.argv

let email
let password
let project
let user

const getUser = () => {
    const command = 'npm config get backgen';
    exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing command: ${error}`);
        user = null
    }else if(stdout.split('').length <= 10){
        user = null
    }else{
        user = stdout
    }
    })
}

const headers = {
    Authorization: user?.split(':')[1].split('\n').join('') || '',
}

function welcome(){
    getUser()
    figlet("backgen.io",{font:"Ogre"}, function (err, data) {
        if (err) {
          console.log("Something went wrong");
          console.dir(err);
          return;
        }
        console.log(data);
        console.log(chalk.hex("#ffc42e")("Beta v0.2"))
        console.log("");
        console.log('Know more: https://backgen.io');
        console.log("");
        setTimeout(() => {
            if(allarg[2] === 'login'){
                if(user){
                    console.log("You are already logged in as");
                    console.log(chalk.hex("#12a7cd")(user?.split(':')[0]))
                    console.log("");
                }else{
                    askLogin()
                }
            }else if(allarg[2] === 'clone'){
                if(user){
                    onClone()
                }else{
                    console.log("Please login to continue");
                    askLogin()
                    .then(()=>{
                        if(user){
                            onClone()
                        }
                    })
                }
            }else if(allarg[2] === 'update'){
                // onUpdate()
                console.log("Command: update is " + chalk.hex("#ffc42e")("Under development"));
                console.log("");
            }else if(allarg[2] === 'whoami'){
                const command = 'npm config get backgen';
                const spinner = createSpinner("Please wait").start()
                exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing command: ${error}`);
                    return;
                }
                setTimeout(() => {
                    if(stdout.split('').length <= 10){
                        spinner.error({text:"User not found"})
                    }else{
                        spinner.stop()
                        console.log(chalk.hex("#12a7cd")(stdout.split(':')[0]));
                    }
                }, 100)
                })
            }else if(allarg[2] === 'logout'){
                if(user){
                    onLogout()
                }else{
                    console.log("You are not logged in");
                }
            }else if(allarg[2] === 'run'){
                // onServe()
                console.log("Command: run is " + chalk.hex("#ffc42e")("Under development"));
                console.log("");
            }else if(allarg[2] === 'options'){
                allOptions()
            }else{
                console.log("Commands:");
                console.log("");
                console.log("clone                  Clone a project created in Backgen")
                console.log("update                 Update existing project in the current directory "+chalk.hex("#ffc42e")("[Under development]"))
                console.log("run                    Run the project in the current directory "+chalk.hex("#ffc42e")("[Under development]"))
                console.log("");
                console.log("login                  Login to an Backgen account")
                console.log("logout                 Logout of an Backgen account")
                console.log("whoami                 Return the currently authenticated account")
                console.log("");
                console.log("options                Show all options")
                console.log("");
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

async function onLogin(){
    const spinner = createSpinner('Please wait').start()
    const loginVar = {
        "login": {
            "email": email,
            "password": password
        }
    }
    await request(endpoint, login_mutation, loginVar, headers)
    .then((data)=>{
        spinner.success()
        const command = `npm config set backgen ${email+':'+data?.onLogin} -g`
        exec(command, (error, stdout, stderr) => {
            if(error){
                console.log('Something went wrong');
            }
            spinner.success({text:`Successfully logged in as`})
            console.log(chalk.hex("#12a7cd")(email))
        })
    }).catch((err)=>{
        spinner.error({text:`Invalid credentials`})
    })
}

async function onLogout(){
    const command = "npm config delete backgen -g"
    const spinner = createSpinner('Please wait').start()
    exec(command, (error, stdout, stderr) => {
        if(error){
            console.log('Something went wrong');
        }
        spinner.success({text:`Successfully logged out`})
    })
}

async function allOptions(){
    const data = await inquirer.prompt({
        name: 'options',
        type: 'list',
        message: 'Select option:',
        choices:user? ["clone", "update", "help", "logout"] : ["login","register"]
    })
    if(data.options === 'login'){
        return askLogin()
    }else if(data.options === 'clone'){
        onClone()
    }else if(data.options === 'update'){
        onUpdate()
    }else if(data.options === 'logout'){
        onLogout()
    }else if(data.options === 'login'){
        onLogin()
    }
}

function onClone(){
    if(allarg[3] || project){
        checkProject(allarg[3] || project)
    }else{
        cloneOptions()
    }
}

async function cloneOptions(){
    const data = await inquirer.prompt({
        name: 'options',
        type: 'list',
        message: 'Select option:',
        choices:["Get all projects", "Enter project ID"]
    })
    if(data.options === 'Get all projects'){
        getAllProject()
    }else if(data.options === 'Enter project ID'){
        getProjectId()
    }
}

async function getAllProject(){
    const spinner = createSpinner('Getting projects').start()
    const allProjVar = {
        getProjectId:""
    }
    const allProjHead = {
        Authorization: user?.split(':')[1].split('\n').join('') || '',
    }
    await request(endpoint, projects_query, allProjVar, allProjHead)
    .then((data)=>{
        spinner.success()
        showAllProject(data?.getUser?.projects);
    }).catch((error)=>{
        spinner.error()
        console.log(error.message);
    })
}

async function showAllProject(datas){
    const data = await inquirer.prompt({
        name: 'options',
        type: 'list',
        message: 'Select project:',
        choices: datas?.map((item)=>item?.name)
    })
    if(data.options){
        checkProject(datas?.find((e)=>e.name === data.options)?.uuid)
    }
}

async function getProjectId(){
    const data = await inquirer.prompt({
        name: 'project',
        type: 'input',
        message: 'Project ID:'
    })
    return checkProject(data?.project)
}

async function checkProject(datas){
    const spinner = createSpinner('Checking project').start()
    const allProjVar = {
        getProjectId:datas
    }
    const allProjHead = {
        Authorization: user?.split(':')[1].split('\n').join('') || '',
    }
    await request(endpoint, project_query, allProjVar, allProjHead)
    .then((data)=>{
        spinner.success()
        getProject(data);
    })
    .catch((error)=>{
        spinner.error()
    })
}

function getProject(data){
    const spinner = createSpinner('Downloading').start()

    const db = data? data?.getProject?.database : ""
    const feat = data? data?.getProject?.services : []
    const trigg = data? data?.getProject?.triggers : []
    const schema = data? data?.getProject?.schemas : []

    const backgenCode = `{\n    "name":"${data?.getProject?.name}",\n    "projectID":"${data?.getProject?.uuid}",\n    "user":""\n}`

    try{
        const folderName = data?.getProject?.name;
        fs.mkdirSync(folderName);

        const jsonData = JSON.stringify(packageCode({data:data, db:db}), null, 2);

        const nestedFolderName = 'schema';
        fs.mkdirSync(`${folderName}/${nestedFolderName}`);

        fs.writeFileSync(`${folderName}/${nestedFolderName}/resolvers.js`, resolve({db:db, schema:schema, trigg:trigg}));
        fs.writeFileSync(`${folderName}/${nestedFolderName}/typeDefs.js`, typeCode({schema:schema, db:db}));

        fs.writeFileSync(`${folderName}/index.js`, indCode(db));

        fs.writeFileSync(`${folderName}/backgen.json`, backgenCode);
        fs.writeFileSync(`${folderName}/package.json`, jsonData);
        fs.writeFileSync(`${folderName}/.env`, envContent(db));

        const dock = () => {
            if (feat?.filter((e) => e === "401")?.length > 0) {
                fs.writeFileSync(`${folderName}/Dockerfile`, dockerFile), fs.writeFileSync(".dockerignore", dockerIgnore)
            }
        }

        const git = () => {
            if (feat?.filter((e) => e === "402")?.length > 0) {
                fs.writeFileSync(`${folderName}/.gitignore`, gitIgnore)
            }
        }

        const mongo = () => {
            if (db === "MongoDB") {
                fs.writeFileSync(`${folderName}/mongodb.js`, mongoFile)
            }
        }

        mongo()
        dock()
        git()
        
        setTimeout(() => {
            spinner.success()
        }, 3000)

    }catch(err){
        if(err?.code === 'EEXIST'){
            spinner.error({text:"Error: Folder with project name already exist"})
        }else{
            spinner.error({text:"Error: Downloading failed"})
            console.log(err);
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
        console.log(data);
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