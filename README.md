# Based on the [Awesome Sensor Logger](https://github.com/tszheichoi/awesome-sensor-logger/) git project and mobile app. 

This repository contains a Flask server that will let you view the data from your mobile device using the sensor logger app. 

- [The Sensor Logger App](#the-sensor-logger-app)
- [Getting Started with Data Analysis](#getting-started)



## The Sensor Logger App  
Learn more and download Sensor Logger at www.tszheichoi.com/sensorlogger. 

| Android | iOS |
|:-:|:-:|
| [<img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" height="50">](https://play.google.com/store/apps/details?id=com.kelvin.sensorapp&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1) | [<img src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-example-preferred_2x.png" height="50">](https://apps.apple.com/app/id1531582925) |


## Getting Started
Git clone the project into your user dir then make sure to enter that folder. Once in the project folder, run python venv in order to install dependencies in a folder that will be deleted along with the project if you decide to get rid of it. If you don't have venv install it with: ```sudo apt update && sudo apt install python3-venv```. Then use the source command below to enter the new venv. the pip install command below will install all dependencies in a new venv folder inside of the sensor-logger project folder. If needed, Pip is installed with ```sudo apt install python-pip``` or ```sudo apt install python3-pip```. Once all dependencies are installed, go to the script.js file on line 150, you will see this function: ```function getBaseUrl() {```. Change the ip address in there to match the one for your server that you're running this script on. I added a ```10.0...``` address in there that needs to be replaced. After this step make sure your terminal window path is in the project dir with the server.py python script. run it using the python server.py command while you are in the venv and it should state in the terminal that the server is now listening on port 8000. Open the mobile app and start sending data. Make sure you are sending to the correct address. should look something like http://localhost:8000/mobile-data

```
git clone https://github.com/The-Dro/sensor-logger.git

cd ~/sensor-logger && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
python server.py

```


## Goals

 - Hoping to make this a web app that can serve pages depending on which user is sending data. for example /paramotorIRL would send the data to that path and another user could send to path /user2 in order to have the web service display data from multiple mobile devices simultaneously.
 
 - Add the ability for multiple mobile devices to show up together on the same map
 
 - Have the map pins for each user display an overlay tooltip that displays basic information about speed altitude and so on
 
 - Add a module for showing the current weather for the location of the mobile device submitting the data. 

 - Clean up the code; help of ai may have made things a bit less optimized than they can be

 - Removing the need for physically having to type in an ip address for your device in the script.js