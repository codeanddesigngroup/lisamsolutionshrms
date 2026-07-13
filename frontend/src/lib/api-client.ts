import api from "./api";
import { apiRoutes, buildQueryString, type ApiEnvelope, type ApiListQuery, type ApiResource } from "./api-contract";

// THE API CLIENT WRAPPER
// This object provides ready-to-use functions for making standard backend requests.
// Instead of writing `api.post('/employees', data)` everywhere in your UI,
// you can just write `apiClient.create('employees', data)`.
export const apiClient = {
  // list: Used for fetching an array of data (like a list of all employees or invoices).
  // query allows passing pagination or search filters.
  list: async <T>(resource: ApiResource, query?: ApiListQuery) => {
    const response = await api.get<ApiEnvelope<T[]>>(`${apiRoutes.resource(resource)}${buildQueryString(query)}`);
    return response.data;
  },

  // detail: Used for fetching a single specific record by its ID (like getting Invoice #5).
  detail: async <T>(resource: ApiResource, id: number | string, query?: ApiListQuery) => {
    const response = await api.get<ApiEnvelope<T>>(`${apiRoutes.detail(resource, id)}${buildQueryString(query)}`);
    return response.data;
  },

  // create: Used for saving a brand new record to the database via POST.
  create: async <T, P = unknown>(resource: ApiResource, payload: P) => {
    const response = await api.post<ApiEnvelope<T>>(apiRoutes.resource(resource), payload);
    return response.data;
  },

  // update: Used for replacing an entire existing record with new data via PUT.
  update: async <T, P = unknown>(resource: ApiResource, id: number | string, payload: P) => {
    const response = await api.put<ApiEnvelope<T>>(apiRoutes.detail(resource, id), payload);
    return response.data;
  },

  // patch: Used for updating just one or two fields of a record (partial update) via PATCH.
  patch: async <T, P = unknown>(resource: ApiResource, id: number | string, payload: P) => {
    const response = await api.patch<ApiEnvelope<T>>(apiRoutes.detail(resource, id), payload);
    return response.data;
  },

  // remove: Used for deleting a record from the database.
  remove: async <T>(resource: ApiResource, id: number | string) => {
    const response = await api.delete<ApiEnvelope<T>>(apiRoutes.detail(resource, id));
    return response.data;
  },

  // action: A flexible method for custom backend actions that don't fit standard CRUD
  // (e.g., `apiClient.action('invoices', 5, 'mark-as-paid')`).
  action: async <T, P = unknown>(resource: ApiResource, id: number | string, action: string, payload?: P) => {
    const response = await api.post<ApiEnvelope<T>>(apiRoutes.action(resource, id, action), payload ?? {});
    return response.data;
  },

  // upload: Specifically handles taking a File from the browser and formatting it
  // into a FormData object so the PHP backend can receive it correctly.
  upload: async <T>(resource: ApiResource, id: number | string, files: File[], fieldName = "files") => {
    const formData = new FormData();
    files.forEach((file) => formData.append(fieldName, file));

    const response = await api.post<ApiEnvelope<T>>(apiRoutes.action(resource, id, "files"), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  },
};

export default apiClient;
