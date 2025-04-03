"use client"; // 클라이언트 컴포넌트로 지정

import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardTitle, SearchBar } from "@/components"; // 필요한 컴포넌트 임포트
import { Button } from "@/components"; // Button 컴포넌트 임포트
import { BooksService } from "@/api/services/BooksService"; // API 서비스 임포트
import { BookResponse } from "@/api/models/BookResponse"; // 타입 임포트
import Link from "next/link"; // Link 컴포넌트 임포트
import { Plus, MoreVertical, Edit, Trash2 } from "lucide-react"; // 아이콘 임포트
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"; // 드롭다운 메뉴 컴포넌트 임포트
import { useRouter } from "next/navigation"; // 라우터 임포트

export default function Home() {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [searchTitle, setSearchTitle] = useState<string | undefined>(undefined);
  const [searchAuthor, setSearchAuthor] = useState<string | undefined>(undefined);
  const [currentSearchValue, setCurrentSearchValue] = useState("");
  const [currentSearchType, setCurrentSearchType] = useState<"title" | "author">("title");
  const router = useRouter();

  const fetchBooks = async (resetPage = true) => {
    setLoading(true); // 로딩 시작
    try {
      const currentPage = resetPage ? 1 : page;
      if (resetPage) {
        setPage(1);
      }

      // 검색 조건을 API 호출에 전달
      const result = await BooksService.booksGetBooks(
        searchAuthor,
        searchTitle,
        currentPage,
        10
      );

      // 첫 페이지 로드 또는 검색/새로고침 시 목록 교체, 그 외에는 추가
      setBooks(currentPage === 1 ? result : [...books, ...result]);
    } catch (error) {
      console.error("Error fetching books:", error);
      // 사용자에게 에러 발생을 알리는 UI 추가 고려
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  useEffect(() => {
    fetchBooks(false);
  }, [page]);

  useEffect(() => {
    // 항상 fetchBooks를 호출하여 검색어가 비어있을 때도 모든 책을 표시
    fetchBooks(true);
  }, [searchTitle, searchAuthor]);

  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

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
      // 검색어가 없는 경우 검색어 상태 초기화
      setCurrentSearchValue("");
      setCurrentSearchType("title");
    }
  };

  const handleRefresh = async () => {
    await fetchBooks(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // 링크 클릭 이벤트 방지
    e.stopPropagation(); // 이벤트 버블링 방지

    if (!confirm("이 책을 삭제하시겠습니까?")) {
      return;
    }

    try {
      setDeleteLoading(id);
      await BooksService.booksDeleteBook(id);
      // 삭제 후 목록에서 제거
      setBooks(prevBooks => prevBooks.filter(book => book.book_manage_id !== id));
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("책 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // 링크 클릭 이벤트 방지
    e.stopPropagation(); // 이벤트 버블링 방지
    router.push(`/books/edit/${id}`);
  };

  if (loading && page === 1) {
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
        {/* Add new book card */}
        <Link href="/books/create">
          <Card className="h-full flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
            <CardContent className="flex flex-col items-center justify-center h-full">
              <div className="w-full h-[220px] flex items-center justify-center bg-muted rounded-md">
                <Plus className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardTitle className="mt-4 text-center">Add New Book</CardTitle>
            </CardContent>
          </Card>
        </Link>

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
                  <img
                    src={book.publisher_image || "/placeholder-book.png"} // 기본 이미지 추가
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/placeholder-book.png";
                    }}
                  />
                </div>
                <CardTitle className="line-clamp-2 h-14">{book.title}</CardTitle>
                {/* 저자 정보가 없을 경우를 대비 (선택적) */}
                <p className="text-sm text-muted-foreground mt-2">{book.author?.name || 'Unknown Author'}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0 justify-between">
                {/* 가격 정보가 없을 경우 표시하지 않음 */}
                {book.price != null && <p className="font-semibold">{book.price.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원</p>}
                <p className="text-sm text-muted-foreground">Qty: {book.quantity ?? 0}</p>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>

      {books.length >= 10 && (
        <div className="flex justify-center mt-8">
          <Button onClick={handleLoadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}

      {!loading && books.length === 0 && page === 1 && (
          <div className="text-center mt-8 text-muted-foreground">No books found.</div>
      )}
    </div>
  );
}
