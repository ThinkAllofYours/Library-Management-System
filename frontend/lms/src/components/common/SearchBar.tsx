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

export const SearchBar = React.memo(function SearchBar({ 
  onSearch, 
  onRefresh, 
  className,
  initialSearchValue = "",
  initialSearchType = "title"
}: SearchBarProps) {
  const [searchValue, setSearchValue] = React.useState(initialSearchValue)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [searchType, setSearchType] = React.useState<SearchType>(initialSearchType)
  
  const handleSearch = React.useCallback((e: React.FormEvent) => {
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
  }, [searchValue, searchType, onSearch])
  
  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    await onRefresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }, [onRefresh])

  const handleSearchTypeChange = React.useCallback((value: SearchType) => {
    setSearchType(value)
  }, [])

  const handleSearchValueChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }, [])
  
  return (
    <form onSubmit={handleSearch} className={cn("flex gap-2", className)}>
      <Select value={searchType} onValueChange={handleSearchTypeChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Search by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title">Title</SelectItem>
          <SelectItem value="author">Author</SelectItem>
        </SelectContent>
      </Select>
      
      <Input
        type="text"
        placeholder={`Search by ${searchType}...`}
        value={searchValue}
        onChange={handleSearchValueChange}
        className="flex-1"
      />
      
      <Button type="submit" variant="outline" size="icon">
        <Search className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
})
