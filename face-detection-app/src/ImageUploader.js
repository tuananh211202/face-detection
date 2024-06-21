// src/components/ImageUploader.js

import React, { useState } from 'react';
import axios from 'axios';

const ImageUploader = () => {
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFiles(event.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles) return;

    setIsLoading(true); // Set loading to true when upload starts
    setImages([]); // Clear previous images

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append('files', file);
    }

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'json',
      });

      const processedImages = response.data.map((imageSet, index) => ({
        original: URL.createObjectURL(selectedFiles[index]),
        mtcnn_image: `data:image/jpeg;base64,${imageSet.mtcnn_image}`,
        viola_jones_image: `data:image/jpeg;base64,${imageSet.viola_jones_image}`,
      }));

      setImages(processedImages);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload Images</button>

      {isLoading && (<div>Loading...</div>)}
      {images.length > 0 && (
        <table style={{ width: "100vw" }}>
          <thead>
            <tr>
              <th>Original Image</th>
              <th>MTCNN Processed Image</th>
              <th>Viola-Jones Processed Image</th>
            </tr>
          </thead>
          <tbody>
            {images.map((imageSet, index) => (
              <tr key={index}>
                <td>
                  <img src={imageSet.original} alt={`Original ${index}`} width='100%' />
                </td>
                <td>
                  <img src={imageSet.mtcnn_image} alt={`MTCNN Processed ${index}`} width="100%" />
                </td>
                <td>
                  <img src={imageSet.viola_jones_image} alt={`Viola-Jones Processed ${index}`} width="100%" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ImageUploader;
