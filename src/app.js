const express = require('express');
const bodyParser = require('body-parser');
const PORT = 5000 || process.env.PORT;
var mysql = require('mysql');
const UssdMenu = require('ussd-builder');
const { serialize } = require('v8');
const con = require('./config/database');
const bcrypt = require('bcrypt');


const sendResponse = (id, stage, region, number) => {
    console.log(id, stage, region)
    try {
        con.query(`select * from Stage where stage_crop_id = '${id}' and stage_id='${stage}' and stage_region_id = '${region}'`, (err, results) => {
            if (err) {
                menu.end("We are unable to retrieve any data at the momment")
                console.log(err)
            } else {
                if (results[0] == null) {
                    console.log(results)
                    menu.end("We do not have any data for that crop at the  moment. Our Teams are working tirelessly to provide it. Try again later")
                } else {

                    let response = results[0].stage_processes;
                    console.log(results[0]);

                    const options = {
                        to: [number],
                        message: `
                    Hello  there',
                  Response:\n
                  ${response} 
                  \n To unsubscribe from this service dial *384*6016#.

                        `
                    }

                    // Send message and capture the response or error
                    sms.send(options)
                        .then(response => {
                            console.log(response);

                        })
                        .catch(error => {
                            console.log(error);
                        });
                    menu.end("you will recieve a sms shortly")
                    console.log(dataToSave)

                }
            }

        })
    } catch (err) {
        menu.end("We are unable to retieve any data at the Moment.Try again Later")
    }



}


let response = `
Select the crop you have
`

let responseStage = `
Select the stage you want
`

let region_response = `
Select your region

`


let crops = {

}

// Here are some functions


const credentials = {
    apiKey: "20b7341cefda88668d9027b6b23c4eb3c0e40b9653ea0835760a44322b11d15a",
    username: "sandbox"
};

const Africastalking = require('africastalking')(credentials);

const sms = Africastalking.SMS

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/*

This is where the application starts running
It is the entry point and where the first state is rendered


*/


let menu = new UssdMenu();
menu.startState({
    run: () => {

        // use menu.con() to send response without terminating session
        menu.con('Welcome! How may we help you:' +
            '\n1. Register' +
            '\n2. Services' +
            '\n3. Admin' +
            '\n4. Quit'
        );
    },
    // next object links to next state based on user input
    next: {
        '1': 'register',
        '2': 'services',
        '3': 'admin',
        '4': 'quit'

    }
});

/*

THIS IS THE ADMIN PART 
IT HAS EVERYTHING TO DO WITH THE ADMIN RESPONSILITIES
FUNCTIONALITY INCLUDES ADDING A CROP
ADDING A STAGE
VIEWING ALL THE AVAILABLE CROPS

*/


menu.state("admin", {
    run: () => {
        menu.con("Enter your password")

    },
    next: {
        '*[a-zA-Z0-9]+': 'admin.password'

    }

})

menu.state("admin.password", {
        run: () => {
            con.query(`select * from admin where admin_password = '${menu.val}' `, (err, result) => {
                if (err) {
                    menu.end("Internal server error")
                } else if (result == 0) {
                    menu.end("Verification failed")


                } else {

                    menu.con("Select and option " +
                        "\n1. Add a crop" +
                        "\n2. View crops" +
                        "\n3. Add a stage "
                    )
                }
            })

        },


        next: {
            '1': 'password.add',
            '2': 'password.view',
            '3': 'password.stage'

        }

    }

)

menu.state("password.view", {
    run: () => {


        con.query(`select * from crop`, (err, results) => {
            if (err)(

                menu.con("There was a problem in the system ,try again later")
            )
            let response = `Availabe Crops  \n `

            // Here we read all the crops available in the database and we populate them in the response object which is sent to the user

            results.forEach(element => {

                response = response.concat(element.crop_id + ".  " + element.crop_name + '\n')
                crops[element.crop_id] = "advice." + element.crop_name;

            });

            menu.end(response)




        })
    }
})





menu.state("password.stage", {
    run: () => {
        con.query(`select * from crop`, (err, results) => {
            if (err)(

                menu.con("There was a problem in the system ,try again later")
            )

            let response = `
            Select the crop you have
            `
            results.forEach(element => {
                response = response.concat(element.crop_id + ".  " + element.crop_name + '\n')
                crops[element.crop_id] = "advice." + element.crop_name;

            });


            menu.con(response)
        })

    },
    next: {
        '*[a-zA-Z0-9]+': 'stage.crop'

    }


})
menu.state("stage.crop", {

    run: () => {
        stageCrop = { nothing: 1 }
        console.log(menu.val)
        let id = menu.val;
        stageCrop["crop_id"] = id;
        menu.con("Enter the name of the stage")


    },
    next: {
        '*[a-zA-Z0-9]+': 'crop.stage'

    }


})

