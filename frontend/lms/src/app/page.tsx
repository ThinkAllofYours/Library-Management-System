"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardTitle, SearchBar } from "@/components";
import { Button } from "@/components";
import { BooksService } from "@/api/services/BooksService";
import Link from "next/link";
import { Plus, MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { BookCreationModal } from "@/components/book/BookCreationModal";
import Image from "next/image";
import { 
  useInfiniteQuery, 
  useQueryClient, 
  useMutation 
} from "@tanstack/react-query";

export default function Home() {
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [currentSearchValue, setCurrentSearchValue] = useState("");
  const [currentSearchType, setCurrentSearchType] = useState<"title" | "author">("title");
  const [searchTitle, setSearchTitle] = useState<string | undefined>(undefined);
  const [searchAuthor, setSearchAuthor] = useState<string | undefined>(undefined);
  const observerTarget = useRef(null);
  const router = useRouter();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // React Query infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ['books', searchTitle, searchAuthor],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await BooksService.booksGetBooks(
        searchAuthor,
        searchTitle,
        pageParam,
        10
      );
      return result;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length + 1 : undefined;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => BooksService.booksDeleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    }
  });

  const handleObserver = (entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    
    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage]);

  const handleSearch = (title?: string, authorName?: string) => {
    setSearchTitle(title);
    setSearchAuthor(authorName);

    if (title) {
      setCurrentSearchValue(title);
      setCurrentSearchType("title");
    } else if (authorName) {
      setCurrentSearchValue(authorName);
      setCurrentSearchType("author");
    } else {
      setCurrentSearchValue("");
      setCurrentSearchType("title");
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("이 책을 삭제하시겠습니까?")) {
      return;
    }

    try {
      setDeleteLoading(id);
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("책 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/books/edit/${id}`);
  };

  const books = data?.pages.flatMap(page => page) || [];

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Book Collection</h1>
          <SearchBar
            onSearch={handleSearch}
            onRefresh={handleRefresh}
            className="w-80"
            initialSearchValue={currentSearchValue}
            initialSearchType={currentSearchType}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <Card 
          className="h-full flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => setIsBookModalOpen(true)}
        >
          <CardContent className="flex flex-col items-center justify-center h-full">
            <div className="w-full h-[220px] flex items-center justify-center bg-muted rounded-md">
              <Plus className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4 text-center">Add New Book</CardTitle>
          </CardContent>
        </Card>

        {/* Book cards */}
        {books.map((book) => (
          <Link key={book.id} href={`/books/${book.book_manage_id}`}>
            <Card className="h-full flex flex-col hover:border-primary transition-colors relative">
              {/* 더보기 메뉴 */}
              <div className="absolute bottom-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-white dark:hover:bg-gray-800 rounded-full"
                      onClick={(e) => e.preventDefault()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => handleEdit(book.book_manage_id, e)}>
                      <Edit className="mr-2 h-4 w-4" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={(e) => handleDelete(book.book_manage_id, e)}
                      disabled={deleteLoading === book.book_manage_id}
                    >
                      {deleteLoading === book.book_manage_id ? (
                        <div className="mr-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardContent className="p-4 flex-grow">
                <div className="w-full h-[220px] overflow-hidden rounded-md mb-4">
                  <Image
                    src={book.publisher_image || "/placeholder-book.png"}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    width={220}
                    height={220}
                    loading="lazy"
                    quality={75}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z2Rlc2MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0ZXh0AAAAAElYAABYWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSAyVC08MTY3LjIyOUFTRjo/Tj4yMkhiSk46NjVBQVRAQkBAQEBAQED/2wBDAR4eHh0aHTQaGjRAOC40QEA0QEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQED/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAb/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder-book.png";
                    }}
                  />
                </div>
                <CardTitle className="line-clamp-2 h-14">{book.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">{book.author?.name || 'Unknown Author'}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0 justify-between">
                {book.price != null && <p className="font-semibold">{book.price.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원</p>}
                <p className="text-sm text-muted-foreground">Qty: {book.quantity ?? 0}</p>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>

      {books.length >= 10 && (
        <div ref={observerTarget} className="h-10 flex justify-center items-center">
          {isFetchingNextPage && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>}
        </div>
      )}

      {!isLoading && books.length === 0 && (
          <div className="text-center mt-8 text-muted-foreground">No books found.</div>
      )}

      <BookCreationModal 
        isOpen={isBookModalOpen} 
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}