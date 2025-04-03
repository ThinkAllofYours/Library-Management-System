/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthorCreate } from '../models/AuthorCreate';
import type { AuthorResponse } from '../models/AuthorResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthorsService {
    /**
     * Create Author
     * @param requestBody
     * @returns AuthorResponse Successful Response
     * @throws ApiError
     */
    public static authorsCreateAuthor(
        requestBody: AuthorCreate,
    ): CancelablePromise<AuthorResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/authors/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Authors
     * @param name
     * @param page
     * @param size
     * @returns AuthorResponse Successful Response
     * @throws ApiError
     */
    public static authorsGetAuthors(
        name?: (string | null),
        page: number = 1,
        size: number = 10,
    ): CancelablePromise<Array<AuthorResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/authors/',
            query: {
                'name': name,
                'page': page,
                'size': size,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Author
     * @param id
     * @returns AuthorResponse Successful Response
     * @throws ApiError
     */
    public static authorsGetAuthor(
        id: string,
    ): CancelablePromise<AuthorResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/authors/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Author
     * @param id
     * @param requestBody
     * @returns AuthorResponse Successful Response
     * @throws ApiError
     */
    public static authorsUpdateAuthor(
        id: string,
        requestBody: AuthorCreate,
    ): CancelablePromise<AuthorResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/authors/{id}',
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
     * Delete Author
     * @param id
     * @returns any Successful Response
     * @throws ApiError
     */
    public static authorsDeleteAuthor(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/authors/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
