#!/usr/bin/env python3
import json
import logging
import os
import signal
import sys
import socket
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory

# Configure logging to the sensr_server.log file
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('sensor_server.log')
    ]
)
logger = logging.getLogger(__name__)

# Global variable to store the latest sensor data
latest_sensor_data = {
    "messageId": 0,
    "sessionId": "",
    "deviceId": "",
    "payload": []
}

app = Flask(__name__, static_folder='sensor-data')

# Check if port 8000 is already in use
def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

# Function to gracefully shutdown the server
def shutdown_server():
    logger.info("Shutting down server...")
    # Perform any cleanup tasks here
    
    # Force exit the process
    os._exit(0)

# Handle SIGINT (Ctrl+C) signals
def signal_handler(sig, frame):
    logger.info("Received interrupt signal, shutting down...")
    shutdown_server()

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Add CORS headers to all responses
@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Max-Age', '86400')  # 24 hours
    return response

# Handle OPTIONS requests for CORS preflight
@app.route('/sensor-data', methods=['OPTIONS'])
@app.route('/sensor-data/', methods=['OPTIONS'])
def options():
    return '', 204  # No content needed for preflight response

@app.route('/sensor-data', methods=['GET'])
@app.route('/sensor-data/', methods=['GET'])
def get_sensor_data():
    logger.debug(f"Serving sensor data: {json.dumps(latest_sensor_data, indent=2)}")
    return jsonify(latest_sensor_data)

@app.route('/sensor-data', methods=['POST'])
@app.route('/sensor-data/', methods=['POST'])
def post_sensor_data():
    global latest_sensor_data
    try:
        data = request.get_json()
        if not data:
            logger.warning("Received empty or invalid JSON data")
            return jsonify({"error": "Empty or invalid JSON data"}), 400
            
        logger.info(f"Received data from {request.remote_addr}")
        logger.debug(f"Data received: {json.dumps(data, indent=2)}")
        
        # Update the latest sensor data
        latest_sensor_data = data
        
        return jsonify({"status": "success"})
        
    except Exception as e:
        logger.error(f"Error processing POST request: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    """Serve static files from the sensor-data directory"""
    try:
        # If the file exists in the sensor-data directory, serve it
        if os.path.isfile(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            logger.warning(f"File not found: {path}")
            return jsonify({"error": f"File not found: {path}"}), 404
    except Exception as e:
        logger.error(f"Error serving file {path}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.errorhandler(404)
def page_not_found(e):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_server_error(e):
    return jsonify({"error": "Internal server error"}), 500

def run_server(port=8000):
    try:
        logger.info(f"Starting server on port {port}...")
        
        # Run the Flask app with threaded=True for better concurrent connections handling
        app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
    except Exception as e:
        logger.error(f"Error starting server: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    # Check if port 8000 is already in use
    if is_port_in_use(8000):
        logger.warning("Port 8000 is already in use, attempting to kill the existing process")
        # This will only work on Linux/Unix systems
        try:
            os.system("fuser -k 8000/tcp")
            logger.info("Successfully killed process on port 8000")
        except Exception as e:
            logger.error(f"Could not kill process: {str(e)}")
            logger.error("Please manually stop the process using port 8000")
            sys.exit(1)
    
    run_server() 