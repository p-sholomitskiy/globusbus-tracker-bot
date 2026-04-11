import type { LocationList } from "../models/locations.model.js";
import { supabase } from "./client.repo.js";

export const getLocationList = async ():Promise<LocationList> => {
    const {data, error} = await supabase.from('locations').select('*')
    if (error) return []
    else return data
}