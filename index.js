const dotenv = require("dotenv");
dotenv.config();
var jsforce = require("jsforce");
var conn = new jsforce.Connection({
    oauth2 : {
      clientId : process.env.CLIENT_ID,
      clientSecret : process.env.CLIENT_SECRET,
      redirectUri : process.env.LOGIN_URL
    }});

//LOGIN TO SALESFORCE
function login(callback) {
    conn.loginUrl = process.env.LOGIN_URL;
    if(process.env.USERNAME && process.env.PASSWORD) {
        conn.login(process.env.USERNAME + process.env.EXTENSION, process.env.PASSWORD, function(err, res) {
            if (err) { return console.error(err); }
            else { 
                console.log('\n');
                console.log("\x1b[32mSUCCESSFULLY LOGGED INTO SALESFORCE.");
                console.log("\x1b[32mRunning User: " + process.env.USERNAME + process.env.EXTENSION + '\x1b[0m');
                console.log('\n');
                if(callback){callback();}
            }
          });
    }
    else {
        console.log("Username and password not setup.")
    }
}

//find contacts using plain SOQL
//More on SOQL here: https://trailhead.salesforce.com/en/content/learn/modules/apex_database
function displayContactsSOQL() {
    conn.query("SELECT Id, Name, CreatedDate FROM Contact LIMIT 10", function(err, result) {
        if (err) { return console.error(err); }
        console.log("total : " + result.totalSize);
        for (var i=0; i<result.records.length; i++) {
            var record = result.records[i];
            console.log("Name: " + record.Name);
            console.log("Created Date: " + record.CreatedDate);
        }
      });
}

async function executeApexScript() {
    const apexBody = "System.debug('Hello, World');";
    const res = await conn.tooling.executeAnonymous(apexBody);
    console.log(`compiled?: ${res.compiled}`); // compiled successfully
    console.log(`executed?: ${res.success}`); // executed successfully
}

async function generateAssetOnOrder() {
    console.log('\x1b[36m%s\x1b[0m', '---> Executing generateAssetOnOrder <---\x1b[0m');
    const apexBody = "List<String> orderIds = new List<String>{%PARAMS_TO_REPLACE%};for(String s: orderIds){NE.JS_RemoteMethods.order2asset(s);}";
    const params = ['a2Ocl000007ppm8EAA'];
 
    
    const BATCH_SIZE = 2;
    for(let i = 0; i < params.length ; i += BATCH_SIZE){
        let paramsToReplace = '';
        for(let j = 0; j < BATCH_SIZE; j++){
            if(params[i + j]) {
                paramsToReplace += "'" + params[i + j] + "',"
            }
        }

        let fixedParams = replaceLast(paramsToReplace, ',', '');
        console.log(i);
        console.log('\x1b[0m\nCalling script on: \x1b[33m' + fixedParams + '\x1b[0m');
        let fixedScriptToRun = apexBody.replace('%PARAMS_TO_REPLACE%', fixedParams)
        
        const res = await conn.tooling.executeAnonymous(fixedScriptToRun);
        console.log(`\x1b[0mSuccess: \x1b[42m ${res.success} \x1b[0m`);
    }

    console.log('\n');
    console.log('\x1b[42m FINISH! \x1b[0m');
}


//to test out the above code on the command line:
//node index.js {command}
//
//where command is one of the case statements below
var callback = null;
if (process.argv[2]) { 
    switch(process.argv[2]) {
        case 'displayContactsSOQL': 
            console.log('\x1b[36m%s\x1b[0m', '---> Calling displayContactsSOQL <---');
            //callback = displayContactsSOQL; 
            break;
        case 'executeApexScript':
            console.log('\x1b[36m%s\x1b[0m', '---> Calling executeApexScript <---');
            //callback = executeApexScript;
            break;
        case 'generateAssetOnOrder':
            callback = generateAssetOnOrder;
            break;
    }
}
login(callback);


const replaceLast = (str, pattern, replacement) => {
    const match =
      typeof pattern === 'string'
        ? pattern
        : (str.match(new RegExp(pattern.source, 'g')) || []).slice(-1)[0];
    if (!match) return str;
    const last = str.lastIndexOf(match);
    return last !== -1
      ? `${str.slice(0, last)}${replacement}${str.slice(last + match.length)}`
      : str;
  };