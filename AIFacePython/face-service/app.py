from flask import Flask, request, jsonify
import base64
import numpy as np
import cv2
import face_recognition
import os

app = Flask(__name__)


def decode_base64_image(base64_string):
    try:
        image_data = base64.b64decode(base64_string)
        np_arr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return image
    except Exception:
        return None


@app.route('/face/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        if not data or 'image' not in data:
            return jsonify({"error": "Missing image"}), 400

        image = decode_base64_image(data['image'])

        if image is None:
            return jsonify({"error": "Invalid image"}), 400

        encodings = face_recognition.face_encodings(image)

        if len(encodings) == 0:
            return jsonify({"error": "No face detected"}), 400

        # convert numpy array -> list (JSON safe)
        embedding = encodings[0].tolist()

        return jsonify({
            "embedding": embedding
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/face/verify', methods=['POST'])
def verify():
    try:
        data = request.get_json()

        if not data or 'image' not in data or 'embedding' not in data:
            return jsonify({"error": "Missing image or embedding"}), 400

        image = decode_base64_image(data['image'])

        if image is None:
            return jsonify({"error": "Invalid image"}), 400

        encodings = face_recognition.face_encodings(image)

        if len(encodings) == 0:
            return jsonify({"error": "No face detected"}), 400

        new_embedding = encodings[0]

        # convert input embedding -> numpy array
        stored_embedding = np.array(data['embedding'], dtype=np.float64)

        # dùng built-in distance (ổn định hơn)
        distance = face_recognition.face_distance(
            [stored_embedding], new_embedding
        )[0]

        THRESHOLD = 0.5

        # FIX QUAN TRỌNG: numpy -> python
        match = bool(distance < THRESHOLD)

        return jsonify({
            "match": match,                 
            "distance": float(distance)     
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/face/search', methods=['POST'])
def search():
    try:
        data = request.get_json()

        if not data or 'image' not in data or 'gallery' not in data:
            return jsonify({"error": "Missing image or gallery"}), 400

        image = decode_base64_image(data['image'])
        if image is None:
            return jsonify({"error": "Invalid image"}), 400

        encodings = face_recognition.face_encodings(image)
        if len(encodings) == 0:
            return jsonify({"error": "No face detected"}), 400

        new_embedding = encodings[0]
        gallery = data['gallery']  # Expecting list of {"id": "...", "embedding": [...]}

        threshold = 0.5
        found_id = None
        min_distance = 1.0

        for item in gallery:
            stored_embedding = np.array(item['embedding'], dtype=np.float64)
            distance = face_recognition.face_distance([stored_embedding], new_embedding)[0]
            
            if distance < threshold and distance < min_distance:
                min_distance = distance
                found_id = item['id']

        return jsonify({
            "found": found_id is not None,
            "id": found_id,
            "distance": float(min_distance) if found_id else None
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)