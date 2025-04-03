"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, BookOpen, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { BooksService } from "@/api/services/BooksService";

interface BookCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BookCreationModal({ isOpen, onClose, onSuccess }: BookCreationModalProps) {
  const [aladinUrl, setAladinUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  
  const handleManualEntry = () => {
    router.push("/books/create");
    onClose();
  };
  
  const handleScrapeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aladinUrl) return;
    
    try {
      setIsLoading(true);
      
      // Call the scrape API directly
      await BooksService.booksGetBookInfoFromUrl({
        url: aladinUrl
      });
      
      // Wait 3 seconds before finishing
      setTimeout(() => {
        setIsLoading(false);
        onClose();
        // Refresh the book list
        if (onSuccess) onSuccess();
      }, 3000);
      
    } catch (error) {
      console.error("Error scraping book info:", error);
      setIsLoading(false);
      alert("책 정보를 가져오는데 실패했습니다.");
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">책 추가하기</h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">알라딘에서 책 정보 가져오기</h3>
            <p className="text-sm text-muted-foreground mb-4">
              알라딘 웹사이트에서 책 정보를 자동으로 가져올 수 있습니다.
              (현재 알라딘만 지원)
            </p>
            
            <form onSubmit={handleScrapeSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=349374326"
                  value={aladinUrl}
                  onChange={(e) => setAladinUrl(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    정보 가져오는 중...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    알라딘에서 책 정보 가져오기
                  </>
                )}
              </Button>
            </form>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">또는</span>
            </div>
          </div>
          
          <Button variant="outline" onClick={handleManualEntry} className="w-full" disabled={isLoading}>
            <FileText className="h-4 w-4 mr-2" />
            직접 입력하기
          </Button>
        </div>
      </Card>
    </div>
  );
}
