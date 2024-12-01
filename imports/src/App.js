import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [draft, setDraft] = useState([]); // المسودة
  const [image, setImage] = useState(null);

  // إعداد الكاميرا لاختيار الكاميرا الأمامية أو الخلفية
  useEffect(() => {
    async function setupCamera() {
      const constraints = { video: { facingMode: 'environment' } }; // الكاميرا الخلفية
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoElement = document.getElementById('video');
      videoElement.srcObject = stream;
    }

    setupCamera();
  }, []);

  // التقاط صورة من الفيديو
  const captureImage = () => {
    const videoElement = document.getElementById('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // تحويل الصورة إلى بيانات Blob
    canvas.toBlob((blob) => {
      setImage(blob);
    }, 'image/jpeg');
  };

  // إرسال الصورة إلى Flask لاستخراج الوزن
  const extractWeight = async () => {
    if (image) {
      const formData = new FormData();
      formData.append('image', image);

      try {
        const response = await axios.post('http://127.0.0.1:5000/extract-weight', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // تحقق من وجود الوزن في البيانات المسترجعة
        if (response.data.net_weight) {
          // إضافة الوزن إلى المسودة
          setDraft((prevDraft) => [...prevDraft, response.data.net_weight]);
        } else {
          alert("No weight detected!"); // إذا لم يتم العثور على الوزن
        }
      } catch (error) {
        console.error('Error extracting weight:', error);
        alert("Error extracting weight.");
      }
    }
  };

  // حفظ الأوزان المحفوظة مؤقتًا
  const saveWeight = async () => {
    if (draft.length > 0) {
      try {
        const response = await axios.post('http://127.0.0.1:5000/save-weight', {
          weights: draft,
        });
        alert(response.data.message);
        setDraft([]); // مسح المسودة بعد الحفظ
      } catch (error) {
        console.error('Error saving weights:', error);
        alert("Error saving weights.");
      }
    } else {
      alert('No weights to save!');
    }
  };

  return (
    <div className="App">
      <h1>Fast Net Weight Scanner</h1>
      <video id="video" autoPlay></video>
      <button onClick={captureImage}>Capture Image</button>
      <button onClick={extractWeight}>Extract Weight</button>
      <button onClick={saveWeight}>Save Valid Weights</button>

      <div id="draft">
        <h3>Draft Weights</h3>
        <pre>{draft.join('\n')}</pre> {/* عرض الأوزان في المسودة */}
      </div>
    </div>
  );
}

export default App;
