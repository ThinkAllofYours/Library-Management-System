"use client"

import * as React from "react"
import { Search, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SearchBarProps {
  onSearch: (title?: string, authorName?: string) => void
  onRefresh: () => void
  className?: string
  initialSearchValue?: string
  initialSearchType?: SearchType
}

type SearchType = "title" | "author"

export function SearchBar({ 
  onSearch, 
  onRefresh, 
  className,
  initialSearchValue = "",
  initialSearchType = "title"
}: SearchBarProps) {
  const [searchValue, setSearchValue] = React.useState(initialSearchValue)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [searchType, setSearchType] = React.useState<SearchType>(initialSearchType)
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchValue.trim()) {
      onSearch(undefined, undefined)
      return
    }
    
    if (searchType === "title") {
      onSearch(searchValue, undefined)
    } else {
      onSearch(undefined, searchValue)
    }
  }
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <form onSubmit={handleSearch} className="relative flex-1 flex gap-2">
        <Select value={searchType} onValueChange={(value: SearchType) => setSearchType(value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="검색 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">제목</SelectItem>
            <SelectItem value="author">저자</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={searchType === "title" ? "책 제목으로 검색..." : "저자 이름으로 검색..."}
            className="pl-8"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </form>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleRefresh}
        className={isRefreshing ? "animate-spin" : ""}
        title="새로고침"
      >
        <RefreshCw className="h-4 w-4" />
        <span className="sr-only">새로고침</span>
      </Button>
    </div>
  )
}
