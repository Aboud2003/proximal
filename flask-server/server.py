from flask import Flask, request, jsonify
import pytesseract
import cv2
import numpy as np
import re
import json
from flask_cors import CORS

# ضبط مسار Tesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

app = Flask(__name__)
CORS(app)  # إضافة دعم CORS

# مسودة لتخزين الأوزان
weights_draft = []

# نقطة نهاية للمسار الرئيسي
@app.route('/')
def home():
    return "Welcome to the Weight Extraction API! Use /extract-weight, /save-weight, or /get-draft."

@app.route('/extract-weight', methods=['POST'])
def extract_weight():
    # استلام الصورة كبيانات من الواجهة الأمامية
    if 'image' not in request.files:
        return jsonify({"message": "No image found!"}), 400
    
    image_data = request.files['image'].read()

    # تحويل البيانات إلى صورة باستخدام OpenCV
    img_array = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    # تحويل الصورة إلى تدرج الرمادي
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # استخراج النص باستخدام Tesseract
    extracted_text = pytesseract.image_to_string(gray, lang='eng')
    print("Extracted Text:", extracted_text)

    # استخراج الوزن باستخدام Regex
    match = re.search(r"(?:Net\s*Weight|Peso\s*Líquido).*?([\d.]+)\s*Kg", extracted_text, re.IGNORECASE)

    if match:
        net_weight = match.group(1)
        return jsonify({"net_weight": net_weight, "message": "Weight extracted successfully!"})
    else:
        return jsonify({"net_weight": None, "message": "No weight detected!"})

@app.route('/save-weight', methods=['POST'])
def save_weight():
    global weights_draft
    data = request.get_json()  # التأكد من أن البيانات التي تصل هي JSON

    if data and 'weights' in data:
        # تخزين الأوزان
        weights_draft.extend(data['weights'])

        # حفظ الأوزان في ملف JSON أو قاعدة بيانات هنا
        with open('weights.json', 'w') as f:
            json.dump(weights_draft, f)

        # مسح المسودة بعد الحفظ
        weights_draft = []
        return jsonify({"message": "Weights saved successfully!"})
    else:
        return jsonify({"message": "No valid weights to save!"})

@app.route('/get-draft', methods=['GET'])
def get_draft():
    # إرجاع الأوزان المحفوظة في المسودة
    return jsonify({"draft": weights_draft})

if __name__ == '__main__':
    app.run(debug=True)
