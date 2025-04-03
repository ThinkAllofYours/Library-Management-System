"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { BooksService } from "@/api/services/BooksService";
import { BookResponse } from "@/api/models/BookResponse";
import { BookUpdate } from "@/api/models/BookUpdate";
import { Button } from "@/components";
import Link from "next/link";
import { ArrowLeft, Save, X, User } from "lucide-react";
import Image from "next/image";
import { AuthorSelectionModal } from "@/components/author/AuthorSelectionModal";
import { AuthorResponse } from "@/api/models/AuthorResponse";

export default function EditBook() {
  const { id } = useParams();
  const router = useRouter();
  const [book, setBook] = useState<BookResponse | null>(null);
  const [formData, setFormData] = useState<BookUpdate>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Separate states for publisher and cover images
  const [publisherImagePreview, setPublisherImagePreview] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [publisherUploading, setPublisherUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  
  // Separate refs for each file input
  const publisherFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Author selection modal state
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorResponse | null>(null);

  useEffect(() => {
    const fetchBookDetails = async () => {
      setLoading(true);
      try {
        // Convert id to string if it's an array
        const bookId = Array.isArray(id) ? id[0] : id;
        if (!bookId) {
          throw new Error("Book ID is required");
        }

        const result = await BooksService.booksGetBook(bookId);
        setBook(result);
        setSelectedAuthor(result.author);

        // Initialize form data with current book values
        setFormData({
          title: result.title,
          isbn: result.isbn,
          description: result.description,
          price: result.price,
          quantity: result.quantity,
          page_count: result.page_count,
          dimensions: result.dimensions,
          weight: result.weight,
          table_of_contents: result.table_of_contents,
          introduction: result.introduction,
          publisher_image: result.publisher_image,
          cover_image: result.cover_image,
          author_id: result.author_id,
        });

        // Set initial image previews
        if (result.publisher_image) {
          setPublisherImagePreview(result.publisher_image);
        }
        if (result.cover_image) {
          setCoverImagePreview(result.cover_image);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching book details:", err);
        setError("Failed to load book details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBookDetails();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Convert number fields to numbers
    if (type === "number") {
      setFormData({
        ...formData,
        [name]: value ? Number(value) : null,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Separate handlers for publisher and cover images
  const handlePublisherImageClick = () => {
    publisherFileInputRef.current?.click();
  };

  const handleCoverImageClick = () => {
    coverFileInputRef.current?.click();
  };

  const handlePublisherImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Preview the selected image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPublisherImagePreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Upload the image
    setPublisherUploading(true);
    try {
      const response = await BooksService.booksUploadFiles({ files: [file] });
      if (response && response.length > 0) {
        setFormData((prev) => ({
          ...prev,
          publisher_image: response[0],
        }));
      }
    } catch (err) {
      console.error("Error uploading publisher image:", err);
      setError("Failed to upload publisher image");
    } finally {
      setPublisherUploading(false);
    }
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Preview the selected image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCoverImagePreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Upload the image
    setCoverUploading(true);
    try {
      const response = await BooksService.booksUploadFiles({ files: [file] });
      if (response && response.length > 0) {
        setFormData((prev) => ({
          ...prev,
          cover_image: response[0],
        }));
      }
    } catch (err) {
      console.error("Error uploading cover image:", err);
      setError("Failed to upload cover image");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleAuthorSelect = (author: AuthorResponse) => {
    setSelectedAuthor(author);
    setFormData((prev) => ({
      ...prev,
      author_id: author.id,
    }));
    setIsAuthorModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const bookId = Array.isArray(id) ? id[0] : id;
      if (!bookId) {
        throw new Error("Book ID is required");
      }

      await BooksService.booksUpdateBook(bookId, formData);
      router.push(`/books/${bookId}`);
    } catch (err) {
      console.error("Error updating book:", err);
      setError("Failed to update book");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-500 mb-4">{error || "Book not found"}</h2>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between">
        <Link href={`/books/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Book Details
          </Button>
        </Link>
      </div>

      <div className="bg-card border rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Book: {book.title}</h1>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="w-full md:w-1/2 space-y-2">
              <label htmlFor="publisher_image" className="block text-sm font-medium">
                Publisher Image
              </label>
              <div className="flex flex-row items-center gap-4">
                <div className="flex-1">
                  {publisherImagePreview ? (
                    <div
                      className="relative w-64 h-64 cursor-pointer border rounded-md overflow-hidden"
                      onClick={handlePublisherImageClick}
                    >
                      <Image
                        src={publisherImagePreview}
                        alt="Publisher Image"
                        fill
                        className="object-contain"
                      />
                      {publisherUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="w-64 h-64 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer"
                      onClick={handlePublisherImageClick}
                    >
                      <div className="text-center">
                        <Image
                          src="/placeholder-image.png"
                          alt="Upload placeholder"
                          width={48}
                          height={48}
                          className="mx-auto h-12 w-12 text-gray-400"
                          aria-hidden="true"
                        />
                        <p className="mt-2 text-sm text-gray-500">Click to upload an image</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={publisherFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePublisherImageChange}
                  />
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2 space-y-2">
              <label htmlFor="cover_image" className="block text-sm font-medium">
                Cover Image
              </label>
              <div className="flex flex-row items-center gap-4">
                <div className="flex-1">
                  {coverImagePreview ? (
                    <div
                      className="relative w-64 h-64 cursor-pointer border rounded-md overflow-hidden"
                      onClick={handleCoverImageClick}
                    >
                      <Image
                        src={coverImagePreview}
                        alt="Cover Image"
                        fill  
                        className="object-contain"
                      />
                      {coverUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="w-64 h-64 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer"
                      onClick={handleCoverImageClick}
                    >
                      <div className="text-center">
                        <Image
                          src="/placeholder-image.png"
                          alt="Upload placeholder"
                          width={48}
                          height={48}
                          className="mx-auto h-12 w-12 text-gray-400"
                          aria-hidden="true"
                        />
                        <p className="mt-2 text-sm text-gray-500">Click to upload an image</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverImageChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title || ""}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="isbn" className="block text-sm font-medium">
                ISBN
              </label>
              <input
                id="isbn"
                name="isbn"
                type="text"
                value={formData.isbn || ""}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="price" className="block text-sm font-medium">
                Price
              </label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={formData.price || ""}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="quantity" className="block text-sm font-medium">
                Quantity
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity || ""}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="page_count" className="block text-sm font-medium">
                Page Count
              </label>
              <input
                id="page_count"
                name="page_count"
                type="number"
                value={formData.page_count || ""}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="dimensions" className="block text-sm font-medium">
                Dimensions
              </label>
              <input
                id="dimensions"
                name="dimensions"
                type="text"
                value={formData.dimensions || ""}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="weight" className="block text-sm font-medium">
                Weight(g)
              </label>
              <input
                id="weight"
                name="weight"
                type="number"
                step="0.01"
                value={formData.weight || ""}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="author" className="block text-sm font-medium">
                Author
              </label>
              <div className="flex gap-2">
                <input
                  id="author"
                  type="text"
                  value={selectedAuthor?.name || ""}
                  readOnly
                  className="flex-1 p-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:text-white cursor-not-allowed"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAuthorModalOpen(true)}
                >
                  <User className="h-4 w-4 mr-2" /> Select Author
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <label htmlFor="description" className="block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md min-h-[100px]"
            />
          </div>

          <div className="space-y-2 mb-6">
            <label htmlFor="introduction" className="block text-sm font-medium">
              Introduction
            </label>
            <textarea
              id="introduction"
              name="introduction"
              value={formData.introduction || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md min-h-[100px]"
            />
          </div>

          <div className="space-y-2 mb-6">
            <label htmlFor="table_of_contents" className="block text-sm font-medium">
              Table of Contents
            </label>
            <textarea
              id="table_of_contents"
              name="table_of_contents"
              value={formData.table_of_contents || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md min-h-[150px]"
            />
          </div>

          <div className="flex justify-end gap-2 mt-8">
            <Link href={`/books/${id}`}>
              <Button variant="outline" type="button">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving || publisherUploading || coverUploading}>
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Author Selection Modal */}
      <AuthorSelectionModal
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        onSelectAuthor={handleAuthorSelect}
      />
    </div>
  );
}
