/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BookCreate = {
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
    author_id: string;
};

