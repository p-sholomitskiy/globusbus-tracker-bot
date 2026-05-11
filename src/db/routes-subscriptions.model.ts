import { RepositoryTables } from '../models/repo.model.js';
import { RouteSubscriptionTableColumnsName, type RouteSubscriptionList, type RouteSubscriptionTableRequestParams } from '../models/routes-subscriptions.model.js';
import { supabase } from './client.repo.js';

export const getRouteSubscriptionsWithParams = async (
	params: RouteSubscriptionTableRequestParams
): Promise<RouteSubscriptionList | null> => {
	let query = supabase
		.from(RepositoryTables.ROUTE_SUBSCRIPTIONS)
		.select(`
			${RouteSubscriptionTableColumnsName.ID},
      ${RouteSubscriptionTableColumnsName.CREATED_AT},
      ${RouteSubscriptionTableColumnsName.USER_ID},
      ${RouteSubscriptionTableColumnsName.PICKUP},
      ${RouteSubscriptionTableColumnsName.DESTINATION},
      ${RouteSubscriptionTableColumnsName.SEATS_LIMIT},
      ${RouteSubscriptionTableColumnsName.DATE_OF_JOURNEY}
		`);

	const { error, data } = await query;

	if (params.user_id !== undefined) {
		query = query.eq(RouteSubscriptionTableColumnsName.USER_ID, params.user_id);
	}

	if (error) {
		console.log(error);

		return null;
	} else {
		return data;
	}
};

export const addRouteSubscriptions = async (payload: RouteSubscriptionTableRequestParams): Promise<void> => {
	await supabase.from(RepositoryTables.ROUTE_SUBSCRIPTIONS).insert(payload);
};
