import React, { ChangeEvent, useState } from "react";
import Modal from "./Modal";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { initializeApp } from "firebase/app";
import { FaPen, FaSpinner, FaTrashAlt } from "react-icons/fa"; // For spinner icon

const firebaseConfig = {
  apiKey: "AIzaSyAT1CLRTvwoCAB84Tn3vFYtkmCohY5t79Y",
  authDomain: "assignment-e710c.firebaseapp.com",
  projectId: "assignment-e710c",
  storageBucket: "assignment-e710c.appspot.com",
  messagingSenderId: "52041231210",
  appId: "1:52041231210:web:4b20b010db435a02d41313",
  measurementId: "G-PYZTP9TCKR",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
interface Image {
  id: number;
  url: string;
  ref: string;
}

const ImageGallery: React.FC = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [currentImageId, setCurrentImageId] = useState<number | null>(null);
  const [currentImageRef, setCurrentImageRef] = useState<string | null>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, `images/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          console.error("Error uploading file:", error);
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setImages((prevImages) => [
            ...prevImages,
            { id: Date.now(), url: downloadURL, ref: storageRef.toString() },
          ]);
          setUploading(false);
          setSelectedFile(null);
        }
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploading(false);
    }
  };

  const handleEditImage = (id: number, imageRef: string) => {
    setCurrentImageId(id);
    setCurrentImageRef(imageRef);
    setUpdateModalOpen(true);
  };

  const handleUpdateUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || currentImageRef === null || currentImageId === null) return;

    setUploading(true);

    const imageRef = ref(storage, currentImageRef);

    deleteObject(imageRef)
      .then(() => {
        const newFileName = `${Date.now()}_${file.name}`;
        const newStorageRef = ref(storage, `images/${newFileName}`);
        const uploadTask = uploadBytesResumable(newStorageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% done`);
          },
          (error) => {
            console.error("Error uploading file:", error);
            setUploading(false);
          },
          async () => {
            const newDownloadURL = await getDownloadURL(
              uploadTask.snapshot.ref
            );
            setImages((prevImages) =>
              prevImages.map((img) =>
                img.id === currentImageId
                  ? {
                      ...img,
                      url: newDownloadURL,
                      ref: newStorageRef.toString(),
                    }
                  : img
              )
            );
            setUploading(false);
            setUpdateModalOpen(false);
          }
        );
      })
      .catch((error) => {
        console.error("Error deleting old image:", error);
        setUploading(false);
      });
  };

  const handleDeleteImage = (id: number, imageRef: string) => {
    const imageToDeleteRef = ref(storage, imageRef);

    deleteObject(imageToDeleteRef)
      .then(() => {
        setImages((prevImages) => prevImages.filter((img) => img.id !== id));
        console.log("Image deleted successfully");
        setUpdateModalOpen(false);
      })
      .catch((error) => {
        console.error("Error deleting image:", error);
      });
  };

  return (
    <div className="w-[60%] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dynamic Image Gallery</h1>
      <div className="mb-4 mt-10 flex flex-row gap-4 items-center w-[60%]">
        <div className="relative flex-grow">
          <input
            id="imageUpload"
            type="file"
            onChange={handleFileSelect}
            accept="image/*"
            className="text-sm text-gray-500
              file:mr-4
              file:rounded-xl file:border-1
              file:text-sm file:font-semibold
              file:bg-white file:text-gray-400
              hover:file:bg-blue-100
              file:cursor-pointer cursor-pointer
              opacity-0 absolute inset-0"
            disabled={uploading}
          />
          <label
            htmlFor="imageUpload"
            className="block w-full text-sm text-gray-500
              py-7 px-4
              rounded-xl border border-gray-300
              cursor-pointer
              items-center justify-center"
          >
            {selectedFile ? selectedFile.name : "Choose a file"}
          </label>
        </div>

        <button
          className="bg-black text-white h-fit px-10 py-2 rounded-lg flex items-center justify-center"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? <FaSpinner className="animate-spin mr-2" /> : "Upload"}
        </button>
      </div>
      {uploading && <p className="text-sm text-gray-500 mb-4">Uploading...</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-14">
        {images.map((image) => (
          <div key={image.id} className="relative rounded-lg overflow-hidden">
            <div
              className="flex flex-row justify-end items-center gap-2 text-blue-500 font-semibold cursor-pointer mb-1"
              onClick={() => handleEditImage(image.id, image.ref)}
            >
              <FaPen />
              Edit Image
            </div>
            <img
              src={image.url}
              alt={`Uploaded ${image.id}`}
              className="w-full h-72 object-cover"
            />
          </div>
        ))}
        {images.length === 0 && (
          <p className="text-gray-500 col-span-2 text-center py-8">
            No images uploaded yet.
          </p>
        )}
      </div>

      <Modal isOpen={updateModalOpen} onClose={() => setUpdateModalOpen(false)}>
        <h2 className="text-xl font-semibold mb-4">Update Image</h2>
        <input
          type="file"
          onChange={handleUpdateUpload}
          accept="image/*"
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <div className="flex justify-between mt-4">
          <button
            onClick={() => currentImageId && currentImageRef && handleDeleteImage(currentImageId, currentImageRef)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium transition duration-150 ease-in-out flex items-center"
          >
            <FaTrashAlt className="mr-2" />
            Delete
          </button>
          <button
            onClick={() => setUpdateModalOpen(false)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-medium transition duration-150 ease-in-out"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ImageGallery;
