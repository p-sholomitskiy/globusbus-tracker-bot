export type LocationListItem = {
    id: number,
    name: string,
    point: LocationTablePointColumnValue,
    value: number
}

export type LocationList = LocationListItem[]

export enum LocationTablePointColumnValue {
    PICKUP = 'pickup',
    DESTINATION = 'destination'
}

export enum LocationTableColumnsName {
    ID = 'id',
    NAME = 'name',
    POINT = 'point',
    VALUE = 'value'
}

export type LocationTableRequestParams = {
    id?: number,
    name?: string,
    point?: LocationTablePointColumnValue,
    value?: number
}
