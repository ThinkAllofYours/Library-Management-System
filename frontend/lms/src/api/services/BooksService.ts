/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_BooksUploadFiles } from '../models/Body_BooksUploadFiles';
import type { BookCreate } from '../models/BookCreate';
import type { BookResponse } from '../models/BookResponse';
import type { BookUpdate } from '../models/BookUpdate';
import type { ScrapeBookInfoRequest } from '../models/ScrapeBookInfoRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BooksService {
    /**
     * Get Books
     * @param authorName
     * @param title
     * @param page
     * @param size
     * @returns BookResponse Successful Response
     * @throws ApiError
     */
    public static booksGetBooks(
        authorName?: (string | null),
        title?: (string | null),
        page: number = 1,
        size: number = 10,
    ): CancelablePromise<Array<BookResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/books/',
            query: {
                'author_name': authorName,
                'title': title,
                'page': page,
                'size': size,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Book
     * @param requestBody
     * @returns BookResponse Successful Response
     * @throws ApiError
     */
    public static booksCreateBook(
        requestBody: BookCreate,
    ): CancelablePromise<BookResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/books/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Book
     * @param id
     * @returns BookResponse Successful Response
     * @throws ApiError
     */
    public static booksGetBook(
        id: string,
    ): CancelablePromise<BookResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/books/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Book
     * @param id
     * @param requestBody
     * @returns BookResponse Successful Response
     * @throws ApiError
     */
    public static booksUpdateBook(
        id: string,
        requestBody: BookUpdate,
    ): CancelablePromise<BookResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/books/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Book
     * @param id
     * @returns any Successful Response
     * @throws ApiError
     */
    public static booksDeleteBook(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/books/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Book Info From Url
     * 책 목록 스크랩 해오기
     * Args:
     * url: 책 정보를 가져올 웹사이트 주소
     * 현재는 알라딘만 구현
     * ex) url = "https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=890127258X"
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static booksGetBookInfoFromUrl(
        requestBody: ScrapeBookInfoRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/books/scrape',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Files
     * @param formData
     * @returns string Successful Response
     * @throws ApiError
     */
    public static booksUploadFiles(
        formData: Body_BooksUploadFiles,
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/books/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