menu.state("crop.stage", {
    run: () => {
        let stage_name = menu.val;
        stageCrop["stage_name"] = stage_name;




        con.query(`select * from Regions`, (err, result) => {



            if (err) {
                menu.end("There was an error in running the application")
            }
            let region_response = `
            Select your region

            `



            result.forEach(element => {

                region_response = region_response.concat(element.region_id + ".  " + element.region_name + '\n')
                    //crops[element.crop_id] = "advice." + element.crop_name;

            });


            menu.con(region_response)

        })






    },
    next: {
        '*[a-zA-Z0-9]+': 'stage.region'


    }
})

menu.state("stage.region", {
    run: () => {
        let region = menu.val;
        stageCrop["region"] = region;


        menu.con("Enter all the details for this stage")


    },
    next: {
        '*[a-zA-Z0-9]+': 'region.details'

    }

})
menu.state("region.details", {
    run: () => {
        let details = menu.val;
        stageCrop["details"] = details

        console.log(stageCrop)

        con.query(`insert into Stage (stage_name,stage_region_id,stage_processes,stage_crop_id) values('${stageCrop.stage_name}','${stageCrop.region}','${stageCrop.details}','${stageCrop.crop_id}')`, (err, results) => {

            if (err) {
                menu.end("An internal error is has occured")
                console.log(err)
            } else {
                menu.end("Al details have been received and are being processed")

            }
        })

    },


})
menu.state("password.add", {
    run: () => {
        menu.con("Enter the name of the crop : \n")


    },
    next: {
        '*[a-zA-Z]+': 'add.crop'
    }

})
menu.state("add.crop", {
    run: () => {
        let crop = menu.val;
        con.query(`insert into crop (crop_name)  values('${crop}')`, (err, results) => {
            if (err) {
                menu.end("unable to add a crop, try again later")
            } else {
                menu.end("Crop added successfully");
            }

        })

    }
})

/*

THIS IS THE SUBSCRIPTION PART
A NEW CUSTOMER IS PROVIDED WITH AN OPTION TO REGISTER
 THE DETAILS REQUIRED ARE :
   - USERNAME
   - PASSWORD
   - LOCATION

AFTER THE REGISTRATION IS SUCCESSFUL
A USER GET A NOTIFICAION INFORM OF A MESSAGE   



*/

menu.state('register', {
    run: () => {
        registerDetails = { "nothing": "nothing" }

        let number = menu.args.phoneNumber;
        registerDetails['number'] = number

        menu.con("Enter your username")

    },
    next: {
        '*[a-zA-Z]+': 'register.username'

    }
})
menu.state('register.username', {
    run: () => {



        registerDetails = { "nothing": "nothing" }
            //register the number and ask for a user location
        let number = menu.args.phoneNumber;
        let username = menu.val

        registerDetails['number'] = number
        registerDetails['username'] = username

        menu.con("Enter your location")

    },
    next: {
        '*[a-zA-Z]+': 'register.location'

    }
})



menu.state('register.location', {
    run: () => {
        let location = menu.val
        registerDetails['location'] = location

        menu.con("Enter your password")

    },
    next: {
        '*[a-zA-Z0-9]+': 'register.password'

    }
})
menu.state("register.password", {
    run: () => {
        let password = menu.val;
        registerDetails['password'] = password

        console.log(registerDetails)
        const { number, username, location, pass } = registerDetails;


        //checking if a user exists
        con.query(`select * from Users where Users.user_phone_number ='${number}'`, (err, result) => {
            if (err) {
                console.log(err)
            }
            if (result.length > 0) {
                menu.end("The number has already been registered")
            } else {

                bcrypt.hash(password, 10, (err, hash) => {

                    if (err) {
                        menu.end("We are unable to register you at the moment")
                    }

                    console.log(hash)

                    //create a new user
                    con.query(`insert into Users (user_phone_number ,user_password, user_location,user_name)values('${number}','${hash}','${location}','${username}')`, (err, results) => {
                        if (err) {

                            menu.end("sorry we are unable to register you at the moment, try again")
                            console.log(err)
                        } else {
                            //send message
                            const options = {
                                to: menu.args.phoneNumber,
                                message: `Thank you ${username} for registering with farmer ussd choices. \n We are glad to have you on board`
                            }

                            // Send message and capture the response or error
                            sms.send(options)
                                .then(response => {
                                    console.log(response);
                                })
                                .catch(error => {
                                    console.log(error);
                                });
                            menu.end("thank your for registering with us, You will recieve a confirmation message ")

                        }
                    })

                })



            }
        })





    }
})



