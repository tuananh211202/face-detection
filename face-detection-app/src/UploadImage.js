import React, { useState } from 'react';
import axios from 'axios';
import './UploadImage.css';

function UploadImage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImageURL, setUploadedImageURL] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const onFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageURL(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onFileUpload = async () => {
    if (!selectedFile) {
      console.error('No file selected');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        responseType: 'blob',
      });

      const imageBlob = new Blob([response.data], { type: 'image/jpeg' });
      const imageObjectURL = URL.createObjectURL(imageBlob);
      setProcessedImage(imageObjectURL);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Upload Image for Face Detection</h1>
      <input type="file" onChange={onFileChange} />
      <button onClick={onFileUpload} disabled={loading}>
        {loading ? 'Detecting...' : 'Upload'}
      </button>
      <div className="images-container">
        <div className="image-wrapper">
          {uploadedImageURL && (
            <img src={uploadedImageURL} alt="Uploaded" className="image" />
          )}
        </div>
        {uploadedImageURL && (
          <div className="arrow">
            <span>→</span>
          </div>
        )}
        <div className="image-wrapper">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            processedImage && (
              <img src={processedImage} alt="Processed" className="image" />
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadImage;
