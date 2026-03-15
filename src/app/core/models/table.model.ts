/**
 * Configuración de tabla
 */
export interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'date' | 'number' | 'status' | 'priority';
  width?: string;
}

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions: number[];
}

/**
 * Opciones de ordenamiento
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}
