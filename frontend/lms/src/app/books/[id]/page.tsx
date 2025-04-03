"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BooksService } from "@/api/services/BooksService";
import { BookResponse } from "@/api/models/BookResponse";
import { Button } from "@/components";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import Image from 'next/image';

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState<BookResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookDetails = async () => {
      setLoading(true);
      try {
        const bookId = Array.isArray(id) ? id[0] : id;
        if (!bookId) {
          throw new Error("Book ID is required");
        }
        const result = await BooksService.booksGetBook(bookId);
        setBook(result);
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
          <h2 className="text-2xl font-bold text-red-500 mb-4">
            {error || "Book not found"}
          </h2>
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
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Books
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Book Cover Image */}
        <div className="md:col-span-1">
          <div className="rounded-lg overflow-hidden border bg-background shadow-sm">
            <Image
              src={book.cover_image || book.publisher_image || "/placeholder-book.png"}
              alt={book.title}
              width={500}
              height={500}
              className="w-full object-cover h-auto max-h-[500px]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "/placeholder-book.png";
              }}
            />
          </div>
        </div>

        {/* Book Details */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{book.title}</h1>
            <Link href={`/books/edit/${id}`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
            </Link>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              By {book.author?.name || 'Unknown Author'}
            </h2>
            <p className="text-sm text-muted-foreground">ISBN: {book.isbn}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-muted-foreground text-sm">Price</p>
              {book.price != null && <p className="font-semibold">{book.price.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원</p>}
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Quantity in Stock</p>
              <p className="font-semibold">{book.quantity || 0}</p>
            </div>
            {book.page_count && (
              <div>
                <p className="text-muted-foreground text-sm">Pages</p>
                <p>{book.page_count}</p>
              </div>
            )}
            {book.dimensions && (
              <div>
                <p className="text-muted-foreground text-sm">Dimensions</p>
                <p>{book.dimensions}</p>
              </div>
            )}
            {book.weight && (
              <div>
                <p className="text-muted-foreground text-sm">Weight</p>
                <p>{book.weight}</p>
              </div>
            )}
          </div>

          {book.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{book.description}</p>
            </div>
          )}

          {book.introduction && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Introduction</h3>
              <p className="text-muted-foreground">{book.introduction}</p>
            </div>
          )}

          {book.table_of_contents && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Table of Contents</h3>
              <div className="text-muted-foreground whitespace-pre-line">
                {book.table_of_contents}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}