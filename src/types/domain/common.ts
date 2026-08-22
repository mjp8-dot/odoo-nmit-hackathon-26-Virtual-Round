export type UUID = string
export type ISODate = string
export type ISODateTime = string
export type CurrencyCode = string

export interface AuditFields {
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface DateRange {
  startDate: ISODate
  endDate: ISODate
}

export interface GeoPoint {
  latitude: number
  longitude: number
  accuracyMeters?: number
  label?: string
}

