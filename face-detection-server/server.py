from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import mtcnn
import os
import numpy as np
from io import BytesIO
import base64
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Create output directory if not exists
output_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'output')
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# Initialize MTCNN detector
face_detector = mtcnn.MTCNN()
conf_t = 0.8

# Load the pre-trained face detector model from OpenCV for Viola-Jones
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'files' not in request.files:
        return "No file part", 400

    files = request.files.getlist('files')
    if not files:
        return "No selected files", 400

    results = []
    for file in files:
        if file.filename == '':
            return "No selected file", 400

        img_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)
        if img is None:
            return "Invalid image", 400

        # Process image with MTCNN
        mtcnn_img = process_with_mtcnn(img.copy())

        # Process image with Viola-Jones
        viola_jones_img = process_with_viola_jones(img.copy())

        # Encode images to base64 to include in the JSON response
        mtcnn_img_encoded = encode_image_to_base64(mtcnn_img)
        viola_jones_img_encoded = encode_image_to_base64(viola_jones_img)
        # print("-----------------")

        results.append({
            "mtcnn_image": mtcnn_img_encoded,
            "viola_jones_image": viola_jones_img_encoded
        })

    return jsonify(results)

def process_with_mtcnn(img):
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    start_time = time.time()
    results = face_detector.detect_faces(img_rgb)
    processing_time = time.time() - start_time
    # print(processing_time)

    for res in results:
        x1, y1, width, height = res['box']
        x1, y1 = abs(x1), abs(y1)
        x2, y2 = x1 + width, y1 + height
        confidence = res['confidence']

        if confidence < conf_t:
            continue

        cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 0), thickness=2)

    cv2.putText(img, f"{processing_time:.3f}", (10, 50), cv2.FONT_ITALIC, 0.7, (255, 255, 0), 2)

    return img

def process_with_viola_jones(img):
    gray_image = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray_image = cv2.equalizeHist(gray_image)

    start_time = time.time()
    faces = face_cascade.detectMultiScale(
        gray_image,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
        maxSize=(300, 300)
    )
    processing_time = time.time() - start_time
    # print(processing_time)

    for (x, y, w, h) in faces:
        cv2.rectangle(img, (x, y), (x+w, y+h), (255, 0, 0), 2)

    cv2.putText(img, f"{processing_time:.3f}", (10, 50), cv2.FONT_ITALIC, 0.7, (255, 255, 0), 2)

    return img

def encode_image_to_base64(img):
    _, img_encoded = cv2.imencode('.jpg', img)
    return base64.b64encode(img_encoded).decode('utf-8')

if __name__ == "__main__":
    app.run(debug=True)
