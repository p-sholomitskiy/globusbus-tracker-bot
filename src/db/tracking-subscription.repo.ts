import { RepositoryTables } from '../models/repo.model.js';
import { TrackingSubscriptionTableColumnName, type TrackingSubscriptionList, type TrackingSubscriptionListItem, type TrackingSubscriptionTableInsertItem, type TrackingSubscriptionTableRequestParams, type TrackingSubscriptionTableUpdateItem } from '../models/tracking-subscription.model.js';
import { isSubscriptionConflict } from './tracking-subscription-error.util.js';
import { supabase } from './client.repo.js';

export const getTrackingSubscriptionById = async (id: number, chatId: number): Promise<TrackingSubscriptionListItem | null> => {
  const { data: subscription, error } = await supabase.from(RepositoryTables.TRACKING_SUBSCRIPTION)
    .select('*')
    .eq('id', id)
    .eq('chat_id', chatId)
    .maybeSingle();
  if (error) throw error;
  return subscription;
};

export const changeTrackingSubscriptionStatus = async (
  id: number, chatId: number, expectedStatus: string, nextStatus: string,
): Promise<TrackingSubscriptionListItem | null> => {
  const { data: subscription, error } = await supabase.from(RepositoryTables.TRACKING_SUBSCRIPTION)
    .update({ status: nextStatus })
    .eq('id', id)
    .eq('chat_id', chatId)
    .eq('status', expectedStatus)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return subscription;
};

export const getTrackingSubscriptionList = async (params: TrackingSubscriptionTableRequestParams): Promise<TrackingSubscriptionList | null> => {

  let query = supabase
    .from(RepositoryTables.TRACKING_SUBSCRIPTION)
    .select('*');
  if (params.chat_id !== undefined) {
    query = query.eq(TrackingSubscriptionTableColumnName.CHAT_ID, params.chat_id);
  }

  if (params.status !== undefined) {
    query = query.eq(TrackingSubscriptionTableColumnName.STATUS, params.status);
  }

  if (params.orderBy) {
    query = query.order(
      params.orderBy,
      { ascending: params.ascending ?? true },
    );
  }


  const { data, error } = await query;

  if (error) {
    console.error(error);

    return null;
  } else {
    return data;
  }
};

export const createTrackingSubscription = async (subscription: TrackingSubscriptionTableInsertItem): Promise<null | TrackingSubscriptionListItem> => {
  const { data, error } = await supabase
    .from(RepositoryTables.TRACKING_SUBSCRIPTION)
    .insert(subscription)
    .select()
    .single();

  if (error) {
    if (isSubscriptionConflict(error)) throw error;
    console.error(error);
    return null;
  }

  return data;
};

export const updateTrackingSubscription = async (id: number, params: TrackingSubscriptionTableUpdateItem): Promise<TrackingSubscriptionListItem | null> => {
  const { data, error } = await supabase
    .from(RepositoryTables.TRACKING_SUBSCRIPTION)
    .update(params)
    .eq(TrackingSubscriptionTableColumnName.ID, id)
    .select()
    .single();

  if(error) {
    if (isSubscriptionConflict(error)) throw error;
    console.error(error);

    return null;
  }

  return data;
};

export const getTrackingSubscription = async (subscription: TrackingSubscriptionTableUpdateItem): Promise<TrackingSubscriptionListItem | null> => {
  const { chat_id, pickup, destination, date_of_journey, status } = subscription;
  const { data, error } = await supabase
    .from(RepositoryTables.TRACKING_SUBSCRIPTION)
    .select('*')
    .eq(TrackingSubscriptionTableColumnName.CHAT_ID, chat_id)
    .eq(TrackingSubscriptionTableColumnName.PICKUP, pickup)
    .eq(TrackingSubscriptionTableColumnName.DESTINATION, destination)
    .eq(TrackingSubscriptionTableColumnName.DATE_OF_JOURNEY, date_of_journey)
    .eq(TrackingSubscriptionTableColumnName.STATUS, status)
    .maybeSingle();

  if (error) {
    console.error(error);

    return null;
  }

  return data;
};
