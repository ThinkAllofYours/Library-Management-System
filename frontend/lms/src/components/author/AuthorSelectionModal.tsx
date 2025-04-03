"use client";

import { useState, useEffect } from "react";
import { BooksService } from "@/api/services/BooksService";
import { AuthorResponse } from "@/api/models/AuthorResponse";
import { AuthorCreate } from "@/api/models/AuthorCreate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Search, Plus } from "lucide-react";
import { AuthorsService } from "@/api/services/AuthorsService";

interface AuthorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAuthor: (author: AuthorResponse) => void;
}

export function AuthorSelectionModal({
  isOpen,
  onClose,
  onSelectAuthor,
}: AuthorSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [authors, setAuthors] = useState<AuthorResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAuthor, setNewAuthor] = useState<AuthorCreate>({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchAuthors();
    }
  }, [isOpen]);

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const response = await AuthorsService.authorsGetAuthors(searchTerm || null, 1, 100);
      
      const uniqueAuthors = new Map<string, AuthorResponse>();
      response.forEach(author => {
        if (!uniqueAuthors.has(author.id)) {
          uniqueAuthors.set(author.id, author);
        }
      });
      
      setAuthors(Array.from(uniqueAuthors.values()));
      setError(null);
    } catch (err) {
      console.error("Error fetching authors:", err);
      setError("Failed to load authors");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuthors();
  };

  const handleCreateAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await AuthorsService.authorsCreateAuthor(newAuthor);
      onSelectAuthor(response);
      setShowCreateForm(false);
      setNewAuthor({ name: "", description: "" });
    } catch (err) {
      console.error("Error creating author:", err);
      setError("Failed to create author");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl p-6 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Select Author</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {!showCreateForm ? (
          <>
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search authors..."
                  className="flex-1 p-2 border rounded-md"
                />
                <Button type="submit" disabled={loading}>
                  <Search className="h-4 w-4 mr-2" /> Search
                </Button>
              </div>
            </form>

            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> Create New Author
              </Button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : authors.length === 0 ? (
                <div className="text-center py-4">No authors found</div>
              ) : (
                <div className="space-y-2">
                  {authors.map((author) => (
                    <div
                      key={author.id}
                      className="p-3 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => onSelectAuthor(author)}
                    >
                      <div className="font-medium">{author.name}</div>
                      {author.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {author.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleCreateAuthor}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={newAuthor.name}
                  onChange={(e) =>
                    setNewAuthor({ ...newAuthor, name: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newAuthor.description || ""}
                  onChange={(e) =>
                    setNewAuthor({ ...newAuthor, description: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  Create Author
                </Button>
              </div>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
} 