/*

STEP 3

THIS IS SERVICE AND MOST IMPORTANT PART
IT IS WHERE A FARMER GET ALL THE AVAILABLE SERVICE
A FARMER CAN SELECT A CROP WHICH THEY HAVE 
AND CAN ALSO SELECT THE STAGES WHICH ARE AVAILABLE TO THEM





*/


menu.state("services", {
    run: () => {
        menu.con("Enter your password")

    },
    next: {
        '*[a-zA-Z0-9]+': 'advice.password'
    }

})

/*
If a user tries to access any service they will be prompted for a password
if the user is validated , the will be allowed to continue
incase they are not, they will have to try again

*/



menu.state("advice.password", {
    run: () => {

        let password = menu.val;
        con.query(`select * from Users where user_phone_number ='${menu.args.phoneNumber}'`, (err, result) => {
            console.log(result)
            if (err) {
                menu.end("Unable to get services for now")
            }
            if (result.length == 0) {
                menu.end("Invalid Login Credential.Try again later")
            } else {
                bcrypt.compare(password, result[0].user_password, (err, result) => {

                    if (err) {
                        menu.end("Incorrect password .We are unable to authenticate you at the momment")
                    }


                    if (result) {
                        menu.con("Select a service that you want " +
                            "\n 1. Service request" +
                            "\n 2. Crop advice" +
                            "\n 3. Back home ")
                    } else {
                        menu.end("Incorrect password .We are unable to authenticate you at the momment")

                    }




                })






            }

        })

    },
    next: {
        '1': 'services.request',
        '2': 'services.advice',




    }
})




menu.state("services.request", {

    run: () => {
        menu.end("Thank you for your request.  This Serive will be available very soon")
    }

})


menu.state("services.advice", {
    run: () => {
        let third = menu.val;
        dataToSave = { 1: 1 }

        con.query(`select * from crop`, (err, results) => {
            if (err)(

                menu.con("There was a problem in the system ,try again later")
            )
            let response = `
            Select the crop you have
            `

            // Here we read all the crops available in the database and we populate them in the response object which is sent to the user

            results.forEach(element => {

                response = response.concat(element.crop_id + ".  " + element.crop_name + '\n')
                crops[element.crop_id] = "advice." + element.crop_name;

            });


            menu.con(response)
        })

    },

    next: { '*[a-zA-Z0-9]+': 'advice.selected' }


})





menu.state("advice.selected", {
    run: () => {
        const crop = menu.val
        dataToSave["crop_id"] = crop;



        con.query(`select * from Regions`, (err, result) => {
            if (err) {
                menu.end("There was an error in running the application")
            }
            let region_response = `
            Select your region

            `



            result.forEach(element => {

                region_response = region_response.concat(element.region_id + ".  " + element.region_name + '\n')
                    //crops[element.crop_id] = "advice." + element.crop_name;

            });


            menu.con(region_response)




        })





    },

    next: { '*\\d+': 'selected.region' },
    defaultNext: 'invalidOption'


})

menu.state(`selected.region`, {
    run: () => {


        //Here the customer is going stage  or advice they wish to get

        const region = menu.val
        dataToSave["region"] = region;


        let responseStage = `
          Select the stage you want
         `


        con.query(`select * from Stage where stage_crop_id ='${dataToSave.crop_id}' and stage_region_id ='${dataToSave.region}' `, (err, result) => {

            if (err) {
                menu.end("Internal server error")
            } else {
                if (result.length == 0) {
                    menu.end("There is no data for the region and crop at the moment, try again Later")
                } else {

                    result.forEach(element => {
                        responseStage = responseStage.concat(element.stage_id + ".  " + element.stage_name + '\n')
                        crops[element.crop_id] = "advice." + element.crop_name;

                    });
                    console.log(responseStage)
                    menu.con(responseStage)
                }
            }
        })

    },
    next: {
        '*[a-zA-Z0-9]+': "region.stage"
    }


})


menu.state('region.stage', {
    run: async() => {
        const stage = menu.val
        dataToSave["stage"] = stage;


        //After getting the selected crop an the selected stage 
        // We are going to fetch the data from the database and send it to the use as 
        //Message
        //incase there is a problem with the system , it will alert them.

        sendResponse(dataToSave.crop_id, dataToSave.stage, dataToSave.region, menu.args.phoneNumber)



    }

})



/*

This is the last option for quiting the application incase you do not want to continue using it any more


*/


menu.state('quit', {
    run: () => {
        menu.end("Goodbye :)");
    }
});


// Registering USSD handler with Express
app.post('/', (req, res) => {

    console.log("running the method")
    menu.run(req.body, ussdResult => {
        res.send(ussdResult);
    });
});





try {
    app.listen(PORT, (err) => {
        if (!err) {
            console.log("App listening on port :" + PORT)

        }

    })

} catch (error) {
    console.log("there is an error in the port");

}