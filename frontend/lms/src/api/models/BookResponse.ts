/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthorResponse } from './AuthorResponse';
export type BookResponse = {
    book_manage_id: string;
    title: string;
    isbn: string;
    description?: (string | null);
    price?: (number | null);
    quantity?: number;
    page_count?: (number | null);
    dimensions?: (string | null);
    weight?: (number | null);
    table_of_contents?: (string | null);
    introduction?: (string | null);
    publisher_image?: (string | null);
    id: string;
    author_id: string;
    author: AuthorResponse;
    created: string;
    modified: string;
    cover_image: string;
};

