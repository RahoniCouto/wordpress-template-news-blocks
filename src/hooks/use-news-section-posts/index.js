import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';

const NEWS_SECTION_SLOT_COUNT = 4;

function normalizePostIds( postIds = [] ) {
	if ( ! Array.isArray( postIds ) ) {
		return [];
	}

	return [
		...new Set(
			postIds
				.map( ( postId ) => Number( postId ) || 0 )
				.filter( ( postId ) => postId > 0 )
		),
	];
}

function normalizeSlotPostIds( postIds = [] ) {
	const sourcePostIds = Array.isArray( postIds ) ? postIds : [];

	return Array.from(
		{ length: NEWS_SECTION_SLOT_COUNT },
		( _, index ) => Number( sourcePostIds[ index ] ) || 0
	);
}

export default function useNewsSectionPosts( {
	categoryId = 0,
	selectionMode = 'automatic',
	slotPostIds = [],
	excludePostIds = [],
} ) {
	const normalizedCategoryId = Number( categoryId ) || 0;

	const normalizedSelectionMode =
		selectionMode === 'manual' ? 'manual' : 'automatic';

	const normalizedSlotPostIds = useMemo(
		() => normalizeSlotPostIds( slotPostIds ),
		[ slotPostIds ]
	);

	const normalizedExcludedPostIds = useMemo(
		() => normalizePostIds( excludePostIds ),
		[ excludePostIds ]
	);

	const requestData = useMemo(
		() => ( {
			selectionMode: normalizedSelectionMode,
			categoryId: normalizedCategoryId,
			slotPostIds: normalizedSlotPostIds,
			excludedPostIds: normalizedExcludedPostIds,
		} ),
		[
			normalizedCategoryId,
			normalizedExcludedPostIds,
			normalizedSelectionMode,
			normalizedSlotPostIds,
		]
	);

	const [ resolution, setResolution ] = useState( {
		resolvedPostIds: [ 0, 0, 0, 0 ],
		isResolving: true,
		hasError: false,
	} );

	useEffect( () => {
		let isActive = true;

		setResolution( {
			resolvedPostIds: [ 0, 0, 0, 0 ],
			isResolving: true,
			hasError: false,
		} );

		apiFetch( {
			path: '/wtn-blocks/v1/news-section/resolve',
			method: 'POST',
			data: requestData,
		} )
			.then( ( response ) => {
				if ( ! isActive ) {
					return;
				}

				setResolution( {
					resolvedPostIds: normalizeSlotPostIds( response?.postIds ),
					isResolving: false,
					hasError: false,
				} );
			} )
			.catch( () => {
				if ( ! isActive ) {
					return;
				}

				setResolution( {
					resolvedPostIds: [ 0, 0, 0, 0 ],
					isResolving: false,
					hasError: true,
				} );
			} );

		return () => {
			isActive = false;
		};
	}, [ requestData ] );

	const resolvedPostIds = resolution.resolvedPostIds;

	const resolvedPostIdsForQuery = useMemo(
		() => normalizePostIds( resolvedPostIds ),
		[ resolvedPostIds ]
	);

	const postsQuery = useMemo( () => {
		if ( resolvedPostIdsForQuery.length === 0 ) {
			return null;
		}

		return {
			include: resolvedPostIdsForQuery,
			per_page: resolvedPostIdsForQuery.length,
			status: 'publish',
			orderby: 'include',
			_fields:
				'id,title,excerpt,meta,featured_media,status,categories,date,link',
		};
	}, [ resolvedPostIdsForQuery ] );

	const { resolvedPosts, isResolvingPostData } = useSelect(
		( select ) => {
			if ( ! postsQuery ) {
				return {
					resolvedPosts: [ null, null, null, null ],
					isResolvingPostData: false,
				};
			}

			const core = select( coreStore );

			const entityRecordsArgs = [ 'postType', 'post', postsQuery ];

			const posts = core.getEntityRecords( ...entityRecordsArgs ) || [];

			const postsById = new Map(
				posts.map( ( post ) => [ Number( post.id ), post ] )
			);

			return {
				resolvedPosts: resolvedPostIds.map( ( postId ) =>
					postId ? postsById.get( postId ) || null : null
				),
				isResolvingPostData: ! core.hasFinishedResolution(
					'getEntityRecords',
					entityRecordsArgs
				),
			};
		},
		[ postsQuery, resolvedPostIds ]
	);

	const slotSources = useMemo(
		() =>
			resolvedPostIds.map( ( resolvedPostId, slotIndex ) => {
				const configuredPostId =
					normalizedSlotPostIds[ slotIndex ] || 0;

				return configuredPostId > 0 &&
					configuredPostId === resolvedPostId
					? 'manual'
					: 'automatic';
			} ),
		[ normalizedSlotPostIds, resolvedPostIds ]
	);

	return {
		resolvedPostIds,
		resolvedPosts,
		slotSources,
		isResolving: resolution.isResolving || isResolvingPostData,
		hasError: resolution.hasError,
	};
}
