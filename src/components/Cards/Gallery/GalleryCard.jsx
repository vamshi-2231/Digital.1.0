import React, { useState } from "react";
import { updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../config/firebase";
import '../Card_styles/GalleryCard.css';

const GalleryCard = ({ item, onDelete, fetchCollection, onMessage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAlbumImages, setShowAlbumImages] = useState(false); // State to toggle album image visibility
  const [updatedData, setUpdatedData] = useState({
    title: item.title,
    name: item.name || "",
    coverImageUrl: item.coverImageUrl || "",
  });
  const [newCoverImage, setNewCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(item.coverImageUrl || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e) => {
    if (e.target.name === "coverPhoto") {
      const file = e.target.files[0];
      setNewCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async () => {
    setIsLoading(true);
    try {
      let coverImageUrl = item.coverImageUrl;
      if (newCoverImage) {
        const imageRef = ref(storage, `galleryImages/${item.id}_${Date.now()}_${newCoverImage.name}`);
        await uploadBytes(imageRef, newCoverImage);
        coverImageUrl = await getDownloadURL(imageRef);
      }

      const docRef = doc(db, "gallery", item.id);
      await updateDoc(docRef, {
        ...updatedData,
        coverImageUrl,
      });

      onMessage("Gallery card updated successfully.");
      fetchCollection();
    } catch (err) {
      console.error("Error updating gallery card:", err);
      onMessage("Error updating gallery card.");
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  return (
    <div className="gallery-card">
      {isEditing ? (
        <>
          <input
            type="text"
            name="title"
            value={updatedData.title}
            onChange={(e) => setUpdatedData({ ...updatedData, title: e.target.value })}
            placeholder="Title"
          />
          <input
            type="text"
            name="name"
            value={updatedData.name}
            onChange={(e) => setUpdatedData({ ...updatedData, name: e.target.value })}
            placeholder="Name"
          />
          <input
            type="file"
            name="coverPhoto"
            accept="image/*"
            onChange={handleImageChange}
          />
          {coverImagePreview && <img src={coverImagePreview} alt="Cover preview" className="image-preview" />}
          <div className="button-group">
            <button onClick={handleEditSubmit} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update"}
            </button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <h3>{item.title}</h3>
          <p>{item.name}</p>
          {item.coverImageUrl && <img src={item.coverImageUrl} alt={item.title} className="image-preview" />}
          <div className="button-group">
            <button onClick={() => setShowAlbumImages(prev => !prev)}>
              {showAlbumImages ? "Hide" : "View"}
            </button>
            {showAlbumImages && (
              <div className="album-previews">
                {item.albumImageUrls.map((url, index) => (
                  <img key={index} src={url} alt={`Album ${index}`} className="image-preview" />
                ))}
              </div>
            )}
            <button onClick={() => setIsEditing(true)}>Edit</button>
            <button onClick={() => onDelete(item.id)}>Delete</button>
          </div>
        </>
      )}
    </div>
  );
};

export default GalleryCard;
