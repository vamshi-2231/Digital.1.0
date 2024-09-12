import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc,doc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../config/firebase";
import GalleryInputCard from "./GalleryInputCard";
import GalleryCard from "./GalleryCard";

const GalleryCardManager = ({ isLoading, setIsLoading, onMessage }) => {
  const [galleryCards, setGalleryCards] = useState([]);
  // const [editingCard, setEditingCard] = useState(null);
  // const [updatedData, setUpdatedData] = useState({});

  useEffect(() => {
    fetchGalleryCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGalleryCards = async () => {
    setIsLoading(true);
    try {
      const galleryRef = collection(db, "gallery");
      const data = await getDocs(galleryRef);
      const cards = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setGalleryCards(cards);
    } catch (err) {
      onMessage("Error fetching gallery cards.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImages = async (images, type, id) => {
    const imageUrls = [];
    for (const image of images) {
      const imageRef = ref(storage, `${type}Images/${id}_${Date.now()}_${image.name}`);
      await uploadBytes(imageRef, image);
      const imageUrl = await getDownloadURL(imageRef);
      imageUrls.push(imageUrl);
    }
    return imageUrls;
  };

  const handleCreate = async (newCard, files) => {
    setIsLoading(true);
    try {
      let coverImageUrl = null;
      const albumImageUrls = [];

      if (files.coverPhoto) {
        const coverImageUrls = await uploadImages([files.coverPhoto], "gallery", Date.now());
        coverImageUrl = coverImageUrls[0];
      }

      if (files.albumPhotos.length > 0) {
        const albumImageUrlsArray = await uploadImages(files.albumPhotos, "gallery", Date.now());
        albumImageUrls.push(...albumImageUrlsArray);
      }

      await addDoc(collection(db, "gallery"), {
        title: newCard.title || "",
        name: newCard.name || "",
        coverImageUrl: coverImageUrl || "",
        albumImageUrls: albumImageUrls || []
      });

      onMessage("Gallery card created successfully.");
      fetchGalleryCards();
    } catch (err) {
      onMessage("Error creating gallery card.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "gallery", id));
      onMessage("Gallery card deleted successfully.");
      fetchGalleryCards();
    } catch (err) {
      onMessage("Error deleting gallery card.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <GalleryInputCard
        onCreate={handleCreate}
        isLoading={isLoading}
        onMessage={onMessage}
      />
      {galleryCards.map(card => (
        <GalleryCard
          key={card.id}
          item={card}
          onDelete={handleDelete}
          fetchCollection={fetchGalleryCards}
          onMessage={onMessage}
        />
      ))}
    </div>
  );
};

export default GalleryCardManager;
