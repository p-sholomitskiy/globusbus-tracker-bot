import { LocationTableColumnsName, type LocationList, type LocationTableRequestParams } from '../models/locations.model.js';
import { RepositoryTables } from '../models/repo.model.js';
import { supabase } from './client.repo.js';

export const getLocationListWithParams = async (params: LocationTableRequestParams): Promise<LocationList> => {

    let query = supabase
        .from(RepositoryTables.LOCATIONS)
        .select(`
            ${LocationTableColumnsName.ID},
            ${LocationTableColumnsName.NAME},
            ${LocationTableColumnsName.POINT},
            ${LocationTableColumnsName.VALUE}`);
    if (params.id) {
        query = query.eq(LocationTableColumnsName.ID, params.id);
    }

    if (params.name) {
        query = query.ilike(LocationTableColumnsName.NAME, `%${params.name}%`);
    }

    if (params.point) {
        query = query.eq(LocationTableColumnsName.POINT, params.point);
    }

    if (params.value) {
        query = query.eq(LocationTableColumnsName.VALUE, params.value);
    }

    const { data, error } = await query;
    if (error) {
        console.log(error);

        return [];
    }
    else {
        return data;
    }
};