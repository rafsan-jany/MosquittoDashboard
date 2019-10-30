var ip = "192.168.0.100";
var port = "8883";
var usessl = false;
var id = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
var username = '';
var password = '';
var message, client;
var connected = false;
var widgetRepository = {};

function CreateWidget(config) {
      var datastream = config.datastream; 
if(Array.isArray(datastream)) {
        datastream.forEach(function (element) {
            widgetRepository.hasOwnProperty(element) ? console.log("Duplicate Datastream: " + element) : (widgetRepository[element] = config);
            //widgetRepository[element] = config;
        })
    } else if (typeof datastream === 'string' || datastream instanceof String){
        widgetRepository.hasOwnProperty(datastream) ? console.log("Duplicate Datastream: " + datastream) : (widgetRepository[config.datastream] = config);
        //widgetRepository[config.datastream] = config;
    }
    RenderWidgets();
}

function RenderWidgets() {
    connectMQTT();
}

function printwidgetRepository() {
    for (var widgetKey in widgetRepository) {
        console.log("widgetKey: " + widgetKey);
        if (widgetRepository.hasOwnProperty(widgetKey)) {
            for (var widgetprop in widgetRepository[widgetKey]) {
                if (widgetRepository[widgetKey].hasOwnProperty(widgetprop)) {
                   console.log(widgetprop + ': ' + widgetRepository[widgetKey][widgetprop]);
                }
            }
        }
    }
}

function connectMQTT() {
    client = new Paho.MQTT.Client(ip, Number(port), id);
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    client.connect({
        useSSL: usessl,
        onSuccess: onConnect,
        onFailure: onFailure,
        reconnect: true
    });
}

function onConnect() {
     console.log("Connected to server");
    $("#mainPage").show();
    var widget = {};
    for (var widgetKey in widgetRepository) {
        widget = widgetRepository[widgetKey];
        if (widget.type == '')
            widget.type = "labeltext";

        switch (widget.type) { 
            case "labeltext":
                widget.widgetVar = widget.type + "_" + widget.bindto;
                break;
           
            default:
                console.log("The " + widget.type + " widget type for the " + widgetKey + " datastream did not match with any of the standard types in onConnect function");
            break;
        }

    }

    //each key is a datastream which is subscribed
    Object.keys(widgetRepository).forEach(function(datastream,index) {
        client.subscribe(datastream, {
            qos: 0
        });
    });
}

function onMessageArrived(message) {
    try {
        console.log("Recieved Message from server");
        var value = message.payloadString;
        var datastream = message.destinationName;
        console.log("datastream: " + datastream + ", value: " + value);


        // var widget = widgetRepository[datastream];
        obj = JSON.parse(value);
       
        console.log(obj);
        $('#widget1').html(obj.analog[0]);
         
    } catch (e) {
        console.log("exception in onMessageArrived: " + e);
        return false;
    }
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:" + responseObject.errorMessage);
    }
}

 
 

 

function onFailure(responseObject) {
    if (responseObject.errorCode === 8) {
        console.log("onFailure errorCode/errorMessage: " + responseObject.errorCode + "/" + responseObject.errorMessage);
        $("#validateHeader").text("Invalid Username/Password. Please enter again.");

    } else if (responseObject.errorCode === 7) {
        console.log("onFailure errorCode/errorMessage: " + responseObject.errorCode + "/" + responseObject.errorMessage);
        $("#validateHeader").html("New SSL Certificate added. Import SSL Certificate.");

    } else if (responseObject.errorCode !== 0 && responseObject.errorCode !== 8 && responseObject.errorCode !== 7) {
        console.log("onFailure errorCode/errorMessage: " + responseObject.errorCode + "/" + responseObject.errorMessage);
        $("#validateHeader").text("Contact Administrator.");

    }
    resetUsernamePassword();
    $("#dialog-form").dialog("open");
}
 
 